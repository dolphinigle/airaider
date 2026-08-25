# Two independent Opus writers, same three real payloads (2026-08-24)

**Why.** The designer observed that my own card-writing was anchored by having read hundreds of
gpt-5-mini attempts. Two Opus agents were briefed to read ONLY the Sultan's Game reference (the
designer's transcribed quests, `GOLD_STANDARD.md`, and ~110-120 randomly sampled `rite_*_text`
entries from the official corpus, plus slot lines and outcome branches), and were explicitly
forbidden to open any `batch-P*.md`, `pullprompts.ts`, `GUIDELINE.md`, `PULL_LAB_LOG.md` or
`CARD_PULL.md`. They were NOT told our design constraints — no anonymity rule, no "you" rule, no
length target, no structure. Whatever they converge on is evidence, not advocacy.

---
## WRITER A

**What Took the Third Man** *(hunt · grave · 2 slots)*
> A shipmaster came up from Hawcroft to sit at your table. He lost three porters at the river ford
> last month, swore to the magistrate that it was bandits, and admits to you now that he lied —
> bandits can be bought off. He will not say what he saw take the third man. Only that his coin is
> on the table, that whatever comes off the carcass is the company's to sell, and that he wants
> hunters. Not guards.

**Seven Years Pledged** *(investigate · everyday · 1 slot)*
> Your quartermaster came back from the Harrowcot clearings with wax, a day's gossip, and one man's
> fee. The beekeeper there has lost his apprentice — seven years pledged, gone in the fourth. He
> wants to know whether the boy ran. He would rather he did not.

**Low Water** *(investigate · grave · 2 slots)*
> You can see it from the north wall: the ford is stones, and the stones are dry. No word has come
> down from upriver since the water went. Half of Birbourne is already in the bed with sacks,
> turning over what the river used to hide, and by evening they will start turning over each other.
> Somebody walked up that stream and stopped it. Send two — one to follow the bed to whatever is
> sitting on the water, one to watch the road behind them.

---
## WRITER B

**Sworn on the Ledger** *(hunt · grave · 2 slots)*
> A shipmaster out of Hawcroft came to the gate still shaking. His barge is on the bottom at the
> ford, two of his haulers are somewhere in the trees, and he swore on his ledger it was a wildcat —
> one the size of a plough horse. Old men here killed the last of those with slings, and those were
> the size of dogs. He swore to it twice more when pressed, and he is deep in debt besides. He pays
> in coin, and in whatever the river left him. Send one who can read a track and one who can read a
> man.

**A Master of Bees** *(investigate · everyday · 1 slot)*
> A new man works the beekeepers' clearings at Bramfen — calls himself a master of the craft, takes
> a tenth of every comb. Your foragers say he smokes the hives from the wrong side. The keepers pay
> him anyway, and quickly. Ask one of them what he was before.

**Low Water** *(investigate · grave · 2 slots)*
> The stream above the ford stopped in the night, and from the north wall you can watch the shallows
> dry out stone by stone. Harrowlea is already down on the bed with sacks. By old right that bed is
> the fort's; nobody down there has ever believed it. Two of the things the water left were men, and
> both were opened with a clean hand before they went in. The ford is still drying. Send one who can
> hold a crowd and one who can read a wound.

---
# CONVERGENCE — what BOTH writers said independently

## 1. THE SAME #1 ENGINE CHANGE: give the writer each slot's ask in plain words
- A: *"Hand the writer the slot asks in plain words — a role and its attribute per slot… it is the
  only law from the reference that our cards structurally CANNOT satisfy today."*
- B: *"Give every slot a one-line ask, in plain words — the quality that slot is testing… It's the
  single field that would let every card end the way the best reference cards end, and it would stop
  a writer inventing a job the assigned soldiers can't actually perform."*
Both rank naming the reward SECOND, and both note it carries the known possession-contradiction risk
while the slot ask carries none. Both closed cards on this device unprompted ("he wants hunters. Not
guards." / "Send one who can read a track and one who can read a man.").
**B adds a risk I had not considered: without it, the writer invents a job the DICE may not be
testing.** Our prose and our mechanics can silently disagree.

## 2. The abstract keywords are unusable and actively harmful
- A: *"`astonishment`, `mastery`, `hell`, `forfeited`, `poverty` are states and legal abstractions,
  not objects… exactly the pressure that makes a cheap model write vague."*
- B: *"they exert steady pressure to just SAY THE NOUN, which is the one thing the reference never
  does."*
Both used only the concrete ones (sling, wildcat, jailer, surgeon) and dropped the rest.

## 3. Pay as a category forces a limp clause
A: *"forced the limp 'whatever comes off the carcass'."* B: *"made me invent WHAT there is to
salvage — the sunken barge — the largest fiction decision in payload 1, and the engine has no idea
I made it."*

## 4. Two place names with no stated relation
B: *"a relation is usable, a pair of names isn't."* A: two of three payloads carried the identical
known-ground string, pushing consecutive cards into the same geography.

## 5. intake gives DELIVERY, not MOTIVE
B: *"motive is what the reference's first sentence is built out of."* The easiest payload was the one
whose intake implied an actor with a reason to be out there ("the company's own searching").

# TECHNIQUES BOTH/EITHER IDENTIFIED THAT OUR PROMPT DOES NOT ASK FOR
- **The card's engine is a flat CONTRADICTION between two stated facts**, never a mystery announced
  as one. *"he swore it was a wildcat the size of a plough horse. Old men here killed the last of
  those with slings, and those were the size of dogs."* — B: *"Nobody in the reference ever writes
  'something is not right here.'"*
- **One narrator's aside per card, half a clause long** — "intentionally or not", "a gentle way of
  putting it", "honestly, who has patience for that?" Cheap, and carries more voice than adjectives.
- **The register is DRY, CONVERSATIONAL, OFTEN WRY — not literary dark fantasy.** Grand prose appears
  only in finale rites. A: *"A writer aiming for uniform gravitas is writing a different game."*
- **Detail is EVIDENCE, not scenery.** B: *"There is essentially no weather and no landscape in these
  cards."* Ours open on weather and ground constantly.
- **Routine cards are a DIFFERENT REGISTER, not short versions of grave ones** — blunt, unembarrassed,
  sometimes 12 words with zero imagery.
- **Titles are short, oblique, often ironic** — "Big Rat", "Armed Sheep", "Peeking Eyes".
- **The "why us" clause is a character's CALCULATION** — *"Perhaps he knows that you have been chosen
  by the Sultan, and you are the one in this city who most needs to meddle in other people's
  business."*

# CAVEATS
- Both wrote LONGER than the corpus median (A: 80/46/84 words; B: 105/47/86) while both independently
  reported the mass sits at 20-40. Strong writers reach for room; the reference mostly does not.
- Both used "you/your" freely and B used a name-adjacent construction. Neither was told our
  anonymity rule — so this is evidence about the rule's cost, not a violation.
- B used "ledger", which is a banned prop for us.
