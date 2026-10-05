// The recurring personal arc (docs/STORYTELLER.md North Star 0, designer 2026-10-05; STORY_ENGINE §4, §8): the bounded
// LIVING DOSSIER (engine/dossier.ts) refreshed as sagas close, chain B, C… offered after a settled personal saga and a
// cooldown, seeded from the dossier with a DEALT situation as its new matter (the `next` lines; the settled wrong is kept on the
// world as the chain-B marker, never sent — handed it, 8 of 8 real chain Bs retold it; a first personal saga's prompts are
// untouched; the log-only lint reads the change against the Now). Plus round H's two default-path changes: the partial's cost as ONE phrase naming its
// owner (`owncost`, the game's pipes), and RFA (RF part (a) alone on TC).
import { describe, it, expect } from 'vitest';
import { Game, PERSONAL_CHAPTER_COOLDOWN } from '../src/game/game.js';
import { seedIdCounter, type Card } from '../src/engine/cards.js';
import type { Chain } from '../src/engine/chains.js';
import { composeLiving, livingLines, livingSeed, historyOf, nowOf, unnamed, LIVING_MAX_LINES, type LifeMark } from '../src/engine/dossier.js';
import { piped, partOf, castSaga, GAME_PIPE, COSTS, RETURNER_PART, type Cost, type Face } from '../src/engine/saga.js';
import { Rng } from '../src/engine/rng.js';
import { testedTraits, traitsOf } from '../src/engine/plainwords.js';
import { costPhrase, reportPayload, changeNowShare, CHANGE_NOW_SHARE, standing } from '../src/ai/storyteller.js';
import { standsFact } from '../src/game/sagaflow.js';
import type { SagaPlan, Episode } from '../src/engine/saga.js';
import { renderSaga } from '../src/ai/prompts/saga/render.js';
import { render } from '../cli/format.js';
import { newGame, sagaChain, playSaga } from './sagaharness.js';

const marks = (n: number): LifeMark[] => Array.from({ length: n }, (_, i) => ({ title: `Saga ${n - i}`, kind: i % 2 ? 'deed' : 'hurt', text: `The company did thing ${n - i}.`, band: 'light' }));

describe('the living dossier: bounded, engine-composed', () => {
  it('now is the last change without its title frame, else their card line', () => {
    expect(nowOf([{ seed: 's', line: 'After The Cave Trial: Burl stands as the den\'s reader.', title: 'The Cave Trial' }], 'a miller')).toBe('Burl stands as the den\'s reader.');
    expect(nowOf([{ seed: 's', line: 'After Old Title: Burl changed.' }], undefined)).toBe('Burl changed.');
    expect(nowOf(undefined, "a miller's child from the fens")).toBe("A miller's child from the fens.");
    expect(composeLiving({ name: 'Burl', marks: [], people: [], cycle: 3 })).toBeUndefined();
  });
  it('never more than six lines: the newest marks, the rest condensed to one Earlier line of titles; two people at most', () => {
    const people = [1, 2, 3].map(i => ({ id: `p${i}`, name: `P${i}`, label: 'elf trader', tie: 'rival-of' }));
    for (const n of [0, 1, 3, 4, 5, 9]) for (const ppl of [[], people]) {
      const d = composeLiving({ name: 'Burl Ash', who: 'a den reader', marks: marks(n), people: ppl, cycle: 9 })!;
      const lines = livingLines(d);
      expect(lines.length).toBeLessThanOrEqual(LIVING_MAX_LINES);
      expect(lines[0]).toBe('Now: A den reader.');
      expect(d.people.length).toBe(Math.min(2, ppl.length));
      // every mark is told: shown, or its title in Earlier
      for (const m of marks(n)) expect(lines.join('\n')).toContain(m.title);
    }
    const d = composeLiving({ name: 'Burl Ash', marks: marks(9), people, cycle: 9 })!;
    expect(d.earlier).toBeTruthy();
    expect(livingLines(d).filter(l => l.startsWith('- '))[0]).toBe('- Saga 9: The company did thing 9 — Burl was hurt (light).');
    expect(livingLines(d).at(-1)).toBe('People: P1, elf trader — a rival; P2, elf trader — a rival.');
  });
  it('the next chapter\'s seed names only the person the saga seats; history is the settled past', () => {
    const d = composeLiving({ name: 'Burl', who: 'x', marks: marks(1), people: [{ id: 'a', name: 'Ann', label: 'potter', tie: 'saved-by' }, { id: 'b', name: 'Bo', label: 'smith', tie: 'rival-of' }], cycle: 1 })!;
    expect(livingSeed(d)).not.toContain('People');
    expect(livingSeed(d, 'b')).toContain('People: Bo, smith — a rival.');
    expect(livingSeed(d, 'b')).not.toContain('Ann');
    expect(historyOf([{ seed: 'old seed', past: 'He ran. She was hurt.', line: 'After X: he stood.' }])).toBe('He ran. She was hurt.');
    expect(historyOf([{ seed: 'old seed', line: 'l' }])).toBe('old seed');
    expect(historyOf([])).toBeUndefined();
  });
  it('a hired saga a soldier decided a job in marks their dossier when it closes (both UIs print the same lines)', async () => {
    seedIdCounter(1);
    const { g } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: false });
    await playSaga(g, chain, 'clean', focal, undefined, { pipeArm: () => GAME_PIPE.other });
    const line = chain.saga!.lines[0]!;
    const doer = g.roster()[0]!;
    line.decides = doer.name;
    (g as unknown as { sagaClosed(c: Chain): void }).sagaClosed(chain);
    expect(chain.endedCycle).toBe(g.state.cycle);
    const lines = g.livingLines(doer.id);
    expect(lines.some(l => l.startsWith(`- ${chain.saga!.plan!.title}: `) && l.includes(`${doer.name.split(' ')[0]} decided it.`))).toBe(true);
    expect(render.merc(g, doer.id)).toContain(`story so far:\n${lines.map(l => `  ${l}`).join('\n')}`);
    // a soldier the saga never marked gets none
    const other = g.roster().find(m => m.id !== doer.id && !chain.saga!.lines.some(l => l.decides === m.name || l.hurt.some(h => h.name === m.name)));
    if (other) expect(g.livingLines(other.id)).toEqual([]);
  });
});

