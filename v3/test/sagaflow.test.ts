// The v4 saga flow (src/game/sagaflow.ts) played end to end against a fake host on a real game world, with the mock's
// floor as the writer: N 2–6, personal and not, every lab path — a failure re-posed, a last chance — to the finale. Each
// on PIPE_ARM (grafts, a host that names no pipe arm) and on R5's, which every saga dealt before grafts shipped still plays.
import { describe, it, expect } from 'vitest';
import { seedIdCounter } from '../src/engine/cards.js';
import { LAB_MIN_N, type LabPath } from '../src/engine/lab.js';
import { coins } from '../src/engine/roll.js';
import { clampHurt, WAY_TESTS, PIPE_ARM } from '../src/engine/saga.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, playSaga, hostFor } from './sagaharness.js';

const PATHS: LabPath[] = ['clean', 'bumpy', 'failing', 'lastchance'];

describe('saga flow — every path to the finale', () => {
  for (const r5 of [false, true]) for (const personal of [false, true]) for (let N = 2; N <= 6; N++) for (const path of personal ? [...PATHS, 'personal' as const] : PATHS) {
    if (N < LAB_MIN_N[path]) continue;
    it(`${r5 ? 'R5 pipeline · ' : ''}${personal ? 'personal' : 'hired'} N=${N} ${path}`, async () => {
      seedIdCounter(1);
      const { g, ai } = newGame(100 + N * 10 + PATHS.indexOf(path as LabPath) + (personal ? 5 : 0));
      const { chain, focal } = sagaChain(g, { N, personal });
      const p = await playSaga(g, chain, path, focal, undefined, r5 ? { pipeArm: () => undefined } : {});
      const rec = chain.saga!;
      const plan = rec.plan!;
      expect(rec.world.pipe).toBe(r5 ? undefined : PIPE_ARM);
      expect(rec.fallback).toBe(false);
      expect(plan.episodes).toHaveLength(N - 1);
      // the calls: one plan; an outline only on R5's pipeline with 2+ jobs before the finale (the build's road is the
      // plan's own whys); a card and a report per attempt
      const n = (t: string) => ai.calls.filter(c => c.template === t).length;
      expect(n('plan')).toBe(1);
      expect(n('outline')).toBe(r5 && N - 1 >= 2 ? 1 : 0);
      expect(n('card')).toBe(p.cards.length);
      expect(n('report')).toBe(p.reports.length);
      expect(ai.calls.find(c => c.template === 'plan')!.tier).toBe('plan');
      expect(ai.calls.filter(c => c.template !== 'plan').every(c => c.tier === 'writer')).toBe(true);
      // every card has prose and a log; card 1's log has no For line and no Open question, every later card has both
      for (const [i, c] of p.cards.entries()) {
        expect(c.prose.split(/\s+/).length).toBeGreaterThan(5);
        expect(c.out.logFirst).toBe(true);
        expect(c.log.some(l => l.startsWith('For: '))).toBe(i > 0);
        expect(c.log.some(l => l.startsWith('Open question: '))).toBe(i > 0);
        if (N - 1 >= 2) expect(c.log).toContain('Road ahead:');
        else expect(c.log).not.toContain('Road ahead:');
        // a re-posed job says so on its own row (a saga with one job before the finale has no road)
        if (N - 1 >= 2 && !c.pos.finale && c.pos.attempt > 1) expect(c.log.some(l => /^ {2}▶ .* \(again\)$/.test(l))).toBe(true);
      }
      // the saga ends on its finale, with the plans
      const last = p.cards[p.cards.length - 1]!;
      expect(last.pos.finale).toBe(true);
      expect(last.out.options?.map(o => o.way)).toEqual(personal ? ['talk', 'fight', 'sneak'] : flow.approaches(rec).map(a => a.way));
      expect(p.reports.length).toBe(p.cards.length);
      expect(rec.lines).toHaveLength(p.reports.length);
      // a failed job is re-posed (the same job, the next try) until the setbacks run out
      for (const [i, r] of p.reports.entries()) {
        const next = p.cards[i + 1];
        if (!next || r.pos.finale) continue;
        if (r.outcome === 'failure' && !next.pos.finale) expect(next.pos).toEqual({ job: r.pos.job, finale: false, attempt: r.pos.attempt + 1 });
        if (r.outcome !== 'failure' && !next.pos.finale) expect(next.pos).toEqual({ job: r.pos.job + 1, finale: false, attempt: 1 });
      }
      // the last chance: the setbacks spent before every job was won
      const failures = p.reports.filter(r => !r.pos.finale && r.outcome === 'failure').length;
      expect(rec.lastchance).toBe(failures >= chain.failureBudget);
      if (rec.lastchance) expect(ai.calls.filter(c => c.template === 'card').pop()!.flags).toContain('lastchance');
      // the 📖 line: the saga's title, its status, the summary
      for (const r of p.reports) expect(r.book.startsWith(`📖 ${plan.title}: `)).toBe(true);
      expect(p.reports[p.reports.length - 1]!.book).toMatch(/: (it is settled|it slips away, for now)\. /);
      // the finale report carries the answer; a failed middle job carries no result, no decides
      const reports = ai.calls.filter(c => c.template === 'report');
      expect((reports[reports.length - 1]!.payload.answer as { secret: string }).secret).toBe(plan.answer);
      for (const [i, r] of p.reports.entries()) if (!r.pos.finale && r.outcome === 'failure') {
        expect(reports[i]!.payload.result).toBeUndefined();
        expect(reports[i]!.payload.decides).toBeUndefined();
      }
      // the record is JSON-safe, and the views read it without writing it
      expect(JSON.parse(JSON.stringify(rec))).toEqual(rec);
      const before = JSON.stringify(rec);
      const c1 = flow.chronicle(chain)!, c2 = flow.chronicle(chain)!;
      expect(c2).toEqual(c1);
      expect(JSON.stringify(rec)).toBe(before);
      expect(c1.state).toBe(p.reports[p.reports.length - 1]!.outcome === 'failure' ? 'slipped' : 'done');
      expect(c1.answer).toBe(plan.answer);
      expect(c1.rows.some(r => r.kind === 'open')).toBe(false);
      expect(c1.card1).toBe(p.cards[0]!.prose);
      expect(flow.chronicleText(c1)[0]).toBe(`═══ ${plan.title} ═══ (${c1.state})`);
    });
  }
});

