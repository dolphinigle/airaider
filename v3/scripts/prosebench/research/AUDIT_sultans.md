# Adversarial fidelity audit — `samples_sultans.md`

Audited 2026-08-24. Auditor assumption: the file is wrong until proven otherwise.
Every source was re-fetched live; no summarising fetch tool was used anywhere.

---

## 1. Sampling method

The brief asked for ≥15 quotes on a reproducible every-Nth scheme. That was done —
and then, because the sources were cheap to fetch in bulk, three of the four parts were
put through a **full census** rather than a sample. Both are reported.

| Part | Reproducible sample | Census actually run |
|---|---|---|
| 1 | every 20th `In-game text (verbatim)` block → items #1, 21, 41, 61, 81, 101, 121, 141, 161, 181, 201 (11 items) | **all 216**, machine-compared against the `{{quote}}` bodies of all 98 cited pages (fetched via `action=parse&prop=wikitext`) |
| 2 | every 90th blurb → #1, 91, 181, 271, 361, 451, 541, 631, 721, plus the last (#738) (10 items) | markup-contamination scan over all 738 |
| 3 | all 10 rites; translations read line-by-line for 5 of them (5000131, 5000703, 5000581, 5000630, 5000796, plus 5000201 intro) | **all 93 Chinese quote blocks** matched character-for-character against the raw `rite/*.json`; all 4 `[OFFICIAL EN]` claims re-verified on the wiki |
| 4 | every 10th event → #1, 11, 21, 31, 41 | **all 43** matched against the Steam guide HTML |

Normalisation used for the machine comparison: wiki markup stripped (`[[…]]`, `'''`,
`{{stat|…}}`, `<br>`, HTML tags), curly quotes/dashes/ellipses folded, whitespace
collapsed, case-folded. Any difference surviving that is a real difference.
For PART 3 the Chinese was compared with **all whitespace removed** — i.e. character-for-character.

---

## 2. Item-by-item results

### PART 1 — the every-20th sample

| # | Page | Section | Verdict | Evidence |
|---|---|---|---|---|
| 1 | 1001 Nights | page lead | VERIFIED | inside `{{quote|text=…}}` on the page |
| 21 | Adila | Adila's Confrontation | VERIFIED | exact inside `{{quote}}` |
| 41 | Alim | One Hand for Goods | VERIFIED | exact inside `{{quote}}` |
| 61 | Canyon of Gales | page lead | VERIFIED | exact; also cross-checks against the Chinese in PART 3 |
| 81 | Fardak | First Sight | VERIFIED | exact inside `{{quote}}` |
| 101 | Haunted Mansion | Night's Shelter | VERIFIED | exact inside `{{quote}}` |
| 121 | Killing the Fierce Lion | Final Demand | VERIFIED | exact inside `{{quote}}` |
| 141 | Malkina | An argument | VERIFIED | exact inside `{{quote}}` |
| 161 | Retainers | Guesthouse Retainers | **MISMATCH (contamination)** | file's "verbatim in-game text" ends with the template parameter `\|author=Description of every retainer in the Gu…` — wiki markup that the file's own provenance rules promise was stripped |
| 181 | The Ancient Mirror | Recruiting | VERIFIED | exact inside `{{quote}}` |
| 201 | War of Faith and Reason | page lead | VERIFIED | exact inside `{{quote}}` |

**Sample result: 10 VERIFIED / 1 MISMATCH.**

### PART 1 — full census of all 216

| Check | Result |
|---|---|
| Quote located inside a genuine `{{quote}}` template on the cited page | **216 / 216** — no fabrication, no wiki-editor prose smuggled in as game text, no dead page (all 98 pages returned 200) |
| Text within the located quote is character-exact after markup stripping | **216 / 216** |
| Quote reproduces the **whole** `{{quote}}` body | **190 / 216** — 26 are silently truncated (see §3.1) |
| Free of leftover wiki markup | **212 / 216** — 4 carry `\|author=`, 1 carries `&nbsp;` (§3.3) |
| Entry is actually a prose passage rather than a card title | **211 / 216** — 5 are title fragments (§3.2) |
| Distinct texts | **210 / 216** — 6 rows are duplicates of another row (§3.5) |

