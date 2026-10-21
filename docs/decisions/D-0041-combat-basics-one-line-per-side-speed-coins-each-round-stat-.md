---
id: D-0041
title: Combat basics: one line per side, speed coins each round, stat plus skill coins times base
status: proposed
date: 2026-10-22
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0003]
sources: []
---

## Context

The fight model so far was the D-0025 working model (2×3 grid, stamina and mana). The designer asked for something simpler, in the style of Final Fantasy, and asked whether it has enough depth.

## Decision

The designer's words: "keep it simple and have it like in final fantasy, aka everyone on a line instead of front line and back line" · "turn based, each turn everyone gets to move once by speed coin (eg a unit with 10 speed gets 10 coins, then flipped, the heads then sort by it) (enemies have fixed speed, in general enemies are fixed) (speed is determined by a combination of DEX and maybe some skills)" · "skills deal damage by flipping coins equal to e.g. STR + sword coins multiplied by the base damage. (a FIRE and SWORD skill will roll coins by the average of fire and sword?)" · damage, SHIELD ("damage shield on top of hp, absorbs damage"), heals, buffs, debuffs, damage over time.

- **Formation:** each side stands on one line; there are no rows. This replaces the 2×3 grid of D-0025.
- **Rounds:** everyone acts once per round. At the start of the round each merc flips their speed coins, and the order sorts by heads. A foe's speed is a fixed number.
- **Speed coins:** DEX, plus some skills (to be ruled).
- **Ability pool:** the ability's stat plus its skill. An ability built on two skills uses the stat plus the average of the two skills. Each heads deals the base amount.
- **Foes are fixed:** they don't flip (D-0013).
- **Effect families:** damage, Shield (absorbs damage before HP), heal, buff, debuff, damage over time.

## Open (Claude's depth review, 2026-10-22)

The depth review says this is enough as a base, with three gaps:
- what makes the S1–S4 priority list matter (cooldowns or a resource);
- who foes hit when there are no rows (targeting and taunt);
- whether abilities interact with each other.

See the reply in the session; it is to be folded in here once ruled.
