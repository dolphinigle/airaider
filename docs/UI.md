# 🗺 THE UI — the Sultan-style table

**Status: built 2026-09-29 (prototype).** Designer brief: *"UI very similar to Sultan's Game … quests as
points on a MAP, hover shows info, click opens the detail; a quest-list sidebar; better tabs; build with
room icons that say what each room does; IMAGES for characters (cheapest, only for soldiers you recruit,
only after recruitment); the card hand at the bottom, draggable, able to hold very many cards; keep the
QoL for deciding who goes where."* Mockups: the claude.ai canvas "Airaider UI mockups". Reference corpus:
Sultan's Game map/rite/hand screens (researched 2026-09-29). Code: `v3/web/`.

Supersedes `QUEST_SCREEN.md` §2's "no new art" non-goal (portraits and room icons are now in scope).
Every other QUEST_SCREEN goal (G1–G8) still holds.

## 1 · Screens — three, not twelve

| screen | holds |
|---|---|
| **Map** (home) | quests as markers on a woven map of the regions; the **board** sidebar (tabs: Quests · Leads) |
| **Fort** | the hold in cross-section, drawn room icons; right panel = build list / the clicked room / tavern / holding |
| **Chronicle** | sagas · people & places · log · AI ledger |

Roster, captives, items and people are no longer tabs: they are **bags in the hand** plus the **card
sheet**. The reckoning stays its own page (TEMPO P10).

## 2 · The map

- A quest is a marker (glyph = kind of work; teal ring = saga; crown = finale) with a name banner and a token
  row: one attribute chip per place (solid once filled) and reward-kind icons (captive / recruit / relic / lead / gold).
  Its chip: lapse countdown (red at ≤2) · `ready · <band>` coloured by the engine's pooled odds band · `choose an ending`
  · `↻ daily` on standing posts. New arrivals drop in with a NEW ribbon.
- **Hover** = the gist: kind, the errand, who's placed, odds, pay, lapse, cast. **Click** = the quest page.
- Locked regions are veiled with what opens them. One quest per region row (banners never overlap).
- **Leads are NOT map markers** (designer ruling 2026-09-29): they are the board's Leads tab.

## 3 · The hand — the Sultan card strip

- Always on screen. Four **bags**: Soldiers · Captives · Relics · Stores (keys 1–4). In the fort a **selected
  room arms the hand**: it switches to the bag that fills that room, dims what the room refuses and badges what it would
  gain; a 0-place room shows `Add a place · Ng` in the hand bar. Captive cards carry a state chip (RAW / RACK cN / TAMED /
  ON SHOW · room); relics on show say where.
- Overflow squeezes into **slivers** (hover to peek); **All cards** (B) opens the drawer: search, bag
  filter, relics filed into **folders by kind** that fan out, stackables as one card with a count.
- Card face: name, portrait, level, wound chip, where they're placed. Numbers appear only when they help
  decide: an armed place badges every soldier with their coins there, sorted best first, with the reason
  (`+ roguery`, `− playful`, `wound −2`).

## 4 · Who goes where (the QoL that must survive)

Every path is ONE engine call both UIs make (G5). Words, not coin arithmetic: the pooled quest shows the engine's
5-word band (likely / coin-flip / a partial at best / long shot / hopeless — `oddsBand`), single places and cards show
only strong / fair / weak (`slotStrength`), with why-chips (`+roguery`, `−playful`, `wound −N`).
- **Drag a soldier over the map** → every marker shows their best place, coins and strength (and the quest they
  would leave); **drop** →
  `Game.sendTo` (their best free place there; moves them off another quest). CLI: `send <q> <merc>`.
- **Card sheet → "Send them to"** lists their best place on every quest (`Game.placementsFor`). CLI: `fit <merc>`.
- Quest page: click a place then a card, or drag onto a niche — both `sendTo(q, merc, slot)`: moves a soldier off
  another quest, and a taken niche SWAPS. Auto (`autoAssign`); board Auto-fill every quest (`autoAssignAll`). Clicking a
  card with nothing armed sends them to their best place on the open quest. Finale approaches show their facts.