describe('chain B, C…: the next chapter', () => {
  /** a roster of three, roster[0] with one settled personal saga that changed them, ended at cycle 4 */
  function settled(): { g: Game; merc: Card; chain: Chain } {
    seedIdCounter(1);
    const { g } = newGame(31);
    g.build('map-room'); g.build('lead-room');
    while (g.roster().length < 3) { const c = { ...g.roster()[0]!, id: `m${g.roster().length}`, name: `Extra ${g.roster().length}`, character: { ...g.roster()[0]!.character! } }; g.state.cards.push(c as Card) }
    const merc = g.roster()[0]!;
    const chain: Chain = { id: 'ch-a', kind: 'recruit', isPersonal: true, focalId: merc.id, level: 1, rarity: 'uncommon', region: g.activeRegions()[0]!, expectedBeats: 3, payoff: 100, bank: 0, cyclesSpent: 0, failureBudget: 2, failures: 0, beatIndex: 3, state: 'done', createdCycle: 1, endedCycle: 4 };
    g.state.chains.push(chain);
    merc.character!.grown = [{ seed: 'he left a friend to drown', past: 'He left a friend to drown at the spring fair. He still hears it.', line: 'After The Drowning: he dives in now.', title: 'The Drowning', chainId: 'ch-a', cycle: 4 }];
    return { g, merc, chain };
  }
  /** every other soldier storied too: a personal saga that slipped (no next chapter for them) */
  function othersStoried(g: Game, chain: Chain): void {
    for (const m of g.roster().slice(1)) g.state.chains.push({ ...chain, id: `ch-${m.id}`, focalId: m.id, state: 'slipped' });
  }
  const drip = (g: Game) => (g as unknown as { personalChainDrip(): void }).personalChainDrip();
  it('comes only after the cooldown, reads as their next chapter, and never twice at once', () => {
    const { g, merc, chain } = settled();
    othersStoried(g, chain);
    g.rng.chance = () => true;
    g.state.cycle = 4 + PERSONAL_CHAPTER_COOLDOWN - 1;
    drip(g);
    expect(g.state.leads.some(l => l.source === 'personal')).toBe(false);
    g.state.cycle = 4 + PERSONAL_CHAPTER_COOLDOWN;
    drip(g);
    const leads = g.state.leads.filter(l => l.source === 'personal');
    expect(leads).toHaveLength(1);
    expect(leads[0]!.personalMercId).toBe(merc.id);
    expect(leads[0]!.title).toBe(`${merc.name}'s next chapter`);
    drip(g);
    expect(g.state.leads.filter(l => l.source === 'personal')).toHaveLength(1);
  });
  it('a soldier who never had a personal saga goes first; a slipped or unchanged last saga gives no next chapter', () => {
    const { g, merc, chain } = settled();
    g.rng.chance = () => true;
    g.state.cycle = 30;
    // roster[1] never had one: theirs comes first
    drip(g);
    expect(g.state.leads.find(l => l.source === 'personal')!.personalMercId).toBe(g.roster()[1]!.id);
    // with every soldier storied: a slipped last saga, or one that wrote no change, leads nowhere
    g.state.leads = [];
    othersStoried(g, chain);
    chain.state = 'slipped';
    drip(g);
    expect(g.state.leads.some(l => l.source === 'personal')).toBe(false);
    chain.state = 'done';
    merc.character!.grown![0]!.chainId = 'some-older-saga';
    drip(g);
    expect(g.state.leads.some(l => l.source === 'personal')).toBe(false);
    merc.character!.grown![0]!.chainId = 'ch-a';
    drip(g);
    expect(g.state.leads.find(l => l.source === 'personal')!.personalMercId).toBe(merc.id);
  });
});

