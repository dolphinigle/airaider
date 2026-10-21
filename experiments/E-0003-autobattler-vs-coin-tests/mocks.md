# E-0003 mocks: five ways to play a quest

Paper mocks, shown to the designer before anything is built (designer, 2026-10-21: "dont build just 'mock' them to me then propose first"). Same merc and quest throughout.

**Atlas** (wolfkin): STR 2 · DEX 3 · PER 2 · INT 2 · CHA 3 · CON 3 · Swords (Light Weapons) ●. Quest **Clear the Road**. Odds are real coin math; foe numbers are placeholders.

## A. Family tests (today's rules, minimal fix)

A fight test names "Fighting", and the merc brings their best weapon core. No choices during the quest.

```
CLEAR THE ROAD · need 2 of 3
1 Find them   PER 2 + INT 2 (no Survival/Awareness) · 4 coins, need 2 · 69%
  ●○●○ 2 → SUCCESS   Atlas sniffs out their smoke.
2 The gang    Fighting → Swords: DEX 3 + PER 2 + Swords 1 · 6 coins, need 3 · 66%
  ○○●○●○ 2 → FAIL    A club finds Atlas's ribs. Atlas is HURT.
3 Red Hob     Fighting or Talk → best: Swords · 6 coins, need 4 · 34%
  ●●○●●○ 4 → SUCCESS QUEST DONE · 40 crowns
```

The axe problem is fixed. The player still only watches.

## B. Loop Hero split (autobattle for fights, coin tests for everything else)

```
ROUTE  Road ▸ [Woods: +loot, +2 bandits]  or  [Bridge: safe]      > Woods
FIGHT  Atlas HP 18 · ATK 4 · SPD 1.1 · EVA 15%
       vs Bandit ×4 (HP 6, ATK 2) · Crossbow (HP 5, ATK 3)
  Atlas hits Bandit −4 ▓▓░ · Bandit hits Atlas −2 · Crossbow misses · …   (auto, ~20 lines)
  Bandits dead. Atlas 7/18. Loot: iron ring (+1 DEF).
CAMP   Red Hob ahead. Retreat now: keep 100% · mid-fight: 60% · if DOWN: 30%.   > Push on
FIGHT  Red Hob HP 20 · ATK 5 …
```

Lore beats stay coin tests (`Markings: INT 2 + Civilization Lore 0 · 2 coins, need 2 · 25%`). Coins vanish inside fights, and HP bars take over. Decisions sit at the route and camp only.

## C. Coin autobattle (rounds of coin flips that play themselves until a stop)

The fight auto-runs in rounds. Each round Atlas flips his weapon pool against the foe's Guard: a success is a hit, a miss means he takes harm. It pauses at turning points (wounded, a foe breaks, the leader shows up).

```
THE GANG  Bandits ×4 · Guard 3 · break after 4 hits
Atlas: DEX 3 + PER 2 + Swords 1 = 6 coins · 66% a round · a miss = 1 harm
Stance?  [Steady]  [Reckless: +2 coins, a miss = 2 harm]  [Cagey: +Defense coins, a miss = 0–1 harm]   > Steady
 R1 ●○●●○○ 3  HIT    3 bandits left
 R2 ○○●○●○ 2  MISS   Atlas is HURT
 R3 ●●○●○● 4  HIT    2 left
 R4 ○●○○○● 2  MISS   Atlas is WOUNDED (−1 coin)
── STOP: Atlas is wounded ──
 [Press on: 5 coins · 50%]
 [Scare them: CHA 3 + STR 2 = 5 coins, need 3 · 50% · they flee, you get half the loot]
 [Fall back: keep 20 crowns]                                       > Scare them
 ○●●○● 3 → THEY RUN. A crossbow lies in the mud.
```

Non-combat beats are a single test, but the player picks the approach, and knowledge pays off later:

```
THE WARDED DOOR (The Barrow Bell) · pick one
 [Break it]  STR 2 + CON 3 = 5, need 3 · 50% · fail: HURT, and the dead wake first
 [Pick it]   DEX 3 + INT 2 = 5, need 3 · 50% · fail: the bell rings, +1 skeleton
 [Read it]   INT 2 + CON 3 (no Arcane Lore) = 5, need 4 · 19% · success: EDGE (+2 coins vs the dead)
```

Brann (Rune-lore ●) reads it with 7 coins, need 4, at 50%; who you send changes which door you take.

## D. Tracks (one engine for every scene: fight, ward, curse, parley)

Every scene has a progress track and a threat countdown. The player picks a move every round.

```
THE GANG  progress ▢▢▢▢   threat: "they surround you" in 3
Moves: Strike (Swords, 6) · Guard (Defense, 3) · Scare (Intimidation, 5) · Outwit (Warfare, 4)
need 3 = hit · 5+ = strong hit (2 boxes)
 > Strike  ●●○●○● 4  HIT     ■▢▢▢  threat 3
 > Strike  ○●○○●○ 2  MISS    threat 2 · Atlas is HURT
 > Scare   ●●●○● 4   HIT     ■■▢▢  threat 2
 > Strike  ●●●●○● 5  STRONG  ■■■■  THE GANG BREAKS
THE WARD  progress ▢▢▢   threat: "the ward bites" in 2
Moves: Study (Arcane Lore) · Force (Craft) · Pick (Roguery) …
```

It's the most decisions per quest and the most uniform system. A ward or a debate plays like a fight (the Griftlands "two games in one skin" risk), and every scene is a menu.

## E. Clash (Limbus-style: both sides flip)

```
Atlas  Slash 3 + 2 per ● (2 coins)     vs  Bandit  Club 2 + 3 per ● (1 coin)
 Clash 1: Atlas ●○ = 5  vs  Bandit ○ = 2 → Bandit loses his coin
 Atlas strikes: ●● = 7 damage · Bandit 1/8
 Next: [Slash] [Block: Shieldwork 0] [Snarl: CHA, foe −1 coin] · Grit 1 (re-flip)
```

Rich and swingy, but number-heavy, foes flip again (against D-0013), and it needs a move kit per merc.
