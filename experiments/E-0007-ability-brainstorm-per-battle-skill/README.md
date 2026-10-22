---
id: E-0007
title: Ability brainstorm per battle skill
date: 2026-10-22
status: running           # planned | running | done | abandoned
type: research            # sim | playtest | lab | judge | research
question: What abilities could each of the 29 battle skills give, drawn from Darkest Dungeon and other games?
verdict:                  # one line, filled in when done: the answer
decisions: [D-0101]       # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

Step 1 of 4 toward a playtest-ready fight (designer, 2026-10-22): (1) brainstorm several ability ideas per battle skill; (2) a balance frame (damage formula, foe HP, target turns), using Darkest Dungeon as the guide; (3) foe design and a few mock foes, also after Darkest Dungeon; (4) final abilities with that balance. The goal is to learn whether the game is fun; exact balance comes later.

This brainstorm should find which skills already have distinct, decision-making abilities and which are thin.

## Setup

Done together with the designer, skill by skill, with designer samples (2026-10-22: "for the skills we can do it tgt, ill give samples too", "esp for (1) because its just to GUIDE and GIVE IDENTITY to the skills"). The aim is each skill's identity plus a few rough ability ideas, not final mechanics; those come in step 4. A delegated agent sweep was started and then stopped. Results go into `brainstorm.md`.

## Result

So far (2026-10-23), all in `brainstorm.md`:
- **Conventions:** damage as a % of a standard hit; few cooldowns; default attacks only on weapon and magic skills; stuns always limited; debuffs flip to land.
- **Effects list** (count and potency) and the **mod catalog** (designer: "we have all the mods proper"). Mods are outside skill identities.
- **Key identities for all 29 battle skills**, with ranks, main role, strong and weak effects, a distribution by effect, rank and role, and example two- and three-skill builds. Rejected identities: the Single Weapon duel, Unarmed combos ("too many turns required to 'go online'"), Frost build-and-shatter.
- Model abilities: Two-handed, Holy, Dirty Fighting reviewed; Polearm, Fire, Frost, Lightning, Dark drafted.
- **Baseline abilities (Claude's draft, 2026-10-23):** 242 abilities for all 29 skills in `baseline.mjs` (data; `node baseline.mjs stats`, `node baseline.mjs html <out>` renders the review page via `baseline-page.mjs`). Published as Artifact https://claude.ai/artifact/7Uvbcxg9cHofHe2H5TjjyW for the designer's rough review. The five drafts were redone to the new identities; reviewed cards kept unchanged, a few added. It adds statuses Braced, Taunting, Guarded, Raging, Keen, Empowered (unruled) and Claude answered its open points (designer: "none are important"). Rulings in review: a default attack is any 0-cd damaging ability; names say what the ability does; Polearms pair up (listed on the page and in `baseline.mjs`).
- **Plan change (designer, 2026-10-23):** the abilities are "decent enough that we can stop here". Step 4 (balance, then redo the abilities) is dropped for now. Last task here: baseline abilities for every battle skill, published as an Artifact for a rough review.

## Verdict

(pending)