### PART 2 — the every-90th sample

| # | Card | Verdict | Evidence |
|---|---|---|---|
| 1 | "Gold Coin" | VERIFIED | exact `\|Description=` on page `"Gold Coin"` |
| 91 | Broken Gold Sword | VERIFIED | exact `\|Description=` |
| 181 | Elegant Blue Gauze | VERIFIED | exact `\|Description=` |
| 271 | Guesthouse | VERIFIED | exact `\|Description=` |
| 361 | Lady Becky | VERIFIED | exact `\|Description=` |
| 451 | Occultist | VERIFIED | exact `\|Description=`; text is the shared retainer blurb, and it does appear on the `Occultist` page, so the name label is correct |
| 541 | Shadows of Assassination | VERIFIED | exact `\|Description=` |
| 631 | The Ashen Blade | VERIFIED | exact `\|Description=` |
| 721 | Wife's Resentment | VERIFIED | exact `\|Description=` |
| 738 | Ziad | VERIFIED | exact; the file correctly dropped the trailing `}}` that closes the infobox |

**Sample result: 10 VERIFIED / 0 MISMATCH.** Census: 1 of 738 lines is contaminated (§3.4).

### PART 3 — all 10 rites

| Rite | Source URL as cited | Chinese verbatim? | Verdict |
|---|---|---|---|
| 5000131 The Observatory | `…/blob/main/rite/5000131.json` | yes | **URL DEAD** / text VERIFIED |
| 5000703 Canyon of Gales | `…/blob/main/…` | yes (17/17 blocks) | **URL DEAD** / text VERIFIED |
| 5000705 Forest of the Jinn | `…/blob/main/…` | yes (19/19) | **URL DEAD** / text VERIFIED |
| 5000835 Sharp Glass Plains | `…/blob/main/…` | yes | **URL DEAD** / text VERIFIED |
| 5000581 God-Hunting | `…/blob/main/…` | yes (16/16) | **URL DEAD** / text VERIFIED |
| 5001029 Court Duel | `…/blob/main/…` | yes (7/7) | **URL DEAD** / text VERIFIED |
| 5000506 In the Name of God | `…/blob/main/…` | 2 defects (§3.6) | **URL DEAD** / text MOSTLY VERIFIED |
| 5000201 Taming Ritual | `…/blob/main/…` | yes | **URL DEAD** / text VERIFIED |
| 5000630 Injured White Rhino | `…/blob/main/…` | yes (16/16) | **URL DEAD** / text VERIFIED |
| 5000796 The Sultan's Game | `…/blob/main/…` | yes (14/14) | **URL DEAD** / text VERIFIED |

Census of the Chinese: **91 of 93 quote blocks are character-for-character identical** to
the shipped config. The 2 exceptions are in §3.6.

`[OFFICIAL EN]` labelling — all four claims re-checked on the wiki:

| Marked line | On the wiki? | Verdict |
|---|---|---|
| Canyon of Gales intro | yes, page `Canyon of Gales` | VERIFIED, exact |
| Forest of the Jinn intro | yes, page `Forest of the Jinn` | VERIFIED, exact |
| Sharp Glass Plains intro | yes, page `Sharp Glass Plains` | VERIFIED, exact |
| God-Hunting intro | yes, page `God-Hunting` | VERIFIED, exact |

No English is passed off as official that isn't. Every other English line in PART 3 sits
under an explicit `*(my translation)*` marker (121 of them). Character names in the
translations (Jabal, Badriyyah, Mahir, Nabhani, Iman, Faraj, Bharat) were checked against
the wiki and **all match the official English spellings** — the translator did not invent names.

