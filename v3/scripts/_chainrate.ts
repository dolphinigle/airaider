// What fraction of leads start a saga, and how many sagas a campaign actually sees.
import { rollFreshLead } from '../src/engine/quests.js';
import { Rng } from '../src/engine/rng.js';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';

console.log('── per-lead chance, by Great Hall tier (rollFreshLead is the only roller) ──');
for (const ghTier of [1, 2, 3, 5]) {
  const rng = new Rng(3); let n = 0, c = 0;
  const byR: Record<string, [number, number]> = {};
  for (let i = 0; i < 40000; i++) {
    const l = rollFreshLead(rng, { cycle: 5, rosterLevels: [3, 3], unlockedRegions: ['forests'],
      ghTier, hasDungeon: true, recentArchetypes: [] } as never, () => `l${i}`, 'reward');
    n++; const isC = l.chainInfo.kind === 'starts-new'; if (isC) c++;
    byR[l.rarity] ??= [0, 0]; byR[l.rarity]![0]++; if (isC) byR[l.rarity]![1]++;
  }
  const mix = Object.entries(byR).map(([r, [t, k]]) => `${r} ${(100*t/n).toFixed(0)}%→${(100*k/t).toFixed(0)}%`).join(' · ');
  console.log(`  GH T${ghTier}: ${(100*c/n).toFixed(1)}% of fresh leads start a saga   [${mix}]`);
}

console.log('\n── in play: a 40-cycle campaign, mock AI, auto-assigning everything ──');
let chains = 0, cycles = 0, leadsSeen = 0, runs = 0;
for (let s = 0; s < 6; s++) {
  const g = new Game(new MockProvider(s), s);
  g.build('map-room'); g.build('dungeon');
  const seen = new Set<string>();
  for (let c = 0; c < 40; c++) {
    for (const l of g.visibleLeads()) if (!seen.has(l.id)) { seen.add(l.id); await g.pursue(l.id) }
    g.autoAssignAll();
    await g.endCycle();
    cycles++;
  }
  chains += g.state.chains.length; leadsSeen += seen.size; runs++;
}
console.log(`  ${runs} campaigns × 40 cycles`);
console.log(`  sagas started: ${(chains/runs).toFixed(1)} per campaign  (${(chains/cycles).toFixed(2)} per cycle)`);
console.log(`  leads pursued: ${(leadsSeen/runs).toFixed(1)} per campaign → ${(100*chains/leadsSeen).toFixed(0)}% of pursued leads were sagas`);
