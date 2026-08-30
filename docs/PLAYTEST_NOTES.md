# PLAYTEST NOTES — the inbox

**This is an INBOX, not law.** Things the designer noticed while playing, written down verbatim so
they are not lost. **Nothing here has been acted on, investigated, or agreed.** Triage happens
later, together: each note gets a ruling, then either a docs change, a task, or a "won't fix".

Keep adding. One note per observation, newest at the bottom.

**Status key:** 🆕 untriaged · 🔍 triaged, needs a decision · ✅ ruled · ❌ won't fix

---

## N1 🆕 Lead-hunt leads should spawn something generic, not a specific quest

> *"Lead-hunting leads should just spawn something thats more generic instead of a specific quest,
> makes no sense."*

**Context, for triage (not a diagnosis — nobody has looked properly yet):** a `lead-hunt` is a
standing lead on the board that reads as *"sweep the region for rumours worth chasing"*. Pursuing it
runs the ordinary one-off pipeline, so it gets a **bespoke written quest card** like any other job,
and on a non-failure resolution the engine grants 1–2 fresh leads (`🧭 The sweep pays: 2 new lead(s)`).

The oddness the designer is pointing at: a *generic sweep for rumours* is being dressed as a
*particular dramatic situation*, which it isn't.

**Open questions for triage:** should a lead-hunt bypass card generation entirely (a mechanical
action with no AI call)? Or keep a card but a deliberately generic one? What does it cost the player
— does it still take soldiers and a cycle? And does the answer change now that routine one-offs are
one sentence anyway?

---

## N2 ✅ Saga cards use their people with no introduction — from the very first card

> *"for quest chains: the game uses the characters without introduction even at start (pls find the
> corresponding quest chain and quest: 'look the ford over for Adeliza'). no context so no idea
> whats going on"*

**Found it.** `chain-53` — *"Three Fragments at the Ford"*, a captive saga, beat 1 of ~4, quest `q54`,
gravity *a grave affair*. Live in the designer's game (seed 230593368, cycle 5).

**The card as the player read it:**

> **Look the ford over for Adeliza**
> Ermina meets you at the river ford and holds out a broken cord from the reliquary. She says she
> will take Adeliza at the ford and wants her brought there. She found fresh footprints and a torn
> ribbon snagged on the low beam by Bracken Beam. The pay is fixed, and what else the job shakes
> loose the company keeps. They say the one at the heart of this would fetch a ransom worth a season
> of contracts.

Four proper nouns land unintroduced in three sentences — **Ermina**, **Adeliza**, *the reliquary*,
**Bracken Beam** — and the card never says who either woman is, what the reliquary is, or why the
company should care. It opens mid-conversation with strangers.

**The sharp part, for triage: the bible HAS the answers and they did not reach the card.**

```
Ermina  — "A riverside steward who claims a stolen reliquary and will meet at the ford."
Adeliza — "An entertainer and light-finger who has been moving through the Western Forests."
kernel  — "Ermina hires the company to seize Adeliza. The hunt draws out three enemies who
           hold a split vault key and must be forced to meet."
```

So this is not a generation gap — it is an introduction gap. Both `who` lines are one clause each
and would have fixed the card.

**There is already a rule that this card breaks** (saga card prompt, ABOVE ALL rule 3): *"First use
of any person, place, or thing — the client included — is introduced by a FULL sentence in which they
DO something in this matter… a card whose reader cannot say who hires them, what the matter is, why
it matters, and why it takes hired steel has failed."* The rule exists and did not fire.

**Open questions for triage:**
- Is the fix prompt-side at all? The rule is already written and was ignored — this repo's own
  measurements say wording is the weakest lever, so a fifth restatement is unlikely to work.
- Should the ENGINE deal the cast's `who` lines to the beat-1 writer as a dealt fact, the way it
  deals other things it insists on? (Does it already? Nobody has checked.)
- Beat 1 has a documented special job — *"the player's FIRST sight of the saga — a cold reader gets
  the hook and its WHY"*. Is beat 1 failing specifically, or do all beats do this?
