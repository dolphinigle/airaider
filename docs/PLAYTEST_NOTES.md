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

## N2 🆕 Saga cards use their people with no introduction — from the very first card

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

## N4 🆕 A recruit's story doesn't match where they were recruited from

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
