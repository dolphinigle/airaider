# Adversarial fidelity audit — `samples_kodp_sixages.md` and `samples_mercenary_games.md`

Audit date: 2026-08-24. Auditor: adversarial re-fetch of every cited source, character-level
comparison. Assumption going in: the files are wrong until proven otherwise.

---

## 1. Method

I did not spot-check. I re-fetched **100 % of the cited sources** for both files and compared
**every** blockquote, so the "every Nth" tables below are a readable *presentation* of a
full-population check, not the check itself.

### File 1 — `samples_kodp_sixages.md`

1. Extracted all 85 `Source:` URLs from the file.
2. Fetched each page's raw wikitext:
   `https://<site>/api.php?action=parse&page=<PAGE>&prop=wikitext&format=json`
   (85/85 returned a `parse` object; 0 dead pages, 0 redirects to a different title).
3. Parsed the markdown into (event, label, blockquote) triples — 125 blockquote blocks.
4. Normalised the wikitext only in ways the file's own header licenses: `[[a|b]]→b`,
   `[[a]]→a`, `'''`/`''` removed, `<br>`→space, `<!--…-->` removed, `&nbsp;`→space,
   leading `#`/`*`/`:` list markers removed. **No word-level normalisation.**
5. Required each blockquote to be a **contiguous substring** of the normalised wikitext.
   (Contiguity is what rules out stitching from non-adjacent passages — a stitched quote
   cannot be a substring.)
6. Second, stricter pass with *no* whitespace collapsing and *no* curly-quote folding, to
   catch silent punctuation/spacing edits.
7. Located each match's byte offset and checked whether it falls inside a `{{quote|…}}` /
   `{{Quote|…}}` template span (= wiki-transcribed game text) or in editor prose.
8. Separately verified all 29 `_[wiki context: …]_` strings against the same pages, all 464
   `- ` choice bullets, and the `Game:` attribution against the quote template's attribution
   argument and the page categories.

Scripts: `/tmp/claude-1000/-home-irvan-airaider/c11ed003-98fa-486f-a74e-668ad107c135/scratchpad/{fetch,cmp,cmp2}.py`

### File 2 — `samples_mercenary_games.md`

1. Extracted all 41 distinct `raw.githubusercontent.com` URLs.
2. `curl -sSL` each → **41/41 HTTP 200**, no 404, no redirect to a rename.
3. Parsed the markdown into 145 (sample-ID, label, blockquote) triples.
4. Compared each blockquote to its cited file after unescaping the *source's* own escapes
   (`\"`, `\'`) and ignoring whitespace only — again requiring contiguity.
5. Structural checks beyond text identity:
   - Battle Brothers: located the enclosing `ID = "…"` screen for every quote and compared it
     to the declared screen name; split every `Text = "…"` field on **top-level** `|`
     (brace-depth aware) and checked every stated alternate index *and* "of N" total.
   - Fort of Chains: located the enclosing `:: PassageName` for every quote; checked the
     passage-name suffix (`Crit`/`Success`/`Failure`/`Disaster`) against the label; measured
     bytes omitted before/after the quote inside its passage.
   - Wildermyth: byte-compared "whole file" claims against the whole file; queried the GitHub
     contents API for `assets/text/effects/missionOutcome` to confirm the repo really vendors
     English + `_tr` pairs.
   - CK3: parsed the `.yml` into a key→value map and matched every quote to its exact
     `VIETmisc.NNNN.{t,desc,a,b,c,d}` key.
   - Recomputed all 145 stated word counts.
   - `api.github.com/repos/…` for all four repos (existence, description, default branch).

Scripts: `/tmp/claude-1000/-home-irvan-airaider/c11ed003-98fa-486f-a74e-668ad107c135/scratchpad/cmp3.py`

---

## 2. File 1 results — `samples_kodp_sixages.md`

### 2.1 Systematic sample (every 10th of the 125 blockquotes)

