// GOLDEN PARITY with the saga lab at tag `storyteller-build-src` (R5, the measured storyteller): the game's port must
// send the SAME prompts and payloads, and print the SAME quest logs and chronicle, byte for byte, as the lab did.
//
// The fixtures (test/fixtures/saga-r5/*.json) were made by replaying the lab's own probe code at the tag over its
// recorded runs — runs/probe7/L_lean_sonnet (the Sonnet-written sagas the R5 report judged; the replay reproduced every
// recorded system prompt and user message with 0 mismatches) and the mock floor (probe7/mock-L_lean). Each holds the
// dealt world, every raw model reply, and what the lab built from them: every payload, flag set, rendered system prompt,
// quest log, ON THIS MATTER line, report payload, the 📖 line, `latest`, and the final chain.md.
//
// Two drives over each fixture:
//   A — the ported pure functions (src/ai/storyteller.ts), driven in the probe's own order;
//   B — the game's saga flow (src/game/sagaflow.ts) against a fake host whose provider replays the recorded replies and
//       asserts each call's rendered system prompt and user message as it arrives.
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Card } from '../src/engine/cards.js';
import type { Chain } from '../src/engine/chains.js';
import { bankBeat } from '../src/engine/chains.js';
import type { SagaWorld, SagaPlan, SagaState, Hurt, Cost, Way } from '../src/engine/saga.js';
import type { Outcome } from '../src/engine/roll.js';
import { renderSaga, type SagaTemplate } from '../src/ai/prompts/saga/render.js';
import {
  planPayload, validatePlan, planLint, newKnowing, newState, outlinePayload, roadLines, roadHopes, mockOutline, outlineLint,
  firstCardPayload, laterCardPayload, jobWhy, questLog, logLines, noteDelivered, forLineShown, onThisMatter, matterLine,
  reportPayload, bank, triedLine, buttonLine, type Knowing,
} from '../src/ai/storyteller.js';
import * as flow from '../src/game/sagaflow.js';
import type { AiProvider, SagaCall } from '../src/ai/provider.js';
import type { GameState } from '../src/game/game.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/saga-r5');
interface Call { flags: string[]; vars: Record<string, number>; payload: Record<string, unknown>; system: string; raw: unknown[] }
interface Attempt {
  kk: number; finale: boolean; jobN: number; tryOnJob: number;
  card: Call & { text: string; log: string[]; matter: string[]; header: string; buttons?: string[] };
  knowingAfterCard: { met: string[]; named: string[]; seen: string[] };
  outcome: Outcome; party: Card[]; decides: string; lowest: string; hurt: Hurt[]; cost?: Cost; gravity: string;
  option?: { way: Way; label: string }; fate?: string;
  report: Call & { out: { before: string; after: string; summary: string }; md: string };
  tried: string; status: string; knowingAfterReport: { met: string[]; named: string[]; seen: string[] };
  banked: SagaState; failures: number; lastchance: boolean; latestAfter: string;
}
interface Gold {
  id: string;
  world: Omit<SagaWorld, 'seed'> & { seed: { id: string | null; text: string } ; rarity: string };
  plan: { flags: string[]; payload: Record<string, unknown>; system: string; raw: unknown[]; plan: SagaPlan; repairs: string[]; lint: string[] };
  outline?: { payload: Record<string, unknown>; flags: string[]; system: string; raw: unknown[]; written: string[] | null; road: (string | null)[]; hopes: (string | null)[]; lint: string[] };
  attempts: Attempt[];
  end: { endLog: string[]; chain: string; failures: number; budget: number };
}
const FIXTURES = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
const load = (f: string) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Gold;
const worldOf = (g: Gold): SagaWorld => ({
  personal: g.world.personal, N: g.world.N, kind: g.world.kind, shape: g.world.shape, focalId: g.world.focalId,
  cast: g.world.cast, stake: g.world.stake, places: g.world.places, land: g.world.land,
  seed: { id: g.world.seed.id, text: g.world.seed.text }, tone: g.world.tone, region: g.world.region, level: g.world.level,
});
// DELIBERATE DIVERGENCES from the lab's bytes — the engine-line fixes of 2026-10-03 (North Star 0: no prompt, payload
// shape or mechanic changed). The fixtures stay exactly as the lab recorded them; each fix is applied to the expectation
// here, literally, so any other drift still fails:
//   D3 — a failed try whose summary opens on the company keeps that subject in a sentence of its own (never "The company
//        tried to …, but the company …"); a last-chance finale's `latest` is that line, so its card payload follows
//   D6 — the Held row writes each gain mid-list, without the capital the plan gave it (a name or a place keeps its own)
//   D4 — the chronicle's "likely end" becomes how it ended (the finale's Outcome sentence) once the finale is played
//   D5 — So far numbers the finale "finale", not N (a skipped job read "1, 2, 2, 4")
const TRIED_FIX: [string, string][] = [
  ["in Woldcot, but the company found the merchant's yard", "in Woldcot. The company found the merchant's yard"],
  ["in Woldcot, but the company met the merchant's cudgel-and-net guards", "in Woldcot. The company met the merchant's cudgel-and-net guards"],
];
const HELD_FIX: [string, string][] = [
  ['Held: The cart and its crates', 'Held: the cart and its crates'], [', A marked map of the track', ', a marked map of the track'],
  [', Boar hides to pad the crates', ', boar hides to pad the crates'], [', A captured axeman', ', a captured axeman'],
];
const swap = (s: string, pairs: [string, string][]) => pairs.reduce((t, [a, b]) => t.split(a).join(b), s);
/** a tried line, a `latest`, or a payload as JSON, as the game now writes it */
const fixTried = (s: string) => swap(s, TRIED_FIX);
const fixLog = (log: string[]) => log.map(l => l.startsWith('Held: ') ? swap(l, HELD_FIX) : l);
/** the lab's chain.md as the game now prints it */
function fixChain(g: Gold): string {
  const fin = g.attempts.find(a => a.finale)!;
  return fixTried(g.end.chain).split('\n').map(l => l.startsWith('Held: ') ? swap(l, HELD_FIX) : l)
    .map(l => l.replace(/^likely end: .*? · setbacks /, `ending: ${fin.fate} · setbacks `))
    .map(l => l.replace(new RegExp(`^  ${g.world.N} (?=[✓~✗] )`), '  finale '))
    .join('\n');
}
const sets = (k: Knowing) => ({ met: [...k.met].sort(), named: [...k.named].sort(), seen: [...k.seen].sort() });
const sorted = (k: { met: string[]; named: string[]; seen: string[] }) => ({ met: [...k.met].sort(), named: [...k.named].sort(), seen: [...k.seen].sort() });
/** a call as the game would send it, against the lab's */
function sameCall(got: { flags: string[]; vars: Record<string, number>; payload: Record<string, unknown> }, want: Call, template: SagaTemplate) {
  expect(got.flags).toEqual(want.flags);
  expect(got.vars).toEqual(want.vars);
  expect(JSON.stringify(got.payload)).toBe(fixTried(JSON.stringify(want.payload)));
  expect(renderSaga(template, got.flags, got.vars)).toBe(want.system);
}

