# E-0001 log: first game sim

Turn-by-turn transcript. **Designer** lines are verbatim; **Game** lines are what Claude showed. Rule changes the designer makes mid-play are tagged `RULE:` so they can be lifted into decisions later.

---

**Designer:** compacted. First, we're going to playtest, with you acting as if youre the game. ill instruct you along the way. record so that we can review it later. ready?

**Game:** Ready.

---

**Designer:** alright first lets try to figure out whats a "fun" way to assign mercs to quests. First, lets get the concepts done. "Merc" is mercenary. "quest" is quests. good or no?

**Claude (out of character):** "Merc" yes: it promises pay, risk, and people who can quit or die. Suggested "contract" instead of "quest", since mercs take contracts; it also makes pay and terms part of the fantasy. Keep "quest" if jobs go beyond paid work (personal or story jobs). Waiting on the designer's pick.

---

**Designer:** nah lets just stick with quests. alright lets start with one person quests. Say i have a merc, wolfkin named Atlas. Strong, smart, gruff, good with swords. Theres a quest, very simple, just says "slay bandits in the road and make it safe again".

`RULE:` the word is **quest** (not contract). Start with one-merc quests.

**Game:**
```
QUEST  Clear the Road
"Slay the bandits on the road and make it safe again."
Reward 40 crowns · 2 days · Danger ●●○

ASSIGN ▸ Atlas, wolfkin
  Strong · Smart · Gruff · Swords

  How Atlas would handle it:
  ⚔ Fight the bandits    Strong + Swords   ███████░░░  70%
  🧠 Spot the ambush      Smart             ██████░░░░  60%
  🗣 Make them leave      Gruff             ███░░░░░░░  30%

[Send Atlas]  [Cancel]
```

**Designer:** now ordinarily other games have "combat" here right

**Claude (out of character):** Yes. Battle Brothers: turn-based tactical battle. RimWorld: real-time pawn fights. Darkest Dungeon: turn-based rounds. Dispatch-style games skip it: AC Brotherhood's assassin missions, Dragon Age Inquisition's war table, Fallout Shelter quests (one hidden roll, then a report). Three options for us: (1) real tactical combat; (2) one roll, then a report (war table, flat); (3) the quest plays out as a short chain of beats, each a visible roll that a merc's traits sway, with pushes and choices between rolls ("rolls coins often" without a combat engine). Recommended (3). Waiting on the designer.

---

**Designer:** like turn based, whatever. what would be a fun substitute -- thats the goal here. we shall brainstorm and try. pls save the scenario.

`RULE:` the goal of this sim is a fun substitute for combat. Scenario saved to [scenario.md](scenario.md).

**Claude (out of character), brainstorm of combat substitutes:**
- **A. Push your luck.** The quest is 3–4 beats. Each beat is a roll. After each one: press on (more reward, more risk) or come home with what you have. Wounds stack. (Darkest Dungeon expeditions, blackjack.)
- **B. Coin pool.** Traits are coins. Each beat demands heads; you choose which trait's coins to flip on which beat, and a spent trait is gone for the quest. (Sultan's Game, Dicey Dungeons.)
- **C. Plan, then watch.** Before sending, pick an approach (night raid / frontal / parley / bait). It sets which traits count and what is at stake; the beats then roll on their own and you read them. (War table plus tactic.)
- **D. The merc has a will.** At key beats the merc acts in character before you can stop him (gruff Atlas insults the bandit chief → a duel). You react: back him, or overrule him and pay for it. Rolls happen on his choices. (RimWorld's personalities.)
- **E. Raise the stakes.** Before a roll you may bet more: Atlas risks an injury for double pay, or his life for the chief's head. (Gambling as the core verb.)
- **F. Duel of reads.** Big moments become a short guessing game against the enemy (strike / feint / guard) with trait-weighted odds. (Rock-paper-scissors with dice.)
Recommended first try: A, with D layered on (wager decisions plus a merc who surprises you). Waiting on the designer's pick.

---

**Designer:** so previously, going for engaging story doesnt work. so instead, we want a mechanic heavy game with ai only providing small story.

`RULE:` mechanics-heavy game; AI provides only small story. Recorded as [D-0004](../../docs/decisions/D-0004-mechanics-carry-the-fun-ai-writes-only-small-story.md).

**Claude (out of character):** Re-ranked the brainstorm by "fun with the text removed": B (coin pool) strongest, then A (push your luck), E (raise the stakes) and F (duel of reads). C leans on reading an outcome; D leans on story. Proposed first try: B + A, a coin pool spent across beats with a press-on-or-go-home choice between beats, and one AI line per beat.

**Designer (aside):** (pls make sure your data organizer remember what works vs what doesnt) (if it doesnt have that mechanism yet, code it first) (so whenever we comes up with anew idea, you can crosscheck w/ it)

Built: `docs/findings.md` lessons ledger plus checks and the cross-check step ([D-0005](../../docs/decisions/D-0005-findings-ledger-what-works-what-doesn-t-cross-checked-agains.md)).

---

**Designer:** i can envision the ai writing simple stuffs like. "Atlas goes to the road..." "Suddenly a bear appears!" (roll coin with modifiers based on atlas passives) "Atlas defeated the bear! and continues his walk") (in real game we probably draw it cutely with sprites or smth)

