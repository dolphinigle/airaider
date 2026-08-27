# ROUND 1 — three Opus writers do the beat-1 job, then report on it

**Method.** Three general-purpose Opus agents, each given ONE real captured beat-1 prompt (full
system + full user JSON, verbatim as the game sends it) and NOTHING else — forbidden to read the repo
or grep. Each wrote the card for real, obeying the prompt literally including the rules it disliked,
then stepped out and reported. They could not see each other.

**Why this design.** A weak card from a cheap model is ambiguous — model or prompt? A weak card from
Opus is not. And a writer who has just done the job can name the field they wished had been dealt,
which a critic reading the prompt cannot.

**The three fixtures.** `beat1-user.json` (a saga with NO client in the cast), `-7712` (client +
prize named), `-3391` (client + quarry named).

---

## WHAT ALL THREE FOUND, INDEPENDENTLY

### 1. "Why it takes hired steel" is answered by fabrication, or not at all — 3/3

The obstacle is dealt as `{"role":"obstacle","offstage":true}`. A role word and a boolean. The prompt
then requires it be shown *"nameless by trade in your own words"* — but there is no trade to render.

> *"I invented trappers, invented their pelt trade, invented that they guard the hollow… A pure guess
> is carrying a mandatory function."* — writer C
>
> *"an offstage cast member with no trade cannot 'show nameless by trade'. The rule is written for a
> redacted field, but the field is empty, not redacted."* — writers B and C, same sentence in
> substance
>
> *"the card has no danger on it at all… Asking beekeepers who buys their honey is an errand for a boy
> with a mule."* — writer A, who declined to invent and lost the question outright

### 2. "Why it matters" has no dealt field — 3/3, and all three wrote the SAME bluff

The bible hands two opposed `want` strings and nothing between them.

> *"the space between those two lines is the whole saga. It is empty."* — writer C

Independently, all three papered the hole with a withholding:

| | the invented line |
|---|---|
| A | *"He would not sit down until he had told the whole of it."* |
| B | *"He would not say what Romlyn is to him."* |
| C | *"he will not say what she did to be sent away."* |

Three writers who could not see each other reached for the same trick, because it is the only move
available when the motive is missing. Writer B named it exactly: *"a writer's trick for concealing
that I was never told"*; writer C: *"invention dressed as omission… structurally, a bluff."*

**And the prompt promises the missing field by name.** It says *"bible.goal = the engagement AND the
client's open telling"* — but `goal` carries the engagement only (*"to return Lariane the Elder alive
to Syndus at Syndus's manor"*). There is no field for what the client SAYS they want it for.

> *"One line of 'what Gundo says he wants him for' would have fixed the weakest thing on the
> card."* — writer B

### 3. The sentence budget is arithmetically unreachable — 3/3 broke it

*"situation: THE card. 3-5 short sentences"* + *"ONE FACT PER SENTENCE"*, against the mandatory
inventory: client-introduced-acting · the goal in one plain sentence · the care moment · the step's
lead · the task as outcome · the pay sentence as given · the stake close.

> *"That is ten obligations against a five-sentence budget with a one-fact-per-sentence cap… I broke
> the sentence count; there was no way to hold it."* — writer B
>
> *"The 3–5 target is arithmetically unreachable for a beat-1 card that obeys every other rule."* — C

All three wrote 7–8 sentences and claimed the `uncommon` escape hatch. **This is why there is no room
for the why**: the boilerplate has already spent the budget.

### 4. The opener contradicts itself — 3/3 found it, 3/3 resolved it the same way

- situation shape: *"what has just changed, SHOWN in a dozen words or fewer… never announced"*
- BEAT 1: *"Open on the CLIENT and the matter they bring, never on 'what has changed'."*

All three obeyed BEAT 1 and broke the shape. Writer C on why it still costs:

> *"a cheap model reading top-to-bottom hits BEAT 1 first and the contradicting shape spec last.
> Position favours the wrong one."*

### 5. The dealt boilerplate breaks the prompt's own hard rules — 3/3

- *"never write numbers, prices, or amounts in PROSE"* vs the dealt stake *"worth a season of
  contracts"* / *"more than a season of common hires"* — an amount, mandated verbatim by rule 5.
