# Sentence-by-sentence FUNCTION of the designer's four Sultan samples
What each sentence DOES, not how it reads. Written before the research agents reported, so it can be
cross-checked against them rather than rationalised to fit.

## Sample 1 — "Managing the Estate"
| # | text | function |
|---|---|---|
| intro s1 | *People are still willing to come under your roof and share words, promises, and opporunities.* | states a STANDING OPPORTUNITY. "**still** willing" quietly dates it — the offer is decaying. Rising tricolon, concrete → abstract (words → promises → opportunities). |
| pre s1 | *A nod, a word shared, a handshake.* | montage of a whole season's work as three noun fragments. |
| pre s2 | *Nobles need not labor to make a living...* | an aphorism about your CLASS, trailing off into the dice. |
| succ | *The clicking of coins make you smile, but then you start to worry how long this kind of life will last.* | sensory → feeling → **but** → dread about the future. The win is undercut inside the same sentence that grants it. |

## Sample 2 — "Divine Stallion"
| # | function |
|---|---|
| intro s1 | HEARSAY. "Someone swore that they had seen…" — sourced to a person, and their swearing implies it is doubted. |
| intro s2 | the WONDER described in motion (shone as it ran, seeming to fly). Desire is manufactured here. |
| intro s3 | FAILED PRECEDENT — "many hunters tried… all returned empty-handed." Difficulty rating and a dare in one line. |
| pre | the approach, time compressed → the animal SEES you (agency reverses) → the guide SPEAKS the intro's precedent back → the sent soldier, named, commits. |
| succ | hesitation → **However** → approach → contact → a line of MEANING. |

## Sample 3 — "Project Investment"
| # | function |
|---|---|
| intro s1 | a PERSON ARRIVES with a claim. "who **calls herself** an inventor" plants doubt in the epithet — the withholding is inside the noun phrase. |
| intro s2 | the claim inflated into a PROMISE, ending on the prize: "an instrument capable of unveiling secrets beyond the starry sky." |
| pre | you commit resources → a tricolon of craving ("you aspire, you crave, you anxiously await"). |
| succ | the object revealed → you use it → **her dream in her own voice** → **your reply** → a forward-pointing close ("In the future, you will reach it"). |

## Sample 4 — "Major Construction"
| # | function |
|---|---|
| intro s1 | REQUIREMENTS stated as speech ("First you need the funds, then you need a legendary architect") + a wry threat ("or the Sultan will get bored"). |
| result | hyperbole owned as hyperbole ("This is a miracle, a miracle of money and manpower") + the impossible fact ("in just 7 days"). |

---

# THE FINDING THAT MATTERS MOST
**Not one of the four cards is a misfortune that someone else is losing money over.**
- 1 and 3 are OPPORTUNITIES offered to you.
- 2 is a WONDER that might be caught.
- 4 is a PROJECT you might undertake.

All 18 of my P26 cards are the opposite: something is broken, a tradesman cannot work, please fix it.
That is a **restitution** frame. The reference frame is **desire** — here is a thing you might get.

This is the same diagnosis the designer reached months ago and recorded in the project memory
(`next-phase-story-interest.md`): *"why tf do I want to send ppl on this quest?"* — the DESIRE axis
at the point of decision, and the Fort of Chains finding that every setup-closer is a vector at the
PLAYER'S want ("could be just the pet you have always wanted", "money for nothing").
My whole P16→P26 line optimised the restitution frame to 83% and it is still "not great" because the
frame itself is wrong.

**Consequence for the guideline:** the card's job is not to prove somebody is suffering. It is to put
something the player might WANT within reach, and to price it — in difficulty, in doubt, or in
whose hands it is currently in.

Secondary structural notes, all cross-checkable:
- The **withheld thing lives inside a noun phrase**, not in a bolted-on final sentence
  ("who *calls herself* an inventor"; "*Someone swore* that they had seen").
- **Sentences are few and long** (1–3 sentences; 15–37 words each), not four short ones.
- **Cards can be pure requirements** with the stake as a joke (sample 4).
- **The pre-roll text is where the scene lives** and it scales hardest (15 → 121 words).

---

# Is the desire frame even IMPLEMENTABLE on our engine? Yes — and the old blocker may dissolve.
Checked in code: `rewardSpecs` are generated at quest BIRTH (`src/engine/quests.ts:163`,
`splitOneOff` in `economy.ts`), so at the moment the card is written the engine ALREADY KNOWS
whether the prize includes a relic, a recruit or a captive, and `materializeReward` has made the
actual card. The card writer is simply not shown it — `game.ts:922`, deliberately, because "every
framing of *the company keeps X* on a card bred a possession contradiction (payer paying FOR the
kept thing, deliver-and-keep, prophetic loot)".

**But look at how the reference names a prize.** Sultan's never says the client will hand it over:
- *"an instrument capable of unveiling secrets beyond the starry sky"* — a thing that will EXIST.
- *"a pure black horse … seeming to fly with the wind"* — a thing that is OUT THERE, unowned, and
  that many have failed to take.
The prize is named as **an object in the world**, never as a payout somebody transfers. Our
contradiction came from the possession framing, not from naming the prize. If the card may name
what is out there but may never say who hands it over, the original defect class has nothing to
attach to.
**This is a designer ruling, not my call** — but it is a narrow, testable one, and it is the hinge
on which the desire frame turns.