describe('saga golden parity — the ported text side (A)', () => {
  for (const f of FIXTURES) it(f, () => {
    const g = load(f);
    const w = worldOf(g), N = w.N;
    // the plan
    const pp = planPayload({ w });
    sameCall({ ...pp, vars: {} }, { ...g.plan, vars: {} }, 'plan');
    const v = validatePlan(g.plan.raw[0], { w });
    expect(v.defects).toEqual([]);
    expect(v.repairs).toEqual(g.plan.repairs);
    expect(v.plan).toEqual(g.plan.plan);
    const plan = v.plan!;
    expect(planLint(plan, w)).toEqual(g.plan.lint);
    // the road ahead, beside card 1
    const k = newKnowing(w.cast), state = newState();
    let road: (string | undefined)[] | null = null, hopes: (string | undefined)[] | null = null;
    if (g.outline) {
      const op = outlinePayload(plan, k);
      sameCall({ ...op, vars: {} }, { ...g.outline, vars: {} }, 'outline');
      const got = g.outline.written ?? mockOutline(op.payload).lines;
      road = roadLines(plan, got, k);
      hopes = roadHopes(plan, got, k);
      expect(road.map(x => x ?? null)).toEqual(g.outline.road);
      expect(hopes.map(x => x ?? null)).toEqual(g.outline.hopes);
      expect(outlineLint(g.outline.written, op.payload, plan)).toEqual(g.outline.lint);
    } else expect(plan.episodes.length).toBeLessThan(2);
    // play it, on the lab's own outcomes, parties, wounds and costs
    const done = new Map<number, 'won' | 'lost'>();
    const budget = Math.max(2, Math.ceil(N / 2));
    let latest = '', lastchance = false, failures = 0;
    for (const a of g.attempts) {
      const e = a.finale ? plan.showdown : plan.episodes[a.jobN - 1]!;
      if (a.kk > 1) forLineShown(plan, k);
      const cc = a.kk === 1 ? firstCardPayload(plan, w, k)
        : laterCardPayload(plan, e, latest, k, { finale: a.finale, lastchance, retry: a.tryOnJob > 1, why: jobWhy(plan, a.finale ? N : a.jobN, hopes) });
      sameCall(cc, a.card, 'card');
      const card = a.card.text;
      const log = logLines(questLog(plan, k, state, { lines: road, done, at: a.finale ? N : a.jobN, retry: !a.finale && a.tryOnJob > 1 }, { forLine: a.kk > 1, open: a.kk > 1 }, w.places));
      expect(log).toEqual(fixLog(a.card.log));
      const shown = `${log.join('\n')}\n${card}`;
      noteDelivered(shown, plan, k, false);
      expect(sets(k)).toEqual(sorted(a.knowingAfterCard));
      expect(onThisMatter(plan, shown).map(m => `${m.name} — ${m.label}`)).toEqual(a.card.matter);
      // the report
      const rp = reportPayload({ plan, e, card, party: a.party, decides: a.decides, outcome: a.outcome, finale: a.finale, hurt: a.hurt, cost: a.cost, option: a.option, fate: a.fate, k, gravity: a.gravity, state: { learned: [...state.learned], held: [...state.held] } });
      sameCall(rp, a.report, 'report');
      const rep = a.report.out;
      noteDelivered(`${rep.before} ${rep.after} ${rep.summary}`, plan, k, true);
      expect(sets(k)).toEqual(sorted(a.knowingAfterReport));
      bank(state, e, a.outcome);
      expect(state).toEqual(a.banked);
      const failedJob = !a.finale && a.outcome === 'failure';
      const tried = failedJob ? triedLine(e.job, rep.summary, plan, w) : rep.summary;
      expect(tried).toBe(fixTried(a.tried));
      if (failedJob) { failures++; if (failures >= budget) { lastchance = true; done.set(a.jobN, 'lost') } }
      else if (!a.finale) done.set(a.jobN, 'won');
      expect(lastchance).toBe(a.lastchance);
      latest = !a.finale && a.outcome !== 'failure' && e.win ? e.win : failedJob && !lastchance ? rep.summary : tried;
      if (!a.finale) expect(latest).toBe(fixTried(a.latestAfter));
    }
    const fin = g.attempts.find(a => a.finale)!;
    const endLog = logLines(questLog(plan, k, state, { lines: road, done, finale: fin.outcome === 'failure' ? 'lost' : 'won' }, { forLine: true, open: false }, w.places));
    expect(endLog).toEqual(fixLog(g.end.endLog));
  });
});

