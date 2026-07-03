// Real-AI smoke test: a handful of cycles with OpenAI — genesis, beat, resolution,
// theme roll. Prints the prose so quality is judgeable. Cheap (~10 calls).
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';

const g = new Game(makeOpenAiProvider(), Number(process.argv[2] ?? 42));

async function fillAndEnd() {
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) g.chooseApproach(q.id, q.approaches[0]!.id);
    for (let i = 0; i < q.slots.length; i++) {
      const s = q.slots[i]!;
      if (s.filledBy || (q.approaches && s.groupId !== q.chosenApproach)) continue;
      const free = g.roster().find(m => m.location.kind === 'held');
      if (free) g.assign(q.id, i, free.id);
    }
  }
  const report = await g.endCycle();
  for (const line of report) console.log(`   ${line}`);
}

console.log('— building map room, pursuing a one-off —');
g.build('map-room');
const oneOff = g.visibleLeads().find(l => l.chainInfo.kind === 'none')!;
let r = await g.pursue(oneOff.id);
const q1 = g.state.quests[0]!;
console.log(`\n[ONE-OFF CARD] ${q1.title}\n${q1.situation}\nJOB: ${q1.job}`);
for (const s of q1.slots) console.log(`  slot: ${s.test.attributes.join('+')} ${s.test.difficulty} favors=${s.test.favored} clashes=${s.test.clashing}`);
await fillAndEnd();

console.log('\n— pursuing the story lead (genesis + beat 1) —');
const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
r = await g.pursue(story.id);
console.log(r.msg);
const chain = g.state.chains[0]!;
console.log(`\n[BIBLE] ${chain.bible.title}\nkernel: ${chain.bible.kernel}\ngoal: ${chain.bible.goal}\narc: ${chain.bible.arc.join(' → ')}\ncast: ${chain.bible.cast.map(c => `${c.name} (${c.role}: ${c.who})`).join('\n      ')}\ntwist: ${chain.bible.twist ?? '(none)'}`);
const beat = g.state.quests.find(x => x.chainId === chain.id)!;
console.log(`\n[BEAT 1 CARD] ${beat.title}\n${beat.situation}\nJOB: ${beat.job}`);
await fillAndEnd();

console.log('\n— theme roll (renovation) —');
g.build('garden');
const garden = g.state.fort.rooms.find(x => x.type === 'garden')!;
g.addGold(100);
const ren = await g.renovate(garden.id, 'elven');
console.log(ren.msg);

const u = g.ai.usage();
console.log(`\nAI usage: ${u.calls} calls · ${u.inputTokens} in / ${u.outputTokens} out · ~$${u.costUsd.toFixed(3)}`);
