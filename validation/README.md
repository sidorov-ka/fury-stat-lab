# Fury Stat Lab — validation foundation

Status: **isolated test harness**, not connected to the production calculator. On the inspected GitHub master branch only `README.md` and `LICENSE` were available; the deployed app's actual calculation engine was not accessible.

## Run

```bash
node --test validation/calculator-core.test.mjs
```

## Scope

- Verify damage totals by source, without accidental duplication.
- Compare a single stat change against an unchanged baseline.
- Separate Mark's recorded damage from the final explosion.
- Hold an *experimental, configurable* Weaken cooldown rule (0.36 / 0.072 s based on provided screenshot), not a confirmed game formula.

## Must verify before connecting the real engine

1. Find the live app's source and actual deployment branch; snapshot a representative character/build and its results.
2. Trace the real formulas for hit, crit, heavy attack and boss defenses separately for magic/ranged damage.
3. Define each curse tick, mark recording eligibility, explosion and weapon effect using evidence from combat logs/tests.
4. Check Selfless Diffusion triggers, stack semantics, per-second trigger limits, excluded cooldowns and buff extension.
5. Verify mastery bonuses, passives, off-hand effects, mana costs and tooltips against the current game version.
6. Add golden tests using independently captured in-game observations before changing production formulas.
7. Only then attach the sensitivity evaluator to the UI and revalidate the rotation optimizer.

Do not treat the sample test numbers as game coefficients. Never deploy this module as a replacement for existing game formulas without integration tests.
