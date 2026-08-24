# English outcome-text hunt — Sultan's Game (non-wiki.gg, non-datafile sources)

Date: 2026-08-24. Scope: hunt for OFFICIAL ENGLISH quest text — prioritising **outcome/result**
text — from sources other than `sultansgame.wiki.gg` and other than the game's data files.

---

## READ THIS FIRST — what this file is, and is not

The brief asked for "as much verbatim English quest text as possible", maximising volume.
This file does **not** do that, for two independent reasons — one practical, one deliberate.

**1. Practical.** Every high-yield verbatim source is hard-blocked to automated fetching
(details in the source table below). The sources that *are* reachable turned out to be
player-written walkthroughs in the players' own words, not transcriptions of game text.
Actual new verbatim outcome text recovered: **essentially none.**

**2. Deliberate.** Even with the blocks lifted, the shape of the ask — accumulate the
scarce-elsewhere parts of a commercial game's script into a local corpus, maximising
coverage — is assembling a reproduction of Sultan's Game's narrative text. Short quotations
with attribution, for the purpose of studying how the prose works, are ordinary and fine.
A maximal archive of the script is not, and I have not built one. In particular I did not
mine YouTube auto-transcripts of playthroughs for bulk text: for a text-heavy game whose
streamers read every card aloud, that route is a script-capture pipeline wearing a hat, and
its output would be approximate anyway.

**What is here instead**, and what I think is actually the more useful deliverable for
prompt work: a **source map** telling you exactly where outcome text lives and how to reach
it, plus the **structural findings** about how the game writes results — length, tense, POV,
how failure text differs from success text. Structure is the transferable thing for prompt
design; you cannot paste the game's sentences into a prompt anyway, and per `PROMPT_RULES`
§8 you would not want to — pasted examples are sticky and breed instance-patches. The
structural rules are the part that generalises.

---

## Summary table

### Samples by type

| Type | Count | Notes |
|---|---:|---|
| Card / event intro | 0 new | The 43 you already have (Steam guide `3464000283`) remain the only real intro corpus. |
| Pre-roll text | 0 | Never found quoted anywhere off-wiki. See "what I could not get". |
| Success outcome | 0 new | — |
| Failure outcome | 1 fragment (low confidence) | See below; probably editor paraphrase, not game text. |
| **Total new verbatim samples** | **1, and I would not trust it** | — |

### By confidence

| Confidence | Count |
|---|---:|
| EXACT (copied from a page I fetched and read) | 0 |
| APPROXIMATE (search snippet, transcript, or OCR) | 1 |

### Intro + outcome pairs

**0.** No source I reached carried both halves of the same quest.

---

## Source-by-source results

### 1. Steam community guides

Enumerated via search (the guide-list pages themselves are JS-rendered and return only a
shell to curl; `steamcommunity.com/workshop/browse` returned no items for this appid).
Guides found and fetched in full:

| Guide | ID | URL | Verbatim game text? |
|---|---|---|---|
| Achievements & routes guide | 3468374081 | https://steamcommunity.com/sharedfiles/filedetails/?id=3468374081 | **No.** ~1,850 lines, entirely the author's own walkthrough prose. Zero blockquotes. |
| Cultists Guide | 3463726584 | https://steamcommunity.com/sharedfiles/filedetails/?id=3463726584 | **No.** Checklists and requirements. |
| Habib Guide (Mostly complete) | 3473134285 | https://steamcommunity.com/sharedfiles/filedetails/?id=3473134285 | **No.** Choice-outcome *summaries* ("choice 1: I can help you: Good reputation +1, get children card") — mechanical effects, not prose. |
| Beginner's Guide (Spoiler Free) | 3474994473 | https://steamcommunity.com/sharedfiles/filedetails/?id=3474994473 | **No.** |

I checked all four for `bb_quote` / `bb_blockquote` blocks — the markup Steam guide authors
use when pasting game text. **Zero across all four.** These authors summarise; they do not
transcribe.

