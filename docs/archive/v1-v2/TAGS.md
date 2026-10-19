> **⚠ SUPERSEDED / ARCHIVED (2026-07-02).** Kept for history. The tag system (20-tier, 4 bands, groups W1–W18) lives in GENERATION_FLOW.md §8–§9b; unit generation in §10 + ECONOMY.md §4; the bible design in QUEST_BIBLE.md.

# Tag Vocabulary

**Status:** Canonical starter vocabulary (prototype-2, 2026-06-04). The fixed list of tags the engine rolls and the AI references (**never invents**). The model + roll are in [CARDS.md](CARDS.md); pricing/tiers in [ECONOMY.md](ECONOMY.md). This is the source of truth the prototype loads.

## Principle
**The AI picks *presence/direction* (which tags); the engine scales *magnitude* (the tier).** A background has no magnitude → it's flat. A muscle/skill/fame level *is* a magnitude → tiered, and the engine sets the tier from the unit's value budget; the bio is fleshed *after*, so prose always matches the tier.

**Rank/standing is composition, not a tier:** `bg` + `notoriety`. A *famous soldier* = a general; an *infamous criminal* = a crime-lord; a *famous priest* = a high-priest. One generic notoriety axis gives every profession its standing — no per-background rank tables.

---

## Flat tags (binary — AI picks present/absent; no tier)

| group | mutex | tags | rarity |
|---|---|---|---|
| **gender** | yes | `male` `female` | common |
| **race** | yes | `human` `wolfman` `elf` `lizardman` | all common |
| **personality** *(must be observable from speech/manner)* | per **pair** | `brave`/`cowardly` · `honest`/`deceitful` · `kind`/`cruel` · `humble`/`proud` · `generous`/`greedy` · `calm`/`wrathful` · `gregarious`/`aloof` · `cheerful`/`gloomy` | common |
| **background** *(generic professions/origins)* | yes | `soldier` `hunter` `peasant` `sailor` `criminal` `merchant` `healer` `artisan` `wanderer` `scholar` `priest` `noble` · `slave` `beggar` *(negatives)* | common→uncommon |

## Tiered tags (AI picks the id/direction; engine sets the tier from value)

| group | mutex | tags | tier = | rarity |
|---|---|---|---|---|
| **physical** | per **pair** | `muscular`/`frail` · `beautiful`/`ugly` · `clever`/`slow-witted` · `tough`/`sickly` · `scarred` *(flat)* | intensity (Toned→Herculean, …) | common→rare |
| **skill** *(the rare loot)* | no (stack) | `weapon` `stealth` `lore` `heal` `beast` `craft` `food` `song` · `magic-fire` `magic-earth` `magic-water` `magic-air` · `magic-dark` | mastery (Apprentice→Master) | rare; magic extremely rare; `magic-dark` legendary |
| **notoriety** *(standing / flat value-adder)* | yes | `famous`/`infamous` | renown (Known→Legendary) | uncommon→legendary |

**Glosses** (the ambiguous/fuzzy-scope few — everything else is self-describing): `skill:food`=cooking/foraging/provisioning · `skill:lore`=books/history/secrets · `skill:beast`=taming/handling animals · `phys:tough`=resilient, hard to kill · `phys:clever`/`slow-witted`=mental sharpness.

---

## The prompt vocab block (grouped bare suffixes — validated ~18% cheaper)
Paste this into any system prompt whose output references tags. The AI returns the **bare word**; the parser **re-attaches the prefix** by group (suffixes are globally unique). The grouping also signals **mutex** (one per group, except `skill`/`physical`-singletons).

```
gender: male female
race: human wolfman elf lizardman
personality: brave cowardly honest deceitful kind cruel humble proud generous greedy calm wrathful gregarious aloof cheerful gloomy
background: soldier hunter peasant sailor criminal merchant healer artisan wanderer scholar priest noble slave beggar
physical: muscular frail beautiful ugly clever slow-witted tough sickly scarred
skill: weapon stealth lore heal beast craft food song magic-fire magic-earth magic-water magic-air magic-dark
notoriety: famous infamous
```

**Parser contract** (required regardless of prompt format): strip any prefix, lowercase, map suffix→canonical id, **reject unknowns**. This is what makes the cheap bare-suffix format safe and keeps the AI from ever introducing an off-vocabulary tag.

---

🟡 This is the *starter* vocabulary — the model is built to extend (more bgs, skills, personality pairs as content grows). ~58 tags is enough to prove the loop.
