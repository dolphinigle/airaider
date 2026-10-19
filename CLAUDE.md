# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status
- **Prototype v4 kickoff (2026-10-19).** A restart from scratch around the SQUAD: squad building on top of base building, frequent chance rolls, readable story (D-0002). v1–v3 are archived.
- Start every session with **`docs/NOW.md`** (where we are), then `docs/vision.md`.
- **Accepted decisions are law** (`docs/decisions/`). `docs/design/` is the living spec built from them, and code follows design/. If a case isn't covered, write a *proposed* decision for the designer; rulings stay with the designer.

## Records: where everything goes
**Record as you go, unprompted. The designer should never have to ask.** Use the **`records` skill** whenever you run a test, sim, playtest or lab, record a ruling, or end a session. Hooks back this up: SessionStart loads NOW.md, and Stop runs `rec.mjs check` and flags uncommitted records. The map is `docs/README.md`:
- experiments → `experiments/E-NNNN-slug/` (record + scripts + samples; `raw/` gitignored)
- decisions → `docs/decisions/D-NNNN-slug.md` (immutable once accepted; supersede, never edit)
- current spec → `docs/design/` · status → `docs/NOW.md` · outside material → `docs/reference/`
- v1–v3 docs → `docs/archive/` (frozen, ARCHIVED-bannered, NOT v4 design): design v4 from scratch, then reuse an idea only through a v4 decision with `sources:`
- `node tools/rec.mjs decision|experiment "Title"` numbers new records; `node tools/rec.mjs check` before committing.

## Working style
- **Be terse. Save tokens.** Short answers, minimal preamble, no recap of what you just did.
- **Principles, not instance-patches.** In prompts and code alike, fix the class, never bolt on the specific example that failed. Examples are sticky, and instance-patches are brittle.
- **Positive instructions, no ban lists.** Say what to do; steer voice with samples.
- **Prompts are written for cheap models.** A rule buried in a long prompt does not exist for a small model. Adding a rule means merging or cutting another first.
- **You can't drive a browser.** Every player-facing surface must also be playable as text, so you can playtest by playing, never by simulating a UI you can't run.
- **Division of labor (designer-ruled 2026-07-19): Fable plans, Opus codes.** Plans, prompt design and judging stay with the main session. Manual coding is delegated to Opus subagents, whose output is verified.
- **The designer judges design, not code.** Keep engine constraints out of design discussions. The engine is Claude's to solve, and recorded as `decided-by: claude`.
- Throwaway prototype: design-learning per hour beats robustness. Fun before balance.

## Git (D-0003)
`main` is the trunk. Stage files by name. Commit prefixes: `decision:` `exp:` `design:` `docs:` `v4:` `tools:`. Checkpoints are annotated tags `v4-<milestone>`. Never commit secrets, `raw/`, saves or logs.

## Layout
- `docs/`: vision, NOW, decisions, design, reference, archive
- `experiments/`: one folder per test
- `tools/rec.mjs`: records tool · `tools/githooks/`: pre-commit runs `rec.mjs check` (enable: `git config core.hooksPath tools/githooks`)
- `v4/`: the prototype code (not started)
- v3 code: tag `v3-final`, playable checkout at `../airaider-v3`

## Secrets
`OPENAI_API_KEY` lives in `/home/irvan/airaider/.env` + `~/.airaider/openai.env` (gitignored). Read for dogfooding only; never print or commit.
