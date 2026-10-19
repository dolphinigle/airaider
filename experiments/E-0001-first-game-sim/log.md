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

Built: `docs/findings.md` lessons ledger plus checks and the cross-check step ([D-0005](../../docs/decisions/D-0005-findings-ledger-what-works-what-doesn-t-cross-checked-against-every-new-idea.md)).

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
