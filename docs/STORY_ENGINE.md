# Story Engine — Behind the Board

**Status:** Canonical (prototype-2, 2026-06-02). This is the AI machinery that keeps the board alive. It sits **entirely behind** the board described in [DESIGN.md](DESIGN.md) — the player never interacts with it directly. Grounded in the validated v1 `storyGen` prototype (`prototype/src/storyGen/`); this doc says what to keep, what to fix, and how it serves the core game.

Principle inherited from the whole project: **the engine owns numbers, the AI owns flavor.** The AI is asked *what qualities* a job wants and *who* a reward fits — never the DC, the gold, or the odds.

---

## 1. What the engine does (three invisible jobs)

The story engine never presents a "story mode." It works behind the board:

1. **Stocks** the board with quests fitting the fort's capabilities and prestige, cast at the right tier.
2. **Connects** quests — a finished quest can drop its next step back onto the board as a lead; the player chooses to pursue it or let it lapse, so **story length is organic** (driven by pursuit, never an engine beat-count).
3. **Grows** characters — every quest a character touches becomes part of who they are; a strong-hook character becomes the *subject* of quests.

---

## 2. The hidden bible (keep — validated) 🔒

When a story is born, the AI authors its **complete settled truth** up front — a hidden "bible" the player never sees. Because the ending already exists, downstream beats can foreshadow honestly instead of ass-pulling. This is the single most validated idea from v1 and it stays.

Key disciplines that made it work (preserve):
- **Settled truth, told straight — not a mystery.** The bible states what is *actually* true. Mystery is added later by the quest-writer choosing what to reveal.
- **Cast drawn from the pool** (per the tier rules in §3), with new people coined only when no existing character fits a role.
- **Ordinary motives; few secret-bearers.** Most people are exactly what they seem; 1–2 conceal anything, and only when a feeling makes hiding natural. (This replaced the old `want/need/ghost/lie/secret` 5-tuple, which made everyone a workshop construct. Do not bring it back.)

---

## 3. Casting tiers by rarity 🔒

Casting from known characters is the **rare apex, not the default** — this controls both attachment and token cost:

| Rarity | Cast | Purpose |
|---|---|---|
| **Common** | none — generic ("raid an unnamed village") | cheap, mechanical roll for loot; barely needs the AI |
| **Uncommon** | a **new** generated cast | world variety; mints fresh faces |
| **Rare / special** | weaves in **characters you already know** | apex attachment — *deliberately scarce* |

New faces from uncommon quests **persist in the pool** (survivors, notable NPCs, un-killed antagonists). They later get captured, recruited, or brought back in a rare known-cast quest. So the world **populates itself**, and the scarce known-cast peak lands precisely *because* it's rare.

---

## 4. The character record — how depth stays affordable 🔒

A character's depth comes from the chains they've lived through — but you can't feed all their chains into a new quest's prompt (token blowout). So the record stores a **distillation**, and the chains keep refilling it:

- **Stable identity** (born at acquisition; ~never rewritten; *cacheable*): tags (= personality), `who`, short backstory, AI-generated quirks.
- **Living dossier** (updated as chains resolve; **bounded**): the distilled significant events, relationships, and current situation — *which is just the compact summary of the chains they're in*, their main chain plus appearances in others'. Not a separate psychological model.

**Token discipline at generation time:**
- Always feed the **stable identity** for the relevant pool — small and prompt-cacheable.
- Feed the **dossier** only for the 1–3 characters a quest actually develops.
- Feed only a **one-line surface** for the wider "casting pool" the AI picks supporting roles from.

### Characters are story-seeds
A character is self-contained from birth, so the AI can grow a **new** story about them later. When a merc joins, a **main chain** is generated for them (their personal arc), seeded by their record. When that story resolves, it distills back into the dossier, so their *next* chain reads a richer them. This is the recurring-personal-arc engine — the core of attachment. It rides the existing genesis "collision" mechanism (pick the character a spark lands hardest on; anchor the chain to them).

---

## 5. Generation triggers (cost-gated) 🔒

AI story generation is expensive, so it fires only on:

