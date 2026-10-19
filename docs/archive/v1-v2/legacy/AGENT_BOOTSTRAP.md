# Agent Bootstrap — read this first

**Status:** Canonical (last refreshed after the 200-day validation sim).

If you are a fresh AI agent or new collaborator picking up this project, this is the **30-second load**. Read this whole file, then go to `CANONICAL_DESIGN.md` for the full picture.

---

## What this project is

**Airaider** is a single-player, **AI-driven mercenary-fort management game**. You play a commander (avatar; e.g. "Drust") who owns a small fort, hires mercenaries, takes contracts, captures humans, builds rooms, and climbs prestige tiers. Scenarios are LLM-generated and resolved by a **Sultan-coin** mechanic.

**Genre frame**: dark fantasy, mortal-stakes, Darkest-Dungeon veterancy + Path-of-Exile loot/tag tiering + Crusader-Kings character intrigue.

---

## The 7 things you must know before reasoning about the design

1. **5 attributes (locked, final):** Physical, Agility, Intelligence, Charisma, Willpower. Each has an *active* and *defensive* face. Descriptor scale is **mundane** (Poor → Peerless), not rarity-loaded.
2. **Tag system (PoE-style, unified vocabulary).** One ~50-100 tag vocabulary covering personality, gender, physicality, background, faith. Rarity (common/uncommon/rare/legendary) × roll quality (T1-T5). Mostly fixed at hire. **Rarity vocabulary is reserved for tags ONLY.**
3. **Veterancy = Levels (DD-style).** Earned via contracts. Primary role: gates which quests a unit can take. Secondary: tiny attribute boost per tier.
4. **Sultan-coin resolution (SIM_BIBLE §17).** Hidden 4-band coin-flip mechanic. AI authors a *target*, NOT a numeric threshold. Bands are HIDDEN pre-flip. Player commits, then sees result.
5. **Flat wage.** All mercs cost the same per day. The constraint is **bedrooms**, not coin/day. Gold sinks will come later via building upkeep + a CK-style luxury slider.
6. **Permadeath is real.** Mercs die. Validated 2× in 200-day sim (Marek D84, Kael D165). Drives the loss-side dopamine.
7. **Personality mutex groups.** Mercs have personality tags from mutually-exclusive groups (temperament, mood, ethics, work-ethic, allegiance, money, faith, gender, background). Prevents contradictions, drives consistent in-character behavior.

---

## The dopamine spine (one sentence)

**Recruit lottery + tag synergy + captive/artifact loop**, scaled across prestige tiers P0→P4+, producing the ladder common → uncommon → rare → legendary in both *recruitment dopamine* and *story consequence*.

---

## What is locked vs open

- **Locked**: Core architecture (5 attributes, tag model, Sultan-coin, flat wage, permadeath, prestige tiering shape, mutex groups, dopamine ladder validity).
- **Locked-shape, open-numbers**: Veterancy XP curve, recruit refresh cadence, building upkeep coefficients, artifact drop rates.
- **Open**: Loyalty mechanic spec, Willpower-survival math, quest-arc auto-seeding from legendary tags, full 50-100 tag vocabulary authoring, all-heads/all-tails crit triggers, multi-artifact-per-merc rules.

Full open-spec list (ranked) lives in `CANONICAL_DESIGN.md` §7.

---

## Reading order (after this file)

1. **`CANONICAL_DESIGN.md`** — the full synthesis. Read this in full. Everything below is detail/legacy.
2. `OPEN_QUESTIONS.md` — living list of unresolved questions (will be re-aligned with the canonical doc).
3. `VISION.md` — one-page pitch.
4. **Legacy docs** (`CORE_CONCEPTS.md`, `RAID_DESIGN.md`, `HEROES_AND_GROWTH.md`, `GAMEPLAY_LOOP.md`, `PROGRESSION_AND_PAYOFF.md`, `FORT_AND_PRESTIGE.md`, `PROBLEM_AND_INHERITANCE.md`) — predate the 200-day sim. Each has a SUPERSEDED banner at the top listing what's still valid and what's been replaced. Read only when you need the *historical* perspective or the parts still in force.

---

## Critical terminology rules (will trip up old docs)

| Don't say | Say instead | Why |
|---|---|---|
| heroes | mercenaries | Sets the tone — mortal, pragmatic, replaceable |
| Narrated Pool | Sultan-coin / §17 resolution | Mechanism evolved. Sultan-coin replaces Narrated Pool. |
| stats | attributes | Attributes are the locked term |
| traits | tags | Tags are the unified loot/identity system |
| loyalty 100 | (no replacement yet) | Binary loyalty was REJECTED. Loyalty mechanic is OPEN. |
| safe XP grind / TRAIN scenario | (removed) | No safe XP grind. Mercs level by doing risky things. |
| legendary attribute | legendary tag + peerless attribute | Rarity vocab is for TAGS ONLY |

---

## The standing rules

- **Avatar wage = 0** (Drust costs nothing to maintain)
- **Building takes no scenario slot, no quality penalty** — pay gold, wait 1 day, room appears
- **Party size minimum 2 for raids**; `target_heads += (party_size − 2)` solo allowed for default scenarios
- **Bankruptcy = debt, not game-over**
- **Forced-rest thin days are FINE** (Day 6 finding overruled Day 7)

---

## Pointer to session artifacts

The 200-day sim, full findings log, and intermediate work products live in the agent's session-state folder:
- `~/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/findings.md` — full chronological lock log (~807 lines)
- `~/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/sim_validated_d1_10.md` — full Day-1-to-200 sim (~1125 lines)
- `~/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/TOTAL_DESIGN_WRITEUP.md` — the source for this doc's content (also posted as GitHub issue #2)

These are session artifacts, not committed to the repo. If you need to consult them, read directly. If you want the canonical condensed version, just use `CANONICAL_DESIGN.md`.

---

## You are now oriented

Go read `CANONICAL_DESIGN.md`.
