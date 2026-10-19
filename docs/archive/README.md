# Archive: prototype v1–v3 docs

🗄 **Frozen. Not v4 design. Not law.** v4 is designed from scratch ([D-0002](../decisions/D-0002-v4-restart-squad-first.md)). Every file in here carries an ARCHIVED banner. Words inside them like "locked 🔒", "canonical", "current" or even "v4" (the v3 storyteller rebuild was called "v4") belong to their own era.

## Grabbing something for v4

Design v4 first. Then come here for parts:

1. Find the idea in the catalog below.
2. Bring it in through a **new v4 decision** (`node tools/rec.mjs decision "…"`). Restate the idea in v4 terms and cite the file in `sources:`, e.g. `sources: [archive/v3/ECONOMY.md §3]`.
3. Never edit an archived file, and never link to one from `docs/design/` as if it were the spec. The v4 decision is the spec.

## v3 catalog (2026-06 → 2026-10, code at tag `v3-final`, playable at `../airaider-v3`)

| Topic | Files | What's in it |
|---|---|---|
| Vision | [VISION](v3/VISION.md), [DESIGN](v3/DESIGN.md) | the character-collection fort game; the fort → resolution cycle, two boards, risk and loss |
| Units, stats, the roll | [CARDS](v3/CARDS.md) | everything is a card; tags, 5 attributes, growth/focus, the `overlap()` roll |
| Economy | [ECONOMY](v3/ECONOMY.md), [REWARD_BANK](v3/REWARD_BANK.md) | value curve, `V_base(level)`, reward generation, outcomes, the injury channel |
| Base | [FORT](v3/FORT.md), [GAME_STATE](v3/GAME_STATE.md) | grid, rooms, comfort and prestige, captive labor, pacing sims; the save and progression |
| Quests | [QUESTS](v3/QUESTS.md), [GENERATION_FLOW](v3/GENERATION_FLOW.md) | lead → quest → resolution → reward → chain; **the v3 decision log §1–§23** (tags, the roll, injury, regions, lore, rooms, prestige math) |
| Story / AI writing | [STORY_ENGINE](v3/STORY_ENGINE.md), [STORYTELLER](v3/STORYTELLER.md), [STORY_PROMPTS](v3/STORY_PROMPTS.md), [BIBLE](v3/BIBLE.md), [QUEST_BIBLE](v3/QUEST_BIBLE.md), [RECURRING_CAST](v3/RECURRING_CAST.md), [LORE](v3/LORE.md) | the hidden bible, casting, chapter/saga storyteller, the last prompt texts and examples (§S), the lore graph |
| Writing quality | [PROMPT_RULES](v3/PROMPT_RULES.md), [PROSE_METHOD](v3/PROSE_METHOD.md), [CARD_GOLD_STANDARD](v3/CARD_GOLD_STANDARD.md), [WRITING_CHECKPOINT](v3/WRITING_CHECKPOINT.md), [REFERENCE_CHARACTER_INTROS](v3/REFERENCE_CHARACTER_INTROS.md) | prompt-craft rules for cheap models, the blind-judging method and its traps, Sultan's Game samples |
| AI provider | [AI_PROVIDER](v3/AI_PROVIDER.md), [PROMPTS](v3/PROMPTS.md) | model tiers, structured output, the free `claude -p` playtest transport |
| UI and pacing | [UI](v3/UI.md), [QUEST_SCREEN](v3/QUEST_SCREEN.md), [TEMPO](v3/TEMPO.md), [PLAYER_PREFERENCES](v3/PLAYER_PREFERENCES.md), [proto/muster.html](v3/proto/muster.html) | the Sultan-style table GUI, async/latency goals, flavor knobs |
| Playtesting | [DOGFOODING](v3/DOGFOODING.md), [skills/playtest](v3/skills/playtest.md), [PLAYTEST_NOTES](v3/PLAYTEST_NOTES.md), [PLAYTEST_2026-06-11](v3/PLAYTEST_2026-06-11.md) | text-UI parity, read-the-prose playtests |
| Build and session logs | [PLAN](v3/PLAN.md), [IMPL_NOTES](v3/IMPL_NOTES.md), [SESSION_2026-08-28](v3/SESSION_2026-08-28.md), [SESSION_2026-09-25](v3/SESSION_2026-09-25.md), [EXPERIMENT_bible_feel](v3/EXPERIMENT_bible_feel.md), [STORY_GEN_STATE](v3/STORY_GEN_STATE.md) | implementation plan, impl rulings and knobs, session records |
| Original index | [v3/README](v3/README.md) | v3's own reading order |

`v3/STORY_QUALITY.md` is the storyteller lab history (synopsis, picker, example and judge rounds). It is gitignored by the designer's rule and exists only on this machine.

## v1–v2 (code at tag `v2-final`)

`v1-v2/legacy/`: the AI-Stronghold remake and the v1 story-chain prototype (raids, heroes, sagas, quest chains). `v1-v2/*.md`: early v2 tag and unit drafts.

## Tags

Besides `v2-final` and `v3-final`: `archive/docs-*` hold three abandoned May 2026 doc branches. Others (`fun-checkpoint-2026-08-26`, `storyteller-*`, `writing-locked-*`, …) are v3 checkpoints.