1. A character **becoming a merc** → generate their **main chain**.
2. A **captive** joining → **sometimes** (cost-gated).
3. **Pursuing a lead** → generate the quest (a new chain, the next beat of an existing one, or a generic one-off — per the lead's `chain-info`).

Generation is split across the cycle: the quest **card** (setup) is written at pursuit (Fort Phase); the **outcome** (resolution) is written in the Resolution Phase.

---

## 6. The quest card (fix the v1 weakness) 🔒

v1 cards read unfriendly and "didn't feel like a quest" because the prompt licensed *"vivid and literary"* voice and crammed the job into one oblique prose blob. The fix:

**Structure it** — the job becomes structural, not buried. The card has explicit parts:
- **Situation** — the grounded POV hook (who arrived at the gate, what they say/show). 2–4 short sentences.
- **The job** — one plain line: the concrete action you commit to ("escort the salt barge to Coldfen and bring back the seal"). This is what makes it *feel like a quest*.
- **The ask** — what qualities it wants, in plain fiction, backed by the mechanical tags/attributes the engine reads.
- **Stakes** — the reward envelope, the risk, and the **visible odds** once assigned.

**Fix the voice** — replace "vivid and literary" with **terse, plain, concrete, inviting — graspable in ~10 seconds.** Short sentences; no purple atmosphere; no oblique withholding. The reconciling principle:

> **Mystery lives in the cause, never in the task.** The player may not know *why* the barge matters — but must never be confused about *what they're being asked to do.*

**Keep** from v1: POV-lock (only what arrives at the gate; no omniscient narration), continuity from prior beats, reveal one layer at a time, engine-owns-numbers (no AI numbers in the card).

---

## 7. Individuated resolution (the differentiator) 🔒

The outcome is where "each character does something uniquely their own" must land. The resolver is told the outcome (**success / partial / failure**) and the assigned cast, and must **give each assigned character their own distinct beat, driven by their tags + quirks + dossier — never narrate the party as a blob.** Same terse, concrete, readable voice as the card. Reveals only what the outcome permits; the bible's past truth is immutable — outcomes bend only the future (who now knows what, who reacts, what is set in motion). On failure of a risky quest, the resolver also proposes a **punishment** (injury/debt/liability) within the engine's envelope.

---

## 8. Chains, recurrence, and sagas 🔒-shape

- **Everything is a chain.** A common quest is a 1-beat chain with no follow-up; rarer ones run longer and spawn sequels. There is no separate "chain vs quest" category for the player.
- **Organic length.** A story continues only while the player keeps pursuing its "continue" leads; it ends when it's spent or the player lets it lapse. The engine never forces a beat count.
- **Recurrence & sagas** — the standout magic from v1: a finished chain's loose thread + a cast member seeds the next chain; the dead stay named; a freed captive returns chains later as a witness; a merc's arc runs A → B → C, each richer. This is where attachment compounds. Lift it directly.

---

## 9. Model tiers & latency 🛠

Validated split (keep, revisit model names as they update): a **stronger model** for the prose tiers (bible, card, resolution) and a **cheap fast model** for the mechanical tier (fit-judging). Generation is cost- and latency-bound, so:
- Pre-generate where possible (e.g. draft the next likely card during the Resolution read).
- Background long generations behind a visible "drafting…" affordance — never freeze the UI.
- The batched Resolution Phase fires many resolutions at once; parallelize them.

---

## 10. Prompt engineering — the 5 principles 🔒

Every prompt obeys five principles (and *only* these are principles — everything in §11 is tactical, added only when real testing shows a problem):

1. **JSON / structured output** — schema-validated JSON, prose in string fields, validate→fallback. **Min *and* max length caps** on prose (max is a hard cost guardrail so output can't run away on price).
2. **Cache** — a **byte-stable system prompt** (schema + instructions) so it's prompt-cached; **all variable data goes in the user message** (never interpolated into the system prompt); order stable→volatile to maximize the cached prefix.
3. **Token efficiency** — max caps + **compact inputs** (tags as codes, one-line blocks) + maximize cache hits + **minimize calls** (combine related generation into one call when it shares context/model; split only when a *different model* genuinely pays for itself). *(Do not split into "one responsibility per call" — that multiplies cost.)*
4. **Engine owns numbers** — no numeric fields the AI fills (no DCs, gold, thresholds, values); the AI authors *qualities*, never *magnitudes*.
5. **Right model / effort** — prose tier vs mechanical tier, reasoning-effort per call (§9, AI_PROVIDER).

## 11. Tactical fixes (apply only when testing shows the problem — NOT principles)

Empirical fixes from v1; reach for these when real output misbehaves, don't bake them in pre-emptively:
- **Anti-cliché ban lists** work better than abstract "avoid clichés." Ban concrete tokens (`weight`, `shadow`, `burden`, `fate`, `the spoils`) and title patterns (`The Weight of X`, `Whispers of X`); require concrete proper nouns in titles and hooks.
- **Anti-repetition** — forbid reusing 3-word phrases across a chain's beats; introduce a character by full name once, then first-name only.
- **Cross-story name collision** — pass the names/factions of *other* active stories as "avoid" so parallel chains don't all use "the Grey Crawlers."
- **Voice tiers** — hidden/bible fields are clinical ("state what is"); player-facing card + resolution are vivid-but-terse. Mixing them degrades both.
- **Onboarding** — never leak the hidden trajectory into beat 1. The player is always at their fort discovering a lead with zero context; earn each named character on-stage.

---

## 12. The engine/AI boundary (never cross it)

| Owned by the engine (numbers) | Owned by the AI (flavor) |
|---|---|
| coin count, threshold, outcome, odds | the card, the prose, names, the outcome |
| gold, reward **kind**, drop rates | **which** cast member gets the reward, and how the climax delivers it |
| pacing trigger (which leads appear) | the bible, the why-ladders, the wants |
| fit score → outcome tier | how each character's tags color what they did |

Every AI response is validated against a strict schema + engine constraints; invalid IDs/tags/lengths trigger a fallback, never a crash. This is what keeps the system debuggable and cheap.
