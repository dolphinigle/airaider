# 🔒 WRITING-QUALITY CHECKPOINT — LOCKED 2026-08-25
> **DESIGNER SIGN-OFF: "i think the quality of writing is good now! That's VERY important."**
> This file marks the state the writing was in when the designer approved it. **Do not regress past
> this line.** If card prose ever reads worse than the samples below, something in this checkpoint
> was undone — diff against it before debugging anything else.

**STATUS: LOCKED.** The prose bar below is settled. Later work may OPTIMIZE the prompts (cut dead
weight, tighten for cheap models) but must not lower this bar — re-run the §6 check after any edit.

### The finding that closes this phase
**Craft is no longer the bottleneck; PREMISE is.** Our prose now beats the reference
sentence-for-sentence (a gold rite resolves in *"Didn't win, run fast"*; our lead-ins carry *"the rug
had been pegged to the floor with a long iron nail driven through its weave, stopping hands from
lifting it quietly"*). But «The Poet's Lamb» is *about* something — a man has a lamb, and every time
you try to think about the lamb something pushes your mind away, and its FAILURE text is the horror.
Ours is a fetch-quest with good lighting: their card has a **question**, ours has an **errand**.
That gap is what §5's open rulings are for. Do not try to close it with more prose rules.

Read with: `docs/PROMPT_RULES.md` §12 (the rules) · `docs/PROSE_METHOD.md` (principles + protocol).

---
## 1. WHAT WAS APPROVED — the reference samples
These are real shipped-pipeline output at the moment of sign-off. **This is the bar.**

**One-off card (the fix that earned the sign-off):**
> *A reed box was taken by a runaway servant. A steward of Oakstead says his servant confessed and
> fled with it at first light. The servant was last seen on the old elf road into the Western
> Forests. The steward pays coin when the box returns.*

**Openings on seeds never tuned on — the wrong is SHOWN, not announced:**
> *Charcoal carts from Hawmoss leave full and return empty.*
> *A gate into the Western Forests stands open and unlocked.*
> *Smoke sits above the quarry track by the charcoal-burners' camp.*

**What it replaced (the designer's verdict: "very very unclear… weird things tacked on it"):**
> *At first light a visitor brought a confession and a plea. A runaway servant took a reed-woven
> token that a kin claims as inheritance. The servant left on the old elf road through the Western
> Forests and is the one who holds the token now. A kin at Oakstead will pay coin on delivery. The
> company keeps the coin and any goods turned up while on the road.*

---
## 2. WHAT IS IMPLEMENTED, AND WHERE — verified, not assumed
| prompt | location | §12 applied? | evidence |
|---|---|---|---|
| **one-off card** | `src/ai/openai.ts` → `oneOffSystem()` | ✅ **YES** — all 6 markers present | commits `f325f13`, `9a499e4`; unseen-seed runs 79–88% lint-clean |
| **saga card** | `src/ai/openai.ts` → `sagaSystem()` (3,178 words) | ❌ **NO** — 0 of 6 markers | never touched this round |
| **resolution** | `src/ai/openai.ts` → `RESOLVE_HEAD_FRAME` + resolve prompt | ❌ **NO** | never touched this round |
| lab champion | `v3/scripts/prosebench/CHAMPION.txt` | research artifact — **separate prompt, not shipped** | see COORDINATOR_LOG |

⚠️ **The lab prompt and the shipped prompt are DIFFERENT FILES.** `CHAMPION.txt` shares none of
`oneOffSystem()`'s distinctive rules. Work done in the lab does NOT reach the game until ported by
hand. This surprised me once; do not be surprised again.

---
## 3. THE §12 RULES THAT MUST SURVIVE (the actual diff to preserve)
1. Opening: names what the job is about and the wrong in it, **≤12 words, subject+verb in the first
   four, never a command**, and leads with whichever the reader needs first — the one wronged, the
   one who did it, or the word that reached the fort. *(That last clause is load-bearing: without it,
   6/6 openings came out passive victim-first.)*
2. The sentence after it carries the weight: the person whose act caused this, what they are to the
   others, and that act itself.
3. **Name a thing by what it IS and what is WRONG with it** before what it is made of.
4. **Introduce people by their relation**, never a bare category. Tenure in plain words, never a count.
5. **Pay is ONE closing clause** turning on the work; loot rights get no sentence of their own.
6. The ledger (who holds what, who pays) is **fixed in the writer's head and never written out**.
7. **CUT and must stay cut**: the "vary what signals the wrongness (an absence, a sound, …)" list —
   L12 says variety cannot come from prompt text, L13 says its instances leak.

---
## 3b. DOGFOOD RESULTS — 2026-08-25, after the saga port
Three full AI campaigns to finale (`aicampaign.ts`) plus a full CLI loop with real AI
(`npm run cli -- --ai --script <file>` — the CLI has a batch mode built for exactly this).
**Every player-facing call type read clean: one-off cards, saga cards, lead-ins, resolutions,
finale.** No drift found, so no all-prompt audit was triggered.

Saga cards, before and after the port:
> *"Haeruana **is** a woman of the fort who brings a private grievance…"* (definition dump)
> → *"Haeruana came to the longhouse and pressed her palm to your table. She speaks low and keeps
> her hands tight on the hem of her cloak. The northern lean-to shows a sleeping bundle gone and
> fresh boot prints into the woods. **The lean-to's hearth was stirred but not cold.**"*

A resolution at the current bar:
> *"Ragna worked the peg free with the butt of her axe while Gaufrid eased the rug's edge. The nail
> tore a hand-sized gap in the weave and the rug came up. Beneath the rug they found a silvered
> goblet, its rim scored in a running elven pattern and stained dark along one side."*

**Investigated and dismissed:** a crude scan suggested 11/12 resolutions used a definite noun phrase
absent from their lead-in. Hand-checking showed these are false positives — props staged by the CARD
(which the resolve prompt permits), a soldier's own weapon, or nouns introduced in the same sentence.
One genuine instance was found (a spear appearing unstaged). **Not systemic; deliberately NOT patched**
— an instance-patch is forbidden by §8, and this session has already paid twice for chasing a defect
before checking that it was real and that it discriminated.

## 4. ⏭ REMAINING WORK — the checkpoint is NOT the finish line
- [ ] **Port §12 to `sagaSystem()`** — saga cards are the campaign spine and have none of it.
- [ ] **Apply the resolution findings** — measured gap: *we narrate procedure, the reference narrates
      consequence*. Their results fan out (a reputation, a strained tie, a court complaint); ours stop
      when the soldier walks out of frame. Likely needs a dealt consequence fact (see §5).
- [ ] **Dogfood via CLI** (`npm run cli -- --ai`), read every call type, iterate.
- [ ] Then hand to the designer for GUI playtest.

## 5. 🔒 OPEN DESIGNER RULINGS (all measured, all blocking further gain)
1. **May a card state what the FORT stands to lose?** Prompt-side installation is **measured dead** —
   it produced the vocabulary of stakes while regressing `asks you to` 2/24 → 9/24 against a
   reference rate of 0.3%. Needs a dealt fact.
2. **May a person carry TENURE** ("a servant of twenty years")? `NUMBER_BAN` forbids it, for the
   measured reason that invented durations were a real defect. Deal it, or relax the ban for tenure.
3. **Voice** — reference 4% voiced; an agent champion ran 87%. Judges reward dialogue; the gold
   standard does not use it.
4. **Names** — reference 64%, ours 0%. Names need a MANDATE (16/24); permission yields nothing (6/24).

---
## 6. HOW TO CHECK YOU HAVE NOT REGRESSED
```bash
cd v3 && npx tsx scripts/oneofflab.ts 3 92500 /tmp/check.md   # ~$0.02, cards AND resolutions
```
Then read the openings. They must be short, concrete, and **varied in grammatical subject** — if
every card opens the same way, a rule with a single grammatical realisation has crept back in (L12).
For any real comparison use the protocol in `PROSE_METHOD.md` Part 2: **≥24 unique cards per arm,
≥2 seeds, regenerated per test, ≥3 fresh blind seats.** Re-judging the same cards is not replication.