`RULE (candidate):` the quest plays as a walk; random encounters pop up; each is a coin roll modified by the merc's passives; the AI writes one line per moment; sprites in the real game.

**Cross-check (findings.md):** fits D-0004 (small AI lines on mechanical results) and the "rolls coins often" goal; avoids the failed story-led approach. Open risk: no player choice during the walk (close to the "one roll, then a report" option judged flat earlier).

**Game** (real rolls: `node -e` random 1–100, win if ≤ chance; chance = 50% + passives):
```
Atlas goes to the road...

🐻 Suddenly a bear appears!
   Strong +15 · Swords +15          chance 80%   rolled 67  ✔
   Atlas wrestles the bear off the path and continues his walk.

🏹 Arrows from the treeline! An ambush!
   Smart +15                        chance 65%   rolled 53  ✔
   Atlas smells them before he sees them and dives behind a cart.

🗡 The bandit chief steps out, blade drawn.
   Swords +15 · Gruff +10           chance 75%   rolled 56  ✔
   One growl, three cuts. The chief flees and the road is clear.

QUEST COMPLETE  +40 crowns
```

---

**Designer:** no i want to make it fun first. can you do a reesearch what other games do for this kind of "squad building" -- what makes the "deployment" fun? must it be actual gamepaly or will something like this kind of gambling works?

Paused the sim for research: [E-0002](../E-0002-what-makes-squad-deployment-fun/).

Research done ([E-0002](../E-0002-what-makes-squad-deployment-fun/), synthesis in [squad-deployment.md](../../docs/reference/squad-deployment.md)): dice can replace combat if every roll pays off a player decision. Run 1 hit four failure markers (no choice mid-walk, foregone outcome, free send, no lasting change). Sim resumes with those levers.

---

**Designer:** pls rmb the tone: world is dark fantasy but tone should be light / fast paced like the above.

`RULE:` dark fantasy world, light and fast-paced tone, voice as in run 1. Recorded as [D-0006](../../docs/decisions/D-0006-dark-fantasy-world-light-and-fast-paced-tone.md).

---

**Designer:** OK lets use coins then, probably good and fun. So logically, for each quest, engine first rolls what kind of "tests" it will have. For example, on a guardign quest, a "STR + swords" test, then a "END + survival" test, then a "STR + swords" again. each has number of coins the enemies will flip. your coins is affected by STR and relevant traits. Lets try. First i saw the three tests, then i put Atlas in the quest, then click end day.

`RULE:` coins. A quest is a sequence of **tests** the engine rolls up front; each test is a stat + skill (e.g. STR + Swords) with a number of **enemy coins**. The merc's coins come from the stat plus matching traits. Flow: see the tests → assign the merc → End Day → resolve.

**Placeholders Claude filled in (not ruled):** stats from traits (Strong → STR 3, Smart → INT 3, others 2); a matching skill trait +1 coin; heads vs heads, ties go to the merc; a lost test wounds the merc (−1 coin for the rest of the quest); two losses fail the quest. Tests drawn at random from a small road pool; flips by [coins.mjs](coins.mjs) (real random).

