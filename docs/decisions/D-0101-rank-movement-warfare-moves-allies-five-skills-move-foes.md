---
id: D-0101
title: Rank movement: Warfare moves allies, five skills move foes
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-23
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0073]      # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0007]        # experiments behind it, e.g. [E-0002]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0073 deleted Warfare and gave moving teammates to Leadership. Warfare came back (D-0095), and the key identities in E-0007 give it orders that move allies.

## Decision

The designer, 2026-10-23: "warfare move allies, leadership doesnt, fix it. polearm pls just fix."

- **Moving allies: Warfare** (orders). Leadership doesn't move allies; it buffs them.
- **Moving foes** (strength from the E-0007 key identities):
  - **Dirty Fighting**: yanks foes forward, a core tool.
  - **Unarmed**: knocks the front foe back; it fights only from rank 1 against foe 1 (designer), so a knockback is how it reaches the next foe.
  - **Two-handed**: knockback, weak (designer).
  - **Weapon and Shield**: weak (designer).
  - **Polearm**: push and pull, weak (Claude's fix: kept from D-0090, under its new core of reaching the back ranks and stepping forward).
- **Self-moves** stay bases in any battle skill, and the mods Heavy (knockback) and Advancing / Retreating stay as they are.
- Leadership still "works on your side" (buffs, focus fire); Dirty Fighting on theirs.

## Consequences

- design/mercs.md: Leadership loses moving teammates; Warfare gains it.
- Open: Rallying / Sheltering (mods that move an ally) now sit outside Warfare; keep them as mods on any ability, or Warfare only?