### PART 3 — translation spot-checks (§3 of the brief)

| Rite | Line | Verdict | Note |
|---|---|---|---|
| 5000131 | intro (orrery / copper plate) | VERIFIED | faithful, no added imagery |
| 5000131 | result (`乙太平衡器…会自动…同频`) | DRIFT (mild) | `会自动` = "automatically"; rendered "tunes itself, **unbidden**" — adds a note of volition the Chinese does not have |
| 5000703 | 2nd intro paragraph | VERIFIED | faithful |
| 5000703 | `settlement_extre[5]` (`拼死将其他人带出了峡谷`) | DRIFT (mild) | `拼死` = "at the risk of his life"; rendered "at desperate **cost**", which implies casualties incurred |
| 5000581 | `settlement_extre[0]` (`最先到来的是令人舒爽的风`) | **DRIFT — added imagery** | "a wind that feels good **on the skin**". `令人舒爽` is just "refreshing / pleasant"; the skin is the translator's |
| 5000581 | same block (`然后是颤抖的指北星`) | DRIFT (mild) | Chinese: *the trembling pole star* arrives; English: *the trembling of the pole star* arrives |
| 5000630 | `settlement_extre[1]` (`发狂般地挣扎、奔跑`) | DRIFT (mild) | `发狂般地` = "as if maddened"; rendered "like something **possessed**", importing a supernatural note |
| 5000630 | intro, stalk, miss branches | VERIFIED | faithful |
| 5000796 | intro, `settlement[0]`, `settlement_extre[9]` | VERIFIED with smoothing | content faithful; single Chinese sentences are repeatedly split into two English ones, and `“是吗，那就取悦我吧。”` gains an inserted "**and says:**" |
| 5000201 | intro | VERIFIED | faithful; the discourse particle `反正` is dropped, no content added |

**No translation was found to invent an event, a character, or a plot beat.** The drift is
uniformly at the level of a single idiomatic upgrade per paragraph — the English reads a
little better than the Chinese, in a consistent direction. That matters because the file
claims (last section) *"I kept it literal (clause order and punctuation follow the
Chinese)"*. The sentence-splitting alone falsifies the punctuation half of that claim.

### PART 4 — all 43 events

| Check | Result |
|---|---|
| Guide reachable and correctly identified | VERIFIED — `id=3464000283`, `<title>` = "Steam Community :: Guide :: Random Events (Text-only)" |
| Intro text present verbatim in the guide | **43 / 43 VERIFIED** |
| Truncation | none beyond what the file discloses; the text immediately following each quoted intro in the guide is the numbered outcome/stat list the file says it cut |
| Duplicates | none |
| Labelling | correct — headed "community-transcribed English", with an explicit "high but unverified" fidelity caveat |

PART 4 is the cleanest part of the file.

---

## 3. Discrepancies, quoted in full

### 3.1 Twenty-six PART 1 quotes are silently truncated (the serious one)

The file presents each as `**In-game text (verbatim):**` with no ellipsis and no note.
In each case the `{{quote}}` body on the wiki continues past where the file stops, and
**the dropped remainder appears nowhere else in the file** (checked by searching every
sentence of each remainder against the whole document).

Two representative cases, quoted in full:

**#120, `Jinn Lantern` → "Break the Lantern"**
- claimed (file, complete entry): `Three errant Jinn are imprisoned here. One for theft, another for illicit love, another for nobility.`
- actual (wiki, complete `{{quote}}` body): `text=Three errant Jinn are imprisoned here. One for theft, another for illicit love, another for nobility.` **`\n\nThey plead persuasively for freedom`**

**#180, `Tempting Opportunity` → page lead**
- claimed (file, complete entry): `With frequent thefts occurring, the Purist Order invites a faithful person of your reputation to guard the Sacred Light Source - their aether storage.`
- actual (wiki): same, then `<br>` then **`What a fortunate situation - like a mouse falling into a rice bin!`**

