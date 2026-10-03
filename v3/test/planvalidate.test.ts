// The plan's validation (src/ai/storyteller.ts validatePlan, STORYTELLER §2.7): every mechanical repair, every hard
// defect (one plain re-draw, then the floor), and the floor's own plan validating clean for every shape of saga.
import { describe, it, expect } from 'vitest';
import { seedIdCounter } from '../src/engine/cards.js';
import type { SagaWorld } from '../src/engine/saga.js';
import { validatePlan, mockPlan, planSaga, type PlanCtx } from '../src/ai/storyteller.js';
import type { AiProvider, SagaCall } from '../src/ai/provider.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, hostFor } from './sagaharness.js';

const world = (o: Partial<SagaWorld> = {}): SagaWorld => ({
  personal: false, N: 3, kind: 'captive', shape: 'heist', focalId: 'c9',
  cast: [
    { id: 'p1', name: 'Mira Fairweather', sex: 'female', race: 'human', seat: 'client', focal: false, part: 'was wronged', known: true },
    { id: 'c9', name: 'Rautio Greypelt', sex: 'male', race: 'wolfman', seat: 'opponent', focal: true, part: 'stands in the way', trade: 'hunter', traits: 'thin, slow-witted', known: false },
  ],
  stake: 'a livelihood', places: ['Ashbrook', 'Coldwell', 'Dunmere'], land: 'the Western Forests, old-growth elven forests west of the fort',
  seed: { id: 'th-x', text: 'a bell taken from a chapel' }, tone: 'tense', region: 'western-forests', level: 2, ...o,
});
const ctx = (o: Partial<SagaWorld> = {}): PlanCtx => ({ w: world(o) });
const raw = (): Record<string, any> => ({
  title: 'The Stolen Bell', question: 'Nobody knows why the hunter took the bell.', answer: 'The hunter hid the bell so the bandits could not ring their signal.',
  cast: [{ id: 'p1', label: 'a human miller' }, { id: 'c9', label: 'a wolfkin hunter' }],
  asker: { want: 'get the chapel bell back' },
  episodes: [
    { type: 'find', title: 'The Trail', job: 'Track the hunter through Ashbrook.', why: 'Mira hopes to learn where the bell went.', people: ['c9'], trouble: { who: 'the hunter', carry: 'a bow', will: 'shoot from cover' }, win: 'The hunter is found at his camp.', gain: 'a map of the woods', learn: 'Bandits camp in the hills.' },
    { type: 'talk', title: 'The Woodmen', job: 'Win the woodmen of Coldwell over.', why: 'Mira can then walk the woods safely.', people: [], trouble: { who: 'the woodmen', carry: 'axes', will: 'turn the company away' }, win: 'The woodmen take the company\'s side.', gain: 'the woodmen as allies', learn: 'The bandits ring a bell to gather.' },
  ],
  showdown: { title: 'The Bell Tower', job: 'Face the hunter at Dunmere.', people: ['c9'], trouble: { who: 'the hunter', carry: 'a spear', will: 'hold the tower' }, edge: ['the map shows the back way', 'the woodmen guard the road'], settles: 'Mira rings the bell in the chapel again.', lose: 'her chapel bell' },
  options: [{ way: 'captive', label: 'Take the hunter to the fort in chains' }, { way: 'recruit', label: 'Offer the hunter a place' }, { way: 'gold', label: 'Take his hoard and let him go' }],
});
const ok = (r: unknown, c = ctx()) => { const v = validatePlan(r, c); expect(v.defects).toEqual([]); return v };

describe('validatePlan — a clean plan', () => {
  it('passes untouched', () => {
    const v = ok(raw());
    expect(v.repairs).toEqual([]);
    expect(v.plan!.cast.map(c => c.label)).toEqual(['a human miller', 'a wolfkin hunter']);
    expect(v.plan!.cast[0]!.want).toBe('get the chapel bell back');
    expect(v.plan!.episodes.map(e => e.type)).toEqual(['find', 'talk']);
    expect(v.plan!.showdown.why).toBe('');
  });
});

