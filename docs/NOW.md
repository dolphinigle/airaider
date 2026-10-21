# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). Goal right now: shape the game through designer-led brainstorms and simulated playtests, **recording every idea** as it lands (decision if ruled, working model below if not). No code yet.

**Locked so far:** mercs (stats, skills, talents, levels, growth: [design/mercs.md](design/mercs.md)); quests resolve through **autobattles + pure coin-flip skill checks** (D-0026), fights displayed with AI lines only before and after (D-0023), losing injures, never kills (D-0024): [design/quests.md](design/quests.md). Half-star rarity sets modifier odds (D-0027); **abilities** (fight) vs **skills** (Survival…) (D-0031): one new ability per level up from the merc's skills, never the same base twice, four equipped (D-0033); star-up and reroll items reroll only the level-up seed (D-0029, D-0032); tactics are condition + action + target, parts are loot (D-0030, D-0034); no gear for now (D-0034).

## Working model (brainstormed, not locked)

The shape we use in playtests until the designer rules otherwise. Sources: E-0003, D-0025 (proposed).

- **Party:** about 4 mercs per quest (e.g. two warriors, a mage, a healer).
- **Grid:** each side on a 2×3 grid, 3 frontline and 3 backline (as in Vagrus).
- **Abilities:** fixed base abilities (damage type, grid target, stamina and mana cost) from the merc's core skills, plus engine-priced modifiers (Fiery, Stunning, Lasting…). The AI names each ability once and picks its rolled modifiers from engine-dealt candidates; names only, no lines. An ability's number is damage per heads (D-0025).
- **Modifiers:** 0–4 per ability, odds by star (D-0027); about 30 should fit each base ability; about 5 base abilities per skill.
- **Equip order:** the four equipped abilities sit in priority order S1–S4; on its turn a merc uses the first ready one.
- **Tactics:** condition + action + target (D-0030), e.g. "an ally below 50% HP" + "use S4" + "the ally with the lowest HP". How many lines a merc gets is open. Best when foes have sharp twists.
- **Foe families** each get one sharp twist that punishes a default setup (foe healer, armored undead, enraging boss, fire-immune imps).
- **Re-equip at base**, between quests; tactics cover changes inside a quest; scouting or lore can reveal what's ahead.
- **Skills over a career** (D-0035, proposed): start with two, rarely three by star; pick 1 of 3 at Lv 7.
- **Passives** (D-0036, proposed): personality traits, one or two per merc.
- **Balance:** parked; assume it works (designer).

## Next

1. **Simulated playtest** (new experiment): Claude acts as the game on the working model, the designer says what the player does. Record every idea and ruling as it lands.
2. Keep design/ and this working model current as rulings come in; start `v4/` only after the shape is settled.

## Waiting on the designer

- D-0035 (skills: two at start, pick 1 of 3 at Lv 7) and D-0036 (passives = traits).
- D-0029: star-up step (½★ or 1★).

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).
- Sims for reference: `experiments/E-0003-autobattler-vs-coin-tests/partysim2.mjs` (slots + books), skill mocks in `skills-mock2/`.
- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
