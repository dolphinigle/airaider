# Raid Design

**Status:** Open

This is the most important and least decided document. The raid layer is where agency lives, so getting it right is the central design problem of the remake. This doc lists **the constraints any raid system must meet**, then sketches several **candidate styles** with trade-offs.

The expected outcome of the next design round is to pick (or fuse) one of these candidates and move it to Draft.

## Constraints (Locked)

Any raid system must satisfy:

1. **The player makes most outcomes.** A raid's success should be primarily a function of the player's decisions during the raid, with hero stats / gear / composition as inputs the player optimizes *for* and *with*, not substitutes for play.
2. **Heroes feel different to play.** Two heroes with the same role tag should still play noticeably differently because of traits, abilities, scars, or equipment. Otherwise heroes remain interchangeable stat blocks.
3. **A raid is a *session*, not a campaign.** A typical raid should fit in 10–25 minutes. The player should be able to do "one more raid" before bed.
4. **Push-vs-retreat tension.** The system needs a mechanism that makes "leave with what you have" a real choice against "push for more". Without this, raids degenerate into clear-everything.
5. **Failure is meaningful, not catastrophic.** Wiping should hurt (lost heroes, lost gear, lost story state) but not delete hours of progress. Heroes can die but the fort persists; partial loot is recoverable.
6. **Loot connects to the meta.** Whatever drops in a raid must be *usable* in the fort (followers for rooms, artifacts for display or hero gear, resources for building, leads for next raids). No raid loot should be raid-only.
7. **Implementable by a small team.** Whatever style is chosen, scope must be honest. We are not building XCOM.
8. **AI is for flavor, not for mechanics.** AI writes the room descriptions, the encounter intros, the post-raid epilogue. AI does not decide whether the trap triggers.

## Candidate styles

Each candidate is a different answer to "what is a raid, mechanically?". They are not mutually exclusive — a hybrid is plausible.

### Candidate A — Darkest-Dungeon-style line combat + exploration

**Shape:** Side-on view. Party is a line of 3–4 heroes. Move through a procedurally-arranged map of rooms connected by corridors. Each room may contain combat, a curio, a trap, or treasure. Combat is turn-based; positioning in the line determines which abilities can be used.

**Pros:**
- Proven design pattern; readable; matches the "expedition" fantasy.
- Position-in-line as a constraint makes heroes feel different (front-liners vs. back-liners).
- "Light" / "torch" mechanic is a ready-made push-vs-retreat lever.
- Stress / sanity as a "you can't push forever" lever pairs naturally with hero individuality (heroes break differently).

**Cons:**
- Inherits a comparison the game will lose. We need to be *different enough*.
- Heavy art lift (per-hero, per-ability animations are the genre standard).
- Risk of being "Darkest Dungeon with AI flavor" which is not a pitch.

**Differentiator if we pick this:** Themed rooms in the fort buff the corresponding raid mechanics (a maxed-out Apothecary lets you carry curatives that heal traumas mid-raid; a maxed Library reveals trap locations in scholarly biomes). The fort directly powers the raid.

### Candidate B — Turn-based tactics on a small grid (FTL-meets-Into-the-Breach)

**Shape:** Each encounter is a small grid (e.g. 6×6 to 10×10). Party of 3 units with movement and 2–3 abilities each. Encounters chained into a short run (3–6 encounters per raid). Between encounters, a map node lets the player choose path (combat / shop / event / elite / boss).

**Pros:**
- High agency per turn; readable; cheap to author content (each encounter is small).
- Abilities define heroes more than stats do — fits "heroes feel different".
- Run structure (chain of nodes) gives natural push-vs-retreat: the deeper you go, the harder it gets, but the loot tier rises.
- Lower art cost than line combat; tile-based animation is forgiving.

**Cons:**
- "Tactics" can feel cold; need to invest in giving heroes voice/personality outside combat.
- Risk of feeling like Slay-the-Spire-with-a-board (a strong but well-trodden space).

**Differentiator:** Each hero has a small ability pool that *grows from raids* (a hero who survives a fire biome unlocks a fire-themed ability variant). The hero's history *is* their build.

### Candidate C — Real-time-with-pause squad tactics