The pattern is mechanical: the extractor stopped at the first blank line or `<br>` inside
a quote body. The full list of affected entries, with file-length vs source-length in
normalised characters:

`#47 Alim (478/1143)` · `#53 Arzuna (13/258)` · `#54 Asal (95/684)` · `#80 Fardak (97/166)` ·
`#87 Fire Dragon Scales (233/539)` · `#94 Guesthouse (195/259)` · `#95 Guide:Rod of Life (375/1327)` ·
`#99 Habib (118/525)` · `#120 Jinn Lantern (101/137)` · `#142 Malkina (411/1797)` ·
`#146 Midnight Blade (51/107)` · `#153 Nawfal (197/447)` · `#157 Purist Order (113/365)` ·
`#159 Regicide (336/611)` · `#167 Roaming Swordsman (206/542)` ·
`#174–#176 Sultan's Nipple Chains (126/356 ×3)` · `#177 (14/218)` · `#178 (16/247)` · `#179 (10/208)` ·
`#180 Tempting Opportunity (150/218)` · `#186 The Ancient Mirror (Noble) (107/565)` · `#187 (43/510)` ·
`#194 The Protagonist/Twin (26/153)` · `#199 Under the Sultan's Gaze (108/338)` · `#203 War of Faith and Reason (89/94)`

Why this is the worst finding in the file: this corpus exists to study *prose craft*.
The dropped material is disproportionately the **payoff** — the ironic closing beat
(`like a mouse falling into a rice bin!`), the reversal, the last line of a scene. Reading
these 26 entries as complete passages teaches the wrong lesson about how the game's
paragraphs land. In the worst case (`#142 Malkina`) 77% of the passage is missing.

### 3.2 Five entries are card *titles*, not passages

Same mechanism as 3.1: the `{{quote}}` body opens with a bolded outcome title, then `<br>`,
then the prose. Where the split fell after the title, the file kept the title and threw the
prose away — yet still counted the row as one of its 216 "passages":

| # | Page | Entire "verbatim in-game text" in the file | What the wiki quote actually contains |
|---|---|---|---|
| 53 | Arzuna | `◆ Noble Blood` | title + a 245-char paragraph about Malkina dressing Arzuna |
| 177 | Sultan's Nipple Chains | `Poor lmitation` | title + the beheading paragraph |
| 178 | Sultan's Nipple Chains | `Rightfully Yours` | title + a 230-char paragraph |
| 179 | Sultan's Nipple Chains | `Wont FIoat` | title + a 198-char paragraph |
| 194 | The Protagonist/Twin | `◆ That which is &nbsp; not` | title + a 127-char paragraph |

(The typos `lmitation` / `Wont FIoat` are the wiki's own, not the file's — the file's
caveat about wiki editor typos is honest.)

Note this makes the `Arzuna` and `The Protagonist/Twin` pages contribute **zero** actual
prose to the corpus while still counting toward "98 quests".

### 3.3 Four PART 1 entries retain wiki template parameters inside the "verbatim" text

The file's provenance rules state: *"Wiki markup … has been stripped; the words themselves
are untouched."* Not true for these four, where the `|author=` parameter is presented as
part of the in-game text:

- `#78 Escape from the Sultan's Game`: `…leave this dog-eat-dog hellhole…"` **`|author=Maggie`**
- `#92 Guesthouse` and `#161 Retainers` (same text, twice): `…undying loyalty."` **`|author=Description of every retainer in the Gu`** — note it is even cut off mid-word, so the row is simultaneously contaminated *and* truncated
- `#97 Habib`: `…he must taste it for himself.` **`|author=Gluttonous Noble`**
- `#194` additionally carries a raw `&nbsp;` entity.

### 3.4 One PART 2 line is a raw infobox dump, not a blurb

Line 43 of PART 2, `**Arumina**`. Claimed as a card blurb; what is actually there is the
blurb followed by ~15 unstripped infobox parameters:

