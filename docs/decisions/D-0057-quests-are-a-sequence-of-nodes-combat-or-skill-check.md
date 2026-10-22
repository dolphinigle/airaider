---
id: D-0057
title: Quests are a sequence of nodes: combat or skill check
status: accepted          # proposed | accepted | rejected | superseded
date: 2026-10-22
decided-by: designer      # designer (design: what the game does) | claude (implementation: how the engine does it)
supersedes: []            # e.g. [D-0003]
superseded-by:            # set when a later record replaces this one; the only edit allowed after acceptance
evidence: [E-0002, E-0003, E-0005]
sources: []               # archived ideas it brings back, e.g. [archive/v3/ECONOMY.md §3]
---

## Context

D-0056 made the game mostly combat, and D-0052 grows quests from 1–2 battles to ~4 + a boss. The battle vs check skills alternative (NOW working model) needs a place where checks happen.

## Decision

The designer: "i think a quest is like a sequence of "nodes". each node is either combat or skill check (eg found a treasure box!)"

- A quest is a **sequence of nodes**. Each node is a **combat** or a **skill check** ("found a treasure box!").
- **A straight line, no forks** (designer: "straight line is probably good enough. darkest dungeon maps is one of the weaker parts of it i think").

Claude's working shape (not yet ruled):
- **A check node offers 2–3 approaches**, each a skill or stat (treasure box: Thievery to pick it, STR to smash it and maybe break what's inside, or leave it). The player picks the approach and which merc flips it. Like Darkest Dungeon curios.
- **Pass** gives loot, a buff, or knowledge for the next fight (a revealed weakness, a skipped ambush). **Fail** costs stress, HP, or makes the next fight harder. Never a plain nothing.
- **Approaches can use battle skills and stats too** (D-0058: battle skills can be checked).
- **Between nodes** the party can push on or retreat (E-0005 inspiration).

## Consequences

- Gives check skills a home, and keeps them tied to fights.
- Adds choices inside "go" (D-0055).
- Touches design/quests.md. Open: node text (who writes it), node counts per quest size.

## Options considered

- Fights only, checks gone: simpler, but loses who-you-send variety.
- A branching map (Slay the Spire, Darkest Dungeon rooms): the designer finds Darkest Dungeon's maps one of its weaker parts.