/** a provider that replays the recorded replies and checks every call as it arrives */
function replay(g: Gold) {
  const q: Record<string, Call[]> = { plan: [{ ...g.plan, vars: {} }], outline: g.outline ? [{ ...g.outline, vars: {} } as Call] : [], card: g.attempts.map(a => a.card), report: g.attempts.map(a => a.report) };
  // mismatches are collected, never thrown: the flow catches a failed call and falls back to the floor, and on a mock
  // fixture the floor IS the recorded reply, so a throw here would be swallowed silently
  const errors: string[] = [];
  const ai = {
    name: 'replay',
    async sagaCall(c: SagaCall): Promise<unknown> {
      const want = q[c.template]!.shift();
      if (!want) { errors.push(`no recorded ${c.template} call left`); throw new Error('no call left') }
      const sys = renderSaga(c.template, c.flags, c.vars), user = JSON.stringify(c.payload);
      if (sys !== want.system) errors.push(`${c.template} system differs:\n${sys}\n--- want ---\n${want.system}`);
      if (user !== fixTried(JSON.stringify(want.payload))) errors.push(`${c.template} user differs:\n${user}\n--- want ---\n${JSON.stringify(want.payload)}`);
      for (const raw of want.raw) { const p = c.schema.safeParse(raw); if (p.success) return p.data }
      errors.push(`${c.template}: no recorded reply parsed`);
      throw new Error('no reply parsed');
    },
  } as unknown as AiProvider;
  return { ai, q, errors };
}
function chainOf(g: Gold, w: SagaWorld): Chain {
  return {
    id: `chain-${g.id}`, kind: w.kind === 'gold' ? 'gold-hoard' : w.kind, isPersonal: w.personal, focalId: w.focalId, level: w.level,
    rarity: g.world.rarity as Chain['rarity'], region: w.region, expectedBeats: w.N, payoff: 0, bank: 0, cyclesSpent: 0,
    failureBudget: Math.max(2, Math.ceil(w.N / 2)), failures: 0, beatIndex: 0,
    state: 'active', createdCycle: 0, saga: flow.newRecord(w),
  };
}

