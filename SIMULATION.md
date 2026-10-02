# Fury Lab: experimental 300-second model

## Self-buff correction, 25 September 2026

Live RUTL skills JSON and the catalog agree: Decay trait 1 grants +80 skill damage boost to an ally (modeled on self); trait 3 retains the base enemy resistance debuff against a monster. Base Defensive Light is defensive; trait 1 grants +50 maximum damage. Earlier conversational instructions exchanged these effects incorrectly.

Self boost has a separate timer: no curse counting, Weaken proc, or extension by attacks/curse spread. Base Decay reduces skill resistance independently of SDB, using K=700 and a zero floor. Negative resistance is unconfirmed and disclosed. The self version's +3-second specialization extension is editable because its tooltip refers to curses. Light activates after effect delay and expires; its maximum bonus precedes critical evaluation. Inherited opening amplification on the damage version is unconfirmed, defaults to 1 and is editable. Directed Light disables it. Rotation labels distinguish self/enemy; effect events record onset/expiry/magnitude.

Joint search excludes unknown effects and minimizes utility/defensive point cost before comparing DPS, retaining useful resource traits. Exactly 100 points are required; unavoidable utility points are reported. This minimum is per candidate panel, not a proof over all possible builds. Roles are shown in the editor/results. Fire Nature is excluded from automatic selection until burning is supported, but remains manually selectable with warnings. Tests cover timing, expiry, one-target group effects, resistance, self buff isolation, exact budgets and useful-point preference.

The UI explicitly labels all output as expected damage in an uncalibrated model, not measured RU DPS or a global optimum. Do not remove that distinction until validated with RU logs.

## Sources and scope

- Local `dist/catalog.json`: RUTL snapshot 2026-09-24, Russian skill descriptions, coefficients, mana, cooldowns, cast and hit-delay data. Descriptions are the source for explicit per-ID implementations, not runtime regex extraction.
- Community formula reference: https://www.reddit.com/r/throneandliberty/comments/1k2cgcp/ ; comparative notes at https://github.com/sunsetroute1/tl-helper/blob/master/docs/pvp-formula-research-2026-07-11.md . Constants remain adjustable because RU patch equivalence is unverified.
- User screenshots: wand damage166–491; crossbow87–400, offhand71–376, interval .340, offhand chance32.8% (before the uncommitted red preview), ranged/magic crit 1371.2/1437.2, heavy 337/409, SDB130.5, bonus25, crit damage9%, cooldown43.8%, speed27.66%, mana12523, regen661.75, efficiency41.51%, HP16613, buff duration33.25%. The red comparison values are an uncommitted preview and are not mixed into the preset.

## Execution

`simulator.js` is a pure model. `sim-worker.js` executes optimization off the UI thread; `sim-ui.js` owns inputs/results. 6000 ticks of 0.05s cover [0,300). Skill actions cannot overlap, but previously scheduled projectiles/DoTs can. All procs use deterministic expected values; fractional stacks and expected cooldown reductions are approximations. Inputs/results are not persisted.

Selected-panel search preserves skills and specializations, and mutates priorities and the explosion stack threshold. Joint search evaluates 12 active skills, supported specialization subsets and priorities. A multiple-choice exact-budget DP repairs each candidate to exactly 100 points, including fixed passive/defensive allocations. Known alternative replacements (Buck Shot and Time for Punishment) are mutually exclusive; Nature uses one element because cycling is not modeled. Unsupported specialization effects are excluded from automatic selection. Some selected utility effects have no DPS impact on this target; the UI states this rather than inventing damage. Search retains its best evaluated feasible candidate and is seeded/reproducible; it is not exhaustive/global optimization. Original-panel DPS is a comparison baseline and can exceed a constrained search result. Returned specialization snapshots reproduce the run and are applied with the panel.

## Limitations retained in UI

- No rune, mastery, set or item special proc implementation. Build conversion uses catalogue base level50; manual character-sheet mode is preferred at55.
- No evasion, resistance, block, control immunity, target movement or damage received; weaken applications assumed successful. Target defense is editable.
- Passive and defensive selections are fixed; joint mode searches supported active specializations. Unsupported skills excluded; unsupported specialization effects listed explicitly. Nature is corrected from the user-provided RU Epic4 tooltip: toggle,23 mana/projectile,disable below10%; fire/wind21%,cold28%,lightning30% plus14.5% chance of120%. Fire burning coefficients and interactions are missing and explicitly excluded. Wind/cold secondary effects are also excluded.
- Autoattacks only in idle windows; offhand has its own min/max range, with a main-range fallback only when unavailable; barrage uses32 base projectiles with up to48 expected. Cast durations/locks need empirical calibration.
- DoT crit is an optional hypothesis, off by default. Expected remaining curse damage is exploded once, without applying a second critical/heavy multiplier; preservation halves that explosion and retains ticks.
- Curse stacks, weaken CDR and multiple-hit proc rules are approximations. Buff/DoT snapshot semantics and server rounding not reproduced.
- Mana regen is smooth with an editable period (default10s). Health cost stops Blood to Soul when unaffordable; Vampiric Contract heals. No regeneration/potions or other healing actions.
- Manual inputs already include static passive stats. Builder mode adds the supported constant bonus internally. Do not add the same static passive twice.

