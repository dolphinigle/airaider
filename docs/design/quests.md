# Quests

How a quest plays out: autobattles and coin-flip skill checks, told in quick simple lines.

## Structure

- A quest resolves through **autobattles** (fights) and **skill checks** (everything else) (D-0026).

- A skill check is a **test** the engine rolls when the quest is made (seen in E-0001).
- Each test names **one, two or rarely three stats** plus a core skill (D-0019, D-0021), and has a **fixed threshold**: the number of heads needed (D-0013).
- The merc flips the coins of every named stat plus the skill together. **Heads ≥ threshold** is a success. Only the merc flips; foes have no coins (D-0013).
- A quest states a **minimum number of successes**; harder quests need more (D-0008).
- Quests have a **level**, which feeds the XP rules (D-0012).
- Big coin pools are fine: coins flip together or in batches.

## Text

- The world is **dark fantasy**; the tone is **light and fast**: short punchy lines, one beat each (D-0006).
- Each test gets one simple line announcing it ("Bandits on the road!") and one for the result ("Atlas took a cut!"). The **engine** states the mechanical effect ("Atlas is WOUNDED"), never the prose (D-0007).
- The AI writes only this small text; the fun is in the mechanics (D-0004).

## Fights

- A fight is **displayed** as animation, not read. The AI writes one line at its start and one at its end, plus the sprites (D-0023).
- Losing a fight **injures**, never kills (D-0024).
- A fight is an **autobattle**: the player sets the party up beforehand and the fight plays itself (D-0026).
- Working model, not locked: a party on a 2×3 grid, skills in priority slots S1–S4, lootable tactic books, battle skills = base skills + priced modifiers named by the AI, damage per heads (D-0025 proposed; E-0003).

## Open

- What happens during a quest besides the tests (choices, push or retreat), and the fight model: E-0003.
- What failing a test or a quest costs (wounds, loot, death).
- Presentation: pixel-art sprites (AI-made, D-0023), coin-flip animation.
