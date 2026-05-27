# Vision

**Status:** Draft

## One-line pitch

A fortress-management game where you build a prestigious stronghold by sending heroes on raids that *you actually play*.

## Two-layer fantasy

AI Raider is two games stitched together by a shared cast of characters:

- **The Lord layer (meta / fort phase):** You are the lord of a growing stronghold. You build themed rooms, staff them with followers, display rare artifacts, recruit heroes, and decide which raids to fund. Success here is measured in **Prestige**.
- **The Raider layer (tactical / raid phase):** You take the heroes you raised and personally lead them into dangerous places. Success here is measured in **what you bring home** (and *who* you bring home).

The two layers feed each other:
- Raids drop the followers, artifacts, story hooks and resources that fuel the fort.
- The fort raises the heroes (and unlocks the gear, the followers-as-support, and the raid leads) that fuel raids.

## Design pillars

1. **Agency comes from the raid.** The player's most-felt choices happen during raids — positioning, ability use, when to push, when to retreat, who to sacrifice. Stats matter, but the player's decisions matter more.
2. **Heroes are characters, not stat blocks.** Each hero accumulates meaning through *how the player used them*: tags earned from a raid they barely survived, a rival they made when the player chose one over the other, a signature ability the player leaned on. AI-generated personality + starting tags give a starting hook; play makes them yours.
3. **The fort is where payoff lives.** The dopamine loop of "I found the perfect follower for the Candy Kitchen" is preserved verbatim from AI Stronghold. The fort is a trophy case as much as a workshop.
4. **No infinite grind path.** You cannot bypass the fort by grinding raids (raids do not grant Prestige directly). You cannot bypass raids by optimizing the fort (better rooms unlock better raid leads, not better raid outcomes). Both layers are mandatory.
5. **AI generates flavor, not mechanics.** AI writes the room's name, the hero's backstory, the raid's introductory hook, the post-raid epilogue. Mechanics — success, failure, damage, loot tables — are deterministic and inspectable.

## Non-goals

- **Not a roguelike.** Heroes are persistent, named, and expensive to lose. Permadeath exists but is a heavy moment, not a routine one.
- **Not an idle / auto-battler.** If the player isn't playing the raid, the game isn't happening.
- **Not a narrative adventure.** Stories are flavor framing for mechanical events, not the primary content. Quality of writing is a bonus, not a load-bearing pillar.
- **Not a multiplayer game.** Single-player, save-anywhere.
- **Not a pixel-perfect tactics game.** Combat is tactical but should be readable, fast, and forgiving of UI mistakes. We are not making XCOM 2.

## What "winning" feels like

- Coming home from a raid with a legendary artifact whose tags perfectly match an empty slot in your Throne Room.
- Watching a hero you have leaned on for 20 raids finally hit a level where their signature ability changes how you play.
- Losing a beloved hero on a raid you pushed too far, and naming the next recruit after them.
- Looking at your fort screen and feeling that every room *means* something — every follower in it was found, not bought.
