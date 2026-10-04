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
import { soFarLine } from '../src/game/sagaflow.js';
import { renderTags } from '../src/engine/tags.js';

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
    // the web's saga strip, in its order: this card's part (pips), the setbacks, what is set aside so far
    const pip = (n: number, of: number, on: string, off: string) => on.repeat(n) + off.repeat(of - n);
    expect(out.find(l => l.startsWith('SAGA: '))).toBe(`SAGA: ${pip(q.saga!.part!, q.saga!.of, '●', '○')} part ${q.saga!.part} of ${q.saga!.of} · setbacks ${pip(q.saga!.setbacks, q.saga!.budget, '✗', '·')} ${q.saga!.setbacks} of ${q.saga!.budget} · set aside so far: ${chain.bank || 'nothing yet'}`);
    expect(out.some(l => l.startsWith('ERRAND:'))).toBe(false);
  });

  it('ON THIS MATTER: a person who is a real card gets a line of what that card is, as the quest page shows it', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(31), 31);
    g.build('map-room');
    g.build('lead-room');
    const merc = g.roster()[0]!;
    g.state.leads.push({ id: 'lead-p', rarity: 'uncommon', level: merc.character!.level, region: g.activeRegions()[0]!, archetype: 'investigate',
      chainInfo: { kind: 'starts-new' }, expiresAtCycle: g.state.cycle + 12, source: 'personal', title: `${merc.name}'s past stirs`, personalMercId: merc.id });
    const { questId } = await g.pursue('lead-p');
    const out = render.questDetail(g, questId!).split('\n');
    const cast = g.questCast(questId!);
    const at = out.indexOf(matterLine(cast));
    expect(at).toBeGreaterThan(0);
    const label = cast.find(c => c.cardId === merc.id)!.label;
    expect(out[at + 1]).toMatch(new RegExp(`^  ${merc.name} — ${label} · L${merc.character!.level}( ★+)? · `));
    expect(out[at + 1]!.endsWith(` · ${renderTags(merc.tags)}`)).toBe(true);
    expect(out[at + 2]).toMatch(/^REWARD: /);
  });

  it('the chain view: the chronicle rows, card 1, So far, the people', async () => {
    seedIdCounter(1);
    const g = new Game(new MockProvider(7), 7);
    const q = await playTo(g, 2);
    const c = g.chainViews().find(x => x.id === q.chainId)!;
    const out = render.chainDetail(g, c.id).split('\n');
    expect(out[0]).toBe(`═══ ${c.title} ═══ (${c.state})`);
    expect(out.slice(1, 1 + c.rows.length)).toEqual(logLines(c.rows));
    // card 1 is set off from the log, as on a card
    expect(out[1 + c.rows.length]).toBe('');
    expect(out[2 + c.rows.length]).toBe(c.card1);
    expect(out[3 + c.rows.length]).toBe(`likely end: ${c.likely} · setbacks ${c.failures} of ${c.failureBudget} · set aside ${c.bank || '—'}`);
    expect(out).toContain('So far:');
    for (const r of c.soFar) expect(out).toContain(soFarLine(r));
    expect(out.some(l => /progress/.test(l))).toBe(false);
    for (const p of c.people) expect(out).toContain(p.name ? `  ${p.name} — ${p.label}` : `  ${p.label}`);
    expect(out.some(l => l.startsWith('The answer: '))).toBe(false);   // not before the finale
  });
});