describe('the next chapter\'s prompts: gated, a first personal saga byte-identical', () => {
  const base = ['types', 'personal', 'keywords', 'support', 'grafts', 'past'];
  it('the plan: the dealt situation as the seed, who they became beside it (now), a new event as the past — only with next', () => {
    const a = renderSaga('plan', base), b = renderSaga('plan', [...base, 'next']);
    expect(a).toContain("The story is the past of the company's soldier in cast");
    expect(a).toContain("- seed: the soldier's old wrong, which past retells.");
    expect(a).toContain('- ending: whose old matter the showdown settles.');
    expect(a).toContain('past: two plain sentences a stranger follows: what happened, at what event or season, who was hurt, what the soldier still carries.');
    expect(a).not.toMatch(/situation|now:|new matter|new event/);
    expect(b).toContain("The story is about the company's soldier in cast");
    expect(b).toContain('- seed: the new matter, never pasted. now: who the soldier became; the change goes further.');
    expect(b).toContain('- ending: whose matter the showdown settles.');
    expect(b).toContain('past: two plain sentences: a new event, at what season, that draws who they became into the matter.');
    // the seed is the new matter, so the cast line's "the seed's people" are its people, never the settled chapter's
    expect(renderSaga('plan', [...base.filter(f => f !== 'support'), 'next'])).toContain("Use them all as the seed's people");
    expect(b).not.toMatch(/old wrong|history|situation/);
  });
  it('card 1 and the pick', () => {
    expect(renderSaga('card', ['first', 'personal', 'past'], { MAX: 90 })).toContain('past: their old wrong, told plainly, nothing added.');
    expect(renderSaga('card', ['first', 'personal', 'past', 'next'], { MAX: 90 })).toContain('past: their new matter, told plainly, nothing added.');
    expect(renderSaga('pick', ['personal'])).toContain("- past: a company soldier's old wrong, the story's root.");
    expect(renderSaga('pick', ['personal'])).not.toMatch(/now:|the soldier,/);
    expect(renderSaga('pick', ['next'])).toContain('- situation: what the story is about.\n- now: who the company soldier at its heart is now.');
    expect(renderSaga('pick', ['next'])).toContain('best fit the situation, the soldier, the tone and the cast');
    expect(renderSaga('pick', ['next'])).not.toContain('old wrong');
  });
});

