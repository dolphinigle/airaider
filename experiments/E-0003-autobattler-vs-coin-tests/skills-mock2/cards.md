# Mock 2 cards

Base skill + AI-picked modifiers + AI name (Sonnet high, one call per merc). The engine computes the card from the picks.

## Variant a: AI picks from every fitting modifier

**Atlas**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Wolf Cut** | Strike + Swift + Sundering | Deal 3 PHYSICAL to one frontline enemy; you act first this round; ignores 1 armor | 3 STA · 0 MANA |
| **Alpha Pounce** | Lunge + Heavy + Swift | Deal 5 PHYSICAL to one frontline enemy; +2 damage; you act first this round | 4 STA · 0 MANA |
| **Stubborn Parry** | Riposte + Guarding + Lasting | For 1 round, deal 2 PHYSICAL back to each enemy that hits you; you take 1 less damage next round; the effect lasts 1 round longer | 3 STA · 1 MANA |
| **Pack Howl** | Snarl + Swift + Rallying | One enemy with 4 HP or less flees; you act first this round; an ally next to you heals 1 | 4 STA · 0 MANA |

**Brann**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Axe Breaker** | Strike + Heavy + Sundering | Deal 3 PHYSICAL to one frontline enemy; +2 damage; ignores 1 armor | 3 STA · 0 MANA |
| **Stubborn Sweep** | Cleave + Heavy + Guarding | Deal 3 PHYSICAL to all frontline enemies; +2 damage; you take 1 less damage next round | 5 STA · 0 MANA |
| **Immovable Rampart** | Shield Wall + Lasting | You and allies behind you take 2 less damage for 2 rounds; enemies must target you; the effect lasts 1 round longer | 3 STA · 1 MANA |
| **Runic Opening** | Expose + Guarding | One enemy takes 2 more from every hit for 2 rounds; you take 1 less damage next round | 2 STA · 0 MANA |

**Hulda**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Reckless Hew** | Strike + Heavy + Swift | Deal 3 PHYSICAL to one frontline enemy; +2 damage; you act first this round | 3 STA · 0 MANA |
| **Rending Sweep** | Cleave + Heavy + Sundering | Deal 3 PHYSICAL to all frontline enemies; +2 damage; ignores 1 armor | 5 STA · 0 MANA |
| **Skull Cracker** | Crush + Stunning + Heavy | Deal 4 PHYSICAL to one frontline enemy, ignoring armor; if it deals 3+, the target skips its next action; +2 damage | 6 STA · 0 MANA |
| **Trampling Rush** | Charge + Heavy + Wide | Deal 3 PHYSICAL to one frontline enemy; act first next round; +2 damage; also hits one enemy next to the target | 5 STA · 0 MANA |

**Mira**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Spoken Flame** | Bolt + Fiery | Deal 3 FIRE to any enemy; +1 FIRE damage | 0 STA · 2 MANA |
| **Rapid Recitation** | Wave + Fiery + Swift | Deal 2 FIRE to all enemies; +1 FIRE damage; you act first this round | 1 STA · 4 MANA |
| **Charted Beast** | Know the Beast + Lasting | One beast takes 2 more from every hit for 2 rounds; the effect lasts 1 round longer | 1 STA · 1 MANA |
| **Staff Thump** | Strike + Heavy + Guarding | Deal 3 PHYSICAL to one frontline enemy; +2 damage; you take 1 less damage next round | 3 STA · 0 MANA |

**Oswin**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Lamp Blessing** | Heal + Generous + Guarding | Restore 4 HP to one ally; also affects one more ally; you take 1 less damage next round | 1 STA · 4 MANA |
| **Lamp Flare** | Smite + Fiery + Holy | Deal 3 HOLY to any enemy; +1 FIRE damage; +1 HOLY damage; double vs undead | 0 STA · 3 MANA |
| **Herbal Draught** | Potion + Generous | Restore 3 HP to one ally; 2 uses; also affects one more ally | 1 STA · 2 MANA |
| **Mace Knock** | Strike + Heavy + Stunning | Deal 3 PHYSICAL to one frontline enemy; +2 damage; if it deals 3+, the target skips its next action | 4 STA · 0 MANA |

**Sela**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Needle Snap** | Shot + Swift + Sundering | Deal 3 PHYSICAL to any enemy; you act first this round; ignores 1 armor | 3 STA · 0 MANA |
| **Cloaked Volley** | Volley + Guarding | Deal 2 PHYSICAL to all backline enemies; you take 1 less damage next round | 4 STA · 0 MANA |
| **Threaded Arrow** | Pierce + Sundering | Deal 3 PHYSICAL to one column (front and back enemy); ignores 1 armor | 3 STA · 0 MANA |
| **Silver Truce** | Parley + Lasting | One non-boss enemy stops fighting for 2 rounds; the effect lasts 1 round longer | 1 STA · 1 MANA |

