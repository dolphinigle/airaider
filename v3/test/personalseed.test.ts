// A personal saga's seed may only name people the saga CAN CAST. Genesis is dealt no company
// soldier but the focal, and assignedNames are the only names it may coin — so an edge pointing
// at a fellow soldier hands it a name it has no permission to use, and it silently invents a
// stranger in their place (measured 2026-08-31: "Biddy left Arver at a crossing" produced a saga
// about finding "Duryn Fernbrook"). The premise is incoherent regardless: you cannot ride out to
// find someone standing in your own yard.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { guardEdges } from '../src/engine/lore.js';
import type { SagaCall } from '../src/ai/provider.js';

class SeedSpy extends MockProvider {
  seeds: string[] = [];
  override sagaCall(c: SagaCall): Promise<unknown> { if (c.template === 'plan') this.seeds.push(String(c.payload.seed)); return super.sagaCall(c) }
}

/** a personal chain for roster[0], with one lore edge to `to`; `made`: the play that made it (a saga, a quest, the engine) */
async function seedFor(to: 'merc' | 'npc', made?: 'saga' | 'quest' | 'self'): Promise<string> {
  const ai = new SeedSpy();
  const g = new Game(ai, 268);
  g.build('map-room'); g.build('lead-room');
  const merc = g.roster()[0]!;
  g.ensureLoreNode(merc);
  let otherId: string;
  if (to === 'merc') { const o = g.roster()[1]!; g.ensureLoreNode(o); otherId = o.id }
  else {
    otherId = 'npc-x';
    g.state.lore.nodes[otherId] = { id: otherId, kind: 'character', name: 'Arver Stonefield',
      blurb: 'a merchant the fort has dealt with', identity: '', active: true, createdCycle: 1 };
  }
  guardEdges(g.state.lore, [{ from: merc.id, to: made === 'self' ? merc.id : otherId, type: 'betrayed-by',
    blurb: `${merc.name} left them at a crossing and has never said why`, importance: 0.9, ...(made === 'quest' ? { sourceQuestId: 'q-1' } : {}) }],
    1, () => 'e1', made === 'saga' ? 'chain-1' : undefined);
  (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
  const lead = g.state.leads.find(l => l.source === 'personal')!;
  await g.pursue(lead.id);
  return ai.seeds.at(-1)!;
}

describe('personal saga seed', () => {
  it('uses a lore edge that points OUT of the company', async () => {
    expect(await seedFor('npc')).toContain('at a crossing');
  });

  it('never seeds from an edge pointing at a fellow soldier', async () => {
    // the ONLY edge is merc-to-merc, so it must fall back rather than name someone uncastable
    expect(await seedFor('merc')).not.toContain('at a crossing');
  });

  it('never seeds from a memory the company\'s play made: the saga is told as the soldier\'s past', async () => {
    for (const made of ['saga', 'quest', 'self'] as const) expect(await seedFor('npc', made), made).not.toContain('at a crossing');
  });
});

// A plan with a hard defect earns ONE plain re-draw on the same input (STORYTELLER §2.7) — never a new seed: the old
// genesis re-roll burned the seed, so a personal saga came back on a generic what-if and copied the live saga.
class BrokenPlanOnce extends SeedSpy {
  private first = true;
  override async sagaCall(c: SagaCall): Promise<unknown> {
    const out = await super.sagaCall(c);
    if (c.template === 'plan' && this.first) { this.first = false; return { ...(out as object), episodes: [] } }
    return out;
  }
}

describe('a personal saga re-drawn for a hard defect', () => {
  it('re-draws on the same piece of the soldier\'s own past', async () => {
    const ai = new BrokenPlanOnce();
    const g = new Game(ai, 268);
    g.build('map-room'); g.build('lead-room');
    const merc = g.roster()[0]!;
    merc.character!.backstory = 'She mended mail at her mother\'s brazier before she could lift a sword. She left home the winter the forge went cold.';
    g.ensureLoreNode(merc);
    (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
    await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
    expect(ai.seeds.length).toBe(2);
    expect(ai.seeds[1]).toBe(ai.seeds[0]);
    expect(merc.character!.backstory).toContain(ai.seeds[0]!);
    expect(g.state.chains[0]!.saga!.fallback).toBe(false);
  });
});

describe('D10: the person a personal seed came from takes a seat', () => {
  async function seated(type: string) {
    const g = new Game(new MockProvider(268), 268);
    g.build('map-room'); g.build('lead-room');
    const merc = g.roster()[0]!;
    g.ensureLoreNode(merc);
    g.state.lore.nodes['npc-x'] = { id: 'npc-x', kind: 'character', name: 'Arver Stonefield', sex: 'male', race: 'human',
      blurb: 'a merchant', identity: '', active: true, createdCycle: 1 };
    guardEdges(g.state.lore, [{ from: merc.id, to: 'npc-x', type, blurb: `${merc.name} left Arver at a crossing and has never said why`, importance: 0.9 }], 1, () => 'e1');
    (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
    await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
    return g.state.chains[0]!.saga!.world.cast.find(p => p.id === 'npc-x');
  }
  it('known, with the edge as their memory; a rival-type edge seats them in the way', async () => {
    const rival = await seated('betrayed-by');
    expect(rival).toMatchObject({ name: 'Arver Stonefield', seat: 'opponent', known: true });
    expect(rival!.memory).toContain('at a crossing');
    const other = await seated('owes');
    expect(other).toMatchObject({ seat: 'other', known: true });
  });
});

describe('a personal saga for a soldier the company won', () => {
  it('is seeded from who they were, not from the job that brought them in', async () => {
    const ai = new SeedSpy();
    const g = new Game(ai, 268);
    g.build('map-room'); g.build('lead-room');
    const merc = g.roster()[0]!;
    merc.character!.who = 'A Deep Fens hunter. He keeps to low places.';
    merc.character!.backstory = 'They found him pressed to the mill shutter and he agreed to wait at the fort tavern for hire.';
    merc.character!.origin = { title: 'Nosy Forest Hunter', situation: '', job: '' };
    g.ensureLoreNode(merc);
    (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
    await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
    const seed = ai.seeds.at(-1)!;
    expect(seed).not.toMatch(/shutter|tavern/);
    expect(seed).toContain('Deep Fens');
  });
});
