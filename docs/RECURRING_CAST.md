# RECURRING CAST — the goal 🔒

**Status:** GOAL, set by the designer 2026-08-28. Mechanisms ruled; implementation and tuning open.
This supersedes LORE.md's assumption that decay alone keeps the world's population healthy — see §4.

## 1. The goal, in the designer's words

> *"btw npcs are reusable right? eg you can re-met the same npc and their history grow?"*
> *"instead of growing it each time [it] should do something so the list remains ok sized OR the
> unit chance to appear is ok ish"*
> *"i think instead of hard deletion, just make the units weighted proportionally by edge count?
> also yes probably want the chance of making a new NPC to get LOWER AND LOWER as the number of
> npc increase?"*

**The world should have a CAST, not a census.** A handful of people the player actually knows, who
come back, whose history with the company accumulates — and against whom the occasional stranger
still arrives. Not thirty names met once each.

## 2. What is wrong today (measured 2026-08-28)

- A saga brings back a known face **~0.14 times per campaign** — about once in seven campaigns.
- When it does, it picks **uniformly** over every character ever recorded, so a given person's
  chance is 1/N and falls as the world fills. This is the designer's "each unit reappear chance
  becomes tiny".
- Nothing bounds N. `decayPass` retires **edges**, never nodes, and half of all character nodes are
  created with **no edge at all** (see §4), so they have no salience to decay and can never be
  forgotten. The list only grows.

## 3. The two ruled mechanisms 🔒

1. **The chance of coining a NEW person falls as the cast grows.** A sliding chance, never a hard
   cap — the world must stay able to surprise. `P(new) = θ / (θ + N)`.
2. **Reuse is weighted proportionally by EDGE COUNT** — how many matters that person has already
   been part of. Someone in three of your sagas is three times likelier than someone in one.

**No hard deletion, and no eviction.** 🔒 Nothing is pruned; the list simply stops needing to grow.
(LORE.md's soft-delete rule stands: nothing is ever hard-deleted, and the Chronicle keeps everything.)

These interlock, and neither works alone: weighting is uniform while everyone has one edge, and a
falling coin-rate alone just rotates strangers evenly. Rule 1 forces a reuse → the reuse adds an
edge → rule 2 favours that person next time. That bootstrap is the whole design.

## 4. The blocker this must fix on the way

`LORE.md` §10 specifies story-NPC write-back at saga CLOSE: met-only, **cap 2/saga**, each with one
memory edge. That code exists (`game.ts:3130`) and never runs: a second write-back at
`game.ts:1575` fires first at GENESIS, records **every** cast member — unmet, uncapped, **and with
no edge** — and the close-time path then skips them on its name check. Deleting the genesis
write-back is a prerequisite, not a nicety: **edge-count weighting is a no-op unless every recorded
person has edges.**

## 5. The story must SAY when you already know someone 🔒

> *"also need to note in story whether you already know someone or not i think then?"*

A returning face is worth nothing if the card introduces them as a stranger. When a saga reuses
someone, the prose must land as recognition — the known-new contract inverted: a person the player
has met is **already definite**, and re-introducing them ("a widow, Maldea") reads as amnesia.
The engine knows which it is; the writer must be told, and the card must show it.

## 6. What "achieved" means

Mechanical (simulate):
- cast size grows **sub-linearly** in sagas played — no cap needed to make that true;
- a campaign of ~12 sagas produces **one face in 4+ of them** and a supporting cast of 3–4;
- the top face's chance of being the next return is **~25%**, not 1/N;
- **zero** edgeless character nodes.

Felt (read real AI output):
- a returning face reads as returning — the card knows the player has met them;
- their accumulated history is visible and consistent with what actually happened;
- the world still admits strangers, and a stranger reads as a stranger.

## 7. Open

- **θ** — the coining-rate dial. 3 = a dominant nemesis · 4 = a lead plus a supporting cast ·
  8 = a wide world, softer recurrence. 🛠 tune by play.
- **Scarcity is a separate problem.** At ~2.4 sagas per campaign this machinery gets ~5 slots to
  work with, so it reads right in a long game and barely registers in a short one. Seeding the
  world with faces at creation is the candidate fix; unruled.
- Whether one-off quests should contribute faces at all (currently they contribute none, by the
  anonymity-by-omission ruling) — unruled, and it fights an existing 🔒.


---

## 8. Measured — the mechanism works (2026-08-29)

Three parallel real-AI campaigns, 12 sagas each (`v3/scripts/_castlab.ts`; the mock cannot test
this — see §9):

| | c1 | c2 | c3 |
|---|---|---|---|
| sagas featuring a face the player already knows | 5/12 | 6/12 | 5/12 |
| final reuse pool | 4 | 8 | 8 |
| edgeless nodes | 0 | 0 | 0 |

**~44% of sagas now return to a known face**, against an effective 0% before. `P(new)` walks down
as designed — 100% → 80% → 67% → 44% → 40% over one campaign — the pool grows sub-linearly, and
nothing is ever deleted. §6's mechanical bar is met.

The history accumulates and reads as a world, not a ledger:

> **Belknar of the Pass** — focal of one saga; three ties, two of them defining; later resurfaces
> as *"rival-of — stood against the company in the matter of 'The Cage Singer'"*.
> **Kymme Ashworth** — *"sold by Nahikari to cover a market debt before the company took Nahikari
> into custody"* (defining), carried across sagas.

Place names recur on their own too — "Hollowfall" anchors several stories in one campaign.

### The two guards that hid all of this

The rules were correct and measured **0 reuses in 14 real-AI sagas**, because two twin-name guards
(the focal similarity guard, and a second inside `addCard`) rerolled every promoted focal into a
stranger: a face the world knows is IN the lorebook, which is exactly what `nameTooSimilar()` reads
as a collision. The lore node had already been remapped onto the card id, so node and card then
disagreed about who the person was. Both now take a `keepName` exemption; locked in
`test/recurringcast.test.ts`.

**Method note worth keeping:** the POOL needs real AI prose to fill (`introducedNames` is filled by
scanning player-facing text), but the SELECTION does not. Testing selection against an *injected*
pool turned a 46-minute debug loop into a 3-second one.

## 9. Still open — §5 is NOT met

**7 of 16 returning-face sagas never name the person at all.** The player holds a defining memory
with Kymme Ashworth; the card says *"the chapel must have its priest returned… find any trace of the
missing priest."* Not Kymme — "the missing priest".

Cause: the reveal-cadence gate (`isMet`) is **per-chain**. The focal has not been introduced *in
this saga*, so the writer withholds them — right for a stranger, exactly wrong for someone the
company has history with. The engine knows which case it is and never tells the writer.
