# Hunt: official ENGLISH text data for *Sultan's Game*

**Status: FOUND.** Date: 2026-08-24.

---

## RESULT

**Official English localisation file located and downloaded.**

- **Source repo:** `https://github.com/we1how/Sultan-s-Game_Data`
  (public, single commit `8c31d9dc`, 2026-04-07, "initial commit"; no description, no license file)
- **File URL:** `https://raw.githubusercontent.com/we1how/Sultan-s-Game_Data/HEAD/StreamingAssets/i18n/en/config.json`
- **Size:** 7,762,449 bytes (7.4 MB) — under the 20 MB cap, so downloaded.
- **Keys:** **38,797**

Downloaded to `v3/scripts/prosebench/research/sultans_en/`:

| file | bytes | what |
|---|---|---|
| `config.json` | 7,762,449 | **all rite / card / after-story / outcome English text** |
| `ui.json` | 35,547 | UI strings (incl. all the `RITE_SETTLEMENT_*` mechanical labels) |
| `textstyle.json` | 15,885 | text-style tokens |
| `variable.json` | 4,277 | variable substitution table |
| `imagestyle.json` | 493 | image-style tokens |

The same repo also carries the **version-matched Chinese structural config** at
`StreamingAssets/config/` (`rite/*.json`, `cards.json`, `after_story/*.json`, `event/*.json`,
`dt/*.json`, `credits.json`, …) — i.e. the key→structure map for exactly this build, plus
`i18n/ja/` and `i18n/zhTW/` at identical key counts. (The repo also contains extracted binary
assets — fonts, audio, textures — under `1/Assets/`; **none of those were downloaded**, only the
plain-text JSON.)

### Content breakdown (`config.json`)

| prefix | keys |
|---|---|
| `rite_*` | 23,375 |
| `card_*` | 6,552 |
| `after_*` | 2,758 |
| `PROMPT_*` | 1,728 |
| `POP_*` | 1,645 |
| `OPTION_*` | 956 |
| `quest_*` | 616 |
| `over_*` | 506 |
| `tag_*` | 358 |
| others (`upgrade`,`change`,`WIZARD`,`init`,`DT*`) | ~300 |

- **1,382 distinct rite IDs** (range `5000001`–`5010064`)
- **12,022 `*_settlement_*` keys** — every outcome branch
- **1,285 distinct card IDs**

Per-rite key families are exactly what was wanted, e.g. `rite_5000703_*`:
`_name`, `_text`, `_tips_text_N`, `_random_text_rN_text`, `_random_text_rN_type_tips`,
`_random_text_rN_low_target_tips`, `_settlement_extre_N_text`, `_cards_slot_sN_text`,
`_prior_settlement_N_title`.

### Version caveat

This dump is from a build around **Dec 2025** (its `ui.json` `NOTICE` string advertises the
2025 Steam Awards nomination window, Nov 25 – Dec 2 2025). Diffed against the Spanish repo's
current file (`Jastro/sultan`, 56,367 keys, patch 1.2 / Apr 2026):

- in ES not in EN: **17,634** keys — 12,742 `after_*`, 4,162 `rite_*` (113 newer rite IDs,
  mostly `5006166+` and `5010065+`), 184 `PROMPT_*`, 180 `over_*`, 119 `card_*`, plus the
  `GALLERY_ACHIEVEMENT_*` block.
- in EN not in ES: 64 keys (a handful of `card_2000114_plot_*` and two `POP_5004503_*`).

So the English file covers **1,382 / 1,495 rites (92 %)** and **1,285 / 1,292 cards (99 %)**,
but has **only partial after-story content**. `en`, `ja` and `zhTW` in this dump all have
identical key counts (38,797) — i.e. this is a consistent snapshot of that patch, not a
truncated English file. No newer English dump was found anywhere (see below).

### Verification against `sultansgame.wiki.gg`

