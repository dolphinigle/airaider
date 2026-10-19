---
id: D-0001
title: Every decision, experiment and design spec has one fixed home
status: accepted
date: 2026-10-19
decided-by: designer
supersedes: []
superseded-by:
evidence: []
---

## Context

v3 grew 40+ docs, where decisions, results and specs were mixed together. `GENERATION_FLOW.md` was a decision log, a spec and a changelog at once. Lab results lived in a local, uncommitted `STORY_QUALITY.md` and a 37 MB scratch folder, and the session state lived in Claude's memory. Finding "what did we decide about X, and why" meant searching. For the v4 restart the designer asked for **data organization**: tests recorded, results written, and above all the key decisions written somewhere easy to reference, with a skill that says exactly where things go.

## Decision

Four kinds of record, each with one home ([docs/README.md](../README.md) is the map):

1. **Decisions:** `docs/decisions/D-NNNN-slug.md`, one decision per file, in a lean [MADR](https://adr.github.io/madr/)-style format with frontmatter (status, date, decided-by, supersedes, evidence). Once accepted, a record is never edited. A change is made by a new record that supersedes it.
2. **Experiments:** `experiments/E-NNNN-slug/`, one folder per test, sim, playtest, lab or judge round. `README.md` holds the record (question, setup, result, verdict), next to the scripts, prompts and curated samples that produced it. Bulk raw output goes in `raw/`, which is gitignored. The record itself is always committed.
3. **Design:** `docs/design/<system>.md` is the living spec, rewritten to stay current. Every rule cites its decision.
4. **Status:** `docs/NOW.md` is the board: phase, next steps, what waits on the designer.

`tools/rec.mjs` numbers new records and regenerates the indexes. The `records` skill is Claude's procedure.

## Consequences

- Experiment records are committed now. The v3 rule "never commit STORY_QUALITY" was about a messy log. The new records are curated per experiment, so they are safe to commit. That old file itself stays local, in the archive.
- Claude's memory holds only pointers and working preferences, never project state. The state lives in the repo.
- Every design page stays short, because the reasoning lives in its decision records.