Run `node tests/simulator.mjs`. Assertions cover analytic auto/crit/heavy/defense cases,9 curse ticks, curse consumption/preservation, no double multiplier on exploded damage, mana gating, action non-overlap, damage reconciliation, specialization impact, determinism and non-decreasing optimizer output.

## RU correction regression checks

Nature activates before combat and remains active indefinitely, consuming literal23 tooltip mana per modeled projectile (no second efficiency discount). It stops below10%; reactivation at25% is a disclosed rotation policy. Fractional offhand funding is an expected-value approximation. Multi-element cycling is not searched: the first selected element in tooltip order is used. Only fire charge damage is confirmed; burning DPS is explicitly flagged incomplete. Attributes are allocated from the level 55 point budget; equipment, runes and mastery bonuses are added automatically. Selected-panel optimization preserves all supported selected IDs. Tests cover full uptime, exact mana cutoff, independent offhand damage and no double-counted attributes.
# Мастерство T2: два дерева

Данные узлов, 10 уровней числовых эффектов, координаты и связи взяты из `https://rutl.org/builder-data/skill-mastery-v2.json` (снимок 25.09.2026). Включены CR и WA_GR, по 52 узла; иконки хранятся локально. Правила доступа сверены с публичным билдером RUTL: 30 очков предыдущего кольца, 20 очков сектора для синергии, автоматическая активация ключевых узлов без расхода очков, эпические узлы при 80/120 очках и наличии синергии сектора. Лимит 200 на дерево, обычные узлы до 10, ключевые узлы включаются и выключаются по условиям, без ручного распределения очков.

Суммируются числовые строки выбранного уровня обоих деревьев, включая отрицательные эффекты. Прибавки мастерства входят в итоговые атрибуты до конверсии. Процент урона дальнего боя хранится в сотых долях процента в источнике. Повышение урона всех пяти видов монстров учитывается один раз для одной цели. Защитные характеристики видны в прибавках, но не дают DPS по манекену. Условные эффекты узлов без числовых строк не моделируются и перечисляются в предупреждениях; общие пассивные умения мастерства пока отсутствуют.

Старые ручные прибавки не участвуют в расчёте. Симулятор всегда получает характеристики из сборки; постоянные пассивные бонусы учитываются один раз. Оптимизатор дерево не изменяет.
# Сверка характеристик: 25.09.2026

Скорость атаки из таблицы ловкости больше не складывается с процентной скоростью. Как в публичном RUTL builder.js: из базового интервала вычитается разность табличных значений ловкости относительно 10, переведённая в проценты и умноженная на 0,0067 секунды; затем результат делится на (1 + процент скорости / 100). Минимум базового интервала после вычитания — 0,001 секунды.

База уровня 55 фиксирована: 6675 HP и 5550 MP. Ручного ввода базы нет. Таблица источников показывает последовательные разности полного расчёта: база с 10 атрибутами, атрибуты, экипировка, руны, комплекты, мастерство, пассивные. Сумма столбцов воспроизводит итог, включая нелинейное изменение интервала и открытие порогов атрибутов.
# Руны — обновление 28 сентября 2026

Данные: `https://rutl.org/builder-data/runes.json`; доступность ячеек каждого предмета сверена с `equipment.json`. Поддерживаются обычные руны атаки, защиты и поддержки четырёх качеств, уровни до 20/40/60/80. Значения берутся из кривых и нормализуются по алгоритму RUTL; отдельное базовое значение повторно не прибавляется. Синергия требует три заполненные ячейки, использует порядок цветов и минимальное качество. Руны хаоса пока исключены.

Руны сохраняются внутри предмета. Их характеристики и прибавки к атрибутам добавляются в расчёт сборки автоматически. Итоги сборки используются в симуляции. Редактируются только условия боя и допущения модели; старые сохранённые ручные характеристики симуляции игнорируются. Защитные, PvP и специфичные для босса эффекты не превращаются в урон по обычному манекену. В таблице источников есть отдельный столбец «Руны».

Автоподбор теперь использует не более 100 очков и до 12 активных умений. Utility и defensive не предлагаются для активных умений; выбранные пассивные/защитные сохраняются. После поиска повторные прогоны удаляют действия и специализации без прироста урона. Это эвристический поиск, не доказательство глобального максимума.