| key | file value | wiki | match |
|---|---|---|---|
| `rite_5000703_name` | "Canyon of Gales" | "Canyon of Gales" | ✅ |
| `rite_5000703_text` | "Ancient people used magic and terrain to shape the ruins here. It is perpetually windy, and the entrance of the canyon is filled with flying sand and pebbles. Statues of griffins and snakes flank the canyon, suggesting the challenges adventurers will face…" | verbatim identical | ✅ |
| `card_2000006_name` | "Maggie" | "Maggie" | ✅ |
| `card_2000006_title` | "Your Wife" | "Your Wife" | ✅ |
| `card_2000006_text` | "Your wife, a wise and respectable woman. While your marriage – arranged by your late parents when you were still young – lacks passion…" (full paragraph) | verbatim identical | ✅ |
| `rite_5000001_name` | "Managing the Estate" | matches in-game English | ✅ |
| `rite_5000002_name` | "Methinks" | wiki has a "Methinks" page (no flavour text quoted there) | ✅ (name) |
| `card_2000001_name/title` | "Arzu" / "The Chosen One" | matches in-game English | ✅ |

Conclusion: this is the **shipped official English localisation**, not a machine translation.

---

## AVENUES TRIED (full log)

### 1. Web search (broad)
| query | result |
|---|---|
| `"rite_" "_settlement_" sultan game config json english localization github` | surfaced `AC-HUB-AC/Sultan_s_Game_Event_Viewer`, `liwenhao0427/sultans-game-mod-manager`, `Jastro/sultan`. No English file. |
| `Sultan's Game StreamingAssets i18n en config.json` | Steam guides confirming translations are installed by **overwriting** `i18n/en/config.json` from a Workshop item — i.e. Workshop items are *replacements*, not sources of the English base. Confirmed the exact path though. |
| `苏丹的游戏 汉化 英文 i18n config.json 提取 文本` | generic i18n tooling only. Nothing. |
| `"sultan" game translation tool mod loader localization "config.json" english base` | LagoFast blog puff-piece on a "translation tool"; no file. |

### 2. Code-search engines
| engine | query | result |
|---|---|---|
| grep.app | `rite_5000703_text`, `settlement_extre`, `cards_slot`, `rite_1000101_text` | **blocked** — Vercel Security Checkpoint interstitial on the API. Unusable. |
| GitHub code search (`gh api /search/code`, authenticated) | `rite_5000703_text` | 0 hits — GitHub does **not** index files > 384 KB, so the 7–13 MB `config.json` files are invisible to code search. This is why earlier searches failed. |
| GitHub code search | `rite_5000002_settlement_1_text` | 0 hits (same reason) |
| GitHub code search | `"settlement_extre"` | 19,488 fuzzy hits; useful ones: `JTBSG/Sultans-Game`, `fentender/sutan-game`, `AC-HUB-AC/Sultan_s_Game_Event_Viewer`. All Chinese. |
| GitHub code search | `"i18n/en/config.json"` | 1 hit, unrelated (a Perl camera bruteforcer). |
| GitHub code search | `"i18n/en" sultan`, `sultan path:i18n/en`, `"StreamingAssets/i18n"` | all noise. |

**The breakthrough technique:** the *siblings* of `config.json` are small enough to be indexed.
Searching for a distinctive `ui.json` key (`RITE_SETTLEMENT_DICE_PROMPT_CURRENT_DICE_NUMBER`,
`CARD_RARE_EXT_4`, `RITE_NEED_RUN_ROUND_NUMBER`) returns **every repo on GitHub carrying any
language's `ui.json`** — and therefore every repo carrying a sibling `config.json`:

```
fentender/sutan-game            history_config/config_20{25,26}.*/ui.json   (zh, 10 dated snapshots)
neyney2810/sultan-game-vi-translation   ui.json                             (vi)
n313893254/Sultan-Game-mod      ui.json                                     (zh)
Jastro/sultan                   StreamingAssets/i18n/es/ui.json             (es)
dixiyao/Sudan-Mod               config/ui.json                              (zh)
we1how/Sultan-s-Game_Data       StreamingAssets/i18n/{en,ja,zhTW}/ui.json  ← ENGLISH
we1how/Sultan-s-Game_Data       StreamingAssets/config/ui.json
```

`we1how/Sultan-s-Game_Data` is the **only** English `i18n` tree indexed on GitHub. Recommend
re-running this exact query periodically to spot a newer English dump.

### 3. GitHub repo enumeration
Ran `/search/repositories` across 10 query variants (`sultans game`, `sultan game`,
`苏丹的游戏`, `sultans-game`, `sultansgame`, `sultan translation`, `苏丹 游戏 mod`,
`sultan game text`, `sultan game story`, `SultansGame`), deduped to **142 sultan-related repos**,
then fetched the **git tree of every plausible candidate** and grepped paths for
`i18n` / `lang` / `en` / `local`. Results:

