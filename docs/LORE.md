# Lore — the World Graph & Context Retrieval

**Status:** Canonical (validated by a 5-experiment campaign with controls, 2026-06-16; decisions in GENERATION_FLOW §14, §16). **PURPOSE = CONTINUITY**: recurring entities stay consistent with established canon (blind-tested: canon-consistency **1.00 with edge-context vs 0.55 without**). Regions' flavor layer + the "which lore feeds the AI" machinery. Conventions: 🔒 · 🛠 · 🟡.

---

## 1. The graph 🔒

- **LoreNode** — every character / relic / place / faction / chapter / **arc** is a node (chapter and arc = **story nodes**, §1b); **lore is a layer over the same objects** (a character = gameplay Card + LoreNode, one id). Some nodes are lore-only (places, factions, story NPCs, the dead). **Story NPCs stay lore-only until acquired** (captured/recruited/granted as a reward) — at that moment the engine rolls them a full Card (tags/attributes/value). Each node has a **living document** (§1b) + edges.
- 🛠 **2026-07-18 — story-NPC write-back BUILT (engine-side, at chapter CLOSE)**: coined bible cast the player actually MET (`introducedNames`) persist as lore-only character nodes, cap 2/chapter (client > obstacle > ally), blurb = their cast `who` line, plus one memory edge to the chapter's FOCAL (client `party-to`, obstacle `rival-of`, salience 0.5, never core → standard §2 decay forgets them in ~45 cycles unless re-touched). Timing deliberately diverges from a literal §3.3 genesis-time reading: live-chain cast are slate-excluded anyway, and close-time persistence avoids offstage spoilers + abandoned-chapter clutter. Recurrence rides the existing channels (slate reuse-before-coining; §21-3 known-cast promotion — which was starved with an empty pool until this). Name integrity: persisted names are checked against ALL nodes incl. inactive, so a remembered name is never re-rolled onto a stranger.
- **Memory = a typed EDGE, not a node** — `Alex —betrayed-by→ Bob`, annotated with a one-liner + a pointer into the source chain's log. **RelEdge** `{ id, from, to, type, salience 0..1, core?, active, lastCycle, blurb?, sourceChainId? }`.
- **EdgeType is a fixed ENUM** (rival-of · scarred-by · bonded-by · owes · saved-by · kin-of · betrayed-by · served-with · born-in · member-of · captive-of · …) with an explicit **direction convention**: `from` = the state-holder (the betrayed, the debtor, the rescued); symmetric types → alphabetically-first id. *(Validated: enum + convention → 5/5 valid ids, 4/5 direction vs 2/5 without.)*
- **Region seeds**: each region (GENERATION_FLOW §13) ships a tiny fixed seed (name, theme, 1–2 anchors); everything finer — villages, taverns, NPCs — is **emergent lorebook content**: AI-coined, written back, reused (character NAMES are engine-assigned, §4b; places/taverns free). "Location" is a lorebook name, not a mechanical unit.

## 1b. The living document 🔒 *(designer 2026-10-12; GENERATION_FLOW §22-7)*

Every lore node has ONE living document: everything the game knows about it **except what the game already stores** (card name, sex, race, traits, `quirks`; location and wounds are gameplay state). Never duplicate those here.

