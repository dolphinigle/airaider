// Text-UI parity (docs/DOGFOODING.md; STORYTELLER Phase 2 Step 6): the CLI prints a saga card's quest log as exactly the
// rows the server exposes (quests[].saga.rows — the engine renders them; neither UI builds saga text), in the same order
// as the quest page: the log above the prose (logFirst), ON THIS MATTER, REWARD, the SAGA line. The chain view prints
// the chronicle's rows, card 1, So far, the answer and the people the GUI's Sagas tab shows.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { seedIdCounter } from '../src/engine/cards.js';
import { logLines, matterLine } from '../src/ai/storyteller.js';
import { render } from '../cli/format.js';

async function playTo(g: Game, cards: number) {
  g.build('map-room');
  await g.pursue(g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!.id);
  for (let i = 1; i < cards; i++) {
    const q = g.state.quests.find(x => x.chainId && x.state === 'open')!;
    if (q.approaches) g.chooseApproach(q.id, q.approaches[0]!.id);
    for (const m of g.roster()) m.character!.attrs = { str: 30, dex: 30, int: 30, cha: 30, con: 30 };
    g.autoAssign(q.id);
    await g.endCycle();
    const lead = g.state.leads.find(l => l.chainInfo.kind === 'continues');
    if (!lead) break;
    await g.pursue(lead.id);
  }
  return g.state.quests.find(x => x.chainId && x.state === 'open')!;
}

describe('the CLI prints the rows the server exposes', () => {
  it('a later saga card: log above the prose, the people it names, the SAGA line; no errand', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(7), 7);
    const q = await playTo(g, 2);
    const out = render.questDetail(g, q.id).split('\n');
    const log = logLines(q.saga!.rows);
    expect(log.some(l => l.startsWith('For: '))).toBe(true);
    expect(log.some(l => l.startsWith('Open question: '))).toBe(true);
    const chain = g.chainViews().find(c => c.id === q.chainId)!;
    expect(out[0]).toBe(`═══ ${q.title} · ${chain.title} ═══  ${out[0]!.slice(out[0]!.indexOf('(q'))}`);
    expect(out.slice(1, 1 + log.length)).toEqual(log);
    expect(out[1 + log.length]).toBe('');
    expect(out[2 + log.length]).toBe(q.situation);
    const matter = matterLine(g.questCast(q.id));
    if (matter) expect(out[3 + log.length]).toBe(matter);
    expect(out.find(l => l.startsWith('SAGA: '))).toBe(`SAGA: part ${q.saga!.part} of ${q.saga!.of} · setbacks ${q.saga!.setbacks} of ${q.saga!.budget}`);
    expect(out.some(l => l.startsWith('ERRAND:'))).toBe(false);
  });

  it('the chain view: the chronicle rows, card 1, So far, the people', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(7), 7);
    const q = await playTo(g, 2);
    const c = g.chainViews().find(x => x.id === q.chainId)!;
    const out = render.chainDetail(g, c.id).split('\n');
    expect(out[0]).toBe(`═══ ${c.title} ═══ (${c.state})`);
    expect(out.slice(1, 1 + c.rows.length)).toEqual(logLines(c.rows));
    expect(out[1 + c.rows.length]).toBe(c.card1);
    expect(out).toContain('So far:');
    for (const l of c.soFar) expect(out).toContain(l);
    for (const p of c.people) expect(out).toContain(p.name ? `  ${p.name} — ${p.label}` : `  ${p.label}`);
    expect(out.some(l => l.startsWith('The answer: '))).toBe(false);   // not before the finale
  });
});
