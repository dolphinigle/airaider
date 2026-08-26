# DOGFOODING — how this game gets playtested

**Status: 🔒 rule, 2026-08-26.** Written after getting it wrong, badly enough that the designer had
to point it out. Short doc on purpose.

---

## 1. The rule

> **Every player-facing feature ships in the text UI (`v3/cli/`) in the same session it ships in the
> web GUI. Playtesting happens by PLAYING a real UI — never by simulating one.**

The text UI is not a reference implementation, not a batch harness, not a legacy surface. It exists
for exactly one reason: **an agent cannot drive a browser, and this game must be playable by the
agent building it.** Same engine, same facade, different rendering. If a feature is invisible in the
CLI, then in practice nobody has played it — because the only person who plays between designer
sessions is the agent.

Corollary: `npm run cli` must show *what the player sees*, including timing. A feature about **when**
things appear needs the CLI to show *when* things appear (timestamps are fine — this is a dogfooding
surface, not a shipping product).

## 2. What went wrong, 2026-08-26

The reckoning was made progressive: each quest's report appears the moment its own AI call lands.
That is a **UI** feature. To test it I wrote `scripts/_guiplay.ts`, which boots the server and
**re-implements the React client's state machine** (`fresh` / `held` / the 500ms poll, copied out of
`App.tsx`) to drive it over HTTP. Seven scenarios, all passing. I reported it as playtested.

The designer's response was the correct one: *"don't you have a text based UI? isn't the reason that
text based UI exists so that you can playtest using the SAME ENGINE but only the UI differs?"*

**Then the very first CLI run found a bug the harness could not have found.** The terminal is
append-only, so when an earlier quest's block expanded, every line after it shifted and was printed
again — one quest's whole report appeared **twice**. The HTTP harness never saw it because it only
ever counted lines and looked for markers; it had no rendering to be wrong.

## 3. Why I made the mistake — the three steps

1. **I wrote my own constraint and then obeyed it.** `TEMPO.md` R6 recommended *"no async in the
   CLI — it stays the straight-line, work-to-completion reference that scripts and agents drive."*
   That was a reasonable note about the **facade contract** (a script typing `pursue L1` then
   `assign` must still work). I then read it back as *"the CLI does not get this feature"* and never
   re-examined it. **A recommendation I wrote an hour ago is not evidence.**
2. **I classified the CLI as a test harness rather than as a UI.** Once it was "the thing tests
   drive", the question became *"can the CLI test this?"* (answer: no, it's synchronous) instead of
   *"what should the CLI DO here?"* (answer: stream the reckoning, obviously).
3. **So I simulated the surface I could not drive.** Copying `fresh`/`held` out of `App.tsx` into a
   harness produces a thing that agrees with my model of the client, not with the client. It can
   drift silently, and it is structurally blind to the entire class of defect that lives in
   rendering.

The general shape: **when a surface can't test something, the reflex must be "fix the surface", not
"build a replica of a different surface."**

## 4. What is still true about scripts

The facade contract stands and is unchanged (`TEMPO.md` I11): `npm test`, the sim baselines,
`realplay`/`autoplay`/the labs and the CLI's `--script` mode all drive `Game` straight through and
run to completion. Streaming the reckoning in the CLI did not break that — batch mode renders the
same stream, it just never waits for anyone. **Work-to-completion is a property of the FACADE, not a
reason to keep a UI feature out of the UI.**

`scripts/_guiplay.ts` keeps its job — it is the only way to exercise the HTTP layer, the action
chain, double-END, a dead server. It is a **server** test. It was never a playtest.

## 5. What playing it then found (same afternoon)

Within minutes of the CLI actually rendering the reckoning, three defects the HTTP harness had no
way to see — all of them *rendering*, all of them invisible to a test that counts lines:

1. **A report printed twice.** The terminal is append-only; diffing the flattened line list meant
   that when an earlier quest's block expanded, everything after it shifted and was reprinted. Fixed
   by exposing the reckoning's **blocks** (`Game.reckoningView().blocks`, `lastReckoningBlocks()`)
   instead of asking a stream to diff prose.
2. **`(revised)` on every landing.** A landed block *drops* its `✎` line rather than keeping it, so
   the placeholder is not a strict prefix and every arrival looked like a rewrite.
3. **No attribution.** A report arriving eleven seconds after its header is detached from it; on a
   page the block fills under its own title, in a stream it has to say whose report this is.

Then five real-AI cycles through the CLI covered every shape the reckoning has: two quests landing
apart, a single quest with a flesh tail, a `⏸` stall line in the head block, a saga beat, an injury,
a level-up, a relic, a failure, and a finale with approaches and a fate. All correct.

## 6. Testing must not touch what the designer is playing

A harness on a different PORT is not isolated: `server/main.ts` derives its save path from the
working directory, so a test server happily overwrote `saves/web.json` — gitignored, therefore
unrecoverable — and the designer's GUI game was gone. `AIRAIDER_SAVE` now names the file, and
`scripts/_guiplay.ts` always sets it. **Before booting any server: check the port is free AND that
the save is not the real one.**

## 7. The checklist

Before claiming a player-facing change is playtested:

- [ ] Does it exist in `v3/cli/`? If not, it is not done.
- [ ] Did I *play* it — `npm run cli -- --ai` — and read the output as a player, not as a diff?
- [ ] Real AI, not just the mock. Mock latency is 0, so anything about timing is invisible under it
      (`AIRAIDER_MOCK_LATENCY_MS` exists for the structural cases; it is not a substitute).
- [ ] Several cycles, several seeds, and at least one of each shape the feature has to survive.
- [ ] Did any test I wrote *copy* logic out of a UI I cannot run? If so, that test proves nothing
      about that UI.