**Shape:** Top-down, party moves through a small dungeon in real time, player pauses to issue ability orders. Closer to Bg2 / Pillars / Commandos.

**Pros:**
- Feels visceral; close to "I am actually leading a raid".
- Encounters can be larger and more varied.

**Cons:**
- **High implementation cost.** Pathfinding, AI, animation, balance.
- Hard to make readable. Hard to fit a raid in 15 minutes.
- Probably violates Constraint 7 (small team).

**Recommendation:** unlikely unless scope explicitly grows.

### Candidate D — Card-driven encounter resolution (deckbuilder)

**Shape:** Each hero is a deck. Combat is a card battle where heroes' cards are played from a shared hand. Map navigation is Slay-the-Spire-style node choice. Raids = one run.

**Pros:**
- Lowest implementation cost of the four.
- Card variety = hero variety. Trivially makes heroes feel different.
- Mature design space (push your luck, deck construction).

**Cons:**
- Genre-bound: people who don't like deckbuilders won't play.
- "Heroes" become deck identities; the visceral fantasy of leading people into a dungeon is weaker.

**Differentiator:** Cards drop as raid loot, but they are flavored as artifacts/training/scars. A "Trauma: Pyrophobia" is a card forced into your deck. This makes the meta layer's contributions tangible inside the raid.

### Candidate E — Hybrid: exploration map + scripted encounters as "set pieces"

**Shape:** The raid is a short authored sequence (4–8 nodes). Most nodes are choice-based (text + traits/abilities trigger different branches). Some nodes are tactical encounters (using Candidate B's grid). The combination is a 10–20 minute "episode".

**Pros:**
- Strongest fit for the AI-flavor pillar: AI authors the connective tissue, hand-crafted (or template-generated) encounters carry the mechanics.
- Heroes' traits matter outside combat (a Cunning hero can talk past a guard; a Strong hero can break a door), reusing AI Stronghold's trait system honestly.
- Adjustable length; one node per raid is feasible.

**Cons:**
- Mixed-mode UX is harder to design well.
- Risk of choice nodes feeling random if not carefully built.

## How to choose

The choice should be driven by which candidate best supports **"heroes feel different, the player has agency, loot connects back to the fort, in 15 minutes, by a small team."** Two of these (B and E) currently look strongest. A is possible if we accept the comparison; D is the safe-but-genre-limiting fallback; C is probably out of scope.

This is a decision to bring back to the user.

## Cross-cutting raid mechanics (apply to whichever style)

These belong in whichever candidate wins.

### Hero state during a raid

- **HP** — recoverable mid-raid via items/abilities; full reset between raids (with some cost).
- **Stress / Will / Composure** (name TBD) — accumulates from harm, fear, witnessed deaths. At thresholds, triggers a roll on the hero's personality (heroic resolve vs. break). Persistent traits (traumas) can carry between raids until healed at the fort.
- **Wounds** — long-term injuries that take real time (raids) to heal. Distinct from HP.
- **Scars** — permanent traits earned in raids. Mostly negative ("Burned: -1 fire resist forever") but some positive ("Lone Survivor: +1 to checks when alone"). A scar is a *story*.

### Loot during a raid

- Followers (rare) — discovered NPCs who agree to come back to the fort.
- Artifacts — unique items with traits and AI-generated lore.
- Resources — stackable; for fort construction.
- Story Hooks — advance related stories; may spawn new raid leads.

### Pressure mechanics

A non-exhaustive list of levers that can create push-vs-retreat tension (one or two should be picked):

- **Light / torch attrition** (Darkest Dungeon style).
- **Noise meter** that ramps encounter difficulty over time.
- **Resource burn** (each room costs supplies; supplies are finite).
- **Time-of-day** clock that escalates if exceeded.
- **A pursuer** that spawns after N nodes and chases the party.

## What the player must always know

For any chosen style, the UI must always communicate:

1. The current party's state (HP, stress, wounds).
2. The current "pressure" reading (whichever lever is in use).
3. What is at stake right now (this encounter's risk, this corridor's loot tier).
4. The cost of leaving now vs. pushing.

If the player cannot answer "should I push?", the raid system has failed.
