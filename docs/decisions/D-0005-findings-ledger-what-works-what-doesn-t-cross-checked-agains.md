---
id: D-0005
title: Findings ledger: what works, what doesn't, cross-checked against every new idea
status: accepted
date: 2026-10-19
decided-by: designer
supersedes: []
superseded-by:
evidence: [E-0001]
sources: []
---

## Context

D-0001 gave every record a home, but lessons were scattered across experiment verdicts. During E-0001 the designer asked for one place that remembers results.

## Decision

The designer's words: "pls make sure your data organizer remember what works vs what doesnt … if it doesnt have that mechanism yet, code it first … so whenever we comes up with a new idea, you can crosscheck w/ it."

Amends D-0001 with a fifth kind of record:
- `docs/findings.md` holds the lessons, in three sections: **Works**, **Doesn't work**, **Open**. One bullet per lesson, each citing the experiment or decision behind it.
- It is curated: new evidence rewrites or moves a bullet instead of adding a duplicate.
- Every new idea is cross-checked against it before it is proposed or tried.

## Consequences

- `rec.mjs finding works|fails|open "…" E-NNNN` adds a lesson. `rec.mjs check` fails on an uncited bullet, an unknown id, or a done/abandoned experiment that no lesson cites.
- The SessionStart hook prints the ledger into every session.
- The records skill and CLAUDE.md carry the cross-check step.
