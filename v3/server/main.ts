// Thin JSON API over the Game facade — the web GUI's backend.
// One game instance; autosaves to saves/web.json every cycle.
// AIRAIDER_AI=openai for the real AI (default mock). Port 3210.

import Fastify from 'fastify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ROOM_TYPE, upgradeCost, renovateCost, ghUpgradeCost, GH_THRESHOLDS, maxSlotsAtTier, excavateCost } from '../src/engine/fort.js';
import { REGION, REGIONS } from '../src/engine/regions.js';
import { roomDesc, roomWants, roomCategory } from '../src/game/roomInfo.js';
import { Portraits } from './portraits.js';
import { renderTags } from '../src/engine/tags.js';
import { cardType, isLiability, hasTag } from '../src/engine/cards.js';
import { slotThreshold, coins, explainCoins, coinsWhy, slotStrength } from '../src/engine/roll.js';
import { breakDuration } from '../src/engine/fort.js';
import { leadBand } from '../src/engine/quests.js';
import { unitWorth, unitStars, unitPeak } from '../src/engine/economy.js';
import { xpNeeded } from '../src/engine/growth.js';

// AIRAIDER_SAVE names the file, so a test server on another port cannot clobber the save the
// designer is actually playing (2026-08-26: a harness on :3298 wrote over saves/web.json, which is
// gitignored and therefore unrecoverable — the port was different, the save path was not)
const SAVE = path.join(process.cwd(), 'saves', process.env.AIRAIDER_SAVE ?? 'web.json');
const LOG_DIR = path.join(process.cwd(), 'logs');
const SESSION_LOG = path.join(LOG_DIR, `session-web.jsonl`);

/** append-only session trail — the post-hoc "what just happened and why" record */
function slog(entry: Record<string, unknown>) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(SESSION_LOG, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* logging must never break play */ }
}
const useOpenAi = process.env.AIRAIDER_AI === 'openai';
// a fresh game rolls a fresh seed — a fixed default (42) replayed the exact same keyword/name
// draw sequence every restart ("shyness" on every playthrough). Pin AIRAIDER_SEED for repro.
const seed = Number(process.env.AIRAIDER_SEED ?? Date.now() % 2 ** 31);
const ai = useOpenAi ? makeOpenAiProvider() : new MockProvider(seed);

let game: Game;
if (fs.existsSync(SAVE) && !process.env.AIRAIDER_FRESH) {
  game = Game.load(ai, fs.readFileSync(SAVE, 'utf8'));
  console.log(`[server] loaded ${SAVE} (cycle ${game.state.cycle})`);
} else {
  game = new Game(ai, seed);
  console.log(`[server] fresh game (seed ${seed} — set AIRAIDER_SEED to replay it)`);
}
// the last finished reckoning survives a restart: the archive lives in the save. lastRec is the
// record lastReport came from — ONE source for the report, its verdicts and its tally (null after
// an END that threw: the broke-off lines have no verdicts, and the previous cycle's must not show)
let lastRec = game.reckoningAt() ?? null;
let lastReport: string[] = lastRec?.lines ?? [];
// a new process numbers its job settles from 1 again: a tab left open across a restart re-baselines on this
const BOOT = Date.now().toString(36);
// soldier portraits, cached next to the save (one folder per save file)
const portraits = new Portraits(path.join(path.dirname(SAVE), 'portraits', path.basename(SAVE, '.json')),
  useOpenAi && process.env.AIRAIDER_PORTRAITS !== '0');

// Fires after every action. A background job (TEMPO P1) finishes OUTSIDE any action, so the quest
// it wrote may not reach the file until the NEXT action saves. Deliberate: a timer here would race
// the engine mid-mutation and tear the save (I7). Nothing below may assume state only moves inside
// an action — every view is rebuilt from `game` on each GET.
function autosave() {
  fs.mkdirSync(path.dirname(SAVE), { recursive: true });
  fs.writeFileSync(SAVE, game.save());
}