- Related and possibly the same root: *"the one at the heart of this would fetch a ransom"* — the
  card's closing line refers to a person it never named.

### ✅ FIXED 2026-08-27 — and the fix was the INPUTS, not the rules

Full working: `v3/scripts/prosebench/INTRO_COHERENCE.md` (can it be prompted? measured: no),
`ROUND1_PROMPT_AUDIT.md` and `ROUND2_3_INPUT_SHAPING.md` (nine blind Opus writer-reports), against
the target in `docs/CARD_GOLD_STANDARD.md`.

**The principle has a name.** The **known-new contract**, and its article rule, the **anaphoric
chain**: a first mention takes an INDEFINITE reference, later mentions definite ones. A proper noun
is inherently definite, so *"Ermina meets you at the river ford"* tells a first-time reader they
already know her. A presupposition failure, not a style preference — and the designer's own
hand-written Sultan sample obeys it exactly (*"A female craftsman who calls herself an inventor…"*,
the name arriving only in the result).

**Prompting it does not work.** 2×2 over three real captured prompts, run twice: the rule's effect
on unexplained proper nouns reversed sign between runs. Consistent with §0/L18 — wording is the
weakest lever this project has.

**What did work, in order of how much:**

1. **The engine deals what the writer was inventing.** `stakeIfLost` (what BREAKS if this fails,
   carrying its mechanism), `standsAgainst` (who is already known to oppose it), `arrival` (how it
   reached the fort), `clientTell` (one physical habit). Two were named unprompted by the blind
   writers; one writer, handed a written stake, said *"the one question cards usually lose is the
   one the input handed me pre-written."*
2. **The payload stops dealing what nobody could use** — `rarity`, the beat-1 place suggestion, the
   second lore entry, `relationPhrase`, `loreId`, `focalName`, and the stake rumour that was pasted
   35/36 times while naming no one.
3. **The rule, restated positionally** — the card never opens on a name; its first words say what
   someone IS; whatever you call them first you call them every time.

**Five live-capture rounds fixed five defects the change itself introduced**, each found by reading
real cards: a sticky example collapsing every trade to "steward"; my own pre-shaped `standsAgainst`
string pasted on 6/6 cards; the tell welded to the pay; a bare-name regression caused by
over-stressing the article rule; and the card switching to an unintroduced name three sentences in.

**Two things this did NOT fix, both for the designer:**
- **The stake rumour is now suppressed whenever `stakeIfLost` exists** (`STAKE=1` forces it back).
  The A/B that shipped the rumour measured it against NOTHING; it has never been measured against a
  real why.
