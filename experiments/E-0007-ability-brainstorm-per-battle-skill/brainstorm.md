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

### Mods, first rulings (designer, 2026-10-22, from the Cleave draft)

**Cost depends on the ability.** A 0-cooldown ability's mods cost nothing, but their numbers are low: about **10% power per mod** ("a good enough trade"). On abilities with a cooldown, a mod can cost something (such as +1 cd) and be stronger. The designer treated Cleave as a no-cooldown ability ("for skills without cd like this").

**One status per damage type:** Physical → **Bleed**, Chaos → **Poison**, Fire → **Burn**, Lightning → **Shocked**, Frost → **Chilled**.

**Universal mods so far:**

| mod | effect | notes |
|---|---|---|
| **Fiery / Frosty / Charged / Dark** | half the damage turns Fire / Frost / Lightning / Chaos, and +10% damage on top | mutually exclusive |
| **Brutal** (Physical) | +10% damage, no conversion | the Physical one |
| **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth about 10% of the damage | the designer thinks statuses get a slightly higher multiplier (for the balancer) |
| **Lucky** | +5% heads chance (number open) | replaces Keen |
| **Guarding** | gain a shield equal to 10% of the damage dealt | universal |
| **Heavy** | knock back 1 rank; 50% **reduced** damage (additive, D-0082; value for the balancer) | rarer |
| **Stunning** | stun; 50% reduced damage | rarer |

**How mods are picked (designer, 2026-10-22):** "the ai will be given all these mods then asked to pick several (depends on the number of mods rolled on the skill)". The engine rolls the count; the AI sees every mod that fits the ability and picks that many to suit the merc. This replaces Claude's D-0025 proposal of dealing 3 candidates. The engine still enforces the exclusive groups (one element).

**Not universal:**
- **Quick**: −1 cooldown. Good, but only for abilities with a cooldown (not Cleave).
- **Splitting**: for most multi-target (cleave-type) abilities: with fewer targets, the damage condenses onto those left.

Claude's Cleave-only ideas not yet ruled: Carry-through (overkill spills onto the other foe), Shattering (light Sundered on both), Taunting (foes hit must target you next round), Reckless (more damage; take more until your next turn).