| # | Event | Label | Page | Verdict |
|---|---|---|---|---|
| Q1 | Bandit Infestation | Situation — Event: Clan | Bandit_Infestation | VERIFIED |
| Q11 | Wolf Attack | Situation | Wolf_Attack | VERIFIED |
| Q21 | Trader Bullies | Situation | Trader_Bullies | VERIFIED |
| Q31 | Two Missing Daughters Now | Situation | Two_Missing_Daughters_Now | VERIFIED |
| Q41 | Skeletal Flying Creatures | Situation | Skeletal_Flying_Creatures | VERIFIED |
| Q51 | Uraldan Priestess Seeks Husband | Situation — Besotted with Another | Uraldan_Priestess_Seeks_Husband | VERIFIED |
| Q61 | Gift from Tricksters | Outcome | Gift_from_Tricksters | VERIFIED |
| Q71 | Bandit Offer | Situation | Bandit_Offer | VERIFIED |
| Q81 | Rival Clan Challenge | Outcome | Rival_Clan_Challenge | VERIFIED |
| Q91 | Marriage Crisis | Situation | Marriage_Crisis | VERIFIED |
| Q101 | Young Poachers | Situation | Young_Poachers | VERIFIED |
| Q111 | Slander | Situation | Slander | VERIFIED |
| Q121 | Gorp Palace Attack | Outcome | Gorp_Palace_Attack | VERIFIED |

### 2.2 Full-population results

| Check | Result |
|---|---|
| Cited pages that still resolve | **85 / 85** |
| Blockquotes that are a contiguous substring of the live wikitext | **125 / 125 VERIFIED** |
| Blockquotes located **inside** a `{{quote}}` template (i.e. game text, not editor prose) | **125 / 125 VERIFIED** |
| Blockquotes stitched from non-adjacent source text | **0** |
| Blockquotes with wording altered | **0** |
| Engine slots (`<X>`, `<treasure>`, `<Ring Member>`, `<a/b/c>` alternations) altered or dropped | **0** — they are inside the exact-match spans |
| `_[wiki context: …]_` lines that are genuine wiki-editor prose from the same page | **29 / 29 VERIFIED** |
| Choice bullets found on the cited page | **464 / 464 VERIFIED** |
| Choice bullets found inside the page's `{{quote}}` template | **464 / 464 VERIFIED** |
| `Game:` attribution vs. the wiki's own quote attribution + categories | **85 / 85 consistent** |

### 2.3 Every discrepancy found (all 5 are cosmetic; none is fabrication)

**D1 — unrendered HTML entity (Grain-eating Trollkin).** Header promises markup stripped.
Claimed (file, line 550):
> `You're familiar with these creatures from the old country &#126; they're trollkin,`

Actual (wiki):
> `You're familiar with these creatures from the [[old country]] &#126; they're ''trollkin'',`

The `&#126;` (a tilde) is present in the wiki source too — the file is *faithful*, but it left
a raw entity where a reader expects `~`. Links and italics were correctly stripped. **NOT a
wording change.** Severity: cosmetic.

**D2 — paragraph-break whitespace (5 blockquotes).** Assassin's Twilight (Tribal Moot),
Theya V (Outcome), Bandit Offer (Outcome), Blue Goat Encounter (Outcome), Yeleni Seek Pela
(Situation). The wiki has a blank line between paragraphs; the file renders it as a bare `>`
line, so a double space becomes single after flattening. No character of prose differs.
Severity: none.

**D3 — wiki-editor prose presented as a game CHOICE (Duck eggs, file line 810).** The file's
header promises editor prose is marked `_[wiki context: …]_`. This one is not:
> `- After purchasing the eggs, you'll get the following dialogue:`

Actual wiki source: `''After purchasing the eggs, you'll get the following dialogue:''` —
italicised editor framing that the wiki author placed *inside* the `{{quote}}` block. The
file stripped the italics, which removed the only signal that it is not game text, and then
listed it as a bullet under **Choices:**. The wiki is the origin of the confusion, but the
file amplifies it. Severity: low — one line, obviously not a choice on reading.

**D4 — availability annotations listed as choices (6 cases).** e.g. Ghost Demand
`- (Only appears if you have such an alliance)`, Strange Figures `- (only available if the
Antler Society is active)`, Berenstead Cellar Heist `- (only available after a successful
spirit call)`, Slaves to Cenala `- (only available if you have excess Magic)`, Elf Aggression
`- (only available to Cenalan clans that's had Sprouting Shrine happen to them)`. All six are
verbatim from inside the wiki's `{{quote}}` block, so they are faithfully copied — but they
are gating notes, not player options. Severity: low.

