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

### Mod catalog (designer rulings, 2026-10-22; curated, the current state)

**How mods work:**
- **The AI picks.** The engine rolls how many mods an ability gets; the AI sees every mod that fits and picks that many to suit the merc (designer: "the ai will be given all these mods then asked to pick several"). This replaces Claude's D-0025 idea of dealing 3 candidates.
- **The cost depends on the ability.** On a 0-cooldown ability a mod is free and small, about **10% power** ("a good enough trade"). On an ability with a cooldown, a mod can cost something (such as +1 cd) and be stronger.
- **One damage type per ability.** An element mod **converts all of it** to another type and adds **more** damage (multiplicative, D-0082) on top (designer: "keep it simple").
- **Statuses: one per damage type.** Physical → Bleed, Chaos → Poison, Fire → Burn, Lightning → Shocked, Frost → Chilled.
- **Scaling mods scale smoothly, never at a threshold** (designer, on Clash).
- **Universal but conditional:** a mod fits any ability that meets its condition.

**Families and limits:**

| family | per ability | other rules | mods |
|---|---|---|---|
| element | 1 | converts all damage, + more damage | Fiery, Frosty, Charged, Dark, Brutal |
| status | no limit | | Bleeding, Poisoning, Burning, Shocking, Chilling |
| debuff | 1 | 50% reduced damage; single-target abilities only | Stunning, Heavy, Marking, (Exposing, Weakening, Hampering) |
| buff | 1 | | Swift, (Evasive, Riposting) |
| sustain | no limit | Vampiric rare | Guarding, Vampiric |
| self-move | 1 | | Advancing, Retreating |
| reach | no limit | | Reaching, Footwork |
| scaling | no limit | smooth, no thresholds | Executing, Opening Blow, Desperate, Fresh, Haunted, Serene |
| condition | no limit | | Opportunist, Crushing |
| coins | no limit | | Lucky, Consistent, Gamble |
| double-edged | no limit | all rare; each deals more damage | Wild, Unsteady, Blood Price, Fraught, Ponderous, Unique |
| other | no limit | | Double Strike (one repeat at most), Soothing (rare) |
| conditional | no limit | only if the ability meets the condition | Quick, Measured, Splitting, Potent, Lingering, Composed |

Names in brackets are Claude's, placed without a ruling.

**Every mod:**

| mod | effect | notes |
|---|---|---|
| **Fiery / Frosty / Charged / Dark / Brutal** | the damage becomes Fire / Frost / Lightning / Chaos / Physical, and more damage | Claude's reading: on an ability already of that type, it only adds the more damage |
| **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth ~10% of the damage | statuses may get a slightly higher multiplier (balancer) |
| **Stunning** | stun | rarer |
| **Heavy** | knock the target back 1 rank | rarer |
| **Marking** | mark: allies deal more to it | |
| **Exposing / Weakening / Hampering** | takes more damage / deals less / acts later | Claude's |
| **Swift** | you act earlier next round | |
| **Evasive / Riposting** | gain a dodge / riposte charge | Claude's; rarer |
| **Guarding** | shield worth 10% of the damage dealt | |
| **Vampiric** | heal a small share of the damage | rare |
| **Advancing / Retreating** | you step forward / back 1 rank | exclusive |
| **Reaching** | reaches 1 rank further (foe 1–2 → 1–3) | |
| **Footwork** | usable from 1 more rank (from 1–2 → 1–3) | |
| **Executing** | more damage the more HP the target has lost | smooth (was: below half HP, +20%) |
| **Opening Blow** | more damage the more HP the target has left | smooth (was: full HP, +20%) |
| **Desperate** | more damage the more HP you have lost | higher % than Fresh ("having high hp is a lot easier") |
| **Fresh** | more damage the more HP you have left | |
| **Haunted** | more damage the more stress you have | |
| **Serene** | more damage the less stress you have | Claude's name |
| **Opportunist** | more damage against a foe with any status | ~15–20% |
| **Crushing** | more damage against shielded or armored foes | |
| **Lucky** | +5% heads chance (number open) | |
| **Consistent** | reroll a bad flip once (under 20% heads) | designer's |
| **Gamble** | all coins land the same: all heads or all tails; +10% more damage | designer's |
| **Wild** | its target is picked at random | rare, more damage |
| **Unsteady** | moves you back or forward 1 rank at random | rare, more damage |
| **Blood Price** | costs you HP | rare, more damage |
| **Fraught** | gives you stress | rare, more damage |
| **Ponderous** | you act last | rare, more damage |
| **Unique** | massively more damage, but usable once per battle or per quest (open) | rare |
| **Double Strike** | small chance to hit again | one repeat at most |
| **Soothing** | lowers your stress when used | rare |
| **Quick** | −1 cooldown | has a cooldown |
| **Measured** | much more damage, +1 cooldown | has a cooldown |
| **Splitting** | with fewer targets, damage condenses onto those left | hits several foes |
| **Potent** | its statuses are stronger | inflicts a status |
| **Lingering** | its statuses last a round longer | inflicts a status |
| **Composed** | softens its self-debuff | has one |

**Rejected (designer, 2026-10-22):** Sweeping ("sweeping bad no"); Clash (merged into smooth Executing / Opening Blow); Mighty, Second Wind (replaced by Consistent), Savage, Bane of \<family\>, Exploiting, Giant-slayer, Piercing, Vengeful, Vanguard, First Strike, Momentum, Bloodthirsty, Focused, Coordinated ("the earlier ones are all rejected").

**Not yet ruled (Claude's):**
- From the Path of Exile support gems (PoE1 list on poedb, PoE2 list on mein-mmo; turn-based translations only):
  - Purist (Brutality): more damage, no element or status mods.
  - Steady (Controlled Destruction): more damage, can't crit.
  - Festering (Deadly Poison): less hit damage, stronger statuses.
  - Smouldering (Eternal Flame): statuses last longer but are weaker.
  - Bulwark (Flesh Shield): deal less and take less until your next turn.
  - Finisher (Combo Finisher): more for each other ability used since this one last fired.
  - Patient (Unleash): more for each round unused, up to 3.
  - Ruthless: every third use hits much harder.
  - Twin Charge: two uses per cooldown.
  - Alternating: more if your last ability came from a different skill.
  - Consuming (Exploit Weakness): removes a status from the target for bonus damage.
  - Bane of \<status\> (Hypothermia): more against one named status; can't inflict it.
  - Charging: more if you changed rank since your last turn.
  - Rooted (Stoicism): more for each round you stayed put.
  - Close Quarters / Far Shot: more against the nearest / farthest ranks.
  - Outnumbered (Defy): more for each foe beyond your side's count.
  - Trophy (Behead): a kill takes one of the foe's buffs.
- Taunting: foes hit must target you next round.
- Cleave-only: Carry-through, Shattering, Reckless.
