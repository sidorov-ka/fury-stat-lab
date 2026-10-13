# RU T2 calculation audit — 2026-10-13

This is an expected single-target, 300-second model. Matching character statistics and matching combat DPS are separate checks. No multiplier is chosen to match an Aragon or user screenshot result.

## Sources and interpretation

- RUTL formulas: https://rutl.org/formuly/harakteristiki — rating minus opposing rating, critical/max base damage, glancing/min base damage, heavy attacks, separate skill amplification/resistance factors, defense constant 2500, bonus damage per direct hit, reciprocal cooldown haste. Healing uses critical constant 6000 and skill-amplification constant 3000.
- Live RU skill data: https://rutl.org/builder-data/skills.json — read 2026-10-13, RU descriptions/progression; the stored catalog remains the source for equipment, mastery and specializations.
- TL Build: https://tl-build.ru/builder — Bellandir's RU tooltip compared with the retained catalog; the external formula fixtures live in tests/fixtures. A tooltip match does not establish identical simulated rotations.
- Aragon Fury guide, 2025-09-04: secondary interaction reference only. Global coefficients/PvE multipliers are not copied into RU T2.

## Implemented corrections

- Critical DoTs use the average base range with critical-damage scaling; they do not receive fixed bonus damage. Applying a DoT checks hit/application probability; subsequent ticks do not reroll accuracy. Residual Curse Burst damage is not critically/heavily multiplied a second time.
- Quick Fire's critical specialization reduces remaining cooldown per bolt; optional offhand attempts use independent critical probability. Haste is reciprocal, not a direct percentage subtraction.
- Nimble Leap occupies an action for 1 second by default, independent of attack-speed haste. Its reset/buff happens after the movement; the second-charge specialization replenishes charges.
- The retained Circle field can apply its curse again after Curse Burst consumes it. Burning/poison/curse residual damage is attributed to its source.
- Numeric equipment, attributes, selected trait ranks, rune-80 properties, eligible fourth resonance, set thresholds and paid mastery contributions enter one build-derived character sheet. Fight assumptions cannot replace its stats. Conditional sets use configured distance and health.
- Wand mastery: curse duration, periodic damage, Black Magic, Abyssal Burst, Vampiric Onslaught, Full Corruption conversion, Selfless Soul conversion, day/night conversion and healing/cooldown nodes. Crossbow conditional accuracy is separate from critical rating. Tactical Advantage boosts accuracy; Focused Fire requires Armor-Piercing Bolts. Survival healing requires Weaken Accuracy, not Armor-Piercing Bolts.
- General mastery: standing poison, moving lightning, attack/control delayed damage, successful-block shockwave, kill cooldown with a 20-second internal cooldown, low-health healing area and temporary shield. Conditions default to inactive unless the fight supplies them.
- Crossbow/wand autoattack choice is explicit. Wand basic hits can apply Corrupting Hit curses; ordinary crossbow autoattacks do not inherit wand's basic-hit proc.
- Search retains legal input/control builds, enforces at most 12 skills and 100 specialization points, and reproduces its result with the same simulator. Identical trials are cached within that search only; no probabilistic formula changes for speed.

## Remaining assumptions (visible in calculation details where relevant)

- The RU movement record has zero castTime; the 1-second leap animation is the user's observation translated into an editable default, not an instrumented measurement. Other cast/hit delays come from RU records.
- Bellandir refresh retains tick phase. ProcDot keeps discrete probability branches, stack caps and refresh expiry. Very small branches below 1e-12 are discarded into the empty branch.
- Deep Sorrow uses an expected 1.5 added stacks; rotation thresholds act on expected stacks. Temporary fractional buff stacks use their duration window, not a guaranteed maximum.
- Paid text-only mastery coefficients use proportional rank scaling where the source lacks a per-rank table.
- Dark Covenant uses Holy Vow's level-specific numerical value for converted skill-boost rating and periodic percentage. It requires incoming skill attacks. Its exact conversion units need a client measurement.
- Dark Apostle uses the corresponding heal's coefficient when no separate transformed RU coefficient exists. Its Clay replacement uses Life Fountain's 90% +82 per-second coefficient. Vitalism uses the same coefficient for its otherwise unspecified healing area.
- Corrupting Hit's three possible curses are equally probable. Its intermittent resistance debuff is represented by expected duration. Low-probability buffs and curse stack decisions are expectations rather than stochastic encounter replays.
- Input incoming DPS is already mitigated. Successful fury-block frequency is supplied; counterattack animation/stamina and a full enemy AI are outside the encounter model. Movement, range, target health and blessing conditions are fixed for the fight.
- Defensive/utility statistics remain in the character sheet even when they have no effect on a stationary, no-incoming-damage DPS trial. Group cleaves, reward bonuses and movement do not add fictitious single-target damage.

## Validation

`npm test` covers 20 suites, including seven external fixed formula fixtures, damage conservation, no double counting, passive levels, three selected trait levels versus maximum, rune/resonance eligibility, legal mastery normalization, set threshold removal, deterministic optimization replay and retention of the input build. New T2 integration checks isolate Abyssal Burst, Black Magic and Vampiric Onslaught using a legal paid mastery tree. These checks establish internal/source consistency, not an exact in-game encounter match.
