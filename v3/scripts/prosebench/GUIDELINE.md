# QUEST PROSE GUIDELINE — v1.0, FINAL (2026-08-24)

**Status.** Research complete. Every rule below is traced to verbatim evidence and cross-checked
against at least two independent corpora. Where corpora disagreed, the disagreement is stated and
settled explicitly rather than averaged away.

**Ground truth.** The designer supplied four Sultan's Game quests and called them the goal
(`REFERENCE_SULTANS_RESULTS.md`). **Where anything below conflicts with those four, they win.**
Everything else is corroboration or correction.

**Fidelity status (audited and repaired 2026-08-24; `research/AUDIT_*.md`, repair log at the top of
`research/samples_sultans.md`).**

Three independent adversarial audits found **no fabrication in any corpus**. Every quote traces to a
live source containing it verbatim. The second audit re-fetched **100%** of the KoDP/Six Ages and
mercenary-game corpora — 125/125 and 145/145 blockquotes verbatim, no altered engine slots, no
stitched text, no mislabelled outcomes, no dead sources.

**One audit finding was itself wrong, and I checked rather than believed it.** The Sultan audit's
headline defect — "26 of 216 passages silently truncated, dropping their closing sentences" — is a
FALSE POSITIVE. Its file-side parser stopped at the blank `>` line between paragraphs, so it compared
each passage's first paragraph against the full source. Verified directly against the pre-repair
commit: both of its worked examples were already complete in the file (`Jinn Lantern` already ended
"…They plead persuasively for freedom"; `Tempting Opportunity` already ended "…like a mouse falling
into a rice bin!"). Its §3.2 (5 "title-only" rows) and §3.5 (duplicate count) were also overstated.
**No re-extraction was needed and none was done; PART 1 is complete.** Length and ending claims drawn
from it are therefore safe, and the corpus median (38 words post-repair, 37 before) stands.

Real defects found and repaired: 5 markup leaks, 2 infobox dumps, 4 duplicate rows (216 → **212**
passages across 98 wiki pages), 10 dead PART 3 URLs (`main` → `master`, all now HTTP 200), and two
genuine defects in rite 5000506 (a fabricated ellipsis and a 52-of-183-character truncation), both
replaced with the complete verbatim field. Post-repair: 212/212 PART 1 rows character-exact against
the live `{{quote}}` bodies; 93/93 PART 3 Chinese blocks character-exact against the shipped configs.

The one relabel that DOES bind: the PART 3 English is **not literal**. It splits Chinese sentences
and in six places upgrades plain phrasing into a nicer image (`令人舒爽的风` → "a wind that feels good
on the skin"; the skin is the translator's). All six are now annotated in place. **Use PART 3 for
content and structure only — never as evidence about Sultan's prose style.** Part B and C2/C3 below
draw only on its structure, which is what it is safe for. Also carry forward: the Fort of Chains text
is verbatim-from-the-fork, not certified against a 403-walled vanilla upstream; and all 41 GitHub
citations float on `/HEAD/` against actively-pushed repos, so pin SHAs if they are relied on later.

**Evidence base** (all verbatim, all in `research/`):
| corpus | size | what it gave |
|---|---|---|
| Sultan's Game — designer's samples | 4 quests | the target |
| Sultan's Game — official English | 212 passages / 98 wiki pages | validation at scale |
| Sultan's Game — shipped rite configs | 10 full rites, all branches | the STRUCTURE |
| Sultan's Game — full corpus (translated) | 1485 intros, 3639 settlements | length distributions |
| King of Dragon Pass + Six Ages | 125 blocks / 85 events | the incursion frame; opening subjects |
| Fallen London + Sunless (shipped) | 36 storylets, 61 branches | failure prose; short-form limits |
| Battle Brothers + Fort of Chains | 48 samples / 145 pieces | 33 failures + 6 disasters; graded outcomes |
| Craft literature | 29 sources | Failbetter's full canon, inkle, Choice of Games, Emily Short |

---

# PART A — THE CARD (what the player reads before committing)

**A1. Open on an animate subject doing something, inside the first seven words.**
Measured: 84% in KoDP/Six Ages (105/125), 59% across the whole official Sultan corpus (which mixes
in item blurbs). Verbatim: *"A woman dressed as a warrior blocks your doorway, aggressively demanding
an explanation."* · *"Wild dogs rove your pastures, killing <number> goats."* · *"Someone swore that
they had seen a pure black horse in the wilds east of the city."*
✗ Never open on an object sitting in a place. Our current prompt mandates exactly that and produces
it 18/18: *"A barred door hangs on Thornhollow's outer hall and has stood so since dawn."*

**A2. Use one of the two working frames. Neither is "something broke and a stranger is inconvenienced."**
- **DESIRE** — something you might get, priced by doubt or difficulty. *"an instrument capable of
  unveiling secrets beyond the starry sky"*; *"a pure black horse… many hunters tried to tame it,
  but they all returned empty-handed."*
- **INCURSION** — someone or something is taking from **you or yours**, now, with the damage counted.
  *"Wild dogs rove your pastures, killing <number> goats."* · *"<X clan> warriors kidnap <Y>,
  daughter of the chief."*
Our restitution frame (a tradesman cannot work while a thing sits in a place) appears in no corpus.

**A3. 15–60 words, 1–3 sentences — and the size is BIMODAL, not a target to hit.**
The designer's four cards are 15, 22, 54, 59 words. There is nothing between 22 and 54. A card is
either **one strong sentence of ~15–25 words**, or **two-to-three sentences totalling ~50–60**.
Corpus centres: official Sultan median 38 (p25 23, p75 72; post-repair); Fallen London roots median 22 with a
published ≤30 rule; KoDP median 51. Our cards run 50–75 in four mandated sentences — the wrong
sentence count at every size, and always at the long end.

**A3b. THE CARD AND ITS RESULT SCALE TOGETHER.** Measured on the designer's four: 15w card → 21w
result · 22 → 19 · 54 → 53 · 59 → 51. A small quest gets a small card AND a small result; a
singular quest earns both. Size is a property of the QUEST, so it must be dealt by the engine
(rarity/gravity), never chosen by the writer.

**A4. Sentences centre on 15 words; the working range is 10–30.**
Corpus centres: official Sultan English median **15.2** (p25 12.0, p75 20.5); KoDP 15.0; Battle
Brothers 16.0; Fallen London 8.5–10.5. The designer's own eight pieces span **10.6 → 29.5**, so a
12–20 band would exclude half of the goal texts. **15 is the centre, not a cap.** Longer sentences
belong to the singular quests (the 29.5 is sample 3, a saga beat); routine cards sit at 12–18.
Readability governs the choice: when in doubt take the low end.
My earlier claim that the reference writes LONG subordinated sentences was wrong — that was an
artefact of reading four samples; Sultan's own 345-passage official corpus centres on 15.2.

**A5. Put the load-bearing fact first.** Failbetter: *"shove the important stuff at them straight
away… if you can't, put it in the title."* Ingold (inkle) on why: *"you see a wall of text and your
brain says that's going to take me about this long to read, and that's before you actually go into
the words."*

**A6. The withheld thing lives inside a noun phrase, not in an extra sentence.**
*"a female craftsman **who calls herself** an inventor"* · *"**Someone swore** that they had seen…"*
Doubt rides on the epithet. Our prompt spends a whole appended sentence on this job.

**A7. The last sentence is a vector at the player, of one of four kinds:**
a failed precedent / dare (*"Many hunters tried… all returned empty-handed"*); a named prize as
promise (*"an instrument capable of unveiling secrets beyond the starry sky"*); a wry threat
(*"or the Sultan will get bored before you even finish it"*); or a widening rumour (*"They're
probably attacking other clans, too"*). Never a summary and never a fact already given.

**A8. One vivid particular carries the scene; the reader supplies the rest.**
Failbetter: a glass of cognac in a devil's hand — *"the rest of the room… is already there, wrapped
in that one detail."* Emily Short: *"a small number of very particular ones."* Do not inventory.

**A9. Cost, when present, is a loss ALREADY TAKEN, counted.** *"They've taken two shipments of goods
in the last season"*; the eaten grain, the destroyed urns and masks. Never our formula *"he cannot
tend his hives while he watches it."* (Sultan's omits cost entirely; KoDP counts it. Both work.)

**A10. Keep routine cards generic — they will be drawn again.**
Failbetter: *"stealing a diamond or meeting a wolf, but not stealing the world's biggest diamond or
meeting Lupius, father of all wolves."* Save the singular for singular quests.

**A11. Everyone goes by trade, not by name.** Failbetter ships a tier system — *A Swivel-Eyed
Patriot* → *the Implacable Detective* → *Mrs Plenty* — because generic epithets are *"less prone to
continuity problems"* and survive repeat draws. This independently vindicates our
anonymity-by-omission rule and explains why it exists.

**A11b. A card may be pure REQUIREMENTS, with the stake carried as a joke.** Sample 4 entire:
*"First you need the funds, then you need a legendary architect, or the Sultan will get bored before
you even finish it."* No situation, no client, no cost — a shopping list with a threat attached.

**A12. Engine slots belong in the prose.** 274 of them survive in the KoDP corpus (`<number> goats`,
`<specific illness>`, `<treasure>`), Sultan's ships `[s2.name]`/`[s4.gender]`, Battle Brothers
`%employer%`. Every reference corpus is template-driven. Our anxiety about dealt data reaching the
card is not shared by the craft.

---

# PART B — THE SLOT LINES (the piece we never wrote, and the designer's "make me look at my roster")

**B1. Every slot gets a one-line brief: ROLE + THRESHOLD + WHY.** Verbatim from a shipped rite:
> *"You need at least 5 Magic to part the storm and shield the party"*
> *"An archer, for the beasts lying in wait"*
> *"A quick-witted adventurer, Survival 4 or higher, for all the unexpected dangers"*
> *"Someone strong enough to endure the storm, Physique 4 or higher"*
Numeric requirements are stated **openly**. Every line ends on the reason.
Median slot-line length in the Sultan corpus: **5 words**. Failbetter's branch limit: ≤20.

**B2. This is where difficulty is signalled — never in the prose.**
Failbetter: *"don't talk about how hard the challenge is… If you want to emphasise how difficult
something is, it's better to give it a cost."* Choice of Games (Slitt): *"signal the potential story
results, which stats might be tested, the relative difficulty… especially important when the
potential consequences are negative."* Mawhorter/Short name the failure mode: **blind choice.**
The two are only apparently in conflict — the SLOT states the demand, the PROSE never rates it.

**B3. The one place difficulty MAY appear in prose is as a cost somebody already paid.**
A7's failed-precedent vector (*"Many hunters tried… all returned empty-handed"*) looks like it
breaks B2's "never rate the challenge". It does not, and Failbetter names the exact escape hatch:
*"If you want to emphasise how difficult something is, it's better to give it a cost."* A precedent
is a cost that was paid by someone else. Rating the check ("a hard job", "a difficult test") stays
banned, because the fiction cannot know the player's stats.

**Our engine already holds every number these lines need** (`test.attributes`, `favored`, `clashing`,
`difficulty`, `requirementTag`) and currently renders them as bare dice fields.

---

# PART C — THE RESULT

**C1. Repeat the card's text verbatim, then write on past it.** 4/4 in the designer's samples;
already ruled and recorded as `docs/PROMPT_RULES.md` §11.

**C2. Success and failure are THE SAME SCENE, diverging at the assigned character's verb.**
From the shipped configs, the two branches of one check open with an identical sentence and split at
the moment of the act: *"[s3.name] draws and looses, and is still a step slower than the griffin's
talons"* versus *"[s3.name]'s eye and hand are quick: the arrow blinds its left eye."*
The outcome never re-imagines the scene; it continues and turns.

**C3. The assigned characters are the actors, by name, doing specific things.**
*"[s4.name] sets [s4.gender] own cloak alight and stays behind to hold off the snakes."*
The people you chose do the deeds and pay the prices. This is the empty slot in our resolutions.

**C4. Compress the approach in one clause.** *"Following the hunter's guidance, you lay in ambush for
several days and finally saw it."*

**C5. The card's hook returns as SPEECH at the pivot.** The card's *"many hunters tried… all returned
empty-handed"* comes back as the guide's whisper: *"Many have tried to capture it. All have failed."*

**C6. The pre-roll ends on a LEAN, never a resolution** — an aphorism trailing off, a tricolon of
craving, or the sent soldier rising by name to commit. 3/3 where a roll follows.

**C7. 19–55 words, scaling with the card (see A3b).** Designer samples 19, 21, 51, 53; Fallen London
shipped 31–33; KoDP 31; Sultan full corpus median 51. Failbetter's ≤100 is a CEILING, not a target —
their own shipped median is 33. A one-sentence card takes a one-sentence result.

**C8. The last line delivers a FEELING or points FORWARD, never a fact.** Tonal, not formulaic: a win
undercut by dread; wonder; a promise of more; owned hyperbole.

**C9. The feeling belongs to the SENT SOLDIER, not to the reader.** Sultan's writes the player's
feelings directly (*"you smile, but then you worry"*); Failbetter forbids it outright — *never tell
the player what their character feels*. For us the conflict dissolves: the boss never leaves the
fort, so there is no "you" in the field. Keep Sultan's device, move it onto the soldier.

**C10. The person the card kept anonymous is NAMED here.** *"a female craftsman"* → Mahir throughout.

**C11. No numbers in the prose; the grant line carries them.** 4/4, and already our design.

---

# PART D — FAILURE (our weakest class; now the best-evidenced part of this document)

**D1. Failure is a COST that sets up the next beat, not a verdict.** Ingold, "The Problem of Failure":
get through *"at a cost, with that cost setting up the next beat of the story… keep the player
failing-but-not-failed."* Shipped examples: a companion torn apart and the party presses on; *"the
drows somehow know that it was you who had sent them."*

**D2. State the miss plainly in the first clause, then stop.**
> *"Lost! You arrive too late to earn your fee."* [9 w]
> *"She is not convinced, even allowing some artistic license."* [9 w]
> *"You've been spotted. How embarrassing. You excuse yourself and hurry off."* [11 w]
> *"The envoy didn't make it. %employer% can accept losses here and there, but he's not going to be
> happy about this."* [27 w]

**D3. Deadpan, occasionally wry. Never melodrama, never blame on the men.** The consequence is the
client's annoyance or the quarry's escape — not the party's shame.

**D4. Uncertainty is allowed.** *"It is hard to say but he was probably killed by neighboring
patrols."*

**D5. Failure runs SHORTER than success.** Failbetter states it — *"make success text a bit longer or
more interesting than failure text"*, because *"text is a reward for play"* — and it is measured
independently in Fallen London (33 vs 31) and strongly in Battle Brothers (105 vs 75).

**D6. Grade it: FAILURE = objective missed, everyone comes home. DISASTER = objective missed AND
something is lost that persists.** Fort of Chains ships this pair per quest, with disaster roughly
twice the length because a lasting cost needs stating. Our engine already grades outcomes.

---

# THE NUMBERS, in one table
| piece | words | sentences | w/sentence |
|---|---|---|---|
| card | **15–60**, bimodal (~15–25 or ~50–60) | **1–3** | **10–30**, centre 15 |
| slot line | **5–20** | 1 | — |
| result (success) | **19–55**, scaling with the card | 1–5 | 10–30, centre 15 |
| result (failure) | shorter than its success | 2–4 | 10–30, centre 15 |
| disaster | ~2× failure | — | — |

# WHAT THIS RESEARCH FALSIFIED IN MY OWN EARLIER WORK
1. **"Four things in four sentences"** — the reference is 1–3 sentences. My mandate is the single
   biggest structural mismatch with the goal.
2. **"No sentence past fifteen words"** — 15 is the CENTRE of the reference distribution, not the cap.
3. **"The card must account for what the trouble costs the client"** — no Sultan intro does this;
   KoDP counts a loss already taken instead. My abstract "cannot work while it lasts" appears nowhere.
4. **"Long subordinated sentences"** (my own draft v0, from the four samples) — falsified by Sultan's
   own 345-passage official corpus at 15.2 median.
5. **"Open on one thing out of place that an eye could catch"** — the reference opens on people
   acting, 84% of the time.
6. **"Close on one thing that does not fit"** as a bolted-on final sentence — the reference carries
   its withholding inside a noun phrase and spends its last sentence on a vector at the player.

# SELF-AUDIT — does this guideline actually contain the goal texts?
Run against the designer's four quests (eight measured pieces) after the bands were fixed:
**8/8 contained.** The first draft of this document scored **3/8** — its bands came from corpus
medians (dominated by the larger KoDP and Fallen London corpora) and excluded five of the designer's
own samples, including both one-sentence cards. That drift is exactly what the designer warned
against, and the bands were widened to the ground truth rather than the ground truth being ignored.
Re-run the audit after ANY future edit to the numbers.

# OPEN RULINGS (designer only)
1. **Name the prize?** The reference names it as a thing that exists in the world, never as a payout
   somebody hands over. Our `rewardItems` are deliberately withheld from the card writer because
   possession framings bred contradictions — a framing the reference never uses.
2. **Write the slot lines?** Part B is a new artefact for us. It needs an engine change to render,
   and it is the strongest single lever for "make me look at my roster."
3. **Fragment stacks** — `PROMPT_RULES` §7 bans them; Sultan's uses them ("A nod, a word shared, a
   handshake"); Failbetter calls them "precious" when used only for pacing. Currently: our ban stands.
4. **Which result register** — Sultan's sensory close, or KoDP's plain collective report ("we/us/our")?
   The designer's samples are Sultan's; KoDP's is the one that handles failure without melodrama.
