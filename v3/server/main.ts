// Thin JSON API over the Game facade — the web GUI's backend.
// One game instance; autosaves to saves/web.json every cycle.
// AIRAIDER_AI=openai for the real AI (default mock). Port 3210.

import Fastify from 'fastify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ROOM_TYPE, buildCost, upgradeCost, renovateCost, ghUpgradeCost, GH_THRESHOLDS, maxSlotsAtTier } from '../src/engine/fort.js';
import { REGION } from '../src/engine/regions.js';
import { renderTags } from '../src/engine/tags.js';
import { cardType, stackKind, isLiability, hasTag } from '../src/engine/cards.js';
import { slotThreshold, coins } from '../src/engine/roll.js';
import { hireCost } from '../src/engine/economy.js';
import { fillScore } from '../src/engine/overlap.js';

const SAVE = path.join(process.cwd(), 'saves', 'web.json');
const useOpenAi = process.env.AIRAIDER_AI === 'openai';
const ai = useOpenAi ? makeOpenAiProvider() : new MockProvider(Number(process.env.AIRAIDER_SEED ?? 42));

let game: Game;
if (fs.existsSync(SAVE) && !process.env.AIRAIDER_FRESH) {
  game = Game.load(ai, fs.readFileSync(SAVE, 'utf8'));
  console.log(`[server] loaded ${SAVE} (cycle ${game.state.cycle})`);
} else {
  game = new Game(ai, Number(process.env.AIRAIDER_SEED ?? 42));
  console.log('[server] fresh game');
}
let lastReport: string[] = [];

function autosave() {
  fs.mkdirSync(path.dirname(SAVE), { recursive: true });
  fs.writeFileSync(SAVE, game.save());
}

function cardView(c: NonNullable<ReturnType<Game['card']>>) {
  return {
    id: c.id, name: c.name, tags: renderTags(c.tags), value: c.value,
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
  const need = GH_THRESHOLDS[st.fort.ghTier + 1] ?? null;
  return {
    cycle: st.cycle, gold: game.gold(), prestige: p, ghTier: st.fort.ghTier, ghNeed: need,
    ghCost: need ? ghUpgradeCost(st.fort.ghTier + 1) : null,
    maxSlots: maxSlotsAtTier(st.fort.ghTier),
    unlockedRegions: st.unlockedRegions,
    rosterCap: game.rosterCapacity(), captiveCap: game.captiveCapacity(),
    lastReport,
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
          renovateCost: rt.species === 'comfort' ? renovateCost(rt) : null,
          slots: r.slots.map(s => s ? cardView(game.card(s)!) : null),
        };
      }),
    },
    buildable: game.buildableTypes().map(b => ({ ...b, name: ROOM_TYPE[b.type]!.name })),
    freeCells: game.freeCells().length,
    roster: game.roster().map(m => ({ ...cardView(m), cap: game.capOf(m.id), dossier: game.dossier(m.id) })),
    captives: game.captives().map(c => ({
      ...cardView(c),
      breaking: st.breaking.find(b => b.cardId === c.id)?.doneAtCycle ?? null,
      interrogated: c.chainIds.includes('interrogated'),
    })),
    relics: game.relics().map(c => cardView(c)),
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
        approaches: q.approaches ?? null, chosenApproach: q.chosenApproach ?? null,
        rewardEnvelope: q.rewardSpecs.map(r => r.kind).join(' + ') || (q.isFinale ? 'the focal character' : 'side loot'),
        odds: o,
        slots: q.slots.map((s, i) => ({
          idx: i, groupId: s.groupId ?? null,
          test: { ...s.test, bar: slotThreshold(s.test) },
          filledBy: s.filledBy ? game.card(s.filledBy)!.name : null, filledId: s.filledBy,
          fits: game.roster().filter(m => m.location.kind === 'held')
            .map(m => ({ id: m.id, name: m.name, coins: coins(m, s.test) }))
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
      chronicle: game.chronicle(n.id).map(e => ({ type: e.type, blurb: e.blurb, active: e.active, core: e.core })),
    })),
    log: st.log.slice(-40),
    ai: game.ai.usage(),
    aiName: game.ai.name,
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

app.get('/api/state', async () => stateView());

// actions run strictly one-at-a-time — concurrent requests (double-clicks) must
// never interleave inside an awaiting action
let actionChain: Promise<unknown> = Promise.resolve();

app.post<{ Body: { type: string; args: (string | number)[] } }>('/api/action', async (req) => {
  const run = actionChain.then(() => handleAction(req.body));
  actionChain = run.catch(() => undefined);
  return run;
});

async function handleAction(body: { type: string; args: (string | number)[] }) {
  const { type, args } = body;
  const a = args ?? [];
  const s = (x: unknown) => String(x);
  const n = (x: unknown) => Number(x);
  let result: { ok: boolean; msg: string; questId?: string };
  switch (type) {
    case 'build': result = game.build(s(a[0]), a[1] ? s(a[1]) : undefined); break;
    case 'upgrade': result = game.upgrade(s(a[0])); break;
    case 'renovate': result = await game.renovate(s(a[0]), s(a[1])); break;
    case 'excavate': result = game.excavate(); break;
    case 'gh': result = game.ghUpgrade(); break;
    case 'slot': result = game.slot(s(a[0]), n(a[1]), s(a[2])); break;
    case 'unslot': result = game.unslot(s(a[0]), n(a[1])); break;
    case 'pursue': result = await game.pursue(s(a[0])); break;
    case 'assign': result = game.assign(s(a[0]), n(a[1]), s(a[2])); break;
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
      lastReport = await game.endCycle();
      result = { ok: true, msg: `cycle ${game.state.cycle} resolved` };
      break;
    }
    default: result = { ok: false, msg: `unknown action ${type}` };
  }
  autosave();
  return result;
}

const port = Number(process.env.PORT ?? 3210);
app.listen({ port, host: '127.0.0.1' }).then(() => {
  console.log(`[server] http://127.0.0.1:${port} · AI: ${ai.name}`);
});
