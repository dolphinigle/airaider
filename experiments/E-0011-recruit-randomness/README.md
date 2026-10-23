---
id: E-0011
title: Recruit randomness
date: 2026-10-23
status: done              # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: What is rolled when a merc is made, with what odds, and do the recruits read as varied but fair?
verdict: recruits roll race, star, bell-curve stats, talents, AI-picked skills (one weapon or magic) and pre-rolled abilities; race and gender are star-less traits (D-0110, D-0111, D-0113, D-0114)  # one line, filled in when done: the answer
decisions: [D-0110, D-0111, D-0113, D-0114]       # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

The designer, 2026-10-23: "next: propose the unit irandomness". Ruled pieces: merc star and pull odds by game progress (D-0069, E-0004), starting stats (D-0106), talents (D-0018), races (D-0108, D-0109), traits with stars (D-0039, D-0068), 2 battle + 2 check skills, Lv 3 / Lv 5 picks of 1 of 3 (D-0102, D-0104), all abilities pre-rolled (D-0104), at most one weapon skill (D-0090), exclusive blood skills (E-0007).

## Setup

`recruit.mjs`: `node recruit.mjs [seed] [progress]` three recruits; `node recruit.mjs stats [progress]` mixes over 20000 recruits. Uses E-0007 `baseline.mjs`, E-0009 `attributes.mjs`, E-0004 odds. Samples in `samples/`.

## Result

Claude's draft (2026-10-23), proposed to the designer. Rolled at recruitment, in order:
1. **Race** (human 40%, the other five 12% each); a human also rolls a people (flavor).
2. **Merc star** by game progress (E-0004: early 1★ 30% … 5★ 0.5%; late 1★ 8% … 5★ 4%).
3. **Starting stats** (D-0106) and **two talents**.
4. **Skills:** 2 battle + 2 check, then the Lv 3 offer (3 battle) and the Lv 5 offer (3 check). Skills that use a talented attribute are twice as likely (a soft lean). At most one weapon skill; blood skills only for their races, at most one.
5. **Skill stars:** around the merc's star: same 45%, ±½★ 20% each, ±1★ 7.5% each.
6. **Abilities:** five per battle skill, including the Lv 3 offers (D-0104); three bases dealt per slot, rarer bases likelier at higher skill stars; mod count by skill star (E-0004 odds).
7. **Traits:** gender (flavor), race (its +1 / −1, D-0110), one personality (a second 25%), one body; personality and body each with a star around the merc's star (race and gender have none, D-0111).

Numbers: early game 74% of starting abilities have no mod, 22% one, 3% two; late game 62 / 31 / 6%. 29% of recruits have no weapon or magic skill and open with a generic attack (D-0050).

Mid-session ruling (D-0110): race and gender are traits; the race trait carries the stat shift; humans none; gender flavor only.

## Verdict

Designer rulings: one starting battle skill is always weapon or magic; skills are engine-dealt and AI-picked with no talent lean (D-0114); race and gender are traits, the race trait carries the stat shift, humans and gender no effect (D-0110); race traits have no star (D-0111); starting attributes 5–15 on a bell curve (D-0113). Skill-star spread and race odds left to Claude. Generic first attacks drop from 29% to 0%.

**One AI ask** (designer, 2026-10-23: "ai should decide all of them at start. so ai ask to pick: starting two skills, three offered in mid, same with non battle"): at recruitment the AI gets one battle deal (8 legal skills, at least 3 weapon or magic) and picks the 2 starting skills and the 3 the Lv 3 offer will show; and one check deal (8) for the 2 starting and the 3 for Lv 5. Replaces D-0114's per-slot deals (Claude's working numbers).

## Next
