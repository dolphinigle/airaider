# PLAYTEST NOTES — the inbox

**This is an INBOX, not law.** Things the designer noticed while playing, written down verbatim so
they are not lost. **Nothing here has been acted on, investigated, or agreed.** Triage happens
later, together: each note gets a ruling, then either a docs change, a task, or a "won't fix".

Keep adding. One note per observation, newest at the bottom.

**Status key:** 🆕 untriaged · 🔍 triaged, needs a decision · ✅ ruled · ❌ won't fix

---

## N1 🆕 Lead-hunt leads should spawn something generic, not a specific quest

> *"Lead-hunting leads should just spawn something thats more generic instead of a specific quest,
> makes no sense."*

**Context, for triage (not a diagnosis — nobody has looked properly yet):** a `lead-hunt` is a
standing lead on the board that reads as *"sweep the region for rumours worth chasing"*. Pursuing it
runs the ordinary one-off pipeline, so it gets a **bespoke written quest card** like any other job,
and on a non-failure resolution the engine grants 1–2 fresh leads (`🧭 The sweep pays: 2 new lead(s)`).

The oddness the designer is pointing at: a *generic sweep for rumours* is being dressed as a
*particular dramatic situation*, which it isn't.

**Open questions for triage:** should a lead-hunt bypass card generation entirely (a mechanical
action with no AI call)? Or keep a card but a deliberately generic one? What does it cost the player
— does it still take soldiers and a cycle? And does the answer change now that routine one-offs are
one sentence anyway?

---

## N2 🆕 Saga cards use their people with no introduction — from the very first card

> *"for quest chains: the game uses the characters without introduction even at start (pls find the
> corresponding quest chain and quest: 'look the ford over for Adeliza'). no context so no idea
> whats going on"*

**Found it.** `chain-53` — *"Three Fragments at the Ford"*, a captive saga, beat 1 of ~4, quest `q54`,
gravity *a grave affair*. Live in the designer's game (seed 230593368, cycle 5).

**The card as the player read it:**

> **Look the ford over for Adeliza**
> Ermina meets you at the river ford and holds out a broken cord from the reliquary. She says she
> will take Adeliza at the ford and wants her brought there. She found fresh footprints and a torn
> ribbon snagged on the low beam by Bracken Beam. The pay is fixed, and what else the job shakes
> loose the company keeps. They say the one at the heart of this would fetch a ransom worth a season
> of contracts.

Four proper nouns land unintroduced in three sentences — **Ermina**, **Adeliza**, *the reliquary*,
**Bracken Beam** — and the card never says who either woman is, what the reliquary is, or why the
company should care. It opens mid-conversation with strangers.

**The sharp part, for triage: the bible HAS the answers and they did not reach the card.**

```
Ermina  — "A riverside steward who claims a stolen reliquary and will meet at the ford."
Adeliza — "An entertainer and light-finger who has been moving through the Western Forests."
kernel  — "Ermina hires the company to seize Adeliza. The hunt draws out three enemies who
           hold a split vault key and must be forced to meet."
```

So this is not a generation gap — it is an introduction gap. Both `who` lines are one clause each
and would have fixed the card.

**There is already a rule that this card breaks** (saga card prompt, ABOVE ALL rule 3): *"First use
of any person, place, or thing — the client included — is introduced by a FULL sentence in which they
DO something in this matter… a card whose reader cannot say who hires them, what the matter is, why
it matters, and why it takes hired steel has failed."* The rule exists and did not fire.

**Open questions for triage:**
- Is the fix prompt-side at all? The rule is already written and was ignored — this repo's own
  measurements say wording is the weakest lever, so a fifth restatement is unlikely to work.
- Should the ENGINE deal the cast's `who` lines to the beat-1 writer as a dealt fact, the way it
  deals other things it insists on? (Does it already? Nobody has checked.)
- Beat 1 has a documented special job — *"the player's FIRST sight of the saga — a cold reader gets
  the hook and its WHY"*. Is beat 1 failing specifically, or do all beats do this?
- Related and possibly the same root: *"the one at the heart of this would fetch a ransom"* — the
  card's closing line refers to a person it never named.
