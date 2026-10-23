---
id: E-0009
title: Merc attributes, combat only
date: 2026-10-23
status: done              # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: How do starting stats, races and talents roll, and what is each attribute worth in a fight (HP, speed, LUK)?
verdict: race +1 / −1 and mildly random starting stats (D-0106); CON, DEX and LUK scales left to the balance pass (designer)  # one line, filled in when done: the answer
decisions: [D-0106]             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

Step 2 of the plan to a playtest, part 2 of merc details (after E-0008). Ruled: six stats about 10 → 20 (D-0069), passives counted from 10 (D-0081: STR 1% increased damage, INT 3% XP, CHA gold, DEX speed coins, CON max HP, LUK heads chance), starting stats a little random and biased by race (D-0018), race is a trait with a trade-off passive (D-0038), speed coins flipped every round (D-0041), two-attribute skills flip the average (working, D-0084). Open: starting spread, race leans, talent odds, the HP and speed scales, LUK's size.

## Setup

`attributes.mjs`: `recruits [seed]` (one recruit per race), `speed` (who acts first, exact binomial), `luk` (LUK's worth at 0.5% and 1% a point). Outputs in `samples/out.txt`.

## Result

Claude's draft (2026-10-23), proposed to the designer:
- **Starting stats:** 10 each; race lean +2 / +1 / −1 (human: +1 on two random stats); then two coins move at random, never off the lean. Range about 8–13.
- **Talents:** two draws, the race's lean stats twice as likely.
- **Placeholder races:** human, wolfkin, catfolk, bearkin, elf, dwarf, dragonkin, giantkin.
- **CON:** max HP 30 at CON 10, ±3 a point (Lv 1 about 27–39, Lv 10 tank about 60).
- **DEX:** speed coins = DEX, flipped each round. DEX 15 acts before DEX 12 71% of the time, before DEX 10 84%.
- **LUK:** 1% a point instead of 0.5%, since LUK has no skills: LUK 20 = 60% heads, about 20% more from every coin.
- **Two-attribute skills:** average, rounded up.

**Designer, 2026-10-23 (D-0106):** race only +1 / −1 so it doesn't force builds; starting stats mildly random. Now: three random coin moves within 8–12, then the race's +1 / −1; talents unweighted. 82% of starting stats at 9–11.

## Verdict

Starting stats: 10 each, mild randomness, race +1 / −1 (D-0106); races don't force builds. **The exact CON (HP), DEX (speed) and LUK (heads) scales stay open for the balance pass** (designer, 2026-10-23: "for CON/DEX/LUK exact number just leave it open for balancer later to modify, dont lock those"); Claude's numbers above are placeholders. Two-attribute rounding stays Claude's working call (up).

## Next
