# Fixed battle-skill list (option 2, and the base for option 3)

Engine data. Each battle skill comes from one core skill. Pool = the core skill's coins + its first stat (docs/design/mercs.md). "free" = no cooldown, no mana (a basic attack).

| core | battle skill | effect |
|---|---|---|
| Heavy Weapons | **Chop** | strike the weakest front foe; heads = damage · free |
| | **Cleave** | strike the two weakest front foes with one flip · cd 2 |
| | **Crush** | strike ignoring armor · cd 2 |
| Light Weapons | **Slash** | strike · free |
| | **Lunge** | strike with +2 coins · cd 2 |
| | **Riposte** | for 1 round, each foe that hits you takes your heads back · cd 3 |
| Ranged | **Shot** | strike any foe (backline first) · free |
| | **Aimed Shot** | Shot with +2 coins · cd 2 |
| | **Volley** | every foe takes heads − 2 · cd 3 |
| Defense | **Shield Wall** | foes must target you for 2 rounds; +2 block coins · cd 3 |
| | **Brace** | +3 block coins this round · cd 1 |
| Athletics | **Charge** | strike with +1 coin; acts first next round · cd 3 |
| | **Dodge** | the next hit on you does nothing · cd 3 |
| Warfare | **Battle Orders** | party +1 coin for 2 rounds · cd 4 |
| Survival | **Second Wind** | heal self by heads, below 50% only · once |
| Awareness | **Spot** | round 1: foes lose their first action · once |
| Beasts | **Call the Hound** | a hound joins for 3 rounds (strike, 2 coins) · once |
| Stealth | **Ambush** | round 1 only: strike with +3 coins |
| Roguery | **Poison Blade** | strike; the target loses 1 HP each round for 3 rounds · cd 3 |
| Villainy | **Dirty Trick** | 2+ heads: the target skips its next action · cd 3 |
| Persuasion | **Parley** | heads ≥ foe HP: a non-boss foe stops fighting · cd 3 |
| Deception | **Feint** | the next ally strike on that foe gets +2 coins · cd 2 |
| Intimidation | **Snarl** | heads ≥ HP of the weakest foe: it flees · cd 3 |
| Leadership | **Rally** | every ally heals 1; clears fear · cd 3 |
| Performance | **War Song** | every ally heals 1 at the end of the next 2 rounds · cd 4 |
| Arcane Lore | **Expose** | 2+ heads: mark a foe; hits on it +1 (undead or monster +2) for 2 rounds · cd 3 |
| Science Lore | **Know the Beast** | 2+ heads: mark a beast; hits on it +2 for 2 rounds · cd 3 |
| Alchemy | **Potion** | heal an ally 4 · 2 uses |
| | **Bomb** | every foe takes 2 · 1 use |
| Craft | **Firepot** | every front foe takes heads − 1 · 1 use |
| Elemental Magic | **Bolt** | strike any foe · 1 mana |
| | **Wave** | every foe takes heads − 1 · 3 mana |
| | **Frost** | 2+ heads: the target skips its next action · 2 mana |
| Holy Magic | **Heal** | heal the most hurt ally by heads · 2 mana |
| | **Smite** | strike any foe; double vs undead · 1 mana |
| | **Bless** | party +1 coin for 2 rounds · 3 mana |
| | **Ward** | one ally takes no damage for 1 round · 2 mana |
| Dark Magic | **Drain** | strike; heal self by the damage · 2 mana |
| | **Curse** | the target deals 1 less damage for 3 rounds · 2 mana |

Bargaining, Streetwise and Civilization Lore have no battle skill (quests and base only).