function cardView(c: NonNullable<ReturnType<Game['card']>>) {
  return {
    id: c.id, name: c.name, tags: renderTags(c.tags), value: c.value,
    // the rarity marker: `value` is the MARK (the budget spent) and reads the same for a jackpot
    // and a dud, so the board shows what the card actually IS — its tags' worth in coin, and how
    // that compares to a typical unit of its level
    worth: unitWorth(c), stars: unitStars(c),
    peak: (p => p ? `${p.concept} (${p.rank})` : null)(unitPeak(c)),
    type: cardType(c), qty: c.qty, liability: isLiability(c),
    location: c.location,
    // captives on show / relics on show: what cashing them out throws away (the prestige it earns) —
    // both UIs confirm on it, as they do on rackLoss
    cashLoss: game.cashOutLoss(c.id),
    // where it sits, by NAME (a relic or captive on show) — null when in the hand
    whereId: c.location.kind === 'room' ? c.location.roomId : null,
    whereName: game.whereName(c.id),
    // captives only: raw | breaking (doneAt = the cycle they come off tamed) | tamed | onShow
    state: game.captiveState(c.id)?.state ?? null,
    doneAt: game.captiveState(c.id)?.doneAt ?? null,
    // soldiers only — see server/portraits.ts for the cost rule
    portrait: c.character?.role === 'merc' && portraits.has(c.id) ? `/api/portrait/${c.id}` : null,
    painting: c.character?.role === 'merc' && portraits.isPainting(c.id),
    character: c.character ? {
      role: c.character.role, level: c.character.level, xp: c.character.xp,
      attrs: c.character.attrs, injury: c.character.injuryTiers,
      obedient: hasTag(c.tags, 'obedient'),
      who: c.character.who, backstory: c.character.backstory, quirks: c.character.quirks,
      focus: c.character.focus,
    } : null,
  };
}

