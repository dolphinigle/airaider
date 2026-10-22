---
id: D-0058
title: Battle skills and check skills are separate with their own quotas
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0046]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: []              # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0046 split skills into main and minor fighting skills, so every skill gave abilities and a pick spent on Bargaining was a weak ability pool. D-0057 (proposed) gives skill checks a home as quest nodes.

## Decision

The designer, 2026-10-22: "alternative worth considering: separate battle skills and skill check skills like lores and have diff quotas for both (eg 3 battle skills, 2 check skills)", then "separation is good i think -- later if we decide to do v3 captive, they only have the non combat skills or smth".

- Skills come in two kinds with **separate quotas**:
  - **Battle skills** give abilities. Only they do.
  - **Check skills** give no abilities. They are flipped in skill checks (D-0057 check nodes).
  - **Battle skills can still be checked** (designer: "also non combat skill can STILL get checked, eg like "doctor" skill or "leadership""): Doctor tends a wounded stranger, Leadership steadies scared villagers. The split is about abilities: check skills never give them.
- **Quotas (working, from the designer's example):** 3 battle skills (2 at the start, the third picked at Lv 7, per D-0035) and 2 check skills (rolled at recruitment).
- **Battle skills, from D-0046 (stands):** Heavy Weapons, Light Weapons, Unarmed, Ranged, Defense, Warfare, Leadership, Performance, Animal Companion, Villainy, Stealth, Doctor, Alchemy, Nature Lore, Engineering, Elemental, Holy, Dark. D-0046's rulings on them stand: Leadership = stress healing, party auras, Resolve; Warfare = debuffs and moving teammates and foes; Performance = stress healing, songs, Haste, distraction; Animal Companion works like the Houndmaster; Villainy = bounty hunter, keeps its name; Nature Lore analyzes monsters and exposes weaknesses; Doctor heals; Alchemy = potions, poisons, flasks; Engineering = building, machines, explosives, traps.
- **The minor fighting tier is gone.** The rest are check skills: Athletics, Survival, Awareness, Roguery, Streetwise, Persuasion, Deception, Bargaining, Intimidation, Civilization Lore, Arcane Lore, Smithing (weapons, armor, repairs, gear at base).
- **Civilians** have check skills and no battle skills; in a fight they use a generic attack (D-0050).
- **Captives** (v3, if they ever return through a v4 decision) would have only check skills.

## Consequences

- Moving yourself between ranks was Athletics' niche; it becomes bases in battle skills (which ones: the ability review). Warfare still moves others.
- Open (NOW): merges inside each list; whether Nature Lore and Stealth stay battle skills or Lore moves to checks; quota numbers.
- Touches design/mercs.md (skills table, abilities).