- **Beat 1 is structurally a travel-and-ask errand** (genesis: *"step 1 LOCATES or gains access; it
  never grabs"*), so *"why armed strangers"* can only be answered by a danger one step ahead. Writer
  B's unprompted proposal: make each step's friction carry an ACTOR present on THAT ground, not an
  atmosphere. Not built.


## N3 🆕 A saga's next beat should generate itself, not go back to the lead board

> *"for quest chains, i think just auto generate the next quest, no need to git back to lead board."*
> *"(asynchronously, of course)"*

**Today:** finishing a beat pushes a **continuation lead** onto the board (`⛓CONT — the story
continues`). The player must go to Leads and pursue it to get the next card. So a running saga costs
a lead-board trip and a pursue click per beat.

**Wanted:** the next beat writes itself when the previous one resolves, and lands on the quests
board — through the queue built for `G1`, so nothing blocks.

**The thing triage has to answer first:** the continuation lead is currently doing a **second job** —
it is how a saga ENDS when the player isn't interested. Letting it expire slips the chain
(`game.ts:2155`), and re-offering the same beat three times slips it too (`reOffers >= 3`,
`game.ts:2237`). Both exist because a beat card was once re-offered 28 times over 90 cycles. If the
next beat simply appears, **there is no longer a way to decline a saga by ignoring it** — so the
design needs a replacement: abandon the quest? a stated "let it go"? does a beat still lapse on its
own TTL?

**Other open questions:**
- **Cost and pacing.** Auto-generation fires a `writeQuest` per resolved beat with nobody asking for
  it. Three live sagas = three calls every reckoning, on the player's bill. Acceptable? Does it
  respect the in-flight cap, or jump the queue?
- **When exactly?** During the reckoning that resolved the previous beat (so the card is waiting when
  the player returns to the fort), or at the start of the next fort phase?
- Does this apply to the FIRST beat too, or only continuations? (Starting a saga is the 50–66s
  genesis, which is a different problem — see `TEMPO.md`.)
- Does the quests board need to show that a saga beat arrived, the way `P6` announces a pursued card?

## N4 ✅ A recruit's story doesn't match where they were recruited from

> *"big issue: recruit story / text does not match where they got recruited from? pls check is this
> true?"*

**Checked. Partly confirmed, and one cause is a regression introduced 2026-08-27 (mine).**

### How it is SUPPOSED to work
A person a quest hands over is fleshed by the **resolver**, which is the only call that knows the
circumstances — it is given `deliveredCharacters` and told *"people the job handed over — flesh each"*
(`openai.ts:469`), and the engine applies what comes back (`game.ts:2387`). Everyone else — founders,
tavern walk-ins — is fleshed later by `fleshPass`, which knows only a coarse `context` string:

```
genesis focal → "the person the saga X was about"
merc          → "a founding member of the company" (cycle<=2) | "a sword the company took on"
captive       → "a captive taken on a quest"
otherwise     → "someone the road washed up at the gate"
```

### CONFIRMED DEFECT 1 — the routine report prompt tells the model to flesh nobody
The new routine one-off report prompt contains, unconditionally:

> `- fleshed: always [] — nobody is handed over on a job like this.`

…in the same prompt that, when someone IS handed over, also carries the `deliveredCharacters` bullet
telling it to flesh them. **A direct contradiction, and mine wins by being later and in the output
spec.** So a routine job that delivers a recruit or captive now produces `fleshed: []` — the person
arrives blank, `fleshPass` later fills them in from the generic context above, and invents an origin
that has nothing to do with the job they came out of. **That is exactly the reported symptom.**
Introduced today; one line to fix.

### CONFIRMED DEFECT 2 — tag dumps leaking into backstory
Second sighting, now in the designer's own game. `Hosmunt`, in the tavern:

> *backstory:* **"TAGS NOTATION: male, human, criminal (low), melee (low), endowed (low), serious."**
> *He turned up at the gate after a downpour…*

The flesh prompt's tag notation is being echoed verbatim into player-facing prose. (First seen on
`Kepanuu`, a finale prize, 2026-08-26.) Separate from N4's main claim but found while checking it.

### NOT CONFIRMED — the specific instance
The live save (seed 230593368, cycle 8) has **no quest-recruited merc** to inspect: the roster is the
two founders, both with origin-appropriate stories, and the only recruit on offer is Hosmunt in the
tavern, whose *"road-washed castaway… turned up at the gate"* correctly matches a tavern walk-in.
Rescued people so far (Belknar, Castarnisse) *"thanked you and moved on"* rather than joining.

**Question for the designer:** which character was it? If it was someone from an earlier session, the
name is enough to find them in the logs.

### Open questions for triage
- Should `fleshPass`'s `context` carry the real circumstance (the quest title, the region, how they
  came into the company's hands) instead of four generic strings? It is the fallback path for
  everyone the resolver doesn't flesh, and it currently cannot help but invent.
- A rescued person who *"thanks you and moves on"* becomes a lore node; if they later resurface as a
  hire, does anything remember how the company met them?

### N4 follow-up — playtested 2026-08-27. The claim is TRUE, and there are TWO causes, both mine.

**The design (GENERATION_FLOW §4 "pattern-B", implemented at `game.ts:974-1010` and `:1113-1130`).**
A person a one-off hands over is a COLLABORATION between engine and card writer:

