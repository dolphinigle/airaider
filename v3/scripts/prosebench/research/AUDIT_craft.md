# Adversarial fidelity audit — `craft_literature.md` and `reference_failbetter.md`

Audited 2026-08-24. Method: every cited URL re-fetched **fresh** with `curl` (the prior agent's
cached page dumps in the session scratchpad were ignored on principle), stripped to plain text, and
every distinctive quoted phrase tested as a Unicode-normalised, punctuation-insensitive substring of
the live page. Where a quote was not found at its cited URL, the phrase was searched across every
other fetched page and then across the open web to establish whether it exists elsewhere, in altered
form, or nowhere. Medium (403 to non-browser clients) was recovered through `web.archive.org` `id_`
snapshots. Part B storylet samples were re-harvested through `fallenlondon.wiki/w/api.php` and the
Fandom `api.php` endpoints and diffed against the file.

**Scale of the check:** ~316 phrase-level substring tests covering ~190 distinct quotations in
`craft_literature.md`; 104 quote blocks in `reference_failbetter.md` Part A; 215 storylet text
samples plus 215 word counts in Part B; 61 distinct URLs status-checked.

**Bottom line up front:** the corpus is far more accurate than an adversarial prior would predict.
No fabricated quotation was found. There is **one substantive misquotation** (Loewenstein), **one
block of five quotes filed under the wrong URL** (Choice of Games), **one crossed pair of Vonnegut
citations**, two author surnames supplied from outside the sources, and a scatter of silent
elisions/typo-corrections inside quotation marks. `reference_failbetter.md` is essentially clean.

---

## 1. Quote-by-quote results — `craft_literature.md`

Legend: **V** = verified verbatim at the cited URL · **V\*** = verified but with a wording defect
· **WRONG-URL** = quote is genuine but not at the URL the file cites · **MISQUOTE** = words differ
from the source · **NOT AT SOURCE** = absent from the cited page · **INFERENCE** = the file's own
claim presented as source content.

### §1a — Fallen London Writer Guidelines Part III (Olivia Wood)
`https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-iii` · HTTP 200

| # | Quote (opening words) | Verdict | Evidence |
|---|---|---|---|
| 1 | "Root descriptions should not go longer than 30 words… branch… 20… result… 100" | **V** | Exact, under heading "Write short" |
| 2 | "There are exceptional circumstances in exceptional storylets…" | **V** | Exact |
| 3 | "This is incredibly vague advice… Don't tell them they're scared; scare them." | **V** | Exact, "Show, don't tell" |
| 4 | "We've overused 'all across London'… Who is doing it? Where? How?" | **V** | Exact |
| 5 | "Direct speech must pass the say-this-shit test…" | **V** | Exact |
| 6 | "You can write this shit, George, but you sure can't say it." | **V** | Exact. Source frames it as "the blessed teachings of Saint Harrison of Ford"; the file's gloss "Harrison Ford to George Lucas" is the compiler's, factually correct but not stated on the page |
| 7 | "A little goes a long way. Treat it as seasoning, not an ingredient." | **V** | Exact |
| 8 | "A branch should almost always be a clear in-character action…" | **V** | Exact |
| 9 | "A result should describe one action… break the actions out into multiple branches." | **V** | Exact |
| 10 | "It has its uses ('London was stolen by bats')…" + "Treat it as a reminder to get down there and evoke." | **V** | Exact |
| 11 | "Be careful, here… It comes across as precious." | **V** | Exact |
| 12 | "You are condemning your sentence to be swallowed without chewing…" | **V** | Exact |
| 13 | "diaphanous gowns / brief lives burning brightly / black as pitch / it was quiet. Too quiet." | **V** | Exact (bullet list on page) |
| 14 | "It never more than drizzles in Fallen London." | **V** | Exact |
| 15 | "It's always dark… Use social events to express time instead…" | **V** | Exact |
| 16 | "We can't assume the player is male, female…" / "'Sleeves' or 'hems' are probably safe." | **V** | Exact |
| 17 | "Pop Culture References — No." | **V** | Exact; it really is the whole section |
| 18 | Framing: weather/time/appearance rules are "banned **because they conflict with a nonlinear, replayable, avatar-agnostic frame**" | **INFERENCE** | The source gives no rationale at all. Weather/Time are stated as *setting* facts (Fallen London is underground); only the appearance rule is about player-agnosticism. The causal story is the compiler's, presented in the position of a source claim |