**Cross-check (findings.md):** builds on "rolls that pay off a player decision" and "visible odds" (assignment is the decision, coins and odds shown). Risk: decisions happen only before the quest ("no player input during the quest" is in Doesn't work).

**Game:**
```
QUEST  Clear the Road                          2 days · 40 crowns
  1. Bandits on the road        STR + Swords    foe ●●●●
  2. A cold night in the woods  END + Survival  foe ●●●
  3. Another cold night         END + Survival  foe ●●●

ASSIGN ▸ Atlas  (STR 3 · INT 3 · END 2 · Swords)
  1. ●●●● (STR 3 + Swords)  vs ●●●●   64%
  2. ●●   (END 2)           vs ●●●    50%
  3. ●●   (END 2)           vs ●●●    50%

[End Day]
```
```
DAY 1
⚔ Bandits on the road!
  Atlas ●○○○ 1   Bandits ●○●● 3   ✘
  Three of them, one of him. He takes a cut across the ribs.  Atlas is WOUNDED (−1 coin)

🌲 A cold night in the woods
  Atlas ● 1   Cold ●○● 2   ✘
  Bleeding and freezing, Atlas gives up before dawn.

QUEST FAILED  Atlas limps home, wounded. No reward.
```

**Observations:** a 64% opener lost, and the wound rule (Claude's placeholder) dropped the next test to 31%: one bad flip decided the whole quest. The rolled tests (END + Survival twice) hit Atlas's weakest stat; with only one merc, the player saw it coming and could do nothing about it.

---

**Designer:** Writing not great. Bandits on the road! great -- then animation of coin flipping and bandits / atlas in pixel art or something -- yes quest have a "minimum success", harder = need success in more. Writing not great, should just be simpler. for eample Bandits on the road! Atlas took a cut! -- then engine tells its wounded. The second is decent. Ok first show me "atlas stat screen".

`RULE:` simple lines, engine states the effect ([D-0007](../../docs/decisions/D-0007-quest-lines-are-one-simple-exclamation-the-engine-states-the.md)). Quests have a minimum number of successes ([D-0008](../../docs/decisions/D-0008-quests-have-a-minimum-number-of-successes.md)).
`DIRECTION (not yet ruled):` show each test as a coin-flip animation with the merc and the foe in pixel art.

**Game** (all numbers are Claude's placeholders; the wound carries over from run 2):
```
┌─ ATLAS ─────────────────────── wolfkin · sellsword ─┐
│                                                      │
│   STR  ●●●   Strong                                  │
│   DEX  ●●                                            │
│   END  ●●                                            │
│   INT  ●●●   Smart                                   │
│                                                      │
│   SKILLS   Swords +●                                 │
│   TRAITS   Gruff   (+● to scare, −● to charm)        │
│                                                      │
│   CONDITION   🩸 Wounded  −● on every test · 2 days   │
│                                                      │
│   Wage 5 crowns/day · Quests 1 (0 won)               │
└──────────────────────────────────────────────────────┘
```

---

**Designer:** should have more stats, pls check docs v4. For skills should have level, eg sword lv1.

No v4 stat docs exist yet; the stat set comes from the v3 archive (GENERATION_FLOW §10: STR, DEX, INT, CHA, CON). `RULE:` skills have levels. Proposed as [D-0009](../../docs/decisions/D-0009-mercs-have-five-stats-and-leveled-skills.md) (the five-stat set waits on the designer).

**Game** (placeholders: coins = stat + skill level; skills level up with use):
```
┌─ ATLAS ─────────────────────── wolfkin · sellsword ─┐
│                                                      │
│   STR  ●●●   Strong                                  │
│   DEX  ●●                                            │
│   INT  ●●●   Smart                                   │
│   CHA  ●●                                            │
│   CON  ●●                                            │
│                                                      │
│   SKILLS   Swords Lv1  +●      ▰▱▱ 1/3 to Lv2        │
│   TRAITS   Gruff   (+● to scare, −● to charm)        │
│                                                      │
│   CONDITION   🩸 Wounded  −● on every test · 2 days   │
│                                                      │
│   Wage 5 crowns/day · Quests 1 (0 won)               │
└──────────────────────────────────────────────────────┘
```

**Designer:** or rather just make the "skills" like the "stats" eg "swords (3 coins)

`RULE:` skills are counted in coins, like stats (D-0009 updated, still proposed for the stat set).

**Game:**
```
┌─ ATLAS ─────────────────────── wolfkin · sellsword ─┐
│                                                      │
│   STATS                     SKILLS                   │
│   STR  ●●●   Strong         Swords  ●                │
│   DEX  ●●                                            │
│   INT  ●●●   Smart                                   │
│   CHA  ●●                                            │
│   CON  ●●                                            │
│                                                      │
│   TRAITS   Gruff   (+● to scare, −● to charm)        │
│   CONDITION   🩸 Wounded  −● on every test · 2 days   │
│                                                      │
│   Wage 5 crowns/day · Quests 1 (0 won)               │
└──────────────────────────────────────────────────────┘
A test pays stat + skill: STR + Swords = ●●●● (−● wounded)
```

---

**Designer:** oh yea i mean v3. ok sounds good. add LEVEL too. like Lv 1. and when they level up, add a "level up screen" that player can choose which attr they can increase in. remove the "strong/smart" thing, instead, add a "talented" to one or two stats, e.g., STR+ or STR++. The two stats are chosen randomly, can they can overlap (eg STR+ DEX+ or STR++ one). Propose a level up mechanism.

`RULE:` D-0009 accepted (five stats, skills in coins). Level, random talents, level-up screen: [D-0010](../../docs/decisions/D-0010-mercs-have-a-level-and-one-or-two-random-talents.md). Level-up mechanism proposed: [D-0011](../../docs/decisions/D-0011-level-up-pick-a-stat-flip-a-coin-per-talent-mark.md).

Atlas's talents, rolled for real: **INT+ CON+**. (The flavor "strong" is gone; the dice made him a tough thinker.)

**Game:**
```
┌─ ATLAS · Lv 1 ──────────────── wolfkin · sellsword ─┐
│                                                      │
│   STATS                     SKILLS                   │
│   STR  ●●                   Swords  ●                │
│   DEX  ●●                                            │
│   INT  ●●●  +                                        │
│   CHA  ●●                                            │
│   CON  ●●●  +                                        │
│                                                      │
│   TRAITS   Gruff   (+● to scare, −● to charm)        │
│   CONDITION   🩸 Wounded  −● on every test · 2 days   │
│                                                      │
│   XP ▰▰▱▱▱ 2/5 to Lv 2 · Wage 5/day · Quests 1 (0 won)│
└──────────────────────────────────────────────────────┘
```
```
⭐ ATLAS reached Lv 2!  Train one stat:

   STR  ●●       +1
   DEX  ●●       +1
   INT  ●●● +    +1, then flip ● for +1 more
   CHA  ●●       +1
   CON  ●●● +    +1, then flip ● for +1 more
```

---

**Designer:** so for level up definitely has a "button" to allow them to level up when they reach the exp threshold. ofc xp can "overflow" to next one. xp should be like in path of exile where your xp gain is severaly penalized if oging on lower level quests. SKILLS have their own exp i agree, sounds fun. so the "gacha" are the skills and traits the unit have at start yea? for level up, first ask if its better to have ONE, TWO, or THREE coins per level?

`RULE:` level-up button, XP overflow, PoE-style penalty on lower-level quests, skill XP: [D-0012](../../docs/decisions/D-0012-xp-level-up-button-overflow-penalty-for-low-level-quests-ski.md).

**Claude (out of character):** Yes, the recruit's roll is the gacha: talents, starting skills, personality traits (and race). Coins per level, odds from coins.mjs (opposed flips, ties to the merc):

| coins per level | one level ahead at Lv1 | one level ahead at Lv10 | pool at Lv10 |
|---|---|---|---|
| 1 | 64% → 75% | 58% → 65% | ~13 |
| 2 | 64% → 83% | 56% → 67% | ~22 |
| 3 | 64% → 89% | 55% → 69% | ~31 |

Recommended one coin per level (plus talent flips): pools stay countable and quick to animate. Added to D-0011 (still proposed).