describe('the cost fix (round H §5): one phrase naming its owner, in the game\'s pipes', () => {
  const party = [{ name: 'Brin Ashford' }, { name: 'Tova Reed' }] as Card[];
  it('every cost kind names whose it is', () => {
    for (const k of Object.keys(COSTS)) {
      const c: Cost = COSTS[k]!(party, 'Brin Ashford');
      const p = costPhrase(c);
      expect(p).toMatch(c.whose === 'the company' ? /^the company's own / : c.whose === 'the locals' ? /^the locals' / : /^Brin Ashford's /);
      expect(p.endsWith(`, ${c.how}`)).toBe(true);
    }
  });
  it('the game\'s pipes deal the phrase; every other arm keeps its atoms', async () => {
    const seen = { string: 0, object: 0 };
    for (const pipe of ['voice', 'past', 'grafts', 'voice+stands'] as const) for (const seed of [21, 22, 23, 24, 25, 26]) {
      seedIdCounter(1);
      const { g, ai } = newGame(seed);
      const { chain, focal } = sagaChain(g, { N: 3, personal: pipe === 'past' });
      await playSaga(g, chain, pipe === 'past' ? 'personal' : 'bumpy', focal, undefined, { pipeArm: () => pipe });
      const withCost = ai.calls.filter(c => c.template === 'report' && c.payload.cost !== undefined);
      for (const c of withCost) { const t = typeof c.payload.cost as 'string' | 'object'; seen[t]++; expect(t, pipe).toBe(piped({ pipe }, 'owncost') ? 'string' : 'object') }
    }
    expect(seen.string).toBeGreaterThan(0);
    expect(seen.object).toBeGreaterThan(0);
    // the payload itself: a phrase in place of the atoms
    const r = reportPayload({ plan: { title: 't', question: 'Nobody knows why.', answer: 'a', cast: [], episodes: [], showdown: { n: 1, type: 'showdown', title: 's', job: 'j', people: [], trouble: { who: 'w', carry: 'c', will: 'x' }, why: '' }, options: [] } as never,
      e: { n: 1, type: 'fight', title: 'x', job: 'Beat them', people: [], trouble: { who: 'w', carry: 'c', will: 'x' }, why: 'y', win: 'won' } as never,
      card: 'c', party: newGame(5).g.roster().slice(0, 2), decides: 'Brin Ashford', outcome: 'partial', finale: false, hurt: [], cost: { what: 'horse', how: 'lamed', whose: 'the company' }, k: { met: new Set(), named: new Set(), seen: new Set() }, gravity: 'a small, everyday job', state: { learned: [], held: [] }, ownCost: true });
    expect(r.payload.cost).toBe("the company's own horse, lamed");
  });
});

describe('RFA: RF part (a) alone, on TC', () => {
  it('a failed middle job\'s report is dealt that the job still stands; the retry keeps TC\'s card (why, trouble) and report (hope)', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 4, personal: false });
    await playSaga(g, chain, 'bumpy', focal, undefined, { pipeArm: () => 'voice+stands' });
    const reports = ai.calls.filter(c => c.template === 'report');
    const failed = reports.filter(c => c.flags.includes('failure'));
    expect(failed.length).toBeGreaterThan(0);
    for (const c of failed) { expect(c.flags).toContain('stands'); expect(String(c.payload.stands)).toMatch(/^whoever and whatever the job names, and its place/) }
    expect(reports.filter(c => !c.flags.includes('failure')).every(c => !c.flags.includes('stands'))).toBe(true);
    const retry = ai.calls.filter(c => c.template === 'card' && c.flags.includes('retry'));
    expect(retry.length).toBeGreaterThan(0);
    for (const c of retry) { expect(c.flags).not.toContain('setback'); expect(c.payload.why).toBeTruthy(); expect(c.payload.trouble).toBeTruthy() }
    // the retry's won report keeps the card's hope (RF's part (b) dropped it)
    const n = ai.calls.findIndex(c => c.template === 'card' && c.flags.includes('retry'));
    const retryReport = ai.calls.slice(n).find(c => c.template === 'report')!;
    if (!retryReport.flags.includes('failure')) expect(retryReport.flags).toContain('hope');
  });
});

describe('the next chapter\'s now: who they became, no settled chapter, no stranger', () => {
  it('the Now alone (a saga\'s people by label), and the People line only for the one seated; the sheet keeps it all', () => {
    const people = [{ name: 'Azareth Vell', label: 'elf moneylender' }, { name: 'Aeta', label: 'a wolfkin potter' }];
    expect(unnamed("Azareth Vell tore the note. Azareth's ledger lay open, and Aeta smiled.", people)).toBe("The elf moneylender tore the note. The elf moneylender's ledger lay open, and the wolfkin potter smiled.");
    expect(unnamed('The company talked Azareth round.', people)).toBe('The company talked the elf moneylender round.');
    const text = 'Azareth Vell is talked round.';
    const grown = [{ seed: 's', line: 'After The Silver: Hessa paid Azareth Vell back and stopped running.', title: 'The Silver' }];
    const d = composeLiving({ name: 'Hessa Thatcher', grown, marks: [{ title: 'The Silver', kind: 'own', text, people }], people: [{ id: 'lore-1', name: 'Azareth Vell', label: 'elf moneylender', tie: 'rival-of' }], cycle: 1 })!;
    expect(livingLines(d).join('\n')).toContain('Azareth Vell is talked round.');
    // the marks are settled chapters: never sent (sent as the seed, chain B reopened them), so neither title nor text
    expect(livingSeed(d)).toBe('Hessa paid the elf moneylender back and stopped running.');
    // seated, the one who matters keeps their name, and their tie rides on the People line
    expect(livingSeed(d, 'lore-1')).toBe('Hessa paid Azareth Vell back and stopped running.\nPeople: Azareth Vell, elf moneylender — a rival.');
    for (const seated of [undefined, 'lore-1']) { expect(livingSeed(d, seated)).not.toContain('The Silver'); expect(livingSeed(d, seated)).not.toContain('talked round') }
  });
});

