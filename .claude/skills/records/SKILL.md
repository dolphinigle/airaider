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
| phase, next steps, what waits on the designer | `docs/NOW.md` |
| outside material (games, research, samples) | `docs/reference/` |
| v1–v3 | `docs/archive/` (frozen, never edit) |

## Running an experiment

1. `node tools/rec.mjs experiment "short title"` creates the folder and record, numbered.
2. **Before running**, fill in `question` (frontmatter) and **Question** (why we ask, and what result would change our minds). Set `status: running`.
3. Put everything that produces the result **in the folder**: scripts, prompts (verbatim), inputs, `key.json` for blind judging. Bulk output goes in `raw/`, which is gitignored. Copy the samples worth keeping into `samples/` or into the record.
4. When done: write **Setup** (rerunnable: commit, seeds, models, n), **Result** (numbers + best samples), **Verdict**. Set `status: done`, a one-line `verdict`, and `decisions` if it proposed any.
5. If the verdict should change the game, create a **proposed** decision (below) and list it in NOW.md. Never edit design/ from an experiment directly.
6. `node tools/rec.mjs check`, then commit: `exp: E-NNNN <title>: <verdict>`.

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

## End of session

Rewrite `docs/NOW.md`: phase, next steps, open (proposed) decisions waiting on the designer. Run `node tools/rec.mjs check`, then commit.

## Git (D-0003)

- `main` is the trunk. Commit records straight to it, staging files by name.
- Use `code/<topic>` branches only for risky code. Turn an abandoned branch into an `archive/<name>` tag before deleting it.
- Mark checkpoints with annotated tags `v4-<milestone>`.
- Never commit `.env`, `raw/`, saves or logs.
