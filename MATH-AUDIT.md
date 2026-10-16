> Актуальный полный аудит: [16 октября 2026](docs/full-audit-2026-10-16.md). Ниже — история; старые коэффициенты могут быть заменены новыми исправлениями.

# Ревью математики — 12 октября 2026

Проверены расчёт характеристик, конверсии атрибутов, оба оружия, мастерство,
руны, комплекты, отдельное попадание, откаты, мана и взаимодействия ротации.
**Результат: ошибки найдены и исправлены; полное соответствие боевому движку RU
не подтверждено.** Успешные тесты проверяют формулы модели, не заменяют замер в игре.

## Исправления этого ревью

- Общая меткость, защита, уклонение, устойчивость и контроль теперь включены
  в итоговые характеристики соответствующих типов; общая строка удаляется,
  поэтому одно и то же значение не представлено как независимые прибавки.
- «Бронебойные болты» добавляют восстановление выносливости выбранного уровня
  (эпическое 4: 5,6; эпическое 5: 6), а не только дополнительный урон.
- Дневной «Дар небытия» повышает эффективность исцеления в боевом расчёте,
  включая множитель «Луча погибели». При эпическом 4 и исходном исцелении 0
  множитель луча увеличивается в 1,17 раза. Снижение исцеления «Славным
  возмездием» применяется также к дневной прибавке. Лист статов без времени
  суток остаётся независимым от этого условного бонуса; фактическая величина
  исцеления показана в результате прогона.
- Ночное сокращение отката проклинающих умений больше не затрагивает
  личный «Час преодоления», который является баффом, а не проклятием.
- «Неустанность» учитывает ожидаемые критические удары обеих рук, в том
  числе дополнительные 90 рейтинга «Амбидекстра» для второй руки. Это
  модель среднего числа событий; распределение случайных откатов не реализовано.
- «Смещение» ускоряет автоатаки своим бонусом скорости 20%, сохраняя
  отдельное табличное изменение интервала от ловкости.
- По тексту несовместимости «Жажды битвы» исключены сокращение отката луча
  этой пассивкой и продление ослаблений от попаданий луча. Обработка отдельной
  «Отрешённости» не приравнена к пассивке; её взаимодействие с лучом не подтверждено.
- Без оружия больше не появляется урон автоатак или умений от одних плоских прибавок.
- Общий рейтинг усиления по монстрам учитывается в generic-цели. Общие бонусы
  пяти видов из мастерства учитываются один раз, а не суммируются пять раз.
- В предупреждениях конкретной сборки видны неучтённые предметные эффекты,
  яд Бел’Адир и его участие во взрыве, ограничения комплектов и источники значений заточки +10/+11.

## Сверка источников

Публичные данные RUTL получены повторно 12.10.2026:
`builder-data/attributes.json`, `attribute-stats.json`, `stat-format.json`,
`skills.json`, `equipment.json`. Таблицы атрибутов и форматы совпали целиком.
Описание, уровни, мана, задержки и специализации совпали для остальных
импортированных умений, кроме намеренно заменённой RU-версии «Гнева природы».
Различия специализаций после исключения локальных путей иконок отсутствуют.
Экипировка совпала, кроме локальной RU-поправки Бел’Адир по скриншоту +12.
Совпадение с RUTL является проверкой импорта, не независимым подтверждением RU.

Рейтинги, защита 2500, бонусный урон и формула отката сопоставлены с
https://rutl.org/formuly/harakteristiki . Семь ранее сохранённых ответов
WTFOMG проверяют арифметику отдельного PvE-удара и порядок множителей.
Альтернативная формула сопротивления остаётся отдельным допущением.

## Что не позволяет подтвердить весь DPS

Яд Бел’Адир, воспламенение, текстовые эффекты предметов/комплектов и часть
ключевых узлов отсутствуют. Не заданы руны хаоса и стелларит. Касание
со специализацией использует средние дробные уровни вместо вероятностного
распределения. Промахи, устойчивость цели, вероятность ослаблений и
ответные атаки не моделируются; скорость применения и скрытые PvE-множители
не замерены в клиенте. «Гнев природы» остаётся RU эпическим 4 при остальных
активных умениях 5. Бел’Адир +10/+11 сверены с TL Build; в RU-клиенте напрямую подтверждён +12.

Остаётся нерешённым расхождение мудрости 70 в игре / 66 на присланном сайте:
без сохранённой полной сборки и всех игровых бонусов точная причина неизвестна.
Не следует добавлять искусственные +4, чтобы скрыть расхождение.

## Проверки

