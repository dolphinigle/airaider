# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). **Goal right now:** find the FUN and the core gameplay concepts through designer-led brainstorms. **Record every idea** as it lands: a decision if ruled, the working model below if not. No code yet. The designer said: "lets focus on FUN and core gameplay concepts first."

## Locked so far

### The game
- **Mostly combat** (D-0056). Civilization quests are mostly gone.
- **A quest is a straight line of nodes**, each a combat or a skill check ("found a treasure box!"). No branching map (D-0057). The line is fixed and shown in the quest preview (`COMBAT – SURVIVAL – COMBAT – ??? – BOSS`); some nodes are hidden (D-0059).
- **The campaign follows Darkest Dungeon** (D-0052):
  - One quest a week; later a second, auto-fought one.
  - Mercs who stay home recover.
  - Gold sinks: stress relief, injury healing, buildings, and room-capped merc levels (v3 idea).
  - Quests grow from 1–2 mercs × 1–2 battles to 4 mercs × ~4 battles + a boss.
- **Fights:**
  - Played by hand: each merc's turn, the player picks the ability and the target. Some later quests force fights that run on tactics (D-0053, which replaces D-0026).
  - Shown with AI lines only before and after (D-0023).
  - Losing injures, never kills (D-0024).
- **Skill checks** are pure coin flips (D-0013): attribute + skill level (D-0069).

### Mercs ([design/mercs.md](design/mercs.md))
- **Stats:** STR DEX INT CHA CON LUK (D-0096), about 10 → 20 over a career (D-0069). Percent effects use Path of Exile *increased* (additive) and *more* (multiplicative) (D-0082). Passives (D-0081, counted from 10 = no effect, below 10 hurts): STR 1% increased damage per point, DEX speed coins, INT 3% increased XP per point, CHA increased quest gold (summed over the squad), CON max HP, LUK (no skills) heads chance on every coin. WIL is gone; no stat touches stress. Each skill uses one attribute, a few two (D-0074, D-0099).
- **Stars** (D-0069): every skill has a star (1★–5★, half steps) that sets its XP gain and, for battle skills, its abilities' modifier odds; the merc's star makes high skill stars likelier.
- **Upgrade items:** star-up and reroll reroll only the level-up seed (D-0029, D-0032). A star-up sets a fixed star below 5★ (D-0037).
- **Skills:**
  - Two starting skills; pick 1 of 3 at Lv 7 (D-0035).
  - **Battle skills** (29: 8 weapon + 21 others; D-0099) and **check skills** (give none) are separate, with their own quotas: 3 battle (working) + 3 check (D-0083). 13 battle skills can be checked too (D-0100). Civilians have check skills only; v3 captives, if they return, too (D-0058).
- **Abilities:** fights use abilities; skills are what mercs know (D-0031).
  - A merc level up gives attributes only. **Some battle-skill level ups give a new ability** (working: skill levels 1, 3, 5, 7, 9): the AI picks one of a few dealt bases from that skill and renames it. Never the same base twice. Four equipped (D-0069).
  - 10–20 bases per battle skill (D-0069).
  - Weapon skills: Two-handed, Polearm, Weapon and Shield, Dual Wield, Single Weapon, Unarmed, Shooting, Throwing; at most one per merc (D-0090, D-0091).
  - Dark Magic abilities cost stress, no life drain; guns are Shooting (D-0072, D-0091).
  - The first ability is always a 0-cooldown attack, with a generic fallback (Smash, Kick); generic bases also come up rarely later (D-0050, D-0051).
  - The player sees only the AI name (D-0048).
- **Passives are traits:** gender, race, personality, body. They never touch coins (D-0036, D-0038–D-0040). Traits have stars; passives scale a little with them (D-0068; Claude: 5★ = 1.5×).
- **Stress:** 0–100, carries across quests. At 100: Resolve or Breakdown, decided by no stat (D-0079; how is open). No quirks (D-0042).
- **Tactics:** condition + action + target, and their parts are loot (D-0030, D-0034).
- **Gear:** none for now; it comes eventually (D-0034).

## Working model (not locked)

