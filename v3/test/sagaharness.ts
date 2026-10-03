// A fake host for the v4 saga flow (src/game/sagaflow.ts) on a REAL game world — the roster, region, fort and rngs of a
// fresh Game — so a saga can be played end to end before the flow is wired into game.ts (Phase 2 Step 4). The host does
// what advanceChain will do (bankBeat before afterReport); the outcomes follow the saga lab's path rules (engine/lab.ts).
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { Rng } from '../src/engine/rng.js';
import type { Card } from '../src/engine/cards.js';
import { HELD } from '../src/engine/cards.js';
import { bankBeat, type Chain } from '../src/engine/chains.js';
import { materializeReward } from '../src/engine/quests.js';
import { labOutcome, type LabPath } from '../src/engine/lab.js';
import type { SlotTest, Outcome } from '../src/engine/roll.js';
import type { Attribute } from '../src/engine/tags.js';
import type { SagaCall } from '../src/ai/provider.js';
import type { SagaPos } from '../src/engine/saga.js';
import { logLines } from '../src/ai/storyteller.js';
import * as flow from '../src/game/sagaflow.js';

/** the mock, recording every saga call it answers */
export class RecordingMock extends MockProvider {
  calls: SagaCall[] = [];
  override async sagaCall(c: SagaCall): Promise<unknown> { this.calls.push(c); return super.sagaCall(c) }
}

export function hostFor(g: Game, dev: string[] = []): flow.SagaHost {
  return {
    rng: g.rng, storyRng: g.storyRng, ai: g.ai, state: g.state,
    card: id => g.card(id), roster: () => g.roster(),
    direction: () => flow.directionText(g.state.direction),
    log: (_k, t) => dev.push(t),
    takenName: n => g.state.cards.some(c => c.character && c.name === n),
    noteNpcName: () => {},
    hasRoom: t => g.hasRoom(t), rosterCapacity: () => g.rosterCapacity(),
    captiveCount: () => g.captives().length, captiveCapacity: () => g.captiveCapacity(),
  };
}

/** a chain with today's economy fields and a dealt saga: a personal saga is about the first soldier; else a focal is
 *  materialized as the game does (a captive spec at the payoff) */
export function sagaChain(g: Game, o: { N: number; personal: boolean; kind?: Chain['kind']; id?: string }): { chain: Chain; focal: Card } {
  const region = g.activeRegions()[0]!;
  const focal = o.personal ? g.roster()[0]! : materializeReward(new Rng(o.N * 7919 + 13), { kind: 'captive', value: 120 }, 2, region, { maxSkills: 2 })[0]!;
  if (!o.personal) { focal.location = HELD('limbo'); g.state.cards.push(focal) }
  const chain: Chain = {
    id: o.id ?? `ch-${g.state.chains.length + 1}`, kind: o.kind ?? 'captive', isPersonal: o.personal, focalId: focal.id, level: 2, rarity: 'common',
    region, expectedBeats: o.N, payoff: 300, bank: 0, cyclesSpent: 0, failureBudget: Math.max(2, Math.ceil(o.N / 2)), failures: 0, beatIndex: 0,
    state: 'active', createdCycle: g.state.cycle,
  };
  g.state.chains.push(chain);
  return { chain, focal };
}

export interface Played {
  cards: { pos: SagaPos; title: string; prose: string; log: string[]; out: flow.SagaCardOut }[];
  reports: { pos: SagaPos; outcome: Outcome; book: string; rep: { before: string; after: string; summary: string }; inn: flow.ReportIn }[];
}
/** the party the host sends: two soldiers (three at the finale); a personal saga's soldier always goes, in slot 0 */
function partyFor(g: Game, chain: Chain, finale: boolean): Card[] {
  const size = finale ? 3 : 2;
  const roster = g.roster();
  const pool = chain.isPersonal ? [g.card(chain.focalId)!, ...roster.filter(c => c.id !== chain.focalId)] : roster;
  return pool.slice(0, Math.min(size, pool.length));
}
const testOf = (a: { attribute: string; favored: string[]; clashing: string[] }): SlotTest =>
  ({ attributes: [a.attribute.toLowerCase() as Attribute], favored: a.favored, clashing: a.clashing, difficulty: 'standard', level: 2 });

/** play one saga to its finale on a lab path; `beforeCard` may inspect the record before each card */
export async function playSaga(g: Game, chain: Chain, path: LabPath, focal: Card, beforeCard?: (pos: SagaPos) => void, hostExtra: Partial<flow.SagaHost> = {}): Promise<Played> {
  const host = { ...hostFor(g), ...hostExtra };
  flow.deal(host, chain, undefined, focal);
  await flow.plan(host, chain);
  const played: Played = { cards: [], reports: [] };
  let attempt = 0;
  for (let i = 0; i < 30; i++) {
    const rec = chain.saga!;
    beforeCard?.(flow.posOf(rec));
    const out = await flow.card(host, chain);
    played.cards.push({ pos: out.pos, title: out.title, prose: out.prose, log: logLines(out.rows), out });
    const { pos } = out;
    if (!pos.finale) attempt++;
    const outcome = labOutcome(path, { isFinale: pos.finale, job: pos.job, tryOnJob: pos.attempt, attempt });
    const party = partyFor(g, chain, pos.finale);
    const e = pos.finale ? rec.plan!.showdown : rec.plan!.episodes[pos.job - 1]!;
    const ways = pos.finale ? flow.approaches(rec).map(a => a.way) : [];
    const asks = flow.asks(e.type, party.length, chain.isPersonal, !pos.finale && flow.pinsSoldier(rec, pos.job), ways);
    const way = pos.finale ? ways[0] : undefined;
    const tests = pos.finale ? party.map(() => testOf(flow.approaches(rec)[0]!.test)) : party.map((_m, j) => testOf(asks[j % asks.length]!));
    const inn = flow.reportIn(host, chain, pos, out.prose, { outcome, party, tests, gravity: 'a small, everyday job', way, fate: pos.finale ? { fate: outcome === 'success' ? 'clean' : outcome === 'partial' ? 'saddled' : 'slipped', ...(outcome === 'failure' ? { sequelRarity: 'uncommon' as const } : {}) } as never : undefined });
    const rep = await flow.writeSagaReport(host, inn.call);
    bankBeat(chain, party.length, outcome, 0);
    const after = flow.afterReport(host, chain, pos, { outcome, party, hurt: inn.hurt }, rep);
    played.reports.push({ pos, outcome, book: after.book, rep, inn });
    if (pos.finale) { chain.state = outcome === 'failure' ? 'slipped' : 'done'; break }
  }
  return played;
}

export const newGame = (seed: number, ai = new RecordingMock(seed)) => ({ g: new Game(ai, seed), ai });
