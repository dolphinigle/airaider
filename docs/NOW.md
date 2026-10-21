# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). Goal right now: shape the game through designer-led brainstorms and simulated playtests, **recording every idea** as it lands (decision if ruled, working model below if not). No code yet.

**Locked so far:** mercs (stats, skills, talents, levels, growth: [design/mercs.md](design/mercs.md)); quests resolve through **autobattles + pure coin-flip skill checks** (D-0026), fights displayed with AI lines only before and after (D-0023), losing injures, never kills (D-0024): [design/quests.md](design/quests.md). Half-star rarity sets modifier odds (D-0027); **abilities** (fight) vs **skills** (Survival…) (D-0031): one new ability per level up from the merc's skills, never the same base twice, four equipped (D-0033); star-up and reroll items reroll only the level-up seed (D-0029, D-0032), a star-up sets a fixed star below 5★ (D-0037); two starting skills, pick 1 of 3 at Lv 7 (D-0035); passives are traits: gender, race, personality, body (Wolfkin +10% damage, −10% speed) (D-0036, D-0038, D-0039), never touching stat or skill coins (D-0040); tactics are condition + action + target, parts are loot (D-0030, D-0034); no gear for now, it comes eventually (D-0034); **stress** 0–100 carries across quests, at 100 Resolve or Breakdown, no quirks (D-0042).

## Working model (brainstormed, not locked)

The shape we use in playtests until the designer rules otherwise. Sources: E-0003, D-0025 (proposed).

- **Party:** about 4 mercs per quest (e.g. two warriors, a mage, a healer).
- **Combat basics (D-0041, proposed):** Darkest Dungeon style ordered line (4 ranks, abilities state the ranks they're used from and reach, no corpses: units shift forward); speed coins re-flipped every round, everyone acts once, Haste/Slow; ability pool = stat + skill (two-skill abilities average them), damage per heads; cooldown + mana, mana refills only from abilities; guard abilities taunt or shield (party); damage-type weaknesses and statuses that raise damage taken; foes fixed. Waves happen automatically.
- **Abilities:** fixed base abilities (damage type, grid target, stamina and mana cost) from the merc's core skills, plus engine-priced modifiers (Fiery, Stunning, Lasting…). The AI names each ability once and picks its rolled modifiers from engine-dealt candidates; names only, no lines. An ability's number is damage per heads (D-0025).
- **Modifiers:** 0–4 per ability, odds by star (D-0027); about 30 should fit each base ability; about 5 base abilities per skill.
- **Equip order:** the four equipped abilities sit in priority order S1–S4; on its turn a merc uses the first ready one.
- **Tactics:** condition + action + target (D-0030), e.g. "an ally below 50% HP" + "use S4" + "the ally with the lowest HP". How many lines a merc gets is open. Best when foes have sharp twists.
- **Foe families** each get one sharp twist that punishes a default setup (foe healer, armored undead, enraging boss, fire-immune imps).
- **Re-equip at base**, between quests; tactics cover changes inside a quest; scouting or lore can reveal what's ahead.
- **Balance:** parked; assume it works (designer).
- **Trait effects:** parked ("we'll figure out the effect details later", designer, 2026-10-22). This covers race's stat bias (D-0018 vs D-0040), how gender traits differ, and whether every trait is a trade-off.

## Next

1. **Review skills → base abilities with the designer** before any sim: about 5 base abilities per battle-capable skill (D-0033, D-0035), starting from E-0003 `skills-mock/fixed-list.md` and `skills-mock2/gen.mjs`. Mock the list, get feedback.
2. **Simulated playtest** (new experiment): Claude acts as the game on the working model, the designer says what the player does. Record every idea and ruling as it lands.
3. Keep design/ and this working model current as rulings come in; start `v4/` only after the shape is settled.

## Waiting on the designer

- Nothing; next session opens with the skills → abilities review.

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).
- Sims for reference: `experiments/E-0003-autobattler-vs-coin-tests/partysim2.mjs` (slots + books), skill mocks in `skills-mock2/`.
- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
