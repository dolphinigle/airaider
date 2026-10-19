# Experiment log — getting a FEEL for bible generation (real AI)

Runner: `prototype/src/storyGen/_expBibleFeel.ts` (real `buildBible` over the 18-char Mireford pool + seed bank). Full prompts/responses in `prototype/logs/llm-calls.jsonl`. Goal: read bibles as a reader, find what works / what's flat, iterate the prompt. **Don't over-spec.** Zoom out periodically.

## Baseline = current `BUILD_SYSTEM` / `GENESIS_SYSTEM` (the FOCUS-validated prompt)

### Round 1 — (findings appended below as runs complete)

**R1 (baseline, 3 seeds — final-draught/salt-and-candles/drag-back-savior):**
- Baseline prompt produces strong, character-driven bibles. `salt-and-candles` (uncommon) exemplary: two wounded people (Iselle/smuggler-with-a-dark-childhood-vow, Gideon/quartermaster-atoning-for-a-fatal-miscount) collide over one lit house. Why-ladders concrete, terminate in a wound/vow. `conceals` emergent + sparse (smuggler & abbess conceal; investigator does not).
- `drag-back-savior` (rare): 5 cast, concrete tensions (vow vs contractual duty; quiet vs public spectacle; the leak network).
- ✅ Depth scales with stakes (uncommon→3 cast, rare→5). The "→ why?" ladder format renders well.
- ⚠️ FINDING: `tensions` object SHAPE is inconsistent across runs — `{who, over, plainReason}` vs `{between, why}`. Schema union allows it; either constrain to ONE shape or a plain string "A wants X, B wants Y, because Z" (matches the concrete-conflict goal + stable rendering).
- The earlier "notched-coin felt abstract" reads as variance, not a design flaw — baseline is good.
- NEXT: survey the full seed bank (breadth) + a legendary (ensemble depth); then test a tension-shape tweak.

**R2 (baseline, full 14-seed bank):** 13 ok, 1 FAILED.
- ✅ Cast scales (uncommon 2-3, rare 4-5, legendary 5); why-bullets deep (rare ~26-30, legendary 34). `carried-the-fever` legendary = strong ensemble (matches GOLDEN).
- 🔴 `tensions` shape is CHAOS — 8 different key-sets across runs (`{between,reason}`,`{who,why}`,`{what,who}`,`{over,plainReason,who}`,`{between,over,reason}`…). And `salt-and-candles` **FAILED = `invalid_union`** → the loose `z.union([string, record])` both causes inconsistency AND crashes. TOP FIX.
- 🟡 Cast concentration HIGH: Marek 9/14, Halvern 7/14, Roselle 6/14. coined=0 everywhere — model recasts the same ~6 pool people. Small-pool artifact (18 chars); real game grows the pool (recurrence=attachment), but worth watching: genesis gravitates to a few "protagonist-shaped" chars. Variety = bigger pool or more coining.
- R3 NEXT: constrain `tensions` → plain string "A wants X; B wants Y; because Z" (fixes chaos + the invalid_union crash + pushes concreteness). Regenerate the failed seed + chaotic ones.

**R3 (tension-shape fix — string-only "A wants X; B wants Y; because Z"):** 4/5 ok.
- ✅ CLEAR WIN. Tensions now consistent, concrete, named-people strings. No object-shape chaos, no abstract labels, no invalid_union. KEEP THIS.
- 🔴 `same-grave` still FAILED — but on `too_small` (a cast string under min length), NOT tensions. Root cause: **`callJson` does `schema.parse()` with NO retry** — any single short field / stray shape crashes the entire bible (~1/5 here). Shipping hole: a chain just dies.
- R4 NEXT: add ONE schema-failure retry to `callJson` (re-ask with the validation errors), measure the new failure rate over a batch.

