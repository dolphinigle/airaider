# Ability brainstorm, by battle skill

The goal is each skill's identity plus rough ability bases. Numbers come later (steps 2–4 in docs/NOW.md). Each entry is marked with who wrote it: designer, Claude's draft, or designer-approved.

**Writing conventions (designer, 2026-10-22):**
- **Damage is a % of a standard hit** (Darkest Dungeon style): "yup sounds good lets use %. pls remember it." How % becomes coins (heads × base per head, D-0069) is settled in balance (step 2).
- **Model abilities first** (designer, 2026-10-22): each skill gets a few model abilities that set its identity; the rest are filled in later. The designer lets Claude pick details ("just pick yourself, i dont have strong pref").
- **Generic names**, because the AI replaces every name ("the names should be more generic").
- **Statuses are written by name only** ("for status application like stun just say stun for now, lets figure out how they are applied later").

## Mods (designer, 2026-10-22)

- One **list of possible mods** ("fire damage mod" etc.), **tailored to each skill**: each skill takes the mods that fit it. The pool should be **"as big as we can"**.
- Order: design a skill's abilities first, then decide which mods fit it.
- Still open: whether mods also sit on skills or only on abilities (D-0025, D-0069: per ability).

## Rarity (designer, 2026-10-22)

- **Some ability bases are rarer** (the designer called Titanic Swing "a (rarer) skill"). Rarer bases are dealt to the AI less often, and the skill's star makes them likelier (designer: "1 STAR skills are common"). Claude reads this as rarity stars on ability bases (reading A). Whether skill types also have rarity (reading B) is unconfirmed.

## Two-handed (STR)

**Identity (designer, 2026-10-22):** ranks 1–2; hits the foe front line; can hit several foes; knocks back; stuns; sunders; **after-effects**: big swings leave a self-debuff on the next turn. Not wind-ups (designer: "two handed theme shouldnt be wind up, its 'after effects'"; Wind-up removed).

**Key abilities, in the designer's order:** Cleave, Overhead Smash, Sunder, and **Titanic Swing**, a rarer ability that hits three foes.

