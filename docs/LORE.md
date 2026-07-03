# Lore — the World Graph & Context Retrieval

**Status:** Canonical (validated by a 5-experiment campaign with controls, 2026-06-16; decisions in GENERATION_FLOW §14, §16). **PURPOSE = CONTINUITY**: recurring entities stay consistent with established canon (blind-tested: canon-consistency **1.00 with edge-context vs 0.55 without**). Regions' flavor layer + the "which lore feeds the AI" machinery. Conventions: 🔒 · 🛠 · 🟡.

---

## 1. The graph 🔒

- **LoreNode** — every character / relic / place / faction / saga is a node; **lore is a layer over the same objects** (a character = gameplay Card + LoreNode, one id). Some nodes are lore-only (places, factions, story NPCs, the dead). **Story NPCs stay lore-only until acquired** (captured/recruited/granted as a reward) — at that moment the engine rolls them a full Card (tags/attributes/value). Each node: a **blurb** (≤~25 tokens, stable, prompt-cacheable) + a **dossier** (the living record) + edges.
- **Memory = a typed EDGE, not a node** — `Alex —betrayed-by→ Bob`, annotated with a one-liner + a pointer into the source chain's log. **RelEdge** `{ id, from, to, type, salience 0..1, core?, active, lastCycle, blurb?, sourceChainId? }`.
- **EdgeType is a fixed ENUM** (rival-of · scarred-by · bonded-by · owes · saved-by · kin-of · betrayed-by · served-with · born-in · member-of · captive-of · …) with an explicit **direction convention**: `from` = the state-holder (the betrayed, the debtor, the rescued); symmetric types → alphabetically-first id. *(Validated: enum + convention → 5/5 valid ids, 4/5 direction vs 2/5 without.)*
- **Region seeds**: each region (GENERATION_FLOW §13) ships a tiny fixed seed (name, theme, 1–2 anchors); everything finer — villages, taverns, NPCs — is **emergent lorebook content**: AI-coined, written back, reused (character NAMES are engine-assigned, §4b; places/taverns free). "Location" is a lorebook name, not a mechanical unit.

## 2. How lore changes 🔒

- **Salience & decay**: `effectiveSalience = base × 0.97^(cycle − lastCycle)`. **CORE memories (AI-flagged, importance ≥ ~0.8) are PINNED — never decay** *(required: under an event-flood, decay-all retained 0/9 defining memories; pinning 8/9)*. AI importance ratings are stable (std ~0.054, clean core/mid/trivia separation).
- **Append + SUPERSEDE, never delete** — a betrayal stays true after a later rescue (the relationship is both). **SOFT-DELETE only** 🔒: superseded status edges (captive-of → freed) and below-floor memories flip **`active:false`** — hidden from AI context (token saving, no contradicted facts) but **saved and player-readable** (the Chronicle room). Nothing is ever hard-deleted.
- **Dossier & blurb are DERIVED** — a bounded top-K render over (stable identity + salience-ranked memory-edges), re-rendered when memories change. Never a growing blob; salience-ranked, not recency-ranked (a 45-cycle-old defining betrayal outranks yesterday's lost bet).

## 3. Retrieval — ≤ 2 LLM round-trips 🔒 *(implementer: batch/join every query)*

1. **Recall** (engine, deterministic, zero tokens): candidates = the focal's edge-neighbors ranked by effectiveSalience (**1–2 hops, no recursive expansion**) + recency + a few seeded thematic wildcards. Each candidate row carries its **edge-relation phrase** ("sibling-of focal; deserted") — that's what lets the selector judge from blurbs.
2. **Selector** (gpt-5-nano; only if candidates > ~8): picks the ~3–4 ids needing **full dossiers**; engine validates ids (strip `id=` echoes, drop unknowns). *(Validated F1 0.89 vs feed-all 0.67, random 0.52.)* Its output is **discarded after use** (GAME_STATE §2 producer 3).
3. **Genesis / writer** (gpt-5-mini, ONE call): full dossiers for the picked + blurbs for the rest → the bible **+ write-back folded into the same response** (relevantIds, new entities, new edges — persisted, guarded: both endpoints must resolve).
4. **Resolution** (ONE batched call, narrative model): narration + new **memory-edges with per-edge blurbs + importance** + injury bands together. **The AI never writes the dossier directly** — it emits edges; the **engine renders** dossier & blurb from (stable identity + top-K salience-ranked edges) per §2.

## 4. Who writes what 🔒 *(the 3-producer model, GAME_STATE §2)*

Engine: seeded math, edge bookkeeping, salience decay, GC-to-inactive, **dossier/blurb rendering**. AI-creative (persisted): bibles, prose, memory-edges (+ per-edge blurbs), importance/core flags, room theme-tags. AI-pickers (discarded): the selector. Reload re-runs nothing.

## 5. Player-facing 🔒
The **Chronicle room** (FORT §5) exposes the full graph — including inactive history — as the browsable world archive. The **Library** exposes the NPC/lore roster.

## 6. Out of scope 🔒 / Open 🟡
**Parked deliberately:** NO embeddings/vector store, NO agentic tool-use mid-generation (deterministic graph recall + the one selector call cover it at this scale).

Exact K/caps (dossier render size, candidate cap ~14, salience floor) — tune at implementation; edge-type enum finalization; region-seed authoring (content).