describe('the next chapter: a dealt matter, the settled wrong never sent', () => {
  it('the deal adds a situation only to a next chapter; the plan and pick get the dossier, the situation, and no history; the retelling lint reads it', async () => {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: true });
    const history = 'At the spring fair Ismenios left his friend to drown. He still hears the bell.';
    await playSaga(g, chain, 'personal', focal, undefined, { pipeArm: () => 'past' });
    const first = ai.calls.find(c => c.template === 'plan')!;
    expect(first.flags).not.toContain('next');
    // chain B: the same soldier, the dossier as the seed and the settled past as history (as game.ts deals it)
    seedIdCounter(1);
    const b = newGame(21);
    const cb = sagaChain(b.g, { N: 3, personal: true });
    const host = { ...(await import('./sagaharness.js')).hostFor(b.g), pipeArm: () => 'past' as const };
    const flow = await import('../src/game/sagaflow.js');
    flow.deal(host, cb.chain, undefined, cb.focal, { personalSeed: 'Ismenios dives in now.', history });
    const w = cb.chain.saga!.world;
    expect(w.history).toBe(history);
    expect(w.kit!.situations).toHaveLength(1);
    await flow.plan(host, cb.chain);
    const pick = b.ai.calls.find(c => c.template === 'pick')!, plan = b.ai.calls.find(c => c.template === 'plan')!;
    expect(pick.flags).toEqual(['next']);
    expect(pick.payload).toMatchObject({ situation: w.kit!.situations[0], now: 'Ismenios dives in now.' });
    expect(plan.flags).toContain('next');
    // the dealt situation is the seed (its new matter); who they became rides beside it, a done fact
    expect(plan.payload).toMatchObject({ seed: w.kit!.situations[0], now: 'Ismenios dives in now.' });
    expect(plan.payload.situation).toBeUndefined();
    for (const c of b.ai.calls) expect(JSON.stringify(c.payload)).not.toContain('left his friend to drown');
    // the floor (the plan the game falls back to) plays the dealt matter too, never the settled wrong: its past is the new
    // event, its change no echo of the old one, its showdown settles the situation's stake
    const p = cb.chain.saga!.plan!;
    const soldier = p.cast.find(c => c.seat === 'soldier')!;
    expect(soldier.past).toContain(w.kit!.picked?.situation ?? w.kit!.situations[0]!);
    for (const t of [soldier.past, soldier.change, p.question, p.answer, p.showdown.settles]) expect(t).not.toMatch(/old wrong|run(ning)? from/);
    // the log-only lint: a change that copies who they already were (the Now) is flagged, a change that goes elsewhere is not;
    // their own name is no shared word
    soldier.change = 'Ismenios dives in, now and always.';
    expect(changeNowShare(p, w)).toBeGreaterThanOrEqual(CHANGE_NOW_SHARE);
    soldier.change = 'Ismenios trusts the widow with the ferry and lets her steer.';
    expect(changeNowShare(p, w)!).toBeLessThan(CHANGE_NOW_SHARE);
    expect(changeNowShare(p, { ...w, history: undefined })).toBeUndefined();
  });
});

describe('unnamed: a name beside its own trade is one person', () => {
  it('folds the appositive', () => {
    const people = [{ name: 'Benjamund', label: 'human moneylender' }];
    expect(unnamed('The company talked the moneylender Benjamund round at Whinmarch.', people)).toBe('The company talked the human moneylender round at Whinmarch.');
    expect(unnamed('Benjamund, the old moneylender, fled.', people)).toBe('The human moneylender fled.');
    expect(unnamed('The Mill burned; the mill stood.', [{ name: 'Mill', label: 'a ghost' }])).toBe('The ghost burned; the mill stood.');
    expect(unnamed('They met the miller and Benjamund.', people)).toBe('They met the miller and the human moneylender.');
  });
});