1. the engine pre-rolls **identity only** — race, gender, name (`pendingIdentity`)
2. it deals that to the card writer as `framedCharacter { partial: true }`
3. **the card writer describes who they are**, by emitting `quarryTags` — up to 3 vocabulary words
   with a rank, e.g. `priest (mid)`, `soldier (low)`
4. the engine canonicalises those tags, rolls a tier inside each proposed band, and **builds the
   person to match**, pricing the rest back to budget

So by design the delivered person is AUTHORED BY THE CARD. That is the whole mechanism, and it is
why they normally match.

**CAUSE 1 — the routine card prompt never asks for `quarryTags`.** The full one-off prompt puts it
in the output schema and carries a bullet explaining it (`openai.ts:294`, `:301`). The routine prompt
written today has **neither** (`openai.ts:250`). So `out.quarryTags` is undefined, `personSpec.required`
stays empty, and the engine builds the person from generic pools with no connection to the card.

**Evidence from the designer's live game** (cycle 1, `q12`):

```
CARD      「An elven woman vanished within the old woods and the clan refuses to search deeper.」
DELIVERED  Castarnisse — female; elf ✓ ; courtesan (1); loner; clever (1)
```

Race and sex match — those are the pre-rolled identity, dealt to the writer, which is why the card
could say "an elven woman". Everything that makes her a *person* — her trade, her temper — is
unconnected to the job. A missing wood-elf the clan won't search for comes back a courtesan.

**Independent reproduction** (probe, real AI, fresh seed):

```
CARD      "A novice vanished after leaving a woodland shrine and the parish cannot spare folk
           to mount a search."
DELIVERED  Kinburga — female; human; roguery (low); servant (low); nimble (low); nature (low)
```

A shrine novice arrives as a nimble servant with light fingers. No `priest`, no `mystic`.

**The contrast that proves the mechanism is otherwise sound** — the SAGA path still works, because a
saga's cast is authored in the bible:

```
BIBLE      Adeliza — "An entertainer and light-finger who has been moving through the Western Forests."
DELIVERED  Adeliza — entertainer (5); roguery (6); scrawny; craft; serious; gregarious; tough
```

**CAUSE 2 — the routine report prompt tells the resolver to flesh nobody** (the `fleshed: always []`
line, already written up above). So even the person's STORY is not written by the call that knows the
circumstances; `fleshPass` invents one afterwards from a four-string generic context.

Together these two explain the symptom completely: on a routine job the delivered person gets neither
their traits nor their story from the quest they came out of.

**For triage — three separable questions:**
1. Restore `quarryTags` to the routine card prompt? (Cheap. But note a one-sentence card has less to
   go on than a 40-word one, so the tags it authors may be thinner.)
2. Fix the `fleshed` contradiction? (One line.)
3. The deeper one, which predates today: should `fleshPass`'s `context` ever be generic? It is the
   fallback for everyone the resolver does not flesh, and with four fixed strings it cannot help but
   invent an origin. Nothing tells it the quest, the region, or how the person came into the
   company's hands.

### N4 RESOLVED — 2026-08-27, commit 51ae1c0

Four fixes, measured before/after on the same 13 saved samples with one judge (only the build
differs): **2.85 ± 0.26 → 4.38 ± 0.26, +1.53 ± 0.37 (~4σ)**. Zero 5s before, eight after.

1. `quarryTags` restored to the routine card prompt — the card authors the person again (§4
   pattern-B, one call, no new AI call).
2. The resolver fleshes whoever it hands over (the `fleshed: always []` contradiction).
3. `FleshInput.quest` + `character.origin` — a delivered person remembers the job, so the fallback
   path is no longer forced to invent. This is the structural gap the designer spotted; it mirrors
   the `saga` block that already existed for genesis focals.
4. **Tag echo stripped in the engine, not banned in the prompt.** The prompt already forbade
   echoing its own wording; banning the *label* just moved the echo — it came back as
   `(human. Male. Ranged (low). Instinctive)` at the head of the who-line. The detector now tests
   CONTENT: a bracketed run that is ≥75% tag vocabulary is dropped. 3/3 clean against the real
   model, on the exact people it happened to.

