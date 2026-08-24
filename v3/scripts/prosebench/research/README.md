# Quest-prose research corpus — data catalogue

**What this is.** Verbatim reference text and published craft guidance for a specific writing form:
short quest/event prose attached to a game mechanic — a card of roughly 15–60 words that a player
reads before committing characters to it, and a result of roughly 20–55 words read after dice
resolve it. Gathered 2026-08-24 for the airaider v3 one-off card and resolution prompts.

**Nothing in this folder is an opinion or a recommendation.** Interpretation lives one level up in
`../GUIDELINE.md`. This folder is the evidence that document is built on. If you disagree with the
guideline, re-derive from these files.

---

## Files

### Raw sample corpora (verbatim game text)

| file | size | contents | provenance |
|---|---|---|---|
| `samples_sultans.md` | 362 KB | PART 1: 216 official-English in-game passages across 98 quests. PART 2: 738 official-English card/item/character blurbs. PART 3: 10 complete rite records (intro + every slot line + every settlement branch, success and failure, with the dice condition selecting each) — **Chinese verbatim with an agent's own literal English translation, marked as such**. PART 4: 43 random-event intros. | PARTS 1–2 `sultansgame.wiki.gg` via `api.php` (`{{quote}}` templates and infobox `Description=` fields). PART 3 `github.com/liwenhao0427/sultans-game-config` (`rite/<id>.json`). PART 4 Steam guide `3464000283`. |
| `samples_kodp_sixages.md` | 80 KB | 85 events (42 King of Dragon Pass, 43 Six Ages), 125 verbatim blockquote passages, 24 with outcome prose. Engine slots (`<X>`, `<treasure>`, `<Ring Member>`) preserved. | `kingofdragonpass.fandom.com` (489 `Category:Events` pages swept) and `sixages.fandom.com` (914 swept), via MediaWiki API; `{{Quote}}` bodies extracted programmatically, markup stripped without rewording. |
| `samples_mercenary_games.md` | 112 KB | 49 samples / 152 quoted pieces. Battle Brothers contract hooks, negotiation and `Success*`/`Failure*` screens, ambient camp events. Fort of Chains quests as full Twee passages with the four-grade `Crit`/`Success`/`Failure`/`Disaster` structure. Wildermyth `.properties` files. A separately-labelled CK3 section. **33 failure and 6 disaster texts.** | Battle Brothers: `github.com/kovasap/battle-bros-decompiled` (decompiled vanilla `.nut`). Fort of Chains: `github.com/Official-Husko/fork-of-chains`. Wildermyth: shipped English `.properties` vendored in `github.com/adenzu/Wildermyth-Turkish`. CK3: the **VIET Events mod**, not vanilla. |
| `reference_failbetter.md` | 99 KB | PART A: the three official Fallen London Writer Guidelines posts plus the rest of Failbetter's published craft canon. PART B: 36 storylet sections / 61 branches as Root / Branch / Success / Failure, each word-counted; only samples with zero elision markers were kept. | `failbettergames.com/news/*`; `fallenlondon.wiki` API; Sunless Sea / Sunless Skies Fandom wikis. |
| `craft_literature.md` | 68 KB | ~29 sources of published craft guidance, rules quoted with URLs, plus a section listing advice stated independently by two or more practitioners. | Failbetter, inkle (Jon Ingold), Emily Short, Choice of Games, Mawhorter/Short, CCG flavour-text guidance, IF craft writing. |

### Derived analysis (measurements and cross-checks made from the corpora above)

| file | contents |
|---|---|
| `anatomy_sultan_ground_truth.md` | Word / sentence / words-per-sentence measurements of the four designer-supplied Sultan quests (the reference the guideline is audited against). |
| `functional_anatomy.md` | Sentence-by-sentence function of those four quests; feasibility check of naming prizes against the engine's `rewardSpecs`. |
| `crosscheck_measurements.md` | Length distributions across all four corpora, side by side, with points of convergence and divergence. |
| `crosscheck_kodp.md` | Opening-subject analysis (105/125 animate subjects in the first seven words); the "incursion" framing; outcome register. |
| `crosscheck_failure.md` | Failure-prose measurements and register across Fallen London, Battle Brothers, Fort of Chains, KoDP; the graded failure/disaster structure. |
| `crosscheck_rite_structure.md` | How a Sultan's rite is assembled from its shipped config: slot lines, per-check success/failure pairs, named assigned characters as actors. |
| `GUIDELINE_DRAFT_v0.md` | The first draft, written from the four designer samples ALONE before the corpora arrived. Kept so its claims can be compared against what the corpora later confirmed or falsified. Superseded by `../GUIDELINE.md`. |