describe('chain B\'s inputs (CBR, CBT; lab arms): the Now to no call, the event, one dealt item', () => {
  const history = 'At the spring fair Ismenios left his friend to drown. He still hears the bell.';
  const now = 'Ismenios dives in now, whoever is in the water.';
  /** one chain B on `pipe`, played to its end on the mock; `seat`: a tied face from their last chapter (D10) */
  async function chainB(pipe: 'past' | 'past+return' | 'past+trait', seat?: Face & { rival: boolean }) {
    seedIdCounter(1);
    const { g, ai } = newGame(21);
    const { chain, focal } = sagaChain(g, { N: 3, personal: true });
    const p = await playSaga(g, chain, 'personal', focal, undefined, { pipeArm: () => pipe }, { personalSeed: now, history, ...(seat ? { seedPerson: seat } : {}) });
    return { g, ai, chain, focal, p, w: chain.saga!.world };
  }
  const face: Face & { rival: boolean } = { id: 'lore-9', name: 'Aeta Nightrunner', sex: 'female', race: 'wolfman', trade: 'potter', memory: 'The company won over the moneylender, and Ismenios carried the potter home.', where: 'in the Western Forests', rival: false };
  it('the deal is CB\'s own; CBT adds the trait it tests, drawn after it, from the soldier\'s card', async () => {
    const cb = await chainB('past'), cbt = await chainB('past+trait'), cbr = await chainB('past+return');
    for (const x of [cbt, cbr]) {
      expect(x.w.kit!.situations).toEqual(cb.w.kit!.situations);
      expect(x.w.kit!.keywords).toEqual(cb.w.kit!.keywords);
      expect(x.w.places).toEqual(cb.w.places);
      // (a situation taking "someone" with nobody to fill it adds one person, after the rest)
      expect(x.w.cast.map(c => c.name).slice(0, cb.w.cast.length)).toEqual(cb.w.cast.map(c => c.name));
    }
    expect(cb.w.tests).toBeUndefined();
    expect(cbr.w.tests).toBeUndefined();
    expect(testedTraits(cbt.focal)).toContain(cbt.w.tests);
    // the tested trait leads the soldier's traits (the card's own first two could miss it); CB's stay the card's
    const me = cbt.w.cast.find(c => c.seat === 'soldier')!;
    expect(me.traits!.split(', ')[0]).toBe(cbt.w.tests);
    expect(me.traits!.split(', ').length).toBeLessThanOrEqual(2);
    expect(cb.w.cast.find(c => c.seat === 'soldier')!.traits).toBe(traitsOf(cb.focal));
  });
  it('a situation that takes "someone" deals a person to fill it, after every other draw; never on a hired saga or a filled seat', () => {
    seedIdCounter(1);
    const { g } = newGame(9);
    const { focal, chain } = sagaChain(g, { N: 3, personal: true });
    const base = { focal, personal: true, region: chain.region, shape: 'heist' as const, taken: () => false };
    const bare = castSaga(new Rng(5), base), filled = castSaga(new Rng(5), { ...base, someone: true });
    expect(filled.places).toEqual(bare.places);
    expect(filled.cast.slice(0, bare.cast.length)).toEqual(bare.cast);
    expect(filled.cast).toHaveLength(bare.cast.length + 1);
    expect(filled.cast.at(-1)).toMatchObject({ seat: 'support', part: '' });
    expect(castSaga(new Rng(5), { ...base, someone: true, kit: { support: 1 } }).cast.filter(c => c.seat === 'support')).toHaveLength(1);
    expect(castSaga(new Rng(5), { ...base, someone: true, seedPerson: { ...face, rival: false } }).cast.filter(c => c.seat === 'support')).toHaveLength(0);
    expect(castSaga(new Rng(5), { ...base, personal: false, someone: true }).cast.filter(c => c.seat === 'support')).toHaveLength(0);
  });
  it('the plan and the pick never get the Now; the plan gets the soldier\'s event (and CBT its trait); CB keeps its own', async () => {
    const cb = await chainB('past');
    expect(cb.ai.calls.find(c => c.template === 'plan')!.payload.now).toBe(now);
    expect(cb.ai.calls.find(c => c.template === 'pick')!.flags).toEqual(['next']);
    for (const pipe of ['past+return', 'past+trait'] as const) {
      const { ai, chain, w } = await chainB(pipe);
      const pick = ai.calls.find(c => c.template === 'pick')!, plan = ai.calls.find(c => c.template === 'plan')!;
      expect(pick.flags).not.toContain('next');
      expect(plan.flags).toEqual(expect.arrayContaining(['next', 'event']));
      expect(plan.flags.includes('tests')).toBe(pipe === 'past+trait');
      expect(plan.payload.tests).toBe(pipe === 'past+trait' ? w.tests : undefined);
      for (const c of [pick, plan]) expect(JSON.stringify(c.payload)).not.toContain('dives in');
      const sys = renderSaga('plan', plan.flags);
      expect(sys).toContain('event: two plain sentences: what just happened, at what season, that pulls the soldier in.');
      expect(sys).toContain('"event": "two sentences"');
      expect(sys).not.toMatch(/now:|"past"|past:|who they became/);
      expect(sys.includes('tests: the soldier\'s trait it puts to the test.')).toBe(pipe === 'past+trait');
      // the plan's event is the matter card 1 tells (kept where a past is)
      expect(chain.saga!.plan!.cast.find(c => c.seat === 'soldier')!.past).toMatch(/^This season at /);
      for (const c of ai.calls) expect(JSON.stringify(c.payload)).not.toContain('left his friend to drown');
    }
  });
  it('card 1 tells the event, never who they became; no report gets the Now; the reports call them the one whose story this is', async () => {
    const { ai, w } = await chainB('past+trait');
    const card1 = ai.calls.find(c => c.template === 'card')!;
    expect(card1.flags).toEqual(expect.arrayContaining(['next', 'event']));
    expect(card1.flags).not.toContain('now');
    const premise = card1.payload.premise as Record<string, string>;
    expect(premise.now).toBeUndefined();
    expect(premise.event).toMatch(/^This season at /);
    expect(premise.past).toBeUndefined();
    expect(renderSaga('card', card1.flags, card1.vars)).toContain('who: one of your own soldiers. wants: what they want. event: what just drew them in.');
    expect(card1.vars.MAX).toBe(90);
    for (const c of ai.calls) expect(JSON.stringify(c.payload)).not.toContain('dives in');
    const reports = ai.calls.filter(c => c.template === 'report');
    for (const r of reports) {
      const own = (r.payload.soldiers as { is: string; became?: string }[])[0]!;
      expect(own.is).toMatch(/, whose story this is$/);
      // (CBT) their trait word is the tested trait, wherever the report shows their traits
      expect(own.is).toContain(`, ${w.tests}, `);
      expect(own.became).toBeUndefined();
      expect(r.flags).toContain('next');
      expect(r.flags).not.toContain('now');
      expect(renderSaga('report', r.flags, r.vars)).toContain('Name no soldier but the one whose story this is');
      expect(renderSaga('report', r.flags, r.vars)).toContain('- soldiers: who went, what each is like.');
    }
    // the default's chain B (CB) is untouched: whose past this story is, and no became
    const cb = await chainB('past');
    for (const r of cb.ai.calls.filter(c => c.template === 'report')) {
      expect((r.payload.soldiers as { is: string }[])[0]!.is).toMatch(/, whose past this story is$/);
      expect(r.flags).not.toContain('next');
      expect(JSON.stringify(r.payload)).not.toContain('became');
    }
    expect(cb.ai.calls.find(c => c.template === 'card')!.flags).not.toContain('event');
  });
  it('CBR: the person from their last chapter asks the soldier for help, with their memory and their role word; the game\'s tied face keeps its part', async () => {
    const { ai, w } = await chainB('past+return', face);
    const seated = w.cast.find(c => c.id === 'lore-9')!;
    expect(seated).toMatchObject({ seat: 'other', part: RETURNER_PART, memory: face.memory, known: true });
    expect(partOf(seated)).toBe(RETURNER_PART);
    expect(RETURNER_PART).toBe('asks the soldier for help');
    // named from the start (known there), never an intro: their role word rides on every entry that has them
    const entries = ai.calls.filter(c => c.template === 'report' || c.template === 'card').flatMap(c => [...((c.payload.people ?? []) as Record<string, unknown>[]), ...((c.payload.names ?? []) as Record<string, unknown>[])]).filter(x => x.name === face.name);
    expect(entries.length).toBeGreaterThan(0);
    for (const x of entries) { expect(x.label).toBe('a potter'); expect(x.intro).toBeUndefined() }
    for (const x of entries.filter(x => x.part)) expect(x.part).toMatch(/^asks \S.* for help$/);
    const plan = ai.calls.find(c => c.template === 'plan')!;
    expect(plan.flags).toContain('memory');
    expect((plan.payload.cast as { id: string; part?: string; memory?: string }[]).find(c => c.id === 'lore-9')).toMatchObject({ part: RETURNER_PART, memory: face.memory, where: face.where });
    // the default's chain B seats the same tied face as before: "knows the soldier's past"; a rival is never re-parted
    expect((await chainB('past', face)).w.cast.find(c => c.id === 'lore-9')!.part).toBe("knows the soldier's past");
    expect((await chainB('past+return', { ...face, rival: true })).w.cast.find(c => c.id === 'lore-9')!).toMatchObject({ seat: 'opponent', part: 'stands in the way' });
  });
  it('the change-vs-Now lint runs on every chain B (the plan never saw the Now on CBR/CBT)', async () => {
    for (const pipe of ['past', 'past+trait'] as const) {
      const { chain, w } = await chainB(pipe);
      expect(changeNowShare(chain.saga!.plan!, w)).toBeTypeOf('number');
    }
  });
});

