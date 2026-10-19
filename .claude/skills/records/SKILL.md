---
name: records
description: Where and how to record airaider work. Use BEFORE running any test, simulation, playtest, prompt lab, judge round or research sweep (open an experiment record), WHEN it finishes (write result + verdict), WHENEVER the designer makes a ruling or Claude makes an implementation choice (write a decision record), and at the end of every session (update docs/NOW.md). Also use when asked "where does X go", "what did we decide about X", or "save/record this".
---

# Records: where things go

The map is `docs/README.md`. In short:

| Thing | Home |
|---|---|
| test, sim, playtest, lab, judge round, research | `experiments/E-NNNN-slug/` (README.md = the record) |
| a ruling or a choice, with its reason | `docs/decisions/D-NNNN-slug.md` |
| how a system works now | `docs/design/<system>.md` (cites decisions) |
| a lesson: what worked, what didn't, what's open | `docs/findings.md` (one cited bullet) |
| phase, next steps, what waits on the designer | `docs/NOW.md` |
| outside material (games, research, samples) | `docs/reference/` |
| v1–v3 | `docs/archive/` (frozen, never edit) |

## Cross-check every new idea

Before proposing or trying any idea (the designer's or yours), read `docs/findings.md` and say in a line which lessons it touches: repeats something that failed, builds on something that worked, or answers an open question. The SessionStart hook prints the ledger, so it is always in context.

## Running an experiment

1. `node tools/rec.mjs experiment "short title"` creates the folder and record, numbered.
2. **Before running**, fill in `question` (frontmatter) and **Question** (why we ask, and what result would change our minds). Set `status: running`.
3. Put everything that produces the result **in the folder**: scripts, prompts (verbatim), inputs, `key.json` for blind judging. Bulk output goes in `raw/`, which is gitignored. Copy the samples worth keeping into `samples/` or into the record.
4. Whenever a lesson shows up (mid-run too), put it in `docs/findings.md` under Works / Doesn't work / Open, citing the experiment: `node tools/rec.mjs finding works|fails|open "Claim. Detail" E-NNNN`. Rewrite or move an existing bullet rather than duplicating it.
5. When done: write **Setup** (rerunnable: commit, seeds, models, n), **Result** (numbers + best samples), **Verdict**. Set `status: done`, a one-line `verdict`, and `decisions` if it proposed any.
6. If the verdict should change the game, create a **proposed** decision (below) and list it in NOW.md. Never edit design/ from an experiment directly.
7. `node tools/rec.mjs check` (it fails if a finished experiment has no lesson in findings.md), then commit: `exp: E-NNNN <title>: <verdict>`.

Show the designer samples and results as you go (small loops). The record is written for later readers, not instead of talking.

## Recording a decision

1. `node tools/rec.mjs decision "the decision as a statement"`.
2. Fill in Context (why it came up, the evidence, `evidence: [E-…]`), Decision (buildable; **quote the designer verbatim** for their rulings), Consequences.
3. Status and authority:
   - **Design** (what the game does): only the designer accepts. Write it as `proposed`, show it, and set `accepted` once they say so. Use `decided-by: designer`.
   - **Implementation** (how the engine does it): Claude may accept it. Use `decided-by: claude`. Don't ask the designer to rule on engine matters.
4. If it replaces an older decision: add `supersedes: [D-…]` to the new one. In the old one, set `status: superseded` and `superseded-by`. That is the only edit an accepted record ever gets.
5. In the **same commit**, update the design/ page it touches and NOW.md.
6. `node tools/rec.mjs check`, then commit: `decision: D-NNNN <title>`.

"Save this" from the designer means: record it in its home (decision, design page or experiment), curated. Never blind-append to a log.

## Reusing something from v1–v3

The archive (`docs/archive/`, catalog in its README) is frozen v3 material, not v4 design. Design v4 from scratch first, then grab parts: write a v4 decision that restates the idea in v4 terms with `sources: [archive/v3/FILE.md §N]`. Never edit an archived file, and never cite one from design/ as the spec. The Stop hook flags archive edits.

## Changing the structure

The docs keep themselves current through `tools/rec.mjs`. The indexes for decisions, experiments, design/ and reference/ are generated, and `check` fails when any folder is missing from its map. When you add a new folder, a new kind of record, or a new generated index:

1. Make sure it has a home that no existing row covers. Prefer a page inside an existing folder over a new folder.
2. Add a row to the map in `docs/README.md` (for anything under docs/) or to `README.md` (for a top-level folder). Give it a `README.md` saying what goes there.
3. If it is a new kind of record or a new generated table, teach `tools/rec.mjs`: add an entry to `INDEXES` (and `records()`/`check()` for a numbered kind), and put `<!-- index:start -->`/`<!-- index:end -->` markers in its README.
4. Update this skill's table and the `CLAUDE.md` records list.
5. A structural change is a decision: write one (`decided-by: claude` for layout and tooling) that amends or supersedes D-0001.
6. `node tools/rec.mjs index && node tools/rec.mjs check`, then commit.

## End of session

Rewrite `docs/NOW.md`: phase, next steps, open (proposed) decisions waiting on the designer. Run `node tools/rec.mjs check`, then commit.

## Git (D-0003)

- `main` is the trunk. Commit records straight to it, staging files by name.
- Use `code/<topic>` branches only for risky code. Turn an abandoned branch into an `archive/<name>` tag before deleting it.
- Mark checkpoints with annotated tags `v4-<milestone>`.
- Never commit `.env`, `raw/`, saves or logs.