Harness kept: `scripts/matchscore.ts` (generate + judge) and `scripts/rejudge.ts` (re-score saved
samples, so a future change can be compared against these same numbers).

⚠ **Left open, deliberately:** the first judge scored the wrong thing — whether the delivered
person would be *good at* the job, when they are the one being rescued. If anyone rebuilds this
harness, that is the trap.

## N5 🔍 Founders are bottom-percentile units carrying a full-price mark

Found while building the rarity marker (2026-08-27), not reported from play.

The marker measures a person's SUBSTANCE — what their tags are worth — against a typical person of
their level. Both starting soldiers come out at the bottom of the scale, and the marker is right:

```
Ixidor Blackbrook   L2   substance 11.4   worth 17g   typical for L2 ≈ 36g   ratio 0.47
Audmund Snowtracker L2   substance  9.3   worth 15g                          ratio 0.42
generated L2 people:  p10 0.47 · median 0.69 · p90 0.81
→ the founders sit at the 6th percentile of people a quest would hand over at their level
```

**Why:** founders are built by `freshCharacter`, which gives them one skill tag, one personality tag,
a race and a sex — and never prices those tags to a budget. Quest-delivered people go through
`generateCard`, which fills tags until it has spent the target. Both carry a 60g mark.

**So the mark overstates them**, and the mark is what ransom, sale value and hire-equivalent pricing
are all computed from.

**Not fixed — it is a balance question, not a bug:**
- Is it *right* that your two openers are visibly the weakest people you will ever own? It reads as
  intentional progression (every recruit outclasses them), and it gives the ★ scale somewhere to go.
- Or should `freshCharacter` price founders to their mark like everyone else? That makes the opening
  pair meaningfully stronger, which changes early pacing — the very thing the early-game smoothing
  work tuned.

The marker ships as-is because it is telling the truth. Ruling wanted before anything moves.

### N5 update — 2026-08-27, after the §3 generation fix

The generation shortfall that made this look worse than it was is now fixed (E[substance] ≈ target,
per ECONOMY §3), so quest-delivered people got RICHER while founders did not move at all — they are
built by `freshCharacter`, which still hands out four tags and stamps a 60g mark without pricing
anything. The gap therefore widened rather than closed.

Seen side by side in the CLI, which is the point of the marker:

```
HOLDING   Aduna of the Ford   ★★★★   64g     ← a quest-delivered captive
ROSTER    Ragna Stormhide     ·      17g     ← a founder, same game
          Gaufrid             ·      11g
```

Still a balance ruling, not a bug. The two options are unchanged — accept it as progression (your
openers are the weakest people you will ever own, and every recruit visibly outclasses them), or
price founders through the same path as everyone else, which strengthens the opening pair and
touches the early-game pacing that was tuned deliberately.

---

## N6 — ❌ REVERTED · a heavy one-off card named places nobody had introduced (2026-08-28)

Found while playtesting the ~110-row archetype widening; it had nothing to do with the widening.

A one-off card takes one of two registers, picked by an engine-rolled `gravity`. The **light**
register (a small, everyday job — 90 % of common one-offs) bans proper nouns outright and was
always clean. The **heavy** register (a serious matter / a grave affair) had no naming contract at
all, and it showed:

> *"Venison bound for **Fernbourne** did not arrive. Raiders answering to **Thornhollow** hold the
> packs at **Hawford**."*

Three toponyms in one card, none of which the reader has ever heard of. **0 of 8 heavy cards were
clean.** This is exactly the N2 failure — a proper noun is definite, so naming a stranger is a
presupposition failure — on the side of the game N2 never touched.

The fix is a ladder, and the ladder is the finding. Full numbers, both seeds per rung, and the
two laws it produced (L25, L26) live in `v3/scripts/prosebench/CHEAP_MODEL_PROMPTING.md`:

