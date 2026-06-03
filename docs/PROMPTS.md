# Prompt Reference — example prompts (production-close)

**Status:** Working reference (prototype-2, 2026-06-04). These are the actual prompts to start the prototype's AI layer from — **validated against `gpt-5-mini` / `reasoning_effort:low`** with the real tag vocabulary. They obey the 5 principles in [STORY_ENGINE.md](STORY_ENGINE.md) §10 (JSON · cache · token-efficiency · engine-owns-numbers · right model). Tune them in play; the schemas + the disciplines below are the load-bearing part.

> **Structure of every call:** a **byte-stable system prompt** (the schema + rules + tag vocab → prompt-cached) + a **short variable user message** (the specific data). Never interpolate variable data into the system prompt.

---

## Shared: the tag vocabulary block 🔒
Tags are **fixed IDs we author — the AI never invents them.** Paste this block verbatim into any system prompt whose output references tags (card-ask, chain-beat). Listing **full IDs with prefix** is required — grouping under a bare prefix makes the model drop the prefix (validated bug).

```
TAG VOCABULARY — use ONLY these exact ids (with prefix); NEVER invent or shorten:
  bg:soldier bg:peasant bg:hunter bg:sellsword bg:beggar bg:sailor bg:scholar bg:priest bg:smith
  bg:noble-bastard bg:former-captive bg:outlaw bg:deserter bg:cutpurse bg:wandering-monk bg:apothecary
  temp:brave temp:cautious temp:reckless temp:hot-tempered temp:nervous temp:patient temp:methodical
  pers:greedy pers:cynical pers:proud pers:suspicious pers:cowardly pers:superstitious pers:charming
  pers:stoic pers:loyal pers:melancholic pers:vengeful pers:kind pers:zealous pers:honorable pers:ruthless
  phys:muscular phys:very-muscular phys:quick phys:very-quick phys:scarred phys:frail
  race:human race:wolfman race:elf race:lizardman   gender:male gender:female
```

---

## Call 1 — Card + Ask (one-off quest)

**System** (stable)
```
You write ONE mercenary-fort job card for a grimdark, low-medieval world, plus its assignment ask.
Output JSON only:
{ "situation": "<=40 words: who brings the job to the company's gate and the concrete problem. POV: only what arrives at the gate; no off-scene narration",
  "job": "one line: the concrete action the company commits to",
  "ask": {
    "attribute": "one of physical|agility|intelligence|charisma|willpower (the attribute this job mainly tests)",
    "favoredTags": ["0-3 tag ids, copied EXACTLY from the vocabulary including the prefix"],
    "slots": ["one per party slot, each EITHER the string \"open\" OR \"tag:\" + an exact vocab id"]
  } }
<TAG VOCABULARY block>
RULES: terse, plain, concrete. State the job so the player knows exactly what taking it commits them to. NEVER write numbers (no gold, difficulty, counts). slots length must equal the SLOT COUNT given. JSON only.
```
**User** `Archetype: <x>\nLocation: <x>\nSlot count: <N>\nThe job results in <reward seed>.\nWrite the card + ask. JSON only.`

**Validated output** (capture / 2 slots):
```json
{ "situation": "A gaunt warrener hobbles to the gate, furious, reporting a local poacher is stealing from the lord's warrens at Saltreach and that the man is still in the fen hamlet.",
  "job": "Track down the poacher in Saltreach, seize him alive, and deliver him bound to the warrener.",
  "ask": { "attribute": "agility", "favoredTags": ["bg:hunter","temp:cautious"], "slots": ["tag:bg:sellsword","tag:phys:quick"] } }
```
*(parley/3 → `charisma`, favored `["bg:priest","pers:charming","temp:patient"]`, slots `["tag:bg:priest","tag:pers:charming","open"]`.)*

---

## Call 2 — Resolution / Outcome

**System** (stable)
```
You narrate the result of a mercenary job the company ALREADY ACCEPTED, then name any captive taken.
Given: the JOB CARD, the PARTY sent (each merc + their tags), the OUTCOME, and the DELIVERED captive's tags (if any).
Output JSON only:
{ "beforeRoll": "<=35 words: this party arrives at this job and sets to it; do NOT hint the result",
  "afterRoll": "<=60 words: what happened, per the OUTCOME. EACH named merc gets their own beat, true to their tags",
  "captive": { "name": "string", "who": "one line, fits the captive tags" } }
OUTCOME MEANINGS: SUCCESS = clean, captive taken. PARTIAL = taken but at a COST you must SHOW (a wound / a complication / lesser haul). FAILURE = captive NOT taken; a consequence lands (set captive to null).
TAG CUES: phys:muscular=force, phys:quick=speed, temp:cautious=care, temp:brave=front, bg:soldier=discipline, bg:peasant=grit. Read each merc's tags and act them.
RULES: continue FROM the card (same people/place). Terse, concrete, low-medieval. NEVER write numbers. JSON only.
```
**User** `JOB CARD:\n situation: …\n job: …\nPARTY SENT:\n <Name> [tag, tag, …]\n …\nDELIVERED CAPTIVE TAGS: [..]\nOUTCOME: SUCCESS|PARTIAL|FAILURE\nNarrate, continuing from the card. JSON only.`