**D5 — under-specified game label (2 events).** `Scorpion Folk Steal Goats` and
`Getting Crowded` are labelled `Game: Six Ages`; both wikis attribute them to
`Six Ages: Ride Like the Wind`. Under-specific, not wrong. Severity: cosmetic.

### 2.4 Count verdict — File 1

| Claim | Actual | Verdict |
|---|---|---|
| 85 events | 85 `## ` event sections | **CORRECT** |
| 42 King of Dragon Pass | 42 (also 42 `Game: King of Dragon Pass` lines) | **CORRECT** |
| 43 Six Ages | 43 (30 Ride Like the Wind + 11 Lights Going Out + 2 bare "Six Ages") | **CORRECT** |
| 125 verbatim blockquote passages | 125 contiguous `>` blocks | **CORRECT** |
| 24 events carry verbatim OUTCOME prose | 24 distinct events; 25 `**Outcome:**` labels (Ghost Demand has two) | **CORRECT** |
| Extracted from `{{Quote|…}}` templates | 125/125 inside quote templates | **CORRECT** |
| Markup stripped, no rewording | 0 rewordings; one entity left raw (D1) | **CORRECT** |
| `_[wiki context: …]_` is editor prose, not game text | 29/29 confirmed editor prose | **CORRECT** |

---

## 3. File 2 results — `samples_mercenary_games.md`

### 3.1 Systematic sample (every 10th of the 145 blockquotes)

| # | Sample | Label | Source file | Verdict |
|---|---|---|---|---|
| Q1 | BB-01 | Offer/Setup (64 words) | intro_templates.nut | VERIFIED |
| Q11 | BB-04 | Offer/Setup — `Task` alt 2 | escort_caravan_contract.nut | VERIFIED (alt 2 of 9) |
| Q21 | BB-05 | Outcome (failure, target escaped) — `Failure3` alt 1 | raid_caravan_contract.nut | VERIFIED (in `Failure3`, alt 1 of 2) |
| Q31 | BB-07 | Outcome (failure) — `Failure1` alt 5 | escort_envoy_contract.nut | VERIFIED (in `Failure1`, alt 5 of 6) |
| Q41 | BB-10 | Event text (`Title` = "Along the road...") | broken_wagon_event.nut | VERIFIED (`m.Title` matches) |
| Q51 | BB-12 | Outcome (player forbade it) — screen `D` | archery_stunt_event.nut | VERIFIED (in `ID = "D"`) |
| Q61 | BB-15 | Outcome (ambush) — screen `B` | man_in_forest_event.nut | VERIFIED (in `ID = "B"`) |
| Q71 | FoC-01 | Outcome (failure) | BountyHuntSlime.twee | VERIFIED (`QuestBountyHuntSlimeFailure`) |
| Q81 | FoC-04 | Offer/Setup | sunken_barge_i.twee | VERIFIED (`Quest_sunken_barge_i`, complete passage) |
| Q91 | FoC-06 | Outcome (disaster) | werewolf_hunt.twee | VERIFIED (`Quest_werewolf_huntDisaster`) |
| Q101 | WM-03 | Outcome (failure) — whole file | defeat_givingGround.properties | VERIFIED (byte-identical whole file) |
| Q111 | WM-13 | Offer/Setup — Scout | job_scoutArea.properties | VERIFIED (whole file) |
| Q121 | CK3-02 | Player option `c` | viet_travel_events_l_english.yml | VERIFIED (`VIETmisc.7006.c`) |
| Q131 | CK3-04 | Player option `b` | viet_travel_events_l_english.yml | VERIFIED (`VIETmisc.7023.b`) |
| Q141 | CK3-07 | Offer/Setup (event description) | viet_travel_events_l_english.yml | VERIFIED (`VIETmisc.7002.desc`) |

### 3.2 Full-population results