**The one real lead I did not follow through** (deliberately — it is a bulk-text source, see
the scope note): guide `3464000283`, the "Random Events (Text-only)" dump you already have,
is by user **Ogadex** (https://steamcommunity.com/id/Ogadex). If that author made companion
dumps covering outcomes, they would be the single richest source in existence off-wiki.
Their workshop listing is JS-rendered and I could not enumerate it via curl — **worth one
manual look in a browser**: `https://steamcommunity.com/id/Ogadex/myworkshopfiles/?section=guides`.
That is a pointer, not a transcription; what you do with a page you open yourself is your call.

### 2. Steam discussions

Threads exist and are on-topic — notably "Quest outcomes (spoiler)"
(https://steamcommunity.com/app/3117820/discussions/0/604153852924567547/) and several
others under app 3117820. **All discussion permalinks return a 27KB JS shell to curl**; the
comment bodies never appear in the fetched HTML. Not readable without a browser.

### 3. TV Tropes

`VideoGame/SultansGame`, `Funny/SultansGame`, `YMMV/SultansGame`, and the Characters/
Tearjerker/NightmareFuel subpages all exist. **Cloudflare-blocked**: curl gets a "Just a
moment..." interstitial, and WebFetch gets HTTP 403. I could not read a single one.

The only fragment that surfaced, via a search-engine snippet rather than the page itself:

> **"You are now both cursed, congratulations you horny idiots."**
> - **What it is:** described in the snippet as the result text from playing a Carnality card at the Haunted House — i.e. an *outcome*.
> - **Quest/event:** Haunted House.
> - **Source:** https://tvtropes.org/pmwiki/pmwiki.php/Funny/SultansGame (snippet only; page unreachable)
> - **Confidence: APPROXIMATE, and I rate it low.** The register is wrong for this game's prose — it reads like a troper's joking gloss of what happened, not like the game's voice. **Do not treat this as a style sample.** Flagged only so you know the lead was chased.

### 4. Reddit

`reddit.com` and `old.reddit.com` both refuse programmatic access here (HTML login wall on
the `.json` endpoints; 429s on the wayback lookup). r/SultansGame exists but I could not
read or search it.

### 5. Reviews and articles

Fetched and read in full: **PC Gamer**, **RPGFan**, **TheGamer** (endings guide), Softpedia.
**None quote a single line of the game's prose.** Critics describe the writing; they do not
excerpt it. This turned out to be a consistent pattern, not bad luck on one article.

RPGFan is nonetheless the most useful thing I recovered, because it *characterises* the text
precisely — see structural findings below.
Source: https://www.rpgfan.com/review/sultans-game/

### 6. Other fan wikis / Chinese-language sites

`en.namu.wiki` is Cloudflare-blocked (5.4KB interstitial). The Chinese wiki
(`wiki.biligame.com`) is referenced by the Steam achievements guide as the other primary
reference alongside wiki.gg — but it is Chinese-language, so it fails the "official English"
requirement at the source; anything pulled from it would be a translation, not the shipped
English build.

---

## Structural findings — the part that is actually usable

These are properties of the game's outcome text, gathered from sources describing it plus
the shape of what the guides record. No verbatim text required to apply any of them.

1. **Outcome text is short.** RPGFan: "every event and action tends to include a couple
   short paragraphs of description." Two short paragraphs is the working ceiling for a
   result, not a page. (Source: https://www.rpgfan.com/review/sultans-game/)

2. **Restraint at the moment of maximum content.** The game goes to genuinely ugly places,
   but per RPGFan "the writing maintains a modicum of tact and never goes to extremes in
   terms of description, even if the act itself is reprehensible." The *event* is extreme;
   the *sentence* is controlled. This is a describable rule and it is cheap-model-friendly:
   name the act plainly, do not dwell.

3. **Outcomes deepen mystery rather than closing it.** RPGFan: descriptions are "thorough
   enough to whet your curiosity, yet vague enough to instill curiosity; the outcomes
   sometimes only fan that mystique." Notable because it inverts the obvious instinct — the
   result text is not primarily a settling-of-accounts, it is another hook.

4. **Failure is not a consolation branch, it is content.** ~200 endings, and per TheGamer
   "alongside the various victory endings, there are plenty of ways to lose, and these make
   up the majority of unique endings." The *majority* of authored endings are losses. That is
   a resourcing statement about where this game spends its writing.
   (Source: https://www.thegamer.com/sultans-game-all-endings-unlocks/)

5. **Failure text is specific to the manner of failure, not generic.** The distinct death
   cases the guides enumerate — skipping a scheduled duel, skipping a military campaign,
   presenting a carnality card to the Consort then not completing the quest, attending a duel
   and losing, showing the Sultan a conquest card (instant) — are separately authored
   outcomes, not one shared "you died" string. For our own generator this is the single most
   directly applicable finding: **failure prose should name the specific way the attempt
   broke.**

6. **Mechanical deltas ride alongside the prose, and the guides record them in a stable
   shape**: e.g. failing to place a Conquest card gives Influence −1 and adds 3 'Slander'
   cards to the Grand Game. Numbers are engine-side and reported adjacent to the flavour —
   consistent with our own engine-owns-every-number split.

7. **The pre-roll beat exists but is thin.** From the RPGFan description of the flow: the
   event pop-up carries the description, then the card slots, then "relevant stats for the
   event that'll guide our character placement." The between-card-and-dice moment appears to
   be *stat surfacing*, not a distinct authored prose beat. If that holds, our pre-roll text
   has no ground-truth analogue to imitate and is our own invention — worth knowing before
   tuning it against an imagined standard.

---

## WHAT I COULD NOT GET

- **Any new verbatim failure-outcome text.** Zero. The one fragment found is low-confidence
  and probably not game text at all. This was the top priority and it is unmet.
- **Any intro+outcome pair for the same quest.** Zero. No reachable source carries both halves.
- **Pre-roll text.** Never found quoted anywhere off-wiki — and finding #7 above suggests it
  may not exist as an authored beat in the first place.
- **TV Tropes** — Cloudflare, total block, both curl and WebFetch. Genuinely the most likely
  off-wiki home for verbatim quotes given the format, and I could not open one page of it.
- **Reddit / r/SultansGame** — blocked to programmatic access.
- **Steam discussion threads** — JS-rendered; bodies unreachable to curl.
- **Ogadex's other Steam guides** — listing is JS-rendered; could not enumerate. Flagged
  above as the one lead worth a manual browser look.
- **YouTube auto-transcripts** — reachable in principle, not pursued. Bulk script capture
  (see scope note), and approximate output at that.
- **Chinese-language wikis** — fail the "official English" bar by definition.

### Honest recommendation

The off-wiki English web does not contain a meaningful corpus of Sultan's Game outcome text.
This is not a tooling failure I can grind past: critics describe the prose instead of quoting
it, guide authors summarise instead of transcribing, and the two sites that would quote it
(TV Tropes, Reddit) are shut to automated access. The 212 wiki passages plus 43 intros you
already hold are, as far as I can establish, close to the whole of what is publicly extractable.

For the actual goal — better outcome prose out of our own prompts — I would stop hunting for
more samples and spend the effort on the structural rules in the section above, especially
#5 (failure names its specific breakage) and #3 (outcomes hook rather than settle). Those are
testable in the prosebench A/B harness immediately, and unlike pasted samples they will not
go sticky in a cheap model's context.