`npm test`: все 16 тестовых файлов пройдены, в том числе новый
`tests/math-review.mjs`: числовые контрпримеры дневного исцеления,
выносливости, общих характеристик, скорости, критов второй руки, несовместимости
луча, отсутствия оружия, предупреждений и независимой формулы попадания.
Root и dist синхронизированы. Версия модулей изменена для обновления кеша.

---

Далее сохранена история предыдущих проверок; текущий статус указан выше.

# Проверка взаимодействий — 28 сентября 2026

Проверка ограничена одной целью, 300 секундами и реализованными эффектами.
Она не подтверждает соответствие всего симулятора боевому движку RU.

## Исправленные ошибки

- Луч погибели: `effect()` уже выполняется после задержки попадания. Удалена повторная задержка из расписания тиков. Специализация сокращает длительность связи, а не время первоначального применения. Другие действия продолжаются во время связи.
- Множители конкретного умения теперь применяются до фиксированного дополнительного урона. Исправлены также автоатаки под Касанием скорби и разделение множителя урона / числа попаданий у Обстрела.
- Константа защиты по умолчанию 2500 вместо 2750, согласно [RUTL](https://rutl.org/formuly/harakteristiki). Сохранённые пользовательские параметры не перезаписываются. При нулевой защите изменения нет.
- Допустимая исходная панель участвует в сравнении как самостоятельный кандидат; полный поиск не может потерять её результат из-за первоначального перераспределения очков.
- Поиск хранит 12 лучших различных кандидатов и продолжает развивать альтернативы. Шесть независимо заданных стартовых конфигураций соединяют проклятия, продление, взрыв, личные усиления и арбалетные атаки. Это эвристика, не доказательство глобального максимума.
- При переборе усилений специализации всей пробуемой панели повторно проверяются на допустимость и бюджет.

## Воспроизводимые проверки

`node tests/interactions.mjs`

- Независимый числовой пример порядка множителей, защиты и плоской прибавки.
- Один Луч: 12 тиков; сконцентрированный — 6 удвоенных тиков; одинаковое время применения 1,7 с. При задержке 1,4 с первый тик по принятой модели происходит в 1,9 с.
- Попадания до баффа, внутри его длительности и после окончания сравниваются с теми же действиями без численного бонуса.
- Совместные Свет доблести и Час преодоления влияют на один удар через увеличение максимума оружия и рейтинг усиления умений соответственно.
- Аналитический пример: Касание (78 за тик), Круг (138 за тик), продление на 5 с. Взрыв оставшихся 14 тиков каждого эффекта при одном уровне: `(78 + 138) × 14 × 1,05`. Сохранение проклятий делит взрыв пополам и оставляет обычные тики.
- Контрольные панели повторно воспроизводят заявленный DPS; результат поиска не хуже каждой из них и допустимой исходной панели. Расход очков не превышает 100.

Числовой контроль использует SCREENSHOT, ночь и пассивные Жажда битвы / Потусторонний зов / Дар небытия. Это искусственно собранная панель, не экспорт текущего персонажа пользователя. Получено: исходная 5365,16; лучшая контрольная 5788,98; поиск 6436,71 DPS (20 итераций). Отключение численных бонусов Света и личного Часа при тех же приоритетах: 6225,88 DPS. Эти значения характеризуют только текущую модель.

## Нерешённые вопросы

- Глубокая скорбь использует средние 1,5 уровня вместо распределения целочисленных уровней. Для порогов взрыва такое приближение неточно.
- Воспламенение Гнева природы не реализовано, поэтому его урон, участие во взрыве и ослабления отсутствуют.
- Сфера действия несовместимости Жажды битвы и Луча не подтверждена. Общие обработчики пока продлевают ослабления от попаданий луча и сокращают его откат; это может завышать результат.
- Время блокировки действий Ритуальным кругом (4 с) взято из каталога; отдельное время Перста угасания не известно. У Злого рока расходятся `cooldownSec` (63 с) и последний уровень текста (42 с). Без подтверждения числа не заменены.
- Текущий импорт каталога указывает +1 с для длительности Света; актуальность относительно патча RU требует отдельной сверки.
- Не подтверждены все взаимодействия метки, двойных попаданий и взрыва. Автоатаки разрешаются только в паузах. Уровень всех умений не настраивается.
- Не реализованы условные эффекты комплектов, часть условных эффектов мастерства и предметов. Тесты не устраняют эти ограничения.

В интерфейсе контрольные панели показывают фактические специализации. Вклад баффов в таблице урона относится к усиленным атакам, а не отдельной строке баффа. Сравнение без численных бонусов не равно удалению кнопок: оно не освобождает время применения.

## Внешняя числовая сверка — 29 сентября 2026

Получены реальные ответы публичного расчётного endpoint WTFOMG `/calculate` на семь синтетических примеров в режиме PvE. Запросы и ответы сохранены в `tests/fixtures/wtfomg-2026-09-29.json`, проверка: `node tests/external-formulas.mjs`.

При диапазоне 100–200 и навыке 200% + 50:

| Проверка | Fury после исправлений | WTFOMG |
|---|---:|---:|
| Без модификаторов | 350 | 350 |
| Усиление умений 1000 | 525 | 525 |
| Крит 1000, критический урон 20% | 445 | 445 |
| Мощная атака 1000, бонус 25 | 550 | 550 |
| Особый множитель ×2, бонус 25 | 725 | 725 |
| Защита 2500 | 175 | 175 |
| Усиление 500, сопротивление 300 | 326,6667 | 327 |

Прежняя опубликованная константа защиты 2750 давала в шестом примере 183,3333. Прежнее применение множителя ×2 снаружи функции попадания давало в пятом примере 750, умножая также бонус 25.

Статья [Rabubu29](https://www.reddit.com/r/throneandliberty/comments/1k2cgcp/how_does_our_stats_impact_our_skills_a_very_long/) получена полностью. Она описывает иной способ совместного учёта усиления и сопротивления: через знаковую разность рейтингов. Это расходится с RUTL и полученными ответами WTFOMG в PvE. Поэтому основная модель сохранена, а в интерфейс добавлена именованная альтернатива для проверки чувствительности. Она не объявлена подтверждённой для RU.

В комментариях автор описывает криты DoT как бонус критического урона без замены среднего диапазона максимальным. Наш переключатель DoT уже поддерживал такой расчёт; добавлен числовой тест. Сохранённое состояние переключателя не меняется. Автор отдельно указывает, что точная механика Curse Explosion ещё требует исследований. Старые корейские результаты Syanoe (2024) не перенесены в текущие коэффициенты RU.

Внешняя сверка проверяет отдельный удар, а не полную ротацию, скрытые PvE-бонусы всех навыков или предметные эффекты.

## Автоматические характеристики — 1 октября 2026

База уровня 55: HP 6675, MP 5550, из таблицы уровней клиента в [TL Codex](https://tlcodex.com/en/gearbuild/934/) (ID характеристик 163 и 166). Это источник базы клиента, не отдельная проверка на персонаже RU без экипировки. Старые ручные baseHp/baseMana/mastery игнорируются. Общий список показывает итоговые постоянные характеристики, а не только прибавки экипировки. Числовые бонусы комплектов включены по порогу числа разных предметов; условные пассивные эффекты комплектов остаются за пределами модели.

Проверки: базовые HP/MP, игнорирование старых переопределений, влияние настоящего дерева, пороги комплектов и отсутствие повторения бонуса, единицы рейтингов/процентов, равенство суммы источников итогам.

Скриншоты персонажа показывают 16613 HP / 12523 MP и итоговые боевые рейтинги, но не полную конфигурацию предметов, трейтов, рун и мастерства. Автоматическая сборка по этим скриншотам не воспроизведена; сохранённый SCREENSHOT — ручной набор измеренных итогов для моделирования боя, не доказательство соответствия автоматического калькулятора игре. Для такой проверки необходим экспорт сборки и состояние баффов.


## Уровни пассивок и постоянные связки мастерства — 2 октября 2026

По RU-скриншотам: эпический «Амбидекстр» 4 даёт +38 максимального урона парного оружия; «Славное возрождение» 4 — 2,93% исцеления за 1000 максимальной маны. Добавлены сохраняемые уровни эпических пассивок 1–5. Старые сохранения используют прежний уровень 5, пока пользователь не выберет фактический уровень.

«Славное возмездие» при наличии связанной пассивки даёт 25% от её исходной прибавки исцеления в виде процента базового урона. При 12316 маны: 2,93 × 12,316 × 0,25 = 9,02147%. Процент применяется один раз к итоговым диапазонам обеих рук и жезла; прибавка округляется вниз, как в текущем исходном коде RUTL. Общая эффективность исцеления уменьшается на 30% согласно предоставленному RU-описанию. Код RUTL уменьшает только вклад пассивки; здесь приоритет имеет текст RU на скриншоте.

«Выгодный момент» меняет максимум второй руки на +30 и шанс парной атаки на −4 процентных пункта только если узел действительно открыт и выбран «Амбидекстр». Сохранённый флаг узла не может обойти порог. Возвращён лимит двух бесплатных ключевых узлов на кольце, подтверждённый текущим кодом RUTL и счётчиком 1/2–2/2 на RU-скриншотах. В подробностях узла показываются очки всех четырёх секторов. 1/2 означает количество открытых ключевых узлов на кольце, а не два условия одного узла.

Уровень также читается для реализованных коэффициентов Жажды битвы, Потустороннего зова, Кровавого пакта, ночного Дара небытия, Бронебойных болтов и дополнительного урона Адаптации. Упадок включён в лист характеристик. Не реализованные условные эффекты остаются в ограничениях.

Данные заточки «Лунных серпов» +11 и «Восхваления Ханзайзина» +12 совпали с текущим equipment.json RUTL; таблицы не подгонялись под итоговый урон персонажа. Полная сборка из пользовательского браузера не экспортирована. Эти исправления и тесты не доказывают совпадение всех характеристик с RU: руны хаоса, стелларит, эффекты дня/ночи и другие не реализованные бонусы требуют отдельной сверки. Для пользовательского «Выгодного момента» в игре показано 10 очков атаки, но прежний скриншот сайта не даёт однозначно восстановить ту же конфигурацию; автоматическая модель использует категории и формы исходных данных RUTL.

Проверки: tests/passive-sheet.mjs — независимые числовые примеры уровней 4/5, 9,02147%, исцеление ×0,7, отключённые связки, +38 и условные +30/−4, две бесплатные синергии, +198 ослабления, сумма источников. Все ранее существовавшие проверки также пройдены.


### RU correction: Бел’Адир +12

`crossbow_aa_t2_polymorph_001` supports +12 in the user's RU T2 client.
The upstream catalogue incorrectly caps it at +9 and contains only off-hand
weapon scaling at +10..12. The local override restores both hands using
the existing Epic weapon curve and extends DEX, stamina regeneration and
damage-reduction penetration using their existing +1..9 curves. These
extra-stat values at +10..12 are inferred and still need client verification.
At +12 the unmodified weapon ranges are 31–127 main / 44–166 off-hand;
DEX is 11, stamina regeneration raw 8600, penetration 22.
The override also runs during `prepare-data.py` imports.


### Exact RU Бел’Адир +12 tooltip (2026-10-03)

The user supplied a +12 weapon tooltip: main 35–148, off-hand 44–166,
DEX 13, stamina regeneration 8.65 and penetration 22. These replace the
previous inferred +12 main-hand / DEX / stamina values. +10 and +11 still
use extrapolation and require client verification. The screenshots also
show WIS 70 in game versus 66 on the site; the complete build and chaos
rune values are not provided, so that difference is not patched by guessing.


# TL Build comparison — 12 October 2026

Live comparison via https://tl-build.ru/calculator and https://tl-build.ru/builder.
No public build was submitted. Web search returned cached v1.3; the live UI
was v2.0. The calculator is a stat/chance tool, not a 300-second DPS simulator.

## Matching formulas

Defence K=2500; crit/heavy K=1000 after opposing rating; cooldown
`1 / (1 + speed/100)`. Fury currently assumes zero enemy evasion/endurance/
heavy avoidance, so it matches chance calculation only in that limit.
TL Build separately describes healing crit K=6000 and heavy healing K=3000;
Fury does not simulate direct healing skills, so these were not equated to DPS.

## Confirmed Bellandir data correction

| Enhancement | TL Build / corrected Fury range | DEX | Stamina regeneration |
|---|---|---|---|
| +1 | 24–104 | 7 | 3.15 |
| +9 | 32–136 | 11 | 7.15 |
| +10 | 33–140 | 12 | 7.65 |
| +11 | 34–144 | 12 | 8.15 |
| +12 | 35–148 | 13 | 8.65 |

+12 also matches the user's RU screenshot, including off-hand 44–166 and
bonus damage 22. The earlier +12-only override concealed wrong base values
at other levels. Main-hand base is now 79 spread / 23 base bonus, DEX 7,
stamina raw 2650; normal enhancement curves produce all five independently
observed cases. This supersedes the prior +10/+11 extrapolation and old base
62/19, DEX 5 and stamina 2600. Reference: tests/fixtures/tl-build-2026-10-12.json.

## Unresolved differences — no silent formula replacement

At STR 41 without gear TL Build spent 44 out of 54 points (10 left);
Fury spent 42. TL Build UI uses 20 invested points at cost 1, next 10 at
cost 2, then cost 4. Fury uses 20 / 20 / rest. Need a RU-client allocation
screenshot at this boundary before choosing which pricing rule is current.

At SDB=1000 / SDR=700 the TL Build stat calculator reports 50% and 50%,
with displayed net +0%. Fury's RUTL/WTFOMG PvE model yields ×0.75:
`(1 + 1000/2000) * (1 - 700/1400)`. TL Build displays a difference of two
percentages, not a full damage sample; converting net +0% to a final ×1
is an interpretation. Neither that interpretation nor changing to it is
independently confirmed in RU. The existing signed-rating alternative is
a third formula, not the same as TL Build's percentage subtraction.

TL Build exposes item resonance and common weapon-mastery unlocks and
artifact slots, which Fury does not model. These can contribute to
character-stat differences. No matching full user build was available,
so this comparison does not validate the earlier WIS 70 vs 66 mismatch.


## RU October 6, 2026 patch (implemented October 14)

Sources: [official RU patch](https://throneandliberty.ru/news/103-opisanie-oktyabrskogo-obnovleniya), and TL Build's six RU-client earring records, served by `/api/equipment` and its October data module. The original snapshot and exact applied skill fields are preserved in `docs/ru-october-earrings.json` and `docs/ru-october-skills.json`. These are the six RU release items, without later global upgrades.

- One earring slot; enhancement +12, three ordinary traits with four actual ranks, three level-80 runes and synergy. No invented resonance pool for earrings.
- Directional ratings remain separate on the sheet; the chosen combat direction activates only matching ratings. Boss-only rune ratings/bonus damage activate only against bosses.
- Back attacks add three percentage points to hit/critical probability (capped at 100%), our interpretation of the official 3% wording. Directional heavy chance does not receive this baseline bonus.
- Ghost Walk Adaptation chooses a direction by expected hit damage per weapon while its buff is active; it does not grant all three directions together or remain active after expiry. Assumes equal target defenses by direction until provided separately.
- Decay gains its 200% direct hit from side/back; Weak Point's conditional crit-damage buff gains 3 points when applied from side/back; Blood Pact healing gains 10%. Akman projectiles require Ghost Walk.
- DEX 80 milestone grants +9 bonus damage, replacing stale +18. Existing weapon, Nature and Curse Burst user-confirmed values are preserved.

Remaining scope: the shield's new specialization describes defensive directional ratings; incoming DPS is already post-mitigation, so these ratings must not reduce that input again. Repeated Swift Healing actions are not yet modelled as a complete healing rotation; its updated description alone is not a claim that healing chains are verified.

Validation: all 21 test files pass; October regression checks cover hand-calculated +12 earring totals, actual trait ranks, directional activation, boss rune gating, best direction and expiry, Decay damage and the 80 DEX milestone.


## Correction: cooldown sources, October 16, 2026

The previous Battle Thirst / Bloodlust cooldown model is superseded. RUTL's `WP_CR_CR_S_WeakenAttackBonus` description/progression duplicates Selfless Diffusion's effect. The current RU TL Build skill table (`https://tl-build.ru/data/skills.json`, retrieved October 16) defines Bloodlust as a self buff: +5 skill damage boost per stack (Epic 5), at most one stack per attack skill cast; ten stacks grant +12.3% critical damage for a fixed three seconds without refreshing. The mastery node's “one Bloodlust level with 5% probability” agrees with that buff definition. This is the source interpretation used for the correction; user observation is a check, not a fitted target.

- Removed permanent cooldown reduction and weaken-duration extension from Bloodlust.
- Removed `weaken(hits*.05)`: its positional argument selected a stack tier, leaving applications=1, which falsely granted a guaranteed cooldown reduction on every basic attack. The mastery now grants probabilistic self-buff stacks and a three-second attack-speed proc, without creating an enemy weaken.
- Only active Selfless Diffusion grants .36/.072-second weaken reductions and .05-second weaken extension per hit. It cannot reduce its own cooldown. Its .36-second progression is a proc coefficient, never its own 36-second cooldown.
- Haste uses `base / (1 + haste/100)`. Burst's specialization and night modifier apply before haste. No minimum 8–9-second interval was added.
- Every implemented direct cooldown reduction, including defensive Chaos Shield, now goes through the cooldown ledger.

Controlled diagnostic, not the user's exported build: Burst 21−6 seconds, night 10%, haste 43.8% gives 9.388 seconds before temporary reductions. With Bellandir/Tevent, Nature fire, basic mastery and the same fixed stats, the Ghost-on median cast interval changed from 7.00 to 9.40 seconds; shortest 5.95 to 7.80 seconds. Without Ghost, reductions are empty, and no cast starts earlier than the calculated cooldown. Other builds may have different legal intervals.

Validation adds explicit tests for the haste formula, Ghost's own cooldown, Bloodlust cap expiry, one stack per skill cast, no passive cooldown reductions/curse extension, probabilistic basic mastery, and reductions limited to Ghost.
