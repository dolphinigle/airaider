# Ability brainstorm, by battle skill

The goal is each skill's identity plus rough ability bases. Numbers come later (steps 2–4 in docs/NOW.md). Each entry is marked with who wrote it: designer, Claude's draft, or designer-approved.

**Writing conventions (designer, 2026-10-22):**
- **Damage is a % of a standard hit** (Darkest Dungeon style): "yup sounds good lets use %. pls remember it." How % becomes coins (heads × base per head, D-0069) is settled in balance (step 2).
- **Model abilities first** (designer, 2026-10-22): each skill gets a few model abilities that set its identity; the rest are filled in later. The designer lets Claude pick details ("just pick yourself, i dont have strong pref").
- **Generic names**, because the AI replaces every name ("the names should be more generic").
- **Most abilities have no cooldown** (designer, 2026-10-22: "you have been using cd way way too often. MOST skills shouldnt have cd… see darkest dungeon"). An ability is priced by its power, ranks, targets and after-effects. Cooldowns go on heals ("Mend should have CD") and a few big effects.
- **Only weapon and magic skills have a default attack** (designer, 2026-10-22, on Dirty Fighting). Other battle skills carry none; a merc whose first ability would come from one gets the generic fallback attack (D-0050, D-0051; Claude's reading).
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
| **Knockback Strike** | 1★ | 1–2 → foe 1–2 | 90% | knocks the foe back 1 rank | 0 cd |
| **Sunder** | 2★ | 1–2 → 1–2 | 80% | Sundered | 0 cd |
| **Stunning Blow** | 2★ | 1–2 → foe 1 | 70% | Stun | cd 2 |
| **Wide Cleave** (Titanic Swing) | 4★ | 1 → foe 1, 2 and 3 | 70% each | you are Staggered next round | cd 2 |

Every turn asks focus (Heavy Strike) or spread (Cleave), since both have no cooldown. **Every stun has a cooldown** (designer: "stun must have cd"); resists come later. Knockback Strike sends a dangerous foe back and brings the one behind into reach.

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

**Count and potency** (designer, 2026-10-22): every buff and debuff has a **count** (how many rounds, hits or flips it lasts) and most have a **potency** (how strong it is), e.g. Poison potency 5, count 3. Some have count only. Which unit each count uses is Claude's draft.

| kind | effect | what it does | potency | count |
|---|---|---|---|---|
| damage status | **Bleed / Poison / Burn** | deals Physical / Chaos / Fire damage each round | damage per round | rounds |
| damage status | **Shocked** | the next hit on it deals more (Lightning) | how much more | hits |
| damage status | **Chilled** | Frost; what it does is open (Claude: acts later) | open | rounds |
| debuff | **Stun** | loses its next turn (rarer); **always limited**, by a cooldown or by uses per quest (Dirty Fighting's Flashbang, designer: "just limited use"); **single target only for now** (designer: "ground slam bad, dont have multi stun for now") | — | turns |
| debuff | **Mark** | allies deal more to it | how much more | rounds |
| debuff | **Sundered** | Physical defense down (Sunder) | how much down | rounds |
| debuff | **Exposed** (Claude) | takes more damage | how much more | rounds |
| debuff | **Weakened** (Claude) | deals less damage | how much less | rounds |
| debuff | **Slowed** (Claude) | acts later | — | rounds |
| debuff | **Blinded** (Claude) | each of its flips gets a fixed worse heads chance, the mirror of Blessed (no misses, D-0070) | — | flips |
| self-debuff | **Staggered** | acts last and takes more damage (Wide Cleave) | how much more | rounds |
| buff | **Haste** | acts earlier | — | rounds |
| buff | **Emboldened** | its attacks deal more damage | how much more | attacks |
| buff | **Blessed** | each blessed flip gets a fixed better heads chance (designer: a counter of how many times the unit gets blessed with good luck) | — | flips |
| buff | **Riposte** (Claude) | strikes back when hit | the riposte's damage | charges |
| buff | **Regen** | heals each round, the opposite of Poison and Burn (designer) | healing per round | rounds |

**Debuffs flip coins to land** (designer, 2026-10-22: "itll need to flip coins to land (the mech exactly hasnt been decided) so mods can touch this 'accuracy'"). Buffs don't flip for now.

Not on the list: shields (sustain), knockback (a move). Dodge and evasion are not planned yet (designer).

### Mod catalog (designer rulings, 2026-10-22; curated, the current state)

Damage and heal mods are done for now (2026-10-22); the bits marked deferred wait for later.

**How mods work:**
- **The AI picks.** The engine rolls how many mods an ability gets; the AI sees every mod that fits and picks that many to suit the merc (designer: "the ai will be given all these mods then asked to pick several"). This replaces Claude's D-0025 idea of dealing 3 candidates.
- **Eligibility is automatic and rare mods are flipped in** (designer: "pick the 3 mods from all the eligible trait list PLUS some rare ones that were 'flipped' to be included in the selection"). The engine offers the AI **about 10 random commons** from those that fit (by fits, limits and conditions), plus each rare mod that wins its own flip (designer: "ai should offer like 10 not 6"). No hand-tailoring per ability.
- **The cost depends on the ability.** On a 0-cooldown ability a mod is free and small, about **10% power** ("a good enough trade"). On an ability with a cooldown, a mod can cost something (such as +1 cd) and be stronger.
- **Power** is damage on an attack and healing on a heal. **Fits**: dmg (damaging abilities), heal (healing abilities), both.
- **One damage type per ability.** An element mod **converts all of it** to another type and adds **more** damage (multiplicative, D-0082) on top.
- **Scaling mods scale smoothly, never at a threshold.**
- **Universal but conditional:** a mod fits any ability that meets its condition.
- **Coin mods fit debuff abilities too**, since debuffs flip to land: there they change the landing chance (designer, 2026-10-22). **Accuracy stays limited:** only coin mods touch it (Lucky, Consistent, more coin mods later). Power mods never turn into landing chance on potency-less debuffs (designer: "no disagree, accuracy modifying mods on debuff must be limited").

| family | limit | fits | mod | effect | notes |
|---|---|---|---|---|---|
| element | 1 | dmg | **Fiery / Frosty / Charged / Dark / Brutal** | the damage becomes Fire / Frost / Lightning / Chaos / Physical, + more damage | on an ability already of that type, only the more damage (Claude) |
| status | none | dmg | **Bleeding / Poisoning / Burning / Shocking / Chilling** | inflicts that status, worth ~10% of the damage | statuses may get a slightly higher multiplier (balancer) |
| debuff | 1 | dmg | **Debuffing** | inflicts one debuff from the effects list | 50% reduced damage; single-target abilities only |
| debuff | | dmg | **Heavy** | knock the target back 1 rank | rarer; same costs |
| debuff | | dmg | **Stunning** (via Debuffing) | stun | stun needs a cooldown, so this adds +1 cd on a no-cooldown ability (Claude; to rule) |
| ally buff | 1 | heal | **Hastening / Emboldening / Blessed** | gives the target Haste / Emboldened / Blessed | single target only; reduced healing (Claude: 50%, mirroring debuffs; deferred) |
| self buff | 1 | both | **Swift** (or any buff from the list) | gives you a buff | |
| cure | 1 | heal | **Purifying** | removes every negative status from the target | common; 50% reduced healing; single target only |
| sustain | none | both | **Guarding** | a shield worth 10% of the damage or healing | on a heal, on the healed ally (Claude; deferred) |
| sustain | | dmg | **Vampiric** | you heal a small share of the damage | rare |
| sustain | | heal | **Empathic** | you also heal for a share of it | rare |
| sustain | | heal | **Overflow** | 30% of healing past full HP becomes a shield | rare |
| over time | none | heal | **Regenerating** | part of the heal comes later as regen, more in total | |
| self-move | 1 | both | **Advancing / Retreating** | you step forward / back 1 rank; +10% more power | designer: "self moves also give bonus"; only moving a foe (Heavy) gives none (Claude reads it as on every ability) |
| target move | 1 | heal / buff | **Rallying / Sheltering** (Claude's names) | the target ally steps forward / back 1 rank; +10% more power | the 10% applies only when moving **allies**, so on heals and buffs, not damage (designer); designer: "make the healing target move back/front"; moving allies was Leadership's (D-0073) |
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
| coins | | dmg / heal | **Gamble** | all coins land the same, all heads or all tails; +10% more power | damage and heals only, "way too strong for accuracy" (designer) |
| double-edged | none | both | **Reckless** | 15% more power; you take 15% more damage until your next turn | not rare |
| double-edged | | both | **Wild / Unsteady / Fraught / Ponderous** | more power; random target / random step back or forward / gives you stress / you act last | rare |
| double-edged | | dmg / heal | **Blood Price / Transfusion** | costs you HP; more power | rare |
| double-edged | | both | **Unique** | massively more power; uses drop one step (unlimited → once per battle → once per quest) | rare |
| other | none | both | **Double Strike** | small chance to fire again (on a heal: heals again) | one repeat at most |
| other | | both | **Soothing** | lowers your stress | rare |
| other | | heal | **Calming** | lowers the target's stress a little | rare |
| conditional | none | both | **Quick / Measured** | −1 cooldown / much more power, +1 cooldown | has a cooldown |
| conditional | | dmg | **Splitting** | with fewer foes in reach, the damage condenses onto those left | hits several foes |
| conditional | | heal | **Splitting** (heal) | allies at full HP are skipped, and their share condenses onto the hurt ones | heals several allies (Claude's conversion of the area-only mod) |
| conditional | | both | **Composed** | softens its self-debuff | has one |
| conditional | | dmg | **Potent** | its statuses are stronger | inflicts a status |
| conditional | | dmg | **Lingering** | its statuses get +1 count | inflicts a status; **rare, adds a lot of cooldown** (designer, like Lasting) |

**Rejected (designer, 2026-10-22):** Sweeping ("sweeping bad no"); Clash (merged into smooth Executing / Opening Blow); Mighty, Second Wind (replaced by Consistent), Savage, Bane of \<family\>, Exploiting, Giant-slayer, Piercing, Vengeful, Vanguard, First Strike, Momentum, Bloodthirsty, Focused, Coordinated ("the earlier ones are all rejected"); all the Path of Exile support gem translations (Purist, Steady, Festering, Smouldering, Bulwark, Finisher, Patient, Ruthless, Twin Charge, Alternating, Consuming, Bane of \\<status\\>, Charging, Rooted, Close Quarters / Far Shot, Outnumbered, Trophy; designer: "all in (2) are rejected"). Evasive ("we dont have evasion planned yet"); Taunting ("bad"); Carry-through, Shattering. Heal drafts rejected: the five single-status cures, Fortifying, Bedside, Lasting / Potent for buffs, Well-stocked. Echo merged into Double Strike ("echo should be same").

## Polearm (STR)

**Identity (Claude's draft):** the second-rank fighter. It strikes from ranks 2–3 over an ally's shoulder, reaches deep into the foe line, and pulls or pushes foes to set up the squad. Two-handed only knocks back; Polearm does both.

**Model abilities (Claude's draft):**

| ability | rarity | ranks | damage | effect | cost |
|---|---|---|---|---|---|
| **Thrust** | 1★ | 2–3 → foe 1–2 | 100% | the default attack | 0 cd |
| **Deep Thrust** | 1★ | 2–3 → foe 3–4 | 80% | reaches the back ranks | 0 cd |
| **Pull** | 1★ | 2–3 → foe 2–4 | 60% | pulls the foe forward 1 rank | 0 cd |
| **Push** | 2★ | 2–3 → foe 1 | 70% | pushes the foe back 1 rank | 0 cd |
| **Impale** | 2★ | 2–3 → foe 1–2 | 110% | Bleed | 0 cd |
| **Sweep** | 3★ | 2–3 → foe 1 and 2 | 50% each | hits both front foes | 0 cd |

## Dirty Fighting (STR + DEX)

**Identity:** "their side" (D-0073, D-0098): what you do to the foe besides hitting it. Ranks 1–3, mostly reaching foe 1–2. Light damage carrying debuffs (Blinded, Weakened, Mark), yanking a foe forward, and a payoff blow on debuffed foes. **One rare stun, with limited uses** (designer: "it has a stun rarely, just one, like Flashbang or something… just limited use").

**Model abilities (Claude's draft, 2026-10-22):**

| ability | rarity | ranks | damage | effect | cost |
|---|---|---|---|---|---|
| **Pocket Sand** | 1★ | 1–3 → foe 1–2 | 30% | Blinded | 0 cd |
| **Hamstring** | 1★ | 1–2 → foe 1–2 | 50% | Weakened | 0 cd |
| **Mark** | 2★ | 1–3 → any foe | — | Mark | 0 cd |
| **Yank** | 2★ | 1–2 → foe 2–3 | 50% | pulls the foe forward 1 rank | 0 cd |
| **Kick Them Down** | 2★ | 1–2 → foe 1–2 | 60% | +40% more per debuff on the foe | 0 cd |
| **Flashbang** | 4★ | 1–3 → foe 1–3 | — | Stun | 2 uses per quest (number Claude's) |

**Flashbang's mods** (Stun has no potency, so no power or scaling mods, as on Bless; designer rulings 2026-10-22, the rest Claude's draft):
- **Common:** an extra debuff (1: Blinding / Weakening / Exposing / Slowing / Marking, weak); a small status (Burning / Poisoning / Bleeding / Shocking / Chilling, flat ~10% of a standard hit, as Guarding on Bless); Heavy (knock back) or **Yanking** (Claude: pull forward 1 rank); Guarding, Advancing / Retreating, Swift; Reaching, Footwork; **Lucky, Consistent** (the landing chance).
- **Rare:** Lingering (stun 2 turns, costs a use); **Dispelling** (Claude: removes every buff from the target, the mirror of Purifying); Soothing.
- **Limited-use price** (Claude, to rule): where a mod would add cooldown, a limited-use ability loses a use instead.
- **Out:** Gamble (damage and heals only); Cunning (Claude's easier-to-land-on-debuffed, rejected with accuracy-from-power); Double Strike (a second stun); Quick / Measured (no cooldown); Opportunist, Splitting; Well-stocked (rejected before).

**No default attack** (designer: "dirty fighting shouldnt have a default attack. its not a WEAPON/MAGIC skill"). Low Blow removed.

Every turn asks set up (a debuff) or cash in (Kick Them Down, an ally's big hit on a Marked foe). Yank pulls a back-rank caster into the front line's reach.

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

### Magic model abilities (Claude's draft, 2026-10-22; cooldowns cut to heals and big effects)

Stress costs for Dark are low / mid / high for now (the balancer sets them).

**Fire** (1–4)

| ability | ★ | ranks | power | effect | cost |
|---|---|---|---|---|---|
| Firebolt | 1 | 2–4 → foe 1–3 | 100% | the default attack | 0 cd |
| Flame Strike | 1 | 1–2 → foe 1 | 120% | melee; Burn | 0 cd |
| Flame Wave | 2 | 1–2 → foe 1 and 2 | 60% each | melee; Burn | 0 cd |
| Ignite | 2 | 2–4 → any foe | 40% | strong Burn | 0 cd |
| Fireball | 3 | 2–4 → a foe and the foes next to it | 50% each | Burn | cd 2 |
| Inferno | 4 | 2–4 → all foes | 40% each | Burn | cd 3 |

**Frost** (2–4)

| ability | ★ | ranks | power | effect | cost |
|---|---|---|---|---|---|
| Ice Shard | 1 | 2–4 → foe 1–3 | 100% | the default attack | 0 cd |
| Chill | 1 | 2–4 → any foe | 50% | strong Chilled | 0 cd |
| Frost Lance | 2 | 3–4 → any foe | 120% | Chilled | 0 cd |
| Shatter | 3 | 2–4 → any foe | 100% | 100% more against a Chilled foe; removes its Chilled | 0 cd |
| Ice Armor | 1 | self | 150% shield | | cd 2 |
| Frost Barrier | 3 | self | 100% shield | foes that hit you are Chilled | cd 3 |

**Lightning** (3–4)

| ability | ★ | ranks | power | effect | cost |
|---|---|---|---|---|---|
| Spark | 1 | 3–4 → any foe | 110% | the default attack | 0 cd |
| Static | 1 | 3–4 → any foe | 50% | Shocked | 0 cd |
| Chain Lightning | 2 | 3–4 → a foe, then 2 more | 80% / 60% / 40% | chains to random foes | 0 cd |
| Lightning Bolt | 2 | 3–4 → any foe | 160% | the big hit | cd 1 |
| Thunderclap | 3 | 3–4 → all foes | 30% each | Shocked | cd 2 |
| Overload | 4 | 3–4 → any foe | 250% | | cd 3 |

**Holy** (1–4) (designer changes 2026-10-22: Smite 60%, "weak but flexible"; abilities needing concentration (Prayer, Bless) are back-rank only, 3–4; shield abilities are front-rank only, 1–2, "crusader ish", such as deal damage and shield yourself; Mend has a cooldown, Shield Strike has none; Ward removed.)

| ability | ★ | ranks | power | effect | cost |
|---|---|---|---|---|---|
| Smite | 1 | 1–4 → any foe | 60% | the default attack: weak but usable anywhere (Claude reads "usable on 1-4" as both ranks) | 0 cd |
| Shield Strike | 1 | 1–2 → foe 1–2 | 70% | you gain a shield | 0 cd |
| Bless | 2 | 3–4 → any ally | — | Blessed until its next flip | 0 cd |
| Purify | 2 | 1–4 → any ally | — | removes every negative status | 0 cd |
| Mend | 1 | 1–4 → any ally | 100% heal | | cd 1 |
| Prayer | 3 | 3–4 → all allies | 35% heal each | | cd 2 |

A heal or shield % is measured like damage: 100% heals as much as a standard hit deals (Claude).

**Dark** (2–4): stress is its price, so only the big two have cooldowns.

| ability | ★ | ranks | power | effect | cost |
|---|---|---|---|---|---|
| Shadow Bolt | 1 | 2–4 → foe 1–3 | 100% Chaos | the default attack | 0 cd, low stress |
| Curse | 1 | 2–4 → any foe | 40% Chaos | Weakened | 0 cd, low stress |
| Hex | 2 | 2–4 → any foe | 40% Chaos | Exposed | 0 cd, low stress |
| Dark Mending | 2 | 2–4 → any ally | 120% heal | | 0 cd, mid stress |
| Mass Curse | 3 | 2–4 → all foes | — | Weakened | cd 2, high stress |
| Doom | 4 | 2–4 → any foe | 220% Chaos | | cd 2, high stress |

### Buff mods, on Bless (designer rulings, 2026-10-22)

Bless: 3–4 → any ally, Blessed until its next flip, 0 cd. Buffs don't flip coins for now (designer: "maybe no coin flips").

**Potency decides the pool** (designer): on a buff or debuff ability whose effect has potency, "more" raises the potency, so scaling and more-power mods fit. They are dropped only where the effect has **no potency**, like Bless ("the pool is small ONLY for skills like this"); Blessed is count only.

Bless's mods (10 common, 7 rare):
- **Extra buff on the target** (1, single target, reduced power, as on heals): Hastening / Emboldening / Regenerating
- **Sustain:** Guarding (a small shield, about 10% of a standard hit), Mending (a small heal, about 20%)
- **Moves:** Advancing / Retreating (you), Rallying / Sheltering (the target)
- **Self buff:** Swift
- **Range:** Footwork (usable from 2–4). Reaching only fits a limited reach, not Bless's any ally.
- **Repeat:** Echo (Double Strike under its non-attack name; one repeat at most)
- **Rare:** Purifying; Lasting (+1 count) and Self-blessing (you get it too), both adding a lot of cooldown; Soothing; Calming
- Once Lasting or Self-blessing gives Bless a cooldown, Quick and Measured fit too.

**Rejected:**
- Spreading, Warding, Steadying, Inspiring, Twin ("bad").
- Triage / Comforting and the scaling and more-power mods on potency-less buffs.