- **Identity**: fixed keys per kind, only what the game lacks. Character: `nickname` (if any) · `look` (only what traits/race/sex don't already say) · `voice` (how they talk; quirks cover what they do; 🟡 keep?). Relic: none (its `story` is already its description). Place, faction: `description`. Changes **very rarely**: a lasting change (a lost hand, a new nickname) **overwrites a value**. No separate "marks".
- **Blurb**: AI-written, ≤~25 tokens (a character's `who` merges into it). Rewritten only when identity changes, so it stays prompt-cacheable.
- **Brief** (the **short version**): AI-written, ~60–80 tokens 🛠: who it is now and who matters to it, written from its top edges. Rewritten at chapter close.
- **History** (the **past summary**, the node's full text): AI-written, **bounded** (~150 tokens 🛠), what has happened to it, **TOLD only** (player-safe: the sheet and the Library show it; hidden facts stay secrets in the arc until revealed). A character's starts from the told part of their backstory at hire. **Rewritten whole, never appended**, at every chapter close that touched the node.
- **Memories**: the edges (§1, §2), unchanged: the engine's graph for recall, salience and the Chronicle; the AI emits them at every resolution.
- **Arc link**: a mercenary links their **arc node** by an edge (STORY_ENGINE §4); a finished arc stays linked and referenceable. The arc holds the threads, the secrets and the **"so far"** (where the story stands, rewritten at chapter close). There is no "now" on the node: physical state is gameplay state, story state is the arc's.
- **Story nodes (chapter, arc)** 🔒 *(designer 2026-10-12)*: a played chapter and a mercenary's arc are nodes too, so they can be referenced later like a person. Three tiers: **Blurb** (≤~25 tokens) · **Brief** (the short version, ~60–80 tokens 🛠: what happened / where it stands, how it ended, who it left changed; rewritten at the close of any chapter that belongs to it) · **full text** (the **chapter record**; for an arc, the arc itself: past, people, unfinished matters, so far, arc resolution). No separate History: the full text is the history. An **arc's Blurb and Brief are TOLD only** (a secret enters them once a chapter reveals it), so any picker or writer may get them; the arc's **full text** goes only to that mercenary's own arc and chapter calls (STORY_ENGINE §4).

**The rewrite** (one call per chapter close, covering every node the chapter touched): in = identity, the old Brief, the old History, the top edges, the chapter record → out = the new Brief and History, changed identity values, a new Blurb only if identity changed.
**Replaces** (code): `who` → Blurb; `backstory` + `grown[]` + `living` (`engine/dossier.ts`, engine-rendered) → History + Brief. A chapter's own full text stays its **chapter record**.
🟡 **Open**: a node touched only by one-offs never gets a chapter close (recommended: one batched rewrite at cycle end for nodes one-offs touched; or one-offs update edges only).

## 2. How lore changes 🔒

- **Salience & decay**: `effectiveSalience = base × 0.97^(cycle − lastCycle)`. **CORE memories (AI-flagged, importance ≥ ~0.8) are PINNED — never decay** *(required: under an event-flood, decay-all retained 0/9 defining memories; pinning 8/9)*. AI importance ratings are stable (std ~0.054, clean core/mid/trivia separation).
- **Append + SUPERSEDE, never delete** — a betrayal stays true after a later rescue (the relationship is both). **SOFT-DELETE only** 🔒: superseded status edges (captive-of → freed) and below-floor memories flip **`active:false`** — hidden from AI context (token saving, no contradicted facts) but **saved and player-readable** (the Chronicle room). Nothing is ever hard-deleted.
- **Blurb, Brief, History are AI-written, bounded, rewritten whole** (§1b; designer 2026-10-12, supersedes "dossier & blurb are engine-DERIVED"): a bounded whole rewrite is never a growing blob. The rewriter is fed the top-K edges, salience-ranked, not recency-ranked (a 45-cycle-old defining betrayal outranks yesterday's lost bet).

## 3. Retrieval — ≤ 2 LLM round-trips 🔒 *(implementer: batch/join every query)*

1. **Recall** (engine, deterministic, zero tokens): candidates = the focal's edge-neighbors ranked by effectiveSalience (**1–2 hops, no recursive expansion**) + recency + a few seeded thematic wildcards. Each candidate row carries its **edge-relation phrase** ("sibling-of focal; deserted") — that's what lets the selector judge from blurbs.
2. **Selector = the chapter plan's picker** (designer 2026-10-11; no separate call): the picker that already chooses the chapter's cast from the dealt seeds also sees the recalled candidates (each as its **Blurb** + edge-relation phrase: people, relics, places, earlier chapters, arcs) and picks the ones it **wants to know more about** for the story (designer 2026-10-12); the writer gets each picked one's **Brief**. Engine validates ids (strip `id=` echoes, drop unknowns). *(The standalone nano selector, validated F1 0.89 vs feed-all 0.67, random 0.52, is superseded by this merge.)* Its output is **discarded after use** (GAME_STATE §2 producer 3); its effect lives in the saved plan.
3. **Genesis / writer** (ONE call): the **Brief** (the short version) for each picked entry; a mercenary's **History + arc** only in their own opening-up chapter (STORY_ENGINE §4) → the plan **+ write-back folded into the same response** (relevantIds, new entities, new edges — persisted, guarded: both endpoints must resolve).
3b. **Quest writers get no lore dump** 🔒 (designer 2026-10-11). The rule is *when was it known*: anything known at plan time is already worked into the plan, so a chapter's quest writer gets only its part of the plan (the plan is the one source of truth; re-fed lore pulls in matters the plan left out). What only exists after the plan is fed at quest time, short: each **assigned mercenary's gameplay state (a wound) + identity values changed since the plan** (a lost hand). A **one-off** quest (no plan) gets each returning face's blurb only.
4. **Resolution** (ONE batched call, narrative model): narration + new **memory-edges with per-edge blurbs + importance** + injury bands together. It emits edges only; the living documents are rewritten at chapter close (§1b).

## 4. Who writes what 🔒 *(the 3-producer model, GAME_STATE §2)*

Engine: seeded math, edge bookkeeping, salience decay, GC-to-inactive. AI-creative (persisted): bibles, prose, memory-edges (+ per-edge blurbs), living-document rewrites (Blurb, Brief, History, identity values), importance/core flags, room theme-tags. AI-pickers (discarded): the selector (= the chapter plan's picker, §3). Reload re-runs nothing.

## 5. Player-facing 🔒
The **Chronicle room** (FORT §5) exposes the full graph — including inactive history — as the browsable world archive. The **Library** exposes the NPC/lore roster.

## 6. Out of scope 🔒 / Open 🟡
**Parked deliberately:** NO embeddings/vector store, NO agentic tool-use mid-generation (deterministic graph recall + the one selector call cover it at this scale).

Exact K/caps (dossier render size, candidate cap ~14, salience floor) — tune at implementation; edge-type enum finalization; region-seed authoring (content).