### §1b — Writer Guidelines Part II · HTTP 200
All seven quotes **V** (quality parsimony; "Two qualities tends to be the magic minimum number…";
hold-off rewards; "Use quality changes to make non-player characters more tangible"; "Be cautious —
a string of quality changes…"; the ice-pick note). One apparent mismatch on the heading
"…more tangibl**e**" is a rendering artifact of failbettergames.com, which truncates the final
character of several headings ("Quality Parsimon", "Sporadic Pla"). The file is right, the site is
broken. Not a defect.

### §1c — "Narrative Snippets: Writing for Story Games" · HTTP 200
All nine quotes **V**, including the two the parent relies on:
"a single sentence for root and branch descriptions and a paragraph for event text"; "make success
text a bit longer or more interesting than failure text"; "If you go over four or five paragraphs,
you've definitely gone too far"; "Put the important stuff first…"

### §1d — "Narrative Snippets: Parsimony" · HTTP 200
All seven quotes **V**: "Fires in the desert. This is Failbetter's term for using underspecified
narratives for effect"; "The player's imagination is your ally"; "a river rather than a tree"; "You
want any one character to see 90% of your content".

### §1e — "Agency and Choices" · HTTP 200
All six **V**. The bolded gloss "set up the situation in one storylet and put the choice in the
next" is an unmarked paraphrase but is **faithful** — source: *"it's probably best to lay out the
situation that causes the choice in one storylet, and then let the player make the choice in the
next."*

### §1f — "Difficulty, Rewards and Punishment" · HTTP 200
All nine **V**, including the load-bearing one: "don't talk about how hard the challenge is in the
surrounding fiction… don't reference how hard a problem was, just that there was a success or a
failure. If you want to emphasise how difficult something is, it's better to give it a cost."

### §1g — "Pacing" · HTTP 200
All five **V**, including "stealing a diamond or meeting a wolf, but not stealing the world's
biggest diamond or meeting Lupius, father of all wolves."

### §1h — "Points of light, pools of shadow" I & II · HTTP 200 (both)
All 30 quotes **V** — cognac glass, 90% of the canvas, the *when* / *where-or-how* rule, the Pale
Wastes hedge, the passive-verb argument, "Says rather than utters", Victorian whatnots, and the
entire name-tier passage (Scarred Naturalist / Keen-eyed Lapidary / A Swivel-Eyed Patriot / the
Implacable Detective / Mrs Plenty, Sinning Jenny, Dr Schlomo).

**Attribution defect — see §3 below: byline is "Failbetter Games", not "Yasmeen Khan".**

### §1i — "Choice, Complicity and Consequence" · HTTP 200 — all four **V**
### §1j — "Don't Poke That" · HTTP 200 — both **V** ("Show them the Implements"; the cross passage)

### §2a — Emily Short, "The Prose Medium and IF" · HTTP 200

| # | Quote | Verdict | Evidence |
|---|---|---|---|
| 1 | "All text in interactive fiction is at least potentially a direction to the player…" | **V** | Mid-sentence in source ("namely, that all text…"); file capitalises. Trivial |
| 2 | "Something glints…" / "Through the fragile surface of the glass ball…" | **V** | Exact |
| 3 | **"direct the player to examine, to smash, to kiss"** | **MISQUOTE (minor)** | Source: *"**directs** the player to examine, to smash, to kiss."* The file also drops the **third** example (the sleeping princess) without an ellipsis, which orphans "to kiss" — the reader cannot see what the "kiss" attaches to |
| 4 | "Nick Montfort's dissertation refers to this as the Suggester role of IF text." | **V** | Exact |
| 5 | "a willingness to foreground in description the functional aspects of an object…" | **V** | Exact |
| 6 | "…they are probably best omitted. This is a medium that rewards restraint." | **V** | Exact |
| 7 | "not with a large number of common details… but with a small number of very particular ones" | **V** | Exact |
| 8 | "Words in interactive fiction *individually* carry more weight…" | **V** | Exact |
| 9 | "…IF is closer to poetry than to conventional prose… inspected through a jeweler's loupe." | **V** | Exact. Context confirmed: it is about P. D. James-style description, as the file says |
| 10 | "The first page of a novel that sells presents itself with utter assurance…" | **V** | Exact, under her heading "Confidence" — her own words, not a quotation of someone else |
| 11 | "We rely on the player's trust and confidence in the author…" | **V** | Exact |
| 12 | "avoiding any commitments in prose that you're not willing to honor in the world model" | **V** | Exact |

### §2b–§2e — Emily Short (storylets / pacing / mailbag / small-scale) · all HTTP 200
All 14 quotes **V**, including the storylet definition, "The story's up-front hook needs to be new
content", the 'Number of Times You Fed the Chameleon' quality, and the confirmation-required-choice
passage. The file's bracketed "[Ingold]" after "Jon" is an honest editorial insertion.

### §2f — "Choice Poetics (Peter Mawhorter)" · HTTP 200
All 21 quotes **V**, including every one the parent relies on: **"blind choice"** ("the infamous 'go
left or go right' choice where the player has no framing information to establish the stakes of the
choice"), false choice, dead-end option, dilemmas vs flavor choices, unchoices, the three formal
definitions, "Human-written option text often makes one of the options a punch line", and "A
*chancy* challenge for your Persuasive quality". Attribution correct: Short's post, summarising
Mawhorter — the file says so.

### §3a — Jon Ingold, "The Problem of Failure" · Medium **HTTP 403** (recovered via Wayback, 200)

| # | Quote | Verdict | Evidence |
|---|---|---|---|
| 1 | "…in *Die Hard*, we know for a fact that McClane won't be killed. But he might well be shot…" | **V\*** | Source: *"In **the case of** Die Hard, we know for a fact…"* — three words silently deleted mid-sentence with no ellipsis. Everything downstream ("bleeding… trail… one hand… electrical fire… some consequence… we don't yet know what it'll be") is verbatim |
| 2 | "In action and adventure stories, it's common for the hero to face a challenge and neither succeed nor fail…" | **V\*** | Source opens "**More generally,** in action and adventure stories…" — silent deletion, no ellipsis |
| 3 | "…that *failure is a bad thing*." | **V** | Exact |
| 4 | "…failure itself is interesting", "fail forwards", "squeaking through" | **V** | Exact |
| 5 | "sustain the experience of failing for as long as possible… **failing-but-not-failed**… if there's still *life* there is still *hope*." | **V** | Exact. This is the quote the parent leans on hardest; it is genuine |

Header claim "the text of an unheld GDC 2019 talk" is confirmed by the post's own subtitle: *"This is
the rough text of a GDC talk that didn't happen in 2019."* Byline: inkle / Jon Ingold. Correct.

### §3b — Haywire, "Wordplay: Jon Ingold" (Joe Köller) · HTTP 200
All nine **V**, including "having three or four paragraphs to read before the next choice came along
— caused a significant tail-off in people's interest in reading", "ruthlessly short chunks", "They
read without meaning to", and "Text is a visual medium." Byline verified on page: *"October 27,
2013 · by Joe Köller."*

### §3c — Narrative News (Rose Behar) · HTTP 200
All 11 **V**. Byline and date verified on page: *"Rose Behar · Apr 01, 2026."*

### §3d — Robert Yang's notes on "Sparkling Dialogue" · HTTP 200
All 18 **V**, including Accept/Reject/Deflect, the trapdoor, "Branching is action, action is
character, character is drama", and Ingold's disclaimer "as with all writing advice, it's bullshit,
but hopefully it's useful bullshit" — the post explicitly labels this *"(Ingold's disclaimer: …)"*,
so the file's attribution to Ingold rather than Yang is right.
The file's paraphrase "repeats the merchant's name and location **three times each**" is **confirmed
exactly**: the post writes *"(Duris. Duris. Duris.) … (Sami. Sami. Sami.)"*.
Page title verified as "Sparkling Dialogue" despite the URL slug reading "sparking".

### §3e — "Introduction to Ink" · Medium **HTTP 403** (recovered via Wayback, 200)

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | "By default, ink will repeat the text of the choice into the flow of the story, but that — like most things! — can be changed with a bit more markup." | **V** | Exact |
| 2 | Attribution "(Jon Ingold, Wireframe)" | **V** | Page title: *"Introduction to Ink (by Jon Ingold)"*, republished on Medium by D S Wadeson, with the line *"This article was originally published in Wireframe magazine."* The file's attribution is correct even though the Medium byline is Wadeson's |
| 3 | The `"Ah."` → `"Ah," I replied` example | **V** | Verified at the gamedeveloper.com URL the file cites for it: *"in the case of: 'Ah[.'],' I replied … The choice text is \"'Ah.'\", but when chosen, the game displays \"'Ah,' I replied\"."* Note it is **not** in the Medium ink-intro piece — the file is right to cite the other URL for it |
| 4 | "The ink square-bracket syntax exists **specifically so** the choice text and the resulting prose **can differ**" | **INFERENCE** | Source states the opposite emphasis: the notation *"is intended to capture the core **similarity** between the text of the choice and the text that the game produces as output."* The mechanism does allow divergence, but the stated design intent is inverted. Repeated in summary rule 13 as "the language ships syntax specifically so… need **not** be identical" |

### §4a — Rebecca (Becky) Slitt, "How to Write Intentional Choices" · HTTP 200
All 13 **V**. Byline verified: *"Posted by: Becky Slitt."* ("Rebecca" is her published name; not a
misattribution.) The *Mecha Ace* worked example checks out in detail — the post's own ChoiceScript
excerpt shows `*if speed >= 7` on withdraw, `*if willpower >= 3` on "Keep calm", and the post
explicitly says fighting aggressively "will test your piloting". The file's stat labels are correct.

### §4b — "How We Judge a Good Game — Part 2" · HTTP 200
All 18 **V**, including the baseball-cap rule verbatim and the Charisma/Stealth consistency rule.
Author is **Rachel E. Towers**; the file attributes only to "Choice of Games", which is incomplete
but not wrong.

### §4c — "How We Judge a Good Game — Part 3" + Mary Duffy, "How to Edit Yourself" · both HTTP 200

| # | Quote | Verdict | Evidence |
|---|---|---|---|
| 1 | "second person games should use first person options" | **V** | In Part 3, "Prose Styling" section |
| 2 | "The dictum of fiction is: 'Does this sentence reveal character or move the plot forward?' If it doesn't, cut it." — attributed by the file to **Mary Duffy** under the heading "**their editor, quoting Vonnegut**" | **WRONG-URL / CROSSED** | The line is **not in "How to Edit Yourself"**. It is in **Part 3**, spoken by "Mary" in the judges' round-up. She does **not** name Vonnegut there — the Vonnegut attribution is imported from the *other* quote. Speaker attribution is right; source article and the "quoting Vonnegut" framing are not |
| 3 | "Kurt Vonnegut's dictum that each sentence should either reveal character or advance the plot is particularly good." | **V** | This one **is** in "How to Edit Yourself" (Mary Duffy). So the pair is exactly swapped relative to the file's presentation |
| 4 | "Do you use the word 'realize' or 'suddenly,' or the phrase 'and then' to exhaustion? Find them, replace them." | **V** | "How to Edit Yourself" |
| 5 | "Reading aloud will bring to light infelicities like ambiguous antecedents…" | **V** | "How to Edit Yourself" |
| 6 | "Try to condense your game down [to] a single sentence…" | **WRONG-URL** | Genuine, but in **Part 1**, not Part 3. (Part 1's URL appears in the sources index but is *not* one of the two URLs the §4c heading cites.) The file's bracketed `[to]` honestly repairs a typo in the source, which reads "condense your game down a single sentence" |
| 7 | "Games with a gripping premise make readers curious (without confusing them!)" | **WRONG-URL** | Also **Part 1**, "Setting and Plot" section |
| 8 | Dan: "A good story is like a good joke…" / Jason: "…not to be asked the same question repeatedly…" / Becky: "Does the story make me feel something?…" | **V** | All three exact, in Part 3's judges' round-up |

### §4d — Dan Fabulich, "By the Numbers" · HTTP 200 — **V** (delayed branching; *Choice of the Dragon*). Byline verified.
### §5 — Sam Kabo Ashwell, "Standard Patterns…" · HTTP 200 — all 8 **V**.

### §6a — Mark Rosewater, "The Write Stuff" / "Add Text to Flavor" · both HTTP 200

| # | Quote | Verdict | Evidence |
|---|---|---|---|
| 1–7 | concision/rhythm; *Luminous Guardian* "six words… alliteration"; parables; Rule of Three; per-character writer; *Tempest* quotable line; comedy-as-juxtaposition | **V** | All exact in "The Write Stuff" |
| 8 | "Now is the time. We are the people. This is our action. Charge!" (summary rule 15) | **V** | Exact, *Eladamri, Lord of Leaves* flavour text |
| 9 | Mistretta: "Cheap, broad 'humor' and the casual tone of modern flavor text is killing the once wonderful tone…" | **V** | Exact |
| 10 | Mistretta: "These **characters** make the flavor text impersonal and monotonous… thrust it onto a bunch of unlikable, one-dimensional characters." | **MISQUOTE (minor)** | Source reads "These annoying **character** make…" (a typo in the original letter, silently corrected without brackets), and the sentence does **not** end there — it continues "…one-dimensional characters **and situations that seem like they were drawn from some 16-year-old pothead's half-baked D&D campaign.**" The file terminates it with a full stop and no ellipsis |
| 11 | "— Will Mistretta, quoted at length by Rosewater" | **V** | Correct: Rosewater introduces it as "a letter by Will Mistretta" |

### §6b — "The Pro's Guide To CCG Flavor Text Writing" (wondersccg.com) · HTTP 200
All 18 quotes **V** verbatim, including all three rules with their bad/good pairs, the bat example,
the venomous-insect twist, and the competitive multi-submission process note.
Author claim "by a working CCG lead designer" is **supported**: the (unnamed) author writes
*"starting as a junior game designer, and all the way up through becoming the lead designer on many
TCG releases."*

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Heading "**The budget:** 'Each card has a limit, such as \"100 characters\" to work within.'" | **V\* / framing defect** | The sentence is verbatim, but the source presents 100 as an *illustration* ("such as") and the **next sentence**, omitted without ellipsis, is: *"Usually there is some flexibility on the character limit. For example, it might be possible to get 110 characters if we are clever with line breaks."* Calling it "the budget", and then listing it in summary rule 1 among "hard word budgets", converts an example into a standard |

### §6c — MTG Wiki, Flavor text · HTTP 200 — both **V**.
### §7 — Alexis Kennedy, Cultist Simulator · Medium **HTTP 403** (Wayback 200)
All six **V**, with one silent typo-correction: file reads "for either curiosity **or** profit";
source reads "for either curiosity **of** profit". Minor, arguably a repair.

### §8 — "GDC Austin: Writing for MMOs: You're Doing it Wrong" · HTTP 200
All 10 **V**, including "No one wants to read in MMOs", the 27-pieces-of-quest-text example, "the
Christmas tree effect", and the tone-document quote. Both named speakers (Tracy Seamster, Steve
Danuser) appear on the page.

### §9 — Loewenstein / curiosity — **the one substantive misquotation**

| # | Quote | Verdict | Evidence |
|---|---|---|---|
| 1 | Curiosity arises "when attention becomes focused on a gap in one's knowledge. Such information gaps produce the feeling of deprivation labeled curiosity." | **V** | Verified **both** at the PBS NOVA page and in the paper itself |
| 2 | Curiosity is "**a cognitive induced deprivation that arises from the perception of a gap in knowledge and understanding**" | **MISQUOTE + NOT AT CITED SOURCE** | **(a)** It does **not** appear on the PBS page the file cites as "Source (quoting the paper)". **(b)** The paper's actual abstract reads: *"a form of **cognitively** induced deprivation that arises from the perception of a gap in knowledge **or** understanding."* Three defects in one sentence: `cognitive`→`cognitively`, `and`→`or`, and the dropped "a form of". This is the well-known garbled version that circulates on secondary blogs — evidence the line was copied from a third-hand source, not from Loewenstein |
| 3 | "The operative corollary for card text: **curiosity is strongest when the gap is small and specific** — the reader must be made to feel they *almost* know." | **INFERENCE** | The compiler's own claim, stated immediately after two quotations and typographically continuous with them. Loewenstein's actual gap-size finding is an inverted-U in *proportion of information already held*, which is related but is not what the sentence says. Nothing supports it in the material quoted |
| 4 | Paper URL `cmu.edu/dietrich/sds/docs/loewenstein/PsychofCuriosity.pdf` | **HTTP 200 but unreadable** | The PDF is a 24-page **scanned image with no text layer** — it cannot be searched, and nothing in it can have been verified by text search. A text-layer copy exists at `byrdseed.com/handouts/Psychology%20of%20Curiosity.pdf` (used for this audit) |

---

## 2. Discrepancies, claimed vs actual

| Claimed in file | Actual in source |
|---|---|
| Loewenstein: "**a cognitive** induced deprivation… gap in knowledge **and** understanding", sourced to the PBS NOVA page | "**a form of cognitively** induced deprivation… gap in knowledge **or** understanding" — Loewenstein 1994 abstract. **Not present on the PBS page at all** |
| §4c: "Try to condense your game down [to] a single sentence…" and "Games with a gripping premise…" cited to **How We Judge a Good Game — Part 3** | Both are in **Part 1** (`/2017/03/how-we-judge-a-good-game-part-1/`) |
| §4c: "The dictum of fiction is: 'Does this sentence reveal character…'" presented under the **"How to Edit Yourself"** heading as "their editor, quoting Vonnegut" | The line is in **Part 3** (Rachel E. Towers's post), spoken by Mary Duffy, **without** naming Vonnegut. The Vonnegut-naming quote is the *other* one, in "How to Edit Yourself". The pair is swapped |
| §1h / summary ×6 / sources index: "**Yasmeen Khan** — Points of light, pools of shadow" | Both pages are bylined "**By Failbetter Games**, June 20th / July 1st, 2011". First name is corroborated only indirectly, by the sibling post "Don't Poke That" ("*Yasmeen* has talked in recent posts about the process and style of our writing"). **The surname "Khan" appears nowhere in either source.** (Yasmeen Khan is a real early Failbetter writer, so the identification is almost certainly right — it is just not *from the source*) |
| §1j / sources index: "**Nigel Evans** — Don't Poke That" | Page byline is "By Failbetter Games"; the post's own first line is "[Tagged as Alexis, **written by Nigel**]". **The surname "Evans" appears nowhere on the page.** (Again, correct in fact — Nigel Evans is a Failbetter writer — but supplied by the compiler) |
| §2a: examples "**direct** the player to examine, to smash, to kiss" | "**directs** the player to examine, to smash, to kiss." Also: the file lists 2 of the 3 examples the verb governs, silently dropping the sleeping-princess example that "to kiss" refers to |
| §6a: "These annoying **characters** make the flavor text impersonal and monotonous. They take the focus off the players and thrust it onto a bunch of unlikable, one-dimensional **characters.**" | "These annoying **character** make…" (source typo, silently fixed) and the sentence continues "…one-dimensional characters **and situations that seem like they were drawn from some 16-year-old pothead's half-baked D&D campaign.**" — truncated with a full stop, no ellipsis |
| §3a: "…in *Die Hard*, we know for a fact…" | "In **the case of** Die Hard, we know for a fact…" — silent three-word deletion |
| §3a: "**In action and adventure stories**, it's common…" | "**More generally, in** action and adventure stories, it's common…" — silent deletion |
| §7: "for either curiosity **or** profit" | "for either curiosity **of** profit" (source typo, silently fixed) |
| §6b: "**The budget:** Each card has a limit, such as '100 characters'" — then listed in summary rule 1 among "hard word budgets" | Source gives it as an example and *immediately* qualifies: "Usually there is some flexibility on the character limit… it might be possible to get 110 characters." **Not a hard cap** |
| Summary rule 9: "**MtG (Rosewater):** consistent character voice **required** a *dedicated writer per named character*" | "the flavor text team tried **an experiment**. To give a consistent voice to the major *Magic* characters, each crew member was assigned to a different writer." A one-off experiment on one block (Weatherlight/Tempest), not a requirement |
| §3e / summary rule 13: ink's bracket syntax "exists **specifically so** the choice text and the resulting prose **can differ**" | "it… is intended to capture the core **similarity** between the text of the choice and the text that the game produces as output" |
| §1a: weather / time / player-appearance rules are "banned **because** they conflict with a nonlinear, replayable, avatar-agnostic frame" | Source gives no rationale for the weather and time rules; they are stated as facts of the Fallen London setting (it is underground). Only the appearance rule is about player-agnosticism |
| File header: "Everything below is quoted from the source. Paraphrase is marked `[paraphrase]`." | The marker `[paraphrase]` is used **zero times** in the document, while it contains at least six unmarked paraphrases and inferences (rows above, plus the §9 curiosity corollary and the summary-section syntheses). The stated convention is not honoured |

---

## 3. `reference_failbetter.md` — results

### Part A (guidelines, reproduced)
**104 quote blocks extracted and tested against freshly fetched pages: 104/104 verified**, once two
scraping artifacts on failbettergames.com's own HTML are discounted (`whe n` for italicised *when*;
truncated headings). Every ellipsis in Part A is explicitly marked `[...]`; I found **no** silent
elision anywhere in Part A.

Attribution here is **more careful than in `craft_literature.md`** and is correct:
- A1 "(By Olivia Wood, May 5th, 2015.)" — matches the byline exactly.
- A8 "(Failbetter Games, June 20th, 2011. **Written by Yasmeen**…)" — hedged to the first name, exactly as the sources support.
- A10 "(Failbetter Games, July 9th, 2011. **Tagged as Alexis, written by Nigel.**)" — quotes the page's own note.

The two files therefore **contradict each other** on authorship: `reference_failbetter.md` says
"Yasmeen"/"Nigel", `craft_literature.md` says "Yasmeen Khan"/"Nigel Evans". The cautious version is
the one the sources support.

Minor: A1 says the post is "reproduced **in full**". It omits one navigation sentence ("Previous
posts on this theme are here: …"). Immaterial, but "in full" is very slightly overstated.

### Part B (storylet samples)
- **36 storylet sections, 61 branches, 36 roots, 60 success texts, 58 failure texts — 215 text items.**
- **215/215 word counts are exactly correct** (recomputed from the quoted text).
- **213/215 texts are exact substrings of the live wiki source** (re-harvested via
  `fallenlondon.wiki/w/api.php` and the Sunless Sea/Skies Fandom `api.php`). All 83 source pages
  fetched without a single API error.
- A completeness pass (checking the file's text against the *whole* template field, not just a
  substring) found **no silent truncation**: the single flagged case (B7, "Interrogate the
  manservant") is a false positive from my own field-boundary regex.
- The "**zero elision markers**" claim holds: no `[…]`, `[...]` or `{{ }}` appears anywhere in Part
  B. (The 15 `[...]` markers in the document are all in Part A, all the compiler's own, all marked.)
- Provenance claims spot-checked and true: `fallenlondon.wiki` API works; `fallenlondon.fandom.com`
  and the Sunless Fandom `/wiki/` HTML endpoints do return 403 to non-browser clients as the file
  states (their `api.php` endpoints do not); `https://www.failbettergames.com/fltp/` really is 404,
  as the "WHAT I COULD NOT GET" section claims.

**The only two Part B defects, both minor:**

| Claimed | Actual |
|---|---|
| B35 root: `"I think we hit something, **[Addressed As]**," your driver observes` — counted as 25 words | Wiki source has the wikilink `[[Addressed As#SpeechFormal\|Addressed As(SpeechFormal)]]`. The compiler rewrote a game token into a bracketed placeholder. Defensible, but it conflicts with the file's own stated policy ("Two Fallen London failure titles contain the unresolved template `{{af}}`… Left as-is rather than guessed"), and the invented token is counted in the word total |
| B35: `**Branch — "Double back — rare failure variant (50%)"** *(4 words)*` followed by `> (same branch as above)` | "(same branch as above)" is the compiler's editorial note, but it sits inside a blockquote with a word count, so it reads as a 4-word sample. Cosmetic |

---

## 4. URL status (all 61 distinct pages; FL-wiki article URLs sampled)

| Domain / page | Status |
|---|---|
| `failbettergames.com/news/*` — all 22 cited posts, incl. the A12 index table | **200** (every one) |
| `emshort.blog` — all 6 | **200** |
| `choiceofgames.com` — all 6 | **200** |
| `haywiremag.com/features/wordplay-jon-ingold/` | **200** |
| `narrativenews.substack.com/p/inkles-jon-ingold-on-the-craft-of` | **200** |
| `blog.radiator.debacle.us/...sparking-dialogue...` | **200** |
| `gamedeveloper.com` — both (ink; GDC-Austin MMO) | **200** |
| `heterogenoustasks.wordpress.com` | **200** |
| `magic.wizards.com` — both Rosewater columns | **200** |
| `wondersccg.com` | **200** |
| `mtg.wiki/page/Flavor_text` | **200** |
| `pbs.org/wgbh/nova/article/how-to-stimulate-curiosity/` | **200** |
| `cmu.edu/.../PsychofCuriosity.pdf` | **200 — but a scanned image, no text layer; not text-searchable** |
| `gdcvault.com/play/1021774/...` · `archive.org/details/GDC2015Ingold` | **200** (correct talk, verified by title) |
| `fallenlondon.wiki/wiki/*` — 76 URLs | **200** (sampled; all 83 API fetches succeeded) |
| **`medium.com/@inklestudios/the-problem-of-failure-...`** | **403** to any non-browser client |
| **`medium.com/game-writing-guide/introduction-to-ink-...`** | **403** |
| **`medium.com/sex-lies-and-videogames/alexis-kennedy-...`** | **403** |
| `sunlesssea.fandom.com/wiki/*` (4) · `sunlessskies.fandom.com/wiki/*` (3) | **403** to non-browser clients (live in a browser; `api.php` works) |

**No dead links.** Nothing 404s except `failbettergames.com/fltp/`, which the file itself flags as
dead and does not cite as a source. The 403s are bot-blocking, not link rot — all three Medium
articles were recovered intact from `web.archive.org` and their content verified.

---

## 5. Bottom line — what is safe to cite

### Safe to cite as written (verified verbatim at the cited URL)
- **All of Failbetter.** Every one of the ~110 Failbetter quotations in both files is exact. The
  word budgets (**root ≤30 / branch ≤20 / result ≤100 words**), the difficulty rule ("don't talk
  about how hard the challenge is in the surrounding fiction"), the success/failure asymmetry, the
  four-or-five-paragraph ceiling, "put the important stuff first", the cognac glass, "fires in the
  desert", the diamond/wolf repeatability rule, and the whole name-tier scale (*A Swivel-Eyed
  Patriot* → *the Implacable Detective* → *Mrs Plenty, Sinning Jenny, Dr Schlomo*) are all sound.
- **All of Emily Short**, including "closer to poetry… inspected through a jeweler's loupe", the
  storylet definition, and the entire Mawhorter/choice-poetics set including **"blind choice"**.
- **All of Jon Ingold** — "failing-but-not-failed", "fail forwards", the *Frankenstein* → *Sorcery!*
  three-or-four-paragraph tail-off finding, "Text is a visual medium", Accept/Reject/Deflect, the
  trapdoor, and the ink default-echo line.
- **All of Choice of Games**, including Slitt's three signals and the baseball-cap rule — *provided
  the URLs are fixed* (below).
- **All of Rosewater, the Wonders CCG guide, MTG Wiki, Alexis Kennedy and the GDC-Austin MMO panel.**
- **All 215 storylet samples in `reference_failbetter.md` Part B**, and all 104 guideline quotes in
  Part A.

### Must be fixed before citing
1. **Loewenstein's second quote — correct it or drop it.** Correct form: *"a form of **cognitively**
   induced deprivation that arises from the perception of a gap in knowledge **or** understanding"*
   (Loewenstein 1994, abstract). And **re-cite it**: it is not on the PBS page. If a text-searchable
   source is wanted, use `byrdseed.com/handouts/Psychology%20of%20Curiosity.pdf`; the CMU PDF is a
   scan.
2. **Re-point five Choice of Games quotes.** "Try to condense your game down…" and "Games with a
   gripping premise…" → **Part 1**, not Part 3. "The dictum of fiction is…" → **Part 3** (spoken by
   Mary Duffy), not "How to Edit Yourself"; drop "quoting Vonnegut" from that line and keep it on
   the "How to Edit Yourself" quote where Vonnegut is actually named.
3. **Downgrade two author attributions to what the sources say:** "Points of light, pools of shadow"
   → *Failbetter Games; written by Yasmeen* (identified as Yasmeen Khan, but not by the source).
   "Don't Poke That" → *Failbetter Games; written by Nigel* (Nigel Evans, likewise). Follow
   `reference_failbetter.md`, which already does this correctly.
4. **Stop citing the CCG "100 characters" as a budget.** Quote it with its own next sentence, or
   describe it as an illustrative limit with acknowledged flexibility. It does **not** belong in the
   "hard word budgets" convergence list alongside Failbetter's 30/20/100.
5. **Repair four quotations to verbatim** or add the missing ellipses: Short's "**directs** the
   player… to kiss" (and restore or ellipse the third example); the Mistretta sentence (restore
   "and situations that seem like…" or end with "…"); the two Die Hard/adventure-stories openings.

### Must be relabelled as the compiler's inference, not source material
- The rationale attached to Failbetter's weather/time/appearance rules ("because they conflict with
  a nonlinear, replayable, avatar-agnostic frame").
- "The ink square-bracket syntax exists specifically so the choice text and the resulting prose can
  differ" — the source states the opposite intent ("core similarity").
- "Consistent character voice **required** a dedicated writer per named character" — Rosewater calls
  it "an experiment".
- "Curiosity is strongest when the gap is small and specific" (§9 corollary) — unsupported by the
  quoted material.
- And, generally: the file's own `[paraphrase]` convention should actually be applied, since it is
  currently declared and never used.

### Verdict on the parent's specific list of relied-on rules
Every item the requester named is **genuine and correctly attributed**, with three exceptions: the
**CCG ~100-character limit** (real quote, misframed as a budget), the **Slitt/CoG rubric URLs**
(three quotes filed under the wrong post), and the **Loewenstein line** (which is not on that list
but is the one outright misquotation in the corpus). No fabricated quote, no invented source, and no
dead link was found in either file.
