# Airaider docs: the map

Every piece of knowledge has exactly one home. If you are about to write something down, find its row here.

| You have… | It goes in | Format | Mutable? |
|---|---|---|---|
| What the game is for: pillars, the feel, the fun | [vision.md](vision.md) | prose | rewritten, but only to match a decision |
| Where we are right now: phase, next steps, what waits on the designer | [NOW.md](NOW.md) | short list | rewritten every session |
| A choice that was made, and why (design ruling, process rule, architecture) | [decisions/](decisions/README.md) `D-NNNN-slug.md` | decision record | **immutable** once accepted; replaced by a new record that supersedes it |
| How a system works today (the spec the code is built from) | [design/](design/README.md) `<system>.md` | spec | rewritten; every rule cites the decision behind it |
| A test, sim, playtest, prompt lab, judge round or research sweep | [../experiments/](../experiments/README.md) `E-NNNN-slug/` | experiment record + its files | append-only once done |
| Outside material: other games, research, sample texts we study | [reference/](reference/README.md) | notes + sources | add freely |
| Anything from v1–v3 (marked ARCHIVED, not v4 design) | [archive/](archive/README.md) (catalog by topic) | frozen | never edited; reuse an idea through a v4 decision with `sources:` |

## The flow

```
question ──► experiment (E) ──► result ──► designer ruling ──► decision (D) ──► design/ updated ──► code
```

- An experiment never changes the design by itself. Its record ends with a verdict and, if it needs one, a **proposed** decision.
- Only the designer accepts design decisions. Claude may accept implementation decisions (how the engine does it) on its own and records them the same way (`decided-by: claude`).
- When a decision is accepted, the design doc it touches is updated **in the same commit**.

## Precedence

Accepted decisions > design/ > code. If design/ and a decision disagree, the decision wins and design/ is the bug. If code and design/ disagree, design/ wins. If neither covers a case, write a **proposed** decision and list it in NOW.md for the designer.

## Tooling

`node tools/rec.mjs` creates records with the next free number and keeps the indexes current:

```bash
node tools/rec.mjs decision "Squad size is six"     # → docs/decisions/D-0004-squad-size-is-six.md
node tools/rec.mjs experiment "first game sim"      # → experiments/E-0001-first-game-sim/README.md
node tools/rec.mjs index                            # regenerate both index tables
node tools/rec.mjs check                            # validate fields, links, index freshness
```

The [records skill](../.claude/skills/records/SKILL.md) is the step-by-step for Claude.
