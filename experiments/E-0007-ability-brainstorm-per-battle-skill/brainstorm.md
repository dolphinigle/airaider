# Ability brainstorm, by battle skill

The goal is each skill's identity plus rough ability bases. Numbers come later (steps 2–4 in docs/NOW.md). Each entry is marked with who wrote it: designer, Claude's draft, or designer-approved.

**Writing conventions (designer, 2026-10-22):**
- **Damage is a % of a standard hit** (Darkest Dungeon style): "yup sounds good lets use %. pls remember it." How % becomes coins (heads × base per head, D-0069) is settled in balance (step 2).
- **Model abilities first** (designer, 2026-10-22): each skill gets a few model abilities that set its identity; the rest are filled in later. The designer lets Claude pick details ("just pick yourself, i dont have strong pref").
- **Generic names**, because the AI replaces every name ("the names should be more generic").
- **Most abilities have no cooldown** (designer, 2026-10-22: "you have been using cd way way too often. MOST skills shouldnt have cd… see darkest dungeon"). An ability is priced by its power, ranks, targets and after-effects. Cooldowns go on heals ("Mend should have CD") and a few big effects.
- **Only weapon and magic skills have a default attack** (designer, 2026-10-22, on Dirty Fighting). Other battle skills carry none; a merc whose first ability would come from one gets the generic fallback attack (D-0050, D-0051; Claude's reading).
- **A default attack is any ability with 0 cooldown that deals damage** (designer, 2026-10-23: "has 0 cooldown and deals damage. so for example Cleave can be a two handed default attack too"), so a skill can have several and none is marked.
- **Names say what the ability does** (designer, 2026-10-23): generic, but descriptive enough that the AI can guess the ability when it picks abilities for a merc (it reskins every name), e.g. Heavy Advancing Lunge, Shield All Allies.
- **Polearm pairs** (designer, 2026-10-23): players will likely pair two Polearm mercs for synergy; a step forward swaps them, so each lunge sets the partner up at rank 3.
- **10–30 abilities per skill in the final game** (designer, 2026-10-23: "in real one we want to have 10-30 abilities"); D-0069 says 10–20. The baseline (~8 each) is a first cut.
- **Statuses are written by name only** ("for status application like stun just say stun for now, lets figure out how they are applied later").

**Baseline abilities for all 29 skills** (2026-10-23): `baseline.mjs`, the current set; the per-skill drafts below are its history. Designer (2026-10-23): "some skills are too strong eg back rank shot, but thats fine balancing pass later"; numbers wait for a balance pass. **Overwatch is rejected** (designer, 2026-10-23: "overwatch is not good for this game"): no ability fires on a foe's action before it acts.

## Mods (designer, 2026-10-22)

- One **list of possible mods** ("fire damage mod" etc.), **tailored to each skill**: each skill takes the mods that fit it. The pool should be **"as big as we can"**.
- Order: design a skill's abilities first, then decide which mods fit it.
- Still open: whether mods also sit on skills or only on abilities (D-0025, D-0069: per ability).

## Rarity (designer, 2026-10-22)

- **Some ability bases are rarer** (the designer called Titanic Swing "a (rarer) skill"). Rarer bases are dealt to the AI less often, and the skill's star makes them likelier (designer: "1 STAR skills are common"). Claude reads this as rarity stars on ability bases (reading A). Whether skill types also have rarity (reading B) is unconfirmed.
- **Higher stars are weirder, not stronger** (designer, 2026-10-23: "dont make higher star skill power creep thei lower ones. higher star just usually have weirder effects… its fine to make them a little stronger than lower rarity just not like 2x"). A rare base may be a little stronger than common ones, never a bigger copy of one (the rejected example: a 4★ Polearm lunge at 220% beside the 1★ one at 130%).
- **What a good weird rare looks like** (designer, 2026-10-23: "your four star with 'weird' effects are all pretty bad… detonate burn is good"): Detonate Burn (the foe takes all its remaining Burn now, and the Burn ends). Claude's reading: it bends the skill's own core (its status, move or resource) in one clear line that resolves now. Rejected 4★s: Slash Step Slash, Throw Foe into Foe, Returning Throw, Freezing Ice Shield, Lingering Ball Lightning, Share the Pain (HP evens out), Transfer Curses, Chain Finishing Blow, Play Dead, Reflect Damage, Decoy, Stabilize Kit, Transmute Ailments, Borrow Ally Ability, Spreading Flames (unclear), Overwatch Shot.
- **Guard is one to one** (designer, 2026-10-23: "guard is only one person guarded by one. one person cannot guard 2 at the same time"); Guard All Allies is out.
- **No doubling** (designer, 2026-10-23: "doubling in general is bad because expo damage"): no ability doubles a status or a value; cash it in instead (Burst Bleed, Burst Poison, like Detonate Burn).

## Battle skill key identities (2026-10-23)

The designer gave suggestions ("my suggestions not necessarily the best, you can take as inspiration or you can suggest more"); **by** says whose line it is: D designer, C Claude, D+C Claude's proposal the designer took or Claude's fill-in to a designer line.

**Strong** = the skill's core, on many of its bases. **Weak** = one or two bases, or small. Strength is how often, not how hard: Fire's damage is moderate but on most of its bases, so it is strong. Effects use one shared vocabulary, counted in the distribution. **S/W** = strong / weak count. **Mods are outside identities** (designer, 2026-10-23: "keep the mods. mods are 'outside' of identities"): any mod that fits an ability can land on it, whatever the skill (Rallying / Sheltering move an ally from any skill).

| skill | ranks | role | key identity | strong | weak | doesn't | pays | S/W | by |
|---|---|---|---|---|---|---|---|---|---|
| **Two-handed** | 1–2 | front damage | big, strong, wide hits that leave a drawback on itself for its next turn | single damage, area damage | move foes (knockback), Stun, debuff (Sunder) | reach foe 3–4; defend; heal | self drawback (Staggered) | 2/3 | D; Stun, Sunder C |
| **Polearm** | 2–3 | reach damage | hits the back ranks; many attacks also step itself forward for more damage, so it keeps working its way back into position | single damage (reaches foe 3–4), self move (steps forward) | move foes (push, pull), Bleed | Stun; area; rank 1 or 4 | | 2/2 | D; weak C |
| **Weapon and Shield** | 1–2 | tank | holds the line itself: taunts, shields, defensive self-buffs | taunt, self shield, shield allies, self buff (defensive) | single damage, Stun, move foes | **any area** | | 4/3 | D |
| **Dual Wield** | 1–2 | front damage | big damage only while moving: keeps shifting between ranks 1–2, or goes the Bleed route; multi-hits are flavor | single damage, Bleed, self move | area damage | Stun; defend | strong attacks move itself as a drawback | 3/1 | D |
| **Single Weapon** | 1–3 | flex | **fits anywhere**: a little of everything, strong at none; many bases change by the rank they are used from (a lunge from rank 2–3, a parry strike from rank 1); no setup | — | single damage, self move, self shield, counter (riposte) | anything strong | | 0/4 | D+C |
| **Unarmed** | 1 → foe 1 | front damage; control | **no weapon, no range**: only from rank 1 against foe 1; to hit anyone else it must knock the front foe back | single damage, Stun, hold (Grappled), move foes (knock back foe 1) | — | ranks 2–4; foes 2–4 | | 4/0 | D |
| **Shooting** | 3–4 | reach damage | hits the back ranks hard; struggles against the front line or out of position | single damage | area damage (volley), Bleed | ranks 1–2; moves | | 1/2 | D |
| **Throwing** | 1–3 | reach damage | the reverse of Shooting: many attacks move it between ranks while dealing damage | single damage, self move | area damage (multi-throw), Bleed, Poison | rank 4; defend | | 2/3 | D |
| **Fire** | 1–4 (each ability locked) | reach damage | Burn, moderate direct damage, odd utilities (cauterize). **Restrictive positions**: each ability is locked to a narrow pair (from 1–2 hitting foe 1–2; from 3–4 hitting foe 1–2), so its abilities must be chosen for where the merc stands | single damage, area damage, Burn | cure (cauterize: Poison, Bleed, Burn, with a cost) | heal; shields | | 3/1 | D |
| **Frost** | 2–4 | reach damage; control | shields, stuns, moderate damage; single target | single damage, Chilled (slows), self shield, Stun | — | area; heal | | 4/0 | D+C |
| **Lightning** | 3–4 | reach damage | big hits that inflict Shocked; hits arc to neighbouring foes | single damage (the biggest), area damage (arcs), Shocked | — | defense; ranks 1–2 | | 3/0 | D+C |
| **Holy** | 1–4 (looser locks) | healer | **the many**: squad-wide heals, Blessed on allies, cures. Rank locks like Fire's, but looser | heal allies, area heal, ally buff (Blessed), cure | shield allies, single damage | big damage; debuffs | | 4/2 | C |
| **Dark** | 2–4 | control; healer (weak) | **power at a price**: the strongest curses and effects, each paid in its own stress; heals allies by taking stress | debuff (curses) | heal allies (paid in stress), single damage (Chaos) | Poison; life drain | stress | 1/2 | C, from D |
| **Defender** | 1–2 | tank | the **bodyguard**: guards an ally, shields allies, taunts | guard, shield allies, taunt | self shield | damage; heals | | 3/1 | D |
| **Berserk** | 1–4 | front damage | takes risks for more damage; self-buffs work from any rank (take 20% of its HP as damage and enter a berserk state) | single damage, area damage, self buff (berserk state) | self-heal (kills feed it) | defend; help allies | HP, risk | 3/1 | D |
| **Executioner** | 1–3 | front damage | more damage the lower the foe's HP; bonuses on killing blows | single damage | self buff (on a kill) | fresh foes; support | | 1/1 | D |
| **Survivor** | 1–4 | self-sufficient | self-sufficient: plays as if alone; no team utility | self-heal, self buff, Regen, cure (all on itself) | — | **anything for allies** | | 4/0 | D |
| **Precision** | 1–4 | self-sufficient | self buffs (luck on its flips, crits); weak ally buffs | self buff | ally buff | damage; heals | | 1/1 | D |
| **Warfare** | 1–3 | support; control | orders: moves allies between ranks, debuffs foes, some buffs | move allies, debuff | ally buff | heal | | 2/1 | D |
| **Leadership** | 1–4 | support | ally buffs | ally buff | stress relief | damage; moving allies | | 1/1 | D |
| **Performance** | 3–4 | support; healer (weak) | buffs, Regen songs, minor debuffs | ally buff | Regen, debuff, stress relief | damage; big heals; ranks 1–2 | | 1/3 | D |
| **Animal Companion** | 1–4 | flex | **no set identity**: a very wide set of bases covering almost everything; the AI picks what fits the pet | — | almost everything (not counted below) | | | wide | D |
| **Dirty Fighting** | 1–3 | control | debuffs, moving foes around, marks | debuff (incl. Mark), move foes (yank) | single damage (light), Stun (one rare) | default attack; big damage | | 2/2 | D |
| **Retaliation** | 1–3 | tank | gains when it is hit, and hits back | counter, self buff (when hit) | taunt (to get hit) | act first; area | | 2/1 | D; taunt C |
| **Stealth** | 1–4 | reach damage | the reverse taunt: makes itself harder to target; bigger hits while hidden. Any rank, so snipers (Shooting) can use it | hide, single damage (from hiding) | self move | protect allies | | 2/1 | D+C |
| **Doctor** | 2–4 | healer | single-target heals, Regen, cures, general healing; minor area heals | heal allies, Regen, cure | area heal, Poison | damage; buffs | some limited uses (kits) | 3/2 | D |
| **Alchemy** | 3–4 | healer; control | limited uses are the point: few uses, but potent healing, Poison and debuffs | heal allies (potent), Poison, debuff | area damage (bombs), Burn | unlimited use; ranks 1–2 | limited uses | 3/2 | D |
| **Concentration** | 1–4 | self-sufficient | self buffs | self buff | — | effects of its own | | 1/0 | D |
| **Carousing** | 1–4 | self-sufficient; healer (weak) | limited-use self buffs, some limited-use damage and healing | self buff | single damage, heal allies | repeat | limited uses; hangover | 1/2 | D |

### Distribution (strong / weak; Animal Companion not counted)

| effect | S | W | strong in | weak in |
|---|---|---|---|---|
| single damage | 12 | 6 | Two-handed, Polearm, Dual Wield, Unarmed, Shooting, Throwing, Fire, Frost, Lightning, Berserk, Executioner, Stealth | Weapon and Shield, Single Weapon, Holy, Dark, Dirty Fighting, Carousing |
| area damage | 4 | 4 | Two-handed, Fire, Lightning, Berserk | Dual Wield, Shooting, Throwing, Alchemy |
| Bleed | 1 | 3 | Dual Wield | Polearm, Shooting, Throwing |
| Burn | 1 | 1 | Fire | Alchemy |
| Poison | 1 | 2 | Alchemy | Throwing, Doctor |
| Chilled / Shocked | 1 / 1 | 0 | Frost / Lightning | |
| heal allies | 3 | 2 | Holy, Doctor, Alchemy | Dark, Carousing |
| area heal | 1 | 1 | Holy | Doctor |
| self-heal | 1 | 1 | Survivor | Berserk |
| Regen | 2 | 1 | Doctor, Survivor (itself) | Performance |
| cure | 3 | 1 | Holy, Doctor, Survivor (itself) | Fire |
| shield allies | 2 | 1 | Weapon and Shield, Defender | Holy |
| self shield | 2 | 2 | Weapon and Shield, Frost | Single Weapon, Defender |
| taunt | 2 | 1 | Weapon and Shield, Defender | Retaliation |
| guard | 1 | 0 | Defender | |
| hide (reverse taunt) | 1 | 0 | Stealth | |
| ally buff | 3 | 2 | Holy, Leadership, Performance | Precision, Warfare |
| self buff | 7 | 1 | Weapon and Shield, Berserk, Survivor, Precision, Retaliation, Concentration, Carousing | Executioner |
| debuff (incl. Mark) | 4 | 2 | Dark, Warfare, Dirty Fighting, Alchemy | Two-handed, Performance |
| Stun (always limited) | 2 | 3 | Unarmed, Frost | Two-handed, Weapon and Shield, Dirty Fighting |
| hold (Grappled) | 1 | 0 | Unarmed | |
| move foes | 2 | 3 | Unarmed, Dirty Fighting | Two-handed, Polearm, Weapon and Shield |
| move allies | 1 | 0 | Warfare | |
| self move | 3 | 2 | Polearm, Dual Wield, Throwing | Single Weapon, Stealth |
| counter | 1 | 1 | Retaliation | Single Weapon |
| stress relief | 0 | 2 | | Leadership, Performance |
| **total** | **63** | **42** | | |

**Pays a cost:** self drawback 3 (Two-handed, Dual Wield, Carousing's hangover) · HP 1 (Berserk) · stress 1 (Dark) · limited uses 2 whole skills (Alchemy, Carousing) + some of Doctor's.

### Rank distribution (designer ranks, 2026-10-23)

**What a skill's range means** (designer, 2026-10-23): it says where **most** of its abilities sit, not all. "1–2" = the majority work from 1–2; a few may sit elsewhere. "1–4" = it has abilities at 1–2, at 3–4, or across 1–4, not that each works everywhere. Each ability has its own ranks. Fire is the strict one (each ability on a narrow pair, e.g. from 1–2 hitting foe 1–2, from 3–4 hitting foe 1–2), Holy looser; choosing abilities for the merc's rank is part of the build. Unarmed stays rank 1 only (designer).

| rank | skills with abilities there | # |
|---|---|---|
| 1 | Two-handed, Weapon and Shield, Dual Wield, Single Weapon, Unarmed, Throwing, Fire, Holy, Defender, Berserk, Executioner, Survivor, Precision, Warfare, Leadership, Animal Companion, Dirty Fighting, Retaliation, Stealth, Concentration, Carousing | 21 |
| 2 | Two-handed, Polearm, Weapon and Shield, Dual Wield, Single Weapon, Throwing, Fire, Frost, Holy, Dark, Defender, Berserk, Executioner, Survivor, Precision, Warfare, Leadership, Animal Companion, Dirty Fighting, Retaliation, Stealth, Doctor, Concentration, Carousing | 24 |
| 3 | Polearm, Single Weapon, Shooting, Throwing, Fire, Frost, Lightning, Holy, Dark, Berserk, Executioner, Survivor, Precision, Warfare, Leadership, Performance, Animal Companion, Dirty Fighting, Retaliation, Stealth, Doctor, Alchemy, Concentration, Carousing | 24 |
| 4 | Shooting, Fire, Frost, Lightning, Holy, Dark, Berserk, Survivor, Precision, Leadership, Performance, Animal Companion, Stealth, Doctor, Alchemy, Concentration, Carousing | 17 |

| range | # | skills |
|---|---|---|
| mostly front (1–2) | 5 | Two-handed, Weapon and Shield, Dual Wield, Defender, Unarmed (rank 1 only) |
| mid (2–3) | 1 | Polearm |
| 1–3 | 6 | Single Weapon, Throwing, Executioner, Warfare, Dirty Fighting, Retaliation |
| 2–4 | 3 | Frost, Dark, Doctor |
| mostly back (3–4) | 4 | Shooting, Lightning, Performance, Alchemy |
| spread (1–4) | 10 | Fire, Holy, Berserk, Survivor, Precision, Leadership, Animal Companion, Stealth, Concentration, Carousing |

Default attacks at rank 4: Shooting and the five magics. Berserk at ranks 3–4 has only its self-buffs.

### Role distribution (main role first; Claude's draft)

| role | main | also (secondary) |
|---|---|---|
| tank | 3: Weapon and Shield, Defender, Retaliation | |
| healer | 3: Holy, Doctor, Alchemy | weak: Dark, Performance (Regen), Carousing |
| front damage | 5: Two-handed, Dual Wield, Unarmed, Berserk, Executioner | |
| reach damage | 7: Polearm, Shooting, Throwing, Fire, Frost, Lightning, Stealth | |
| support (ally buffs) | 3: Warfare, Leadership, Performance | weak: Precision |
| control (debuffs, stuns, moves) | 2: Dark, Dirty Fighting | Unarmed, Frost, Warfare, Alchemy |
| self-sufficient | 4: Survivor, Precision, Concentration, Carousing | |
| flex | 2: Single Weapon, Animal Companion | |
| **total** | **29** | |

**Observations:**
- Damage is the bulk (12 strong). Self buff is the most common support effect (7 strong).
- Healers: 3 strong (Holy, Doctor, Alchemy), 2 weak (Dark, Carousing) + Performance's Regen, as the designer set.
- Stun is strong only on Unarmed and Frost; still limited per ability (cooldown or uses).
- Back-only skills are few (4); rank 4 has 17 options, mostly magic and support.
- Thinnest: Concentration 1/0; Leadership, Precision, Executioner 1/1. Widest: Weapon and Shield 4/3. Single Weapon 0/4 by design.

### Example builds (Claude's draft)

A merc has 2 battle skills at the start and a 3rd at Lv 7, at most one weapon (D-0090). Pairs must share ranks.

**Two skills:**

| build | skills | ranks | plays as |
|---|---|---|---|
| Crusader | Weapon and Shield + Holy | 1–2 | a front tank that heals and Blesses between taunts |
| Hellion | Polearm + Berserk | 2–3 | steps in for big hits, buffs itself at a cost |
| Leper | Two-handed + Survivor | 1–2 | wide hits; heals off its own drawbacks; needs no one |
| Bodyguard | Defender + Retaliation | 1–2 | guards an ally, gets hit, hits back |
| Brawler | Unarmed + Dirty Fighting | 1 | owns foe 1: stuns, holds, debuffs, knocks it back |
| Spellblade | Single Weapon + Fire | 1–3 | flexible blade plus Fire's rank-locked spells for where it stands |
| Sniper | Shooting + Stealth | 3–4 | untargetable, big shots into the back ranks |
| Plague Doctor | Alchemy + Doctor | 3–4 | steady single heals, potent limited potions, Poison |
| Bard | Shooting + Performance | 3–4 | Haste and Regen songs, shots between |
| Houndmaster | Animal Companion + Dirty Fighting | 1–3 | the pet hits, the merc marks and yanks |
| Occultist | Dark + Doctor | 2–4 | curses and heals, paying stress for the big ones |

**Three skills** (the Lv 7 pick turns a pair into a role):

| build | skills | ranks | plays as |
|---|---|---|---|
| Paladin | Weapon and Shield + Holy + Leadership | 1–2 | tank, healer and buffer in one, damage weak |
| Juggernaut | Weapon and Shield + Defender + Survivor | 1–2 | a pure wall: taunts, guards, shields, heals itself |
| Headsman | Two-handed + Executioner + Berserk | 1–2 | wide hits soften, finishers kill, risks for more |
| Commander | Polearm + Warfare + Leadership | 2–3 | moves the squad into place and buffs it, reaches the back |
| Assassin | Shooting + Stealth + Precision | 3–4 | hidden, lucky, crits on the back line |
| Field Medic | Doctor + Alchemy + Performance | 3–4 | the full healer: single, burst, Regen |
| Battle Mage | Lightning + Frost + Concentration | 3–4 | Shocked, then an empowered big hit; Frost shields itself |
| Drunken Master | Unarmed + Carousing + Survivor | 1 | bottles and fists, self-sufficient at rank 1 |
| Witch Doctor | Dark + Alchemy + Dirty Fighting | 3 | curses, flasks and dirty tricks; all three meet only at rank 3, a tight fit |
| Skirmisher | Throwing + Stealth + Dirty Fighting | 1–3 | throws while moving, hides, debuffs |

**Clashing pairs** (no shared main range, so the second skill gives only its few off-range abilities): Dual Wield + Performance (1–2 vs 3–4), Unarmed + Alchemy (1 vs 3–4), Weapon and Shield + Lightning (1–2 vs 3–4). Open: does the engine avoid dealing these, or is the bad roll part of the gacha?

**Healing** (designer): main healers are **Alchemy, Doctor, Holy**; supplemented by **Dark, Carousing, Performance** (Performance heals through Regen).

**Telling close skills apart** (Claude's proposals):
- **Holy / Doctor / Alchemy:** Holy heals the many (squad-wide, steady); Doctor fixes the one (single target, Regen, cures); Alchemy bursts (potent, few uses).
- **Weapon and Shield / Defender:** Weapon and Shield draws attacks onto itself (taunt) and survives them; Defender protects one ally (guard) and shields others, and fights least.
- **Polearm / Dual Wield / Throwing**, the three movers: Polearm steps forward only, as it strikes; Dual Wield dances between ranks 1–2; Throwing roams ranks 1–3.
- **Leadership / Performance / Warfare:** Leadership is offense and morale (Emboldened, focus fire, Resolve); Performance is tempo and upkeep (Haste, Regen, stress); Warfare is position (moves allies) and debuffs.
- **Precision / Concentration:** Precision buffs its flips (luck, crits); Concentration buffs its next action (more power, shorter cooldowns, repeats).

**Cheat death is out of Survivor** (designer, 2026-10-23: "probably everyone will have it by default ala darkest dungeon"): likely a default for every merc, like Darkest Dungeon's Death's Door; not yet ruled.

**Records:** ally and foe movers are D-0101; Doctor has only some limited-use abilities (fits D-0062). New statuses: Grappled (Unarmed), Hidden (Stealth). **No Frozen** (designer, 2026-10-23: "we dont want frozen in the game"): Frost stuns with plain Stun.

**Rejected** (designer, 2026-10-23): Single Weapon as **the duel**; Unarmed **combos** ("combos doesnt work with turn based games, too many turns required to 'go online'"); Frost **build and shatter**. Principle (Claude's reading): no identity that needs several turns of setup before it pays off.

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
| debuff | **Mark** | allies deal more to it; a debuff like any other, on several debuffers (Dirty Fighting, Dark, …; designer) | how much more | rounds |
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
| conditional | none | both | **Well-stocked** | +1 use | has limited uses; rare (designer, 2026-10-22) |
| conditional | | dmg | **Lingering** | its statuses get +1 count | inflicts a status; **rare, adds a lot of cooldown** (designer, like Lasting) |

**Rejected (designer, 2026-10-22):** Sweeping ("sweeping bad no"); Clash (merged into smooth Executing / Opening Blow); Mighty, Second Wind (replaced by Consistent), Savage, Bane of \<family\>, Exploiting, Giant-slayer, Piercing, Vengeful, Vanguard, First Strike, Momentum, Bloodthirsty, Focused, Coordinated ("the earlier ones are all rejected"); all the Path of Exile support gem translations (Purist, Steady, Festering, Smouldering, Bulwark, Finisher, Patient, Ruthless, Twin Charge, Alternating, Consuming, Bane of \\<status\\>, Charging, Rooted, Close Quarters / Far Shot, Outnumbered, Trophy; designer: "all in (2) are rejected"). Evasive ("we dont have evasion planned yet"); Taunting ("bad"); Carry-through, Shattering. Heal drafts rejected: the five single-status cures, Fortifying, Bedside, Lasting / Potent for buffs, Well-stocked on heals (it came back as a rare +1 use on limited-use abilities). Echo merged into Double Strike ("echo should be same").

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
- **Rare:** **Well-stocked** (+1 use; designer: "add a (rare) +1 limited use"); Soothing.
- **Cooldown-priced mods don't fit limited-use abilities** (designer: "mod add coldown instead doesnt work on limited use"), so Lingering is out here; Claude's idea of paying with a use instead is rejected.
- **Out:** Dispelling (Claude's, "way too strong"); Lingering (adds cooldown); Gamble (damage and heals only); Cunning (Claude's easier-to-land-on-debuffed, rejected with accuracy-from-power); Double Strike (a second stun); Quick / Measured (no cooldown); Opportunist, Splitting.

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

Stress costs for Dark are low / mid / high for now (the balancer sets them). Shadow Bolt, the plain attack, costs **minimal** stress (designer, 2026-10-23).

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