## Variant b: engine deals 3 candidates (weighted by the merc's skills), AI picks

**Atlas**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Quick Slash** | Strike + Thrifty | Deal 3 PHYSICAL to one frontline enemy; costs 1 less (STA or MANA) | 0 STA · 0 MANA |
| **Armor-Rending Lunge** | Lunge + Sundering | Deal 5 PHYSICAL to one frontline enemy; ignores 1 armor | 3 STA · 0 MANA |
| **Gruff Guard** | Riposte + Guarding | For 1 round, deal 2 PHYSICAL back to each enemy that hits you; you take 1 less damage next round | 3 STA · 0 MANA |
| **Wolf-Howl** | Snarl + Icy | One enemy with 4 HP or less flees; the target acts last next round | 2 STA · 1 MANA |

**Brann**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Axe Fall** | Strike + Heavy | Deal 3 PHYSICAL to one frontline enemy; +2 damage | 2 STA · 0 MANA |
| **Hewing Sweep** | Cleave + Sundering + Heavy | Deal 3 PHYSICAL to all frontline enemies; ignores 1 armor; +2 damage | 5 STA · 0 MANA |
| **Stubborn Bulwark** | Shield Wall + Rallying + Lasting | You and allies behind you take 2 less damage for 2 rounds; enemies must target you; an ally next to you heals 1; the effect lasts 1 round longer | 4 STA · 1 MANA |
| **Runic Mark** | Expose + Lasting | One enemy takes 2 more from every hit for 2 rounds; the effect lasts 1 round longer | 1 STA · 1 MANA |

**Hulda**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Reckless Hew** | Strike + Heavy | Deal 3 PHYSICAL to one frontline enemy; +2 damage | 2 STA · 0 MANA |
| **Skull Sweep** | Cleave + Stunning | Deal 3 PHYSICAL to all frontline enemies; if it deals 3+, the target skips its next action | 5 STA · 0 MANA |
| **Timber Fall** | Crush + Wide + Stunning | Deal 4 PHYSICAL to one frontline enemy, ignoring armor; also hits one enemy next to the target; if it deals 3+, the target skips its next action | 7 STA · 0 MANA |
| **Bullrush** | Charge + Sundering | Deal 3 PHYSICAL to one frontline enemy; act first next round; ignores 1 armor | 3 STA · 0 MANA |

**Mira**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Fire-Speech Bolt** | Bolt + Fiery | Deal 3 FIRE to any enemy; +1 FIRE damage | 0 STA · 2 MANA |
| **Scorching Recital** | Wave + Fiery | Deal 2 FIRE to all enemies; +1 FIRE damage | 0 STA · 4 MANA |
| **Star-Chart Bestiary** | Know the Beast + Lasting | One beast takes 2 more from every hit for 2 rounds; the effect lasts 1 round longer | 1 STA · 1 MANA |
| **Staff Slam** | Strike + Heavy | Deal 3 PHYSICAL to one frontline enemy; +2 damage | 2 STA · 0 MANA |

**Oswin**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Lamp's Embrace** | Heal + Generous | Restore 4 HP to one ally; also affects one more ally | 0 STA · 4 MANA |
| **Lamplight Judgment** | Smite + Heavy | Deal 3 HOLY to any enemy; +2 damage | 1 STA · 1 MANA |
| **Herbal Ward** | Potion + Guarding | Restore 3 HP to one ally; 2 uses; you take 1 less damage next round | 2 STA · 0 MANA |
| **Blessed Mace** | Strike + Holy | Deal 3 PHYSICAL to one frontline enemy; +1 HOLY damage; double vs undead | 1 STA · 1 MANA |

**Sela**

| name | base + mods | effect | cost |
|---|---|---|---|
| **Splitting Arrow** | Shot + Wide | Deal 3 PHYSICAL to any enemy; also hits one enemy next to the target | 3 STA · 0 MANA |
| **Cloaked Volley** | Volley + Guarding | Deal 2 PHYSICAL to all backline enemies; you take 1 less damage next round | 4 STA · 0 MANA |
| **Armor-Piercing Shaft** | Pierce + Sundering | Deal 3 PHYSICAL to one column (front and back enemy); ignores 1 armor | 3 STA · 0 MANA |
| **Honeyed Truce** | Parley + Lasting | One non-boss enemy stops fighting for 2 rounds; the effect lasts 1 round longer | 1 STA · 1 MANA |

## Modifier counts

- a: Heavy 9, Swift 6, Guarding 6, Sundering 5, Lasting 4, Fiery 3, Stunning 2, Generous 2, Rallying 1, Wide 1, Holy 1
- b: Heavy 5, Sundering 4, Lasting 4, Guarding 3, Stunning 2, Wide 2, Fiery 2, Thrifty 1, Icy 1, Rallying 1, Generous 1, Holy 1
