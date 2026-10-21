---
id: D-0041
title: Combat basics: one line per side, speed coins each round, stat plus skill coins times base
status: proposed
date: 2026-10-22
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0003, E-0005]
sources: []
---

## Context

The fight model so far was the D-0025 working model (2×3 grid, stamina and mana). The designer asked for something simpler, in the style of Final Fantasy, and asked whether it has enough depth.

## Decision

The designer's words: "keep it simple and have it like in final fantasy, aka everyone on a line instead of front line and back line" · "turn based, each turn everyone gets to move once by speed coin (eg a unit with 10 speed gets 10 coins, then flipped, the heads then sort by it) (enemies have fixed speed, in general enemies are fixed) (speed is determined by a combination of DEX and maybe some skills)" · "skills deal damage by flipping coins equal to e.g. STR + sword coins multiplied by the base damage. (a FIRE and SWORD skill will roll coins by the average of fire and sword?)" · damage, SHIELD ("damage shield on top of hp, absorbs damage"), heals, buffs, debuffs, damage over time.

- **Formation:** each side is one ordered line, as in Darkest Dungeon (designer, 2026-10-22: "i think we want darkest dungeon battle system then, a line, so that we can put healers at the back etc."). Position in the line matters: healers stand at the back. This replaces the 2×3 grid of D-0025.
- **Rounds:** everyone acts once per round. At the start of the round each merc flips their speed coins, and the order sorts by heads. A foe's speed is a fixed number.
- **Speed coins:** DEX, plus some skills (to be ruled).
- **Ability pool:** the ability's stat plus its skill. An ability built on two skills uses the stat plus the average of the two skills. Each heads deals the base amount.
- **Foes are fixed:** they don't flip (D-0013).
- **Effect families:** damage, Shield (absorbs damage before HP), heal, buff, debuff, damage over time.

## Added 2026-10-22 (designer)

"skills dont cost stamina, they have COOLDOWN and MANA COST instead" (mana removed later the same day) · "guard can either TAUNT or shield, can even shield the party" · "some enemies are weak to certain damage types, some give status that increase damage from others".

- **Costs:** an ability has a **cooldown** only. There is no stamina and no mana (designer, 2026-10-22: "remove mana. Darkest Dungeon doesnt have it.").
- **Guard abilities** either **taunt** (foes hit the taunter) or **shield**, and a shield can cover the whole party.
- **Interactions:** foes can be **weak to damage types**; some statuses make the target **take more damage** from others.
- **Speed stays a coin flip every round** (designer: "we want speed here, its not a farming game, so strats are a bit more dynamic (instead of buff A, then A attack)"). Everyone acts once per round; there is no turn bar. **Haste** and **Slow** statuses shift a unit's speed.
- **Ranks only, for now:** there are no corpses; when a unit drops, the units behind it shift forward (designer: "no corpses i think, just Ranks for now"). Claude reads "just Ranks for now" to mean knockback and pull wait too.

## Open

- Claude's proposals, not yet ruled:
  - Shield lasts until used up, capped at max HP.
  - A debuff lands if heads reach a fixed number.
  - Each foe has a fixed rule for choosing its target.
  - Round cap, then retreat.
  - Speed coins are DEX + Athletics.
- Line details, as proposed by Claude:
  - 4 ranks per side.
  - Each ability states **ranks it can be used from** and **ranks it reaches**.
  - Melee foes reach only the front, so tanks go front without needing a taunt.
  - A merc with no ability usable from its rank steps toward a rank where one is.
  - Later: knockback and pull as modifiers and foe twists.
