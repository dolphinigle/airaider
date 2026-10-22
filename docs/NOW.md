# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). **Goal right now:** find the FUN and the core gameplay concepts through designer-led brainstorms. **Record every idea** as it lands: a decision if ruled, the working model below if not. No code yet. The designer said: "lets focus on FUN and core gameplay concepts first."

## Locked so far

### The game
- **Mostly combat** (D-0056). Quests are runs of fights, and civilization quests are mostly gone.
- **The campaign follows Darkest Dungeon** (D-0052):
  - One quest a week; later a second, auto-fought one.
  - Mercs who stay home recover.
  - Gold sinks: stress relief, injury healing, buildings, and room-capped merc levels (v3 idea).
  - Quests grow from 1–2 mercs × 1–2 battles to 4 mercs × ~4 battles + a boss.
- **Fights:**
  - Played by hand: each merc's turn, the player picks the ability and the target. Some later quests force fights that run on tactics (D-0053, which replaces D-0026).
  - Shown with AI lines only before and after (D-0023).
  - Losing injures, never kills (D-0024).
- **Skill checks** are pure coin flips (D-0013).

### Mercs ([design/mercs.md](design/mercs.md))
- **Stats:** STR DEX INT CHA CON WIL (D-0044). DEX gives speed coins, CON gives max HP, WIL is the stress check.
- **Rarity:** half-star, sets modifier odds (D-0027).
- **Upgrade items:** star-up and reroll reroll only the level-up seed (D-0029, D-0032). A star-up sets a fixed star below 5★ (D-0037).
- **Skills:**
  - Two starting skills; pick 1 of 3 at Lv 7 (D-0035).
  - 18 main fighting skills plus minor ones (D-0046).
  - Civilians exist (D-0046), but their role is open after D-0056.
- **Abilities:** fights use abilities; skills are what mercs know (D-0031).
  - One new ability per level up. The AI picks one of a few dealt bases from the merc's fighting skills and renames it. Never the same base twice. Four equipped (D-0047).
  - 10–20 bases per fighting skill (D-0047).
  - Weapon tags filter bases; Unarmed is its own skill; no medium tier (D-0045).
  - The first ability is always a 0-cooldown attack, with a generic fallback (Smash, Kick); generic bases also come up rarely later (D-0050, D-0051).
  - The player sees only the AI name (D-0048).
- **Passives are traits:** gender, race, personality, body. They never touch coins (D-0036, D-0038–D-0040).
- **Stress:** 0–100, carries across quests. At 100 the merc flips WIL: Resolve or Breakdown. No quirks (D-0042).
- **Tactics:** condition + action + target, and their parts are loot (D-0030, D-0034).
- **Gear:** none for now; it comes eventually (D-0034).

## Working model (not locked)

- **Combat basics** (D-0041, proposed, the designer called it "decent"):
  - **Formation:** a Darkest Dungeon line, 4 ranks per side. Abilities state the ranks they're used from and the ranks they reach. No corpses: units shift forward.
  - **Turn order:** speed coins re-flipped every round, everyone acts once. Haste and Slow change it.
  - **Ability flips:** stat + skill coins (two-skill abilities average the two skills); damage = heads × base.
  - **Costs:** cooldowns only; no mana, no stamina.
  - **Guard:** taunts, or shields (the shield can cover the party).
  - **Interactions:** damage-type weaknesses, and statuses that raise damage taken.
  - **Foes are fixed:** they never flip.
  - **Waves** happen automatically.
