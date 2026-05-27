# Open Questions

**Status:** Open (living list)

The questions below are explicitly unresolved. They are flagged so that future design rounds can address them in priority order. Resolving a question means: pick an answer, move it into the relevant doc, mark this entry Resolved.

## P0 — Must resolve before any code

### Q1. What is a raid, mechanically?

The core unresolved question. See [RAID_DESIGN.md](RAID_DESIGN.md) for candidate styles (A–E). Until this is picked, everything downstream (hero abilities, room buffs, raid economy) is provisional.

**Suggested decision criteria:** which candidate best satisfies *agency + heroes-feel-different + 15-min sessions + loot-feeds-fort + small-team-implementable*. Current top candidates: **B (turn-based tactics grid)** and **E (hybrid map + set pieces)**.

### Q2. Does the agency layer fully solve the agency problem?

The *thesis* of this remake is: "give the player the raid, and the hero collection / fort loop will start to feel meaningful." That is plausible but unproven. Before building, we should pressure-test:

- Is "play the raid" enough? Or do heroes *also* need explicit relationship / personality systems (Darkest Dungeon's quirks, Crusader Kings' character interactions) for the hero loop to land?
- Is the fort interesting enough as a *between-raids* activity, or does it need its own micro-decisions (events, intrigue, requests from followers) to feel alive?
- Could agency leak away again if we let too much of the raid be automated (e.g. "auto-resolve a low-level raid you've played before")? Probably yes — and that feature must be carefully scoped or refused.

**This is the question to bring back to the user before further design.**

### Q3. Party size and raid length

- Party size: 3 (lean, fast, FTL-ish) vs. 4 (Darkest Dungeon line) vs. 5 (XCOM-ish, probably too many).
- Raid length: target 10 min, 15 min, or 25 min?

These two interact. Smaller party + shorter raid = "one more raid" rhythm. Bigger party + longer raid = epic expedition rhythm. Pick one rhythm and commit.

## P1 — Resolve before vertical slice

### Q4. Permadeath default

Is the default mode permadeath, or is wounded-instead-of-dead the default with permadeath as a hardcore option? Affects emotional weight and onboarding difficulty.

### Q5. Pressure mechanic — **RESOLVED**

**Resolution:** Quest expiry + daily upkeep (hero wages, follower upkeep, room income) are the only pressures. **No Heat, no clock-timers, no closing-NPC.** See `CORE_CONCEPTS.md` §14a. Battle Brothers uses the same model. Cozy-strategic, not FOMO. (Moved to Resolved.)

### Q6. New hero starting level

When a new hero is recruited mid-game, do they start at level 1 (and need careful raid babysitting), or near the player's current floor (and lose the "raise them" arc)?

Suggested middle ground: new heroes start at `max(1, current_player_avg − 3)`, so they need some raids to catch up but are not useless.

### Q7. AI's role inside the raid

Is the AI active during the raid itself (writing flavor text for encounters in real time), or only at entry/exit (briefing and epilogue)? In-raid AI is richer but expensive (latency, cost) and could undermine readability. At-edges AI is cheap and clean.

### Q8. Fort-to-raid buffs scope

How many room→raid buffs exist? Are they always-active or opt-in (player chooses which N to activate per raid)? Always-on is simpler; opt-in adds a meaningful pre-raid decision.

### Q9. Wound/trauma healing economy

Wounds and traumas heal across "raids completed" — but by *whom*? If they heal during *any* raid, the player will simply run filler raids to heal. If they heal only when the wounded hero is benched and another raid is run, the player has a real cost (running a raid without a hero). Probably the latter.

### Q10. Raid lead expiration

In AI Stronghold leads sat in the inventory indefinitely. Should leads expire (e.g. after N raids) to force commitment? Pro: forces choice. Con: punishes hoarders.

## P2 — Polish-tier questions

### Q11. Can a hero "remember" the player?

I.e. AI-generated voice lines or epilogue references to past raids. ("I won't forget the Burned Crypt, my lord.") High-flavor, moderate cost. Worth a prototype.

### Q12. Capstone / final raid

Is there a single authored capstone raid that "ends" the game (with the option to continue), or is endgame purely personal completion goals? Capstone gives closure; open-ended preserves the trophy-castle fantasy.

### Q13. Modding surface

AI Stronghold was JSON-moddable. Should AI Raider be? The fort/themes/items/leads all clearly should. The raid layer is harder to mod safely. Probably: data-mod everything except raid mechanics.

### Q14. Multiplayer / async features

Probably no. Confirming: no multiplayer, no async fort-sharing, no leaderboards in scope.

### Q15. Save format

Single-file save. Save-anywhere. Cloud sync via Steam/GOG only. No anti-cheat. Confirming.

### Q16. Per-scenario decision density (P1)

Each scenario currently = one drag-drop + (climax only) approach pick. That's ~5 decisions per 15-min raid. Risk: feels passive ("drag-drop-watch-read") and may bore players by hour 10.

Rejected fix: tactical spend-verbs (gold/captive/item reroll). User judged them as accounting fiddle, not real decisions.

Candidate real fixes (deferred to first playtest):
- Deeper scenario archetypes (solo / negotiation / stealth-silent-abort / pair-combo / race-clock).
- More mid-scenario forks (engine-offered 2-way during resolution: "push through (+2 Cunning) or hold (+2 Brawn)?").
- More setup-scenarios offering approach picks (currently only climax branches).
- *Future-explorations escape valve:* per-hero deck-builder sub-game (Slay-the-Spire style). Massive design surface; only consider if vertical slice proves the loop is too thin.

Decision: don't fix preemptively. Build vertical slice as currently locked. If playtest reveals genuine decision-deficit, pick from the above.

### Q17. Hero-deck sub-game (P2 — future exploration only)

User suggested: each hero owns a small card-deck; heroes form a party-deck; the deck is played in "battles" or "negotiations" (à la Slay the Spire).

Pros: would solve Q16 elegantly (5–8 card-play decisions per scenario).
Cons: doubles the design surface; conflicts with the Narrated-Pool philosophy where the math is small/hidden and the AI narration is the central surface; turns the game into "deckbuilder with fort meta."

Decision: not now, not for vertical slice. If post-VS playtest shows Q16 is severe, revisit.

## Resolved (move entries here as they get decided)

### Q5. Pressure mechanic — RESOLVED
Quest expiry + daily upkeep (hero wages, follower upkeep, room income). No Heat, no clock-timers, no closing-NPC. See `CORE_CONCEPTS.md` §14a.