function stateView() {
  const st = game.state;
  const p = game.prestige();
  // TEMPO P11: the live, still-growing report of a reckoning in flight. /api/state is a plain GET
  // that is NOT queued behind the action chain, so the client can read it while endCycle() awaits.
  const live = game.reckoningView();
  const need = GH_THRESHOLDS[st.fort.ghTier + 1] ?? null;
  portraits.ensure(game.roster());
  // room placements are previewed by simulation — computed ONCE per view, shared by the cards
  // (roomPlacements) and the rooms (roomFits)
  const capList = game.captives();
  const relicList = game.relics();
  const placementsOf = new Map([...capList, ...relicList].map(c => [c.id, game.roomPlacementsFor(c.id)]));
  return {
    cycle: st.cycle, gold: game.gold(), prestige: p, ghTier: st.fort.ghTier, ghNeed: need,
    ghCost: need ? ghUpgradeCost(st.fort.ghTier + 1) : null,
    maxSlots: maxSlotsAtTier(st.fort.ghTier),
    bootId: BOOT,
    unlockedRegions: st.unlockedRegions,
    // the regions in play (never empty: a fresh fort's home is the forests)
    activeRegions: game.activeRegions(),
    // unlocked = in play, or already holding an open quest (a quest never sits on a veil)
    regions: REGIONS.filter(r => r.id !== 'outskirts').map(r => ({ id: r.id, name: r.name, ghTier: r.ghTier,
      unlocked: game.activeRegions().includes(r.id) || st.quests.some(q => q.state === 'open' && q.region === r.id) })),
    // THE GREAT HALL GOAL — always visible, not only when ready
    ...(() => {
      const gh = game.ghInfo();
      const b = game.ghBlock();
      return {
        // prestigeOk / goldOk: the two checks, the engine's comparisons (never re-derived client-side)
        gh: { ...gh, fix: b?.fix ?? null, prestigeOk: gh.need !== null && gh.have >= gh.need, goldOk: gh.cost !== null && gh.gold >= gh.cost },
        ghReady: gh.ready,                        // raise it now
        ghBlock: gh.block,                        // why not ('needs prestige 4 (have 2.1)' | 'costs 267g (short 40g)')
        ghUnlocks: gh.unlocks.map(u => u.name),   // room names the next tier opens
        ghUnlockTypes: gh.unlocks.map(u => u.type),
      };
    })(),
    // the rooms that give prestige, biggest first (the prestige bar's breakdown)
    prestigeSources: game.prestigeSources(),
    menus: game.menuGates(),
    can: { heal: game.hasRoom('hospital'), interrogate: game.hasRoom('interrogation') },
    rosterCap: game.rosterCapacity(), captiveCap: game.captiveCapacity(),
    // while a cycle is resolving the live lines win; the module variable is the finished cycle's
    // copy, kept so `⚄ last reckoning` still works after PROCEED
    lastReport: live ? live.lines : lastReport,
    // a light INDEX of the archive — the bodies are fetched on demand from /api/reckoning, so a
    // 1-second poll does not carry a dozen reports
    reckoningCycles: game.reckonings().map(r => r.cycle),
    // false once every report line is in — even though endCycle() is still running its flesh tail
    reckoningWriting: !!live?.writing,
    // THE VERDICTS (per marching quest): {questId,title,outcome,heads,coins,bar,partialAt,party[],partyIds[],
    // isFinale,chainId,from,to} — from/to = that quest's line range in lastReport. While a reckoning is
    // being written only the quests whose report has landed are listed.
    lastMeta: live ? live.meta : lastRec?.meta ?? [],
    // the cycle's TALLY (null while writing, and for an archive older than the tally):
    // {cycle,goldBefore,goldAfter,prestigeBefore,prestigeAfter,outcomes,levelUps[],wounds[],newLeads,newLeadIds[],
    //  captivesTaken[],recruits[],relicsGained[],tamed[],lapsed[],stalled[],leadsCold[]}
    // (the engine archives the cycle — summary included — the moment every line is in, BEFORE the
    // flesh tail, so a live reckoning that is no longer writing already has its tally)
    lastSummary: (live ? (live.writing ? null : game.reckoningAt()?.summary) : lastRec?.summary) ?? null,
    // the same tally as one line (the CLI's TALLY, the after-PROCEED toast)
    lastTally: (sum => sum ? Game.tallyLine(sum) : null)(live ? (live.writing ? null : game.reckoningAt()?.summary) : lastRec?.summary),
    // R5 — what END would lose: {key,questId|null,title,why:'lapses'|'short'|'needs-approach'|'lead-lapses'|'handoff'|'leaves',
    // filled,of,lapsesNow,text,target}[]
    endWarnings: game.endWarnings(),
    nobodyMarches: game.nobodyMarches(),
    marching: game.marching(),       // parties that march at this END
    // R4 — the next-steps scroll: {kind,text,detail,target:{screen,questId?,roomId?,type?,cardId?},urgent,
    // act:{type,args,label,cli,block}|null}[] — act.type/args is a POST /api/action as-is
    nextSteps: game.nextSteps(placementsOf),
    // ARRIVALS: jobs[].seq is each settled job's settle number; announce every job with seq > the
    // arrivalSeq of the FIRST state you loaded (Game.arrivals — the CLI announces by the same rule)
    arrivalSeq: game.arrivalSeq(),
    // TEMPO P1: several pursuits can be out at once, so "what is in flight" is a LIST on the state,
    // never a single busy flag on the client. A job settles OUTSIDE any action — this GET is the
    // only thing that tells the board about it.
    jobs: game.jobs(), maxInFlight: game.maxInFlight,
    fort: {
      cells: st.fort.cells,
      rooms: st.fort.rooms.map(r => {
        const rt = ROOM_TYPE[r.type]!;
        const kind = game.roomKind(r);   // 'rack' | 'prestige' | 'function' | null (gates, cells, landmarks)
        const gold = game.gold();
        return {
          id: r.id, type: r.type, name: rt.name, species: rt.species, benefit: rt.benefit, desc: roomDesc(r.type, game.activeRegions()),
          cell: r.cell, style: r.style, kind,
          // the hand bag a room with no places works on: the prisoner rooms show captives
          bag: r.type === 'dungeon' || r.type === 'holding-cell' || rt.species === 'capacity' ? 'captives' : null,
          comfort: rt.species === 'comfort' ? game.comfort(r) : null,
          // one plain label from the engine curves: '+2.7 prestige' · 'heals ×1.4' · 'breaks in 5 cycles' ·
          // 'level cap 6' · 'holds 3 · 2/3 held' · 'no places yet'
          effect: game.roomEffect(r),
          // what its places take, in words
          accepts: kind === 'rack' ? 'raw captives' : kind ? 'relics & tamed captives' : null,
          // racks: how many cycles a captive put on now would take to break
          breakCycles: kind === 'rack' ? breakDuration(game.comfort(r)) : null,
          wants: game.effectiveWants(r).map(w => w.match),
          owner: r.ownerId === 'you' ? 'you' : r.ownerId ? game.card(r.ownerId)?.name ?? r.ownerId : null,
          upgradeCost: rt.species === 'comfort' && r.slots.length < maxSlotsAtTier(st.fort.ghTier) ? upgradeCost(rt, r.slots.length) : null,
          // why "Add a place" can't run: 'short 26g' | 'max 2 places at GH T3' | null
          upgradeBlock: rt.species === 'comfort' ? game.upgradeBlock(r) : null,
          // the ghost slot "Add a place · Ng" (R8) — present even at 0 places; at max depth it is the GH fix
          addPlace: game.addPlaceFix(r),
          // cap-benefit rooms (bedrooms) can't be styled — the engine rejects it; don't offer dead buttons
          renovateCost: rt.species === 'comfort' && rt.benefit !== 'cap' ? renovateCost(rt) : null,
          renovateBlock: rt.species === 'comfort' && rt.benefit !== 'cap' && gold < renovateCost(rt) ? `short ${renovateCost(rt) - gold}g` : null,
          slots: r.slots.map((s, i) => {
            if (!s) return null;
            const card = game.card(s)!;
            const share = game.slotShare(r.id, i);
            return {
              ...cardView(card),
              // racks: the cycle this captive comes off tamed
              doneAtCycle: st.breaking.find(b => b.cardId === s)?.doneAtCycle ?? null,
              // how long THIS captive's breaking is (fixed when racked; the room's breakCycles is the
              // quote for the next one and moves with the rack's contents)
              breakTotal: game.captiveState(s)?.breakTotal ?? null,
              // what taking it out costs: prestige lost (0 for function rooms) and the effect after
              prestigeShare: share ? Math.round(share.prestige * 10) / 10 : 0,
              shareEffect: share?.effectAfter ?? null,
              // non-null on a rack: the two-step confirm's text ('breaking lost (was due c29)')
              rackLoss: game.rackLoss(s),
            };
          }),
        };
      }),
    },
    // blocker: null (build now) | 'cell' | 'gold' | 'tier' | 'region' | 'built' · ghTier · firstPlaceCost
    // (comfort rooms are built with no places) · fix: for a 'cell' blocker, the excavate action
    // bedrooms carry owners: [{id,name}] — who one can be built for (Game.bedOwners, build()'s own rule)
    buildable: game.buildableTypes().map(b => ({ ...b, name: ROOM_TYPE[b.type]!.name, desc: roomDesc(b.type, game.activeRegions()), wants: roomWants(b.type), category: roomCategory(b.type),
      fix: b.blocker === 'cell' ? { action: 'excavate', cost: excavateCost(st.fort.cells.length), label: `Excavate a cell · ${excavateCost(st.fort.cells.length)}g`, block: game.gold() < excavateCost(st.fort.cells.length) ? `short ${excavateCost(st.fort.cells.length) - game.gold()}g` : null } : null })),
    freeCells: game.freeCells().length,
    excavateCost: excavateCost(st.fort.cells.length),
    excavateBlock: game.gold() < excavateCost(st.fort.cells.length) ? `short ${excavateCost(st.fort.cells.length) - game.gold()}g` : null,
    roster: game.roster().map(m => ({
      ...cardView(m), cap: game.capOf(m.id), dossier: game.dossier(m.id),
      healEta: m.character!.injuryTiers > 0 ? game.healEta(m) : null,
      xpNeeded: xpNeeded(m.character!.level),
      // their best FREE place on every open quest: {questId,title,idx,attr,coins,bar,strength,here}
      placements: game.placementsFor(m.id),
      // the wound's cost on every roll, in coins (0 when unhurt)
      woundPenalty: game.woundPenalty(m.id),
      // their own bedroom, if any (for the cap line)
      bedroom: (b => b ? { roomId: b.id, effect: game.roomEffect(b), places: b.slots.length } : null)(st.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === m.id)),
    })),
    captives: capList.map(c => ({
      ...cardView(c),
      breaking: st.breaking.find(b => b.cardId === c.id)?.doneAtCycle ?? null,
      breakTotal: game.captiveState(c.id)?.breakTotal ?? null,
      // nothing takes them: the ONE place to make for them (Game.placeFixFor — the CLI's Dungeon view
      // and the next-steps scroll make the same choice): {roomId, roomName, fix} | null
      placeFix: game.placeFixFor(c.id, placementsOf.get(c.id) ?? []),
      interrogated: hasTag(c.tags, 'interrogated'),
      // the engine's own quotes — exactly what ransom()/sell() pay
      ransomEst: game.ransomQuote(c.id), sellEst: game.sellQuote(c.id),
      // non-null while on a rack: what taking them off (✕ / ransom / sell) throws away
      rackLoss: game.rackLoss(c.id),
      // every room they could go (ok first, then by gain) — see RoomPlacement in src/game/game.ts
      roomPlacements: placementsOf.get(c.id) ?? [],
    })),
    relics: relicList.map(c => ({ ...cardView(c), sellEst: game.sellQuote(c.id), roomPlacements: placementsOf.get(c.id) ?? [] })),
    liabilities: st.cards.filter(isLiability).filter(c => (c.qty ?? 0) > 0).map(c => ({ ...cardView(c), settleCost: game.settleQuote(c.id) })),
    tavern: st.tavern.map(s => ({ ...cardView(game.card(s.cardId)!), expires: s.expiresAtCycle, hireCost: game.hireQuote(s.cardId),
      deadline: game.tavernDeadline(s.cardId),   // 'leaves at this END' | 'leaves in 3 cycles' | null (a prepaid prize waits)
      hireBlock: game.hireBlock(s.cardId) })),   // {reason, fix} | null
    holding: st.holding.map(s => ({ ...cardView(game.card(s.cardId)!), expires: s.expiresAtCycle,
      deadline: game.holdingDeadline(s.cardId),   // 'handed off at this END' | 'handed off in 2 cycles' — every surface prints this
      ransomEst: game.ransomQuote(s.cardId), sellEst: game.sellQuote(s.cardId),
      lapseQuote: game.lapseQuote(s.cardId),     // what the quick sale pays if the clock runs out
      acceptBlock: game.acceptBlock(s.cardId) })),   // {reason, fix} | null — 'cells full 3/3' + build a cell
    leadsWaiting: game.leadsAwaitingLeadRoom(),
    // in leadBoard order (continuations → new stories → soonest cold → standing posts)
    leads: game.leadBoard().map(({ lead: l, blocked, onBoard, working }) => ({
      id: l.id, rarity: l.rarity, level: l.level, region: REGION[l.region]!.name, regionId: l.region,
      archetype: l.archetype, chain: l.chainInfo.kind, expires: l.expiresAtCycle, title: l.title ?? null, source: l.source,
      // ECONOMY §7.2 — the band comes from the engine, never rebuilt client-side, so the board and
      // the text UI can never disagree about what a lead promises
      pay: leadBand(l),
      blocked,     // why Pursue can't run ('that hunt is already underway'…) — null = pursuable
      onBoard,     // the open quest id this lead already is on the map, or null
      working,     // 'queued' | 'running' | null — the map table's work on it
    })),
    pursuable: game.leadBoard().filter(r => !r.blocked).length,   // the "Pursue all (n)" count
    quests: st.quests.filter(q => q.state === 'open').map(q => {
      const o = game.questOdds(q.id);
      return {
        id: q.id, title: q.title, situation: q.situation, job: q.job,
        level: q.level, rarity: q.rarity, region: REGION[q.region]!.name, regionId: q.region, archetype: q.archetype,
        chainId: q.chainId ?? null, beat: q.beatIndex ?? null, isFinale: !!q.isFinale,
        ready: game.isReady(q.id),
        // warn: that ending's own reward warning · switchLoss: what switching to it sends back (confirm on it)
        approaches: q.approaches?.map(a => ({ ...a, outcome: game.approachOutcome(q.id, a.id), warn: game.approachRewardWarn(q.id, a.id),
          switchLoss: game.approachSwitchLoss(q.id, a.id) })) ?? null, chosenApproach: q.chosenApproach ?? null,
        rewardEnvelope: game.questReward(q.id),
        rewardKinds: game.questRewardKinds(q.id),   // ('captive'|'recruit'|'relic'|'lead'|'gold')[]
        rewardWarn: game.questRewardWarn(q.id),     // 'brings a captive · cells full 3/3' | null
        abandonText: game.abandonConsequence(q.id), // the two-step abandon confirm's consequence line
        // {coins,bar,success,partial,precision, band: pooled verdict once manned | null, partialAt, filled, of}
        odds: o,
        cast: game.questCast(q.id),
        // a card the player will not read is a dead slot: abandoning returns the LEAD so the
        // job can be written again, once a cycle
        canReroll: !q.chainId && game.canReroll(),
        // lapsesAtCycle folds in the stall rule (a part-filled quest set aside after STALL_LIMIT failed
        // marches); lapseStalled = that is why; lapseUrgent = the engine's red threshold
        lapsesAtCycle: game.questLapsesAt(q), faucet: game.questIsFaucet(q) || undefined,
        lapseStalled: game.questStallAt(q) !== null, lapseUrgent: game.questUrgent(q),
        slots: q.slots.map((s, i) => ({
          idx: i, groupId: s.groupId ?? null,
          requirement: s.requirement.kind === 'must-be'
            ? `must be ${game.card(s.requirement.cardId)?.name ?? '?'}`
            : s.requirement.kind === 'must-have' ? `needs ${s.requirement.concept}${s.requirement.minRank ? ` (${s.requirement.minRank}+)` : ''}` : null,
          test: { ...s.test, bar: slotThreshold(s.test) },
          attr: s.test.attributes.map(a => a.toUpperCase()).join('+'),
          filledBy: s.filledBy ? game.card(s.filledBy)!.name : null, filledId: s.filledBy,
          filledExplain: s.filledBy ? explainCoins(game.card(s.filledBy)!, s.test) : null,
          filledCoins: s.filledBy ? coins(game.card(s.filledBy)!, s.test) : null,
          // one place's colour only (R2): 'strong' | 'fair' | 'weak' — never a band word
          filledStrength: s.filledBy ? slotStrength(coins(game.card(s.filledBy)!, s.test), slotThreshold(s.test)) : null,
          filledWhy: s.filledBy ? coinsWhy(game.card(s.filledBy)!, s.test) : null,   // {plus[], minus[], wound}
          // every roster soldier but the one here, legal first then by coins:
          // {id,name,coins,explain,strength,why:{plus,minus,wound},blocked:string|null,gated (refused only by the
          // approach gate),from:{questId,idx,title}|null}
          fits: game.slotFits(q.id, i),
          // who an approach card names for this place (Game.approachBest — the CLI prints the same)
          best: q.approaches ? game.approachBest(q.id, i) : null,
        })),
        createdCycle: q.createdCycle,
      };
    }),
    // one view for both UIs — the saga as the company knows it (Game.chainViews)
    chains: game.chainViews(),
    lore: Object.values(st.lore.nodes).map(n => ({
      id: n.id, name: n.name, kind: n.kind, blurb: n.blurb, active: n.active,
      dossier: game.dossier(n.id),
      // FORT §5 / LORE §5: the FULL history (inactive edges included) is the Chronicle room's
      // exposure; without it the Library shows living memory only
      chronicle: game.menuGates().find(m => m.key === 'chronicle')?.open
        ? game.chronicle(n.id).map(e => ({ type: e.type, blurb: e.blurb, active: e.active, core: e.core }))
        : game.chronicle(n.id).filter(e => e.active).map(e => ({ type: e.type, blurb: e.blurb, active: e.active, core: e.core })),
    })),
    log: st.log.filter(l => l.kind !== 'dev').slice(-40),
    ai: game.ai.usage(),
    aiName: game.ai.name,
    aiLog: game.ai.callLog().slice(-40).reverse(),
    // every card you could set in each room, RANKED — card ids only: the rows themselves are each
    // card's roomPlacements (a late fort sent every row twice, ~1MB of duplicate)
    roomFits: Object.fromEntries(st.fort.rooms.filter(r => game.roomKind(r)).map(r => [r.id,
      [...capList, ...relicList]
        .filter(c => !(c.location.kind === 'room' && c.location.roomId === r.id))
        .flatMap(c => (placementsOf.get(c.id) ?? []).filter(p => p.roomId === r.id).map(p => ({ p, id: c.id })))
        .sort((x, y) => Number(y.p.ok) - Number(x.p.ok) || y.p.gain - x.p.gain || (y.p.comfortAfter - y.p.comfortBefore) - (x.p.comfortAfter - x.p.comfortBefore))
        .map(x => x.id),
    ])),
  };
}

