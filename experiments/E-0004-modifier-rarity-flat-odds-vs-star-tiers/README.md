---
id: E-0004
title: Modifier rarity: flat odds vs star tiers
date: 2026-10-21
status: done              # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: How should modifiers be rolled on recruits so they stay rare but make a pull exciting, flat odds or star tiers?
verdict: Stars, in half steps; the star sets each battle skill's modifier odds, capped at 4, and high stars get commoner as the game goes on (D-0027).
decisions: [D-0027, D-0028, D-0029]             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer wants modifiers rare and part of the recruit gacha (D-0025, proposed), and floated two ways (2026-10-21): "40% no mods, 50% one mod, 9% two mods, 1% three mods? or maybe we give units rarity (like stars in gachas, from 1 star to 5 stars, the hgiher the stars the more likely it rolls more mods?)" Then: "yea xpermeint with this first and see if it lands or not".

Lands = a tavern board reads at a glance, most recruits are plain, a multi-mod skill is a moment you remember, and a campaign (assumed ~40 recruits seen) shows a jackpot sometimes, not always.

## Setup

`rarity.mjs` (skill and mod data from E-0003 `skills-mock2/gen.mjs`). Each merc has a 4-skill kit (S1, S2 open; one unlocks at Lv6, one at Lv12). A mod is drawn from the mods that fit the skill, 4x likelier if its theme matches one of the merc's cores.

| scheme | rule |
|---|---|
| **flat** | each skill rolls 40/50/9/1 for 0/1/2/3 mods (the designer's numbers, read per skill) |
| **flatmerc** | one 40/50/9/1 roll per merc; the mods land on one random skill (the same numbers, read per merc) |
| **starodds** | pull 1★–5★ at 40/30/18/9/3%; the star sets each skill's odds (1★ 85/15/0/0 … 5★ 5/50/35/10) |
| **starcount** | same star pull; the merc gets exactly star−1 mods, each on a random skill (max 3 per skill) |

`node rarity.mjs stats 100000` → `samples/stats.txt`; `node rarity.mjs board <scheme> 3` → `samples/boards.txt`.

## Result

| scheme | mercs with no mod | best skill has 2 mods | has a 3-mod skill | campaigns with a 3-mod skill |
|---|---|---|---|---|
| flat | 3% | 30% | 4.1% | 81% |
| flatmerc | 40% | 9% | 1.0% | 34% |
| starodds | 27% | 12% | 2.8% | 68% |
| starcount | 40% | 12% | 1.1% | 36% |

Reading the boards as a player:
- **flat** (per skill): almost every merc is covered in mods, and 81% of campaigns show a three-mod skill. Not rare; the board is noisy.
- **flatmerc**: rare and clean, but nothing sums up a recruit: you scan four skill lines to spot the one good one.
- **starodds**: the star lies. A 4★ can roll nothing and a 1★ can roll a mod, so the star is odds, not a fact about the merc.
- **starcount**: the star is a fact you read at a glance (★★★ = two mods), most recruits are plain, and +1★ is a natural target for the rare upgrade item.
- **Placement matters in every scheme.** A 5★ sample (starcount, seed 2) put all four mods on the Lv6 Potion and the Lv12 basic Strike, so the jackpot landed on its two weakest skills. Random placement can waste a jackpot.

Claude's read: starcount lands best; flatmerc is the plain fallback if stars feel too gacha. Open: mods should probably favour the merc's signature skills, and whether stars should say anything beyond mods.

## Round 2: the designer's rulings

The designer: "Stars: yes. and make it every half star so even more variance. Higher rarity units become mroe "common" as game progress. ... for now rarity only affect mods. lets cap mods at FOUR mods ... like 0.1% on a five star unit per skill", plus one new battle skill per level up, four equipped (D-0027, D-0028).

`halfstar.mjs` (`stats 50000` → `samples/halfstar-stats.txt`; boards at game start and end and one 4★ career → `samples/halfstar-boards.txt`). Each battle skill rolls 0–4 mods by star (1★ 88/12/0/0/0 … 5★ 30/50/16/3.9/0.1, half stars average their neighbours). The recruit star mix slides from mostly 1–2★ at the start to mostly 2.5–4★ at the end. Careers are 2 start skills + 11 level ups = 13 battle skills.

| star | skills with a mod | mods on the best 4 | has a 2-mod skill | 3+ | 4 |
|---|---|---|---|---|---|
| 1★ | 1.6 | 1.5 | 0% | 0% | 0% |
| 2★ | 3.2 | 3.2 | 23% | 0% | 0% |
| 3★ | 5.2 | 4.8 | 61% | 12% | 0% |
| 4★ | 7.2 | 5.9 | 84% | 23% | 0.24% |
| 5★ | 9.1 | 7.0 | 95% | 41% | 1.3% |

- A four-mod skill turns up in about 1 of 80 full 5★ careers: very rare, as asked.
- The star now promises every future roll, so it reads true even when a recruit shows two plain skills.
- A merc's kit of 4 base skills repeats often over 13 level ups (one 4★ career rolled Strike four times). Each skill needs more base battle skills, or a repeat should be the hoped-for better copy.

## Verdict

Stars in half steps set each battle skill's modifier odds (cap 4, about 0.1% for four on a 5★), and high stars get commoner as the game goes on (D-0027). Mercs roll a battle skill per level and equip four (D-0028); rare items raise the star or reroll the seed (D-0029). Numbers are working values; balance is parked.
