# Ability brainstorm, by battle skill

The goal is each skill's identity plus rough ability bases. Numbers come later (steps 2–4 in docs/NOW.md). Each entry is marked with who wrote it: designer, Claude's draft, or designer-approved.

**Writing conventions (designer, 2026-10-22):**
- **Damage is a % of a standard hit** (Darkest Dungeon style): "yup sounds good lets use %. pls remember it." How % becomes coins (heads × base per head, D-0069) is settled in balance (step 2).
- **Statuses are written by name only** ("for status application like stun just say stun for now, lets figure out how they are applied later").

## Mods (designer, 2026-10-22)

- One **list of possible mods** ("fire damage mod" etc.), **tailored to each skill**: each skill takes the mods that fit it. The pool should be **"as big as we can"**.
- Order: design a skill's abilities first, then decide which mods fit it.
- Still open: whether mods also sit on skills or only on abilities (D-0025, D-0069: per ability).

## Rarity (designer, 2026-10-22)

- **Some ability bases are rarer** (the designer called Titanic Swing "a (rarer) skill"). Rarer bases are dealt to the AI less often, and the skill's star makes them likelier (designer: "1 STAR skills are common"). Claude reads this as rarity stars on ability bases (reading A). Whether skill types also have rarity (reading B) is unconfirmed.

## Two-handed (STR)

**Identity (designer, 2026-10-22):** ranks 1–2; hits the foe front line; can hit several foes; knocks back; stuns; winds up or takes a self-debuff the next turn; sunders.

**Key abilities, in the designer's order:** Cleave, Overhead Smash, Sunder, and **Titanic Swing**, a rarer ability that hits three foes.

Cards (designer-approved 2026-10-22, with the designer's changes: Overhead Smash is the default attack, foe rank 1 only, 110%, no cooldown, "balanced by the fact its only front line"):

| ability | rarity | ranks | damage | effect | cost |
|---|---|---|---|---|---|
| **Overhead Smash** | 1★ | 1–2 → foe 1 only | 110% | the default attack | 0 cd |
| **Cleave** | 1★ | 1–2 → foe 1 and 2 | 60% each | hits both front foes | cd open |
| **Sunder** | 2★ | 1–2 → 1–2 | 80% | Sundered: foe Physical defense down 3 rounds | cd 3 |
| **Titanic Swing** | 4★ | 1 → foe 1, 2 and 3 | 70% each | Staggered next round (act last, take more damage) | cd 4 |

Open: where knockback lives (Claude leans a "Heavy" mod); where stun lives now that Overhead Smash is the plain default.

Claude's first draft (the long list, kept for later picks):

**Identity (Claude's draft):** the heavy hitter at the front. Big blows, two foes at once, stuns, and knocking foes back. It pays with wind-ups and openings. The decision it brings: burst now, or control (stun, knockback) to break the foe line.

Abilities (Claude's draft, ranks: used from → reaches):

- **Heavy Swing** · 1–2 → 1–2 · basic attack, 0 cd · (Battle Brothers Swing, Crusader Smite)
- **Cleave** · 1–2 → foe 1+2 together · lighter damage on each · (Battle Brothers Round Swing, D&D Cleave)
- **Overhead Smash** · 1 → 1–2 · big hit, stun chance; you are Slowed next round · (Battle Brothers Overhead Strike)
- **Wind-up** · self · this turn you only charge; your next Two-handed attack hits double; a hit on you before then halves the charge · (Path of Exile charged slams)
- **Batter** · 1–2 → 1–2 · hit and knock the foe back 1 rank (knockback is Two-handed's foe move; Polearm pulls) · (Man-at-Arms Rampart)
- **Sunder** · 1–2 → 1–2 · lower the foe's Physical defense for a few turns; strong vs armored foes · (Battle Brothers Split Shield / armor damage)
- **Breakthrough** · 1–2 → foe 2–3 · charge through the front, hit two foes behind it, step forward 1 rank · (Hellion Breakthrough)
- **Reckless Swing** · 1 → 1 · much more damage; you take more damage until your next turn · (D&D Great Weapon Master, Hellion Iron Swan)
- **Ground Slam** · 1 → foe 1–2 · smaller damage, stun chance on both · (Path of Exile Ground Slam)
- **Follow Through** · 1–2 → 1–2 · if it kills, swing again at the next foe in reach · (D&D Great Weapon Master bonus attack)
- **Pommel Strike** · 1 → 1 · light hit, high stun chance, short cooldown · (Crusader Stunning Blow)

Weapon flavor via mods (Claude's draft): axe → bleed, hammer → stun and armor break, sword → crit chance.

### Cleave mods (Claude's draft, 2026-10-22)

From the general list (fits most attacks):
- **Fiery / Frosty / Shocking / Dark**: adds some Fire / Frost / Lightning / Chaos damage (or turns the hit into that type)
- **Brutal**: more damage
- **Bleeding** (axe): bleed on each foe hit
- **Stunning** (hammer): stun
- **Heavy**: knock back 1 rank
- **Keen** (sword): higher crit chance
- **Quick**: cooldown −1

Tailored to Cleave (hits two):
- **Splitting**: with only one foe in reach, it takes both hits (120%), which covers Cleave's weak spot
- **Carry-through**: overkill damage on one foe spills onto the other
- **Shattering**: Sundered on both foes, lighter or shorter than Sunder's
- **Guarding Sweep**: gain a shield for each foe hit
- **Taunting**: foes hit must target you next round (a taunt on a free hit, following the finding that taunt needs teeth)
- **Reckless**: more damage; you take more damage until your next turn (fits the wind-up identity)

Open: do mods carry a cost (D-0025 had Fiery cost mana, and mana is gone), or are they pure upgrades whose rarity is the price? Cleave's cooldown.