describe('saga golden parity — the game flow (B)', () => {
  for (const f of FIXTURES) it(f, async () => {
    const g = load(f);
    const w = worldOf(g);
    const chain = chainOf(g, w);
    const { ai, q, errors } = replay(g);
    const dev: string[] = [];
    const host: flow.SagaHost = {
      rng: undefined as never, storyRng: undefined as never, ai, state: { chains: [chain] } as unknown as GameState,
      card: () => undefined, roster: () => [], direction: () => undefined, log: (_k, t) => dev.push(t),
      takenName: () => false, noteNpcName: () => {}, hasRoom: () => true, rosterCapacity: () => 9, captiveCount: () => 0, captiveCapacity: () => 9,
    };
    const plan = await flow.plan(host, chain);
    expect(plan).toEqual(g.plan.plan);
    expect(chain.saga!.fallback).toBe(false);
    for (const a of g.attempts) {
      const out = await flow.card(host, chain);
      expect(errors).toEqual([]);
      expect(out.pos).toEqual({ job: a.finale ? w.N : a.jobN, finale: a.finale, attempt: a.finale ? 1 : a.tryOnJob });
      expect(out.prose).toBe(a.card.text);
      expect(logLines(out.rows)).toEqual(fixLog(a.card.log));
      expect(matterLine(out.matter)).toBe(a.card.matter.length ? `ON THIS MATTER: ${a.card.matter.join(' · ')}` : '');
      expect(sorted(chain.saga!.knowing)).toEqual(sorted(a.knowingAfterCard));
      // the card's header and, on the finale, the PLANS buttons (the likely way chosen), as the lab printed them
      expect(`═══ ${out.title} · ${plan.title} ═══`).toBe(a.card.header);
      if (a.finale) expect(out.options!.map((o, i) => buttonLine(o, i, i === 0, flow.focalHelped(chain.saga!)))).toEqual(a.card.buttons);
      else expect(out.options).toBeUndefined();
      // a re-offer is the same card, and moves nothing
      const again = await flow.card(host, chain);
      expect(again.prose).toBe(out.prose);
      expect(again.rows).toEqual(out.rows);
      const call = flow.reportCall(host, chain, out.pos, out.prose, { party: a.party, decides: a.decides, outcome: a.outcome, hurt: a.hurt, cost: a.cost, option: a.option, fate: a.fate, gravity: a.gravity });
      sameCall(call, a.report, 'report');
      const rep = await flow.writeSagaReport(host, call);
      expect(rep).toEqual(a.report.out);
      bankBeat(chain, a.party.length, a.outcome, 0);   // the host's part (advanceChain), before afterReport
      const after = flow.afterReport(host, chain, out.pos, { outcome: a.outcome, party: a.party, hurt: a.hurt, fate: a.fate }, rep);
      expect(after.status).toBe(a.status);
      expect(after.tried).toBe(fixTried(a.tried));
      expect(after.book).toBe(a.report.md.trimEnd().split('\n').pop());
      expect(chain.saga!.lastchance).toBe(a.lastchance);
      expect(chain.saga!.state).toEqual(a.banked);
      expect(sorted(chain.saga!.knowing)).toEqual(sorted(a.knowingAfterReport));
      if (!a.finale) expect(chain.saga!.latest).toBe(fixTried(a.latestAfter));
    }
    expect(errors).toEqual([]);
    expect(Object.values(q).every(x => x.length === 0)).toBe(true);
    expect(dev.filter(d => /fallback|floor stood in/.test(d))).toEqual([]);
    // the chronicle, as the lab's chain.md printed it
    expect(flow.chronicleText(flow.chronicle(chain)!).join('\n') + '\n').toBe(fixChain(g));
    // the record survives the save
    expect(JSON.parse(JSON.stringify(chain.saga))).toEqual(chain.saga);
  });
});
