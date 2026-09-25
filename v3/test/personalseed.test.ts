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
import type { GenesisInput, GenesisOut } from '../src/ai/provider.js';

class SeedSpy extends MockProvider {
  seeds: string[] = [];
  override genesis(i: GenesisInput): Promise<GenesisOut> { this.seeds.push(i.seed); return super.genesis(i) }
}

/** a personal chain for roster[0], with one lore edge to `to` */
async function seedFor(to: 'merc' | 'npc'): Promise<string> {
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
  guardEdges(g.state.lore, [{ from: merc.id, to: otherId, type: 'betrayed-by',
    blurb: `${merc.name} left them at a crossing and has never said why`, importance: 0.9 }], 1, () => 'e1');
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
});

// The genesis re-roll (one, for HARD defects) burned the seed with sampleSeed(): a personal saga
// whose first draft was rejected came back on a generic what-if and copied the live saga.
class DropFocalOnce extends MockProvider {
  seeds: string[] = [];
  private first = true;
  override async genesis(i: GenesisInput): Promise<GenesisOut> {
    this.seeds.push(i.seed);
    const out = await super.genesis(i);
    if (this.first) { this.first = false; return { ...out, cast: out.cast.filter(c => c.loreId !== i.focal.id && c.name !== i.focal.name) } }
    return out;
  }
}

describe('a personal saga re-rolled for a hard defect', () => {
  it('re-rolls on another piece of the soldier\'s own past, never a generic seed', async () => {
    const ai = new DropFocalOnce();
    const g = new Game(ai, 268);
    g.build('map-room'); g.build('lead-room');
    const merc = g.roster()[0]!;
    merc.character!.backstory = 'She mended mail at her mother\'s brazier before she could lift a sword. She left home the winter the forge went cold.';
    g.ensureLoreNode(merc);
    (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
    await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
    expect(ai.seeds.length).toBe(2);
    expect(ai.seeds[1]).not.toBe(ai.seeds[0]);
    expect(merc.character!.backstory).toContain(ai.seeds[1]!);
  });
});