**R4 (tension-fix + callJson retry — 7 seeds):** 7/7 ok, **0 crashes, 0 retries needed**.
- `same-grave` (failed twice in R2/R3) passed first-try → those were intermittent variance; retry is insurance for the ~1/5 that miss.
- Tensions concrete & consistent across all 7. Both R3+R4 changes are KEEPERS.
- 🟡 Cast concentration persists: Marek in most bibles (small 18-char pool; he's the most protagonist-shaped). Prototype-acceptable; real game grows the pool. coined still ~0 — model always finds a pool fit. (Not chasing now — pool/engine concern, not bible-prompt.)

## Zoom-out (after 4 rounds)
Bible design is SOUND and reliably character-driven. Two concrete wins applied (concrete-string tensions; one-retry callJson). Bible half ≈ done for a "feel". NEXT: exercise the **quest-writer** (full chain playthrough) — does Beat 1 make you care, reveal one layer/beat, land a climax? This feeds the QUEST_WRITER doc.

## Quest-writer (R5 — full chain playthroughs: salt-and-candles uncommon, carried-the-fever legendary)
- ✅ Reveal cadence GOOD: POV-locked (only what arrives at the gate), one layer/beat, escalating (crate → steady schedule → harbour-master's ledger).
- 🔴 **Attachment principle MISSING.** Beat 1 = a job (intercept crate / serve arrest writ), never the iter-H "low-stakes shared moment → make you CARE about a person first." Plot pressure starts at Beat 1. This validated principle is NOT in the live QUEST_WRITER_SYSTEM.
- 🔴 **Long chains REPETITIVE.** Legendary became 5× "produce another witness to the docket." No beat-function variety.
- 🔴 **Driving hook hijacks the chain.** A procedural `active` hook (Marek's docket) sidelined the emotional core (Iselle/Abbess off-stage till finale); the rich cast went unused. Hook choice + keeping the emotional cast on-stage matters.
- (runner artifact) resolver invents party members when not given real mercs — fine; in-game pass the assigned party.
- R6 NEXT: add the attachment principle + beat-variety to QUEST_WRITER_SYSTEM; re-run a chain; compare.

**R6 (quest-writer + attachment & beat-variety rules — same 2 chains):**
- ✅ `salt-and-candles`: Beat 1 now opens on ISELLE herself (bowl of stew, lavender shawl, perching afraid to leave) — we meet the emotional core as a PERSON before any job; finale she carries a child in. Cast on-stage throughout. Attachment principle WORKS.
- 🟡 `carried-the-fever` (legendary): emotional cast now appears (Sister Helle at the gate, human detail) — improvement — BUT Beat 1 still opens procedurally (magistrate warrant) and quay-cordon repetition persists. CAUSE: the **driving hook is procedural** (`drivingHookOf` picked the magistrate/docket `active` hook) and it overrides the attachment rule.
- ⇒ LAST LEVER: **driving-hook selection.** A procedural entry hook → procedural chain. Fix idea: prefer a CHARACTER-facing active hook (one naming a cast member's want), or force Beat 1 to anchor on a cast member regardless of hook.

## Zoom-out (after 6 rounds)
Design is in good shape. Bible: solid (+2 fixes kept). Quest-writer: reveal cadence good; attachment works; beat-variety improved. Remaining lever = **driving-hook choice** (procedural hooks sabotage attachment + breed repetition), and **long-chain pacing** (legendary sprawls). These + the seed bank are the substance for QUEST_WRITER.md / SEED_BANK.md.

**R7 (spectrum confirm — kin-at-the-fort vs mute-witness, all fixes live):**
- ✅ `kin-at-the-fort` (character-facing): Beat 1 human (petitioner at gate); emotional kin (Brann) lands at finale.
- 🟡 `mute-witness` (investigation): procedural entry (Jorun hires) → Beat 1 a job; the mute witness (emotional core) never anchors. The procedural ENTRY beats the attachment rule.
- ROBUST FINDING (7 rounds): Iselle/Marek dominate petitioner/protagonist slots — 18-char pool → 2-3 chars carry most chains. Cast variety needs a bigger pool or more coining (engine/pool concern, not bible prompt).
- KEY PRINCIPLE: attachment is easy when the emotional core COMES TO YOU; hard when it's a CONCEALED truth you investigate. R8: force Beat-1 to anchor on a core cast member-as-person even in investigation chains.

**R8 (Beat-1 anchor even for investigation — mute-witness):**
- ✅ WORKS. Beat 1 now opens on Brann Olwyn (shaking hands, refolding a linen square, pleading) reporting the mute stablehand — a caring human anchor, not Jorun's cold writ. Investigation chains can now attach.
- 🟡 NEW structural finding: every beat is framed "someone ARRIVES AT THE GATE" (POV-lock side-effect). Content varies; STRUCTURE repeats → long chains feel samey. Lever: allow beats that are NOT gate-arrivals (the company goes somewhere / a scene unfolds where they are) while keeping POV-lock.

---

# SYNTHESIS — 2h experiment, getting a feel (8 rounds, real gpt-5-mini)

## Bible (GENESIS + BUILD): SOLID — ship it
- Reliably character-driven: concrete why-ladders to a wound, emergent `conceals` (sparse, correct), real inter-character conflict. `salt-and-candles` / `carried-the-fever` are genuinely good.
- **Fixes applied & kept** (in `chainGen.ts` / `ai.ts`):
  1. `tensions` → **concrete string** `"A wants X; B wants Y; because Z"` (was object-shape chaos + `invalid_union` crashes).
  2. `callJson` **one schema-failure retry** (was ~1/5 crash on a stray short field).
- Depth scales with stakes (works). 
- ⚠️ Cast concentration: 18-char pool → Iselle/Marek carry most chains. Variety = bigger pool / more coining (engine/pool, NOT the bible prompt). coined≈0 always.

## Quest-writer: reveal solid; attachment fixed; 3 levers remain
- Reveal cadence (POV-lock, ≤1 layer/beat, escalation) = solid.
- **Fixes applied & kept** (`QUEST_WRITER_SYSTEM`):
  3. **Attachment-first + beat-variety + use the emotional cast.**
  4. **Beat-1 anchors on a core person even in investigation chains.** → Beat 1 now warms you to a person (Iselle's stew; Brann's shaking hands) instead of a logistics task.
- REMAINING LEVERS (for QUEST_WRITER.md / engine):
  - (a) **Driving-hook selection**: `drivingHookOf` grabs the first `active` hook; a procedural one skews the whole chain. Prefer a character-facing hook (genesis could mark the emotional entry).
  - (b) **Structural sameness**: every beat = "someone arrives at the gate." Allow non-gate-arrival beats (company travels / a scene where they are), keeping POV-lock.
  - (c) **Legendary pacing**: 6 beats sprawl/repeat; prefer fewer weightier beats or per-beat function targets.

## Seed bank
- 14 prototype seeds → varied, believable collisions; the spark reliably lands on pool chars. Polti-anchor + stakes-tag works.
- **Attachment spectrum** (key for SEED_BANK.md): seeds where the emotional core COMES TO YOU (a petitioner) attach naturally; concealed-truth/investigation seeds rely on the Beat-1-anchor rule. Tag seeds by this.

## Recommended next (post-experiment)
- Write **QUEST_WRITER.md** (POV-lock, reveal ≤1 layer, attachment-first incl. investigations, vary beat function + allow non-arrival beats, keep emotional cast on-stage, climax detection, driving-hook guidance).
- Write **SEED_BANK.md** (seed = abstract spark; Polti anchor; tag by situation/stakes/emotional-core + attachment-spectrum; weighted anti-repeat selection; scale-up plan).
- Engine: character-facing driving-hook selection; grow pool / coin for cast variety.
- 4 code changes already live in `chainGen.ts` + `ai.ts` (tension-string schema+prompt, callJson retry, attachment/variety rules, investigation Beat-1 anchor) — review before keeping.

**R9 (final confirmation, fresh seeds empty-prayers + creditor-at-grave, all fixes):** 0 crashes.
- `empty-prayers` Beat 1 opens on the Abbess as a sleepless woman kneeling with a tin cup (attachment ✓). Closings character-resonant. Fixes generalize.

## 2h run closed. Code changes live in chainGen.ts + ai.ts (review before keeping). Throwaway runners: prototype/src/storyGen/_expBibleFeel.ts, _expChainFeel.ts. Full prompts/responses: prototype/logs/llm-calls.jsonl.