## 4b · Prisoners & relics into rooms (the 2026-09-30 pass)

- One engine planner: `Game.roomPlacementsFor(card)` (every room that could take it, the gain, or the refusal + a
  one-click fix) and `Game.setInRoom(room, card, idx?)`. CLI: `fit <captive|relic>`, `setin <card> <room> [idx]`.
- Drop a captive/relic on a **room tile** or a place: tiles glow with the gain (`tamed by c29`, `+2.7 ✦`, `⇄ swap`) and dim
  with the reason. The card sheet lists **Set them in**. Clicking a placed card opens it; removing is an explicit ✕.
- The rack shows a countdown; taking a captive off wipes breaking progress, behind a two-step confirm; racks never
  swap. The **Dungeon panel is the prisoner hub**: Holding → Cells → Rack → Tamed → On show, with engine price quotes.
- Rooms still start with 0 places; every room shows a ghost `Add a place · Ng`.

## 4c · The turn

- **Next steps** live in the one header bar (`Game.nextSteps`, CLI `next`/`status`): as many whole chips as fit, the rest
  behind `+N`; urgent steps never hide. Each opens its target.
- **END guard**: when `Game.endWarnings()` is non-empty the first click (or E) arms the seal and lists what END leaves
  behind; the second ends. CLI: `end` prints the warnings and needs `end!`.
- **Reckoning**: one block per quest with an outcome stamp and coin row; a **spoils tally** beside PROCEED (gold,
  prestige, level-ups, wounds, captives, relics, tamed — chips open what they name). CLI prints a TALLY line.
- Header: the Great Hall pill always shows progress and what the next tier opens; gold/prestige changes float.
- Every action result is toasted (green ok / amber warn / red refused).

## 5 · Portraits