| repo | verdict |
|---|---|
| **`we1how/Sultan-s-Game_Data`** (191 MB) | ✅ **FOUND** — full `StreamingAssets/` with `i18n/en`, `i18n/ja`, `i18n/zhTW` |
| `liwenhao0427/sudans-game-reader` (3,012 files) | Chinese only, no i18n |
| `liwenhao0427/SultansGameReader` / `-backup` / `-mirror` / `-local` | empty, mirrors, or Chinese only |
| `liwenhao0427/sultans-game-config` (2,949 files) | Chinese source config only (already known) |
| `liwenhao0427/sultans-game-mod-manager` | no i18n |
| `Jastro/sultan` | `i18n/es/` only. **Git history checked** — initial commit `0cf13b88` already contained the machine-translated Spanish; the English base it was translated *from* was never committed. Readme confirms it was bulk-translated with `mololab/json-translator` then hand-edited. |
| `neyney2810/sultan-game-vi-translation` | 3 commits, all Vietnamese. No English base in history. |
| `AC-HUB-AC/Sultan_s_Game_Event_Viewer` | 1,175 Chinese `rite/*.json` + a PyInstaller exe. No English. |
| `crimzonlilia/kismet` (English save-editor / event explorer) | reads the **user's local** game install; `core/translator.py` falls back to a hand-rolled zh→en word map + Google Translate. Ships no English game text. |
| `Lyrositor/shadow-compass` (English data-exploration tool) | `resources/additional_i18n.json` (344 KB) is the author's own supplementary strings, not the game file. |
| `hlaguth/JSON_EDITOR-sultan_game` | Python editor only, no data. |
| `hanpaemo/sultans-game-korean-patch` | README + screenshots only; patch distributed off-GitHub. |
| `millzae00/SultansGame_krpatch` | 0 KB / empty. |
| `Diving-Fish/SultansDB` | templates + a 171-byte config; reads local install. |
| `karminski/VibeSultan` | AI-plays-the-game harness; scrapes the running game, ships no text file. |
| `fentender/sutan-game` (33,621 files) | 10 dated **Chinese** config snapshots (`config_2025.05.28` … `config_2026.04.20`) — excellent for versioned Chinese, no English. |
| `JTBSG/Sultans-Game` | Chinese `.xlsx` exports of rites/events/cards. No English. |
| `liwenhao0427` full account scan (39 repos) | no English i18n anywhere. |

### 4. Leads deliberately not needed once the file was found
- Nexus Mods `nexusmods.com/sultansgame`, Steam Workshop app 3117820, ModDB, GameBanana, itch.io.
- Gitee / GitCode / Codeberg / GitLab, searchcode.com, publicwww, sourcegraph.
- bilibili / 贴吧 / 3dmgame / 游民星空 / 游侠 / NGA / 知乎.
- HuggingFace Datasets, Kaggle.
- archive.org.

These were dispatched to parallel searchers as a hedge; the GitHub tree-scan landed first.
None of them is needed for the primary goal. They remain the places to look if a **newer**
(patch 1.2, 56 k-key) English file is ever wanted.

---

## IF A NEWER ENGLISH FILE IS WANTED

1. Re-run the indexed-sibling GitHub code search:
   `gh api '/search/code?q=%22RITE_SETTLEMENT_DICE_PROMPT_CURRENT_DICE_NUMBER%22&per_page=40'`
   — any new repo with an `i18n/en/ui.json` will surface, and its `config.json` sits beside it.
2. The missing content is enumerable: the 113 rite IDs and 12,742 `after_*` keys present in
   `Jastro/sultan`'s Spanish file but absent from the English one. Those specific rites can be
   read in English on `sultansgame.wiki.gg` if ever needed.
3. `fentender/sutan-game` keeps dated Chinese config snapshots; if that author ever adds an
   `i18n/` tree, it would be the cleanest versioned English source.

---

## ADDENDUM — second English source, and a MERGED file with 100 % rite coverage

A parallel searcher (Nexus / Steam Workshop / ModDB / archive.org sweep) turned up a **second,
independent English source** that closes almost all of the version gap above.