| Check | Result |
|---|---|
| Cited raw URLs that resolve | **41 / 41 HTTP 200** |
| Cited repos that exist | **4 / 4** (`kovasap/battle-bros-decompiled`, `Official-Husko/fork-of-chains`, `adenzu/Wildermyth-Turkish`, `cybrxkhan/VIET-Events-for-CK3`) |
| Blockquotes traceable verbatim to the cited file | **145 / 145** (141 exact; 4 are two adjacent strings joined — see D6) |
| Blockquotes with wording altered | **0** |
| Blockquotes stitched from non-adjacent source text | **0 prose blocks**; 4 button blocks join two adjacent `Options[].Text` values (D6) |
| BB screen-ID labels (`Task`/`Success*`/`Failure*`/named screens) vs. enclosing `ID = "…"` | **69 / 69 VERIFIED** — zero mislabels |
| BB stated alternate indices ("alt 5", "alternate 10 of 11") | **37 / 37 VERIFIED**, including every "of N" total |
| BB blocks with no stated index that are genuinely single-alternate | **20 / 20 VERIFIED** |
| FoC grade labels vs. `:: Quest…{Crit,Success,Failure,Disaster}` passage names | **31 / 31 VERIFIED** — zero mislabels |
| FoC quotes that are the *complete* passage (0 bytes omitted before or after) | **31 / 31** |
| FoC "folds Crit/Success into one passage on `$gOutcome`" claim | VERIFIED — `kobold_rescue`, `treasure_hunt`, `sunken_barge_i`, `Bandits_On_The_Roads`, `CrimsonRobber`, `HeadHunter` all have the `<<if $gOutcome == …>>` branches and no separate `Success` passage |
| WM "whole file" claims | **12 / 12 byte-identical to the whole file** |
| WM repo really vendors English alongside `_tr` | VERIFIED — `missionOutcome/` holds 262 files, 136 of them `*_tr.properties` |
| CK3 key claims (`VIETmisc.NNNN.{t,desc,a,b,c,d}`) | **33 / 33 VERIFIED** key-for-key against the parsed `.yml` |
| Stated word counts | **145 / 145 reproduce** under the file's stated rule (whitespace tokens, `%SPEECH_*%` excluded) |
| Engine slots preserved | VERIFIED — `%employer%` ×28, `%randombrother%` ×4, `%SPEECH_ON%` ×35, `<site>` ×6, `$g.merc1` ×8, `<<rep $g.scout>>` ×2, `<hothead>` ×2, `[ROOT.Char.GetCurrentLocation.GetName]` ×9, all inside exact-match spans |
| CK3 section conflated with vanilla | **NO** — see 3.4 |

### 3.3 Every discrepancy found

**D6 — editorial ` / ` inside a blockquote (4 button blocks).** These are the only blockquotes
in the file that are not a single contiguous source string. Example, file line 55:
> `Let's get to business.  /  Let's talk, then.`

Actual source (`intro_templates.nut`), two separate `Options[0].Text` values in two different
`Intro` screens:
> `Text = "Let\'s get to business.",`  … and … `Text = "Let\'s talk, then.",`

Both halves verified present. Same pattern at lines 268 (`Stop at once!` / `Well... this
should be interesting.`), 296 (`Let's see what you can do!` / `That's not what I'm paying you
for.`) and 332 (`Follow him, quick!` / `He's not our concern. Let him go.`) — all halves
verified. The labels say "Button**s**" and "(liked / disliked)", so the join is signposted,
but the ` / ` separator is text the file's author inserted inside a blockquote that the header
declares "copied verbatim". Severity: low, disclosure-quality.

**D7 — WM-07 mislabelled as an excerpt when it is the whole file.** File line 1251 heading:
> `### WM-07 Victory: "The Unspeakable Thing" — the surviving lover speaks (excerpt: the file continues with one full variant per personality)`

and its label: `**Outcome (success with a death) — first branch of the file:**`

Actual: the quoted text is **byte-identical to the entirety of** `victory_deadLover.properties`.
The per-personality variants are *separate files* in the same directory
(`victory_deadLover_bookish.properties`, `…_coward`, `…_hothead`, `…_leader`, `…_loner`,
`…_poet`, `…_greedy`, `…_goofballSnark`, `…_healerRomantic` — all confirmed to exist). So the
description of *where* the variants live is wrong, and the sample is understated rather than
overstated. Severity: low; it errs toward under-claiming.

