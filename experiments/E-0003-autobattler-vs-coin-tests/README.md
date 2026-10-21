---
id: E-0003
title: Quest gameplay: autobattler vs coin tests for combat and non-combat skills
date: 2026-10-21
status: running
type: sim                 # research + sim
question: Should quests resolve fights as a Loop Hero-style autobattle instead of coin tests, and should non-combat checks (lores, talk, stealth) use the same engine or a different one?
verdict:                  # one line, filled in when done: the answer
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer (2026-10-21): "previously you just flip coins vs tests. but my concern is, lots of the 'skils' like the heavy weapon, ranged, etc, are 'combat' skills. in checks it make little sense to must pick one of them. maybe autobattler is better? do we still want autobattler for, say, other skill checks like lores? pls experiment, investigate online, then propose"

The problem: a test pools stats plus ONE core skill (D-0019). Six of the 27 cores are Fighting skills, and a fight test that names "Light Weapons" fails a merc who carries an axe. Fights are where weapon, armor and approach should matter, and a single pooled test flattens all of that.

Cross-check with findings: an autobattle has no player input while it runs, which is the known "spectator mode" failure (findings: Doesn't work). It can only work if the decisions sit around it: loadout, approach, retreat, push. That builds on "rolls that pay off a player decision" and answers the open question "What replaces combat?".

What would change our minds: if the sims show autobattle fights are no more decision-rich than coin tests, or if a single engine reads worse for talk/lore than a plain test, we keep tests for that side.

## Setup

1. Research sweep (2026-10-21): five parallel web sweeps plus a completeness critic, Opus agents; reports in [samples/](samples/) (`research-*.md`; the critic's eight cross-report conclusions are the summary).
2. [spec.md](spec.md): shared mercs, two scenarios, five candidate models (A family tests, B Loop Hero split, C coin autobattle, D tracks, E clash).
3. A build-and-sim workflow was started and stopped on the designer's call ("dont build just 'mock' them to me then propose first"); nothing from it is kept.
4. [mocks.md](mocks.md): paper mocks of all five on Atlas, shown to the designer with a proposal.
5. Designer steered to a party coin autobattle with Dragon Age / Live A Hero-style tactics. [partysim.mjs](partysim.mjs): 4 mercs, only mercs flip (attacks: heads = damage; defense: armor coins block), ordered "if condition → skill" rules per role; 4 party makeups × 5 foe groups (road bandits, barrow skeletons + draining wight, wolf pack, ogre, cultists + foe healer). Foe HP calibrated per group so the classic party with simple rules wins ~50% (`calibrate`); `search` tries every rule combo from a small menu (n=500 per combo).

## Result

_Interim, 2026-10-21 (party sim)._ Full table: [samples/party-search.txt](samples/party-search.txt); fights: [samples/party-fights.md](samples/party-fights.md).

- **Tactics carry the fight.** Classic party (2 warriors, mage, healer): median rule set 8-50% by foe, best 44-86%, worst 0-2%.
- **The best rules change with the foe.** Mage: area first vs wolves and skeletons, single bolts vs the ogre, backline first vs the cult. Healer: always heal vs the ogre and wolves, heal below 25% vs the cult.
- **Party makeup matters by foe.** vs cult: 3 warriors best 26%, 2 mages 100% (only ranged can reach the foe healer).
- **Close wins happen.** Best rules vs ogre, seed 3: the ogre falls in round 12 with the tank at 1/12; simple rules on the same flips wipe the party.
- **Problems.** About 40-60 lines per fight; wipes under bad rules; taunt never paid; with uniform foes one rule set won everywhere.

## Verdict

What we now believe, in a sentence or two. What it changes, and any decision it proposes.

## Next

Optional. The follow-up it suggests.
