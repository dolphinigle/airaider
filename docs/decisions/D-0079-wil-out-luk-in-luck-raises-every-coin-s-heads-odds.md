---
id: D-0079
title: WIL out, LUK in: luck raises every coin's heads odds
status: superseded          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0044, D-0075] # e.g. [D-0003]
superseded-by: D-0084
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

WIL had shrunk to the stress check plus halves of Holy and Dark Magic; its one check skill, Awareness, went to DEX. The designer weighed cutting it or swapping in PER (judged redundant with DEX), then asked whether five stats is decent or whether to add LUK. E-0005 round 5: games run 4–6 attributes; Luck is a loved stat, but one that touches every roll becomes a god stat when strong per point.

## Decision

The designer, 2026-10-22: "lets do LUK then. Nah nothing should be doing WIL's job i think. stress is stress."

- **Six stats: STR DEX INT CHA CON LUK.** WIL is gone.
- **LUK** has no skills. It raises the heads chance of **every coin the merc flips**, small per point (working: 50% at LUK 10, +0.5% per point, 55% at LUK 20, about +2 coins' worth on a 20-coin flip). It grows from level ups like any stat.
- **No stat does WIL's job.** Stress is not tied to any attribute.
- Battle skill pairings (restating D-0075): STR Cleaving, Long-reach; DEX Unarmed, Ranged, Dirty Fighting, Stealth; INT Doctor, Alchemy, Fire, Frost, Lightning, **Dark Magic**; CHA Leadership, Performance, Animal Companion, **Holy Magic**; CON Defense; two: Fast Weapons DEX + STR, Heavy Weapons STR + CON.

## Consequences

- Holy Magic becomes CHA alone, Dark Magic INT alone.
- D-0042's open question (which stat the 100-stress check flips) is answered: none. What happens at 100 without a stat is open.
- Talents (D-0018) and level-up coins now range over LUK too.
- Touches design/mercs.md, NOW.

## Options considered

- Five stats, WIL cut and nothing added: fine by the survey; the designer preferred LUK.
- PER instead of WIL: would only take Awareness and Ranged off DEX, a stat as thin as WIL was.
- LUK as the stress check (Claude): rejected, "stress is stress".
