// Thin JSON API over the Game facade — the web GUI's backend.
// One game instance; autosaves to saves/web.json every cycle.
// AIRAIDER_AI=openai for the real AI (default mock). Port 3210.

import Fastify from 'fastify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ROOM_TYPE, buildCost, upgradeCost, renovateCost, ghUpgradeCost, GH_THRESHOLDS, maxSlotsAtTier, excavateCost } from '../src/engine/fort.js';
import { REGION } from '../src/engine/regions.js';
import { renderTags } from '../src/engine/tags.js';
import { cardType, stackKind, isLiability, hasTag } from '../src/engine/cards.js';
import { slotThreshold, coins, explainCoins } from '../src/engine/roll.js';
import { QUEST_TTL } from '../src/game/game.js';
import { hireCost, RANSOM_RATE, SELL_RATE, unitWorth, unitStars, unitPeak } from '../src/engine/economy.js';
import { ransomRate, marketSellRate } from '../src/engine/fort.js';
import { xpNeeded } from '../src/engine/growth.js';
import { fillScore } from '../src/engine/overlap.js';

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
let lastReport: string[] = [];

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
  return {
    cycle: st.cycle, gold: game.gold(), prestige: p, ghTier: st.fort.ghTier, ghNeed: need,
    ghCost: need ? ghUpgradeCost(st.fort.ghTier + 1) : null,
    maxSlots: maxSlotsAtTier(st.fort.ghTier),
    unlockedRegions: st.unlockedRegions,
    menus: game.menuGates(),
    can: { heal: game.hasRoom('hospital'), interrogate: game.hasRoom('interrogation') },
    rosterCap: game.rosterCapacity(), captiveCap: game.captiveCapacity(),
    // while a cycle is resolving the live lines win; the module variable is the finished cycle's
    // copy, kept so `⚄ last reckoning` still works after PROCEED
    lastReport: live ? live.lines : lastReport,
    // false once every report line is in — even though endCycle() is still running its flesh tail
    reckoningWriting: !!live?.writing,
    // TEMPO P1: several pursuits can be out at once, so "what is in flight" is a LIST on the state,
    // never a single busy flag on the client. A job settles OUTSIDE any action — this GET is the
    // only thing that tells the board about it.
    jobs: game.jobs(), maxInFlight: game.maxInFlight,
    fort: {
      cells: st.fort.cells,
      rooms: st.fort.rooms.map(r => {
        const rt = ROOM_TYPE[r.type]!;
        return {
          id: r.id, type: r.type, name: rt.name, species: rt.species, benefit: rt.benefit,
          cell: r.cell, style: r.style,
          comfort: rt.species === 'comfort' ? game.comfort(r) : null,
          wants: game.effectiveWants(r).map(w => w.match),
          owner: r.ownerId === 'you' ? 'you' : r.ownerId ? game.card(r.ownerId)?.name ?? r.ownerId : null,
          upgradeCost: rt.species === 'comfort' && r.slots.length < maxSlotsAtTier(st.fort.ghTier) ? upgradeCost(rt, r.slots.length) : null,
          // cap-benefit rooms (bedrooms) can't be styled — the engine rejects it; don't offer dead buttons
          renovateCost: rt.species === 'comfort' && rt.benefit !== 'cap' ? renovateCost(rt) : null,
          slots: r.slots.map(s => {
            if (!s) return null;
            const card = game.card(s)!;
            return { ...cardView(card), fit: Math.round(fillScore(card.tags, game.effectiveWants(r)) * 100) / 100 };
          }),
        };
      }),
    },
    buildable: game.buildableTypes().map(b => ({ ...b, name: ROOM_TYPE[b.type]!.name })),
    freeCells: game.freeCells().length,
    excavateCost: excavateCost(st.fort.cells.length),
    roster: game.roster().map(m => ({
      ...cardView(m), cap: game.capOf(m.id), dossier: game.dossier(m.id),
      healEta: m.character!.injuryTiers > 0 ? game.healEta(m) : null,
      xpNeeded: xpNeeded(m.character!.level),
    })),
    captives: game.captives().map(c => {
      const office = st.fort.rooms.find(r => r.type === 'ransom-office');
      return {
        ...cardView(c),
        breaking: st.breaking.find(b => b.cardId === c.id)?.doneAtCycle ?? null,
        interrogated: hasTag(c.tags, 'interrogated'),
        ransomEst: Math.round(c.value * (office ? ransomRate(game.comfort(office)) : RANSOM_RATE)),
        sellEst: Math.round(c.value * SELL_RATE),
      };
    }),
    relics: game.relics().map(c => {
      const market = st.fort.rooms.find(r => r.type === 'market');
      return { ...cardView(c), sellEst: Math.round(c.value * (market ? marketSellRate(game.comfort(market)) : SELL_RATE)) };
    }),
    liabilities: st.cards.filter(isLiability).filter(c => (c.qty ?? 0) > 0).map(c => cardView(c)),
    tavern: st.tavern.map(s => ({ ...cardView(game.card(s.cardId)!), expires: s.expiresAtCycle, hireCost: hireCost(game.card(s.cardId)!.value) })),
    holding: st.holding.map(s => ({ ...cardView(game.card(s.cardId)!), expires: s.expiresAtCycle })),
    leads: game.visibleLeads().map(l => ({
      id: l.id, rarity: l.rarity, level: l.level, region: REGION[l.region]!.name,
      archetype: l.archetype, chain: l.chainInfo.kind, expires: l.expiresAtCycle, title: l.title ?? null, source: l.source,
    })),
    quests: st.quests.filter(q => q.state === 'open').map(q => {
      const o = game.questOdds(q.id);
      return {
        id: q.id, title: q.title, situation: q.situation, job: q.job,
        level: q.level, rarity: q.rarity, region: REGION[q.region]!.name,
        chainId: q.chainId ?? null, beat: q.beatIndex ?? null, isFinale: !!q.isFinale,
        ready: (q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots).every(s => s.filledBy),
        approaches: q.approaches ?? null, chosenApproach: q.chosenApproach ?? null,
        rewardEnvelope: game.questReward(q.id),
        odds: o,
        cast: game.questCast(q.id),
        lapsesAtCycle: q.createdCycle + QUEST_TTL,
        slots: q.slots.map((s, i) => ({
          idx: i, groupId: s.groupId ?? null,
          requirement: s.requirement.kind === 'must-be'
            ? `must be ${game.card(s.requirement.cardId)?.name ?? '?'}`
            : s.requirement.kind === 'must-have' ? `needs ${s.requirement.concept}${s.requirement.minRank ? ` (${s.requirement.minRank}+)` : ''}` : null,
          test: { ...s.test, bar: slotThreshold(s.test) },
          filledBy: s.filledBy ? game.card(s.filledBy)!.name : null, filledId: s.filledBy,
          filledExplain: s.filledBy ? explainCoins(game.card(s.filledBy)!, s.test) : null,
          filledCoins: s.filledBy ? coins(game.card(s.filledBy)!, s.test) : null,
          fits: game.roster().filter(m => m.location.kind === 'held')
            .map(m => ({ id: m.id, name: m.name, coins: coins(m, s.test), explain: explainCoins(m, s.test) }))
            .sort((a, b) => b.coins - a.coins),
        })),
        createdCycle: q.createdCycle,
      };
    }),
    chains: st.chains.map(c => ({
      id: c.id, title: c.bible.title, state: c.state, kind: c.kind, personal: c.isPersonal,
      focal: game.card(c.focalId)?.name ?? '?', beat: c.beatIndex, expectedBeats: c.expectedBeats,
      bank: Math.round(c.bank), payoff: Math.round(c.payoff),
      effort: c.cyclesSpent, effortTarget: c.expectedBeats * 1.5,
      failures: c.failures, failureBudget: c.failureBudget,
      situation: c.story.currentSituation, known: c.story.knownToPlayer, threads: c.story.openThreads,
      cast: c.bible.cast, goal: c.bible.goal,
    })),
    lore: Object.values(st.lore.nodes).map(n => ({
      id: n.id, name: n.name, kind: n.kind, blurb: n.blurb, active: n.active,
      dossier: game.dossier(n.id),
      // FORT §5 / LORE §5: the FULL history (inactive edges included) is the Chronicle room's
      // exposure; without it the Library shows living memory only
      chronicle: game.menuGates().find(m => m.key === 'chronicle')?.open
        ? game.chronicle(n.id).map(e => ({ type: e.type, blurb: e.blurb, active: e.active, core: e.core }))
        : game.chronicle(n.id).filter(e => e.active).map(e => ({ type: e.type, blurb: e.blurb, active: e.active, core: e.core })),
    })),
    log: st.log.slice(-40),
    ai: game.ai.usage(),
    aiName: game.ai.name,
    aiLog: game.ai.callLog().slice(-40).reverse(),
    // best free fills per comfort room (server-computed, fillScore-ranked)
    roomFits: Object.fromEntries(st.fort.rooms
      .filter(r => ROOM_TYPE[r.type]!.species === 'comfort' || ROOM_TYPE[r.type]!.species === 'capacity')
      .map(r => {
        const wants = game.effectiveWants(r);
        const isBreak = ROOM_TYPE[r.type]!.benefit === 'break';
        const isCell = ROOM_TYPE[r.type]!.species === 'capacity';
        const cands = st.cards.filter(card => {
          if (card.location.kind !== 'held' || (card.location.state !== 'inventory' && card.location.state !== 'roster')) return false;
          if (isBreak || isCell) return card.character?.role === 'captive' && (isCell || !hasTag(card.tags, 'obedient'));
          return cardType(card) === 'relic' || (card.character?.role === 'captive' && hasTag(card.tags, 'obedient'));
        });
        return [r.id, cands
          .map(c => ({ id: c.id, name: c.name, fit: Math.round(fillScore(c.tags, wants) * 100) / 100 }))
          .sort((a, b) => b.fit - a.fit).slice(0, 8)];
      })),
  };
}