**Validated** — the three outcomes come back cleanly differentiated:
- *SUCCESS*: clean capture, each merc individuated, captive fleshed.
- *PARTIAL*: **shows the cost** — *"Marek … took a deep blade gash to his forearm … warrens' hares were flushed and lost"* — captive still taken.
- *FAILURE*: `"captive": null` + a consequence — *"the poacher slips the fen and is gone; the warrener leaves enraged."*

---

## Call 3 — Character flesh (engine rolled the tags; AI only writes to fit)

**System** (stable)
```
You give a freshly-acquired character a name and a face. Their TAGS and ATTRIBUTES are FIXED (already rolled by the game) — you do NOT add, drop, or change tags; you write prose that FITS them.
Output JSON only:
{ "name": "low-medieval given+by-name (Germanic/Celtic/Slavic register)",
  "who": "one line — their public 'known for'",
  "backstory": "<=45 words — where they came from + one concrete detail or wound, consistent with every tag",
  "quirks": ["1-2 short concrete habits"] }
RULES: every word must be consistent with the given tags (a pers:cowardly is never 'fearless'; a bg:priest is not a thief). High attributes read as natural giftedness, not loot. Terse, concrete, grimdark. NEVER write numbers. JSON only.
```
**User** `TAGS: <ids>\nATTRIBUTES: physical X, agility X, …\nACQUIRED AS: <context>.\nJSON only.`

**Validated** — `outlaw/cautious/quick/scarred` → *"Ivo Wulfson … crescent scar … fingers a hidden blade … favors hedges and shadowed ditches."* `noble-bastard/charming/proud` → *"Adeliza Greyborn … courtly graces and sharp lies … keeps a frayed lord's ribbon braided in her hair."* Every quirk traces to a tag.

---

## Call 4 — Chain beat (the story path)

**System** (stable)
```
You write the NEXT quest card in a HIDDEN story for a grimdark mercenary-fort game.
Given the hidden BIBLE (settled truth — the player NEVER sees it) and the CHAIN STATE (what the player already knows). This beat surfaces AT MOST ONE new layer of the truth.
Output JSON only:
{ "situation": "<=45 words — what arrives at the gate (petitioner/body/rumor). POV-LOCKED: only what the company can see or hear; reference what they already learned",
  "job": "one line — the concrete action the company commits to this beat",
  "ask": { "attribute": "physical|agility|intelligence|charisma|willpower", "favoredTags": ["0-3 exact vocab ids"], "slots": ["one per slot: open OR tag:<vocab id>"] },
  "proposedReward": "<=12 words — the loot this beat plausibly yields; the GAME sets its value",
  "newLayerRevealed": "<=15 words — the ONE new fact the player learns on success (writers-room note)" }
<TAG VOCABULARY block>
KEY RULE: the ASK and proposedReward must fit the MUNDANE SURFACE the player perceives, NOT the hidden truth. Prefer "open" slots; only require a tag the surface job plainly needs. Only newLayerRevealed may touch the buried truth.
RULES: state the JOB plainly; keep the WHY hidden (mystery in the cause, never the task). Terse, concrete. NEVER write numbers. JSON only.
```
**User** `HIDDEN BIBLE: …\nCHAIN STATE: …\nREGION: …\nSLOT COUNT: <N>\n<beat constraint>. JSON only.`

**Validated** (Anneliese bible, beat 1) — the bible unspools into a deniable opener:
```json
{ "situation": "A shaken woman at the gate claims dispossessed status and begs shelter, clutching a sealed leather pouch; she pleads for quiet help with creditors and a ride to a friend's safehouse.",
  "job": "Offer her shelter, verify her story discreetly, and escort her safely to the safehouse.",
  "ask": { "attribute": "charisma", "favoredTags": ["bg:noble-bastard","gender:female","pers:melancholic"], "slots": ["open","open"] },
  "proposedReward": "small purse of coin and a grateful patron's promise",
  "newLayerRevealed": "She carries an original charter and a private signet." }
```

---

## Call 6 — AI selects a character's concept tags (from the fixed vocab)