`The prideful and willful Arumina is the light of Jawad's life. |Zephyr's Wife_Description="She was once a noble lady. Now she is a humble slave." |1_Tags=Female, Noble |2_Tags=… |Zephyr's Wife_Physique=1 |Zephyr's Wife_Charisma=1 |Zephyr's Wife_Sociability=1`

The underlying words are genuine wiki content, but this row is not a "card blurb" and would
poison any automated style measurement run over PART 2. It is the only such row in 738.

### 3.5 Six of the 216 PART 1 rows are duplicates

210 distinct texts, 216 rows. `Sultan's Nipple Chains` repeats one passage three times
(rows #174/#175/#176 — the wiki genuinely repeats it under three different outcomes, but
the file does not say so); `Alim` repeats one; `Investigate Evidence` repeats one; and one
passage appears on both `Lumera` and `Fardak`, and another on both `Guesthouse` and `Retainers`.

### 3.6 Two PART 3 Chinese defects

**(a) Added ellipsis** — rite 5000506, `settlement[4]`. The file quotes, as verbatim Chinese:
`……而拜铃耶，她被押下去、…` The shipped field does **not** begin with `……`; it begins
`祭司们认出了拜铃耶的脸，…` and the quoted clause is its tail. The file does flag this
in prose (`*(same opening as above, plus)*`), so it is disclosed — but the `>` block itself
is not character-exact. This is the **only** one of 93 Chinese blocks that fails a
character-for-character match.

**(b) Undisclosed truncation** — rite 5000506, `settlement[5]`. The file quotes 52
characters (`拜铃耶踏进神殿的那一刻…狂笑。`); the shipped `result_text` is 183 characters
and continues with two further sentences. No ellipsis, no note.

### 3.7 All ten PART 3 source URLs are dead

Every PART 3 `Source:` line points at
`https://github.com/liwenhao0427/sultans-game-config/blob/**main**/rite/<id>.json`.

- `blob/main/rite/5000131.json` → **HTTP 404**
- `blob/master/rite/5000131.json` → **HTTP 200**
- GitHub API `/branches` for that repo returns exactly `['master']`. There is no `main`.

So the repo, the path and the files are all real and the content verifies — but a reader
following any of the ten citations gets a 404. Fix is a one-character-class edit:
`main` → `master` in ten lines.

### 3.8 PART 2 has no per-item sources at all

738 blurbs, one blanket sentence of provenance, zero URLs. Every sampled item was
nonetheless traceable in one API call via `insource:"…"`, so this is a
*citation-hygiene* failure rather than a fidelity failure — but it means nothing in
PART 2 can be spot-checked without a search step, and there is no record of which of the
wiki's several `*_Description=` variants (tab variants, `Zephyr's Wife_Description`, etc.)
each line came from.

### 3.9 Labelling discipline (brief item 4) — verdict: honest

Checked specifically for the failure mode of translation or community text being passed off
as official English. **Not found.**
- Every PART 3 English line is either under `*(my translation)*` (121 markers) or marked
  `[OFFICIAL EN]` (4 lines, all 4 independently confirmed on the wiki, all 4 exact).
- PART 4 is headed as Steam-guide community transcription with a fidelity caveat.
- PART 1 `Context before:` / `Context after:` lines are consistently annotated
  *"(wiki's own words, not game text)"* — and spot-checking confirms the editor prose stayed
  in those lines and never leaked into a `>` block.
This is the file's strongest quality. The four `|author=` leaks (§3.3) are the only place
where non-game text sits inside a "verbatim" block, and even those are template metadata
rather than editorial paraphrase.

---

## 4. Verdict on the headline counts

| Claim | Counted | Verdict |
|---|---|---|
| 216 passages | 216 `In-game text (verbatim)` blocks | **True as a row count; overstated as a passage count.** 5 rows are card titles with no prose (§3.2) and 6 rows duplicate another row (§3.5). Distinct actual passages ≈ **205**, of which 26 are partial. |
| 98 quests | 98 `##` sections, 98 unique source URLs, all 98 pages live | **Count true, noun false.** These are 98 wiki *pages*, not quests. The set includes character pages (Adila, Maggie, Malkina, Zaki, Zephyr…), item pages (Gold Coin, Jinn Lantern, Midnight Blade), mechanics pages (Fate's Ledger, Sultan Cards, The Court, Retainers), an achievements page (1001 Nights), a joke/easter-egg page (Metal Gear Solid: The Phantom Pain) and one *guide* page (`Guide:Rod of Life`). Fewer than half are quests/rites. |
| 738 blurbs | 738 `- **…** — …` lines, 0 duplicates | **True.** 737 are clean; 1 is an infobox dump (§3.4). |
| 10 rites | 10 `## Rite` sections, all 10 files real | **True.** (The "~90 passages" sub-claim is also true: 93 Chinese quote blocks.) |
| 43 events | 43 `### Event` headings, 43 intro blocks, 43 quotes | **True**, and all 43 verified against the guide. |
| "Nothing here is paraphrased" (line 3) | — | **True in the strict sense** — no invented or reworded English was found anywhere in PART 1/2/4. But it is misleading as written, because it invites the reader to assume completeness, and 26+1 passages are silently amputated. |

