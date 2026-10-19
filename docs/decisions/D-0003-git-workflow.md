---
id: D-0003
title: One trunk (main), tags for checkpoints, nothing secret or bulky in git
status: accepted
date: 2026-10-19
decided-by: claude
supersedes: []
superseded-by:
evidence: []
sources: []
---

## Context

Before v4, the real work lived on `prototype/m0`, 870 commits ahead of a `main` that had not moved since May. Three stale May doc branches and two leftover agent-worktree branches sat beside it. It was unclear which branch was current.

## Decision

- **`main` is the trunk** and always holds the current state. Docs, records and small changes are committed straight to it.
- **Short-lived branches** only for risky code work: `code/<topic>`. Merge them back (fast-forward when possible) and delete them. A branch that is abandoned becomes a tag `archive/<name>` before deletion, so no work is lost.
- **Tags mark checkpoints:** `v3-final`, and later `v4-<milestone>` (e.g. `v4-first-playable`). Use annotated tags whose message says what the checkpoint is.
- **Commit prefixes** name the record kind: `decision: D-0004 …`, `exp: E-0001 …`, `design: …`, `docs: …`, `v4: …`, `tools: …`.
- **Never in git:** secrets (`.env`), raw experiment output (`experiments/*/raw/`), saves, logs, `node_modules`.

## Consequences

- On 2026-10-19, `main` was fast-forwarded to `prototype/m0` and tagged `v3-final`. The stale doc branches became `archive/docs-*` tags.
- `git log --grep '^decision:'` lists every decision commit.
