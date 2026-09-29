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

- A quest is a marker (glyph = kind of work; teal ring = saga; crown = finale) with a name banner, fill
  pips and a chip: lapse countdown (red at ≤2) · `ready` · `choose` (finale needs its approach).
- **Hover** = the gist: kind, the errand, who's placed, odds, pay, lapse, cast. **Click** = the quest page.
- Locked regions are veiled with what opens them. One quest per region row (banners never overlap).
- **Leads are NOT map markers** (designer ruling 2026-09-29): they are the board's Leads tab.

## 3 · The hand — the Sultan card strip

- Always on screen. Four **bags**: Soldiers · Captives · Relics · Stores (keys 1–4). In the fort it opens
  on Relics (things you set in rooms).
- Overflow squeezes into **slivers** (hover to peek); **All cards** (B) opens the drawer: search, bag
  filter, relics filed into **folders by kind** that fan out, stackables as one card with a count.
- Card face: name, portrait, level, wound chip, where they're placed. Numbers appear only when they help
  decide: an armed place badges every soldier with their coins there, sorted best first, with the reason
  (`+ roguery`, `− playful`, `wound −2`).

## 4 · Who goes where (the QoL that must survive)

Every path is ONE engine call both UIs make (G5):
- **Drag a soldier over the map** → every marker shows their best place and coins vs bar; **drop** →
  `Game.sendTo` (their best free place there; moves them off another quest). CLI: `send <q> <merc>`.
- **Card sheet → "Send them to"** lists their best place on every quest (`Game.placementsFor`). CLI: `fit <merc>`.
- Quest page: click a place then a card, or drag onto a niche (`assign`); Auto (`autoAssign`); board
  Auto-fill every quest (`autoAssignAll`). Clicking a card with nothing armed sends them to their best
  place on the open quest.

## 5 · Portraits

- Painted by `gpt-image-1-mini`, quality low (~a few tenths of a cent), inked tarot style, **only for
  roster soldiers, only once they are on the roster** (founders count — they are on the roster). Never
  tavern candidates, captives or quest cast (cast show initials). Cached per save in
  `saves/portraits/<save>/`. Real AI only; `AIRAIDER_PORTRAITS=0` turns it off. `server/portraits.ts`.
- UI-only: the engine never reads a portrait. The text UI shows no picture — that is the one
  deliberate parity gap (a terminal cannot draw one).

## 6 · The build list

Every room shows its drawn icon, cost, **what it does** (one plain line, `src/game/roomInfo.ts` — the CLI
`buildable` prints the same line) and, for comfort rooms, what it wants.

## 7 · Checks

- `scripts/uiplay.ts <webPort>` — drives real Chrome on a scratch save: markers, hover, a **real drag**
  onto the map, quest page arm/place/clear/auto, sheet, leads, drawer search, fort. 21 checks.
- `scripts/_uishots.ts <outDir> <url>` — screenshots every screen; judge from pixels.
- G6 still binds: no rotated text anywhere (slivers carry no text for this reason).
