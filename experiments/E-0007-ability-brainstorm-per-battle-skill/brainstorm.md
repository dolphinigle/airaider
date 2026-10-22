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

Stun and knockback come from other Two-handed abilities, not yet designed (designer: "stun and knockback will be on different skill"). Open: Cleave's cooldown.

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
| buff | 1 | | Swift, (Riposting) |
| sustain | no limit | Vampiric rare | Guarding, Vampiric |
| self-move | 1 | | Advancing, Retreating |
| reach | no limit | | Reaching, Footwork |
| scaling | no limit | smooth, no thresholds | Executing, Opening Blow, Desperate, Fresh, Haunted, Serene |
| condition | no limit | | Opportunist, Crushing |
| coins | no limit | | Lucky, Consistent, Gamble |
| double-edged | no limit | each deals more power; all rare except Reckless | Reckless, Wild, Unsteady, Blood Price, Fraught, Ponderous, Unique |
| other | no limit | | Double Strike (one repeat at most), Soothing (rare) |
| conditional | no limit | only if the ability meets the condition | Quick, Measured, Splitting, Potent, Lingering, Composed |

Names in brackets are Claude's, placed without a ruling.

**Every mod.** "Power" means damage on an attack and healing on a heal (designer: "these are all for damaging skills… rewrod the ones that makes sense so it also covers for HEAL"). **Fits**: dmg = damaging abilities only; both = damaging and healing.

| mod | effect | fits | notes |
|---|---|---|---|
| **Fiery / Frosty / Charged / Dark / Brutal** | the damage becomes Fire / Frost / Lightning / Chaos / Physical, and more damage | dmg | Claude's reading: on an ability already of that type, it only adds the more damage |
| **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth ~10% of the damage | dmg | statuses may get a slightly higher multiplier (balancer) |
| **Stunning** | stun | dmg | rarer |
| **Heavy** | knock the target back 1 rank | dmg | rarer |
| **Marking** | mark: allies deal more to it | dmg | |
| **Exposing / Weakening / Hampering** | takes more damage / deals less / acts later | dmg | Claude's |
| **Swift** | you act earlier next round | both | |
| **Riposting** | gain a riposte charge | both | Claude's; rarer |
| **Guarding** | gain a shield worth 10% of the damage or healing done | both | on a heal, Claude leans the shield goes to the healed ally |
| **Vampiric** | heal yourself for a small share of the damage | dmg | rare |
| **Advancing / Retreating** | you step forward / back 1 rank | both | exclusive |
| **Reaching** | reaches 1 rank further (1–2 → 1–3) | both | |
| **Footwork** | usable from 1 more rank (from 1–2 → 1–3) | both | |
| **Executing** | more power the more HP the target has lost | both | smooth; a heal gives more to the badly hurt |
| **Opening Blow** | more power the more HP the target has left | both | smooth; a heal tops up the barely hurt (Claude: weak on heals, maybe dmg only) |
| **Desperate** | more power the more HP you have lost | both | higher % than Fresh ("having high hp is a lot easier") |
| **Fresh** | more power the more HP you have left | both | |
| **Haunted** | more power the more stress you have | both | |
| **Serene** | more power the less stress you have | both | Claude's name |
| **Opportunist** | more power on a target with any status | both | ~15–20%; a heal on an ally who is bleeding, stunned… |
| **Crushing** | more damage against shielded or armored foes | dmg | |
| **Lucky** | +5% heads chance (number open) | both | |
| **Consistent** | reroll a bad flip once (under 20% heads) | both | designer's |
| **Gamble** | all coins land the same, all heads or all tails; +10% more power | both | designer's |
| **Reckless** | 15% more power; you take 15% more damage until your next turn | both | universal, not rare (designer) |
| **Wild** | its target is picked at random | both | rare, more power |
| **Unsteady** | moves you back or forward 1 rank at random | both | rare, more power |
| **Blood Price** | costs you HP | both | rare, more power |
| **Fraught** | gives you stress | both | rare, more power |
| **Ponderous** | you act last | both | rare, more power |
| **Unique** | massively more power; its uses drop one step: unlimited → once per battle, once per battle → once per quest | both | rare; Claude's rule (designer: "up to you") |
| **Double Strike** | small chance to fire again | both | one repeat at most |
| **Soothing** | lowers your stress when used | both | rare |
| **Quick** | −1 cooldown | both | has a cooldown |
| **Measured** | much more power, +1 cooldown | both | has a cooldown |
| **Splitting** | with fewer targets, the power condenses onto those left | both | hits several targets |
| **Potent** | its statuses are stronger | dmg | inflicts a status |
| **Lingering** | its statuses last a round longer | dmg | inflicts a status |
| **Composed** | softens its self-debuff | both | has one |

**Rejected (designer, 2026-10-22):** Sweeping ("sweeping bad no"); Clash (merged into smooth Executing / Opening Blow); Mighty, Second Wind (replaced by Consistent), Savage, Bane of \<family\>, Exploiting, Giant-slayer, Piercing, Vengeful, Vanguard, First Strike, Momentum, Bloodthirsty, Focused, Coordinated ("the earlier ones are all rejected"); all the Path of Exile support gem translations (Purist, Steady, Festering, Smouldering, Bulwark, Finisher, Patient, Ruthless, Twin Charge, Alternating, Consuming, Bane of \\<status\\>, Charging, Rooted, Close Quarters / Far Shot, Outnumbered, Trophy; designer: "all in (2) are rejected"). Evasive ("we dont have evasion planned yet"); Taunting ("bad"); Carry-through, Shattering.
