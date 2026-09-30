# Saga theme seeds (docs/STORYTELLER.md §D.2)

`themes.json` — 1,232 curated themes, one dealt per saga by the engine's seed dealer (Phase 2). They are the
FIRST content of the seed slot: repetition is fixed later by pruning/adding here or changing the dealer, never
by prompt rules (designer 2026-10-01: "repetition can be fixed later by seeding").

Record: {theme, group, sub, tone, scale} (some records also carry region/want).

## How it was built (2026-10-01)
# Saga themes: final pass

Input 1,236 → dropped 108 near-duplicates → 1,128 kept → added 104 new → **1,232 final** (`themes.json`, 12 groups, 61 subs, 14–27 per sub).

## Dedup rules

1. **Same core idea = duplicate**, whatever the wording, race or scale: same situation + same kind of person + same conflict (e.g. "elder refuses the ritual death-walk" into snow vs into sea; "moneylender/gaol holds a corpse until the family pays"; "rival companies hired to guard the same gate").
2. **Mirror images count** (heir smells wrong vs claimant smells right; jilted-at-altar hires / is hired by the ex).
3. **Keeper = the better hook**: the version that names a specific person, a sharper conflict, or clearer work for hired swords; ties go to the less crowded group/tone/scale.
4. **Motif clusters thinned**, not just pairs: where one image recurred 4+ times across groups (cold/torpid lizardfolk, lizard eggs hatching among humans, wolfkin scent, wolfkin challenges, howling, dancing bears, ancient/unknown coins, wreckers, executioners who won't work, unseen leaders who still give orders, elves returning to aged/dead human lovers, speaks-only-another-race's-tongue, last-journey escorts, sealed boxes delivered unopened), kept the 2–5 most distinct.
5. Staples list (land disputes, handed-over tokens/ledgers, name lists, warden-stones, plain missing persons, plain monsters): none found needing removal; new themes avoid them.
6. New themes were checked against the kept list (token overlap + manual read) and against the category-plan examples; 2 that echoed plan examples were rewritten.
7. **23 kept themes trimmed** from 13–15 words to ≤12 with meaning unchanged (e.g. "a knight won't wash until he bests the elf who mocked him"). Every theme is now 4–12 words.

## Distribution (input → final)

| group | in | final |
|---|---|---|
| 1. Kin & Inheritance | 104 | 105 |
| 2. Love, Marriage & Betrayal | 96 | 98 |
| 3. Crime, Debt & the Underworld | 108 | 107 |
| 4. Faith, Shrines & Omens | 95 | 99 |
| 5. Trade, Craft & the Road | 115 | 114 |
| 6. Lords, Law & Rule | 99 | 101 |
| 7. War, Veterans & Sellswords | 100 | 99 |
| 8. Wilds, Beasts & Weather | 97 | 98 |
| 9. The Uncanny (low magic) | 113 | 105 |
| 10. Sickness, Healers & the Dead | 100 | 102 |
| 11. Fairs, Games & Rivalry | 94 | 99 |
| 12. Peoples & Strangers | 115 | 105 |

| tone | in | final | % |
|---|---|---|---|
| funny | 228 | 225 | 18.3 |
| political | 215 | 211 | 17.1 |
| strange | 189 | 179 | 14.5 |
| grim | 169 | 166 | 13.5 |
| personal | 168 | 161 | 13.1 |
| tender | 158 | 156 | 12.7 |
| tense | 109 | 134 | 10.9 |

| scale | in | final | % |
|---|---|---|---|
| family | 370 | 341 | 27.7 |
| village | 342 | 321 | 26.1 |
| town | 232 | 220 | 17.9 |
| city | 186 | 174 | 14.1 |
| region | 106 | 176 | 14.3 |

## Top-up

104 new themes, aimed at the thin cells: **region** scale (8.6% → 14.3%; 76 of the new themes are region), **tense** tone (8.8% → 10.9%, and group 9 had none), **tender** in groups 6/7/10, and the three smallest subs (Taxes, Afflictions, Underdeep). Every group got 5–12. Now the six named tones sit between 12.7% and 18.3%; tense is the seventh tag.