const app = Fastify();

// This is the API, not the game. Opening the API port in a browser is the obvious mistake to
// make — the startup log prints this URL — so send people to the UI instead of a bare 404.
const WEB = `http://localhost:${process.env.WEB_PORT ?? 5273}`;
app.get('/', async (_req, reply) => reply.redirect(WEB));

app.get('/api/state', async () => stateView());

app.get<{ Params: { id: string } }>('/api/portrait/:id', async (req, reply) => {
  const b = portraits.read(req.params.id);
  if (!b) return reply.code(404).send();
  return reply.header('content-type', 'image/webp').header('cache-control', 'max-age=86400').send(b);
});

/** what dropping one card on each place of one room does — Game.roomSlotPlans (the CLI's
 *  `fit <card> <room>`). Fetched while a card is dragged over a room panel, never polled. */
app.get('/api/slotplans', async (req) => {
  const q = req.query as { room?: string; card?: string };
  return game.roomSlotPlans(String(q.room ?? ''), String(q.card ?? ''));
});

/** re-read a past reckoning. The archive lives in the SAVE, so this survives a restart and
 *  can look further back than the cycle just resolved. */
app.get('/api/reckoning', async (req) => {
  const c = Number((req.query as { cycle?: string }).cycle);
  const r = game.reckoningAt(Number.isFinite(c) ? c : undefined);
  // {cycle, lines, meta: ReckonMeta[] ([] for an old archive), summary: CycleSummary|null, tally}
  return r ? { ...r, tally: r.summary ? Game.tallyLine(r.summary) : null } : { cycle: null, lines: [], meta: [], summary: null, tally: null };
});