| lever | clean |
|---|---|
| the rule, written into the card spec | **0 %** — no movement whatsoever |
| the same rule, moved into `ABOVE ALL` | 39 % |
| + the engine deals the place already introduced (`"a mill town, Sedgedale"`) | 63 % |
| + the engine splices the introduction back when the card drops it | **100 %** |
| + the engine closes the appositive it opened | 94 % · **31/32 over the last two rungs** |

**This was reverted the same day.** The measurement was sound and the change was still wrong —
see the blind bench in N8 below. Both facts are kept on purpose.

Two things to carry forward:

- **The 39 % ceiling was the engine arguing with itself.** The prompt said "no proper nouns" while
  `placeNameSuggestions` was, in the same payload, handing the card two bare toponyms to use. A rule
  the input contradicts is dead, not weak — always check what the engine already does before
  writing the rule (L24's corollary, hit again).
- **Only enforcement reached the tail.** The engine knows both the bare name and the introduced
  form, so putting the introduction back is a string splice, not a second call — this does not
  touch the single-shot ruling, which is about AI verifying AI.

Also fixed in the same read: the card spec required the first sentence to name *"the wrong in it"*,
which forced a victim onto every card — so an archetype where the **company** is the offense came
back inverted (`press-ganging` was written as a *rescue from* a press-gang). The first sentence may
now name what is simply THERE to be taken.

## N7 — 🔴 CONFIRMED CLASS · a saga beat-1 card pastes its dealt atoms raw (2026-08-28)

One card in an 8-cycle real-AI CLI campaign (seed 9310):

> *"A householder, Ohtarona Leafshade, came down from higher ground and **said the whole of it
> standing**."*

The introduction is correct (N2's fix holding); the predicate is not English. One instance, one
seed, on the saga path — recorded, not yet measured. Worth a targeted sample of beat-1 openers
before touching anything: a single bad sentence is not yet a class.

**Update, same day — it is a class.** Two further real-AI campaigns produced it again, and the
cause is now plain: the beat-1 payload's `arrival` and `clientTell` atoms are being pasted VERBATIM
instead of rebuilt. All three from live cards:

> *"…came on foot **and kept one hand on the door frame** as he spoke."* … *"**He had rehearsed his
> account.**"*  ← two `arrival` atoms and a `clientTell`, quoted whole
> *"…**sent a rider ahead and came behind it** and **said the whole of it standing**."*  ← two
> `arrival` atoms welded with "and", which is where the ungrammatical sentence came from
> *"Salmo **will not look at the door** while you work."*  ← the `clientTell`, pasted and then
> tacked onto the errand

The prompt says "combine them in your own words, never quote them" and it is simply not obeyed —
which is L19/L20 again: a pre-shaped dealt string is a stamp, and these atoms are shaped like
finished clauses, so they get stamped. Note the one-off path does NOT have this problem, because
its atoms are single words that cannot stand as clauses (`atomized-seed-lists`).

Untouched by the 2026-08-28 card work, which is one-off only. The fix to TEST is atomising these
pools the way KEYWORDS already are — but it needs its own bench, and L31 applies: a right
diagnosis licenses no instrument.


## N8 — 🟡 OPEN · what a blind bench says is actually wrong with a one-off card (2026-08-28)

Designer, on the cards after the N6 work: *"they are becoming rather weird and not very well
written."* So the N6 fix, the job-shape rule and the rewritten glosses all went to a blind bench:
two rounds, 48 cards each, three independent judges per round against `prosebench/RUBRIC.md`,
inter-judge r 0.78–0.88, four builds sampled across the same twelve archetypes on the same seed.

| build | round 1 | round 2 |
|---|---|---|
| before any of that work | 5.36 | **5.33** |
| + N6's naming ladder | 5.08 | 5.08 |
| + one-action job rule + errand-shaped glosses | — | **4.39** |

All of it is reverted. The value is in what the judges converged on **independently**, none of
which any of those changes touched:

1. **The template is the ceiling, and nothing reaches 8.** *"Every entry is a two-clause situation
   plus an imperative triplet."* *"No card carries a spoken line."* The cards that do reach 7 all
   do the same thing — one withheld fact or one seen image, and a job aimed at exactly that: *the
   coffin now holds someone else* · *marked trees bleed dark sap* · *a small book of names, and
   nobody will speak* · *hanged for planting strange seed*. None of them is longer than the rest.
2. **Contradiction loops are the hardest defect, and the ONE LEDGER rule is not stopping them.**
   Six of forty-eight: *"the smuggler holds him yet pays you to fetch him out"*, *"Lingbourne hires
   the theft, then pays to undo it"*, *"valuables already stripped, and the job is to retrieve the
   valuables"*. Judge, unprompted: *"hard defects, not quibbles."* The rule is already in
   `ABOVE ALL`, so wording and position are both spent — the untried lever is INPUT SHAPING. A
   one-off is dealt no client and no opposition (a saga beat gets `OPPOSES` and a client tell), so
   the writer invents both parties and collapses them into one. That is the experiment to run.
3. **The pay clause is where cards go wrong.** *"Appositive name-drops and boilerplate reward
   wording bury a decent hook under repeated proper nouns."* Worth testing: the card need not carry
   the pay at all — the engine already prints `rewardEnvelope` on its own line in **both** UIs, so
   the clause is duplicated, and it is the single obligation that drags in a payer, a holder and a
   place name at once.
4. **Bookkeeping archetypes deflate a good opening.** *"Census and proof-of-take jobs kill more
   cards than bad sentences do."* `census-taking`, `surveying`, `mapping`, `standing-watch`,
   `listening` — a vivid situation followed by "count them and report back". Rewriting their
   glosses was in the reverted bundle and is untested on its own.

Ruling wanted on 3 before it is built: does the designer want the card to stop naming the pay?


## N9 — ✅ SHIPPED · what raised the one-off card from 5.0 to 6.1 (2026-08-28)

Designer: *"the scoring is really bad isnt it? can you do something to improve it to 7-8."*

Five blind rounds against `prosebench/RUBRIC.md`, three independent judges each, arms sampled
across the same twelve archetypes. Landed at **6.06–6.33 against a 5.03–5.28 base, replicated on
two seeds**, inter-judge r 0.81–0.92. Shipped: the voiced card for one-offs, the situation built on
one thing somebody SAW, and a job that acts on what the situation showed. Full ladder and the three
laws it produced (L29–L31) are in `prosebench/CHEAP_MODEL_PROMPTING.md`.

**It is +1.0, not the 7–8 the designer asked for**, and the gap is worth naming precisely. The
remaining mass is `flat` — cards that are clear, correct and unmemorable. Judges are consistent
about what the 7s and 8s have and the 5s do not:

> *The stone over the newly filled plot bears one name, while the corpse inside has inked fingers
> and a mason's scar.* · *The bailiff found the miller's son bound to a hawthorn with a creditor's
> writ pinned to his coat.* · *The watch stool was left upright, the brazier cold, and the keeper's
> horn hung unused at dusk.*

Each is one seen particular plus one human refusal or absence. What is NOT yet tried, in the order
the evidence favours:

1. **The bookkeeping archetypes still deflate a good opening** — `census-taking`, `surveying`,
   `mapping`, `standing-watch`, `listening`. Judges killed them in every round ("a spreadsheet in
   costume"). Their glosses were rewritten inside a bundle that measured negative and were reverted
   with it; they have never been tested alone.
2. **A job phrased as a QUESTION scored well** wherever it appeared (*"Who are this child's
   parents?"*, *"Who scrubbed the crew column and why?"*). The heavy spec has a pose-the-question
   rule; the light spec now has one too, but nothing yet makes a find-job PREFER the question form.
3. **Nothing in the card ever makes a person speak or act.** Every judge in every round noted it.
   The voiced format supplies this on the ~10–30 % of one-offs that are heavy; the light register
   (most cards) has no equivalent lever tested.

## N10 — 🔴 the one-off card's variety cap is that NOTHING DEALT MAY REACH THE PAGE (2026-08-30)

Designer: *"lead hunt quest texts feels like theyre not leading to a lead… shouldnt it be something
like 'go to tavern and fish for news'"*, then *"maybe you should have a seed for each type of one
off too"*, then *"check the generated prompts will likely generate varying but making sense quests
for ALL the quest type/seed combinations."*

An archetype×method design was built (a per-archetype pool of one-word methods — `listening`,
`storming`, `haggling` — dealt one per card) and put through the context-free verifier gate before
shipping. **Two independent zero-context readers rejected it**, and their reasons are the useful
part. It is env-gated OFF (`METHOD=1`).

### The finding, in one line

> *"Variety cannot come from fields the writer is forbidden to write."*

On a LIGHT card (most cards) the payload is `location` — "never name it" · `method` — "never write
the word itself" · `KEYWORDS` — "never write the word itself", and the keyword is an **abstraction**
(`disrespect`, `desecration`, `bachelor`). **Three inputs, all unprintable, none concrete.** The
card is therefore written entirely from the archetype gloss, so two cards of one archetype collapse
into each other — and the writer invents the concrete layer from the prompt's three worked examples,
which is why every card is a miller, a missing girl, or a flooded working.

### The hard contradiction (reader B)

> *"'method: bend the job toward it' vs 'job: never a person, place or object the situation did not
> already show'. The method may not appear in the situation (that is a seen thing, twelve words),
> and the job may introduce nothing new. **Method has no legal landing site.** I obey the job rule
> and the method vanishes."*

### Why lead-hunt could never have worked

Not the gloss — the FORM. The situation spec permits three openers: *what was found, what is
missing, what someone has stopped doing.* All three are **mystery** shapes; "go ask around for work"
is none of them. A prohibition ("never promise further work") bolted onto a mandatory form loses to
the form. On HEAVY it is worse: a bearer must speak and `rewardEnvelope` demands one hand pays —
nobody pays a company to go drinking — so the writer invents a patron with a grievance and the card
becomes an `investigate`.

### Half the methods are postures, not acts

> *"methods that name a different ACT vary the card; methods that name a POSTURE OF PRESENCE do not."*

`waiting` sits in seven archetypes and is inert in all seven; `hiding`/`standing`/`loitering`/
`watching` across five more. `occult`'s binding/banishing/breaking/sealing are four words for its own
gloss; `ritual`'s attending/witnessing/holding are three words for "hold the circle". The third that
DO work name a distinct act: `bribing`, `salting`, `drugging`, `impersonating`, `undercutting`,
`tunnelling`, `smuggling`.

### The proposed redesign (unbuilt, unruled)

Deal a **concrete obstacle that can reach the situation**, not an adverb of success:
`obstacle: "nobody at the crossing will talk to a stranger"` rather than `method: "loitering"`.
A fact can be SEEN, so it lands in the twelve-word situation, forces the `attribute` and the ask, and
cannot be satisfied by a word swap. To stay combinatorial rather than a stamp (L20) it should be
built from atoms — a station plus a refusal — not authored whole.

### Pre-existing defects the gate surfaced (separate worklist)

- LIGHT says the location is "never named"; HEAVY says a landmark "may be used bare". Same field.
- `assassinate`'s intent is "kill one NAMED person" while both registers forbid coining names — the
  pair is unwritable as specified.
- `trade`/`hire` methods need a price; numbers in prose are banned.
- `rarity` "uncommon and rare may run longer" contradicts `gravity`'s hard word ceiling.
- HEAVY bans "weight" as purple, then writes "the weight-class of the work".
- HEAVY uses "ONE LEDGER" as its own key metaphor while banning the account-book as a plot object.
- The situation rule is stated verbatim twice (spec + ABOVE ALL #1); the naming rule three times.
- LIGHT's three worked examples are sticky enough that both readers predicted the same cards.
