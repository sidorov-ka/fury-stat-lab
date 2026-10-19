# Conditional rotation windows — 2026-10-19

The original priority search remains the incumbent. A final whole-fight comparison evaluates conditional mark windows: rapid/burst order, optional light/Hours/Diffusion setup, and a maximum wait of 0, 0.35, 0.7 or 1.2 seconds for an explosive mark. Autoattacks continue while deliberately waiting. Fillers must finish before the mark is ready. Live marks are tested against actual attack impact times.

Every candidate runs the unchanged 300-second combat model, including costs, animations, cooldowns, DoT consumption/preservation, and resource cutoff. Only a strictly higher total replaces the incumbent. The chosen policy is part of the result and must be supplied as `rotationPolicy` when replaying it.

Full-panel search explicitly compares all legal Hours specialization options under the shared 100-point budget. If necessary, points are reallocated from other active skills; fixed passive/defensive choices remain fixed. The UI shows the best found self/target results and point totals. Fixed-panel mode changes timing only and preserves all specializations.

Validation: 23 existing test files passed; the new rotation-planning regression covers actual full-fight improvement, both Hours variants, point limits, exact policy replay, nonoverlapping actions, empty mana and no-mark cases, and fixed-panel preservation. A synthetic 100–400 crossbow / 150–500 wand fixture improved from 2676 to 2767 DPS; this is a coverage test, not a prediction for the user's character.

Limits: this is a bounded policy search, not an exhaustive event-by-event optimizer. Proc/critical damage and cooldown outcomes continue to use the existing expected-value model. No stochastic realizations or game animation measurements were added in this change. Timings are model predictions, not a guaranteed playable script.