describe('saga flow — pieces', () => {
  it('a card on offer comes back verbatim, and the views never move Knowing', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(77);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    const host = hostFor(g);
    flow.deal(host, chain, undefined, focal);
    // mid-saga: no answer, the open question still shown
    await flow.plan(host, chain);
    const a = await flow.card(host, chain);
    const k = JSON.stringify(chain.saga!.knowing);
    const b = await flow.card(host, chain);
    expect(b).toEqual(a);
    expect(ai.calls.filter(c => c.template === 'card')).toHaveLength(1);
    expect(JSON.stringify(chain.saga!.knowing)).toBe(k);
    const c = flow.chronicle(chain)!;
    expect(c.state).toBe('active');
    expect(c.answer).toBeUndefined();
    expect(c.rows.some(r => r.kind === 'open')).toBe(true);
    expect(JSON.stringify(chain.saga!.knowing)).toBe(k);
  });

  it('D1: asks come from the job type, option i % 2; a personal saga pins its soldier to slot 0 when they are in the job', () => {
    const a = flow.asks('sneak', 3, false, false);
    expect(a.map(x => x.attribute)).toEqual(['DEX', 'DEX', 'DEX']);
    expect(a[0]!.favored).toEqual(['roguery', 'nature']);
    expect(a[1]!.favored).toEqual(['roguery', 'ranged']);
    expect(a[2]!.favored).toEqual(['roguery', 'nature']);
    expect(a.some(x => x.mustBeFocal)).toBe(false);
    const p = flow.asks('talk', 2, true, true);
    expect(p[0]!.mustBeFocal).toBe(true);
    expect(p[1]!.mustBeFocal).toBeUndefined();
    expect(flow.asks('talk', 2, true, false).some(x => x.mustBeFocal)).toBe(false);
    // the showdown's asks are its ways' tests
    expect(flow.asks('showdown', 3, false, false, ['recruit', 'captive', 'gold']).map(x => x.attribute)).toEqual(['CHA', 'STR', 'INT']);
  });

  it('D2: the finale\'s groups carry the way, its reward kind and its test (personal: talk→recruit, fight→captive, sneak→gold)', async () => {
    seedIdCounter(1);
    for (const personal of [false, true]) {
      const { g } = newGame(31);
      const { chain, focal } = sagaChain(g, { N: 3, personal, kind: 'recruit' });
      const host = hostFor(g);
      flow.deal(host, chain, undefined, focal);
      await flow.plan(host, chain);
      const ap = flow.approaches(chain.saga!);
      expect(ap.map(x => x.id)).toEqual(['g0', 'g1', 'g2']);
      if (personal) expect(ap.map(x => [x.way, x.rewardKind])).toEqual([['talk', 'recruit'], ['fight', 'captive'], ['sneak', 'gold']]);
      else {
        expect(ap[0]!.way).toBe('recruit');
        for (const x of ap) expect(x.rewardKind).toBe(x.way);
      }
      for (const x of ap) { expect(x.test).toEqual(WAY_TESTS[x.way]); expect(x.label.length).toBeGreaterThan(5) }
    }
  });

  it('D3: a success never wounds; a partial wounds at most lightly; a failure as rolled', () => {
    const h = [{ name: 'A', how: 'badly' as const }, { name: 'B', how: 'gravely' as const }];
    expect(clampHurt('success', h)).toEqual([]);
    expect(clampHurt('partial', h).map(x => x.how)).toEqual(['lightly', 'lightly']);
    expect(clampHurt('failure', h)).toEqual(h);
  });

  it('D5: whose deed decides is the most coins, the lowest the fewest, ties in slot order, no rng', () => {
    seedIdCounter(1);
    const { g } = newGame(5);
    const party = g.roster().slice(0, 2);
    const t = { attributes: ['str' as const], favored: [], clashing: [], difficulty: 'standard' as const, level: 2 };
    const c = party.map(m => coins(m, t));
    const r = flow.decidesOf(party, [t, t]);
    const hi = c[1]! > c[0]! ? 1 : 0, lo = c[1]! < c[0]! ? 1 : 0;
    expect(r.decides).toBe(party[hi]!.name);
    expect(r.lowest).toBe(party[lo]!.name);
    const same = flow.decidesOf([party[0]!, party[0]!], [t, t]);
    expect(same).toEqual({ decides: party[0]!.name, lowest: party[0]!.name });
  });

  it('D14: the stall guard brings the last chance too', async () => {
    seedIdCounter(1);
    const { g } = newGame(12);
    const { chain, focal } = sagaChain(g, { N: 5, personal: false });
    const host = hostFor(g);
    flow.deal(host, chain, undefined, focal);
    await flow.plan(host, chain);
    const out = await flow.card(host, chain);
    chain.cyclesSpent = chain.expectedBeats * 3;   // the merc-cycles the stall guard counts
    chain.beatIndex = 1;
    flow.afterReport(host, chain, out.pos, { outcome: 'success', party: g.roster().slice(0, 2), hurt: [] }, { before: 'b', after: 'a', summary: 's' });
    expect(chain.saga!.lastchance).toBe(true);
    expect(flow.posOf(chain.saga!).finale).toBe(true);
    const fin = await flow.card(host, chain);
    expect(fin.pos.finale).toBe(true);
    // the jobs never reached drop off the road; the won one keeps its tick
    const road = fin.rows.filter(r => r.kind === 'roadrow');
    expect(road.map(r => r.mark)).toEqual(['✓', '▶']);
  });

  it('D22: the direction rides in the payload, guidance then what to keep out', () => {
    expect(flow.directionText({ guidance: 'Grim and low.', avoid: ['children in peril', 'gore'] })).toBe('Grim and low. Keep out: children in peril; gore.');
    expect(flow.directionText({ guidance: '', avoid: [] })).toBeUndefined();
    expect(flow.directionText(null)).toBeUndefined();
  });
});
