/**
 * Damage attribution. Every actual damage event belongs to exactly one category.
 * crit/heavy/offhand are modifiers/tags, not parallel damage categories.
 * Never count a mark's recorded input again as damage at explosion time.
 */
export const DAMAGE_TYPES = Object.freeze({
  magic_dot: "Магический периодический",
  magic_direct: "Магический прямой",
  ranged: "Дальнобойный",
  weapon_proc: "Эффект оружия",
  mark_explosion: "Взрыв метки",
  other: "Прочий"
});

export function damageBreakdown(events, durationSeconds) {
  if (!Array.isArray(events) || !Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new RangeError("Provide events and positive durationSeconds");
  const totals = Object.fromEntries(Object.keys(DAMAGE_TYPES).map(key => [key, 0]));
  const sources = {};
  let total = 0;
  for (const event of events) {
    if (!event || typeof event.source !== "string" || !event.source.trim())
      throw new TypeError("Each event must identify its skill/source");
    if (!Object.hasOwn(DAMAGE_TYPES, event.damageType))
      throw new TypeError("Unknown damageType: " + event.damageType);
    if (!Number.isFinite(event.damage) || event.damage < 0)
      throw new RangeError("Damage must be nonnegative and finite");
    if (event.isBookkeeping === true) continue; // recorded value, not actual damage
    total += event.damage;
    totals[event.damageType] += event.damage;
    const source = sources[event.source] ??= { total: 0, byType: {} };
    source.total += event.damage;
    source.byType[event.damageType] = (source.byType[event.damageType] ?? 0) + event.damage;
  }
  const byType = Object.entries(totals).map(([type,damage]) => ({
    type, label: DAMAGE_TYPES[type], damage, dps:damage/durationSeconds,
    sharePercent:total === 0 ? 0 : damage/total*100
  }));
  const bySource = Object.entries(sources).map(([name,entry])=>({
    source:name, damage:entry.total, dps:entry.total/durationSeconds,
    sharePercent:total === 0 ? 0 : entry.total/total*100,
    byType:entry.byType
  })).sort((a,b)=>b.damage-a.damage);
  return { totalDamage:total, totalDps:total/durationSeconds, durationSeconds, byType, bySource };
}
