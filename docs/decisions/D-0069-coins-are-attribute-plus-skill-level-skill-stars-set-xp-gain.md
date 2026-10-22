---
id: D-0069
title: Coins are attribute plus skill level; skill stars set XP gain; abilities come at some skill levels
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: [D-0065, D-0067] # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0006]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0065 had attacks flip attribute coins with the ability base rising with skill level; D-0067 gave an ability on every battle-skill level up and left open what a check skill's star does.

## Decision

The designer, 2026-10-22: "check skill star for xp gain only sounds good. battle skill star using the same rule probably for the best. battle skills should be learned when a skill levels up, instead of when a merc levels up. -- clearly not every time the skill level up that would be too much. -- skill level becomes the skill additional coin when doing skill checks. for example, say we have a survival check. if A has a survival skill, then the coinc sare dex coins + survival coins. otherwise its just dex coins. probably same for battle skills, the damage is the skill coin plus the STR. melee split good lets go. elemental should be split. damage types probably just same from path of exile: Fire, Frost, Lightning, Physical, and Chaos. Holy magic deals physical damage mostly."

Restated in full (replaces D-0065 and D-0067):
- **Coins = attribute + skill level.** A check flips the attribute plus the skill's level in coins if the merc has the skill, or the attribute alone if not ("survival check: DEX + Survival, otherwise just DEX"). An attack flips its attribute plus its battle skill's level ("STR + the skill"). Each head deals the ability's base damage.
- **Attributes run about 10 → 20** over a career; **foes scale by HP**, not by defense thresholds (from D-0065).
- **Foe defense cuts a % per damage type**, weaknesses add %; attacks always hit (from D-0065).
- **Statuses land on a separate skill flip** (skill-level coins, heads ≥ a threshold, working 2) (from D-0065).
- **A merc level up grants attributes only** (D-0018's three coins) (from D-0067).
- **Abilities come from battle-skill level ups, but not every one.** When one comes, the D-0047 flow stands: about 10–20 bases per battle skill; the engine deals the AI a few random bases from that skill that fit the merc's weapon and are not already known; the AI picks one that fits the merc's theme and renames it; never the same base twice; four equipped.
- **Every skill and trait has a star**, 1★–5★ in half steps (D-0067, D-0068).
  - **A skill's star sets its XP gain** (how fast it levels), for check and battle skills alike.
  - **A battle skill's star also sets its abilities' modifier odds** (D-0027's odds, per skill): at most 4 modifiers (about 0.1% at 5★); about 30 modifiers fit each base; higher stars get more common as the game goes on.
  - **A merc's star** makes their skills (and traits) likelier to roll high stars.

Claude's working numbers, not yet ruled:
- A new ability at skill levels 1, 3, 5, 7, 9 (every other level). Level 1's is the 0-cooldown attack (D-0050).
- Which attribute each battle skill attacks with: design/mercs.md.

## Consequences

- E-0006's model holds with the skill's coins added to the pool instead of raising the base.
- Having the right skill for a check node (D-0059) adds coins; lacking it is not an auto-fail.
