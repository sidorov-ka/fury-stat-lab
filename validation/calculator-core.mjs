/**
 * Formula-neutral verification helpers for Fury Stat Lab.
 * These utilities do NOT assert Throne and Liberty damage formulas.
 * The host calculator must supply evaluated damage events and its own stat evaluator.
 */
export function sumDamage(events) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  const bySource = {};
  let total = 0;
  for (const event of events) {
    if (!event || typeof event.source !== "string" || !event.source.trim()) throw new TypeError("each event needs a source");
    if (!Number.isFinite(event.damage) || event.damage < 0) throw new RangeError("damage must be finite and nonnegative");
    total += event.damage;
    bySource[event.source] = (bySource[event.source] ?? 0) + event.damage;
  }
  return { total, bySource };
}

/** Compare one stat perturbation while preserving all other stat values. */
export function sensitivity({ stats, stat, delta, evaluate }) {
  if (typeof evaluate !== "function") throw new TypeError("evaluate must be a function");
  if (!stats || !Number.isFinite(stats[stat]) || !Number.isFinite(delta) || delta === 0) throw new RangeError("invalid stat or delta");
  const original = Object.freeze({ ...stats });
  const baseline = evaluate(original);
  const modified = evaluate(Object.freeze({ ...original, [stat]: original[stat] + delta }));
  for (const value of [baseline, modified]) if (!Number.isFinite(value) || value < 0) throw new RangeError("evaluation returned invalid damage");
  return { stat, delta, baseline, modified, gain: modified - baseline, gainPercent: baseline ? (modified / baseline - 1) * 100 : null };
}

/**
 * Separates pre-explosion registered damage from the explosion event.
 * The caller determines which event categories the mark registers;
 * this helper deliberately does not assume all damage qualifies.
 */
export function summarizeMark({ events, qualifies, explosion }) {
  if (typeof qualifies !== "function") throw new TypeError("qualifies must be a function");
  if (!Number.isFinite(explosion) || explosion < 0) throw new RangeError("invalid explosion");
  const recorded = sumDamage(events.filter(qualifies)).total;
  return { recorded, explosion, combined: recorded + explosion };
}

/**
 * Experimental rule for cooldown reduction on successful Weaken application.
 * Values and stacking interpretation MUST be validated against game evidence.
 */
export function applyWeakenCdr({ remaining, stacksAfter, singleReduction = 0.36, multipleReduction = 0.072, eligible = true }) {
  if (![remaining, stacksAfter, singleReduction, multipleReduction].every(Number.isFinite) || remaining < 0 || stacksAfter < 0 || singleReduction < 0 || multipleReduction < 0) throw new RangeError("invalid cooldown parameters");
  if (!eligible || stacksAfter === 0) return remaining;
  return Math.max(0, remaining - (stacksAfter === 1 ? singleReduction : multipleReduction));
}