**Model abilities** (designer-approved cards 2026-10-22; Claude picked the stun and knockback ones; generic names, the designer's names in brackets):

| ability | rarity | ranks | damage | effect | cost |
|---|---|---|---|---|---|
| **Heavy Strike** (Overhead Smash) | 1★ | 1–2 → foe 1 only | 110% | the default attack | 0 cd |
| **Cleave** | 1★ | 1–2 → foe 1 and 2 | 60% each | hits both front foes | 0 cd |
| **Knockback Strike** | 1★ | 1–2 → foe 1–2 | 90% | knocks the foe back 1 rank | cd 1 |
| **Sunder** | 2★ | 1–2 → 1–2 | 80% | Sundered | cd 3 |
| **Stunning Blow** | 2★ | 1–2 → foe 1 | 70% | Stun | cd 2 |
| **Wide Cleave** (Titanic Swing) | 4★ | 1 → foe 1, 2 and 3 | 70% each | you are Staggered next round | cd 4 |

Every turn asks focus (Heavy Strike) or spread (Cleave), since both have no cooldown. Knockback Strike sends a dangerous foe back and brings the one behind into reach.

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

### Effects list (central; designer: "centralize list of accepted buffs/debuffs, so when we say 'buff mod' just pick one from those")

A mod or ability that says "a buff" or "a debuff" picks one entry from this list. Entries marked (Claude) are unruled.

| kind | effect | what it does |
|---|---|---|
| damage status | **Bleed / Poison / Burn / Shocked / Chilled** | one per damage type: Physical / Chaos / Fire / Lightning / Frost; what each does is open |
| debuff | **Stun** | loses its next turn (rarer); **single target only for now**, no multi-foe stun (designer: "ground slam bad, dont have multi stun for now") |
| debuff | **Mark** | allies deal more to it |
| debuff | **Sundered** | Physical defense down (Sunder) |
| debuff | **Exposed** (Claude) | takes more damage |
| debuff | **Weakened** (Claude) | deals less damage |
| debuff | **Slowed** (Claude) | acts later next round |
| self-debuff | **Staggered** | acts last next round and takes more damage (Titanic Swing) |
| buff | **Haste** | acts earlier next round |
| buff | **Emboldened** | its next attack deals more damage |
| buff | **Blessed** | its next flip gets a better heads chance |
| buff | **Riposte** (Claude) | a riposte charge |

Not on the list: shields (sustain), regen (over time), knockback (a move). Dodge and evasion are not planned yet (designer).

### Mod catalog (designer rulings, 2026-10-22; curated, the current state)

Damage and heal mods are done for now (2026-10-22); the bits marked deferred wait for later.

**How mods work:**
- **The AI picks.** The engine rolls how many mods an ability gets; the AI sees every mod that fits and picks that many to suit the merc (designer: "the ai will be given all these mods then asked to pick several"). This replaces Claude's D-0025 idea of dealing 3 candidates.
- **Eligibility is automatic and rare mods are flipped in** (designer: "pick the 3 mods from all the eligible trait list PLUS some rare ones that were 'flipped' to be included in the selection"). Every common mod that fits the ability (by fits, limits and conditions) is offered; each rare mod gets its own flip to join the offer. No hand-tailoring per ability.
- **The cost depends on the ability.** On a 0-cooldown ability a mod is free and small, about **10% power** ("a good enough trade"). On an ability with a cooldown, a mod can cost something (such as +1 cd) and be stronger.
- **Power** is damage on an attack and healing on a heal. **Fits**: dmg (damaging abilities), heal (healing abilities), both.
- **One damage type per ability.** An element mod **converts all of it** to another type and adds **more** damage (multiplicative, D-0082) on top.
- **Scaling mods scale smoothly, never at a threshold.**
- **Universal but conditional:** a mod fits any ability that meets its condition.

| family | limit | fits | mod | effect | notes |
|---|---|---|---|---|---|
| element | 1 | dmg | **Fiery / Frosty / Charged / Dark / Brutal** | the damage becomes Fire / Frost / Lightning / Chaos / Physical, + more damage | on an ability already of that type, only the more damage (Claude) |
| status | none | dmg | **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth ~10% of the damage | statuses may get a slightly higher multiplier (balancer) |
| debuff | 1 | dmg | **Debuffing** | inflicts one debuff from the effects list | 50% reduced damage; single-target abilities only |
| debuff | | dmg | **Heavy** | knock the target back 1 rank | rarer; same costs |
| ally buff | 1 | heal | **Hastening / Emboldening / Blessed** | gives the target Haste / Emboldened / Blessed | single target only; reduced healing (Claude: 50%, mirroring debuffs; deferred) |
| self buff | 1 | both | **Swift** (or any buff from the list) | gives you a buff | |
| cure | 1 | heal | **Purifying** | removes every negative status from the target | common; 50% reduced healing; single target only |
| sustain | none | both | **Guarding** | a shield worth 10% of the damage or healing | on a heal, on the healed ally (Claude; deferred) |
| sustain | | dmg | **Vampiric** | you heal a small share of the damage | rare |
| sustain | | heal | **Empathic** | you also heal for a share of it | rare |
| sustain | | heal | **Overflow** | 30% of healing past full HP becomes a shield | rare |
| over time | none | heal | **Regenerating** | part of the heal comes later as regen, more in total | |
| self-move | 1 | both | **Advancing / Retreating** | you step forward / back 1 rank | |
| reach | none | both | **Reaching / Footwork** | reaches 1 rank further / usable from 1 more rank | |
| scaling | none | dmg | **Executing / Opening Blow** | more the more HP the target has lost / has left | smooth |
| scaling | | heal | **Triage** | more healing the more HP the target has lost | |
| scaling | | heal | **Comforting** | more healing the more stress the target has | |
| scaling | | both | **Desperate / Fresh** | more power the more HP you have lost / have left | Desperate is the higher % |
| scaling | | both | **Haunted / Serene** | more power the more / less stress you have | |
| condition | none | dmg | **Opportunist** | more damage on a foe with any status | ~15–20% |
| condition | | heal | **Remedial** | more healing on an ally with any negative status | |
| condition | | dmg | **Crushing** | more damage against shielded or armored foes | |
| coins | none | both | **Lucky** | +5% heads chance (number open) | |
| coins | | both | **Consistent** | reroll a bad flip once (under 20% heads) | |
| coins | | both | **Gamble** | all coins land the same, all heads or all tails; +10% more power | |
| double-edged | none | both | **Reckless** | 15% more power; you take 15% more damage until your next turn | not rare |
| double-edged | | both | **Wild / Unsteady / Fraught / Ponderous** | more power; random target / random step back or forward / gives you stress / you act last | rare |
| double-edged | | dmg / heal | **Blood Price / Transfusion** | costs you HP; more power | rare |
| double-edged | | both | **Unique** | massively more power; uses drop one step (unlimited → once per battle → once per quest) | rare |
| other | none | both | **Double Strike** | small chance to fire again (on a heal: heals again) | one repeat at most |
| other | | both | **Soothing** | lowers your stress | rare |
| other | | heal | **Calming** | lowers the target's stress a little | rare |
| conditional | none | both | **Quick / Measured** | −1 cooldown / much more power, +1 cooldown | has a cooldown |
| conditional | | both | **Splitting** | with fewer targets, the power condenses onto those left | hits several targets |
| conditional | | both | **Composed** | softens its self-debuff | has one |
| conditional | | dmg | **Potent / Lingering** | its statuses are stronger / last a round longer | inflicts a status |

**Rejected (designer, 2026-10-22):** Sweeping ("sweeping bad no"); Clash (merged into smooth Executing / Opening Blow); Mighty, Second Wind (replaced by Consistent), Savage, Bane of \<family\>, Exploiting, Giant-slayer, Piercing, Vengeful, Vanguard, First Strike, Momentum, Bloodthirsty, Focused, Coordinated ("the earlier ones are all rejected"); all the Path of Exile support gem translations (Purist, Steady, Festering, Smouldering, Bulwark, Finisher, Patient, Ruthless, Twin Charge, Alternating, Consuming, Bane of \\<status\\>, Charging, Rooted, Close Quarters / Far Shot, Outnumbered, Trophy; designer: "all in (2) are rejected"). Evasive ("we dont have evasion planned yet"); Taunting ("bad"); Carry-through, Shattering. Heal drafts rejected: the five single-status cures, Fortifying, Bedside, Lasting / Potent for buffs, Well-stocked. Echo merged into Double Strike ("echo should be same").

## Polearm (STR)

**Identity (Claude's draft):** the second-rank fighter. It strikes from ranks 2–3 over an ally's shoulder, reaches deep into the foe line, and pulls or pushes foes to set up the squad. Two-handed only knocks back; Polearm does both.

**Model abilities (Claude's draft):**

| ability | rarity | ranks | damage | effect | cost |
|---|---|---|---|---|---|
| **Thrust** | 1★ | 2–3 → foe 1–2 | 100% | the default attack | 0 cd |
| **Deep Thrust** | 1★ | 2–3 → foe 3–4 | 80% | reaches the back ranks | cd 1 |
| **Pull** | 1★ | 2–3 → foe 2–4 | 60% | pulls the foe forward 1 rank | cd 2 |
| **Push** | 2★ | 2–3 → foe 1 | 70% | pushes the foe back 1 rank | cd 2 |
| **Impale** | 2★ | 2–3 → foe 1–2 | 130% | Bleed | cd 3 |
| **Sweep** | 3★ | 2–3 → foe 1 and 2 | 50% each | hits both front foes | cd 2 |

## The five magics, identities (designer, 2026-10-22)

| magic | attr | ranks | damage / status | identity |
|---|---|---|---|---|
| **Fire** | STR + INT | 1–4 (designer) | Fire / Burn | a balance of single-target and area damage; Burn deals damage over time; **some melee magic** (designer; fits STR + INT) |
| **Frost** | DEX + INT | 2–4 (designer) | Frost / Chilled | single target; Chilled; shields on the caster |
| **Lightning** | INT | 3–4 (designer) | Lightning / Shocked | the biggest direct damage; Shocked makes the next hit deal more; area damage by chaining |
| **Holy** | CHA | 1–4 (designer) | Physical / none | healing, some buffs, a weak shield, weak damage; no bonus against undead ("holy is already stacked") |
| **Dark** | CHA + CON | 2–4 (designer) | Chaos / none | self-stressing (D-0072), debuffs, **healing paid with stress**, a rare source of Chaos damage; **no Poison** |

Ranks are a skill's range; each ability sets its own (designer: "really depends on the skills").

**Statuses by damage type, clarified** (designer: "poison deals chaos damage but not caused by chaos magic"): the status-per-type rule says which damage each status deals (Poison deals Chaos). It does not mean every source of that damage type inflicts it. Poison comes from other skills (Alchemy, Poisoning mods).

Claude's first draft, replaced: Fire as the swarm mage; Frost as the turn-order controller; Lightning as the coin-swing gambler; Holy with an undead bonus; Dark with Poison.