- **Rank movement:** Athletics moves yourself; Warfare moves allies and foes.
- **Battle vs check skills** (designer alternative, 2026-10-22, Claude leans yes): 3 battle skills (2 start + Lv 7 pick; only they give abilities) + 2 check skills (rolled from background, no abilities). Checks feed fights (Lore reveals weakness, Scouting avoids ambush, Thievery opens loot, Talk weakens a fight, Trade sells higher), per findings "knowledge feeds the next roll". Draft lists: battle 15 (Heavy, Light, Unarmed, Ranged, Defense, Warfare, Command, Animal Companion, Roguery, Villainy, Alchemy+Doctor, Engineering, Elemental, Holy, Dark); check 6 (Lore, Scouting, Talk, Trade, Thievery, Athletics). Civilians = check skills only. Drops D-0046's minor fighting tier.
- **Combo bases** (Claude idea, offered 2026-10-22): a few bases need two skills (Heavy + Holy "Holy Smite"); only mercs with both are dealt them; the ability flips the two skills' average. Skill pairs feel like classes (Crusader = Heavy + Holy, Defense at Lv 7) without hard classes. E-0005 round 4: every Darkest Dungeon class maps to 1–2 of our skills.
- **Modifiers:** 0–4 per ability by star (D-0027). Engine-priced; the AI picks from the candidates the engine deals (D-0025, proposed).
- **Foe families** each have a sharp twist.
- **Fight sprites:** one AI image per pose (D-0043, proposed, parked as a detail).
- **Parked:**
  - balance;
  - trait effects;
  - anti-grind (quest deadlines are the likely answer, D-0054);
  - a long-term goal.

## Next

1. **Skill merges (the current question).** The designer asked: "show me skills list lets see if we can merge stuffs". Claude's proposal, 30 → 20 skills:
   - **Strong merges:**
     - **Lore** = Nature Lore + Arcane Lore + Civilization Lore. Main fighting skill: analyzes any monster, exposes weaknesses.
     - **Roguery** = Stealth + Roguery + Streetwise. Main fighting skill.
     - **Scouting** = Survival + Awareness. Minor; reveals a quest's foes ahead of time.
     - **Talk** = Persuasion + Deception + Bargaining. Minor.
     - **Villainy** absorbs Intimidation.
   - **Optional:**
     - **Command** = Leadership + Performance (both "stress healing and buffs");
     - **Alchemy** absorbs Doctor.

     Both bring it to 18.
   - **Kept:** Heavy, Light, Unarmed, Ranged, Defense, Warfare, Animal Companion, Villainy, Engineering, Elemental, Holy, Dark; minor Athletics and Smithing.
   - **Also open:** civilians become base crew (RimWorld-style jobs) or get dropped.
2. **Find the fun in a hand-played fight:** a text mock with placeholder abilities, then feedback.
3. **Abilities:** 10–20 bases per fighting skill, each with ranks (used from, reaches), cooldown and weapon tags. Minor skills get 3–5. Start from E-0003 `skills-mock/fixed-list.md` and `skills-mock2/gen.mjs`.
4. **Simulated playtest of a week** (a new experiment).
5. Keep design/ and this page current. Start `v4/` only once the shape is settled.

## Waiting on the designer

- The skill merges and civilians (Next 1).
- **To decide later** (D-0055):
  - where recruits come from (a coach, or quests);
  - how new quests appear;
  - how to stop steamrolling (experienced mercs on easy quests);
  - whether skill checks between fights stay.
- **Later, from v3:** the relic system (probably) and the captive system (maybe). Each comes back only through a v4 decision with `sources:`.
- **Accept D-0041** (combat basics)?
- **Inspirations offered** (E-0005):
  - push on or retreat between battles;
  - camping in long quests;
  - bonds between mercs;
  - downed at 0 HP;
  - party synergies;
  - triggers;
  - a morale bar for foes.

## Notes

- **Lessons ledger** `docs/findings.md` (D-0005): cross-check every new idea against it.
- **Records system:** `tools/rec.mjs`, the `records` skill, hooks, and a pre-commit hook. On a fresh clone run `git config core.hooksPath tools/githooks`.
- **Reference sims:** E-0003 `partysim2.mjs`, `skills-mock2/`; E-0004 `halfstar.mjs` (rarity odds).
- **v3** is playable at `../airaider-v3` (tag `v3-final`).