When the AI *invents* a character whose mechanics must match its narrative (a bible's supporting cast, or a thematic reward like "a captured knight"), it selects the **concept-defining tags from the fixed vocabulary** — the engine then rolls the *rest* of the bag + the tiers to the value budget (ECONOMY.md). The AI never invents a tag; the engine owns value/tiers/filler.

**System** (stable)
```
You invent a character for a grimdark mercenary-fort world and choose their concept tags. Tags are a FIXED vocabulary — you may ONLY choose from it; never invent, shorten, or alter an id.
Output JSON only: { "name": "low-medieval name", "who": "one line", "tags": ["chosen ids"] }
<TAG VOCABULARY block>
MUTEX — choose AT MOST ONE id from each group: gender:* , race:* , bg:* , temp:* . (pers:* and phys:* may stack.)
RULES: bg:* is the character's PROFESSION/ORIGIN, not their current state (being captured is a role, not a tag). Always set a gender:*. Choose the few tags that DEFINE the concept (a brutal reaver = pers:ruthless/phys:scarred, never pers:kind); the engine adds the rest. JSON only.
```
**User** `CONCEPT: <description>\nJSON only.`

**Validated** — `meek dispossessed noblewoman` → `["gender:female","race:human","bg:noble-bastard","temp:cautious","pers:proud","pers:charming","phys:frail"]` (valid ids, mutex respected, concept matched). *Tuning learned:* a "captured knight" was mis-tagged `bg:former-captive` (the event) instead of `bg:soldier` (the profession) — hence the explicit `bg:* = profession not state` rule above.

---

## Call 5 — Chain genesis (the bible) — validated earlier
Engine passes the focal character(s)' rolled tags + a spark + the cast pool + region; the AI authors the hidden settled-truth bible (situation, why-ladder, invented supporting cast, vague direction, intended climax). Validated by the focal-bible test (produced *Anneliese Varg of Kovar*, a coherent grimdark arc). The bible is **clinical voice** (state what is); cards/outcomes are **vivid-but-terse**.

---

## Implementation notes (learned during validation) 🛠
1. **Tag IDs must be listed with full prefix** in the vocab block, and the AI told to copy exactly — else it drops prefixes (`hunter` instead of `bg:hunter`). Slot reqs come back as `"tag:bg:hunter"` (`"tag:" + id`); parse accordingly.
2. **Size `max_completion_tokens` for reasoning overhead** — gpt-5 reasoning models spend tokens *before* output; a 700 cap silently truncated to empty. Use ~1500–2000 for prose calls; keep the **prose max-cap in the schema** (word limits) as the real cost guardrail.
2b. **Caching has a floor: OpenAI only prompt-caches prompts ≥1024 tokens.** *Measured:* the card-ask prompt is **393 tokens → `cached_tokens=0`** on identical calls. So the small frequent calls (card-ask, outcome, flesh) **do not cache — and shouldn't be padded to force it** (net-negative; 393 tokens is already ~nothing). Caching kicks in on the **large** calls (genesis/finale, ≥1024 tokens), where the stable prefix (vocab + disciplines + cast identity) caches at ~10×. **Structure for caching everywhere (stable prefix first), but only expect — and always *verify* via `usage.prompt_tokens_details.cached_tokens`, never infer from latency.**
3. **Define outcome semantics in the prompt** (SUCCESS/PARTIAL/FAILURE) or PARTIAL reads like a win.
4. **Surface-vs-truth**: a beat's *ask + reward* must fit the mundane surface; only the writers'-room `newLayerRevealed` may touch the bible — else the ask leaks the secret (and can make the beat unpursuable by requiring a rare tag).
5. **Validate → fallback** every response against a zod schema; tag IDs validated against the vocabulary.
5b. **Token shape — grouped suffixes (production optimization; prototype keeps full IDs).** The vocab block currently lists full IDs (`bg:hunter`) so the model copies them verbatim — but that pays the `bg:`/`pers:` prefix tokens on *every* call. Cheaper: list **bare suffixes under a one-time category header** and **re-attach the prefix at parse time**:
   ```
   gender: male female
   bg: soldier hunter peasant criminal merchant ...
   personality: brave cowardly honest deceitful ...
   skill: weapon stealth magic-fire ...
   ```
   The AI returns `"hunter"`; the engine knows the group → `bg:hunter`. Needs **globally-unique suffixes**. Works because **the parser must normalize tag output anyway** (strip any prefix, lowercase, map suffix→canonical id, reject unknowns) — so the prompt is free to use the cheap form, and the grouping doubles as the **mutex** signal. *General principle: treat prompt token-shape as a first-class optimization; robust output-normalization is what lets you use the cheapest format.*
   **VALIDATED 2026-06-04:** real call returned bare words (`["hunter","stealth","criminal"]`), the engine re-attached prefixes unambiguously, and the prompt dropped **393→321 tokens (~18%)** with no quality loss. So it's safe to use even in the prototype (full-ID form is only marginally simpler).
6. Anti-cliché ban lists etc. (STORY_ENGINE §11) are **tactical** — add only if real output drifts; not in the base prompts.
