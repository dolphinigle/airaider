# Quest Bible

**Status: canonical (2026-06-04).** The settled design for how a quest chain's *bible* is authored. Distilled from the validated `FOCUS_story_bible_system.md` work (the GENESIS→WHY-LADDER→ASSEMBLE pipeline that produced the GOLDEN sample `carried-the-fever`) + the implemented prompts in `storyGen` (`GENESIS_SYSTEM`, `BUILD_SYSTEM`). Read alongside [STORY_ENGINE.md](STORY_ENGINE.md) (the AI half); the tag vocabulary lives in GENERATION_FLOW §8–§9b (old TAGS.md archived).

---

## 1. What the bible is

The bible is the **complete, settled, hidden TRUTH of one story** — a writers'-room reference the downstream quest-writer works from. **The player never sees it.**

- It is **not prose** and **not a mystery**. It states what is *actually* true, told straight.
- **Mystery is manufactured later**, at quest-write time, by the quest-writer choosing what to reveal and what to withhold. The bible's only job is to make the truth **believable**.
- It is **settled**: every fact is decided now (who did what, and why). Nothing is left open.

## 2. The core idea — a cast bound by interlocking why-ladders

A bible is **a cast of people**, and each person carries a **why-ladder**.

- **Why-ladder:** start from a present fact about the person and ask *"why?"* repeatedly until you hit something irreducible — a love, a loss, a vow, a debt, a shame. **Each "why" answer is one `history` bullet, in order.**
  > *she avoids the harbour → why? a man drowned there → why was that her doing? she untied the wrong line → why does she hide it? she let them blame a boy instead.*
- **Story ignites where two people's ladders intersect.** The bible is character-first: build believable people with real wants; where their wants **collide**, that collision *is* the plot.
  > *Bob wants to rob you ← he's desperate for money ← he's addicted ← Alice the dealer hooked him. Bob and Alice cross again → their interests conflict → that's the chain.*
- **Ladder DEEP only for the 1–2 people the story turns on.** Edge characters stay shallow (a single `history` bullet is correct). Depth is spent where the collision lives.

## 3. Schema

```ts
{
  title:    string,   // short, concrete; names a real thing/person/place. No "The Weight of X".
  leadBlurb: string,  // 1-2 sentences the PLAYER sees on the job board, BEFORE meeting anyone.
                      // Sounds like a mundane contract; reveals NONE of the hidden truth.
                      // Physical anchors (a body, an unpaid debt, a missing barge), not secret names.

  cast: Array<{
    person: {
      name, who,                 // who = one line: what the world already knows of them
      history: string[],         // the WHY-LADDER (ordered cause→cause→bedrock)
      wants,                     // plain human want, not plot necessity
      feels,                     // the feeling about their history (this is where concealment is born)
      conceals?,                 // OPTIONAL — present ONLY when a feeling makes hiding natural
    },
    roleInStory,
    coined?,                     // true if newly minted (vs reused from the pool)
  }>,

  situation: string,            // 2-4 sentences — the believable present truth, told straight
  tensions:  string[],          // who clashes with whom, over what, and the plain CONCRETE reason
  openDirections: Array<{ kind: 'ambient' | 'active', hook: string }>,
                                // ambient = world moves with/without the company (living-world pressure)
                                // active  = a contract/plea the company can take = a selectable quest seed
}
```

## 4. Disciplines (the quality unlocks)

1. **Secrets are NOT a field.** Concealment **emerges** from `history` + `feels` (a shame / guilt / fear-of-being-labeled / fear-of-loss). Write the event + the feeling; the concealment falls out into `conceals`. **Most people conceal nothing — that is correct and believable.** Only 1–2 secret-bearers per cast.
2. **Commit to the truth.** Decide every fact now. If a killing/theft/betrayal/disappearance happened, state plainly WHO and WHY in `situation` + the relevant `history`. **Banned in the hidden layer:** "unknown", "remains hidden", "it is unclear", "a mysterious figure", "the truth of X is never revealed." Those are the *player's* to discover later — but the author already knows, so write it down. *(This commit-to-truth rule was the key quality unlock.)*
3. **Believability rubric** (the output must pass it, read as a reader):
   - **Causality** — every present fact traces to a prior cause in `history`.
   - **Ordinary motives** — people act from plain human wants, not plot necessity.
   - **No coincidence-stacking** — the situation is reachable without "and conveniently…".
   - **Few secret-bearers** — 1–2 conceal anything; the rest are exactly what they seem.
   - **Nobody acts dumb** just to keep the situation alive.
4. **Reuse the pool first.** Draw cast — core and secondary — from the persistent character pool wherever someone plausibly fits; the `history` you write is new canon revealed about them (kept consistent with their known surface + tags). Coin a new person (`coined: true`) only when no one fits; keep coined few. The world grows by accreting history onto recurring faces.
5. **Depth scales with stakes.** Common = lean (2–3 cast, short ladders); legendary = ensemble, deep ladders. (GOLDEN `carried-the-fever` is legendary.)
6. **Voice is clinical** for the truth fields — state what *is*, not how it feels; good writing here is a solid character foundation, not word-flair. Literary voice is added only at quest render. `leadBlurb` may carry light flavor but must read like a mundane contract.

## 5. What the bible does NOT contain

These belong to the **quest-writer downstream**, not the bible:
- reveal cadence / what-to-hide-when
- dramatic irony, plant→payoff setups, "reveal beat by beat"
- prescriptive beats / a fixed trajectory

Keeping them out is deliberate: the bible is plain truth; mystery is a quest-time operation that consumes the bible + the story-so-far.

## 6. How it's generated (writers'-room steps, not one mega-prompt)

1. **GENESIS (collision).** Collide two unrelated sparks — a handcrafted seed + pool character(s) — into a one-line **kernel** ("what if X's past is the very thing Y is chasing?"). *(Stephen King: "two previously unrelated ideas come together and make something new.")*
2. **WHY-LADDER / BUILD.** Ladder *why?* to bedrock for the core people → their `history`; `feels` produces emergent `conceals`. Apply commit-to-truth + the believability rubric.
3. **ASSEMBLE.** Cast + situation + tensions + openDirections. Done.

## 7. Craft basis

- **Lajos Egri** (*The Art of Dramatic Writing*) — character-first; build strong wants, and the **collision of wants IS the plot** ("bone structure"); characters change under that pressure.
- **Emergent secrets** — a believable secret = a *history event* + a *feeling* about it; concealment is the natural behavior, never a forced field.
- **Ensemble "character web" / the "third factor"** — build believable people somewhat independently, then find where their histories/wants connect; **plot ignites at the intersection**, and you deepen the node the intersection made important.
- **Stephen King / Neil Gaiman** — ideas are born from the **collision of two unrelated sparks** → the genesis kernel.
- **"Why?" laddering (the 5 Whys)** — repeated *why* to an irreducible cause builds believable depth and lets secrets/stakes emerge bottom-up.
- **Georges Polti's 36 Dramatic Situations** — breadth anchor for the seed bank.

---

*Downstream:* the quest-writer consumes `# Bible (hidden)` + `# Story so far` + `# Task` and writes the next player-facing quest, revealing one believable layer at a time. That layer is where mystery is made — see [STORY_ENGINE.md](STORY_ENGINE.md).