### Audits
`AUDIT_sultans.md`, `AUDIT_games.md`, `AUDIT_craft.md` — adversarial fidelity audits commissioned
after collection: independent agents re-fetched sampled quotes from their cited sources and checked
them character-for-character, checked attribution, counts, and dead links. **Read the relevant audit
before relying on any file.**

---

## How to read the corpora

- Everything inside a `>` blockquote is intended to be verbatim source text.
- Text outside blockquotes is wiki-editor context, agent labelling, or provenance — not game text.
  `samples_kodp_sixages.md` marks editor paraphrase inline as `_[wiki context: ...]_`.
- Engine template slots are preserved deliberately and are part of the data:
  `<X>`, `<treasure>`, `<number>`, `<specific illness>` (KoDP/Six Ages) · `[s2.name]`,
  `[s4.gender]` (Sultan's) · `%employer%`, `%randombrother%`, `<site>` (Battle Brothers, Wildermyth).
- **Translation discipline**: PART 3 of `samples_sultans.md` is Chinese source with an agent's own
  English translation, labelled `(my translation)`. Lines marked `[OFFICIAL EN]` are the game's
  published English, found on the wiki and matched sentence-for-sentence against the Chinese.
  Do not cite an agent translation as the game's English.

## Reproducing the collection

MediaWiki sites were read through the raw API rather than any summarising fetch, because paraphrase
destroys the data:

```
curl -sL "https://SITE/api.php?action=parse&page=PAGE_TITLE&prop=wikitext&format=json"
curl -sL "https://SITE/api.php?action=query&list=categorymembers&cmtitle=Category:Events&cmlimit=500&format=json"
```

GitHub trees were enumerated with:
```
curl -sL "https://api.github.com/repos/OWNER/REPO/git/trees/HEAD?recursive=1"
```

## Known gaps

- **The highest-value missing source**: Sultan's Game `StreamingAssets/i18n/en/config.json`, which
  holds official English for all ~1,150 rites and every branch. It is not published anywhere — the
  only public game-data repos are Chinese, and the only public translations are Spanish
  (`github.com/Jastro/sultan`) and Vietnamese (`github.com/neyney2810/sultan-game-vi-translation`).
  It exists in the Steam install folder of anyone who owns the game. Obtaining it would supersede
  PART 3 of `samples_sultans.md` and allow the length distributions to be recomputed on official
  English rather than on translations.
- Neither the KoDP nor the Six Ages wiki records success/failure branches as prose; all 1,400 pages
  were checked. The 24 outcome texts that exist are later in-game report screens transcribed by
  editors.
- Fandom's Fallen London wiki returns 403 to non-browser clients; `fallenlondon.wiki` was used instead.
- Fallen London's longest showpiece results are the ones its wiki elides, so that sample skews toward
  short repeatable content.
- No public text dump was found for Darkest Dungeon or Roadwarden.
- No vanilla CK3 localisation was found on GitHub; the CK3 section is from a mod and is labelled.
- Each source file ends with a `WHAT I COULD NOT GET` section listing what was attempted and why it
  failed.

## Length figures present in this corpus (measured, not asserted)

| corpus | card/intro median | result median | words per sentence |
|---|---|---|---|
| Sultan's — 4 designer samples | 15 / 22 / 54 / 59 | 19 / 21 / 51 / 53 | 10.6–29.5 |
| Sultan's — official English (n=345) | 37 (p25 23, p75 70) | — | 15.2 |
| Sultan's — full corpus, Spanish (n=1485 / 3639) | 24 | 51 | — |
| Fallen London — shipped (n=36 / 59 / 58) | 22 | 33 success, 31 failure | 8.5–10.5 |
| Fallen London — Failbetter's published rule | ≤30 | ≤100 | — |
| KoDP + Six Ages (n=125) | 51 | 31 | 15.0 |
| Battle Brothers + Fort of Chains | 84 | 105 success, 75 failure | 14.6–16.7 |