---

## 5. Bottom line

**Fabrication: none.** Not one quote in PART 1, 2 or 4 was invented, reworded, or
attributed to a source that doesn't contain it. Every cited wiki page exists; the Steam
guide exists and matches; the GitHub rite files exist and their Chinese matches
character-for-character. The nightmare failure modes for a corpus like this —
a translation smuggled in as official English, a wiki editor's paraphrase quoted as game
text, a hallucinated passage with a plausible URL — were all searched for specifically and
**none were found**.

What the file has instead is a **completeness** problem and a **citation-hygiene** problem.

Safe to rely on as-is:
- **PART 2 (738 card blurbs)** — the strongest part. 10/10 exact on sample, 737/738 clean
  on census. Drop or repair the `Arumina` line and it is publication-grade. Add per-item
  page names if anyone else will ever need to re-check it.
- **PART 4 (43 event intros)** — 43/43 exact against the cited guide, correctly labelled as
  community transcription with an honest caveat. Its fidelity to the *shipped* English is
  still unverified, exactly as the file says.
- **PART 3 Chinese** — 91/93 character-exact; the 2 exceptions are both in rite 5000506 and
  both minor. **Fix the ten dead URLs (`main` → `master`) before this part is cited anywhere.**
- **PART 3 `[OFFICIAL EN]` lines** — 4/4 exact, correctly attributed. Trustworthy.

Needs a caveat before use:
- **PART 1** — 216/216 authentic, but treat every entry as *possibly a fragment*. Do not use
  PART 1 to study passage length, paragraph count, or how a passage ends, and do not use it
  to compute any per-passage statistic, until the 26 truncations in §3.1 are re-extracted
  and the 5 title-only rows in §3.2 are either filled in or deleted. Excerpt-level
  observations (sentence rhythm, diction, register) are safe now.
- **PART 3 English translations** — usable for *content and structure*, which is what the
  file says they're for. Do **not** treat them as evidence about the game's prose style, and
  discount the file's "I kept it literal" claim: the translator consistently splits Chinese
  sentences, and in at least four places upgrades a plain phrase into a nicer image
  (`令人舒爽的风` → "a wind that feels good on the skin"). The English is a touch better
  written than the Chinese, in a consistent direction. Nothing was invented at the level of
  event or character.

Single most serious problem: **§3.1 — 26 of the 216 PART 1 passages stop mid-quote with no
ellipsis and no note, and the dropped remainder (which is usually the passage's closing
beat) appears nowhere in the file.** For a corpus whose whole purpose is studying how these
paragraphs are built and how they land, that is worse than a dead link.