// actions run strictly one-at-a-time — concurrent requests (double-clicks) must
// never interleave inside an awaiting action
let actionChain: Promise<unknown> = Promise.resolve();

// A second END must be REFUSED, not queued. Actions are serialised, so the engine's own
// re-entrancy guard never fires — the second request simply waits its turn and then resolves a
// WHOLE EXTRA CYCLE, whose report replaces the one the player was reading. Measured 2026-08-26:
// two simultaneous ENDs took the game from cycle 3 to cycle 5. The GUI disables the button while
// busy, but a second tab, a reload, or a stray double-click all reach here.
let endQueued = false;

app.post<{ Body: { type: string; args: (string | number)[] } }>('/api/action', async (req) => {
  if (req.body?.type === 'end') {
    if (endQueued) return { ok: false, msg: 'the cycle is already resolving' };
    endQueued = true;
  }
  const run = actionChain.then(() => handleAction(req.body))
    .catch((e: Error) => {
      slog({ action: req.body?.type, error: e.message?.slice(0, 400) });
      return { ok: false, msg: `engine error: ${e.message?.slice(0, 200)} (logged)` };
    });
  actionChain = run.catch(() => undefined);
  if (req.body?.type === 'end') run.finally(() => { endQueued = false });
  return run;
});

async function handleAction(body: { type: string; args: (string | number)[] }) {
  const { type, args } = body;
  const a = args ?? [];
  const s = (x: unknown) => String(x);
  const n = (x: unknown) => Number(x);
  // warn: an ok result the player should look twice at (a long-shot party, breaking lost…);
  // id: the room a build/upgrade touched; jobIds: what 'pursueall' queued
  let result: { ok: boolean; msg: string; questId?: string; jobId?: string; warn?: boolean; id?: string; jobIds?: string[]; tally?: string };
  switch (type) {
    case 'build': result = game.build(s(a[0]), a[1] ? s(a[1]) : undefined); break;
    case 'upgrade': result = game.upgrade(s(a[0])); break;
    case 'renovate': result = await game.renovate(s(a[0]), s(a[1])); break;
    case 'excavate': result = game.excavate(); break;
    case 'gh': result = game.ghUpgrade(); break;
    case 'slot': result = game.slot(s(a[0]), n(a[1]), s(a[2])); break;
    // THE room path (R: one path everywhere): setin(roomId, cardId, slotIdx?) — order-tolerant
    case 'setin': {
      const [x, y] = [s(a[0]), s(a[1])];
      const [roomId, cardId] = game.room(x) ? [x, y] : [y, x];
      result = game.setInRoom(roomId, cardId, a[2] === undefined || a[2] === null || a[2] === '' ? undefined : n(a[2]));
      break;
    }
    case 'unslot': result = game.unslot(s(a[0]), n(a[1])); break;
    // TEMPO P1: pursuit is QUEUED — this POST returns in milliseconds instead of after a 10-66s
    // call, and the card arrives on the board later, outside any action.
    case 'pursue': result = game.enqueuePursue(s(a[0])); break;
    // R3: queue every pursuable lead
    case 'pursueall': result = game.pursueAll(); break;
    // TEMPO P5: drop a job that has not started. The engine refuses one already running.
    case 'cancel': result = game.cancelJob(s(a[0])); break;
    // TEMPO P8: the cap is the player's, not the game's — it keeps the provider happy, it never
    // rations. Clamped here because the client is not the only caller (curl, a second tab).
    case 'inflight': {
      const cap = Math.max(1, Math.min(6, Math.round(n(a[0])) || 1));
      game.maxInFlight = cap;
      result = { ok: true, msg: `writing up to ${cap} at once` };
      break;
    }
    case 'assign': result = game.assign(s(a[0]), n(a[1]), s(a[2])); break;
    case 'auto': result = game.autoAssign(s(a[0])); break;
    // send(questId, mercId, slotIdx?) — into that place (swapping its holder) or their best free one
    case 'send': result = game.sendTo(s(a[0]), s(a[1]), a[2] === undefined || a[2] === null || a[2] === '' ? undefined : n(a[2])); break;
    case 'autoall': result = game.autoAssignAll(); break;
    case 'unassign': result = game.unassign(s(a[0]), n(a[1])); break;
    case 'clear': result = game.clearQuest(s(a[0])); break;
    case 'approach': result = game.chooseApproach(s(a[0]), s(a[1])); break;
    case 'abandon': result = game.abandon(s(a[0])); break;
    case 'hire': result = game.hire(s(a[0])); break;
    case 'accept': result = game.acceptCaptive(s(a[0])); break;
    case 'ransom': result = game.ransom(s(a[0])); break;
    case 'sell': result = game.sell(s(a[0])); break;
    case 'settle': result = game.payOffLiability(s(a[0])); break;
    case 'interrogate': result = game.interrogate(s(a[0])); break;
    case 'heal': result = game.payHeal(s(a[0])); break;
    case 'focus': {
      const kind = s(a[1]);
      const focus = kind === 'single' ? { kind: 'single' as const, attr: s(a[2]) as never }
        : kind === 'dual' ? { kind: 'dual' as const, a: s(a[2]) as never, b: s(a[3]) as never }
        : { kind: 'none' as const };
      result = game.setFocus(s(a[0]), focus as never); break;
    }
    case 'end': {
      // On a throw the live reckoning is gone, and `lastReport` still holds the PREVIOUS cycle —
      // which the player would read as this cycle's, having just watched it being written. Say
      // what happened instead. (The outer catch still logs and toasts the engine error.)
      try {
        lastReport = await game.endCycle();
        lastRec = game.reckoningAt() ?? null;
      } catch (e) {
        lastReport = ['⚠ The reckoning broke off — this cycle could not be resolved.',
          `(${(e as Error).message?.slice(0, 160)})`];
        lastRec = null;   // no verdicts, no tally: the previous cycle's must not stand beside this
        throw e;
      }
      // tally: the cycle's spoils in one line (Game.tallyLine — the CLI prints the same)
      result = { ok: true, msg: `cycle ${game.state.cycle} resolved`, tally: (sm => sm ? Game.tallyLine(sm) : undefined)(game.reckoningAt()?.summary) };
      break;
    }
    default: result = { ok: false, msg: `unknown action ${type}` };
  }
  slog({ cycle: game.state.cycle, action: type, args: a, ok: result.ok, msg: result.msg,
    ...(type === 'end' ? { report: lastReport, ai: game.ai.usage() } : {}) });
  autosave();
  return result;
}

const port = Number(process.env.PORT ?? 3210);
app.listen({ port, host: '127.0.0.1' }).then(() => {
  console.log(`[server] API on http://127.0.0.1:${port} · AI: ${ai.name}`);
  console.log(`[server] THE GAME IS AT ${WEB}  ← open this one`);
});