- *"'the hire' and 'the job' never appear on a card"* vs the dealt envelope *"whatever the job turns
  up"* — mandated verbatim by *"AS GIVEN, not reworded"*.
- *"a person keeps ONE designation throughout"* vs the dealt envelope *"The client pays…"*, which
  re-labels a man who entered as "Gundo of Millbrook".

> *"The prompt's own dealt data violates its own hard rule, and it gave me no way to decide beyond
> 'as given'."* — writer B

### 6. Rule 3 does not say what everyone thinks it says

*"First use of any person… is introduced by a FULL sentence in which they DO something in this
matter — never one that merely states what they are."*

**A proper noun satisfies this rule.** *"Afer Harrow presses a folded letter into your hands"* — he
does something, in a full sentence. The rule that is supposed to prevent the defect licenses it,
and it forbids the very thing the gold standard does (*"never one that merely states what they
are"* pushes AGAINST *"A female craftsman who calls herself an inventor"*).

---

## DEAD AND BLIND FIELDS (each named by at least two writers)

**Dealt and unusable:**

| field | verdict |
|---|---|
| `placeNameSuggestions` | dropped by 3/3 — outranked by the bible AND out of the two-name budget |
| `relationPhrase` | *"identical on both entries, so it carries no discriminating information"* — 3/3 could not tell whether to use it, mention it, or ignore it |
| `loreId` (`lore-13`, `c9`) | dangling — resolves to nothing in the payload, two id formats, ignored by 3/3 |
| `rarity` | used ONLY as permission to run long; 3/3 unsure whether it should raise danger, pay, or register |
| `focalName` when `focalIsMerc:false` | *"changed nothing about my writing"* |
| `location` | the region, while the errand is elsewhere; *"a reader cannot tell how far the errand is"* |
| cast `tags` | **absent entirely** — the prompt teaches a full ranked tag vocabulary and then deals a cast with no tags on anyone |

Writer B on that last one, which is the sharpest observation in the three reports:

> *"the most human, most memorable sentence on the card — the one the whole beat-1 rule set is built
> around — is the sentence I had the least information for. I wrote a man who won't explain himself
> and worries about violence. That is a plausible merchant. It is not THIS merchant."*

**Blind outputs — 3/3 guessed at all of these:** `favored`/`clashing` magnitude (nudge or decisive?
does listing three dilute?), `extraAttribute` cost, `requiredTag` risk (*"if it hard-gates, I may have
just bricked a beat-1 posting"*), where `job` and `title` render relative to `situation`.

---

## THE FIXTURE WITH NO CLIENT

`beat1-user.json`'s cast is three entries, every one `{role, offstage:true}` — and **no client
entry at all**. The bible is a clientless saga, which genesis explicitly permits (*"With no outside
client, the matter settles home in the company's keeping AT THE FORT"*). But BEAT 1 says
unconditionally *"Open on the CLIENT and the matter they bring"*.

> *"The prompt's tightest prohibitions and its heaviest content demands are pointed at the same empty
> field."* — writer A, who invented a carter, his trade, his sex, his road, and his motive

---

## THE FOUR-QUESTION TEST, self-scored honestly

| | hirer | matter | why | steel |
|---|---|---|---|---|
| A | qualified NO — *"the card never says he pays"* | YES | YES (on an invented mechanism) | **NO** |
| B | YES | YES (on an invented disappearance) | **NO** | **NO** |
| C | YES | YES | **NO** | YES (on invented trappers) |

**Opus, writing carefully and obeying every rule, scores about what gpt-5-mini scores: ~2.4/4.**
That is the finding the whole round exists to produce. The ceiling is not the model.

---

## WHAT EACH WRITER ASKED FOR, UNPROMPTED

- **A:** *"give the client a real dealt entry — trade, what they want out of this, and what it costs
  them if it fails — and give the obstacle the same shape."*
- **B:** *"put tags on the cast"*, then *"a trade word on the offstage obstacle."*
- **C:** *"a `who` on the obstacle and a relationship line between client and quarry — if I only get
  one, take the relationship."*

Three writers, three fixtures, one answer: **the inputs are thin exactly where the card is weak.**