const app = Fastify();

// This is the API, not the game. Opening the API port in a browser is the obvious mistake to
// make — the startup log prints this URL — so send people to the UI instead of a bare 404.
const WEB = `http://localhost:${process.env.WEB_PORT ?? 5273}`;
app.get('/', async (_req, reply) => reply.redirect(WEB));

app.get('/api/state', async () => stateView());

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
  let result: { ok: boolean; msg: string; questId?: string; jobId?: string };
  switch (type) {
    case 'build': result = game.build(s(a[0]), a[1] ? s(a[1]) : undefined); break;
    case 'upgrade': result = game.upgrade(s(a[0])); break;
    case 'renovate': result = await game.renovate(s(a[0]), s(a[1])); break;
    case 'excavate': result = game.excavate(); break;
    case 'gh': result = game.ghUpgrade(); break;
    case 'slot': result = game.slot(s(a[0]), n(a[1]), s(a[2])); break;
    case 'unslot': result = game.unslot(s(a[0]), n(a[1])); break;
    // TEMPO P1: pursuit is QUEUED — this POST returns in milliseconds instead of after a 10-66s
    // call, and the card arrives on the board later, outside any action.
    case 'pursue': result = game.enqueuePursue(s(a[0])); break;
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
    case 'autoall': result = game.autoAssignAll(); break;
    case 'unassign': result = game.unassign(s(a[0]), n(a[1])); break;
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
      } catch (e) {
        lastReport = ['⚠ The reckoning broke off — this cycle could not be resolved.',
          `(${(e as Error).message?.slice(0, 160)})`];
        throw e;
      }
      result = { ok: true, msg: `cycle ${game.state.cycle} resolved` };
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
