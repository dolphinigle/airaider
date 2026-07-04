// Regression tests for the conformance-audit round (IMPL_NOTES #30-38).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { auditGame } from '../src/game/audit.js';
import { HELD, mintStackable, freshId } from '../src/engine/cards.js';
import { hasTag } from '../src/engine/tags.js';
import type { GenesisInput, GenesisOut } from '../src/ai/provider.js';

function richGame(seed = 51): Game {
  const g = new Game(new MockProvider(seed), seed);
  g.state.cards.push(mintStackable('gold', 100000));
  return g;
}

describe('audit-fix regressions', () => {
  it('#30 ownership: a limbo chain focal cannot be ransomed/interrogated mid-chain', async () => {
    const g = richGame();
    g.build('map-room'); g.build('lead-room'); g.build('dungeon');
    g.state.fort.ghTier = 6;
    g.build('interrogation');
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    await g.pursue(story.id);
    const chain = g.state.chains[0]!;
    const focal = g.card(chain.focalId)!;
    expect(focal.location).toEqual(HELD('limbo'));
    expect(g.ransom(focal.id).ok).toBe(false);
    expect(g.interrogate(focal.id).ok).toBe(false);
    // and a lore-state (slipped/ransomed) character is equally untouchable
    focal.location = HELD('lore');
    expect(g.ransom(focal.id).ok).toBe(false);
  });

  it('#31 collector: lead is one-off, one live collector per liability incl. open quests', async () => {
    const g = richGame(53);
    g.build('map-room'); g.build('lead-room');
    const debt = mintStackable('debt', 500);
    g.state.cards.push(debt);
    g.state.liabilityBirth[debt.id] = -999;   // ancient — trigger-eligible
    // run cycles until the collector fires
    let collector = null;
    for (let i = 0; i < 60 && !collector; i++) {
      await g.endCycle();
      collector = g.state.leads.find(l => l.liabilityId === debt.id) ?? null;
    }
    expect(collector).not.toBeNull();
    expect(collector!.chainInfo.kind).toBe('none');           // never a chain
    await g.pursue(collector!.id);
    const q = g.state.quests.find(x => x.liabilityId === debt.id)!;
    expect(q).toBeDefined();
    // while the collection quest is OPEN, no second collector spawns
    for (let i = 0; i < 6; i++) {
      // don't man the quest — just tick; TTL is 10 so it stays open
      await g.endCycle();
      const dupes = g.state.leads.filter(l => l.liabilityId === debt.id);
      expect(dupes.length).toBeLessThanOrEqual(0 + 1); // the (unpursued) new one only after quest expiry
      if (g.state.quests.some(x => x.liabilityId === debt.id && x.state === 'open')) {
        expect(dupes).toHaveLength(0);
      }
    }
  });

  it('#33 name guard: AI-invented cast names are replaced with engine-rolled ones', async () => {
    const g = richGame(57);
    g.build('map-room'); g.build('lead-room');
    // a naughty provider that invents names
    const naughty = Object.create(g.ai) as typeof g.ai;
    naughty.genesis = async (input: GenesisInput): Promise<GenesisOut> => ({
      title: 'The Test', kernel: 'k', situation: 's', goal: 'g',
      cast: [
        { name: input.focal.name, who: 'the focal', want: 'w', role: 'focal' },
        { name: 'Zanzibar McInvented', who: 'a fraud', want: 'w', role: 'broker' },
        { name: 'Lord Fakename III', who: 'another fraud', want: 'w', role: 'villain' },
      ],
      arc: [], twistReveal: null, tensions: [], openDirections: ['a', 'b'],
      relevantIds: [], newPlaces: [], newEdges: [],
    });
    (g as { ai: typeof g.ai }).ai = naughty;
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    await g.pursue(story.id);
    const chain = g.state.chains[0]!;
    const names = chain.bible.cast.map(c => c.name);
    expect(names).not.toContain('Zanzibar McInvented');
    expect(names).not.toContain('Lord Fakename III');
    expect(names[0]).toBe(g.card(chain.focalId)!.name);   // focal keeps the engine name
  });

  it('#34 Outskirts: all 4 spine keys open it; Underdeep is NOT a key', () => {
    const g = richGame(59);
    g.state.fort.ghTier = 15;
    g.state.cards.push(mintStackable('gold', 10_000_000));
    for (let i = 0; i < 20; i++) g.excavate();
    // open the spine regions (prev-gating) then build endgame keys
    for (const r of ['forests', 'city', 'coast', 'highlands']) {
      expect(g.build(`scouting-${r}`).ok, `scouting-${r}`).toBe(true);
    }
    g.build('scouting-underdeep');
    expect(g.build('endgame-underdeep').ok).toBe(true);   // branch key — must NOT count
    for (const r of ['forests', 'city', 'coast']) expect(g.build(`endgame-${r}`).ok).toBe(true);
    expect(g.state.unlockedRegions).not.toContain('outskirts');
    expect(g.build('endgame-highlands').ok).toBe(true);   // 4th spine key
    expect(g.state.unlockedRegions).toContain('outskirts');
    expect(auditGame(g)).toEqual([]);
  });

  it('#35 one debt rule: finale debt equals the bank shortfall exactly', async () => {
    const g = richGame(61);
    g.build('map-room'); g.build('lead-room');
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    await g.pursue(story.id);
    const chain = g.state.chains[0]!;
    chain.cyclesSpent = 999; chain.bank = 40;
    for (const q of [...g.state.quests]) g.abandon(q.id);
    g.state.leads.push({
      id: freshId('lead-'), rarity: chain.rarity, level: chain.level, region: chain.region,
      archetype: 'investigate', chainInfo: { kind: 'continues', chainId: chain.id, hook: 'x' },
      expiresAtCycle: g.state.cycle + 5, source: 'continuation',
    });
    await g.pursue(g.state.leads[g.state.leads.length - 1]!.id);
    const finale = g.state.quests.find(q => q.isFinale)!;
    // recruit approach; strong merc for a likely success
    const rec = finale.approaches!.find(a => a.rewardKind === 'recruit') ?? finale.approaches![0]!;
    g.chooseApproach(finale.id, rec.id);
    const slotIdx = finale.slots.findIndex(s => s.groupId === rec.id);
    const merc = g.roster()[0]!;
    merc.character!.attrs = { str: 500, dex: 500, int: 500, cha: 500, con: 500 };
    g.assign(finale.id, slotIdx, merc.id);
    await g.endCycle();
    if (chain.state === 'done' && rec.rewardKind !== 'gold') {
      const focal = g.card(chain.focalId)!;
      const expected = Math.max(0, Math.round(focal.value - 40));
      const debts = g.state.cards.filter(c => hasTag(c.tags, 'debt'));
      const totalDebt = debts.reduce((s, d) => s + (d.qty ?? 0), 0);
      expect(totalDebt).toBe(expected);
    }
  });

  it('#36 capacity from cellSlots; multiBuild fields honored', () => {
    const g = richGame(63);
    g.state.fort.ghTier = 6;
    expect(g.captiveCapacity()).toBe(0);
    g.build('dungeon-cell'); g.build('dungeon-cell');
    expect(g.captiveCapacity()).toBe(6);              // 2 × cellSlots(3)
    expect(g.build('map-room').ok).toBe(true);
    expect(g.build('map-room').ok).toBe(false);       // not multiBuild
  });
});