- **Combat basics** (D-0041, proposed, the designer called it "decent"):
  - **Formation:** a Darkest Dungeon line, 4 ranks per side. Abilities state the ranks they're used from and the ranks they reach. No corpses: units shift forward.
  - **Turn order:** speed coins re-flipped every round, everyone acts once. Haste and Slow change it.
  - **Coins** (D-0069): checks and attacks flip attribute + skill level (attribute alone without the skill); heads × ability base; foe defense % per type (Physical, Fire, Frost, Lightning, Chaos, D-0070); statuses on a skill flip; foes scale by HP.
  - **Costs:** cooldowns; some abilities have per-quest uses (D-0062); Dark Magic costs stress (D-0072). No mana, no stamina.
  - **Crits** (D-0092): a merc crit turns every coin heads (max damage); a foe crit is 1.5×. Crit chance source open.
  - **Defense** (D-0070): mercs use shields, guard, buffs; % per type only from traits/gear; no misses, dodge is a charge.
  - **Interactions:** damage-type weaknesses, and statuses that raise damage taken.
  - **Foes are fixed:** they never flip.
  - **Waves** happen automatically.
- **Rank movement:** Leadership moves teammates; Two-handed, Polearm and Dirty Fighting move foes (D-0073, D-0090); self-moves are bases in battle skills.
- **Combo bases** (Claude idea, offered 2026-10-22): a few bases need two skills (Two-handed + Holy "Holy Smite"); only mercs with both are dealt them; the ability flips the two skills' average. Skill pairs feel like classes (Crusader = Weapon and Shield + Holy, Defender at Lv 7) without hard classes. E-0005 round 4: every Darkest Dungeon class maps to 1–2 of our skills.
- **Modifiers:** 0–4 per ability by the skill's star (D-0069). Engine-priced; the AI picks from the candidates the engine deals (D-0025, proposed).
- **Foe families** each have a sharp twist.
- **Fight sprites:** one AI image per pose (D-0043, proposed, parked as a detail).
- **Parked:**
  - balance;
  - trait effects;
  - anti-grind (quest deadlines are the likely answer, D-0054);
  - a long-term goal.

## Next

0. **NEXT SESSION STARTS HERE.** The skill roster is **done** (designer: "ok all good now"). Pick the next thread from item 1 (Claude suggests ability cadence + status model, then the fight mock in item 2). Roster (D-0099): 29 battle skills (8 weapon + 21 others) + 11 check skills. Last in: Carousing (CHA + CON, **doping**: take something for a big self-buff, pay after; all one-time-use abilities; designer note in design/mercs.md) and Concentration (INT flex, empowers your next action, D-0098); Roguery is Thievery. Generic category names the AI skins; two flex skills per single attribute; no skill dedicated to lowering resistances (D-0097).
   - Also open: Warfare's scope (draft: combined attacks with an ally, breaking foe shields, formation tricks; Leadership keeps moving teammates and focus fire); Precision vs LUK (both raise heads chance).
   - From E-0005 round 10, to rule: Highwayman's blade + pistol vs one weapon skill; can bases outside D-0073's skills move foes; stress healing as a support role (ours is rare, weak).
1. **Battle and check skills, still open:**
   - **Ability cadence** (Claude: a new ability at skill levels 1, 3, 5, 7, 9).
   - **Status effects model:** Pokémon style or Darkest Dungeon style (Claude leans Darkest Dungeon).
   - **Crits** (D-0092): what sets crit chance (Claude: ~5% base, raised by abilities/modifiers; Precision); can checks crit (Claude: yes, bonus result).
   - **Check skills** (D-0083, 11, 3 per merc): when the 3 are gained (Claude: all at recruitment); uses outside check nodes (Perception reveals `???` nodes, Lore shows foe weaknesses, Persuasion prices, Cooking at the base kitchen); what each does in check nodes (pass: loot, buff, knowledge; fail: stress, HP, harder next fight).
2. **Find the fun in a hand-played fight:** a text mock with placeholder abilities, then feedback.
3. **Abilities:** 10–20 bases per battle skill, each with ranks (used from, reaches), cooldown, per-quest uses where fitting. Weapon flavor via modifiers (D-0090). Start from E-0003 `skills-mock/fixed-list.md` and `skills-mock2/gen.mjs`.
4. **Simulated playtest of a week** (a new experiment).
5. Keep design/ and this page current. Start `v4/` only once the shape is settled.

## Waiting on the designer

- **Stress at 100 without a stat** (D-0079): always Breakdown, a flat chance, or something else? Resolve stays?
- **Check nodes** (D-0059 notes): one named skill per node; pass gives loot/buff/knowledge, fail costs; can Scouting reveal hidden nodes?
- **Skill stress healing** is rare and weak; rest is the main relief (D-0062).
- **To decide later** (D-0055):
  - where recruits come from (a coach, or quests);
  - how new quests appear;
  - how to stop steamrolling (experienced mercs on easy quests);
  - ~~whether skill checks between fights stay~~ (yes: check nodes, D-0057).
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
