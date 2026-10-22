---
id: D-0065
title: Damage: attribute coins times ability base, cut by defense percent; foes scale by HP
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0064]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0006]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

E-0006 compared four damage models against the designer's goal: "something thats POSSIBLE to balance and also FUN", where balance means an average squad clears and min-maxing gives an edge. Hit checks cliffed and wasted heads; % mitigation stayed linear and never locked a merc out.

## Decision

The designer, 2026-10-22: "ok i agree. i think the way to "scale" enemies to raise their HP not via coin fight like first option. lets go with 10->20 that way."

- **An attack flips the merc's attribute coins.** Each head deals the **ability's base damage**; the base rises with **skill level**.
- **Foe defense cuts a % per damage type**; a weakness adds %. Attacks always hit.
- **Statuses land on a separate skill flip** (heads ≥ a threshold, working: 2).
- **Attributes run about 10 → 20** over a career (start near 10; D-0018 growth on top).
- **Foes scale by HP**, not by defense thresholds.
- Each battle skill uses one fixed attribute for its attacks (table: design/mercs.md, working).
- Attributes keep their indirect roles: CON max HP, DEX speed coins, WIL the stress check (D-0044). Checks pool attribute + skill.

## Consequences

- Replaces D-0064 (abilities flip skill coins only) and D-0041's pool line.
- Armor that subtracts heads (E-0006 M3) is kept as a possible twist for one foe family.
- Open: merc defense (shield, % per type, dodges); the list of damage types; which attribute each battle skill uses.