- Painted by `gpt-image-2.5-sunburst`, quality low (~half a US cent; 158 output tokens), in the ../mahjong reference
  style (refined anime, flat two-tone cel shading, chest-up bust, transparent ground; the prompt is built from the
  soldier's traits and leans attractive — designer 2026-09-30). Cache is versioned (`.v2.webp`), so a style change
  repaints. **Only for
  roster soldiers, only once they are on the roster** (founders count — they are on the roster). Never
  tavern candidates, captives or quest cast (cast show initials). Cached per save in
  `saves/portraits/<save>/`. Real AI only; `AIRAIDER_PORTRAITS=0` turns it off. `server/portraits.ts`.
- UI-only: the engine never reads a portrait. The text UI shows no picture — that is the one
  deliberate parity gap (a terminal cannot draw one).

## 6 · The build list

**Where:** there is no build list on the right. Click a free cell in the hold (or the dig spot, which digs and picks
the new cell) and a **BUILD HERE popup** opens: readable room cards (full description, wants, first-place cost, why not),
each with *Build here* (`Game.build(type, owner, cell)`; CLI `build <type> [owner] F,C`, and `fort` prints each free
cell's F,C). Esc / ✕ closes it. A next step or fix that says 'build X' opens the popup on the first free cell with X
highlighted (or in 'dig first' mode when none is free). The side panel appears only for a selected room or holding;
otherwise the hold takes the full width (designer 2026-09-30).

Every room shows its drawn icon, cost, **what it does** (one plain line, `src/game/roomInfo.ts` — the CLI
`buildable` prints the same line) and, for comfort rooms, what it wants.

## 6b · Space (2026-09-30 — designer: "header way too big", fort "scroll inside a tiny box", BUILD "can't scroll")

- Chrome ≤ ~170px at 1536×740 (was 292): one 46px header bar; the hand, cards and END seal scale with the viewport
  height (`--card-h: clamp(104px, 15vh, 148px)`); the hand can fold to a strip.
- The fort cross-section sizes its tiles from width AND height, so the whole hold is visible without scrolling.
- Every panel has at most ONE scroll region (wheel + keyboard), with sticky headers. Nothing is drawn over a card's name
  or its portrait's face. No text under 11px, no control under 28px.

## 7 · Checks

- `scripts/uiplay.ts <webPort>` — drives real Chrome on a scratch save (`scripts/_mkfixture.ts` builds
  `saves/_fixture.json`: gold, captive rooms, prisoners in every state): real drags onto the map, niches and room tiles,
  the rack confirm, Set them in, the END guard, reckoning stamps + tally, one check per 2026-09-30 audit fix, the chrome budget and fort fit at 1280×650 and 1536×740, build-list wheel/keyboard
  scroll, hand fold. 113 checks.
- `scripts/_uishots.ts <outDir> <url>` — screenshots every screen; judge from pixels.
- G6 still binds: no rotated text anywhere (slivers carry no text for this reason).

## 8 · Defaults taken without a designer ruling (2026-09-30) — confirm or overturn

1. Leaving a rack wipes breaking progress (behind a confirm); racks never swap.
2. Pooled quest = 5 band words even without an Oracle (the Oracle adds the %). Places = strong/fair/weak only.
3. `Pursue all (n)` exists (vs. standing posts re-posting themselves).
4. The next-steps row is always shown.
5. END needs a second click whenever something would go cold, not march, or lacks an ending.
6. A captive on show still occupies a cell.
7. New comfort rooms (incl. the Torture chamber) start with 0 places.

Added by the 2026-09-30 audit fixes (doc gaps — confirm or overturn):
8. Your own bedroom (owner = you) has NO effect: v3 has no levelling player, so FORT §3 / GENERATION_FLOW §B "your
   bedroom gates YOUR level cap" is unbuilt. It takes no places and no planner ranks it.
9. Mess hall, Storage and Holding cell have NO effect: their menus are never enforced (`menuGates` `locks:false`). The
   build list says so; no bag says "build X first"; holding works without a Holding cell.
10. The END guard also covers a saga's continuation lead going cold, a lead carrying money going cold, a captive handed
    off from holding and a hireable tavern guest leaving. "Nobody marches while soldiers idle" is NOT guarded.
11. Auto on a quest the idle soldiers cannot fully man places nobody (Auto-fill-all already undid such placements).
12. A move into a free place that LOSES prestige is allowed, labelled with the loss (only a full room's swap must gain).
13. The scroll names a prestige room to build when the Great Hall waits on prestige and none stands; no Tavern hint.

## 9 · Settings & sound (2026-09-30)

- **Story direction** (header ⚙ → Settings; CLI `direction [text|clear]`). The player types free text — a tone, a setting,
  what the people they meet or recruit are like. ONE writer-model read (`interpretDirection`, once per save of the
  setting) turns it into `guidance` (1–2 plain instructions, appended to every writer call's system prompt as a
  CAMPAIGN DIRECTION block — only when set, so default prompts are unchanged) and **trait preferences** as engine tag ids,
  separately for strangers (`npc`) and recruits: avoided traits never roll; preferred ones weigh ×5; a single preferred
  race or sex is always used (`prefPick`, `generateCard(prefs)`). The engine keeps only ids it knows. Applies to what is
  written and rolled from then on (designer: "preferences for traits, not just sex").
- **Sound effects** (`web/sfx.ts`): synthesised live with Web Audio — no files, no cost (the ../mahjong make_sounds
  approach). Every engine action has a sound (place, refuse, build, dig, raise, coin, quill…), END is a gong, each
  reckoning verdict lands with a stamp, the tally rings coins / a level-up arpeggio, card pick-up and popups swish.
  Header 🔊 mutes; Settings has volume + test. Per-viewer (localStorage).
