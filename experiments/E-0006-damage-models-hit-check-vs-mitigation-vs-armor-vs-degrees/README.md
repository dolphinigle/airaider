---
id: E-0006
title: Damage models: hit check vs mitigation vs armor vs degrees
date: 2026-10-22
status: done              # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: Which damage model gives readable, tense, fair coin-flip attacks: hit check, % mitigation, armor subtraction, or degrees of success?
verdict: "% mitigation (M2) on a flat 10-20 attribute curve: linear, never locks a merc out, every head counts. Hit checks (M1) cliff and waste heads; degrees (M4) cap out; armor subtraction (M3) punishes weak mercs. Drama comes from the coins plus a status flip."
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer asked how attributes and defense should shape an attack (2026-10-22), offering (1) fixed damage per skill, attribute heads must beat the foe's defense to hit, and (2) always hit, damage from heads, cut by the foe's defense %. "propose several, test a bit". Goal (designer): "something thats POSSIBLE to balance and also FUN to the players." Balance means: "average player can clear the fights, if you minmax youll get advantage. not that you cannot clear unless you minmax, thats bad balance". So a weaker-but-reasonable merc must still contribute; min-maxing is a bonus, never the entry fee. We compare those two with two of Claude's (armor subtracts heads; degrees: graze / hit / crit) and a two-flip add-on (skill flip decides whether a status lands). What would change our minds: a model with frequent whole-turn whiffs, cliffs where one defense point swings hit chance hugely, or attribute gaps that make weaker mercs useless.

## Setup

`dmgsim.mjs` (exact binomial math, seeded Monte Carlo for kill counts and sample logs). Output: `samples/out.txt`. Attributes: old curve 3/6/13, flat curve 10/15/21 (Lv1, Lv12 untalented, Lv12 talented; D-0018 growth on a 10 base, the designer's idea). Foe HP 40.

## Result

Full tables: `samples/out.txt`. Flat curve (A = 10 / 15 / 21), standard defense, mean damage per attack:

| model | A=10 | A=15 | A=21 | 21:10 | zero-damage at A=10 | defense +1 step at A=10 |
|---|---|---|---|---|---|---|
| M1 hit check (D 12, heads > T=4) | 7.5 | 11.3 | 12.0 | 1.60 | 38% | T 4→6: 7.5 → 2.1 |
| M2 mitigate (heads × 2.5, −20%) | 10.0 | 15.0 | 21.0 | 2.10 | <1% | −20% → −40%: 10 → 7.5 |
| M3 armor (3 × (heads − 1)) | 12.0 | 19.5 | 28.5 | 2.37 | 1% | K 1→2: 12 → 9; K=4: 3.7 vs 19.5 at A=21 |
| M4 degrees (graze 6 / hit 12 / crit 24) | 13.0 | 20.3 | 23.5 | 1.81 | 0% | T 4→6: 13 → 8.4 |

- **The old 3→13 curve fails every threshold model:** at A=3 or 6, M1 and M3 deal nothing most of the time. The flat curve (designer's idea) fixes zero rolls everywhere.
- **M1** cliffs: one defense step cuts a Lv1 merc's damage by ~70%, and 21:15 is only 1.06 because heads above the threshold are wasted. Average mercs get locked out by high-defense foes while min-maxers gain nothing on low ones: the opposite of the designer's balance goal. Kill takes 4–9 attacks at A=10 (the only real swing).
- **M2** is linear in both directions: a merc never gets locked out (A=10 vs 60% still deals 5), and every head adds damage, so each flip matters. Damage types and weaknesses are just ± %. Least drama per hit.
- **M3** spreads widest: heavy armor makes weak mercs useless (K=4: 3.7 vs 19.5). A good *trait* for one armored foe family, too harsh as the global rule.
- **M4** never whiffs and has crit moments, but caps: a strong merc on a normal foe always crits, so growth stops showing.
- **M5** skill flip for statuses, threshold 2 heads: lands 25 / 50 / 69 / 89% at 2 / 3 / 4 / 6 skill coins.

## Verdict

Recommend **M2 on the flat curve**: flip attribute coins (10 → 20 over a career); each head deals the ability's base damage, which rises with skill level (the designer's "damage fixed per skill, you can upgrade it"); foe defense cuts a % per damage type, weaknesses add %. Statuses land on a skill flip (M5). Possible to balance (linear, no cliffs), fair to average squads, min-maxing gives a proportional edge. M3 armor stays available as one foe family's twist. Not yet a decision: waiting on the designer.

## Next

Optional. The follow-up it suggests.
