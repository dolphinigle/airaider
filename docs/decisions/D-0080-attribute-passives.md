---
id: D-0080
title: Attribute passives
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0005]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

Besides coins for their skills (D-0069), some attributes had a side effect (DEX speed, CON HP, LUK heads chance, D-0079). The designer asked what each one's passive should be, from other games (E-0005 round 6).

## Decision

The designer, 2026-10-22: "INT should be XP gain. CHA: higher quest GOLD reward maybe? lower wage makes little sense. STR: leaning for HP and delete CON?", then "INT for ALL their XP. Ok sounds good, lets keep CON. for STR how about a tiny amount of more damage on everything? like 1% per point?"

| stat | passive |
|---|---|
| STR | **+1% damage per point, on all the merc's damage** (any skill) |
| DEX | speed coins (turn order) |
| INT | **more XP of every kind**: merc XP and every skill's XP |
| CHA | **more quest gold** |
| CON | max HP. CON stays. |
| LUK | heads chance on every coin (D-0079) |

Working numbers (Claude): INT +1% XP per point, stacking with skill stars; CHA +1% quest gold per point of the **highest CHA on the squad** (the one who negotiates the pay). Every passive stays small per point so no stat outshines the rest.

## Consequences

- STR double-dips for STR skills (coins + %), but the % is small: STR 10 → 20 adds about 9% on top.
- INT's XP and skill stars stack; INT also speeds merc levels, so it snowballs a little.
- CHA ties a stat to the gold economy (D-0052).
- Touches design/mercs.md, NOW.

## Options considered

- STR gives HP and CON is deleted (designer, leaning): dropped; STR as damage + HP would be every frontliner's best stat and remove the tank/bruiser recruit split.
- CHA lowers weekly wage (Claude): "makes little sense".
- INT makes statuses last longer; STR carries loot (Claude): replaced by the designer's picks.
