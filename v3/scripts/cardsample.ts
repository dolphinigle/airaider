// Card-voice sampler — generates a handful of REAL-AI one-off cards and prints them
// exactly as the player reads them (new merged briefing voice). No campaign, no resolutions.
// Usage: npx tsx scripts/cardsample.ts [seed] [count]

import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const seed = Number(process.argv[2] ?? 31001);
const count = Number(process.argv[3] ?? 5);

const g = new Game(makeOpenAiProvider(), seed);

async function main() {
  g.build('map-room');
  let printed = 0;
  for (let c = 0; c < 8 && printed < count; c++) {
    for (const lead of [...g.visibleLeads()]) {
      if (printed >= count) break;
      if (lead.chainInfo?.kind && lead.chainInfo.kind !== 'none') continue; // one-offs only
      const r = await g.pursue(lead.id);
      if (!r.ok || !r.questId) continue;
      const q = g.state.quests.find(x => x.id === r.questId)!;
      printed++;
      console.log(`\n═══ ${q.title} ═══  (${q.rarity} ${q.archetype})`);
      console.log(q.situation);
      console.log(`[list line: ${q.job}]`);
      console.log(`[reward: ${q.rewardSpecs.map(s => s.kind).join(' + ')}]`);
      for (const rc of q.rewardCards.filter(c => c.character)) {
        const { renderTags } = await import('../src/engine/tags.js');
        console.log(`[reward person: ${rc.name} — ${renderTags(rc.tags)}]`);
      }
      for (const s of q.slots) {
        const t = (s as any).test;
        if (!t) continue;
        console.log(`[slot: ${t.attributes.join('/')} · favors ${t.favored.join(', ') || '—'} · clashes ${t.clashing.join(', ') || '—'}]`);
      }
    }
    await g.endCycle();
  }
  console.log(`\nAI: ~$${g.ai.usage().costUsd.toFixed(2)}`);
}
main();
