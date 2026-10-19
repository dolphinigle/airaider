> 🗄 **ARCHIVED: PROTOTYPE v3 DOC.** Frozen 2026-10-19 (code: tag `v3-final`). This is **not v4 design and not law**. v4 is designed from scratch ([D-0002](../../decisions/D-0002-v4-restart-squad-first.md)). To reuse anything here, bring it in through a new v4 decision that cites this file. Words like "locked 🔒", "current", "canonical" or "v4" below belong to the v3 era. Catalog: [archive/README.md](../../archive/README.md).

# Player Preferences (AI flavor knobs)

**Status:** Draft (added during prototype/m0 refinement burst, 2026-05-30).
**Audience:** Engine + AI prompt designers.

## Why this exists

All flavor (prose, captive backstories, scenario narration, room descriptions, lead blurbs, captive titles) flows through the AI layer. Numbers (thresholds, gold, comfort, prestige) stay in the engine. To preserve player agency over the *experience* without giving them a number-tuning console, we expose a **player preferences** surface that the AI reads but the engine ignores.

## What a preference is

A **preference** is a structured, low-token hint added to every AI prompt's system message. It does not change any engine math. It changes only what the AI writes.

Conceptually:

```
Engine: "captive standing: infamous (mid), archetype = deserter, tags = [tough, mire-touched]"
Preferences: "tone = grimdark; writing = terse; npc gender bias = mostly-male"
AI: "Marek of the Hollow — a tough deserter with the bog still on him. 27, sullen, won't answer to his old name."
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
- `non-binary-leaning (post-prototype — no engine representation)`

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

- **Never affect engine numbers.** A `mostly-male` preference does not change a captive's standing tier. A `verbose` preference does not change resolution outcome. These are flavor-only.
- **Never gate content.** No "this preference unlocks legendary leads." Preferences are tone, not toggles.
- **Never become a moral filter.** Players who want bleak grimdark can have it; players who want low-fantasy can have that too. Don't refuse legitimate combinations.

## Company identity (planned) 🟡 *(designer, 2026-10-18)*

The story prompts write from the company's side, and the company is not a band of do-gooders: what drives it is gold and power. It takes a job for what the job pays, and may side with whoever pays more, keep what it was told to return, or sell a captive, as readily as do right. The designer's ruling: "player is not necessarily a do gooder. Player motivation is gold / power. So not always have to write in a do gooder perspective."

Planned: at the start of a game the player says what kind of company it is, as a short piece of **company lore** (who they are and what they live by: for example sellswords who work for any coin, deserters on the run, slavers, a free company with a code). It is lore, not an alignment setting. The engine feeds that line into the story prompts (arc, chapter, quest) so the sagas, the apparent reasons the company takes jobs and the choices offered fit that company. Until it exists, the prompts use the default above: grounded, gritty, a company out for gold and power.

## Open questions

- **Per-call overrides?** Could individual quests or rooms override tone for a single beat (e.g. a "carnival" lead is briefly pulp even in a grimdark fort)? Consider after the prototype.
- **Unlockable styles?** Should some cultural registers be locked behind 100-day fort-prestige milestones? Default no — feels gatekeepy.
- **Player-authored preference?** Free-form "describe your fort's vibe in 1 sentence" textarea, appended verbatim. Probably yes, post-prototype.

## Implementation note for the prototype

Prepend the preferences preamble to **every prose call** (v3: the narrator layer). Default values are fine for the prototype — no UI surface yet, just the plumbing. (Rewards are engine-generated, reward-FIRST; the AI proposes kind/label only — F6.)
