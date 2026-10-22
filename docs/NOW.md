# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). Goal right now: shape the game through designer-led brainstorms and simulated playtests, **recording every idea** as it lands (decision if ruled, working model below if not). No code yet.

**Locked so far:** mercs (stats, skills, talents, levels, growth: [design/mercs.md](design/mercs.md)); quests resolve through **fights played by hand (some later quests force tactics) + pure coin-flip skill checks** (D-0053), fights displayed with AI lines only before and after (D-0023), losing injures, never kills (D-0024): [design/quests.md](design/quests.md). Half-star rarity sets modifier odds (D-0027); **abilities** (fight) vs **skills** (Survival…) (D-0031): one new ability per level up: the AI picks one of a few dealt bases from the merc's fighting skills and renames it, never the same base twice, four equipped; 10–20 bases per fighting skill (D-0047); unarmed is its own skill, weapon tags filter bases (D-0045); 18 fighting skills plus minor ones; civilians exist; Smithing + Engineering, Nature Lore (D-0046); first ability a 0-cd attack, generic fallback (D-0050, D-0051); players see only AI ability names (D-0048); stats STR DEX INT CHA CON WIL (D-0044); star-up and reroll items reroll only the level-up seed (D-0029, D-0032), a star-up sets a fixed star below 5★ (D-0037); two starting skills, pick 1 of 3 at Lv 7 (D-0035); passives are traits: gender, race, personality, body (Wolfkin +10% damage, −10% speed) (D-0036, D-0038, D-0039), never touching stat or skill coins (D-0040); tactics are condition + action + target, parts are loot (D-0030, D-0034); no gear for now, it comes eventually (D-0034); **stress** 0–100 carries across quests, at 100 Resolve or Breakdown, no quirks (D-0042); fight sprites one image per pose, as in Darkest Dungeon (D-0043, proposed, parked as a detail). **Campaign follows Darkest Dungeon (D-0052):** one quest a week (later a second, auto-fought one; anti-grind parked), the rest recover; gold sinks are stress relief, injury healing, buildings, room-capped levels; quests grow from 1–2 mercs × 1–2 battles to 4 mercs × ~4 battles + boss.

## Working model (brainstormed, not locked)

The shape we use in playtests until the designer rules otherwise. Sources: E-0003, D-0025 (proposed).

- **Party:** about 4 mercs per quest (e.g. two warriors, a mage, a healer).
- **Combat basics (D-0041, proposed):** Darkest Dungeon style ordered line (4 ranks, abilities state the ranks they're used from and reach, no corpses: units shift forward); speed coins re-flipped every round, everyone acts once, Haste/Slow; ability pool = stat + skill (two-skill abilities average them), damage per heads; cooldowns only, no mana; guard abilities taunt or shield (party); damage-type weaknesses and statuses that raise damage taken; foes fixed. Waves happen automatically.
- **Abilities:** fixed base abilities (damage type, ranks used from and reached, cooldown) from the merc's core skills, plus engine-priced modifiers (Fiery, Stunning, Lasting…). The AI names each ability once and picks its rolled modifiers from engine-dealt candidates; names only, no lines. An ability's number is damage per heads (D-0025).
- **Modifiers:** 0–4 per ability, odds by star (D-0027); about 30 should fit each base ability; about 5 base abilities per skill.
- **Equip order:** the four equipped abilities sit in priority order S1–S4; on its turn a merc uses the first ready one.
- **Tactics:** condition + action + target (D-0030), e.g. "an ally below 50% HP" + "use S4" + "the ally with the lowest HP". How many lines a merc gets is open. Best when foes have sharp twists.
- **Foe families** each get one sharp twist that punishes a default setup (foe healer, armored undead, enraging boss, fire-immune imps).
- **Re-equip at base**, between quests; tactics cover changes inside a quest; scouting or lore can reveal what's ahead.
- **Balance:** parked; assume it works (designer).
- **Trait effects:** parked ("we'll figure out the effect details later", designer, 2026-10-22). This covers race's stat bias (D-0018 vs D-0040), how gender traits differ, and whether every trait is a trade-off.

## Next

Designer: "first lets make this fun."
1. **Find the fun in a hand-played fight.** Mock a manual fight as text using placeholder abilities, then get feedback.
2. **Abilities:** 10–20 base abilities per fighting skill (D-0047, D-0046), each with:
   - the ranks it is used from and the ranks it reaches;
   - a cooldown;
   - weapon tags.

   Minor skills get 3–5. Start from E-0003 `skills-mock/fixed-list.md` and `skills-mock2/gen.mjs`.
3. **Simulated playtest** (new experiment) of a week: pick the quest and party, play the fights by hand, make the skill checks, then rest and spend gold.
4. Keep design/ and this page current; start `v4/` only once the shape is settled.

## Waiting on the designer

- **To decide later (D-0055):**
  - where recruits come from (coach or quests);
  - how new quests appear;
  - stopping steamrolling;
  - whether skill checks between fights stay.
- **Now (D-0056, mostly combat):**
  - civilians: base crew, or dropped?
  - merging the 12 minor skills into 6.

- **Accept D-0041** (combat basics)?
- **Inspirations offered, not yet picked:**
  - push on or retreat between battles;
  - camping in long quests;
  - bonds between mercs;
  - downed at 0 HP;
  - party synergies;
  - triggers;
  - a morale bar for foes.
- **Sprites (D-0043)** are parked as a detail.

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).
- Sims for reference: `experiments/E-0003-autobattler-vs-coin-tests/partysim2.mjs` (slots + books), skill mocks in `skills-mock2/`.
- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