## Files
- `themes.json`: final array of {theme, group, sub, tone, scale}; group is the number above.
- `input.txt` / `drops.txt` / `additions.txt` / `build.py`: the source list, the drop list, the new themes, and the merge script (rerun `python3 build.py` to rebuild).


## Variety critic — the to-do list for a later pruning pass (not blocking; followability comes first)
Report on /tmp/claude-1000/-home-irvan-airaider/80974e3b-1108-4ee5-8d27-6e2a5e6f3904/scratchpad/themes/themes.json (1,232 themes, not modified)

Method: I took two samples of 30, one at indices i*41 (sample A) and one at i*41+20 (sample B). I read the whole list and tagged it by story skeleton by hand. The keyword counts are only a cross-check.

## 1. Pairs that would feel like "the same story again"

**Sample A (0, 41, 82 … 1189):**
- **Strong: 41 and 615.** In both, the family won't pay to free a captive relative: "sisters in no hurry to pay her ransom" and "kin have stopped paying for his keep". Same twist, same cast.
- **Strong: 205 and 328.** A moneylender holds something sacred as a pledge: a family tomb in one, the patron saint's relic in the other. Same redeem-or-evict plot.
- **Medium: 697 and 738.** A shore village where something comes in from the sea: soldiers' boots, marching crabs. Neither names a person, so both become "find what's in the water".
- **Medium: 779 and 820.** Drought or blight turns villages on each other: a scapegoat, burned fields.
- **Medium: 492 and 1025.** An old craftsman's last wish at the edge of the world: the deepest seam, the edge of his map.
- **Medium: 82 and 1189.** A surface family's secret dealings with the folk below.
- **Weak:** 533 and 574 (defying a lord's petty decree); 123 and 1107 (love across races against the kin).
- **The repetition the player will feel most:** 6 of 30 are "a strange sign, go find the cause" (82, 697, 738, 902, 984, 1148). They look different on the surface but the plan will have the same shape.

**Sample B (the cross-check):**
- 6 of 30 are inheritance or succession fights (20, 225, 348, 594, 1086, 1209).
- 20 and 225 are both a will that surprises the heirs.
- 61 and 676: a parent against the law over a son.
- 184, 1127 and 1209: an elf keeping faith across human lifetimes.

## 2. Recurring skeletons (my hand tags; "per 30" is how many to expect in 30 draws)

| Skeleton | Count | Share | Per 30 |
|---|---|---|---|
| **A. Strange sign, cause unknown, investigate** | 216 | 17.5% | ~5.3 |
| of which A0: no person at stake, no conflict | 53 | 4.3% | |
| **Old/dying person's last errand, plus escort-before-a-deadline** | 67 | 5.4% | ~1.6 |
| Holdout: refuses a duty, an order, or to leave | 46 | 3.7% | |
| Authority's decree against defiant commoners | 46 | 3.7% | |
| Inheritance/succession fight | 44 | 3.6% | |
| Love across a line | 42 | 3.4% | |
| Old pact or promise falls due (mostly elves) | 38 | 3.1% | |
| Reclaim / give it back / custody | 31 | 2.5% | |
| Returned wrong / impostor / changeling | 30 | 2.4% | |

- **Skeleton A is the only one well over 5%.** It spans groups 4, 5, 8, 9, 10 and 12, so balancing draws by group or sub does not stop it.
- **A has answer magnets.** About 22 of the strange-sign themes point to "it's coming from below" (for example 236, 307, 463, 477, 708, 732, 1181–1193). About 12 point to "someone is skimming or smuggling" (275, 277, 279, 281, 283, 454, 570, 579, 1228). The plan call will reuse those answers.
- **"Reclaim / give it back" (2.5%) is the known "hand the item over" staple in new clothes:** 204, 312, 750, 819, 1030, 1041, 1133, 1189, 999, 689.
- **Race trait bundles.** 34% of themes name a nonhuman race. Within each race the hook narrows:
  - lizardfolk: 48 of 123 (39%) turn on eggs, shedding, cold or tide;
  - elves: 56 of 129 (43%) turn on long life, old promises or trees;
  - wolfkin: 31 of 122 (25%) turn on scent, challenges, howling or pups.
- **Word habits.** "heir" appears in 64 themes (5.2%) and weddings in 68 (5.5%). These are word habits rather than skeletons, but they add to the sameness.

**Near-duplicate clusters still in the list after dedup** (keep 1–2 of each):
- atonement tour: 55, 94, 264, 1015
- executioner balks on the eve: 48, 288 (and 759)
- refuses to leave drowning land: 330, 1158 (and 772, 800)
- passage through the highlands: 1227, 1230 (and 622, 440)
- a guild withholds its service as pressure: 418, 419
- food left out and taken each night: 82, 829 (and 944, 300)
- secret digging at night: 91, 636 (and 313, 708)
- an old person who keeps wandering off: 776, 1222
- a precious thing gambled away: 223, 1074, 1075, 1080, 1085, 1086, 1088, 1091
- an unlikely heir named: 5, 10, 13, 14, 17, 244, 366, 528, 531
- paternity shown in the child: 72, 79, 85, 155
- blood kin reclaim a child raised by another people: 76, 620, 1195, 1196, 1197, 1210
- every spouse in the village does something at once: 127, 158
- several parties hire swords for the same thing: 125, 183, 588
- a human guards a lizardfolk clutch: 1, 111, 1045, 1148
- an unknown egg hatches: 221, 1147
- elf/human lifespan mismatch: 46, 184, 187, 864, 980, 1135, 1140
- guarding against a threat nobody else sees: 97, 245, 700, 712, 1220
- hangman: 14, 48, 113, 288, 551, 990, 1023, 1229
- wolfkin scent: 10 themes (30, 76, 85, 145, 421, 549, 664, 840, 947, 1164). THEMES_NOTES says this motif was thinned to 2–5.
- wolfkin challenge: 7 themes (89, 166, 526, 647, 1171, 1176, 1178)
- miners break into the deep-folk's domain: 477, 808, 1105, 1181, 1182, 1184, 1193

## 3. Themes that break the bar

- **Proper names, numbers, genre labels:** none. Every theme is 4–12 words. The ordinals "first" and "one" are fine.
- **Spoiled answers** (the theme gives the culprit or the method):
  - 279 (silver smuggled out in pony bellies)
  - 403 (mine-master pockets the offerings)
  - 812 (the cure-seller arrives the day after the blight)
  - 1192 (orphan-master selling children below)
  - 726 (the dog bites the husband's brother, which points straight at the murderer)
  - 236 (false coin minted "below the streets")
  - borderline: 457, 932
- **No person at stake:** the 53 A0 themes break the "person with a problem and a conflict" rule. Examples: 354, 358, 361, 363, 375, 724, 735, 738, 740, 741, 743, 773, 792, 868–880, 886, 887, 924, 1152.
- **Modern wording:** 1113 "farewell tour", 861 "craze", 652 "contract clause", 595 "ballot jar", 123 "mid-negotiation", 650 "mid-contract", 218 (paid in scrip at the company shop).
- **Quest types in disguise** (a single job, with the whole plot named): 440, 452, 622, 623, 761, 782, 1032, 1125, 1227, 1230.
- **Staples still present:**
  - plain missing person: 27, 667, 896, 907
  - land/boundary dispute: 787, 680, 1072, 1145

## Fixes (each is a rule, not a patch for one theme)

1. **Add a `skeleton` field to every entry**, using the shapes above, and have the engine refuse to repeat a skeleton within the last several sagas. The existing group, sub, tone and scale tags cannot see skeletons that cross groups.
2. **Cut skeleton A from 17.5% to 8% or less.** Every strange-sign theme must name who is hurt, or who profits from it or gets blamed (779, 774 and 859 do this right). Delete the A0 themes or rewrite them to that rule.
3. **Spread the answer magnets.** Tag A themes with their likely answer ("from below", "skimming", "a ghost's grievance") and cap each one.
4. **Race is cast, not plot.** Cap trait-driven hooks (eggs, scent, long life) at about 20% per race. The test: the hook should still work if the race were swapped.
5. **Collapse the near-duplicate clusters** to 1–2 each, and rewrite spoiled themes to describe the symptom rather than the mechanism or culprit.
6. **Keep 10 or fewer escort-before-a-deadline themes**, and give each a conflict between people beyond the trip itself.