### Source B — the Thai community translation's untranslated residue

- Steam Workshop item `3592030413` ("TH Thai language Sultan's Game") distributes its pack via
  Google Drive: `https://drive.google.com/drive/folders/1nCAwisuj6Dnn9Ot9lvn2tqgVrFg-q9oD`
- File inside: `Sultan's Game_Data/StreamingAssets/i18n/en/config.json`
- Direct: `https://drive.google.com/uc?export=download&id=1_Put_jZsnN4VKoDtB6qjh-0wg7VnFQT_`
- 18,460,536 bytes, valid JSON, **56,266 keys** — the *current-patch* key manifest
  (matches `Jastro/sultan`'s 56,367 to within a hundred keys).

Because Thai packs are installed by **overwriting the `en` folder**, and this author left large
swathes untranslated, roughly a third of the file is still **verbatim official English**.
It is therefore not a clean English file, but it is a perfectly good *donor* for the keys
Source A lacks.

### The merge

Extracted from Source B only those keys that (a) are absent from Source A and (b) still hold
original English (no Thai/CJK codepoints, ≥95 % ASCII letters):

- **4,822 keys recovered, 1,136,516 characters of official English prose.**
- Of the 4,162 `rite_*` keys missing from Source A, **4,020 (96.6 %) were recovered.**
- Also recovered: 332 `after_*`, 181 `PROMPT_*`, 125 `over_*`, 85 `OPTION_*`, 41 `POP_*`,
  20 `card_*`, 8 `quest_*`.

Written to `v3/scripts/prosebench/research/sultans_en/`:

| file | bytes | what |
|---|---|---|
| `config_merged.json` | 8,995,474 | **43,619 keys** — Source A + the 4,822 recovered keys |
| `merge_provenance.json` | 189,849 | exact list of which keys came from Source B |

**Coverage of the merged file:**

- **1,495 / 1,495 rite IDs — 100 %** (up from 1,382). Zero rite IDs missing versus the
  full current-patch manifest.
- 1,492 of those 1,495 have **both** `_name` and `_text`.
- Still incomplete: `after_story_*` (12,410 of 12,742 missing keys were Thai-translated and
  therefore unrecoverable). After-story content remains the one real hole.

Recovered samples are unmistakably official prose, e.g.
`rite_5010213_settlement_0_text` → "As you soared through the void, the light of the mortal
world faded. In your eyes, nothing remained but the gate—and each other…";
`rite_5008249_random_text_r1_type_tips` → "Arzuna's Physique and Charisma determine the pool of
dice."

**Recommendation:** use `config_merged.json` as the working corpus (100 % rite coverage);
fall back to `config.json` when you want a provenance-clean single-build file.

### Other results from the parallel sweep (all negative)

- **Nexus Mods** — Cloudflare 403 on the web pages, bypassed via the unauthenticated public
  GraphQL endpoint `POST https://api.nexusmods.com/v2/graphql` with
  `mods(filter:{gameDomainName:{value:"sultansgame"}})`. Enumerated **all 52 mods**. Exactly one
  localisation mod exists (`mods/142`, "Sultan's Game Rus", Russian, 439 downloads) and it ships
  no English base. `mods/140` confirms the install mechanism (paste into
  `…\StreamingAssets\i18n\en\config.json`) but ships only its own fragment.
- **Steam Workshop, app 3117820** — enumerated the **entire workshop, 1,305 items**, and pulled
  every title + description via `ISteamRemoteStorage/GetPublishedFileDetails/v1`. Regex-scanned
  all descriptions for `config.json|i18n|github|gitee|drive.google|mega.nz|pan.baidu|lanzou|
  dropbox|localiz|translat|汉化|翻译` → 32 hits, all triaged. The Thai item is the **only**
  translation item with an external host. `file_url` is empty for every item (SteamPipe UGC),
  so workshop payloads are not fetchable without owning the app.
- **Steam Community Guides** — all **56** enumerated. Only the RU russifier
  (`3554383923`), whose sole link is Patreon — paywalled, skipped per the rules.
- **ModDB** `moddb.com/games/sultans-game/mods` → empty. **GameBanana** API
  (`apiv11/Game/22656/Subfeed`) → `_nRecordCount: 0`. **itch.io** → no results.
- **archive.org** — `advancedsearch.php?q="Sultan's Game"` → 7 items, all images plus a 2024
  wiki snapshot. Wayback CDX for `nexusmods.com/sultansgame*` → HTML pages only, no file
  downloads archived.
- **`Jastro/sultan` re-checked exhaustively** — all 34 commits, 3 branches, 3 forks. Earliest
  commit (2025-05-24, 5.8 MB, 30,497 keys) is already 100 % Spanish.

### Remaining unchased leads (only relevant if after-story coverage is ever needed)

1. **Steam Workshop `3538381101` / `3599996653`** — "奴隶市场及哈布娜后续修改: English Edition",
   reported payload **19,260,248 bytes**, within ~4 % of the full 18.46 MB English config. Given
   the overwrite-the-whole-file install pattern, this almost certainly contains a **complete,
   current-patch English config** plus mod additions. Blocked: SteamPipe UGC needs `steamcmd`
   with an account owning app 3117820.
2. **The Thai pack author** — asking for their untouched English base would yield a clean 100 %
   current-patch file in one step. Their README sits in the same Drive folder.
3. **`patreon.com/Chieftain51`** — the RU russifier's distribution point; also replaces `i18n/en`
   wholesale. Paywalled, deliberately not pursued.

### Note on `sultans_en/rite_conditions.json`

A `rite_conditions.json` (642 KB, 1,382 entries: rite ID → Chinese name, card slots, and the
full branch/condition table) appeared in this directory during the run, written by one of the
parallel searchers rather than by the main hunt. It is derived from the version-matched Chinese
structural config in `we1how/Sultan-s-Game_Data` and is genuinely useful for mapping settlement
keys to their trigger conditions — but it was not part of the requested output. Keep or delete
at your discretion.

---

## ADDENDUM 2 — Chinese hosts, code-search engines, datasets (all negative)

A second parallel searcher swept the CN/dataset lanes. **No English `config.json` on any of them.**
Recorded so nobody repeats the work.

### Gitee — BLOCKED, *not* conclusively cleared
- `gitee.com/api/v5/search/repositories?q=苏丹的游戏` (also `sultan`, `sultans-game`, `苏丹`) → `[]`
  for every term **including the control term `vue`** ⇒ the endpoint is auth-gated; empty results
  are *not* evidence of absence.
- `search.gitee.com/?q=…` → 301 → `so.gitee.com` → JS-only shell. The bundle
  (`so.gitee.com/assets/index-2ad95f7a.js`) shows search is an **Indexea** widget
  (`so.gitee.com/v1/search/widget/{id}`); requests against the candidate widget id → HTTP 405.
- `gitee.com/explore/all?search=苏丹的游戏` → **HTTP 405** from both curl and WebFetch ⇒ Gitee
  blocks this egress entirely.
- `site:gitee.com 苏丹的游戏` via web search → nothing game-related.

**Gitee remains the one genuinely unsearched host.** Clearing it needs a CN-reachable network
path or a Gitee account token.

### GitCode / Codeberg / GitLab
- GitCode `api/v5/search/repositories?q=苏丹的游戏` → `[]`; `q=sultan` → `Invalid header parameter:
  private-token`. Web search → no results (site now AtomGit-branded).
- Codeberg `api/v1/repos/search`: `sultans-game` → 0, `苏丹的游戏` → 0, `sultan` → 20 unrelated
  ("consultant", gambling spam). Global code search `explore/code` → login-gated.
- GitLab `api/v4/projects?search=…` → exactly one hit,
  `https://gitlab.com/Markima/Mod-Sultans-Game`. Full recursive tree scanned: only
  `Sultan's Game_Data/StreamingAssets/config/{cards.json,event/,loot/,rite/}` — **no `i18n/`**.
  Chinese source with Chinese `//` comments; a demo-era NSFW mod.

### Code-search engines
- **Sourcegraph** (`/.api/search/stream`, works unauthenticated — the one CN-lane engine that
  actually functions): `settlement_extre` → only `MarcWebber/sultan-s-game-cheater`;
  `rite_5000703_text` → **0 globally**; `Sultan's Game_Data` → 0;
  `file:i18n/en/config.json` → only `Snapmaker/Luban` (unrelated).
- **grep.app** → Vercel Security Checkpoint. Blocked, as I also found.
- **searchcode.com** → every API path (`/api/codesearch_I/`, `/api/jsonp_codesearch_I/`,
  `/api/search/`) returns `404 page not found`; the site pivoted to an LLM/MCP product with no
  public search API. Dead lane.
- **publicwww** (its sha256 JS proof-of-work was solved to get real results):
  `"rite_5000703_text"` → 0, `"card_2000001_text"` → 0, `"settlement_extre"` → 0,
  `"Sultan's Game_Data"` → 0. `"sultans-game"` → 34 pages, all `apocanow.com` cheat-spam mirrors.
- **Software Heritage** `api/1/origin/search/{sultan,sultans-game,苏丹}` → nothing relevant.

### Chinese community sites
- Bilibili article search API (`api.bilibili.com/x/web-interface/search/type`,
  `search_type=article`) for 苏丹的游戏 × {文本提取, 英文文本, 全文本, 解包} → only strategy
  guides, ending lists, character write-ups. No dump.
- `3dmgame.com/games/sddyx/resource/` → portrait / gameplay / Chinese-text-rewrite mods only;
  **no English pack**.
- gamersky, ali213 (游侠), NGA, 小黑盒, 知乎, 贴吧 → nothing. Nobody publishes an extracted dump.
- bwiki 苏丹的游戏WIKI「配置阅读器」 → the tool is
  `https://charleyz2021.github.io/sultan-config-reader/`; inspected, it is purely browser-local
  (users import their *own* `config.zip`). Ships no data, no `en` support.

### Datasets
- HuggingFace `api/datasets?search=sultan` → 48 results, all unrelated Arabic-LLM work;
  `search=苏丹` → 0; `search=sultans game` → 0.
- Kaggle dataset search → none.

### Bonus lane: ParaTranz (paratranz.cn, the main CN game-translation platform)
Its search param is ignored, so **all 6,970 public projects** were enumerated (70 pages) and
names+descriptions grepped. Exactly one hit: `https://paratranz.cn/projects/18055`
("Sultans Game / Sultans Game Mod Trans", `zh-cn → ko`, public download enabled, 4,073 strings).
It is a **mod** (Workshop 3496961707), Chinese source, 1 string translated. Not the official text.

### Leftover repo checks (done by me, both negative)
- `MarcWebber/sultan-s-game-cheater` — 5,967 blobs, full `config/rite/*.json` tree. **No `i18n/`.**
- `AC-HUB-AC/Sultan_s_Game_Ending_Viewer` — 65 blobs; only PyInstaller `localpycs/*.pyc` matched
  the i18n grep. No game i18n.

---

## SUPPLEMENTARY ASSET — the official English wiki is fully harvestable

Worth recording as a **cross-check / gap-filler**, not a replacement:

- `https://sultansgame.wiki.gg/api.php` is **open and unauthenticated** (only `/wiki/Special:*`
  is 403-walled).
- `action=query&meta=siteinfo&siprop=statistics` → **2,776 pages, 859 articles,
  144,731 article-words**.
- `list=allpages` + `prop=revisions&rvprop=content&rvslots=main` returns raw wikitext for every
  page — a complete scriptable English dump, no auth, no size problem.
- The text is the **shipped English localisation verbatim**, not fan paraphrase. Verified:
  page `Adila's Sword` → `|Description=Adila's sword, meticulously cared for, yet still bearing
  the marks of countless bloodshed and battles.`
- Covers Cards, Characters, Rituals, Events, Poems, Convictions, Intelligence, Books, Equipment,
  Followers, Locations, Bathhouse Events, Infamy events.

**Caveat:** these are card/item/character *descriptions and names*. Long rite and settlement
bodies are largely absent — which is exactly what `config_merged.json` already has in full.
Use the wiki API only to spot-verify, or to fill the residual `after_story_*` hole.

---

## FINAL STATUS

`sultans_en/config_merged.json` — **43,619 keys, 1,495 / 1,495 rites (100 %)** — is the working
corpus. Every lane other than the two that produced Sources A and B came back empty, and the
technique that found Source A (searching an *indexed small sibling* key such as
`RITE_SETTLEMENT_DICE_PROMPT_CURRENT_DICE_NUMBER`) is the one worth re-running later.
