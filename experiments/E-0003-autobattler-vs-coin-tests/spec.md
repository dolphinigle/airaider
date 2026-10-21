# E-0003 sim spec

Shared setup for every candidate. Each candidate is a sim script `sim-<key>.mjs` in this folder, played as text on the same mercs and scenarios.

## What stays fixed (current law, docs/design/)

- Mercs have six stats as coins (STR DEX PER INT CHA CON) and skills as coins, each mapped to one of 27 core skills (see docs/design/mercs.md).
- A coin is 50/50. Pools flip together.
- Quests have a level, a reward and a danger. The AI writes only one short line per beat (D-0004, D-0007); the engine states effects in CAPS ("Atlas is WOUNDED").
- Candidates may change test structure (D-0013 fixed thresholds / merc-only flips, D-0019 one skill per test, D-0008 minimum successes). Say so if you do.

## Marks (shared failure costs)

- **Hurt**: harm boxes. 2 harm = **WOUNDED** (−1 coin on every flip until healed, 2 days). 4 harm = **DOWN** (quest ends; merc out 6 days). No death in this sim.
- **Reward bands**: full reward (40 crowns), partial (20), none. Retreating keeps what the candidate's rules say.
- Other marks a candidate may use: lost gear, a grudge, time (+1 day), a fear/quirk.

## Mercs (Lv 1)

| merc | STR | DEX | PER | INT | CHA | CON | skills (exact → core) | gear |
|---|---|---|---|---|---|---|---|---|
| **Atlas**, wolfkin, gruff | 2 | 3 | 2 | 2 | 3 | 3 | Swords → Light Weapons 1 | sword, leather |
| **Brann**, dwarf, stubborn | 3 | 2 | 2 | 2 | 1 | 4 | Axe → Heavy Weapons 2 · Shieldwork → Defense 1 · Rune-lore → Arcane Lore 1 | axe, shield, mail |
| **Sela**, elf, curious | 1 | 3 | 3 | 3 | 3 | 2 | Longbow → Ranged 2 · Silver Tongue → Persuasion 1 · Old Tongues → Civilization Lore 1 | bow, cloak |

## Scenarios (Lv 1, reward 40, danger ●●○)

**S1 Clear the Road**: "Slay the bandits on the road and make it safe again." (combat-heavy)
1. *Find them*: the bandits hide off the road (tracking or spotting; a fail means they ambush you).
2. *The gang*: four bandits with clubs and one crossbow (a fight).
3. *The leader*, Red Hob: fight him, or make him quit the road (talk or threat).

**S2 The Barrow Bell**: "A bell tolls under the old barrow at night. Find out why and silence it." (knowledge-heavy)
1. *The entrance*: a sealed, overgrown barrow; old markings (reading, searching, or digging).
2. *The warded door*: a rune-ward (know it, pick/trick it, or break it at a cost).
3. *The dead*: three restless skeletons guard the bell (a fight; knowing what they are should matter).
4. *The bell*: cursed; silencing it risks the mind (willpower or lore).

Keep these beats. Tune numbers (thresholds, foe toughness, track lengths) so a fit merc wins a quest about 55–70% of the time when played well, and a poorly fit or poorly played merc clearly less.

## Candidates

- **A family** (baseline, minimal fix): today's coin tests, but a test names a goal + allowed core *family/approach list* and the merc uses their best allowed core. No mid-quest choices.
- **B loophero** (split engine): fights are a Loop Hero-style autobattle (HP bars, attack timers, damage/defense/evasion/crit from stats, weapon core and gear); non-combat beats stay single coin tests. Decisions as Loop Hero places them: before the quest (loadout/route), at checkpoints between beats (tiered retreat 100/60/30%), and the route itself (player shapes what lies ahead: e.g. pick the risky or safe path for more loot).
- **C coinrounds** (coin autobattle, D-0013-compatible: only the merc flips): a fight is short rounds; each round the merc flips their wielded weapon pool vs the foe's Guard threshold; a success hits (foe Toughness), a fail means the foe hits back (harm). Between rounds the player picks: Press (more coins, harsher fail), Hold (Defense core, safer), a non-combat move (Intimidation scares, Leadership steadies, Arcane Lore exposes a weakness, magic), or Retreat (priced). Non-combat beats: pick one of 2–3 approaches (each names a core), single test, three bands; knowledge successes give **Edge** (bonus coins) to a later beat.
- **D tracks** (one unified engine, Ironsworn / Mouse Guard): every scene with stakes, fight, ward, curse or parley alike, is an obstacle with a **progress track** and a telegraphed **threat countdown** ("The dead swarm in 3"). Each round the player picks a move the scene allows (Strike = weapon core, Guard = Defense, Scare = Intimidation, Study = Arcane Lore, Force = Craft/Athletics, Talk = Persuasion…). Strong hit = 2 progress, weak = 1 progress + threat ticks, miss = threat ticks + a mark. Threat at 0 = the scene's bad thing happens. Retreat any time, priced. Small beats are single tests.
- **E clash** (Limbus-style coin clashes; breaks D-0013: foes flip too): a merc's attack is a coin set (base + power per heads × N coins) from their weapon core; the foe telegraphs its intent's coin set. Clash: both flip, the lower total loses a coin, repeat until one side is out; the winner's remaining coins strike. Each turn the player picks a skill from the merc's kit (weapon attack, Defense block, an off-skill such as Intimidation that drains foe coins) and may spend Grit to re-flip. Non-combat beats as in C.

## What every sim must provide

1. `node sim-<key>.mjs play <merc> <s1|s2> <seed> [choices…]`: plays one quest as **text**, exactly what the player reads: each beat's line, the shown odds and stakes, the options at each decision, the flips (● heads ○ tails), the effect in CAPS. Choices come from the command line (or "auto" for the built-in smart policy), so a person can play it turn by turn.
2. `node sim-<key>.mjs stats [n]`: Monte Carlo over all 3 mercs × 2 scenarios with three policies, **smart** (your best heuristic), **naive** (first/default option, never retreats), **random**. Print JSON: per merc×scenario×policy, quest win%, partial%, fail%, DOWN%, avg harm, avg decisions per quest, avg coin flips per quest, avg number of swings (lead/momentum changes), share of rolls whose shown odds sat in 40–75%, avg text lines per quest.
3. A seeded RNG (mulberry32 or similar) so plays are reproducible.
