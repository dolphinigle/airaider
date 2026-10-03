# STORYTELLER — the saga storyteller, rebuilt (v4)

**Status: PLAN, 2026-10-01 — the designer answered the rulings the same day (§D below); what they left open is decided by the lab, not on paper.**

> *"the writing quality is still not great… i just want the quests to be readable."*
> *"The saga system story in particular is horrendous, its like reading a jumbled random texts… wtf is that, why am i interested. i think your goal is to start simple with a WORKING storyteller, doesnt have to write like a novelist, just write something players can follow and interesting."*
> *"pls dont just patch it ofc. fix properly, and plan ofc."*

Once signed, this is the saga spec and wins over the sections in §4.6, whose **designer-overturned 2026-10 (STORYTELLER.md)** banners (and `GENERATION_FLOW.md` §22) are written at G2. It grafts designs A, B, C (`scratchpad/stplan/design_*.md`) onto C's base, using the judges' scores, `understand_evidence.md` and a critic's 35 corrections. Unmeasured choices name the lab step that measures them.

🔒 locked once ruled · 🛠 tunable · 🟡 open · ⏳ awaiting a ruling.

## D. The designer's answers (2026-10-01) — they amend everything below

> **PRIORITY (designer, 2026-10-01): *"key and most important point is followable though. repetition is almost acceptable as long as its followable. pls dont forget the previous one were not even followable or even easily readable."***
> *"just rmb repetition can be 'fixed' later by seeding. thats the key part, the design must support this in the future. so if currently its not thats fine."*
> **Requirement, not a metric:** the plan call takes a **dealt `seed` input from day one** (a theme from the library, optionally a few atoms), chosen by the engine from `storyRng` through ONE dealer function. Fixing repetition later = adding seed content or changing the dealer — never a prompt change and never a redesign. The ≥ 1,000-theme library ships as the first content of that slot; its size and quality can grow afterwards.
> So every choice and gate ranks: **(1) FOLLOWABLE** — M1 (the cold reader's paraphrase is right), M5 (no rereads), M2 (easy on one read) — **(2) wants the next part** (M3) — **(3) not repetitive** (M19). Repetition never outranks followability: an arm that is easier to follow wins even if it repeats more; M19 only breaks ties and is watched, never a blocking gate.

> *"no idea, i think you should test which one is better esp when repeated. my worry if too constrained is that it becomes repetitive / noticeably repetition. the usual way to make it non repetitive is to compile by hand a list of 1000+ 'themes' to feed to ai as 'seeds'."* · (card rules) *"same no idea"* · (old sagas) *"just delete all saves"* · (order) *"no idea you decide"*

1. **Story structure is TESTED, not ruled (replaces the R2 structure ruling).** Three arms play the same fixtures (`AIRAIDER_STORY_ARM`):
   - **S — shaped:** the engine deals a shape + job types (§2.4.1) *and* a theme seed.
   - **L — loose:** the engine deals only a theme seed; the plan call chooses the jobs, each from the fixed job-type list (so asks still derive from the type — mechanics stay engine-owned in every arm).
   - **H — hybrid:** a theme seed + the shape's parts (client · opponent · other) but free job order and types.
   The winner is the arm that is **most followable** (M1, M5, M2); M3 next; repetition (M19) only breaks a tie within the noise band. The designer's worry about constraint → repetition is still measured, but it is secondary.
2. **The theme library (all arms).** A curated list of **≥ 1,000 themes** (concrete situations with a person, a problem and a conflict, 4–12 words, 12 category groups; `v3/src/engine/themes.ts`, compiled 2026-10-01 and curated for duplicates and staples). The engine deals ONE per saga from `storyRng`, never repeating within the last 50, balancing tone and scale; it is hidden input — the plan writes the pitch in its own words. Variety is **content, never prompt rules** (CHEAP_MODEL_PROMPTING L12): new themes, not new instructions.
3. **Repetition is a first-class metric (new M19 + reader J4).**
   - **J4 series reader** (1 Opus + 1 gpt-5, fresh): reads **10 sagas of one arm in a row** (card 1, the finale card, the chronicle "so far") and answers: *"As a player who just played these ten, how repetitive did they feel, 0–10? Which ones felt like the same story? What repeats — premise, question, answer, job pattern, opening, phrasing?"*
   - **Mechanical (`mech.ts`):** cross-saga card-1 trigram overlap; title-word reuse; spread of question and answer categories (J2 labels them); spread of job-type sequences; opening-sentence stamps.
   - **M19 is a watch metric, not a gate:** it is reported per arm and breaks ties; it can only flag a problem to the designer (e.g. 'these three sagas read as the same story'). Each arm plays **≥ 20 sagas** for J4 (plan calls ≈ $0.003 each).
4. **Card rules.** **No pay or prize in prose — decided (R4)**: the evidence names pasted pay as a top cause of the jumble. **Names (R5) becomes an arm:** named-from-card-1 vs stranger-labels-until-met, chosen by M1/M11 in Phase 1.
5. **Old saves are deleted at ship (R8 withdrawn).** No lapse path, no migration: when v4 ships, `saves/` is cleared and the designer starts fresh (nothing is deleted while the current build is being played). Phase 2a drops `lapseChain` and the `legacylapse` test.
6. **The rebuild itself (R1, R3)** is judged by the lab: v4 ships only if it beats today's storyteller at G2 (M1, M3, M5, M10) — the designer reads matched pairs. Engine-owned mechanics (R3) stay the default: the readability evidence (rq) shows mechanics inside prose calls cost clarity, and they do not constrain the story.
7. **Order** as planned: sagas → one-offs right after G2 → models (R7) at Phase 5.

---

## 0. The problem and the fix

**Why sagas read as "jumbled random text":** the card is engine atoms glued in prompt order (`understand_code.md` §5).

| sentence on the card | source |
|---|---|
| "Betisa stood at the green and handed the scorched boundary stone…" | rule "open on a person doing something" |
| "She wants the stone taken to Ashworth Hold and Kritias answered at his gate" | `bible.goal`, restated on request |
| "the fee is fixed, and what else shakes loose the company keeps" | the pay pool, pasted |
| "A man who claims the rise, Kritias Ashworth, holds an old timber grant" | the appositive naming rule, on a man never met |
| "Taking the stone there will force him to show his survey or deny the carving" | the WHY demand reading the hidden bible aloud |
| "His gate may be staffed by armed retainers and formal oaths" | obstacle atom + "state it as rumour" |

**Four measured causes:** (1) 1,700–2,200-word prompts of patches; the same data under 150–300 words scored +0.40 and cut rereads 28% → 6% (rq, 520 samples, 3 judges). (2) Dealt pre-written sentences get pasted: 52% of beat-1 words are 4-word spans from the JSON. (3) Genesis plans a procedure (6–7 of 8 arcs: search → token → press → handover; *"their card has a question, ours has an errand"*). (4) Six AI ledgers spoil and contradict.

**The fix, in seven moves.**
1. **One `plan` call replaces genesis and the beat-1 card:** a hidden plan (question and answer, jobs, what each win changes and leaves open), then **last** card 1, written after job 1 exists (A).
2. **Short prose calls:** card ≈ 170 words, report ≈ 230, prose only (C).
3. **The engine owns structure:** shape, job types, people, asks, injuries, edges, finale tests and endings (C, A).
4. **A question spine:** card 1 raises the question; each later card ends on what the last win left open; the finale report brings out the answer (B).
5. **Memory = one read line per job:** a ≤ 25-word summary feeds the chronicle and the next card; no AI ledgers (C, A).
6. **Nothing is dealt that must not be printed:** unmet names, pay, the answer, later jobs (C, B).
7. **Rules cannot pile up:** a per-prompt word budget test and a payload lint (A).

**What the player should get:** one-pass cards (who wants what, what to do, who is in the way) that end on something worth answering; the answer by the finale; no pay in prose; endings on the buttons. **A target, not a result:** the only real v4-style output (C's round 4) was followable but flat (§3.3); §3.2 is hand-written. The designer reads real probe output at G1, before game code.

---

## 1. Goal, success criteria, non-goals

**Goal: a cold player can follow every saga card and report on one read, and wants the next part.** Readable RPG quest text, not novel prose (QUESTS §2 ruling d).

### 1.1 Success criteria
Against **base** (today's storyteller) and **floor** (the mock's templates, §4.4). 0–10 taste scores mean nothing absolutely, so taste targets are relative.

| # | metric | measured by | **target (G3)** | G2 |
|---|---|---|---|---|
| M1 | **Follow, objective** | J2: J1's card paraphrase 3/3 correct (who wants what · what to do · who is in the way) | **≥ 90% and ≥ min(base + 15pp, 97%)** | ≥ 85% |
| M2 | Follow, felt | J1, 0–10 per card | ≥ base + 1.0, above floor | ≥ base |
| M3 | **Want the next part** | J1, 0–10 per report | **≥ base + 1.0, above floor** | ≥ base |
| M4 | Send on card 1 | J1 yes/no | ≥ base, above floor | — |
| M5 | **Reread** | texts where both J1 seats quote a reread | **≤ 10%** | ≤ 15% |
| M6 | Report clarity | J2: J1 right on outcome / on change | ≥ 95% / ≥ 85% | — |
| M7 | Retell | J2: 3 facts (ask, answer, ending) | ≥ 2.5 | ≥ 2.0 |
| M8 | Question answered | J2 | **100%** (by construction) | 100% |
| M9 | Answer not obvious from card 1 | J2 | ≥ 60% | — |
| M10 | **Pair preference** | J3, same fixture and path | **≥ 70% new in both families**, above the Phase-0 calibration | ≥ 65% |
| M11 | Continuity errors | J2 | ≤ 0.3/saga | ≤ 0.5 |
| M12 | Spoilers / unmet-name leaks | J2 + code | **0 / 0** | 0 / 0 |
| M13 | Paperwork plots | J2 | ≤ 1 in 8 jobs | — |
| M14 | Stamps: shared opening trigram · "?" endings | code | ≤ 15% · ≤ 25% | — |
| M15 | Caps held / hard failures (after `callR` retry, repairs, re-draw) | code | ≥ 95% / ≤ 2% | same |
| M16 | **Cost** | call log | **≤ $0.005/beat, ≤ $0.035/saga, never above base** | same |
| M17 | **Latency p50**: pursue→card · card · report | code | **≤ 15 s · ≤ 5 s · ≤ 6 s at G5** | **≤ base** |
| M18 | **Designer** | reads probe sagas (G1), 3 pairs (G2), plays (G6) | **"I can follow it, and I want the next part."** | — |

Priors (other instruments): rereads 37% cards / 54% reports; 15 of 16 caps broken, 10% soft schema errors; ~$0.0027/call; latency ~65–80 · ~14 · ~14 s.

**Noise:** bootstrap 95% CIs over sagas; a gain counts only if its CI excludes zero. M10's reference is the Phase-0 calibration (base B vs regenerated B′), which also measures position bias. No second judged run of A (critic 34 over 27's |A1−A2| floor). **Per-change checks on A; B only at gates.**

### 1.2 Non-goals
Novel prose (~4 style rules is the cheap-model ceiling) · economy and finale mechanics (bank, fates, debt/void, slip → sequel, failure budget, last chance, slots) · bending stories, mid-saga choices, the mid-saga reveal (Phase-3 arms at most) · tempo · a default model switch · rewrites, review gates, lint re-rolls (single-shot ruling).

---

## 2. Architecture

### 2.1 Calls

| call | when | model · effort | returns | replaces |
|---|---|---|---|---|
| **`plan`** | a `starts-new` lead is pursued | gpt-5-mini · **medium** · `json_object` | the plan + **pitch = card 1** | `genesis` + beat-1 `writeQuest` + saga `select` |
| **`card`** | a `continues` lead is pursued | gpt-5-mini · low | `{card}` | saga `writeQuest` |
| **`report`** | the reckoning (parallel, streamed) | gpt-5-mini · low | `{before, after, summary}` | saga `resolve` |
| **`flesh`** | after the reckoning, batched | gpt-5-mini · low | who, backstory, quirks | `flesh`; now incl. finale focals |
| `notice`, one-off `report` *(Phase 4)* | one-offs | gpt-5-mini · low | `{title, card, job}` / `before/after` | one-off `writeQuest` / `resolve` |

Per saga: 1 plan + (N−1) cards + N reports (today: genesis + select + N cards + N reports). **Pursue becomes one AI call, not two or three in sequence.** `callR` keeps its one JSON-parse retry; `interpretDirection`, `themeRoll` unchanged.

### 2.2 Who owns what
The **engine** owns every number and structure: N, payoff, focal, likely kind, failure budget (unchanged); shape, job types, every person and memory, stake, places, spark, tone (§2.4); asks, injuries, deciding soldier, partial cost, fate, button endings, edges (§2.6); who is met and when the answer is dealt (§2.5); quest title and `q.job` from the plan; pay (never in prose). The **plan** owns question, answer, labels, wants, jobs, troubles, wins, opens, settles, lose, option labels and the pitch. **Card** and **report** own prose and the summary.

### 2.3 Data model
`Bible` and `ChainStoryState` are replaced; **every economy field of `Chain` stays.**

```ts
// src/engine/saga.ts (new, pure, seeded from storyRng)
type ShapeId = 'rescue'|'hunt'|'recovery'|'escort'|'defense'|'feud'|'heist'|'beast';
type EpisodeType = 'fight'|'guard'|'catch'|'hunt'|'sneak'|'free'|'find'|'talk'|'escort'|'showdown';
type Way = 'recruit'|'captive'|'gold'|'talk'|'fight'|'sneak';        // personal: talk/fight/sneak
interface SagaPerson {
  id: string;                  // card id, lore id, or 'p1'..'p3' (coined)
  name: string; sex: 'male'|'female'; race: string;                  // engine; name dealt only once known or met
  role: 'client'|'opponent'|'focal'|'other'|'soldier'; part: string; trade?: string; known: boolean;
  memory?: string; where?: string;                                    // returning face only
  label: string; want: string;                                        // plan
}
interface Trouble { who: string; carry: string; will: string }       // plan, atoms
interface Episode { n: number; type: EpisodeType; title: string; job: string; people: string[]; trouble: Trouble;
  win: string|null; opens: string|null; settles: string|null; lose: string|null }  // settles/lose: showdown only
interface SagaPlan { v: 4; shape: ShapeId; variant: 'A'|'B'; spark: string; stake: string; tone: string; land: string;
  title: string; question: string; answer: string; pitch: string;    // answer first dealt to the finale report
  cast: SagaPerson[]; places: string[]; episodes: Episode[];         // length N, showdown last
  options: { way: Way; label: string }[] }
interface SagaLine { n: number; attempt: number; outcome: Outcome; party: string[]; text: string; hurt?: string }  // text = summary
interface SagaRecord { lines: SagaLine[]; met: string[] }
// Chain: bible → plan, story → record, `settled` deleted. GameState gains storyRngState.
```

### 2.4 What the engine decides before the plan call
Story rolls use a persisted **`storyRng`**, so the main `rng` and §20 baselines never move (B); the focal roll stays on the main `rng`.

#### 2.4.1 Shapes and episode types
8 shapes, none from the last 2 sagas, variants alternating. Shapes are **genre promises a player recognises at once**, not `keywords.ts`'s abstract twists (which cost clarity). No mystery/proof shape: every saga has a question, and both invite paperwork. Jobs 1…N−1 take the variant's first types (N = 2–6); job N is `showdown`.

| shape | parts: client · opponent · other | variant A | variant B |
|---|---|---|---|
| rescue | asks for help · holds them · is held | find, sneak, free, catch, fight | talk, find, fight, free, escort |
| hunt | asks for help · is hunted · knows the ground | find, catch, fight, guard, catch | talk, find, sneak, catch, fight |
| recovery | lost something · took it · knows the way | find, sneak, catch, fight, talk | talk, find, fight, sneak, catch |
| escort | asks for help · wants them stopped · must get through | talk, escort, guard, sneak, fight | escort, find, guard, catch, escort |
| defense | asks for help · attacks · helps from inside | guard, find, sneak, guard, fight | talk, guard, catch, fight, guard |
| feud | asks for help · stands in the way · serves the one in the way | guard, catch, talk, fight, sneak | talk, fight, find, guard, catch |
| heist | was wronged · holds what is not theirs · works inside | find, talk, sneak, fight, catch | talk, find, guard, sneak, catch |
| beast | asks for help · keeps the beast · knows the beast | find, hunt, guard, talk, hunt | guard, find, hunt, catch, fight |

**The focal's seat:** the opponent for captive and gold; the "other" seat for recruit; always the hunted in a hunt.

**Personal sagas:** parts *one of the company's soldiers* (focal) · *stands in the way* · *knows the past*; spark `personalSeed`; shape by seed kind (enemy → feud/hunt, kin → rescue/escort, lost thing → recovery/heist, debt → defense/feud).

Each type's `do` and `kind` are dealt, one mandate per job (L12: *variety comes only from a dealt mandate*); no type is won by obtaining a document.

| type | `do` | `kind` of win | `EPISODE_TESTS` 🛠 (one option per slot) |
|---|---|---|---|
| fight | fight armed people | they are beaten or driven off | STR melee/intimidation ✗submissive · CON melee/leadership |
| guard | hold a place against an attack | the attack is beaten back | CON melee/leadership ✗loner · STR melee/ranged |
| catch | chase someone down | someone is caught | DEX nature/ranged · CON nature/melee |
| hunt | track a beast | the beast is killed or trapped | DEX ranged/nature · INT nature/lore |
| sneak | get in and out unseen | someone or something is taken unseen | DEX roguery/nature ✗hotheaded · DEX roguery/ranged |
| free | break someone out | someone is freed | DEX roguery/melee · STR melee/intimidation |
| find | track down a person or a hiding place | someone or somewhere is found | INT lore/nature ✗hotheaded · INT roguery/lore |
| talk | win someone over | someone takes a side | CHA social/performance ✗hotheaded · CHA leadership/social ✗intimidation |
| escort | bring someone through danger | someone arrives safe | CON nature/melee · STR melee/ranged |
| showdown | face whoever stands in the way | one of the ways in ending | per option (§2.6) |

Tags are FAVOR_OK placeholders, tuned on the §20 sims so no pool zeroes a typical roster; the multi-stat test, fillability guard and difficulty caps carry over.

#### 2.4.2 Casting (every person, before the plan)
- **2–3 people** (incl. the focal) in the shape's seats.
- **Every other seat** is reused or coined by `P(new) = θ/(θ+N)`, reuse weighted by edge count (RC §3 🔒).
  - **The lore slate's location fences carry over** (each from a playtest bug): nobody on the roster, staged, in the cells, at the fort, or out of reach.
  - ≤ **1** returning face per saga; a used face sits out 2 sagas (villain snowball).
  - A returning face's seat follows their strongest edge **to the company** (= to a roster or custody card): `rival-of`/`captive-of`/`betrayed-by` → opponent; `party-to`/`saved-by`/`bonded-by`/`owes` → client. They are dealt `memory` (that blurb) and `where` (whereabouts); a pre-rebuild tag-dump blurb counts as no memory (unmet).
- **Coined people:** `prefsFor` name, sex, race (Settings honoured) + a `trade` word (against labels like "the petitioner").
- **Known (named from card 1):** client, personal soldier, a returning face with memory (R5). **The plan sees no other name**, only id, sex, part, trade or traits.
- **Focal `traits`:** race, sex, 2–3 words from a new `plainWords(card)` (B).

#### 2.4.3 Stake, places, spark, tone; no mid-saga reveal
- **`stake`:** a category the pitch makes concrete (a life, freedom, a home, a livelihood, someone loved, a good name, a promise), weighted by shape 🛠. **`places`:** ≤ 1 lore place in the region + 2 `freshPlaceName`, so places recur. **`land`:** region + a plain description (landmark gating unchanged). **`spark`:** `sampleSeed`/`personalSeed`; **`tone`:** `pickTone`; **`avoid`:** the last 5 saga titles.
- **The answer always comes out in the finale report.** The 30% mid-saga reveal is cut from v4.0: on failure and last-chance paths, plan text written as if the answer were out would reach cards first. **Rule: every dealt plan field is valid on every path the engine can take**; a reveal arm must keep it (Phase 3).

### 2.5 Memory, names, failure
The engine appends a `SagaLine` per attempt. What each call sees:

| call | receives | never receives |
|---|---|---|
| plan | engine inputs (§2.4) | unmet names, pay |
| card | `latest`, `job`, `trouble` atoms, `question` (last `opens`; the saga question on a job-1 re-pose), filtered `names`, `memory` (first appearance), `choice` (finale), `lastchance`, `direction` | win, settles, lose, answer, later jobs, older summaries, land, places, pay, stake |
| report | the card, `job`, soldiers, `decides` (not on failure), `result` (not on a failed job), the job's people, outcome, `hurt`/`cost`/`brought`, `answer` and `plan` (finale) | later jobs, rejected options, other plan fields |

- **Names filter:** `names` = the job's people (+ `choice`) that `latest`, `job` or `trouble` mention by name or label head noun (an unreferenced entry gave "Odo is an ally."). **Label on first appearance only, then the name:** met or known people get `name` alone (their label came with the pitch or the meeting report); the unnamed keep `label`; reports get name + label for the not-yet-met. Input shape cannot rebuild the "Name, a label who…," appositive.
- **Met:** client, personal soldier, returning face; then anyone named in a delivered report (`noteIntroduced`). **Answer:** dealt to the finale report on any outcome, so even a lost saga closes its question.
- **Failure re-poses the same job; nothing moves** (R6; `bankBeat` already holds the beat). No `result`, no `decides`; the summary (what was tried, what stopped it) becomes the re-posed card's `latest`, so the job stays valid (a plan-written loss made the retry nonsense in the smoke probe).
- **Last chance:** past the failure budget or the stall guard, the showdown comes with `lastchance` on.
- **Re-offers** are verbatim. **Continuation lead:** title `<saga title> — <next episode title>`; `hook` (today `story.currentSituation`) = the latest summary.
- **Soldiers:** summaries say "the company", so no soldier name reaches a card (bar the personal soldier); `deSoldier` goes.

### 2.6 Mechanics out of the prose calls
**Asks:** slots from `EPISODE_TESTS[type]` (counts, thresholds unchanged); on a personal saga, slot 0 and every finale option are `must-be` the soldier.

**Injuries (R3)**, rolled after the outcome; **a success can still wound** (GF §16-F5 kept):

| outcome | chance | who | bands 🛠 |
|---|---|---|---|
| failure | 50% | lowest coin roll | standard 70/25/5 light/serious/grave; hard+ 50/35/15 |
| partial, cost = a wound | 100% | lowest coin roll | 80/20 light/serious |
| partial, other cost | 10% | lowest coin roll | light |
| success | 5% | random member | light |

Bands → `low`/`med`/`high` (clamps kept); dealt as `hurt: [{name, how: lightly|badly|gravely}]`; woundcite becomes log-only.

**Finale:** ways recruit/captive/gold (personal talk/fight/sneak), plan-labelled (canned if missing). Tests 🛠: recruit CHA social/leadership | performance/social; captive STR melee/intimidation | DEX roguery/ranged; gold INT roguery/lore | DEX roguery/nature, standard 70%; talk/fight/sneak → CHA/STR/DEX.
- **Button endings already exist:** `approachOutcome` feeds both UIs beside `approachRewardWarn`, as a bare kind. It now returns the short fate fact ("→ joins the company", "→ held in your cells", "→ coin; goes free", personal "→ their matter settled"). **`approachRewardWarn` stays in both UIs**; the free/release regex goes.
- **`fateSentence` keeps every branch; only its wording changes.** Each fixed a real bug: focal already a soldier; slipped; void; saddled; recruit with no roster room waits at the tavern; captive with no Dungeon or full cells is handed off (`rewardWarnFor`). Wording becomes plain fact ("Kritias Ashworth is taken to the fort's cells."). **One function drives the button ending and the finale `result`.** The rest of `settleFinale` is unchanged.

**Partial cost:** `cost` = **the liability the partial mints, if any** (evidence or a mess that later spawns a hostile collection lead, so the report must show it); else N17's one-word `partialCost` roll, extended to sagas.

**Memory edges (R3).**
- 2+ soldiers on a job → 30% one `served-with` edge (job summary, 0.3).
- **Saga close:** `persistMetCast` keeps ≤ 2 met non-focal people (client > opponent > other; blurb = label), each with an edge to the focal by role (client `party-to`, opponent `rival-of`; their last summary; 0.5) **and one to the deciding soldier of a job they were in** (client `saved-by`, opponent `rival-of`; that summary; 0.5), so a returning face can remember "Harl dragged me out".
- The focal's `settleFinale` edges stay, with the finale summary (bonded-by / captive-of / party-to / at-large; core-pinned ≥ 0.8). Places in the pitch or a job line become place nodes. Every blurb is a line the player read (RC §5 🔒).

### 2.7 Validation (no quality re-rolls)
- **Repairs:** drop unknown ids; strip a name inside a label; replace an unmet name in plan text with its label; truncate extra episodes; canned label for a missing option.
- **Hard defects** (< N−1 episodes; missing pitch, job, trouble, win, settles or lose) → **one plain re-draw**, no rejection note (the avoid-note re-roll measured worse, 5 of 7); still broken → mock fill + `plan-fallback` logged. Target ≤ 5%.
- **Log-only telemetry:** pitch > 80 words; a stray capitalised token; **the answer's content words (minus those in spark, labels, places) in the pitch, any episode title, or any card payload before the finale report**; a part-word label ("the ally"); a soldier name in a summary.

### 2.8 How prompts are built
1. One template per call (`src/ai/prompts/*.txt`), rendered by `storyteller.ts` for game, lab and mock.
2. `[[x]]` / `[[x]]…[[/x]]` render only when x holds; `[[!x]]` negates. **A rule about absent data never reaches the model** (a memory rule without memory invented history, 2 of 2).
3. "The data:" glossary: one line per dealt key (verifier-checked).
4. Caps in the JSON skeleton (54–77 words vs 99–103 outside, against 85).
5. Direction is user data; system prompts are byte-stable per variant.
6. **Dealt values are atoms, labels, or text the player already read.** L19 holds whoever wrote the sentence (C's round-4 cards pasted latest + job + trouble and read flat). So `trouble` is atoms the card must phrase; `latest`/`memory` are read lines to recap; `job` is the one imperative, printed once, inside the card. Later cards face the floor too (§5.2).
7. **`promptbudget.test`** renders every variant (all lines on) and fails above plan **660** · card **215** · report **310** · flesh **160** · notice **210**. A rule cannot land without cutting another.
8. **`payloadlint.test`** plays a mock campaign (3 seeds, ≥ 2 sagas each) and checks every engine-composed value. It fails on instruction words (`never|must|do not|don't|should|write|say|pose`), ALL-CAPS, parentheses, digits, jargon (`beat|arc|step|slot|focal|quarry|client|obstacle|bible|chain`), empty values, or keys no line explains. **Matching is whole-word; ids (`p1`, `c44`) and the `n` ordinal are exempt; "keep" is off the list** (the beast part is "keeps the beast").

### 2.9 The prompts, in full
Counts are rendered, skeleton included.

#### 2.9.1 `plan` (system)
Typical **603** · personal 620 · memory + direction + avoid 633 · all 650 (today: 1,674–1,839 + 1,667). The mass is deliberate: a minimal genesis measured worse (ARC 7→6, L5).

```
You plan a short story for a fantasy game about a mercenary company. It is played as a few jobs in a row: before each job the player reads a short card and picks soldiers, then reads what happened. You write the first card. Other writers turn the rest of your plan into cards and reports.

The data:
- spark: the idea under the story.
- shape: the kind of story. episodes: the jobs before the showdown, in order, with what the soldiers do and the kind of win.
- cast: the people, with sex, part, and trade or traits. Use them all, and nobody else who matters. Only people given a name may be named; everyone else goes by the label you give them.[[memory]] memory: what that person and the company went through before. where: where they are now. Build on both.[[/memory]]
- stake: what is at risk if nobody acts.
- ending: whose fate the showdown decides, the likely end, and the ways it can end. [[!personal]]recruit: they join the company. captive: they end in its cells. gold: the company takes their treasure.[[/!personal]][[personal]]talk, fight, sneak: how the company settles the matter.[[/personal]]
- land and places: the region, and the places to use.
- tone[[direction]], and direction, the player's wish for this game[[/direction]]: how it should feel.
[[avoid]]- avoid: recent stories. Make this one different.
[[noclient]]- Nobody hires the company. The story is the past of the company's own soldier in cast, and the fort may lose them over it.

Write:
- title: a few plain words.
- question: what the player will most want to know. answer: the truth behind it, which nobody could guess from the first card; it first comes out at the showdown.
- cast: a label, what a stranger sees (their trade or looks) in a few plain words, never a name. And one concrete thing they want.
- episodes, in order. title: a few plain words. job: one short line that starts with a verb and says where. people: ids of those there. trouble: who stands in the way, what they carry, and what they will do. win: what changes when the soldiers succeed, made concrete from the kind of win. opens: the new question the win raises, which the next job goes after.
- showdown: title, job, people and trouble as above. settles: what is settled for the one who asked, whatever becomes of the person in ending. lose: how it ends if the company fails.
- options: a short line for each way in ending, starting with a verb.
- pitch: the first card, in short complete sentences, to the player as "you". [[!noclient]]Who comes to the company and what went wrong,[[/!noclient]][[noclient]]Whose past has caught up with them and how,[[/noclient]] what the soldiers must do in the first job, and who or what stands in the way, with the loss from stake made concrete. End on a plain fact that makes the player ask the question.

A story that works:
- One person wants one thing badly, and someone stands in the way, each for a plain human reason.
- Every job is dangerous work that hired soldiers are paid for.
- Each job happens at one place and grows out of the one before. The showdown still makes sense if earlier jobs failed.
- The person whose fate the ending decides is in the story from the first card on.

Plain words, no numbers, no pay, nothing modern. The company has no past here[[memory]] beyond the memory given[[/memory]], and only the company lives at its fort.

Reply with JSON only:
{"title": "text", "question": "text", "answer": "one sentence", "cast": [{"id": "cast id", "label": "text", "want": "text"}], "episodes": [{"n": 1, "title": "text", "job": "text", "people": ["cast id"], "trouble": {"who": "few words", "carry": "few words", "will": "few words"}, "win": "text", "opens": "text"}], "showdown": {"title": "text", "job": "text", "people": ["cast id"], "trouble": {"who": "few words", "carry": "few words", "will": "few words"}, "settles": "text", "lose": "text"}, "options": [{"way": "a way from ending", "label": "text"}], "pitch": "at most 70 words"}
```

Why: **question → cast → episodes → showdown → options → pitch**, so the story grows from its question, `opens` chains jobs (replacing C's `why`), and card 1 follows job 1. **Label = what a stranger sees**: "who they are to this matter", written by the call that knows the plot, leaked it ("Odo, a surveyor in the lord's pay"). **`settles`** holds under every ending (C wrote "They take the lord and bind him", false on recruit). **Dealt `kind` ≠ written `win`**, so it is not copied. No example lists in rules (L13). **Dropped with measured causes:** "open on a person doing something", the prize sentence, pay, the appositive rule, "state it as rumour", `reveal`.

**User payload** (the designer's seed; Greyridge is the reused lore place):
```json
{"spark": "a border stone moved by night, a little each year",
 "shape": "feud",
 "episodes": [{"n": 1, "do": "hold a place against an attack", "kind": "the attack is beaten back"},
              {"n": 2, "do": "chase someone down", "kind": "someone is caught"},
              {"n": 3, "do": "win someone over", "kind": "someone takes a side"}],
 "cast": [{"id": "p1", "sex": "woman", "part": "asks for help", "trade": "widow", "name": "Betisa"},
          {"id": "c44", "sex": "man", "part": "stands in the way", "traits": "human, noble, greedy, calm"},
          {"id": "p2", "sex": "man", "part": "serves the one in the way", "trade": "surveyor"}],
 "stake": "a home",
 "ending": {"about": "c44", "likely": "captive", "ways": ["captive", "recruit", "gold"]},
 "land": "the Western Forests, old elven woods west of the fort",
 "places": ["Greyridge", "Low Ferring", "Ashworth Hold"],
 "tone": "grim", "avoid": ["The Drowned Ferry", "Names to Burn"]}
```
Output: `SagaPlan` minus engine fields → zod → §2.7.

#### 2.9.2 `card` (system)
Later **168** · finale 170 · + lastchance 181 · later + memory + direction 199 · all 212 · first (Phase-1 arm) 167. `{{MAX}}` 70 / finale 80.

```
Write the job card for the next part of a story in a fantasy game about a mercenary company. The player reads it once at the company's fort, then picks soldiers to send. Speak to the player as "you", in the present tense.

The data:
[[first]]- premise: how the story begins. The player has not read it.
[[!first]]- latest: what the last job changed. The player has read it.
- job: what the soldiers must do now, and where. trouble: who stands in the way, what they carry, and what they will do.
[[!finale]]- question: what the player wants to know next.
[[finale]]- choice: the person whose fate this job decides.
- names: the people here. Use the name if one is given, else the label.
[[memory]]- memory: what that person and the company went through before. Say it when they come in.
[[lastchance]]- This is the company's last chance to finish the matter.
[[direction]]- direction: the player's wish for this game. Follow it for tone and content.

Write it in this order:
[[first]]1. The premise. 2. The job and who or what stands in the way. 3. A plain fact that makes the player ask the question.
[[later]]1. What has changed. 2. The job and who or what stands in the way. 3. A plain fact that makes the player ask the question.
[[finale]]1. What has changed. 2. The showdown: where, who is there and what they will do. 3. The choice the company must make about the person in choice.

Plain everyday words, short complete sentences, each following from the one before. Use only the data. No numbers and no pay. Nothing modern.

Reply with JSON only: {"card": "at most {{MAX}} words"}
```

**User payload** (card 2; Betisa's label came with the pitch; the surveyor is filtered out, as "the man with the lantern" lacks his label's head noun):
```json
{"latest": "The company drove the lord's retainers out of Betisa's orchard; a captured man says a man with a lantern moves the stone at night.",
 "job": "Catch the man with the lantern at the stone on Greyridge by night.",
 "trouble": {"who": "two retainers and a dog", "carry": "clubs", "will": "keep watch while he works"},
 "question": "Who is the man with the lantern?",
 "names": [{"name": "Betisa"}]}
```

#### 2.9.3 `report` (system): saga jobs, finales, later one-offs
Saga success **226** · failure + hurt 218 · finale + answer + option 244 · one-off partial + cost + brought 220 · all 295. `{{B}}/{{A}}` = today's gravity budgets (22/45, 40/90, grave or finale 60/140). Flags: `failure` = a failed job before any showdown (also turns `result` off); `stopped` = its saga summary; `moved` = other saga reports; `decides` is off on any failure.

```
Write the report of one job in a fantasy game about a mercenary company. The player sent these soldiers and has just read the card, which is printed above your report. Pick up where it ends and never repeat it.

The data:
- card and job: what the player read, and what the soldiers were sent to do.
- soldiers: who went.[[decides]] decides: the soldier whose act settles it.[[/decides]]
- people: others there. Someone given with a label is new to the player: bring them in by it, then by name if one is given.
- outcome: how it went.[[result]] result: exactly what came of it.[[/result]]
[[option]]- plan: how the player chose to end it.
[[hurt]]- hurt: who gets hurt, and how badly. Show each one taking it.
[[cost]]- cost: what the partial success costs. Show it being paid.
[[brought]]- brought: who or what comes home with the soldiers. Show each one.
[[answer]]- answer: a truth that comes out plainly here.
[[direction]]- direction: the player's wish for this game. Follow it for tone and content.

Write:
- before: at most {{B}} words. The soldiers arrive and meet what stands in their way. No hint of how it goes.
[[!failure]]- after: at most {{A}} words. The deciding moment and what came of it, exactly as outcome and result say. End on something seen, done or said that shows the change.
[[failure]]- after: at most {{A}} words. What stood in the way beats them, and the job is not done. Nothing else changes. End on something seen, done or said.
[[moved]]- summary: one sentence of at most 25 words for the story so far: what the company did and what is different now. Call the soldiers the company.
[[stopped]]- summary: one sentence of at most 25 words: what the company tried and what stopped it. Call the soldiers the company.

Past tense, plain everyday words, short complete sentences, in the order things happened. Name only the soldiers and the people given. No numbers and no pay. Nothing modern.

Reply with JSON only: {"before": "text", "after": "text"[[saga]], "summary": "text"[[/saga]]}
```

| `result` | success / partial | failure |
|---|---|---|
| saga job | the plan's `win` | **none** (no `decides` either) |
| finale | `fateSentence` + showdown `settles` | `fateSentence` + `lose` |
| one-off (Phase 4) | the job line | none |

`soldiers[].is` = "a <race> <man/woman>, <two plain words>"; `decides` = most heads, ties by party order (B); names land in `people` (PROMPT_RULES §11); rejected options are not sent. **Removed:** `sceneFacet`, `sceneMode`, `deliveredSummary` (it carried instructions), `chainContext`, `stepsNotYet`, `rejectedApproaches`, dossiers, tag notation. `summary` feeds the chronicle, the next `latest`, the continuation `hook`, the 📖 line and edge blurbs.

#### 2.9.4 `flesh` (system)
Plain **138** · direction 152 (today 819; the min arm, composite 4.83).

```
Write short character sheets for people in a fantasy game about a mercenary company. role: merc is one of the company's soldiers, captive is held in its cells, hireling is staff. from: how they came to the fort.

- who: at most two short sentences. What they are, then what drives or marks them.
- backstory: two sentences of real events that lead up to from, without retelling it.
- quirks: one or two physical habits someone could notice, none from avoidQuirks.

How it reads:
- Plain everyday words, short sentences, concrete facts.
- Make each person clearly different from the others.
- Their traits fix sex, race and trade. Contradict none, and never list them.
- Only the given names. No numbers.
[[direction]]- direction: the player's wish for this game. Follow it for tone and content.

Reply with JSON only: {"people": [{"characterId": "as given", "who": "text", "backstory": "text", "quirks": ["short phrase"]}]}
```
Input `{characterId, name, traits, role, from, avoidQuirks}`; saga `from` = pitch + label + want + last summary; one-off = card + first after-sentence. Finale focals now go through `fleshPass`.

#### 2.9.5 `notice` (system, Phase 4)
Job **147** · scout 134 · hire 144 · job voiced + person + avoid + direction 198. `{{MAX}}` 25 / 40 / 60 by gravity.

```
Write one job notice for a fantasy game about a mercenary company. The player runs the company from its fort, reads this notice once, and picks which soldiers to send. Speak to the player as "you".

The data:
- type: the kind of job. spot: the small place where it happens. theme: the kind of trouble, never an object.
[[asker]]- asker: the trade of the one who needs help.
[[person]]- person: who the job is about. Bring them in by their label.
[[avoid]]- avoid: recent notices. Make this one different.
[[direction]]- direction: the player's wish for this game. Follow it for tone and content.

[[job]]Write it in this order: who needs help and what went wrong there, what they want done, and who or what stands in the way.
[[voiced]]Open with the asker's trade in square brackets. The rest is their own words to you.
[[scout]]Nobody is hiring. Write where people gather nearby and what trouble they talk about. The soldiers go to listen for paying work.
[[hire]]Write about the person worth hiring: who they are, what they are good at, and why they would join.
[[self]]Nobody asks for this. Write what is out there to be had, and who or what stands in the way.

Plain everyday words, in short complete sentences. Say what is going on straight out. No names of people or places; use trades and labels. No numbers and no pay. Nothing modern.

Reply with JSON only: {"title": "a few plain words", "card": "at most {{MAX}} words", "job": "one short line, starting with a verb"}
```
Voiced = shipped `CARD_VARIANT=dlg` (+1 serious/grave). The reward `person` is engine-rolled and dealt as a label (`quarryTags` retires). No pay, gloss, spark, places or obstacle atoms (L31). Benched vs P54/CHAMPION first.

### 2.10 Deleted
- **`game.ts`:** `generateGenesis` and its guards; `generateChainBeat` staging; `stageBible`, `scrubUnmet`, `deSoldier`, `stakeGloss`, `knownObstacle`, the saga `rewardEnvelope` pool, saga `stripJobEcho`/`capitalizeCard`/`lintCard`; saga-path `buildLoreSlate` (fences move to casting); `advanceChain` ledgers, `settled`, saga `sceneFacet`/`sceneMode`; the free/release regex. **`fateSentence` stays**, reworded.
- **`openai.ts`:** `sagaSystem`, genesis prompt, saga resolve blocks, `review`, direction suffix. **`keywords.ts`:** arrival, tell, saga obstacle pools. **`provider.ts`:** `genesis`, `review`, saga fields of the write/resolve inputs. **Flags:** STAKE, NOCLIENT, PERSONAL_CARD, PERSONAL_SEED, KNOWN_FACE, LAWWORDS, saga PROSE_VARIANT/CARD_VARIANT.
- One-off paths stay until Phase 4. ≈ −1,500 / +700 lines.

---

## 3. What the player reads

### 3.1 Shapes
Cards run ≤ 70 words (finale ≤ 80) in the prompts' order and end on the open question (the finale on the choice, then buttons "label → ending" with any warning; a re-post opens on the setback). Reports: before · 🎲 · after · 📖 status line + summary. **No ERRAND line under a saga card:** the card states the job (card 1 must, for M1), so ERRAND is the duplicate C's probe printed ("Guard the lane to Low Ferring." twice); a job atom would only make it a paraphrase. `q.job` still feeds the report and the map hover gist; one-offs keep ERRAND until Phase 4. Touches QUESTS 2026-07-06 (a) (R1).

### 3.2 A saga, imagined. HAND-WRITTEN, not model output
*The target, never a prompt; the probe measures how close gpt-5-mini gets. Dealt: the §2.9.1 payload (feud A, captive, N 4); the names Kritias Ashworth and Odo are withheld.*

**Plan (hidden):** Q "Why does the lord want a poor, stony hill so badly?" · A "An old silver seam runs under Betisa's hill, and the stone's new line puts it on the lord's land." · labels "a hill-farm widow", "the lord of Ashworth Hold", "a thin surveyor".

Each card below states its job line.

| # | trouble (who · carry · will) | win / **settles** | opens / **lose** |
|---|---|---|---|
| 1 Hold the Orchard | the lord's retainers · axes and clubs · cut down the orchard | Retainers beaten back; a captive says a man with a lantern moves the stone. | Who is the man with the lantern? |
| 2 Catch the Stone-Mover | two retainers and a dog · clubs · keep watch while he works | He is caught, a surveyor too frightened of his master to talk. | What is he so afraid of? |
| 3 The Moot | the lord's steward and armed men · swords · take him back first | He says the lord pays him and has the hill dug by night; the village sides with Betisa. | What are they digging for? |
| SD The Gate at Ashworth Hold | his last retainers · a shut gate · hold the hill | **The stone goes back where it stood, and Betisa keeps her home.** | **The lord keeps his gate shut, and the stone stays where it is for now.** |

> **HOLD THE ORCHARD** · *The Creeping Stone* — A widow named Betisa has come to your gate from Low Ferring. The stone that marks her land creeps uphill every year, and now the lord of Ashworth Hold claims the hill. At first light his retainers come with axes to cut down her orchard. Stand with the villagers there and drive them off, or she loses her home. The hill is stony and poor, and nobody ever wanted it before. *(70)*
> ON THIS MATTER: Betisa — a hill-farm widow · SEND 2: CON or STR, favours melee, leadership · REWARD: *(engine)*

> 📖 *(success; engine status line first)* The company drove the lord's retainers out of Betisa's orchard; a captured man says a man with a lantern moves the stone at night.

> **CATCH THE STONE-MOVER** — The company drove the lord's retainers out of Betisa's orchard, and the man they caught talked. Someone with a lantern moves her stone at night. Catch him at the stone on Greyridge. Two retainers with clubs and a dog keep watch while he works. Nobody in Low Ferring has ever seen his face. *(55)*
> 📖 *(failure; no result, no decides)* The company tried to catch the man with the lantern on Greyridge; his dog caught the scent and the retainers drove the company off.

> **CATCH THE STONE-MOVER** *(re-posed; "a setback — 1 of 2 before it slips away")* — The company tried to catch the man with the lantern, but his dog gave them away. Catch him at the stone on Greyridge. Two retainers with clubs and the dog still keep watch while he works. Whoever he is, he knows that hill well enough to work it in the dark. *(52)*
> 📖 *(partial; hurt Harl badly)* The company caught the man with the lantern, a surveyor named Odo; he is too frightened of the lord to say more.

> **THE MOOT** — The company caught the man who moves the stone. Odo sits bound in the moot hall at Low Ferring, too frightened to talk. Get him to tell the moot who pays him… *(Odo is met, so he is dealt his name only)*

> **THE GATE AT ASHWORTH HOLD** — Odo told the moot the truth, and all of Low Ferring stands with Betisa. The lord of Ashworth Hold has shut his gate behind his last retainers and will not give up the hill. His diggers have gone quiet, but whatever they were after is still up there. What becomes of the lord is yours to decide. *(58)*
> **[ Drag the lord to the fort in chains → held in your cells · STR ]** *(⚠ from `approachRewardWarn` if there is no Dungeon)* · **[ Offer the lord a place in the company → joins the company · CHA ]** · **[ Empty the lord's strongbox and let him run → coin; goes free · INT ]**

> *Finale report (chains, success; answer dealt; result = "Kritias Ashworth is taken to the fort's cells." + settles)* …Wenna cracked one of the lord's grey stones on the hearth, and it glittered: an old silver seam runs under Betisa's hill, and the new line put it on his land. By morning the villagers had dragged the stone back.

The chronicle lists each 📖 line (✓/~/✗, party, hurt), then People (name — label).

### 3.3 Against real output
- **C's real gpt-5-mini probe, round 4** (shipped text: §0): *"Betisa asks the company to stop a border stone that slips each year toward Ashworth Hold. If none help she will lose her home at Low Ferring. The company may take the lord of Ashworth captive or claim his treasure. Guard the lane to Low Ferring…"* Followable but flat: pasted in order, a game-speak prize, a "secret" restating the premise, a roll-call card 2 (*"Harl fought at the lane."*).
- **Changed since:** pitch after the jobs, no prize, trouble atoms, question endings, "the company" summaries, dealt win kinds, an unguessable answer. **Unmeasured until Phase 1.**

### 3.4 One-offs (Phase 4), shape only
> **THE FOULED MILLRACE** — A miller on the forest stream found his millrace full of dead fish. The tanner upstream has started pouring his lye into the water, and he laughs when the miller complains. The miller wants it stopped. The tanner keeps big dogs at his gate. · ERRAND: Make the tanner stop fouling the stream.

---

## 4. Compatibility

### 4.1 Sagas in flight — none (§D.5)
The designer: *"just delete all saves"*. When v4 ships, `saves/` is cleared and play restarts; no lapse path, no migration, no `legacy` flag. A v4 build refuses to load a save whose chains lack `plan` with a plain message ("this save is from an older storyteller — start a new game") rather than half-running it.

### 4.2 Lore, recurring cast, finale
Lore schema and dossiers are unchanged. **RC §5 🔒 holds by construction:** memory is dealt at first appearance with "Say it when they come in" (RC §10b; dealt at genesis it reached the page 0 of 21 times). The slip sequel reuses the focal; lore promotion, approaches, `chooseApproach`, the canned-trio fallback, bank, side-loot, debt/void, `settleFinale` dispositions and REWARD are unchanged.

### 4.3 Text UI parity (same commit as the GUI)
- **`questDetail`:** `episode · saga` title; the card; **no ERRAND on saga quests**; ON THIS MATTER = met/known people (name — label); REWARD; finale `a) <label> → <ending> · <attribute>  ⚠ <warn>` via the GUI's `approachOutcome` and **kept `approachRewardWarn`**.
- **`chainDetail`:** title, state, pitch, the likely-end/bank/progress/setbacks line, **So far** (`n ✓/~/✗ party text · hurt`), **People**, `next`; `goal:`/`now:`/`known:` go. **`leads`** and the GUI lead list show the new continuation title.
- **Reckoning:** the 📖 status line (bank set aside, "it now comes to a head", setbacks) stays, then the summary.
- **GUI:** QuestPage (no errand row on sagas; ending + warn per button; tooltip at :257 `c.goal` → `c.pitch`), Chronicle (So far, People). `chainViews()` gains `pitch`, `lines`, `people`; drops `goal`, `situation`, `known`, `met`.
- **`mark`, `lab saga`, `ailog json` are CLI-only by design** (lab tooling).

### 4.4 Direction, mock, flags
- **Direction:** guidance + " Keep out: " + avoid = the `direction` user field of all five calls; `npc`/`recruit` preferences steer every saga person; `direction.test` updated.
- **Mock:** deterministic `planSaga`/`writeCard`/`writeReport` (pitch = client + first job + trouble + stake; card = latest + job + trouble; report by outcome and `decides`), honouring counts, types, ids, ways, `lag()`: the lab's **floor** (B).
- **Lab-only flags** (`IMPL_NOTES.md`): `AIRAIDER_FORCE_OUTCOMES`, `AIRAIDER_CALL_LOG`, `AIRAIDER_STORY_ARM` (registered arms, never new flags; non-promoted arms go at Phase 6).

### 4.5 Tests
- **Update** every test that builds a Bible or reads `storyUpdate`/`ask`/`injuries`/`edges` (~17 files; reroll → re-draw, woundcite → dealt hurt applied). **Re-snapshot once:** `determinism` (§20 sims within noise). **Delete:** `desoldier`, `slatephrase`.
- **New:** `saga` (shape × variant × N 2–6 → N episodes, showdown last; tests never zero a founder roster; record, met-by-scan, re-pose, finale answer) · `castrules` (≤ 1 face, cooldown, location fences, places, no unknown name in the plan) · `fatesentence` (every branch: button ending matches `result`) · `planvalidate` · `nameleak` (20 seeds: no unknown name in plans, no unmet or roster name in cards, label once) · `promptbudget` · `payloadlint` · `storyrng` · `forceoutcomes` · `legacylapse`.

### 4.6 Docs superseded (banners at G2)
- **Archived:** BIBLE, QUEST_BIBLE, PROMPTS, STORY_GEN_STATE. **GENERATION_FLOW:** steps 5–8 → shape + cast → `plan` → `card`; §5 `spark` only; §11/§16-F5 engine injuries; §14/§16 selector, write-back, AI edges leave sagas; §4b extended; **new §22**.
- **STORY_ENGINE** §2 overturned (R1) · §3 engine casting · §6 voice kept, structure §3.1 · §7 one deciding soldier (§7a kept) · §10.2 enforced · §12 engine owns asks, injuries, edges, casting, kinds.
- **QUESTS** §2 asks (R2) · §4–§5 injuries · §6–§8 ownership · §9 endings on buttons · 2026-07-06 (a) for sagas (R1). **PROMPT_RULES** §3 engine kinds · §12.4 no pay (R4); §0, §8, §10, §11 kept.
- **WRITING_CHECKPOINT** lock, §4b row 1 (R1) · **CARD_GOLD_STANDARD** prop 1 measured not mandated, prop 3 (R5) · **LORE** §2–§3 · **RECURRING_CAST** §3 fences, §10b · **REWARD_BANK** §4 (R6) · **AI_PROVIDER** after Phase 5.

---

## 5. Build plan

Opus codes; Fable plans and verifies. **Each phase ends in a gate. Stop rule:** a gate still failing after its budget (Phase 1: one prompt revision; Phase 2: one fix round; Phase 3: 2 rounds per class) goes to the designer with transcripts and numbers, not more rounds.

### 5.0 The saga lab (`v3/scripts/sagalab/`)
- **`drive.ts`** plays the **real CLI** (piped, one command at a time, ended by a dev `mark` echo), so judges read what the CLI prints (DOGFOODING.md): **`lab saga <fixture>` (required)** grants a pinned `starts-new` lead → pursue → wait → `auto all` → finale `approach` per path → `end`, until done or 45 cycles; then `chain`, `save`, `ailog json`. **Only lab sagas and their continuations are pursued**; one-offs only with `--oneoffs`.
- **Fixtures** (`fixtures/{A,B}/`) pin **spark, focal (a card spec), N, kind, personal, twist** (baseline input; v4 ignores it). v4 rolls the rest from `storyRng`; the baseline feeds the pins into `GenesisInput`. Unpinned, the arms consume the main `rng` differently and pairs would not match.
- **`extract.ts`**: per-saga transcripts, **one file per text**, `plan.json`, `calls.jsonl`, completeness check; **`mech.ts`**: M12–M17, paste rate; **`judge_gpt.ts`**; **`score.ts`**: CIs, `REPORT.md`.
- **`AIRAIDER_FORCE_OUTCOMES`:** a `doEndCycle` hook maps **fixture + attempt** to an outcome and **sets the dice heads to match**, so the 🎲 line agrees; no-op when unset (state-hash test). **Paths are rules on the pinned N**, since the failure budget max(2, ceil(N/2)) breaks fixed sequences:

  | path (per set) | rule | N |
  |---|---|---|
  | clean (3) | S every attempt; finale S | any |
  | bumpy (3) | job 1 S; job 2 F then P; later S; finale P | ≥ 3 |
  | failing (2) | alternate F and S until the showdown, however reached; finale F (slip) | ≥ 3 |
  | last chance (2) | F every attempt until the last-chance showdown; finale S | any |
  | personal (2) | S, P, then S; finale S | ≥ 3 |

- **Sets:** A (tuning) and B (held out), 12 fixtures on 6 seeds each; B′ = B regenerated for the J3 calibration.
- **Readers** (fresh, zero-context, arm-blind):
  - **J1 cold player**, 1 Opus + 1 gpt-5 (medium). **Progressive:** gpt-5 gets one text per API turn (enforced); Opus opens the per-text files in order, answering each first (**honour system, stated**). Card: ≤ 25-word paraphrase (who wants what, what to do, who is in the way); ease 0–10; want to send 0–10; reread quote; card 1 send yes/no. Report: what happened, did it work (≤ 20 words); want next 0–10; reread and contradiction quotes. End: 3-sentence retell; best/worst moment; the question, answered?
  - **J2 auditor**, 1 Opus, **gates only** (set B; the probe at G1): plan + transcript + J1 → M1, M6–M9, M11–M13, engine-speak, part-word labels.
  - **J3 pair**, 1 Opus + 1 gpt-5, **Phase-0 calibration, G2, G3 only**: base vs new, blind; "rather keep playing?", "follow more easily?", with a why.
  - **Context-free verifier** before every live run. **Designer:** probe sagas (G1), 3 pairs (G2), a playtest (G6). Judges steer; the designer decides.
- **Cost:** ≈ $0.7–1.3 per set; Opus runs: Phase 0 ≈ 48, per change 12, per gate 24–36.
- **Calibration (Phase 0 findings, `baseline/2026-10-01/REPORT.md`; in `j2_auditor.md`, `score.ts`, `judge_gpt.ts`):**
  - **M1 is strict.** J2 grades each paraphrase part `true` / `"unclear"` / `false`. A part the card leaves unclear counts as not followed. The lenient number stays as M1-lax (watch only). The base is M1 59.6% (M1-lax 100%, a ceiling), and 25% on card 1.
  - **The Opus J1 seat is primary for taste scores** (M2, M3, M3b, M4). gpt-5 is reported alongside: it scores about 2.9 points higher and agrees with Opus at only r ≈ 0.4. Taste scores are compared only between runs read by the same seats.
  - **J3 reads every pair in both orders**, in a fresh conversation each time. M10 counts a pick only when it holds in both orders. Position bias runs in opposite directions per family (gpt-5 picks the second saga, Opus the first), so a read in one order only is shown but never scored.

### 5.1 Phase 0: lab + baseline on the CURRENT storyteller
- **Files:** sagalab scripts, rubrics, fixtures, `forceoutcomes.test`; `game.ts` force hook and `lab saga` grant; CLI dev commands; `openai.ts` **logging only**: with `AIRAIDER_CALL_LOG`, every call (full system and user, output, tokens, latency) goes to `calls.jsonl` (today: a 120-record ring, user prompts cut at 20k chars). Model plumbing waits for Phase 5 so the baseline cannot move.
- **Ships:** a frozen baseline: J1 on A and B, J2 on B, J3 on B vs B′; CIs; verifier findings on today's prompts.
- **Verify:** tests/typecheck green; hook no-op unset, heads match set; mock and real drives complete; a fixture reproduces spark, focal, N, kind across runs.
- **G0:** a base and CI per metric; the designer may glance at 2 baseline transcripts.

### 5.2 Phase 1: rulings + prompt probe (no game code)
- **Files:** this plan → `docs/STORYTELLER.md` (⏳ PLAN); `sagalab/probe.ts` (port of C's `probe.mts`: real plan/card/report calls on scripted outcomes + the mock floor); draft templates.
- **Probe fixtures** (frozen JSON; pins hand-picked, the rest drawn once from existing pools on 2 seeds, as v4 casting does not exist yet): **F1** feud A · N4 · captive · border-stone spark · **F2** rescue B · N3 · personal · **F3** hunt A · N2 · gold · **F4** recovery B · N3 · captive · **F5** escort A · N3 · recruit · returning face (client seat) · **F6** defense B · N4 · gold · **F7** heist A · N5 · captive · **F8** beast B · N3 · recruit.
- **Verify:**
  1. Verifier on every rendered variant with real payloads: zero findings.
  2. **Probe (per structure arm S/L/H, §D.1; each plan also gets a dealt theme):** 8 × 3 draws = **24 plans per arm**, played to the end (draws 1–2 clean, draw 3 with a failure + re-pose): hard defects, answer-not-guessable (J2), paperwork, labels, pitch length, spoilers.
  3. **Card 1 three ways:** (i) the plan's pitch; (ii) the `first` card, `premise` = client label + want + stake as atoms (C); (iii) the mock. **Later cards:** AI vs mock. 3 fresh blind seats per card (follow, want-to-send, rereads; PROSE_METHOD ≥ 24 per arm, ≥ 2 seeds, ≥ 3 seats).
  4. **Interest beyond card 1:** J1 + J2 on the 24 full sagas per arm vs base (unpaired) for M1, M3, M5.
  5. **Repetition (§D.3):** ≥ 20 cheap plans + card 1 per arm (themes dealt) → J4 series reader + mech; the names arm (§D.4) rides along.
- **G1:** the §D answers applied; **one structure arm chosen by followability** (M1, then M5, then M2; M3 next; M19 only on a tie); names arm chosen by M1/M11; verifier clean; ≥ 22/24 plans defect-free; answer-not-guessable ≥ 14/24; paperwork ≤ 1 in 8; 0 spoilers; M1, M3, M5 not below base. **Card 1, symmetric:** higher follow wins; within noise, latency decides (`first` adds a sequential call); both AI arms must beat the floor on want-to-send, else fix the plan prompt (one revision, then the stop rule). **Later cards:** if the AI card does not beat the template on follow or want-to-send, drop the call (−5–14 s per continuation). The designer reads 2–3 probe sagas.

#### Phase 1 result + R1 (2026-10-02)
- **G1 is not met** (`v3/scripts/sagalab/reports/2026-10-02-G1-probe1.md`): followability did not improve (M1 strict ≈ 55% in all three arms). Chosen: **arm L**, **labels until met**, and **card 1 = the `first` card call** (the pitch spoiled 5–7 of 16 card 1s and told job 1 as done; `first` 0 of 8).
- **R1 is the one revision the stop rule allows.** Each fix targets a class:
  - **C1, cards starved of why:** later cards named the job's thing or person but never said what it was or how getting it helped. The plan now writes `why` for each job and the showdown: how the job brings the one who asked closer to what they want, saying what any thing or person in it is. It replaces `opens`, and cards get it in place of `question`.
  - **C2, noise objects:** the "end on a small sight, sound or object" rule, and the `question` input that fed it, are cut. They closed every card on a clue that nothing paid off.
  - **C3:** card 1 is always the `first` call, so the plan loses its pitch (plan budget 660 → 620).
  - **C4:** the finale report returns the answer as its own `truth` line, printed after `after`. The engine still decides when the answer is dealt (§2.5).
  - **C5, an arm and not a ruling:** **L_full** keeps today's casting and stake. **L_lean** casts only the one who asks (with no trade), the person the ending decides, and the personal soldier or a returning face when one is dealt. It has no third seat and no stake.
  - **C6, roll-call reports:** a report's people are only those that the job, the trouble or the result refer to, plus the person the finale decides. `before` adds only what the card did not say.
- **Runs:** `runs/probe2/{L_full,L_lean}/<fx>_<draw>/`, paired slot for slot with probe1 (same soldiers, dice, path and seed). `score.ts --pair` reads the gap. The repetition series now deals each draw its own cast.
- ⏳ **If L_lean wins, the asker's trade and the stake move from the engine to the plan** (§2.2, §2.4.2, §2.4.3). That is a designer ruling, and it is not written in here as decided.

#### Lab writer + R2 (2026-10-02)
- **Designer ruling:** develop the storyteller with Claude as the lab writer (headless CLI, `probe.ts --writer sonnet`) until the structure is right; the shipping model is chosen later. The lab arm is L_lean; the trade and stake move above stays ⏳.
- **Sonnet as the writer** (`v3/scripts/sagalab/reports/2026-10-02-sonnet-writer-probe3.md`): followability up on every §D row; what is left is structure, not the model.
- **R2 fixes those structure classes** (lab-only: `v4lab.ts`, `probe.ts`, the templates; budgets unchanged):
  - **S1, the answer is earned:** the answer says who or what and why; each middle job has a `learn`, the one piece its win brings to light (the showdown keeps the last). The engine banks a won job's learn; later cards get the mystery so far; the finale's `truth` is the moment the answer comes out, tied to what was learned.
  - **S2, middle wins carry forward:** each middle job has a `gain` (what the company then holds); the engine keeps won gains as saga state; later texts get `have`; the showdown's `edge` per gain reaches the finale only for gains held. A lost job banks nothing, and the finale still works.
  - **S3:** the finale card gets whose fate it decides and what is lost (`fate`, `lose`), never the ways.
  - **S4:** a person's `part` reaches a text only when they are in that job.
  - **S5:** a re-posed job's card gets `retry` (what stopped the last try) in place of `latest`.
  - **S6:** `why` is what the one who asked needs the job for, never what it will find, prove or reveal.

#### R3 (2026-10-03, lab-only, unjudged: probe5)
- **R3 keeps R2's spine** (learns banked per won job, gains held and used at the finale, no ending menu, part tags only on-job, retries marked). It changes how the fields are worded and rendered (report `2026-10-03-R2-probe4.md` §5):
  - **W1:** `why` says what the job's thing or person is, and what having it lets the one who asked do toward their want. It never says what the win brings out.
  - **W2:** `learn` is one plain fact that makes sense on its own. It narrows the answer but never names what the question asks for, and the showdown keeps the last piece. The report shows it found plainly and adds nothing past it.
  - **W3:** card and report glosses say what to cover. They are not sentences the writer can copy (fate, "you hold", "not met yet", "try this same job again"). A label-only entry no longer carries `intro`. `mech.ts` counts gloss echo (log-only).
  - **W4:** the finale card gets held things by name, in one clause at most and only where useful. It gets learned facts in one sentence, with no `latest` after a win, no trouble `will`, and `lose` only when it adds to the want or at a last chance. `helps` goes only to the finale report.
  - **W5:** the secret comes out inside the finale report's `after`, in time order. `truth` is one plain sentence kept in the chronicle and not printed in the report. A log-only lint flags an `after` that lacks the answer's key words.
  - **W6:** the plan line asks that job, trouble, why, edge and settles still fit once the answer changes how the person in ending looks.
  - **Card latency:** R2 cards were thinking because of the merged checklist and the ambiguous `intro` gloss. R3 goes back to R1's frame (a data list plus a short order list). Without thinking, the cards also overshoot their word caps.
  - **Verifier round (probe5 rendered + the Sonnet F6_3 run):** each fact in one field, dealt where the player needs it.
    - `helping` is dealt only on the finale; card 1 has it in its premise. On every card it came back almost word for word and pushed all five cards past the cap. A middle card's `why` names whom the job helps (W1). Caps stay 70 / 90.
    - The card's order line lists data keys (`latest, mystery, job, why, have, trouble`), never a sentence a card could print ("the question, and what you know"). The card-voice glosses are gone ("their loss if nobody acts").
    - The report summary gives what was done and the result, never the clue. The clue reaches the next card once, as `learned`.
    - A report's `people` are the people present: the plan's people for the job, the one the finale decides, and anyone the job, the trouble's side, the result or the gain names as there. A mention as owner only ("the merchant's axemen") does not count, and the one the company acts for gets no part line.
    - `decides` and `plan` are glossed as deeds ("whose deed wins it", "how the soldiers go about it"), not as choice words.
    - Plan labels carry no traits.
  - **Verifier round 2 (probe5 rendered):** no rule the data breaks, no read line dealt whole again, every key with a stated use.
    - Card: `you` is the company ("Speak to the company as you"), because payload lines say "the company". The order line opens "Say each fact once": a retry line that holds the job, and a want restated by `why` and `lose`, were each printed twice.
    - Card: `retry` is what stopped the last try. `names` are the people the card may mention, not the people present. The `intro` and `part` glosses are flag-gated to entries that carry them, on cards and reports alike.
    - Card: later cards get the question bare ("why the hunter stands in the way"). Card 1's "Nobody knows …" sentence was pasted on every card.
    - Card 1 (personal): the gloss is now `who: one of your own soldiers`. The old "nobody hires you" was printed as "Nobody hires you this time."
    - **Check run (`probe5/L_lean_sonnet_v2`, Sonnet, 3 sagas, plus 42 replays of single card calls):**
      - No card repeated "Nobody knows", mixed "the company" with "you", or stated a retried job twice. The secret came out inside `after`.
      - Middle cards never think (0 of 23 calls).
      - "Say each fact once" makes cards shorter. Finale cards ran 86 to 109 words with it and 88 to 120 without it; middle cards ran 79 to 102 with it and 84 to 114 without it.
      - The same line makes dense finale cards think, in 5 of 9 replays against 1 of 9 without it. Those calls take about 10 to 15 s instead of about 2.5 s, and the cards that think land on the 90-word cap.
      - The cause is payload size: helping, the question, two or three facts, why, the things held and lose do not fit in 90 words. Moving the same rule into the style line removed the thinking and the shortening together (finales 106 to 127 words).
      - Middle cards still overshoot 70 words.
    - Report: "Invent no names" replaces "name only the soldiers and the people given", since result, clue and known name absent people. `part` is their side, shown and not stated. `after` tells what `result` says in the writer's own words, because result is dealt in the present tense and "exactly" invited pasting it. The finale `plan` is shown in `after`.
    - Plan: `traits` is what the person is like (the label still never carries them). "the player sends soldiers on" was cut to keep 620.
    - Declined, each with a reason:
      - `helps` on the finale card: W4 rules against it.
      - Putting every showdown person on the card: reports are where strangers are met (§2.5). It happens 0 of 24 times on L_lean finales, so it is an L_full bystander artifact, and an unreferenced entry brings back the "Odo is an ally." line.
      - Leaving the personal soldier out of the plan's `people`: the engine sends them on every job (§2.6 must-be; `pickParty`).

#### R4 (2026-10-03, lab-only, approach change: probe6)
- **R3 found the limit of wording** (`2026-10-03-R3-probe5.md` N9): every field the card writer gets as its own labelled item comes back as its own stock sentence ("You serve X", "One question stays open", "You hold X", "If you fail"). Rewording a gloss only changes the stamp.
- **So the bookkeeping leaves the prose.** The engine prints it from data as a quest log above the card. The card keeps only the scene, and the AI never writes the log, so the log cannot echo or drift.
- R3's spine stays: learns banked, gains held and used, truth inside `after`, no fate menu, part tags on-job, retries marked, fast cards.
- **Q1, quest log** (`v4lab.ts questLog`): engine text right after each card's header line and in the chronicle. Its lines are For (asker — want), Road ahead (✓ outline line · ▶ title · ✗ title · ahead, 2+ jobs only), Known, Held and Open question, each left out when empty.
- **Q2, the card is a scene:** latest or retry → job, why (+ the finale's `fate`, one clause) → trouble (+ `lose` at a last chance only). It drops helping, mystery, have, card 1's want and question. Caps stay 70/90, and the card budget falls 215 → 180.
- **Q3, outline call:** one low-effort writer call per saga with 2+ jobs before the finale, run beside card 1. It reads card-1-safe input only (asker + want, each earlier job's text + why; never learn, gain, edge, answer, title or finale job) and writes lines "verb …, so …". Log-only lint: line count, > 18 words, no "so", empty or knowing purpose, a name not given.
- **Q4, `why` names an action:** what the asker can then do with the job's thing or person, never seeing, knowing, learning, showing or proving. Log-only lint: a knowing verb in `why`.
- **Q5, the answer is written last:** question and answer close the plan reply, after the showdown and options, so the answer is written knowing the fixed ending. One merged line: the answer fits every way in ending and settles. Option labels are now written before the answer.
- **R4 verify (context-free verifier on the R4 prompts + one real Sonnet saga, F6_3).** Same class as Q1: whatever the log or the buttons already show leaves the card, and nothing on screen before play may carry a learn or the answer.
  - Card: `fate` dropped (its bare name came back as the gloss, "X's fate is settled here"; the PLANS buttons say whose end it is). Card 1's premise keeps only what card 1 alone adds (the loss, a personal past); "who needs you" duplicated the For line, and with neither there is no premise. A named entry carries its label only on `intro` (whole), for the company's soldier, or where the dealt text (or the finale's buttons) calls them by it (then the role word alone, "a merchant"); everywhere else it came back as a fixed epithet ("the shrewd merchant" on four cards running). Card and report alike.
  - `latest` after a won job is the plan's `win` (no clue by construction); the writer's summary retold the clue the log lists as Known. A failed try keeps its summary. The summary stays the chronicle's.
  - Outline: it writes only the action each job lets the asker take (verb first, ≤ 12 words); the engine prints "<job>, so <asker> can <that>" (written whole, the job pasted as told ran past the cap; a bare "so" took verb-first clauses ungrammatically). No end line: the finale row is a bare "Finale" until played, then its title (an end line could only restate For).
  - Plan: the question moves before the episodes so the learns are written toward it; the answer stays last (Q5) and also fits the learns. "Titles, job and why are shown before play: never a learn or the answer" (the road prints every job and why on card 1). Labels: at most one trait word, then the trade; race now reaches every cast entry as a trait (a lean asker had none and was coined an elf). Budgets: plan stays 620, card 180 → 170, outline 140 → 130.
  - Partial costs are concrete things (a soldier's sword, a horse, supplies, the locals' goodwill), never time or secrecy.
  - Open for Fable (not done): later cards' `why` repeats the road line shown on earlier cards (dropping it would reverse Q1's title-only ▶ and Q2's why); seeds whose people do not fit the dealt cast (a seed's brother never gets an id; a seed's elven daughter played by a human) need seed-people data or casting by seed (§2.4.2), not a prompt line.
- **R4 verify 2 (verifier `runs/probe6/verifier/r2.json` on 4 real Sonnet sagas, `L_lean_sonnet_r4v`; re-run `L_lean_sonnet_r4v2`).** Budgets unchanged (plan 617/620, card 162/170, outline 130/130, report ≤ 310).
  - Plan: `why` is what the asker can then do with only what the job names ("what the job's thing or person is" asked for the yield: gain or learn, printed before play and restated by the outline). The before-play ban is its own line and covers troubles and the showdown's ("Titles, jobs, whys and troubles … never a learn or the answer"). `people` are those there in person. The showdown's job names the person in ending (non-personal; the PLANS buttons decide them). Trouble fields "≤6 words", a personal `past` "≤8 words" in the reply skeleton ("few words" broke in 4 of 4 runs; "retold" pasted the seed). Cut: "in a few jobs".
  - Card: card 1's `loses` only when it adds two words to the For line's want ("for good" not counted; a want turned round said it twice); the premise gloss drops "new to the player". `intro` (card and report): "first mention gives label and name", present or not.
  - Report: before stops "short of the goal" (a find job's before found it, then failed). Held things are "shown used", where it happens (most uses are approach, before the deciding moment). Presence no longer reads the result ("the slaver does not know it is gone" dealt an absent slaver as present and new). The plan carried out counts as dealt text for labels ("Offer the artisan a place" beside a bare "Marsilia").
  - Outline: never reading, finding, learning, seeing or proving (merged into the action clause). Declined: telling the outline to name nothing beyond the job, since its input `why` exists to ground the purpose and is now job-bound at the source.
  - Engine: "Nobody knows:" (with a colon) parsed for the Open question line. Log-only lints: why naming its gain beyond the job, showdown job not naming the person in ending, outline "find".
  - Re-run (same 4 slots): card caps hold (max 70/70, 73/90; were 85, 82, 79). The merchant is at 2 of 4 jobs (was 4 of 4). The failed find's before stops short. No why-spoilers of gain or learn, except one lint hit (F7_1 ep4 "captain"). Left: a job text that names the answer's mechanism ("take one of the pipes", F6_3, linted as "answer words before the finale"). The plan wording does not hold that line, so it needs an engine lever. One finale report met an intro'd person by bare name.

#### R5 (2026-10-03, lab-only, unjudged: probe7)
- **R5 keeps R4's approach** (engine quest log, scene cards, card-1-safe outline call) and restores what R3's prose did better (`2026-10-03-R4-probe6.md` N11–N15):
  - **P1, the answer is written first again:** question, answer, then episodes, so each learn is written toward a known answer. R4's merged line stays (the answer fits every way in ending and settles); W6 stays open.
  - **P2, `why` is a hope:** what the asker hopes the job gets them; for a thing or person, what they can then do; word or proof only as a hope ("hopes …"), never as fact. `why` is now written right after `job`, before win, gain and learn (verifier r3 #3). Log-only lint: an asserted knowing verb ("will show", "proves").
  - **P3, a slimmer log:** ✓, ✗ and ▶ rows show the title only. Jobs ahead keep their road line, and the finale row is unchanged. The outline only shortens each why ("hopes …" or "can …"; the want is no longer dealt), and the engine prints "<job>. <asker> <line>.". A line written whole keeps only its last sentence.
  - **P4, the For line is a sentence:** the plan writes the want verb first, and the log prints "For: <who>, <label>, who wants to …".
  - **P5, card 1 tells its premise in prose:** who needs you, their want and what nobody knows (plus a personal past). Card 1 drops the loss and the trouble's `will` to hold its 70-word cap. Its log has no Open question line.
  - **Also:** "it follows the last win" is cut (verifier r3 #1), and the title bullet moved into the skeleton. Budgets: plan 620/620, card 170 → 160, outline 130 → 115.
  - **Check (Sonnet):**
    - 16 plan + card-1 draws (`probe7/series_L_lean_sonnet`): card 1 held its cap in 15/16 (median 62.5 words; 11/16 with `will` kept). On screen the median is 117.5 words (R4: 133.5). No `why` asserted what it shows. One of 17 outlines wrote the printed form whole, so the prompt now says "write only those words" and the engine guards against it.
    - Card 1 stamps are back with the premise: "X needs you" opens 15 of 17 card 1s. The seam stamps are left for the 24-slot count.
    - F6_3 played in full. Not fixed: outline lines run over 12 words (17 of 39); a `why` hope written after the answer can hint at it ("the grove's voices falling silent"); the finale's `after` ran 154/140.
- **R5 verify (context-free verifier `runs/probe7/verifier/r1.json`, 11 defects).** The class: what card 1 prints comes only from card-1-safe data, and each fact has one owner.
  - **Outline input is card-1-safe by construction:** the asker, their want, what nobody knows (card 1's premise) and each job's text. The plan's `why` is dropped from it, because the planner writes the why knowing the answer and the learns. Its hope carried them ("hopes the papers show what bound the husband and the scholar"), and an outline that only shortened it printed them on card 1. The call writes the hope in P2's form: for a thing or person, what they can then do; for news, the part of the unknown it may answer. The plan's `why` now prints only on its own card. The plan lint drops the why from its card-1 leak checks. New log-only lint: an outline line carrying a learn.
  - **Card 1 log has no For line** (one owner per fact, as with the Open question). The asker is no longer named from the start. Card 1 introduces them by name and label (`intro`), and from card 2 the For line does (`forLineShown`).
  - **Retry:** a failed report's summary is only what stopped the company, and the retry card gets that alone. The chronicle and a last-chance finale's `latest` show "The company tried to <job>, but <stopper>" (`triedLine`). A retry's trouble has no `will`.
  - **Plan:** a label is race and trade, with no trait word; "the clumsy scholar" had become an epithet in every job. The engine also strips any trait word it dealt from a label, because a check run wrote "thin, slow-witted human hunter" and the comma cut left "thin". `gain` is never the person in ending (non-personal). Budget 617/620.
  - **Card 1 memory:** a returning asker's memory moves into the premise (`returning`), written from the company's side ("You won … back"). The floor now tells it.
  - **Report:** no `truth` reply; it was a blind copy of the secret. The chronicle prints the plan's answer. The finale `after` cap grows 10 per show beyond two (have, hurt, cost). A light job's `before` goes 22 → 30, since 22 broke in 8 of 15 such reports in both R3 and R4 (writers used 20–28 words; the 40 and 60 caps never broke).
  - **Engine:** the floor's road lines are built from the card-1-safe input and cut only at a clause boundary, else the row shows the title. A line written with the job or the asker's label in front keeps what follows its first "hopes" or "can".
  - **Outline replay** (Sonnet, the 15 probe7 plans with 2+ jobs, outline call only, several wordings):
    - No line carries a learn, writes its job, or opens off-form.
    - Asked for at most 12 words, 26 of 39 lines ran over 12. Asked for 10, 6 and then 8 of 39 did (median 11–12, max 14). The prompt now asks 10, and the target stays 12.
    - Three wordings failed and were dropped. "come before it" and "are printed first" were each read as "write the job first" in a replay. "the part of the unknown" came back as "hopes to learn part of why …".
  - **Check run** (`probe7/L_lean_sonnet_r5v`: F5_1, F3_3, F1_3 in full, Sonnet):
    - Card 1 introduces the asker in its prose with no For line above it ("The elf granary keeper, Indure Palebough, needs you"). The returning asker's memory is told from the company's side.
    - Retry cards open on the stopper alone ("Last time, the hunter's grey hound found you near the oak …") and no longer repeat the trouble's deed.
    - The chronicle prints the plan's answer.
    - Caps: card 1 72/70 (F3_3), a later card 83/70 (F1_3, a card with `will`), and a finale summary 28/25.
  - **Declined:**
    - Gloss stamps ("X needs you", "opposes you with", "You must"): these are the seam and opener stamps this round counts rather than fixes. Repetition is watch-only (§D), and R3 N9 measured that rewording a gloss only moves the stamp.
    - Seed people outside the cast ("the husband's riders"): this needs casting by seed (§2.4.2), the open R4-verify item, not a prompt line.
  - Budgets: plan 617/620, card ≤ 160, outline 112/115, report ≤ 310.
- **R5 verify 2 (verifier `runs/probe7/verifier/r2.json`, 10 defects).** The class again: one owner per fact, and nothing on screen before play written from hindsight.
  - **One owner per job's hope** (`jobWhy`). Job 1's hope is the plan's `why` (card 1). It is written beside the outline call, never after it, and job 1's road row is ▶ title only. A later job's hope is its outline line: the same words on the road rows before it and, as `why`, on its own card. Two calls had each written a hope for the same job, and they disagreed ("hopes to learn where the hunter hides" on cards 1–3, then "hopes that taking it will leave the hunter unable to hide" on card 4). The plan's later whys also announced their own learns ("hopes it shows … why it was set there"). The plan still writes a why per job as its own scaffold; only job 1's prints, and the why lints check only that one.
  - **Outline:** no `unknown` and no job 1 in its input. "For news, the unknown it may answer" put the saga's one unknown into every news line, ran past the cap, sat beside "Nobody knows" and the Open question row, and promised a middle job the answer. A line is now one thing the asker can then do with what the job puts in hand or opens, short of their want. It asks 8 words: in a Sonnet replay of the probe7 plans, 11 of 27 lines ran over 12 words when asked for 10, and 0 of 27 when asked for 8. No line carried the unknown. Lines for record jobs still guess at contents sometimes ("hopes to read who holds the grove's claims"). New log-only lint: a line that carries the unknown. Floor line: "hopes it clears the way ahead".
  - **Finale card:** no `why`. The showdown's why was the want itself, printed two rows under the For line in 3 of 3 runs, so the plan no longer writes one. `will` is back on any finale without `lose`. `lose` comes only at a last chance now, and the showdown's will was its sharpest threat, written and shown nowhere ("if you press her, she will smash it"). Job 1's why is "a step short of their want".
  - **Card glosses:** the trouble is "the foe, what they carry[, what they will do]". "Who opposes you, with what" was spoken aloud ("opposes you with", which J2 counts as engine-speak). In 12 card-1 replays that phrase went from 2 to 0, and the unknown was said 10/12 times against 7/12. On cards `part` is "their side.": showing it would break "Use only the data". `why` and `will` are flags, so each gloss renders only when its key is dealt.
  - **Report:** the summary says "no wound (shown beside it)". A partial whose price was the wound took the summary to owe it ("though a soldier was hurt", 28/25).
  - **Labels:** race is its own key in the plan's cast, and `traits` holds personality only. Race inside traits was copied whole into the label. A label written "elf, grove-warden" is joined back ("elf grove-warden"). A comma cut that leaves one word other than a dealt trade becomes the engine's race and trade, never "thin". With no trade dealt, the cut stands.
  - **Watch-only stamp counts** (mech `CS`, probe text lint `stamps card_k`): "now you", "you must", "last time", "needs you", "nobody knows", "stands against you".
  - **Declined:**
    - Rewording "who: the one who needs you" and "unknown: what nobody knows yet". Their stamps are plain English and not engine-speak, so they are repetition, which is watch-only (§D). R3 N9 showed that rewording a gloss only moves its stamp.
    - Dealing the job in noun form, or dropping it from the order line, against "Now you must". This is the seam stamp this round counts and does not fix.
    - "Last time" on a retry: it is the plain way to say the job is being tried again, and it is counted.
    - Card 1 keeps no `will`, because it broke the cap in P5. Episode 1's will stays in the plan's uniform shape.
    - The finale summary cap stays at 25: once the wound clause was gone, the one break fit.
  - **Check run** (`probe7/L_lean_sonnet_r5v2`: F1_3, F5_1, F3_3, Sonnet):
    - Each road row and its job's card carry the same hope.
    - No finale card restates the want, and the showdown's will reaches the finale ("if you press her, she will smash it").
    - Caps held 91%: card_2 74/70, report befores 38/30 and 33/30, one summary 27/25.
    - Card stamps: "now you" 8 and "you must" 8 of 11 cards.
    - Card 1 dropped the unknown in 2 of 3 runs. In the replay this was 2/12 with the new gloss and 5/12 with the old one, so it is writer variance and still open.
  - Budgets: plan 616/620, card 156/160, outline 113/115, report ≤ 310.

### 5.3 Phase 2: build (each step green on the mock)
- **2a Engine:** `saga.ts` (shapes, types, tests, stakes, casting + fences, places, record, injuries, deciding soldier, event edges incl. NPC → soldier); `themes.ts` (the ≥ 1,000-theme library + the dealer); `plainwords.ts`; `chains.ts`; `storyRngState`; `lore.ts` edge helper; `injury.ts`. Tests: saga, castrules, storyrng, themes (no repeat within 50). The structure arm chosen at G1 is the one built; the others stay lab-only.
- **2b AI:** `storyteller.ts` (rendering, builders + names filter, zod, §2.7); templates; `provider.ts` (`planSaga`, `writeCard`, `writeReport`; one-off `writeQuest`/`resolve` kept); `openai.ts` wiring via `callR`; `mock.ts`. Tests: promptbudget, payloadlint, nameleak, planvalidate.
- **2c Game:** `runPursue` (cast → `planSaga` → quest 1 = pitch; `continues` → `writeCard`); `doEndCycle` (injuries, `decides`, cost, `writeReport`); `applyResolution`; `advanceChain`; `settleFinale`; `fateSentence`/`approachOutcome`; `chainViews`; continuation lead; §2.10.
- **2d** UIs in one commit (§4.3). **2e:** tests green; mock campaign (3 seeds) to finales; verifier on real builder output; **the implementer *plays* a full saga in `npm run cli -- --ai`**; lab on A (J1) and B (J1, J2, J3, mock floor).
- **G2 (B):** M1 ≥ 85% (**the gate that matters most**); M2, M3 ≥ base; M5 ≤ 15%; M8 100%; M10 ≥ 65% both families, above calibration; M12 0/0; M15 ≤ 2%; **M17 ≤ base**; **the designer reads 3 matched pairs.** Then banners and GF §22 are written.

### 5.4 Phase 3: tune (≤ 2 rounds per class) and arms
One defect class per round, cheapest lever first (input shaping > position > wording), budget green; per change on **A**, shipping only if M2 and M3 hold. **Arms** (`AIRAIDER_STORY_ARM`, adopted on a measured win): telegraphic reports ("short and medium sentences"; no rhythm rule, −0.45) · one spoken line (`talk` deals `speech: true`; permission alone reads as prohibition) · "?" stamps (`question` as a statement) · banal answers (a dealt category: hidden reason / person / bond / lie / debt) · motivation (a `pressure` fact on what the company risks; touches WC §5.1, flag first) · JSON vs delimited output · bending on failure (a plan `setback` that moves nothing essential, if want-next lags there) · **the mid-saga reveal**, only if every plan field stays valid on every path. **G3 (B):** full targets except M17; J3 runs.

### 5.5 Phase 4: one-offs (right after G2, alongside Phase 3)
The designer's first complaint covered all quests, and one-off prompts run 765–1,548 words. A shared `report.txt` change ships only if both the saga check (A) and the one-off bench hold.
- **Files:** `notice.txt`, one-off `report.txt` variant; `generateOneOff` rolls the reward person (`materializeReward`) **before** the call; engine edges (freed → `saved-by` top roller; captive → `captive-of`); old one-off prompts, resolve blocks and `select` deleted; both UIs in one commit.
- **Verify:** `oneofflab.ts` (prosebench: ≥ 24 unique per arm, ≥ 2 seeds, regenerated, ≥ 3 fresh blind seats) + M1 on one-off cards vs today.
- **G4:** follow ≥ current, reread ≤ current, pull not lower; WRITING_CHECKPOINT samples hold.

### 5.6 Phase 5: models and latency
- **Plumbing (moved from Phase 0):** reasoning-model list (not `/^gpt-5/`); `'minimal'` → `'low'`; per-model prices; per-call model/effort.
- **Arms:** plan on gpt-5.4-mini/low vs gpt-5-mini/medium; card, report, flesh on gpt-5.4-mini/none (rq: readability 4.22 vs 4.32 n.s. at 4× speed; faithfulness −0.21).
- **Switch rule per call:** M1 within 3pp; M11 +≤ 0.1/saga; M8 100%; J3 ≥ 45% vs incumbent. **G5:** M17 absolute targets, or the designer accepts the trade; **R7 decided.**

### 5.7 Phase 6: close
Delete dead flags, paths, arms; archive; `IMPL_NOTES.md`; `promptdump.ts` renders the templates. **G6:** the designer playtests GUI and CLI (M18).

---

## 6. Risks and rulings

### 6.1 Risks

| risk (odds) | mitigation · caught by |
|---|---|
| **Readable but flat** (high) | pitch after jobs, question spine, trouble atoms, floor tests, Phase-3 arms · M3, M10, G1 interest |
| Banal answer (medium) | "nobody could guess", answer lint, category arm · M9 |
| Paperwork returns (medium) | dealt win kinds, no document type, never name the banned word · M13 |
| Pitch cap fails (medium) | cap in skeleton; `first` variant ready · M15 |
| Re-posed cards repeat (medium) | fine; above 50% stamps, deal `trouble` on first attempts only · M14 |
| Causal seams (medium) | `opens`; cards start from `latest` · M11 |
| Labels or pitch spoil (low–medium) | stranger-seen labels given once, names filter · M12, answer lint |
| Shapes feel rigid long-run (medium) | 8 × 2, no repeat within 2; add shapes as content |
| Pursue slow until Phase 5 (certain) | background queue; G2 needs only ≤ base · M17 |
| Injuries feel random; re-draws hide bad plans (low) | facts dealt; fallback logged |
| Judges are not players; the lab eats time (high) | two families, comprehension over taste, light seats, designer at G1/G2/G6, stop rule |
| Phase-2 big bang (medium) | staged 2a→2e on the mock; old storyteller tagged, not live |

### 6.2 Rulings (⏳ R1–R6, R8 before Phase 2; R7 at Phase 5)

| # | ruling | touches | **default** |
|---|---|---|---|
| **R1** · *lab-decided at G2 (§D.6)* | **Retire the hidden bible, genesis and saga prompts.** A saga = public pitch (card 1, written after the jobs) + hidden plan (**question and answer**; jobs with win and opens; showdown with settles and lose). The answer comes out in the finale report (mid-saga reveal: Phase-3 arm). No ERRAND under saga cards. WRITING_CHECKPOINT reopens for sagas. | BIBLE, QUEST_BIBLE, SE §2, GF 5–8, QUESTS §8 + 2026-07-06 (a), WC lock | **Yes** |
| **R2** · *structure = arms S/L/H (§D.1); casting fences, returning face, places stay engine* | **The engine owns structure:** shape, job types (settles the arc-shape ruling), asks, **every person** (location fences, ≤ 1 returning face, 2-saga cooldown), recurring places, stake. Saga slate and selector retire. | QUESTS §2, SE §3, LORE §3, GF §14 | **Yes** |
| **R3** · *default kept (§D.6)* | **The engine owns the rest:** injury bands (small chance on success); event edges with read blurbs, incl. NPC → deciding soldier; partial cost = minted liability, else the roll; `sagaSettled` gone; no AI numbers in sagas. | GF §11/§16-F5, QUESTS §5, LORE §2–§3, SE §12 | **Yes** |
| **R4** · ✅ *decided (§D.4)* | **No pay or prize in prose.** REWARD carries pay; buttons show plain endings via `approachOutcome`, `approachRewardWarn` kept; the free/release regex goes. | PR §3, §12.4; WC §3.5, §4b | **Yes** |
| **R5** · *arm (§D.4)* | **Names:** client, known faces and the personal soldier named from card 1; others go by what a stranger sees until a report names them; label once, then the name. | CGS prop 3; RC §5 kept | **Yes** (fallback: client labelled until report 1) |
| **R6** | **A failed job is re-posed; nothing moves.** No result or deciding soldier; the summary says what stopped the company; `lose` is the only planned loss. | REWARD_BANK §4 | **Yes** |
| **R7** | **Model:** gpt-5-mini (plan medium, rest low); gpt-5.4-mini per call only via the Phase-5 rule. | AI_PROVIDER, SE §9 | **Phase 5** |
| **R8** · ❌ *withdrawn: saves deleted at ship (§D.5)* | **Sagas in flight in old saves lapse on load** (existing lapse path; a same-focal sequel starts a v4 saga). Alternative: migration (§4.1). | `saves/web.json` | **Lapse** |

Untouched: tavern pricing, injury weight, tenure (WC §5.2), voice on saga cards (WC §5.3).
