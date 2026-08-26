# TEMPO — killing the dead time

**Status: 🟡 GOALS ONLY — 2026-08-26.** This says *what the game must do*, not how. No mechanism, no
data model, no API. Design comes after these goals are approved, in its own doc, citing the IDs here.

Written after the designer's verdict *"the game is actually fun"* closed the writing phase
(`WRITING_CHECKPOINT.md`). What now stands between the prototype and a **full playthrough** is neither
the prose nor the math — it is the **tempo**. Two complaints, in the designer's words:

> *"i click lead gen, i wait and cant do anything else. Ideally: i can click several lead gen and it
> queues it."*
> *"the resolution should be a separate screen that you display part by part as you generate, so
> instead of GENERATING ALL THEN SHOWING ALL, you can partial show."*

Everything below serves those two and nothing else.

---

## 0. Words, once

*(this doc is read by people and agents with no context; these are used throughout)*

**Cycle** — one turn. **Fort phase** — the part of a cycle where the player builds, hires, slots
cards into rooms, pursues leads and assigns soldiers to quests. **Reckoning** — the part after
END CYCLE, where committed quests resolve and the report is read. **Lead** — a cheap engine-made
prospect on the lead board. **Pursue** — spend a lead to have the AI write the actual **quest card**.
**Saga (chain)** — a multi-quest story; its first card costs a **genesis** call (the hidden bible),
each later card is a **beat**. **One-off** — a standalone quest, one call. **Flesh** — the call that
gives a person their who/backstory/quirks. **Marching** — a quest with every slot filled, which
therefore resolves this reckoning. **The roll** — each sent soldier contributes **coins**; they are
flipped against a **bar**, and the **heads** decide success / partial / failure. *Call names used
below:* `writeQuest` (the quest card), `genesis` (a saga's hidden bible), `resolve` (one quest's
report), `flesh`, `themeRoll` (a room's style), `select` (a lore picker).

---

## 1. What the docs already say — and what this changes

Not a new problem. The docs named it and then deferred it:

- **`STORY_ENGINE.md §9`** already prescribes the answer — *"Pre-generate where possible… Background
  long generations behind a visible 'drafting…' affordance — never freeze the UI… parallelize"* — and
  then rules, **2026-07-17**: *"parallelizing/backgrounding AI calls is REQUIRED for the non-prototype
  build… **The prototype is exempt**: serial blocking calls with pending-state feedback are fine."*
- **`DESIGN.md §11.2`** files AI latency as a known executional risk; **§11.3** names this doc's second
  half exactly: *"when ten quests resolve at once, the cascade must stay legible and paced, not a wall
  of text."*
- **`QUESTS.md §10`** leaves *"Latency & reading load"* open and asks for real minutes/cycle to be
  **measured in playtest** before trusting the pacing figures. §2 below is that measurement.

⚠ **This doc lifts the prototype exemption**, on the designer's request of 2026-08-26 (*"lots of
waiting making the prototype very awkward to play"*): play now says the exemption costs more
design-learning per hour than it saves. **`STORY_ENGINE §9` must be amended** when these goals are
approved. Until then, this line is the record of the disagreement.

---

## 2. The complaint, measured

Three player actions cost real time. Everything else in the game — build, assign, hire, slot, sell,
heal, focus — is engine-only and returns in under a millisecond.

| action | AI calls | measured | worst case |
|---|---|---|---|
| **pursue** a one-off lead | 1 `writeQuest` | **10s** median | ~17s |
| **pursue** a saga **beat** | 1 `writeQuest` (0 when the beat is cached) | **6–14s** | ~17s |
| **pursue** a **new saga** | 2: `genesis` → `writeQuest` | **51s and 66s** (n=2) | see below |
| **renovate** a room | 1 `themeRoll` (the small fast model) | not measured | — |
| **END CYCLE** | 1 per marching quest, in parallel, + 1 `flesh` tail | **10s** median | **27s** |

**Why genesis is the outlier:** it is the one call in the game that runs at
`reasoning_effort: 'medium'` (`openai.ts:644`); everything else runs at `low`. That is a deliberate
quality choice, not an accident — which is why `N1` puts it out of scope and **the genesis problem** (§3) needs an answer
that is not "make it faster".

**And the worst case is not 140s, it is minutes.** Three retry layers stack, and the doc should be
honest about the ceiling: the genesis HARD-defect re-roll (`game.ts:1278`), *under* `callR`'s
retry-once-on-parse-failure (`openai.ts:562` — which wraps `writeQuest`, `genesis`, `resolve` and
`flesh`, but **not** `themeRoll`, `select` or `review`), *under* the OpenAI SDK's own defaults of
**2 automatic retries at a 10-minute timeout each** (`node_modules/openai/core.js:138`). Nothing hangs
forever; it can simply take longer than any player will sit still for.

**And what the player can do meanwhile is not honest waiting.** Only END CYCLE is disabled while work
runs (`web/App.tsx:79`); every other button stays live and its request queues behind the in-flight
action on the server (`server/main.ts:205`). There *is* a pending banner and live polling
(`web/App.tsx:44-65`), but it is single-slot: a second click **overwrites** the banner with the newer
action's name, and the **first** completion clears the banner and re-enables END — so the player is
told the wrong job is running and then told nothing is running while work is still out.

### 2a. Latency baseline
*(`v3/scripts/_latprobe.ts`, real provider, gpt-5-mini at the shipped settings — `reasoning_effort:
low` everywhere except genesis, which ships at `medium`. Two runs pooled, seeds 4242 and 909:
11 cycles, 37 calls, $0.12.)*

```
per AI call         writeQuest  n=19  median 10.0s   (6.0 – 16.6)
                    resolve     n=14  median  9.5s   (7.0 – 13.9)
                    flesh       n=2          12.1s, 15.6s
                    genesis     n=2          65.8s, 50.7s   ← the outlier that owns the problem
per blocking action pursue      n=19  median 10.0s   (6.3 – 77.1)
                    endCycle    n=11  median 10.1s   (8.4 – 26.6)
```

### 2b. Streaming does NOT solve the reveal
*(`v3/scripts/_streamprobe.ts` — a resolve-shaped call, streamed, timing every content token, ×3)*

```
total 13.6–14.6s · FIRST content token at 11.9–12.8s = 88% of the wait
                 · then ~900 chars in ~1.6s · longest silence 12.2s
```

**88% of the wait is hidden reasoning.** `gpt-5-mini` at `reasoning_effort: low` thinks in tokens the
API never streams, then floods the finished report out in the last second and a half. "Stream the
model onto the screen" buys a twelve-second blank followed by a wall of text — the exact complaint,
with extra machinery. **Whatever paces the reveal, it cannot be the model's output rate.**

### 2c. The fort phase is thin — the queue alone will not fill a genesis
*(`v3/scripts/_fortdepth.ts`, mock provider, two seeds, counting what the player can actually click
right now: builds and upgrades compete for one purse, an assignment needs a free soldier)*

```
cycle:      0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
clicks:     1    1    2    2    3    3    4    3    4    4    2    5    3    6    6    7
```

**One to seven meaningful clicks a cycle, median 3.** At a couple of seconds a click that is roughly
**5–15 seconds of play per cycle** — against a 10s pursuit and a **50–66s genesis**. And cycle 0–2,
where the board is thinnest, is exactly where a first saga is most likely to be started.

⚠ **This is the finding that shapes everything.** A queue makes a 10s pursuit disappear into normal
play. It does **not** make a 60s genesis disappear; it only stops the board lying about it. Filling
that minute needs something else — see **the genesis problem** (§3) and `R7`.

---

## 3. THE GOALS

**Three. Everything else in this doc is either a consequence of these or a thing that must not break
while we get them** — 🔒 the designer's own framing, 2026-08-26: *"the big goal is: we want to be able
to pursue several leads at the same time and overall less downtime if we can help it."*

**G1 — Pursue several leads at the same time.** Click, click, click; they all get written; the board
stays live the whole time. No click ever freezes the fort.

**G2 — Less downtime, everywhere we can get it.** Not "hide the wait behind a nicer spinner" —
actually less time in which the player has nothing to do. Measured, not asserted (§7).

**G3 — Results appear as they land, not all at the end.** 🔒 *"say you have 3 quests being done this
week — then as soon as the first one has result, output it in screen."*

The one thing the measurements say these three do **not** cover, which is why it gets a line of its
own rather than being buried:

**⚠ The 50–66s saga genesis is not solved by any of them.** The fort phase holds 1–7 clicks a cycle
(§2c), so there is nothing to fill that minute with; and on the ~70% of cycles that resolve a single
quest, `G3` has nothing to interleave. Both need an answer that is not "queue it" — see `R3`, `R7`.

---

## 4. What that means in practice

**Not goals — the checklist the design has to satisfy.** Listed so nothing is forgotten, not so
anything is argued about; anything here that turns out to be wrong at build time is just wrong, and
gets fixed without a ruling.

**Fort phase (serves `G1`, `G2`):**

- **P1** A click is answered in ~100ms and stays visible until the work is actually done — two
  overlapping actions are two visible things. *(Today's banner is single-slot: a second click
  overwrites it and the first completion clears it while work is still out.)*
- **P2** A lead being worked reads as *being worked*, where it stands: not pursuable twice, not
  expiring under the work, never shown as simply available.
- **P3** Nothing is spent until something is delivered — a failed pursuit costs no lead and no gold,
  and leaves no half-made quest. *(True for pursue; `renovate` charges gold before its call,
  `game.ts:433`.)*
- **P4** Failures are visible and retryable in one click, and the game sets its own deadline —
  the only timeout today is the SDK's 10 minutes × its own retries, which no player will sit through.
- **P5** Queued work can be dropped, and reordered.
- **P6** Arrival is announced without stealing anything: no modal, no view jump, nothing yanked
  mid-click or mid-read.
- **P7** A control disabled by in-flight work names the work that is blocking it.
- **P8** 🔒 **2–3 generations in flight, adjustable.** No price on pursuit: *"ultimately it's fine if
  the player wants to rapid-fire AI calls since they'll pay per AI call."* The cap keeps the machine
  and the provider happy; it never rations the player. Which makes the cost meter load-bearing — spent
  so far, and how many calls are out right now, always on screen.
- **P9** 🔒 **END CYCLE waits** for work in flight and says so on the button. Consequence to design
  around: a card that lands on the reckoning screen can only be *read* — assignment is a fort-phase
  act, so it is used next cycle.

**The reckoning (serves `G2`, `G3`):**

- **P10** END CYCLE shows the screen instantly — it exists before the first word of narration does.
- **P11** 🔒 Each quest's report appears the moment it lands; the slowest never holds up a finished
  one. The resolve calls already run one-per-quest in parallel (`openai.ts:665`).
- **P12** On a one-quest cycle — most of them — something still has to fill the ~10s. ⚠ `R3`.
- **P13** The player can outrun the reveal: one click shows everything that has arrived. A paced
  reveal nobody can skip is new dead time we invented.
- **P14** The player can always tell whether the game is still working or has finished — and that is
  *all* the progress reporting. No percentages, no "2 of 3, ~8s left": a job status tells the player
  exactly when to stop reading and start waiting.
- **P15** Order is fixed when the screen opens and never rearranges. *(True today — quests resolve in
  id order, `game.ts:1729` — and must stay true when calls return out of order.)*
- **P16** A failed narration degrades to the plain engine truth for that quest only. *(Shipped:
  `fallbackResolve`, `openai.ts:672`.)*
- **P17** Consequences stay attached to the report that earned them. *(True today, `game.ts:2230`.)*
- **P18** Fort news (healing, expiries, lapses, drips, tavern churn) comes after the quest stories —
  it is known instantly and must never sit between the player and a story still being written.
  ⚠ Changes shipped output: stall and lapse lines print *before* the resolutions today
  (`game.ts:1738`). Veto this one and the rest still stands.
- **P19** The reckoning is leavable and returnable, restart included. *(Today it is a variable in the
  server process, `server/main.ts:47`.)*
- **P20** Closing it lands the player in a fort that is already true — nothing finishes applying
  itself afterwards.
- **P21** The `flesh` tail (12–16s) does not hold the door — but must not leave a person blank
  either. It runs at step 7 *deliberately*, so people minted this reckoning have a face before the
  player meets them (`game.ts:1723`). ⚠ `R8`.

---

## 5. Invariants — what must survive

Each is stated as something a test or a player can observe. Several are true today only because the
server runs one action at a time (`server/main.ts:205`); they are listed because that is exactly what
this work removes.

**I1. Replay determinism is NOT required.** 🔒 **Ruled 2026-08-26 — "doesn't matter".** Overlapping
generations may draw from `game.rng` in network-completion order (`game.ts:820–896`, then `958–966`)
and the same save + same clicks need not replay identically. What this costs, so nobody is surprised
later: reproducing a player's bug from their save. What it does **not** cost: `npm test`, the sim
baselines, `chaos.test.ts` or any lab script — they all drive the facade serially through
`MockProvider` (`I11`). *If a per-job random stream falls out of the design for free — one number
drawn at click time, in click order, the job private thereafter — take it. Do not restructure for it.*

**I2. Resolution order stays the cycle's, not the network's.** The reckoning resolves quests **sorted
by id** (`game.ts:1729`) off a module-global counter (`cards.ts:79`). Ids allocated inside a race make
the *order the stories are told in* depend on which model call returned first — which the player sees,
unlike `I1`. Allocating a quest's id when its pursuit is **clicked** costs nothing and settles it.

**I3. Anti-repetition memory survives concurrency and a save.** Save mid-campaign, reload, pursue:
the next card is the one the unbroken run would have dealt. Seven in-memory windows — recent NPC
names, card titles, sparks, place stems, landmark deals, lead archetypes, known-cast count
(`game.ts:687, 2243, 2246, 2386, 2388, 2392, 2405`), plus a beat cache at `2390` — are read *before*
each call and written *after* it, and none is in `GameState`, so `save()` already drops them. One of
them (`recentSparks`) *draws RNG* on a repeat (`game.ts:885`), so this feeds `I1` too. Five
simultaneous pursues all read the same empty windows.

**I4. Concurrency never lowers writing quality.** `I3` is not bookkeeping: five cards dealt at once
can share a spark and near-identical names. The writing phase is closed and **tempo work may not cost
a point of card quality** — if it does, it is measured on the blind bench (`PROSE_METHOD`) before it
ships, like any other writing change.

**I5. One AI call per artifact.** The single-shot ruling stands (`PROSE_METHOD`, memory
`single-shot-ai-calls`): no re-rolls for quality, no rewrite loops, no AI-verifies-AI. *(Two
deliberate exceptions already exist and stay: one genesis re-roll on a HARD structural defect
(reasoned at `game.ts:1267`, fired at `:1278`); one retry on a parse failure, `openai.ts:562`.)* Splitting one artifact across
several calls to make it reveal in pieces is a **prompt change** and goes through the bench. ⚠ `R3`.

**I6. A reserved lead is honoured exactly once.** Two rapid pursuits of the same lead give one quest
and one refusal; a quest never arrives for a lead the same cycle expired. Today's duplicate guards
read state written only *after* the await (`game.ts:711–718`), so they are blind for the whole call.

**I7. The save is never torn.** Kill the process at any instant: every lead is either untouched or
paid for with a finished quest; a renovation is either unpaid-and-unstyled or paid-and-styled.
*(Today autosave fires after each completed action — under concurrency it would fire mid-mutation.)*

**I8. The AI log tells the truth about what is running.** Three calls in flight show three rows, each
with its own purpose and sequence number. Today the purpose is one mutable closure variable
(`openai.ts:513`) and the ordinal is read before it is incremented — concurrent calls mislabel each
other. This is the instrument `P2`, `P8` and §7 are measured with; it has to be right first.

**I9. Parallelism is bounded and rate limits are survivable.** However many pursuits are queued, only
so many calls are ever open at once, and a provider rejection surfaces as a retryable item, never a
lost quest. There is no limiter anywhere today.

**I10. END CYCLE never silently does nothing.** A second END while a reckoning runs is refused
visibly and the reckoning on screen survives. Today the re-entrancy guard's message is assigned
straight into the report (`server/main.ts:250`), so its first live firing would **erase the reckoning
it exists to protect**.

**I11. The facade keeps a work-to-completion path.** `npm test`, `GENERATION_FLOW §20`'s sim baselines,
`realplay`/`autoplay`/the labs, and the CLI's batch mode (`pursue L1` then `assign` on the next line)
all keep working straight through. Async is a *player-surface* feature; the requirement is on the
**facade**, not on the CLI.

**I12. The auditor knows about work in flight.** `auditGame` fails on a lead reserved with no job
that could release it, or a job whose lead is gone — otherwise `chaos.test.ts` (4000 random actions
under audit) goes blind to exactly the new bug class.

**I13. The async path is testable at all.** Every invariant above is stated as observable, but the
suite, the sims and the labs all run `MockProvider` at ~0 latency, so nothing ever interleaves there.
Testing any of this needs a mock that can *be slow on purpose* — a small, required piece of work with
no line item anywhere else.

**I14. The prototype stays a prototype.** No job servers, no databases, no retry frameworks
(`README` doctrine). The smallest thing that delivers the behaviours above.

---

## 6. Non-goals

**N1. Tuning prompts or models for speed.** Latency is taken as given in this phase; we are hiding
it, not shortening it. *(This is why **the genesis problem** (§3) needs `R7` — the one place hiding is not enough.)*
**N2.** Multi-user, multi-session, multi-device anything.
**N3.** Work that continues while the app or tab is closed. The player-facing rule is: **do not close
the tab mid-saga — the work is lost, the lead comes back.**
**N4.** Real-time play. No *game* state changes because wall-clock time passed; only the delivery of
work the player already asked for does.
**N5.** Prettiness — no animation, typography or art goals here. Only tempo.
**N6.** A general job system. **Three** call sites need this today — pursue, renovate, the reckoning.
*(`R7` and `R8` would each add a fourth; that is exactly why they are rulings and not goals.)*

---

## 7. How we will know it worked

**M1. Blocked seconds per cycle → ~0 in the fort phase.** Wall-clock where the player clicked and
could not act. ⚠ On its own this number goes to zero *by construction* and would report success
exactly when the genesis problem (§3) / §2c fails — so it is never reported alone.

**M2. Seconds with nothing worth doing.** §2c's click count against §2a's latency, per cycle: does
the board hold the player for the length of the wait? Pass mark: **clicks-available × ~2s ≥ the wait
the player just started.** Today at cycle 1 that is 1 click ≈ 2s against a 50–66s genesis — a 30×
shortfall, which is the genesis problem in one number. This is the honest version of `M1`, and `M1` is never
reported without it.

**M3. Longest still moment on the reckoning screen < ~5s**, counting a *beat* — a card, a paragraph,
a roll, a consequence — not a token. **Today's number is the whole call: ~10s median, 27s worst**
(§2a), because nothing at all reaches the screen until the report is finished.

**M4. The designer plays a long session and does not complain about waiting.** The test that decides
it. Run on the **GUI**, which is the surface the complaint came from.

---

## 8. Open rulings for the designer 🟡

*These are the decisions the goals cannot make. Recommendations attached so they can be ruled fast.*

**R0 — Does determinism survive concurrency? ✅ RULED 2026-08-26: it doesn't matter.** Replay is not
a requirement (`I1`); the anti-repetition windows (`I3`) and the writing quality they protect (`I4`)
still are, and so does a stable telling order (`I2`). *(The framing and options are kept below because
they explain WHY `I3`/`I4` are the load-bearing half — the same code causes both.)* `I1` demands that interleaved play and one-at-a-time play produce
identical saves. That is expensive: `game.rng` is a single stream drawn on *both sides* of every AI
await (`game.ts:820–896`, then `:958–966`), ids come from one global counter that also decides
resolution order (`cards.ts:79`, `game.ts:1729`), and seven dedup windows are read-before/written-after
each call (`I3`). Honest options: **(a)** keep full determinism — every number a generation needs is
drawn *before* its call, or each job gets its own derived sub-stream; real restructuring, and it
argues with `I14` ("the smallest thing"); **(b)** per-job sub-streams only, accepting that *ordering*
between jobs still varies; **(c)** drop replay determinism for concurrent play and keep it only on the
scripted/sim path (`I11`), which the tests and `GENERATION_FLOW §20` actually depend on.
**Recommendation: (a)** — pre-rolling every number before the call is a day's work at most, keeps
`chaos.test.ts` and the sim baselines meaningful, and (c) quietly ends the ability to reproduce a
player's bug from their save. But this is a real cost and it is the designer's to price.

**R1 — END CYCLE with pursuits in flight. ✅ RULED 2026-08-26: (b) — END waits**, draining on the
reckoning screen. *(Recorded below: the case that was made for (c), and what (b) costs, so the
reasoning is not lost if it is revisited.)* (a) refuse END until the queue drains; (b) END waits,
draining on the reckoning screen; (c) in-flight work lands on the **next** cycle's board.
**Recommendation was (c).** A quest card arriving on the reckoning screen can only be looked at —
assignment is a fort-phase act — so (b) drops the card where it cannot be used and puts a loading bar
on the one screen that is supposed to be the show. (c) moves no engine state across the boundary (a
card on the board has not marched), it has an in-fiction reading the player already thinks in — *the
map table finished overnight* — and it is the only option that makes the 60s genesis **free**: it
overlaps the reckoning *and* the next fort phase. ⚠ **Its real risk is not lead expiry but a
precondition the reckoning destroys**: a beat is refused when its chain has ended (`game.ts:713`), and
the reckoning is exactly what advances, settles and slips chains. So (c) needs a stated answer for
work whose story finished while it was being written — deliver it anyway, or drop it with a line the
player can read? *(Suggested: drop it and say so; a beat of a story that just ended is worse than no
beat.)*

**R2 — May the reckoning show engine facts before the prose lands?** The engine knows everything
before the AI writes (`GAME_STATE §2`). The shipped order already answers *what comes when*: the roll
is shown, after `before` and before `after`. So the question is only what may fill the opening
seconds. **Recommendation: the card and the march** — the title, the situation the player already
read, and who walked out of the gate — and nothing that pre-empts a beat further down the order.

**R3 — What paces the reveal? ✅ PARTLY RULED 2026-08-26.** The designer's clarification settles the
unit: **per QUEST, as each result lands** (`P11`). What stays open is the one-quest cycle, which is
most of them (`P12`): with a single report there is nothing to interleave, and the screen is blank for
~10s unless something else fills it. The options below are about *that* remainder.
*(Original framing: what paces the reveal inside one report?)* (a) stream the model's tokens — **dead**, §2b;
(b) reveal the JSON's fields as the single call completes — everything still lands at once; (c) pace
the reckoning with the **engine's own beats** (the march, the roll, the take) around the single call;
(d) split the report into two sequential calls so text arrives twice — a second call's latency and a
prompt change (`I5`); (e) generate the **blind** half early — `QUESTS §7` makes `before` blind to the
roll, so it could in principle be written when the party is committed, leaving only `after` to wait
for at END. **Recommendation: (c) now, (e) considered later** — (c) needs no prompt change, no extra
call, and no faith in the provider, and its pacing stays constant whether the call takes 4s or 40s.
(e) is the only option that would make the reckoning genuinely two-stage, and it is also a prompt
change: bench it, don't assume it.

**R4 — Does a pursuit show progress, or only that it is alive?** A progress bar on background work
pulls the eye back to the wait `P1` just hid. **Recommendation: alive, not progress** — show *that*
the map table is working and that nothing is lost; never a percentage or an ETA.

**R5 — What is pursuit's price? ✅ RULED 2026-08-26: none.** No gold cost, no lead-supply change, no
in-fiction gate. **2–3 generations in flight to start, adjustable.** The designer's reasoning is
explicit and it overrides the concern below: *"ultimately it's fine if the player wants to rapid-fire
AI calls since they'll pay per AI call"* — the player's own bill is the throttle, and the cap is a
technical setting. *(The argument that was made for a fiction-flavoured, upgradeable cap is kept below
only in case a flat number ever needs to become progression. Do not reintroduce it as a limit on
choice.)* Today the wait is the
only thing making pursuit scarce, and `DESIGN §3` calls the lead board "the strategic surface" where
the player "decides where to spend scarce effort". Remove the wait and pursuit becomes free — the
decision moves to assignment, where a decision already lives, and the game loses one.
**Recommendation: a visible, in-fiction cap on work in flight** — the map table works N jobs at once,
and a room upgrade raises N. That turns the throttle into progression, which is the only kind of cap
a player enjoys. **Do not** answer it by cutting lead supply: the board carries **2 leads at cycle 1
and 5–8 by cycle 10** (§2c's run), which is already the whole strategic surface. ⚠ Note the tension
with `P8`: a late campaign with more sagas running competes for the same N, so the number has to
be raisable — which is why the designer ruled it adjustable.

**R6 — Does the CLI get any of this?** **Recommendation: no.** `I11` puts the requirement on the
facade; the CLI stays the straight-line, work-to-completion reference that scripts and agents drive.
The designer's complaint came from the GUI and `M4` is judged there.

**R7 — May the machine write ahead of the click?** The only answer to **the genesis problem** (§3) that actually removes the
minute: draft a saga's genesis when its lead appears, before the player pursues it. Costs money on leads never pursued (~$0.01 a genesis, against a board carrying 2–8 leads —
so the bill scales with what the board *offers*, not with what the player *does*). ⚠ And the
invariant it breaks is **`I1`, not `I6`**: a speculative draft draws from `game.rng` for a lead that
may never be pursued, so the campaign's random stream becomes a function of what the board showed.
Under `R0`(a) that is fixable; under (c) it is moot. **Recommendation: rule on this together with
`R1`** — if (c) makes the genesis land next cycle, the wait may already be invisible
and this can wait. If it still bites in play, this is the fix.

**R8 — Where does `flesh` go?** It is the cycle's 12–16s tail and it is also the call that turns a
tag list into a person. Note a related hole the tempo work could close: because it runs only at
step 7, **a new game's founders have no who/backstory for the whole of cycle 1**, and every hire is
blank until the next reckoning. ⚠ And it is a **batched** call — one request for everyone minted this
reckoning, up to 8 (`game.ts:2750`, `openai.ts:701`) — so "flesh each person the moment they appear"
turns one call a cycle into N, which is a cost decision, not only a tempo one.
**Recommendation: off the critical path, and fleshed on arrival for people the player is about to
meet** (a hire, a finale prize), batched as now for the rest.

**R9 — Is `renovate` in scope?** It is the third blocking call and it is done in bursts (build a
kitchen, a gallery, a menagerie; style each). It also spends gold *before* its call, which `P3`
forbids. **Recommendation: in scope, cheapest possible** — same queue, no ceremony.

---

## 9. Scope and sequencing

**The two halves are independently approvable and independently shippable.** They share the machinery
but not the risk: `G1` (pursue several at once) is where the concurrency hazards in §5 live; `G3`
(results as they land) touches no concurrency at all — the resolve calls already run in parallel, it
is only the screen that holds them.

Order that follows from the measurements:

1. **`I8` and `I13`** — fix the AI log so it can tell the truth about concurrent calls, and give the
   mock a way to be slow on purpose. Nothing below can be *tested* before this.
2. **`G3`, the reckoning** — smaller, no concurrency, already-ruled behaviour, and it fixes a stare on
   *every* cycle. `P12` (the one-quest cycle) is the part `G3` alone misses.
3. **`G1`, the fort-phase queue** — 2–3 in flight, adjustable. `I3`/`I4` (the anti-repetition windows)
   ship *with* it, not after, or concurrency starts dealing duplicate sparks and near-identical names.
4. **The genesis minute** — last. With END ruled to *wait*, nothing absorbs those 50–66s except the
   fort phase itself, which §2c measures at 1–7 clicks. Expect this one back from play. ⚠ `R7`.
