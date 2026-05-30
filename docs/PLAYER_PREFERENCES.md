# Player Preferences (AI flavor knobs)

**Status:** Draft (added during prototype/m0 refinement burst, 2026-05-30).
**Audience:** Engine + AI prompt designers.

## Why this exists

All flavor (names, prose, captive backstories, scenario narration, room descriptions, lead blurbs, captive titles) flows through the AI layer. Numbers (DC, gold, fatigue, capacity, prestige) stay in the engine. To preserve player agency over the *experience* without giving them a number-tuning console, we expose a **player preferences** surface that the AI reads but the engine ignores.

## What a preference is

A **preference** is a structured, low-token hint added to every AI prompt's system message. It does not change any engine math. It changes only what the AI writes.

Conceptually:

```
Engine: "captive notoriety = 3, archetype = deserter, tags = [scarred, mire-touched]"
Preferences: "tone = grimdark; writing = terse; npc gender bias = mostly-male"
AI: "Marek of the Hollow — a scarred deserter with the bog still on him. 27, sullen, won't answer to his old name."
```

## Initial preference categories

These four are the must-have axes for the prototype. Add more only when a clear gameplay reason appears.

### 1. Tone
What feel should every prose snippet have?

- `grimdark` (default) — bleak, mud-and-blood, no glory
- `dark-fantasy` — gothic, cursed, supernatural undercurrent
- `low-fantasy` — grounded, mostly mundane, magic is rumor
- `pulp` — over-the-top heroics, lurid villains
- `bleak-realism` — historical-ish, no magic at all

### 2. Writing style
How should the prose itself read?

- `terse` (default) — 4-6 sentence outcomes, plain syntax
- `lyrical` — longer sentences, sensory language
- `clipped` — fragments, very short paragraphs
- `verbose` — paragraphs with subordinate clauses

### 3. NPC gender bias
Who are the captives, mercenaries, villains?

- `balanced` (default) — roughly 50/50
- `mostly-male`
- `mostly-female`
- `all-male`
- `all-female`
- `non-binary-leaning`

### 4. Cultural register
What naming/cultural feel should NPCs and places have?

- `pan-european` (default) — Germanic + Celtic + Slavic mix, prototype's current vibe
- `nordic`
- `byzantine` (Mediterranean / late antiquity)
- `silk-road` (Central Asian / Persian)
- `west-african`
- `mesoamerican`
- `mixed-ahistorical` — anything goes

## Where preferences live

```
roster.preferences: {
  tone: 'grimdark',
  writingStyle: 'terse',
  npcGenderBias: 'balanced',
  culturalRegister: 'pan-european',
}
```

Default to the values above for any roster missing a preferences block (back-compat).

## How preferences flow into the AI

Every AI prompt (lean LLM, captive-tag rolls, raid-narrate, future flavor calls) prepends a small preferences preamble to the system message:

```
PLAYER PREFERENCES:
- tone: grimdark
- writing: terse (4-6 sentence outcomes max)
- NPC gender: balanced
- cultural register: pan-european
```

This costs ~30 tokens and is paid once per AI call. Acceptable.

## What preferences must NOT do

- **Never affect engine numbers.** A `mostly-male` preference does not change captive notoriety. A `verbose` preference does not change resolution outcome. These are flavor-only.
- **Never gate content.** No "this preference unlocks legendary leads." Preferences are tone, not toggles.
- **Never become a moral filter.** Players who want bleak grimdark can have it; players who want low-fantasy can have that too. Don't refuse legitimate combinations.

## Open questions

- **Per-call overrides?** Could individual quests or rooms override tone for a single beat (e.g. a "carnival" lead is briefly pulp even in a grimdark fort)? Consider after the prototype.
- **Unlockable styles?** Should some cultural registers be locked behind 100-day fort-prestige milestones? Default no — feels gatekeepy.
- **Player-authored preference?** Free-form "describe your fort's vibe in 1 sentence" textarea, appended verbatim. Probably yes, post-prototype.

## Implementation note for the prototype

Stage E (AI-determined rewards) introduces the first AI call that should respect preferences. **When implementing Stage E, plumb the preferences preamble through `LeanOpenAIScenarioLLM.narrate()` so it's available everywhere the AI writes prose.** Default values are fine for the prototype — no UI surface for preferences yet, just the engine plumbing.