**D8 — `#suppress inspection` comment lines quoted as content.** Every Wildermyth block opens
with `#suppress inspection "UnusedProperty" for whole file`, which is an IDE directive, not
player-facing text, and it is counted in the stated word counts. Disclosed only implicitly by
"whole file". Severity: cosmetic; it inflates the word counts by ~5 words per WM sample.

**D9 — internal inconsistency about the Fort of Chains fork. UNVERIFIABLE claim asserted as
fact.** Section header (line 374):
> `Source repo: Official-Husko/fork-of-chains (maintained fork of darkofocdw's Fort of Chains; quest text is unchanged from the original).`

But the file's own appendix (line ~1678) says:
> `Quest text in the fork is the original authors' text, but I cannot certify line-for-line identity with the current upstream build.`

I tried to settle it: the upstream `gitgud.io/darkofocdw/fort-of-chains` raw endpoint returns
HTTP 403 behind a Cloudflare interstitial, so it is **UNVERIFIABLE** from here, exactly as the
appendix says. Note also that the fork self-describes as "Fort of Chains: **Galvanized**" and
was pushed as recently as 2025-11-16, so divergence is plausible. The parenthetical assertion
in the section header should be deleted or softened to match the appendix. Severity: medium
(a factual assertion the author knew he could not support).

**D10 — floating `HEAD` refs.** All 41 GitHub citations use `/HEAD/` rather than a commit SHA.
Two of the four repos are actively pushed (`fork-of-chains` 2025-11-16, `VIET-Events-for-CK3`
2026-06-23). Everything verified **today**, but the citations are not reproducible over time.
Same durability caveat applies to the 85 fandom wiki URLs. Severity: low, hygiene.

### 3.4 The CK3-mod question — explicitly checked, explicitly clean

The brief flagged conflation of the VIET mod with vanilla as a risk. It does not happen. The
labelling is aggressive and correct at every level:

- Section heading: `## 4. Crusader Kings III  (VIET Events mod, NOT vanilla)`
- Section body: "…it is written to vanilla CK3 conventions and uses the vanilla
  scripted-slot syntax, so the template shape is representative **even though the words are
  the mod author's**."
- Appendix: "**No vanilla CK3 text.** … The CK3 section is therefore a MOD (VIET Events) and is
  labelled as such — treat the wording as fan-written, the slot syntax as authentic."

All 33 CK3 quotes resolve to keys in the mod's own `viet_travel_events_l_english.yml`. No
vanilla CK3 text is claimed anywhere in the file. **VERDICT: correctly labelled.**

Likewise `Roadwarden` and `Darkest Dungeon` appear **only** in the "WHAT I COULD NOT GET"
section as explicit nulls ("Nothing."). No text is attributed to either. No fabrication.

### 3.5 Count verdict — File 2

| Claim | Actual | Verdict |
|---|---|---|
| 49 samples | **48** — 17 BB + 10 FoC + 13 WM + 8 CK3. There are 49 `### ` headings, but one (`### Battle Brothers — ambient camp / road events`, line 223) is a divider with no content. | **OVERCOUNT BY 1** |
| 152 quoted pieces | **145** blockquote blocks (= 145 `(N words)` labels). There are 152 `**…` bold lines, but 7 of them are the game-name subheads in the "WHAT I COULD NOT GET" section (`**Battle Brothers**`, `**Fort of Chains**`, `**Wildermyth**`, `**Crusader Kings III**`, `**Darkest Dungeon**`, `**Roadwarden**`, `**General**`). | **OVERCOUNT BY 7** |
| 33 failure texts | 33 labels containing "failure" — but one of those (line 965) is `Outcome (failure + disaster tail)`, and several are not contract failures (`Negotiation.Fail` refusals ×3, `Outcome (failure/injury)` for an accidental shooting, `Outcome (failure — arrow to the head)`). | **CORRECT as a label count**, loose as a taxonomy |
| 6 disaster texts | 6 labels reading `Outcome (disaster…)`, plus 1 `failure + disaster tail` | **CORRECT** |
| BB = decompiled `.nut` scripts, `kovasap/battle-bros-decompiled` | Repo exists; description "All decompiled battle brothers code" | **CORRECT** |
| FoC = Twee passages, `Official-Husko/fork-of-chains` | Repo exists; all 10 `.twee` paths resolve | **CORRECT** (but see D9) |
| WM = shipped English `.properties` in `adenzu/Wildermyth-Turkish` | Repo vendors English + `_tr` pairs; all 14 paths resolve | **CORRECT** |
| CK3 = clearly-labelled MOD | Labelled in heading, body and appendix | **CORRECT** |
| Engine slots preserved | 0 alterations across 145 blocks | **CORRECT** |

