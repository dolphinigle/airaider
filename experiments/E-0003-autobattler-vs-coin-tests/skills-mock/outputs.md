# Battle-skill mock: outputs

AI simulated by Sonnet (high effort), one call per merc, prompts verbatim in [prompts/](prompts/). 2026-10-21.

## (1) AI-generated (mechanics + name)

| merc | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| Atlas | Sword Slash: weakest front, heads · free | Wolfkin Cleave: two front foes, heads · cd 2 | Rattling Howl: any foe, 2+ heads skips its action · 2 mana | Leather Parry (from Swords): self +2 block, 2 rounds · cd 3 |
| Brann | Axe Chop: weakest front, heads · free | Shield Wall: self +2 block, 2 rounds · cd 3 | Taunting Bellow: foes target self 2 rounds · **1 mana** | Rune Strike: mark, +2 for 2 rounds · 2 mana |
| Hulda | Greatsword Swing: heads · free | Reckless Cleave: two front foes, heads +1 · cd 2 | Skull Splitter: any foe, **heads +3** · 1 use | Barroom Brawl (Brawling): self +2 block, 2 rounds · cd 3 |
| Mira | Staff Rap (from Fire-speech): heads · free | Ember Verse: any foe, heads +2 · 2 mana | Cinder Chorus: **every foe** loses 1 HP/round for 3 rounds · 1 use | Star Reading: mark, +1 for 2 rounds · cd 3 |
| Oswin | Mace Swing (from "mace", not a skill) · free | Lamp's Blessing: heal = heads · **1 mana** | Steadfast Prayer: **every ally** +2 block, 2 rounds · cd 3 | Herbal Poultice: heal 3 · 1 use |
| Sela | Longbow Shot: weakest front (not backline) · free | Piercing Volley: any foe, heads +2 · cd 2 | Silver Words: **every foe** 2+ heads skips its action · 2 mana | Cloak Dance (from Silver Tongue): self +2 block, 2 rounds · 1 use |

Lines: "Oswin apologizes sincerely, then swings anyway." · "Two foes, one swing, zero regrets." · "Wait, you have to hear this. They really do."

## (2) Fixed list

| merc | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| Atlas | Slash | Lunge | Riposte | Snarl |
| Brann | Chop | Cleave | Shield Wall | Expose |
| Hulda | Chop | Cleave | Crush | Charge |
| Mira | Bolt | Wave | Frost | Know the Beast |
| Oswin | Heal | Smite | Bless | Potion |
| Sela | Shot | Aimed Shot | Volley | Parley |

## (3) Fixed list + AI skin (flavor only)

| merc | skins (base) | sample line |
|---|---|---|
| Atlas | Gruff Slash (Slash) · Wolf Lunge (Lunge) · Bitten Back (Riposte) · Wolf-howl (Snarl) | "Hit him and the sword answers in kind." |
| Brann | Stubborn Hew (Chop) · Twin Hew (Cleave) · Brann's Bulwark (Shield Wall) · Rune-Read Weakness (Expose) | "He reads the runes, finds the flaw, and the axe follows." |
| Hulda | Hulda's Headsplitter (Chop) · Reckless Reap (Cleave) · Scale-Breaker (Crush) · Berserker Rush (Charge) | "Armor is just a suggestion when Hulda swings downward." |
| Mira | Ember Verse (Bolt) · Chapter of Cinders (Wave) · Footnote of Frost (Frost) · Bestiary Entry (Know the Beast) | "A cold citation lands, and the target forgets its next move." |
| Oswin | Lamplight Mending (Heal) · Gentle Rebuke (Smite) · Lamp's Favor (Bless) · Herbwife's Draught (Potion) | "A soft apology, then the mace lands. Undead take it twice as hard." |
| Sela | Curious Arrow (Shot) · Patient Longshot (Aimed Shot) · Cloakfall Volley (Volley) · Silver Question (Parley) | "One clever question, and the foe forgets why it was fighting." |

## Reading

- **(1) drifts.** 5 of 6 mercs got the same "+2 block for 2 rounds" skill; skills pulled from the wrong source (block from Silver Tongue, Leather Parry from Swords, a basic from "mace"); costs ignore who the merc is (a dwarf warrior's taunt costs mana); power swings (whole-party block, whole-enemy stun at 2 mana, heads +3). Every skill is unique, so the player never learns what a skill does across mercs.
- **(2) is clean and learnable** but every Heavy Weapons user reads the same: Brann and Hulda are both Chop / Cleave.
- **(3) keeps (2)'s rules and adds identity.** Brann's Cleave is "Twin Hew", Hulda's is "Reckless Reap"; Mira's whole kit reads as a scholar's. One slip: Atlas's Snarl was named "Wolf-howl", the same as his exact skill. Skins leaned on traits more than weapons (Hulda: "Reckless Reap", not "Great Cleave").
