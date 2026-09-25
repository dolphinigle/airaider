// A saga focal handed over at its finale keeps role 'captive' while out in the world. The slate
// dealt that person to the next genesis as BOTH outOfReach and "held in the company's cells", and
// the writer took the phrase: a priest the company gave away came back "held in the company's
// cells" in a fort with no dungeon (playtest 2026-09-25).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { guardEdges } from '../src/engine/lore.js';
import type { GenesisInput, GenesisOut } from '../src/ai/provider.js';

class SlateSpy extends MockProvider {
  slates: GenesisInput['slate'][] = [];
  override genesis(i: GenesisInput): Promise<GenesisOut> { this.slates.push(i.slate); return super.genesis(i) }
}

describe('the lore slate', () => {
  it('never calls someone out in the world "held in the company\'s cells"', async () => {
    const ai = new SlateSpy();
    const g = new Game(ai, 21);
    g.build('map-room'); g.build('lead-room');
    const [merc, gone] = [g.roster()[0]!, g.roster()[1]!];
    g.ensureLoreNode(merc); g.ensureLoreNode(gone);
    gone.character!.role = 'captive';
    gone.location = { kind: 'held', state: 'lore' } as never;
    guardEdges(g.state.lore, [{ from: merc.id, to: gone.id, type: 'rival-of', blurb: 'they fell out on the road', importance: 0.9 }], 1, () => 'e1');
    (g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
    await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
    const entry = (ai.slates.at(-1) ?? []).find(e => e.id === gone.id);
    expect(entry).toBeDefined();
    expect(entry!.outOfReach).toBe(true);
    expect(entry!.relationPhrase).not.toMatch(/cells/);
  });
});
