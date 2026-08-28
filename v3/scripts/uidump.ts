// Dump ONE real saga quest + the roster + the saga's cast, as JSON, to design the quest screen
// against real generated prose and real numbers rather than lorem ipsum.
// Usage: npx tsx scripts/uidump.ts [seed] [out]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins, slotThreshold } from '../src/engine/roll.js';
import { renderTags } from '../src/engine/tags.js';
import { unitWorth, unitStars } from '../src/engine/economy.js';

const seed = Number(process.argv[2] ?? 4242);
const out = process.argv[3] ?? '/home/irvan/.claude/jobs/80974e3b/tmp/uidump.json';
const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room');
let q: any = null, chain: any = null;
for (let c = 0; c < 8 && !q; c++) {
  for (const lead of [...g.visibleLeads()]) {
    if (!lead.chainInfo?.kind || lead.chainInfo.kind === 'none') continue;
    const r = await g.pursue(lead.id);
    if (!r.ok || !r.questId) continue;
    q = g.state.quests.find(x => x.id === r.questId);
    chain = g.state.chains.find(ch => ch.id === q.chainId);
    break;
  }
  if (!q) await g.endCycle();
}
if (!q) { console.error('no saga quest'); process.exit(1) }
const roster = g.roster().filter(m => m.location.kind === 'held').map(m => ({
  id: m.id, name: m.name, level: m.character!.level, tags: renderTags(m.tags),
  worth: Math.round(unitWorth(m)), stars: unitStars(m),
  injured: m.character!.injuryTiers > 0,
  attrs: m.character!.attrs,
}));
fs.writeFileSync(out, JSON.stringify({
  quest: {
    id: q.id, title: q.title, situation: q.situation, job: q.job, rarity: q.rarity,
    level: q.level, region: q.region, beat: q.beatIndex, isFinale: q.isFinale,
    lapsesAtCycle: q.createdCycle + 8, cycle: g.state.cycle,
    rewardKinds: q.rewardSpecs.map((r: any) => r.kind),
    slots: q.slots.map((s: any, i: number) => ({
      idx: i, attributes: s.test.attributes, difficulty: s.test.difficulty,
      bar: slotThreshold(s.test), favored: s.test.favored, clashing: s.test.clashing,
      requirement: s.requirement,
      fits: g.roster().filter(m => m.location.kind === 'held')
        .map(m => ({ id: m.id, name: m.name, coins: coins(m, s.test) }))
        .sort((a, b) => b.coins - a.coins),
    })),
  },
  roster,
  cast: (chain?.bible.cast ?? []).map((m: any) => ({
    name: m.name, trade: m.trade, who: m.who, role: m.role, loreId: m.loreId,
    met: `${chain.bible.goal} ${(chain.story.introducedNames ?? []).join(' ')}`.includes(m.name.split(' ')[0]),
  })),
  bible: { goal: chain?.bible.goal, stakeIfLost: chain?.bible.stakeIfLost, arrival: chain?.bible.arrival },
  gold: g.gold(),
}, null, 1));
console.log('wrote', out, '·', q.title);
