---
id: D-0002
title: Prototype v4 restarts from scratch, around the squad
status: accepted
date: 2026-10-19
decided-by: designer
supersedes: []
superseded-by:
evidence: []
sources: []
---

## Context

v3 spent its last month on storytelling: chapter sagas, synopsis prompts, example pools, picker inputs, and blind judge rounds (see `archive/v3/STORY_PROMPTS.md`, `STORYTELLER.md`, and the local `STORY_QUALITY.md`). After about a week of focused work, the story scorecard still sat near 6/10. The designer concluded that the approach does not work and called for a return to basics.

## Decision

The designer's words: "Lets go to basics: what is this game about? This game is basically like in RimWorld / Battle Brothers: it's a game about squad building on top of base building. So the keyword here is the SQUAD and how you get to use them. The actual story quality, while it's important to be readable, is less important to have things like 'intertwining quests' and such. What is 'fun' instead is having the squad 'roll coins' often. Let's simulate a good game first. Start from scratch."

- Prototype v4 is written from scratch, in `v4/`.
- The core is **squad building on top of base building**. Story text must be readable, but plot intricacy is not a goal.
- Fun comes from the squad facing frequent chance rolls.
- First step: Claude and the designer **simulate a good game** before designing systems or writing code.
- v3's decisions are archived, not inherited. Any v3 idea returns only through a new decision.

## Consequences

- All v3 docs move to `docs/archive/v3/`, and the code moves to tag `v3-final` (playable at `../airaider-v3`).
- `vision.md` is rewritten around the squad.
- The storyteller pipeline (sagas, chapters, pickers) is not carried over. Readable text stays a requirement.
