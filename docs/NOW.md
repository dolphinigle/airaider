# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4, brainstorming what the game should look like (started 2026-10-19). Goal right now: shape the game through designer-led brainstorms and simulated playtests, **recording every idea** as it lands (decision if ruled, working model below if not). No code yet.

**Locked so far:** mercs (stats, skills, talents, levels, growth: [design/mercs.md](design/mercs.md)); quests resolve through **autobattles + pure coin-flip skill checks** (D-0026), fights displayed with AI lines only before and after (D-0023), losing injures, never kills (D-0024): [design/quests.md](design/quests.md).

## Working model (brainstormed, not locked)

The shape we use in playtests until the designer rules otherwise. Sources: E-0003, D-0025 (proposed).

- **Party:** about 4 mercs per quest (e.g. two warriors, a mage, a healer).
- **Grid:** each side on a 2×3 grid, 3 frontline and 3 backline (as in Vagrus).
- **Battle skills:** fixed base skills (damage type, grid target, stamina and mana cost) from the merc's core skills, plus engine-priced modifiers (Fiery, Stunning, Lasting…). The AI names each skill once and picks its rolled modifiers from engine-dealt candidates; names only, no lines. A skill's number is damage per heads (D-0025).
- **Modifiers are rare** and part of the recruit's gacha: most skills roll none, two on one skill is rare, three rarer still (designer).
- **Upgrade item:** mercs should grow with the player; a really rare or limited item could upgrade a merc (e.g. add a modifier). Not designed yet.
- **Slots:** skills sit in priority slots S1-S4; on its turn a merc uses the first ready one. 1-2 slots at first (no tactics needed), more as they level (Live A Hero style).
- **Tactic books:** lootable "condition → use S*k*" overrides ("vs undead → S3", "low mana → S2"), slots unlocked by level. Best when foes have sharp twists; a book can drop from the foe family it answers.
- **Foe families** each get one sharp twist that punishes a default setup (foe healer, armored undead, enraging boss, fire-immune imps).
- **Re-slot at base**, between quests; books cover changes inside a quest; scouting or lore can reveal what's ahead.
- **Balance:** parked; assume it works (designer).

## Next

1. **Simulated playtest** (new experiment): Claude acts as the game on the working model, the designer says what the player does. Record every idea and ruling as it lands.
2. Keep design/ and this working model current as rulings come in; start `v4/` only after the shape is settled.

## Waiting on the designer

- Nothing; the next playtest starts when the designer is ready.

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).
- Sims for reference: `experiments/E-0003-autobattler-vs-coin-tests/partysim2.mjs` (slots + books), skill mocks in `skills-mock2/`.
- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
