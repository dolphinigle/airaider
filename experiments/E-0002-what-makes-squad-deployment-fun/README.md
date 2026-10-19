---
id: E-0002
title: what makes squad deployment fun
date: 2026-10-19
status: done           # planned | running | done | abandoned
type: research                # sim | playtest | lab | judge | research
question: In squad-building games, what makes sending the squad out fun, and does it need real gameplay or can a gamble-style resolution carry it?
verdict: Gambling-style resolution works if every roll pays off a player decision (who, approach, push, retreat); tactics only add puzzle mastery and felt ownership
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

E-0001 run 1 (Atlas walks, three passive-modified coin rolls, AI one-liners) was watchable but flat: no choice during the walk, 3/3 wins. The designer wants it fun before anything else and asked what other squad games do at deployment. If the research shows that resolution without player input reliably feels flat, we design in decision points; if gamble/auto games show it can carry the fun, we keep the walk and find the levers that make it work.

## Setup

Three parallel Opus research agents with web search, 2026-10-20: (1) dispatch / mission-table / auto-resolve games; (2) squad games with real tactical deployment; (3) dice, gambling and auto-battler resolution plus design theory. Their reports are saved in `samples/`. Synthesis in [docs/reference/squad-deployment.md](../../docs/reference/squad-deployment.md).

## Result

Three reports, about 18k words in total, in `samples/`: `dispatch-games.md` (23 systems), `tactical-squad-games.md` (13 games), `chance-resolution.md` (dice, gambling, auto-battlers, theory). They converge on 13 principles and 6 failure modes, synthesized in [docs/reference/squad-deployment.md](../../docs/reference/squad-deployment.md).

Measured against them, E-0001 run 1 shows four failure markers: no choice during the walk, a foregone outcome (3/3 wins at 65–80%), no cost to sending, and nothing changed afterwards. It has two good seeds: something to watch, and a named merc.

Evidence limits: Reddit and some GDC recordings were unreachable; quotes seen only in search snippets are marked in the reports.

## Verdict

Dice can replace combat. The fun of a dice deployment comes from decisions around the rolls (who to send, approach, push or retreat, what to spend), visible odds and stakes, failures that leave marks on named mercs, and events that react to who went. Next: replay the Atlas scenario in E-0001 with these levers.

