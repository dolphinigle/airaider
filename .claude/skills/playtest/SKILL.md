---
name: playtest
description: Dogfood-playtest airaider by READING the AI prompts and the prose they produce — judging writing QUALITY and whether the PROMPT itself is the problem (jargon a stateless model can't parse, stale/conflicting guidance, sticky examples it copies, instructions it echoes verbatim, smells/tics, vague outcomes). Invariant assertions are only a no-breakage backstop. Use after ANY change to a narrator prompt (openaiNarrator.ts) or to story-gen / quests / rewards / chains.
---

# Playtest airaider = read the prompts + read the prose

Airaider's whole bet is *"is the AI-driven, character-driven quest fun to read?"* So playtesting is a
**reading** activity, not an assertion activity. The job is to drive the REAL AI, **read the actual
prompts and the text they produce**, and judge two things:

1. **Is the output good?** (coherent, readable-once, in-voice, dialogue where it helps, the outcome
   unmistakable, the reward/offer clear, no smells.)
2. **Is the PROMPT the reason it isn't?** Almost every problem this project has hit was a *prompt* fault,
   not the model. So when the prose is off, open the prompt and find the cause.

Do NOT report "no invariant violations" as if that's a playtest. That only proves nothing crashed. The
real findings come from reading.

## Setup
- OpenAI key: `/home/irvan/airaider/.env` (`OPENAI_API_KEY=`), gitignored, read for dogfooding only (the
  user authorized this). Never print/commit it. Run harnesses from `app/` with `npx tsx <harness>.ts`.
- Capture EVERY prompt+response: `GameEngine.create({ provider: 'openai', onCall: r => calls.push(r) })`.
  The record has `r.system`, `r.user`, `r.response`, `r.kind`, tokens. **Print and read them** — the
  full system+user for the call type you changed, not just the parsed result.

## The loop (read, don't assert)
Drive ~8–15 real cycles over BOTH one-offs and chains (and let chains reach a finale). Each iteration:
1. **Read the rendered prompt** for what you changed — as the stateless model sees it. Ask: is anything
   jargon (it doesn't know "beat"/"slot"), stale, self-contradicting, a concrete example it will *copy*,
   or an instruction label it will *echo verbatim*? Is the context it needs actually present?
2. **Read the output as a player would.** Score the prose: does it read clean once? is the job/offer
   clear? the outcome unmistakable? in the world's voice? Then hunt the **known smell classes** (all of
   which we've hit and fixed — expect more):
   - **templating / sticky example** — the same job/phrase every time because the prompt's example got copied.
   - **verbatim echo** — the model pastes an instruction label ("ARRIVAL: …") into the output.
   - **numbers / amounts** leaking ("40 gold") where they shouldn't.
   - **formula** — every item ending the same way ("If you send men, they will…").
   - **filter-words / telling** — "his scholar's eye found", "said angrily" (want: show the act / the line).
   - **vague outcome** — you can't tell what was achieved or lost.
   - **repetition** — same arrival/scene/opener across beats; over-orienting a name every time.
   - **AI mis-using an engine field** — over/under-using a flag (immediateReward), hallucinating a kind,
     a label that doesn't match its kind, an offer that doesn't match the grant.
3. **Find the line in the prompt** that causes the smell, fix it, **re-run, re-read.** Iterate 2–4 rounds;
   one read is never enough.

## Backstop (NOT the playtest)
Run the offline gates to confirm you didn't break the engine — they use the Mock narrator so they can ONLY
catch breakage, never judge prose: `npm run -s test` · `npm run -s looptest` · `npm run -s conformance`.
A harness like `app/_exp_playtest2.ts` can assert structural invariants in passing, but treat that as the
seatbelt, not the drive.

## Report back
- The PROSE findings first: what read well, what smelled, with **example quotes** and the **prompt line**
  responsible + the fix. Iterate until the re-read is clean.
- Separate prompt-tuning nits from real bugs. Note token cost only if it changed.
- Last and briefly: "offline gates green (no breakage)."

## Don't
- Don't equate "invariants pass" with "playtested." Read the prose.
- Don't read one sample and call it — variety hides in the 3rd/4th. Read across tones/archetypes.
- Don't assert from the code that prose "should" be fine — generate it and read it.