describe('validatePlan — the cast is the deal\'s (audit #33: the AI never names a person)', () => {
  it('a plan that renames someone or coins a new person keeps the dealt people, by the engine\'s names', () => {
    const r = raw();
    r.cast = [{ id: 'p1', label: 'a human miller', name: 'Zanzibar McInvented' }, { id: 'zz', label: 'a fraud', name: 'Lord Fakename III' }, { id: 'c9', label: 'a wolfkin hunter' }];
    const v = ok(r);
    expect(v.plan!.cast.map(c => [c.id, c.name])).toEqual([['p1', 'Mira Fairweather'], ['c9', 'Rautio Greypelt']]);
    expect(JSON.stringify(v.plan)).not.toMatch(/Zanzibar|Fakename/);
  });
});

describe('validatePlan — the repairs (mechanical, silent)', () => {
  const repaired = (mut: (r: Record<string, any>) => void, note: RegExp, c = ctx()) => {
    const r = raw(); mut(r);
    const v = ok(r, c);
    expect(v.repairs.join(' | ')).toMatch(note);
    return v.plan!;
  };
  it('a name inside a label goes', () => expect(repaired(r => { r.cast[1].label = 'Rautio, a wolfkin hunter' }, /name stripped from c9/).cast[1]!.label).toBe('a wolfkin hunter'));
  it('a dealt trait in a label goes', () => expect(repaired(r => { r.cast[1].label = 'a thin wolfkin hunter' }, /trait stripped from c9/).cast[1]!.label).toBe('a wolfkin hunter'));
  it('a missing label is the engine\'s race and trade', () => expect(repaired(r => { r.cast[1].label = '' }, /canned label for c9/).cast[1]!.label).toBe('a wolfkin hunter'));
  it('race and trade come back comma-joined: the race leads the trade', () => expect(repaired(r => { r.cast[1].label = 'wolfkin, hunter' }, /race joined to c9/).cast[1]!.label).toBe('wolfkin hunter'));
  it('a long label is cut at its clause', () => expect(repaired(r => { r.cast[0].label = 'a miller who keeps every account in a battered book' }, /long label cut for p1/).cast[0]!.label).toBe('a miller'));
  it('a cut that leaves a lone trait word is the engine\'s race and trade', () => expect(repaired(r => { r.cast[1].label = 'scrawny, sly wolfkin hunter' }, /long label cut for c9/).cast[1]!.label).toBe('a wolfkin hunter'));
  it('a label stands mid-sentence: its capital goes', () => expect(repaired(r => { r.cast[0].label = 'Grey-haired miller' }, /label lowercased for p1/).cast[0]!.label).toBe('grey-haired miller'));
  it('a want that restates its subject loses it; a "to" and a sentence capital go', () => {
    expect(repaired(r => { r.asker.want = 'Mira wants the bell back' }, /subject cut from p1's want/).cast[0]!.want).toBe('the bell back');
    const r = raw(); r.asker.want = 'To Get the bell back';
    expect(ok(r).plan!.cast[0]!.want).toBe('get the bell back');
  });
  it('unknown ids leave a job\'s people', () => expect(repaired(r => { r.episodes[0].people = ['c9', 'zz'] }, /unknown ids dropped from episode 1/).episodes[0]!.people).toEqual(['c9']));
  it('a personal saga\'s soldier is in every job', () => {
    const c = ctx({ personal: true, cast: [
      { id: 'c3', name: 'Jervaise Greyfell', sex: 'female', race: 'human', seat: 'soldier', focal: true, part: "one of the company's soldiers", trade: 'cook', known: true },
      { id: 'p1', name: 'Jofstrom', sex: 'male', race: 'wolfman', seat: 'opponent', focal: false, part: 'stands in the way', trade: 'slaver', known: false },
    ], focalId: 'c3' });
    const r = raw(); delete r.asker; r.soldier = { want: 'free her brother', past: 'left her brother bound' };
    r.cast = [{ id: 'p1', label: 'a wolfkin slaver' }]; r.episodes[0].people = ['p1']; r.showdown.people = ['p1'];
    r.options = [{ way: 'talk', label: 'Talk the slaver round' }, { way: 'force', label: 'Fight the slaver' }, { way: 'stealth', label: 'Slip past the slaver' }];
    const v = ok(r, c);
    expect(v.repairs).toContain('soldier added to episode 1');
    expect(v.plan!.episodes.every(e => e.people[0] === 'c3')).toBe(true);
    // the personal ways come back by the words the plan was given
    expect(v.plan!.options.map(o => o.way)).toEqual(['talk', 'fight', 'sneak']);
    expect(v.plan!.cast[0]!.past).toBe('left her brother bound');
    expect(v.plan!.cast[0]!.label).toBe('a human soldier');
  });
  it('extra episodes are cut', () => expect(repaired(r => { r.episodes.push({ ...r.episodes[1] }) }, /1 extra episode\(s\) cut/).episodes).toHaveLength(2));
  it('a type not on the list becomes the first unused one', () => expect(repaired(r => { r.episodes[1].type = 'parley' }, /episode 2: type "parley" → fight/).episodes[1]!.type).toBe('fight'));
  it('a bare stake word as the loss becomes its concrete form', () => expect(repaired(r => { r.showdown.lose = 'a livelihood' }, /bare stake word in lose/).showdown.lose).toBe('her livelihood'));
  it('a way-like lead word on an option goes', () => expect(repaired(r => { r.options[0].label = 'Bind: take the hunter to the fort in chains' }, /lead word cut/).options[0]!.label).toBe('Take the hunter to the fort in chains'));
  it('a way and label written the wrong way round are swapped back', () => expect(repaired(r => { r.options[1] = { way: 'Offer the hunter a place', label: 'recruit' } }, /option way and label swapped \(recruit\)/).options[1]!.label).toBe('Offer the hunter a place'));
  it('a missing option label is canned', () => expect(repaired(r => { r.options.pop() }, /canned option label for gold/).options[2]!.label).toBe('Take what the wolfkin hunter hoards and let him go'));
  it('a cast id in prose becomes the person (name once known, else the label)', () => {
    const p = repaired(r => { r.episodes[0].job = 'Track c9 through Ashbrook.'; r.episodes[0].why = 'p1 hopes to learn where the bell went.' }, /id c9 in episode 1/);
    expect(p.episodes[0]!.job).toBe('Track the wolfkin hunter through Ashbrook.');
    expect(p.episodes[0]!.why).toBe('Mira Fairweather hopes to learn where the bell went.');
  });
  it('the prompt\'s word for the one the company acts for becomes that person', () => expect(repaired(r => { r.episodes[1].why = 'The asker can then walk the woods.' }, /role word in episode 2/).episodes[1]!.why).toBe('Mira Fairweather can then walk the woods.'));
  it('an unmet name goes back to its label', () => expect(repaired(r => { r.episodes[0].job = 'Track Rautio through Ashbrook.' }, /unmet name Rautio → label/).episodes[0]!.job).toBe('Track a wolfkin hunter through Ashbrook.'));
  it('extra edges are cut; an edge naming its job goes to that job', () => {
    const p = repaired(r => { r.showdown.edge = [{ job: 2, helps: 'the woodmen guard the road' }, 'the map shows the back way', 'one too many'] }, /1 extra edge\(s\) cut/);
    expect(p.showdown.edge).toEqual(['the map shows the back way', 'the woodmen guard the road']);
  });
});

describe('validatePlan — the hard defects (one plain re-draw, then the floor)', () => {
  const broken = (mut: (r: Record<string, any>) => void, defect: RegExp, c = ctx()) => {
    const r = raw(); mut(r);
    expect(validatePlan(r, c).defects.join(' | ')).toMatch(defect);
  };
  it('not a plan', () => expect(validatePlan('nope', ctx()).defects).toEqual(['not a plan object']));
  it('no want', () => broken(r => { delete r.asker }, /missing want for p1/));
  it('too few jobs', () => broken(r => { r.episodes.pop() }, /1 episodes, need 2/));
  it('a job with no trouble', () => broken(r => { r.episodes[0].trouble = {} }, /missing trouble in episode 1/));
  for (const k of ['title', 'job', 'win', 'gain', 'learn', 'why']) it(`a job with no ${k}`, () => broken(r => { delete r.episodes[1][k] }, new RegExp(`missing episode 2 ${k}`)));
  it('no showdown', () => broken(r => { delete r.showdown }, /missing showdown/));
  it('no settles, no lose', () => { broken(r => { delete r.showdown.settles }, /missing settles/); broken(r => { delete r.showdown.lose }, /missing lose/) });
  it('a held thing with no edge', () => broken(r => { r.showdown.edge = ['the map shows the back way'] }, /missing edge for episode 2/));
  it('a personal saga with no past', () => broken(r => { delete r.asker; r.soldier = { want: 'free him' } }, /missing soldier past/, ctx({ personal: true, focalId: 'c3', cast: [
    { id: 'c3', name: 'Jervaise', sex: 'female', race: 'human', seat: 'soldier', focal: true, part: "one of the company's soldiers", known: true },
    { id: 'p1', name: 'Jofstrom', sex: 'male', race: 'wolfman', seat: 'opponent', focal: false, part: 'stands in the way', trade: 'slaver', known: false },
  ] })));
});

describe('planSaga — at most two calls, then the floor', () => {
  it('a defect earns one re-draw; a second defect brings the floor (logged)', async () => {
    const calls: SagaCall[] = [];
    const bad = { async sagaCall(c: SagaCall) { calls.push(c); return { title: 'Half a plan' } } } as unknown as AiProvider;
    const dev: string[] = [];
    const r = await planSaga(bad, ctx(), 'chain-x', (_k, t) => dev.push(t));
    expect(calls).toHaveLength(2);
    expect(calls.every(c => c.tier === 'plan' && c.effort === 'medium')).toBe(true);
    expect(r.fallback).toBe(true);
    expect(dev.some(d => d.startsWith('plan-fallback'))).toBe(true);
    expect(r.plan.episodes).toHaveLength(2);
  });
  it('a thrown call counts as a failed draw', async () => {
    let n = 0;
    const flaky = { async sagaCall() { if (n++ === 0) throw new Error('timeout'); return raw() } } as unknown as AiProvider;
    const r = await planSaga(flaky, ctx(), 'chain-x');
    expect(r.fallback).toBe(false);
    expect(r.plan.title).toBe('The Stolen Bell');
  });
});

describe('the floor\'s plan validates clean: N 2–6 × personal × kind', () => {
  for (let N = 2; N <= 6; N++) for (const personal of [false, true]) for (const kind of ['recruit', 'captive', 'gold-hoard'] as const) it(`N=${N} ${personal ? 'personal' : 'hired'} ${kind}`, () => {
    seedIdCounter(1);
    const { g } = newGame(50 + N);
    const { chain, focal } = sagaChain(g, { N, personal, kind });
    const rec = flow.deal(hostFor(g), chain, undefined, focal);
    const v = validatePlan(mockPlan({ w: rec.world }, chain.id), { w: rec.world });
    expect(v.defects).toEqual([]);
    expect(v.plan!.episodes).toHaveLength(N - 1);
    expect(v.plan!.options).toHaveLength(3);
    expect(v.repairs.filter(x => !x.startsWith('soldier added'))).toEqual([]);
  });
});
