# prosebench — the writing research directory
*Index written 2026-08-25 at the writing lock. 96 files; most are raw batch dumps kept as evidence.
**Start here, not with the batches.***

## 🔒 THE LOCK
The writing was **locked** on 2026-08-25 with the designer's sign-off ("the quality of writing is
good now"). The authoritative statements live in **`docs/`**, not here:
- **`docs/WRITING_CHECKPOINT.md`** — the approved baseline, what is implemented where, the
  regression check. **Read this first.**
- **`docs/PROSE_METHOD.md`** — the card-writing principles + the blind-measurement protocol.
- **`docs/PROMPT_RULES.md`** §0–§12 — the rules themselves.

This directory is the **evidence and the working notes** behind those documents.

## The files that matter
| file | what it is |
|---|---|
| **`CHEAP_MODEL_PROMPTING.md`** | ⭐ the measured laws **L1–L17**. The single most reusable artifact here. |
| **`COORDINATOR_LOG.md`** | ⭐ the full experimental record of the two independent-writer rounds and five blind judging batches — including every retraction. |
| **`PULL_LAB_LOG.md`** | the standing anti-drift anchor from the earlier lab phase. |
| **`GOLD_STANDARD.md`** | the hand-curated endorsed Sultan's Game reference (n=20 intros + corpus stats). **The only valid gold arm.** |
| **`TRANSFER.md`** | what transfers from Sultan's Game and what is fiction-bound. |
| **`REFERENCE_SULTANS_RESULTS.md`** | how their result texts are built. |
| **`research/sultans_en/config_merged.json.gz`** | the primary source: shipped official English, 43,619 keys, all 1,495 rites. |
| `agents/` | the four independent writers' prompts and lineages (w1–w4), both rounds. |
| `CHAMPION.txt` | the LAB champion. ⚠️ **Not shipped.** The game uses its own prompts in `src/ai/openai.ts`. |
| `ATT_V3_UNPROVEN.txt` | a closer-rule variant that looked like a win and was **retracted**; kept as a caution. |
| `batch-*.md`, `*_out*.md` | raw generation dumps. Evidence only. |

## What this research concluded
1. **Craft is no longer the bottleneck; premise is.** Our prose now beats the reference
   sentence-for-sentence, and their cards are still more motivating because they are *about*
   something. See the closing note in `COORDINATOR_LOG.md`.
2. **Two rounds of independent prompt-writing produced NO prompt that beat the incumbent.** The value
   was the laws, not the prompts.
3. **The measurement protocol matters more than any single result** — two champion claims were
   retracted this session, one of them mine, both from methodology errors now written into
   `PROSE_METHOD.md` Part 2.
