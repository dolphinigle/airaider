// Capture REAL one-off writeQuest payloads from the engine (MockProvider — no API cost), so the
// pull lab's step-2 hit rate is measured on inputs the game actually deals, not fixtures I invent.
// Usage: npx tsx scripts/pullfixtures.ts [seedCount] [cyclesPerSeed] [outfile]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { AiProvider, QuestWriteInput } from '../src/ai/provider.js';

const seedCount = Number(process.argv[2] ?? 6);
const cycles = Number(process.argv[3] ?? 6);
const OUT = process.argv[4] ?? '/home/irvan/airaider/v3/scripts/prosebench/pull-fixtures.json';

const captured: QuestWriteInput[] = [];

/** delegating wrapper — records what the engine WOULD send the writer */
function recorder(inner: AiProvider): AiProvider {
  return new Proxy(inner, {
    get(t, p, r) {
      if (p === 'writeQuest') {
        return async (input: QuestWriteInput) => {
          if (input.kind === 'one-off') captured.push(structuredClone(input));
          return (t as AiProvider).writeQuest(input);
        };
      }
      return Reflect.get(t, p, r);
    },
  });
}

const ORDER = ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall',
  'infirmary', 'tavern', 'dining-hall', 'kitchen', 'garden', 'dungeon', 'holding-cell',
  'trophy-room', 'library', 'market', 'smithy', 'scouting-city', 'recruiting-city'];

for (let s = 0; s < seedCount; s++) {
  const seed = 500 + s * 1117;
  const g = new Game(recorder(new MockProvider(seed)), seed);
  for (let c = 0; c < cycles; c++) {
    if (g.freeCells().length === 0) g.excavate();
    for (const b of ORDER) {
      const st = g.buildableTypes().find(x => x.type === b);
      if (st && !st.reason) { g.build(b); break }
    }
    for (const lead of [...g.visibleLeads()]) await g.pursue(lead.id);
    // fill what we can so the campaign keeps moving and later-cycle leads appear
    for (const q of g.state.quests.filter(q => q.state === 'open')) {
      for (let i = 0; i < q.slots.length; i++) {
        const free = g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
        if (!free.length) break;
        g.assign(q.id, i, free[0]!.id);
      }
    }
    await g.endCycle();
  }
}

fs.writeFileSync(OUT, JSON.stringify(captured, null, 1));
const tally = (f: (i: QuestWriteInput) => string) => {
  const m: Record<string, number> = {};
  for (const i of captured) m[f(i)] = (m[f(i)] ?? 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ');
};
console.log(`captured ${captured.length} one-off payloads → ${OUT}`);
console.log('archetype  ', tally(i => i.archetype ?? '—'));
console.log('rarity     ', tally(i => i.rarity));
console.log('gravity    ', tally(i => i.gravity ?? '—'));
console.log('slotCount  ', tally(i => String(i.slotCount)));
console.log('envelope   ', tally(i => i.rewardEnvelope));
console.log('framedChar ', tally(i => i.framedCharacter ? (i.framedCharacter.partial ? 'partial' : 'full') : 'none'));
console.log('spark      ', tally(i => i.opening ? 'yes' : 'no'));
console.log('rewardItems', tally(i => i.rewardItems?.length ? 'yes' : 'no'));
