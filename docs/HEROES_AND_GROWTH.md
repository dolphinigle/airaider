# Heroes and Growth

**Status:** Draft

The central failure of AI Stronghold's hero system: a hero was a name attached to a stat block, and stats determined missions automatically. The player never *did* anything with the hero, so the hero never *meant* anything. AI Raider's hero design is built around fixing that.

## Design goals

1. **A hero is a character.** They have a name, a trait set, a personality hook (AI-generated backstory), and a unique constellation of abilities. They are not "a Warrior".
2. **A hero accumulates a story through play.** Scars, traumas, signature ability picks, relationships — all earned during raids the player ran with them.
3. **Two heroes of the same archetype play differently.** Achieved through ability picks, traits, scars, gear, and personality reactions, not just attribute deltas.
4. **Losing a hero hurts.** Permadeath is on the table. A hero you raised over 20 raids is hard to replace, not because the stats are gone but because the *history* is gone.

## Hero data model (Draft)

```
Hero {
  thingId, type='hero', name

  # Identity (set at creation, mostly immutable)
  traits: [Trait]                # static tags: brave, cunning, fire_affinity
  personality: AIModel           # AI-generated backstory + voice
  starting_class: ClassId        # determines starting abilities

  # Growth (changes through play)
  level: int
  xp: int
  ability_loadout: [AbilityId]   # current chosen abilities
  ability_pool: [AbilityId]      # all unlocked abilities (grows with play)
  scars: [Scar]                  # persistent traits earned in raids
  trauma: TraumaState | null     # current psychological state
  wounds: [Wound]                # long-term injuries, healable

  # Inventory
  equipped: [ArtifactId]         # gear slots

  # State
  status: 'available' | 'on_raid' | 'wounded' | 'traumatized' | 'dead'

  # Relationships (built through play)
  relationships: { heroId -> RelationshipState }

  # Provenance (the hero's story, for the trophy case)
  history: [HistoryEntry]        # auto-generated: "Survived the Burned Crypt", "Lost Mira on the Dock"
}
```

The `history` field is important. It is the hero's *story*, written by the game engine from events. The fort's hero screen displays it. This is how a hero becomes a character the player cares about — by literally showing them their shared history.

## Trait system (inherited)

Same as AI Stronghold: traits are tags, no numeric value. Used for:

- **Fort compatibility** (a `scholarly` hero who is also a follower contributes to a Library themed room).
- **Raid eligibility / branching** (a raid choice node may require `cunning` to attempt a stealth bypass).
- **Ability availability** (some abilities require traits to unlock).
- **AI flavoring** (the AI uses traits to write personality-consistent epilogues).

## Attribute system (kept but de-emphasized)

Attributes (STR, INT, DEX, etc.) still exist but their role shrinks. In AI Stronghold attributes basically *were* the mission. In AI Raider attributes are tuning knobs for:

- Base ability scaling (a strong hero swings harder, but the *choice* of when to swing is the player's).
- Trait check thresholds for branching nodes ("requires STR ≥ 12 to break the door").
- Equipment requirements.

Attributes alone should not determine a raid outcome.

## Abilities

Abilities are the primary expression of who a hero is mechanically. Each hero has:

- A small **active loadout** (proposed: 3–4 abilities equipped at a time).
- A larger **pool** of unlocked abilities, expanded through level-up, scars, raid events, and gear.

Abilities have flavors (fire, frost, holy, brutal, cunning, etc.) which interact with raid biome themes and enemy resistances. This gives party composition a real puzzle: do I bring a fire-heavy party into the ice cavern (bad) or do I bring my one frost hero who is also half-broken (risky)?

Ability picks should be **frequent and reversible** at the fort, but **locked during a raid**. The player commits to a loadout when they launch.

## Scars (new)

A scar is a permanent trait acquired during a raid in response to a specific event. Examples:

- "Burned" — took heavy fire damage and survived. -1 fire resist forever; +1 damage with fire abilities. (Trauma into power.)
- "Lone Survivor" — was the last alive in a raid that ended in extraction. +1 to all checks when alone in a node.
- "Crypt-Walker" — survived a death-themed raid intact. Immune to fear in death-themed raids.

Scars give heroes **mechanical individuality earned from play**, which is the design goal. A scarred hero is meaningfully *different* from an unscarred copy of the same hero, in ways the player *remembers earning*.

Scars are mostly mixed (have a downside and an upside). Pure-positive scars exist but are rare.

## Traumas (new)

A trauma is a *temporary* mental state acquired from a bad raid event. Unlike scars, traumas are healable at the fort (specific rooms — Chapel, Apothecary, Tavern — clear specific traumas). While traumatized, a hero has modifiers in raids (worse stress accumulation, may panic, may refuse certain encounters).

Traumas exist to make wipes hurt without being fatal. A near-wipe sends three heroes home traumatized; the player must decide whether to push another raid with a depleted roster or spend fort resources healing.

## Death

Death is on the table. When and how depends on raid design:

- **Always-on permadeath:** hardcore mode. Default for veteran players.
- **Default mode:** a downed hero in a successful raid is wounded (long heal). A downed hero in a wipe is dead unless rescued.
- **Mercy mode:** dying heroes are merely retired. (Probably an accessibility option.)

When a hero dies, their `history` should be displayable as a kind of obituary in the fort — a small "Hall of Fallen" room, perhaps. This converts loss into a fort trophy, which is on-pillar.

## Recruitment

New heroes come from:

1. **Raid rewards** — rescued, recruited, or unlocked through completing certain leads. AI-generated personality and traits.
2. **Fort attractors** — high-prestige forts attract higher-tier hero candidates (mirrors AI Stronghold's follower attractor logic).
3. **Story-gated** — certain story arcs introduce specific heroes as fixed characters.

New heroes start at level 1 (or near the player's current floor, TBD — see Open Questions). They have no scars and no history. The player has to *raid with them* to make them characters.

## Relationship to followers

A follower and a hero are distinct kinds of unit, as in AI Stronghold:

- **Follower:** lives in a room, provides prestige, never (or rarely) goes on raids.
- **Hero:** goes on raids, can be equipped, has the full growth model.

A follower may be promoted to a hero through a story event (rare). A hero may semi-retire to a room (gives prestige based on their full history and gear; trades away their raid availability). The latter is a meaningful late-game choice and an emotional one.