describe('testedTraits: what a next chapter may test', () => {
  it('personality words and quirks first, else body and standing words', () => {
    const card = (concepts: string[], quirks?: string[]) => ({ tags: concepts.map(concept => ({ concept })), character: { quirks } }) as unknown as Card;
    expect(testedTraits(card(['muscular', 'hotheaded', 'greedy', 'chaste'], ['hums when nervous.']))).toEqual(['hot-headed', 'greedy', 'hums when nervous']);
    expect(testedTraits(card(['muscular', 'tall']))).toEqual(['strong', 'tall']);
    expect(testedTraits(card([]))).toEqual([]);
  });
});

describe('RFW: RFA with its fact widened', () => {
  it('what stands, by name: the job\'s people (but the soldiers sent), then its place as the job says it', () => {
    const plan = { cast: [{ id: 'p1', name: 'Eraldil', label: 'elf horse-breeder', seat: 'client', sex: 'female', race: 'elf' }, { id: 'p2', name: 'Eussorus', label: 'human merchant', seat: 'support', sex: 'male', race: 'human' }] } as unknown as SagaPlan;
    const e = { job: 'Drive off the raiders creeping toward the barn at Greydale', people: ['p1', 'p2'], trouble: { who: 'raiders on stolen horses', carry: 'clubs', will: '' } } as unknown as Episode;
    const xs = standing(plan, e, [], ['Greydale', 'Thornholt', 'Ashby']);
    expect(xs).toEqual(['Eraldil', 'Eussorus', 'the barn at Greydale']);
    expect(standsFact(true, xs)).toBe("Eraldil, Eussorus, the barn at Greydale and whatever else the job names, all still within the company's reach, for the company tries this job again");
    expect(standing(plan, { ...e, job: 'Hold Thornholt', people: [] } as unknown as Episode, [], ['Greydale', 'Thornholt'])).toEqual(['Thornholt']);
    // a verb between "the" and the place is no thing standing there: the bare place (the merchant the job names is there)
    expect(standing(plan, { ...e, job: 'Break the prisoner the merchant keeps out of Thornholt', people: [] } as unknown as Episode, [], ['Thornholt'])).toEqual(['Eussorus', 'Thornholt']);
    expect(standing(plan, e, ['Eussorus'], ['Greydale'])).toEqual(['Eraldil', 'the barn at Greydale']);
    expect(standsFact(false, ['Thornholt'])).toBe("Thornholt and whatever else the job names, all still within the company's reach");
    // nothing the engine can name: the rule's words, still within reach; RFA's fact unchanged
    expect(standsFact(false, [])).toBe("whoever and whatever the job names, and its place, all still within the company's reach");
    expect(standsFact(true)).toBe('whoever and whatever the job names, and its place, for the company tries this job again');
  });
  it('a failed middle job\'s report is dealt that all of it is still within the company\'s reach; RFA\'s fact unchanged', async () => {
    for (const pipe of ['voice+reach', 'voice+stands'] as const) {
      seedIdCounter(1);
      const { g, ai } = newGame(21);
      const { chain, focal } = sagaChain(g, { N: 4, personal: false });
      await playSaga(g, chain, 'bumpy', focal, undefined, { pipeArm: () => pipe });
      const failed = ai.calls.filter(c => c.template === 'report' && c.flags.includes('failure'));
      expect(failed.length).toBeGreaterThan(0);
      for (const c of failed) {
        expect(c.flags).toContain('stands');
        // RFW: what stands by name (the job's people, its place as the job says it), all still within reach; RFA's rule words
        if (pipe === 'voice+reach') {
          expect(String(c.payload.stands)).not.toMatch(/^whoever/);
          expect(String(c.payload.stands)).toContain(' and whatever else the job names, all still');
          expect(String(c.payload.stands)).toMatch(/still within the company's reach(?:, for the company tries this job again)?$/);
        } else expect(String(c.payload.stands)).toMatch(/^whoever and whatever the job names, and its place(?:, for the company tries this job again)?$/);
      }
      const cost = ai.calls.find(c => c.template === 'report' && c.payload.cost !== undefined);
      if (cost) expect(typeof cost.payload.cost).toBe('object');
    }
  });
});
