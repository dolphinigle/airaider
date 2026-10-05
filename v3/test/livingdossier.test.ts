// The recurring personal arc (docs/STORYTELLER.md North Star 0, designer 2026-10-05; STORY_ENGINE §4, §8): the bounded
// LIVING DOSSIER (engine/dossier.ts) refreshed as sagas close, chain B, C… offered after a settled personal saga and a
// cooldown, seeded from the dossier with a DEALT situation as its new matter (the `next` lines; the settled wrong is kept on the
// world for the log-only retelling lint, never sent — handed it, 8 of 8 real chain Bs retold it; a first personal saga's
// prompts are untouched). Plus round H's two default-path changes: the partial's cost as ONE phrase naming its
// owner (`owncost`, the game's pipes), and RFA (RF part (a) alone on TC).
import { describe, it, expect } from 'vitest';
import { Game, PERSONAL_CHAPTER_COOLDOWN } from '../src/game/game.js';
import { seedIdCounter, type Card } from '../src/engine/cards.js';
import type { Chain } from '../src/engine/chains.js';
import { composeLiving, livingLines, livingSeed, historyOf, nowOf, unnamed, LIVING_MAX_LINES, type LifeMark } from '../src/engine/dossier.js';
import { piped, GAME_PIPE, COSTS, type Cost } from '../src/engine/saga.js';
import { costPhrase, reportPayload, retellShare, RETELL_SHARE } from '../src/ai/storyteller.js';
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
    // the log-only lint: a new past made of the settled one is flagged, a new matter is not
    soldier.past = 'At the spring fair Ismenios left his friend to drown, and he still hears the bell.';
    expect(retellShare(p, w)).toBeGreaterThan(0.8);
    soldier.past = 'A widow at the ferry asks Ismenios to guard her son on the flooded road. He knows that river.';
    expect(retellShare(p, w)!).toBeLessThan(RETELL_SHARE);
    expect(retellShare(p, { personal: true })).toBeUndefined();
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