Both count claims are inflated by counting *headings/bold lines* rather than *content*. The
inflation is small and mechanical, not a padded corpus: no sample or quote is missing or
invented — the denominators were just miscounted.

---

## 4. What I looked for and did NOT find

The brief asked me to hunt six specific failure modes. Results:

| Suspected defect | Found? |
|---|---|
| (a) Wiki-editor paraphrase quoted as game text | **No.** 125/125 KoDP/Six Ages blockquotes sit inside `{{quote}}` templates. The one editor sentence that leaked in (D3) leaked as a *choice bullet*, not as a quoted passage, and it too is inside the wiki's own quote block. |
| (b) Engine slots silently altered or dropped | **No.** Zero, across 270 blockquotes in both files. Slots are inside byte-exact spans. |
| (c) Text stitched from non-adjacent passages | **No prose stitching.** Only the 4 disclosed button pairs (D6). Every prose block is a contiguous substring of its source. |
| (d) Markup stripping that changed wording | **No.** Zero wording changes. One entity left unstripped (D1) — the opposite error. |
| (e) "Failure" samples that are actually something else | **No mislabels.** 33/33 BB screen IDs and 31/31 FoC passage names match their labels exactly. The taxonomy is loose (a negotiation refusal and a friendly-fire injury both count as "failure") but nothing is *misattributed*. |
| (f) CK3 mod conflated with vanilla | **No.** Labelled three times over; the file explicitly states no vanilla CK3 text was obtainable. |

No fabricated passage was found in either file. No dead source was found in either file
(85/85 wiki pages, 41/41 raw URLs, 4/4 repos live).

---

## 5. Bottom line — what is safe to rely on

**Safe to rely on, without reservation:**

- **All 125 KoDP / Six Ages blockquotes** as verbatim in-game event prose, including every
  `<slot>`. Character-for-character verified against live wikitext, all inside `{{quote}}`
  templates. The `_[wiki context: …]_` labelling is honest: all 29 are genuine editor prose
  and are correctly excluded from the quoted text.
- **All 145 mercenary-game blockquotes** as verbatim strings from the cited data files.
- **Every structural label in file 2**: BB screen IDs, BB alternate indices and totals, FoC
  outcome grades, WM whole-file claims, CK3 loc keys. 100 % accurate — this is the strongest
  part of either document.
- **All 145 stated word counts.**
- **The CK3 section's provenance labelling.** Use the slot syntax and event shape as
  representative of CK3; treat the wording as fan-written, exactly as the file says.

**Rely on with a caveat:**

- **The two headline counts in file 2** ("49 samples", "152 quoted pieces"). Use **48** and
  **145**. Nothing is missing — the denominators were computed from headings, not content.
- **Fort of Chains as "the original authors' text"** (D9). The fork is a live, renamed
  project ("Galvanized") and upstream is unreachable behind Cloudflare. Treat FoC samples as
  *fork* text of uncertain identity with the original. The file's section header overstates
  this; its appendix is honest about it.
- **Long-term reproducibility** (D10): all GitHub citations float on `HEAD`. If these samples
  matter, pin commit SHAs.

**Do not rely on:**

- Nothing. There is no passage in either file that I would flag as fabricated, reworded,
  mislabelled as to its source, or misattributed as to its game.

**Most serious problem found:** D9 — the Fort of Chains section header states as fact
("quest text is unchanged from the original") a claim the same document's appendix admits it
cannot certify, and which I could not independently verify because upstream is Cloudflare-
blocked. It is a provenance-confidence problem, not a fidelity problem: the text *is* verbatim
from the repo cited. Everything else found was cosmetic or a small arithmetic overcount.
