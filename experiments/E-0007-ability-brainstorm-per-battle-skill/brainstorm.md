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

### Mod catalog (designer rulings, 2026-10-22, from the Cleave draft)

**How mods work:**
- **The AI picks.** The engine rolls how many mods an ability gets; the AI sees every mod that fits and picks that many to suit the merc (designer: "the ai will be given all these mods then asked to pick several"). This replaces Claude's D-0025 idea of dealing 3 candidates.
- **The cost depends on the ability.** On a 0-cooldown ability a mod is free and small, about **10% power** ("a good enough trade"). On an ability with a cooldown, a mod can cost something (such as +1 cd) and be stronger.
- **Statuses: one per damage type.** Physical → Bleed, Chaos → Poison, Fire → Burn, Lightning → Shocked, Frost → Chilled.
- **Caps and exclusions:**
  - one element;
  - at most **one debuff-family mod** per ability; debuff mods cost **50% reduced damage** (value for the balancer) and are **never offered on multi-foe abilities**;
  - at most **one buff-family mod** (buffs on the user);
  - Advancing and Retreating exclude each other;
  - several status mods may stack.
- **Universal but conditional:** a mod fits any ability that meets its condition.

Families at a glance:

| family | per ability | also | mods |
|---|---|---|---|
| element | 1 | | Fiery, Frosty, Charged, Dark, Brutal |
| status | no limit | | Bleeding, Poisoning, Burning, Shocking, Chilling |
| debuff | 1 | 50% reduced damage; single-target abilities only | Stunning, Heavy, Marking, (Exposing, Weakening, Hampering) |
| buff | 1 | | Swift, (Evasive, Riposting) |
| sustain | no limit (designer: shield "same family as vampiric", "they can stack no problem") | Vampiric rare | Guarding, Vampiric |
| self-move | 1 | | Advancing, Retreating |
| reach | no limit | | Reaching, Footwork |
| other | no limit | Double Strike repeats once at most | Lucky, Double Strike |
| conditional | no limit | only if the ability meets the condition | Quick, Splitting, Potent, Lingering, Composed |

| family | mod | effect | rules |
|---|---|---|---|
| element | **Fiery / Frosty / Charged / Dark** | half the damage turns Fire / Frost / Lightning / Chaos, +10% damage | one element |
| element | **Brutal** | +10% damage, stays Physical | one element |
| status | **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth ~10% of the damage (statuses may get a slightly higher multiplier, balancer) | may stack |
| debuff | **Stunning** | stun | rarer; 50% reduced damage; single-target only; one debuff |
| debuff | **Heavy** | knock the target back 1 rank | same |
| debuff | **Marking** | mark: allies deal more to it | same |
| debuff | **Exposing / Weakening / Hampering** (Claude's, likely in the family) | takes more damage / deals less / acts later | same |
| buff | **Swift** | you act earlier next round | one buff |
| sustain | **Guarding** | shield worth 10% of the damage dealt | stacks with Vampiric |
| buff | **Evasive / Riposting** (Claude's) | gain a dodge / riposte charge | one buff; rarer |
| self-move | **Advancing / Retreating** (designer) | you step forward / back 1 rank | exclusive |
| reach | **Reaching** | reaches 1 rank further (foe 1–2 → 1–3) | |
| reach | **Footwork** | usable from 1 more rank (from 1–2 → 1–3) | |
| other | **Lucky** | +5% heads chance (number open) | replaces Keen |
| sustain | **Vampiric** | heal a small share of the damage | rare; stacks with Guarding |
| other | **Double Strike** | small chance to hit again | at most one repeat |
| conditional | **Quick** | −1 cooldown | has a cooldown |
| conditional | **Splitting** | with fewer targets, damage condenses onto those left | hits several foes |
| conditional | **Potent** | its statuses are stronger | inflicts a status |
| conditional | **Lingering** | its statuses last a round longer | inflicts a status |
| conditional | **Composed** | softens its self-debuff | has one |

**Not yet ruled (Claude's):**
- Piercing: ignores some defense.
- Bane of \<family\>: more damage against one foe family.
- Opportunist: more damage against a foe with a status.
- Taunting: foes hit must target you next round.
- Sweeping: a single-target ability also hits the next foe for a small share.
- Cleave-only: Carry-through, Shattering, Reckless.

### Damage mods (Claude's draft, 2026-10-22; designer asked: "we want more mods that adds effective damage")

Situational mods give more than 10% when their condition holds (about +25%), so they average out near 10%.

Coins (unique to our system):
- **Mighty**: +N coins on this ability
- **Second Wind**: flip tails once more and keep any new heads (rare)
- **Savage**: crits deal more (a crit already turns every coin heads)

The target:
- **Bane of <family>**: against one foe family (the AI picks the family)
- **Executing**: against foes below half HP
- **Opening Blow**: against foes at full HP
- **Opportunist**: against a foe with any status; **Exploiting**: more for each different status on it
- **Crushing**: against shielded or armored foes (high Physical defense)
- **Giant-slayer**: against foes with more max HP than you
- **Piercing**: ignores some of the target's defense

You:
- **Desperate**: when you are below half HP
- **Fresh**: when you are above three quarters HP
- **Haunted**: the more stress you have (ties to stress)
- **Vengeful**: if you were hit since your last turn
- **Vanguard**: when used from rank 1

Timing:
- **First Strike**: if you act before the target this round
- **Momentum**: stacks with each use in a row, up to 3
- **Bloodthirsty**: stacks with each kill this fight
- **Focused**: if the target is the same as your last attack's

Team:
- **Coordinated**: if an ally hit this target this round
