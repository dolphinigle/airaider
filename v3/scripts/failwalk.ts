// Supplemental: exercise the FAILURE surface a new player sees — assign a 0-coin merc
// (guaranteed loss), end cycle, read the failure narration + injury line + heal ETA,
// then watch the wounded-roster view next cycle.
// Usage: npx tsx scripts/failwalk.ts [seed]
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { coins } from '../src/engine/roll.js';
import { renderTags } from '../src/engine/tags.js';

const seed = Number(process.argv[2] ?? 77001);
const g = new Game(makeOpenAiProvider(), seed);
const P = (s = '') => console.log(s);

async function main() {
  g.build('map-room');
  // pursue the lead whose quest both starter mercs have 0 coins against (seed 77001: contract)
  for (const arch of ['contract', 'raid']) {
    const l = g.visibleLeads().find(x => x.archetype === arch && x.chainInfo.kind === 'none');
    if (l) await g.pursue(l.id);
  }
  for (const q of g.state.quests.filter(x => x.state === 'open')) {
    P(`\nQUEST: ${q.title}`);
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i]!.filledBy) continue;
      const free = g.roster().filter(m => m.location.kind === 'held');
      if (!free.length) break;
      // WORST merc on purpose — the player sends someone hopeless
      const worst = free.sort((a, b) => coins(a, q.slots[i]!.test) - coins(b, q.slots[i]!.test))[0]!;
      g.assign(q.id, i, worst.id);
      P(`  slot ${i}: sent ${worst.name} with ${coins(worst, q.slots[i]!.test)} coins vs bar — dropdown warned "${coins(worst, q.slots[i]!.test)}c"`);
    }
    const o = g.questOdds(q.id);
    P(`  ODDS line: ${o.coins} coins vs bar ${o.bar.toFixed(1)} (build an Oracle for %)`);
  }
  for (let c = 0; c < 3; c++) {
    P(`\n▶ END CYCLE ${g.state.cycle} — report verbatim:`);
    for (const line of await g.endCycle()) P(`   ${line}`);
    P(`▶ ROSTER after:`);
    for (const m of g.roster()) {
      const ch = m.character!; const eta = g.healEta(m);
      P(`   ${m.name} L${ch.level} · ${ch.injuryTiers > 0 ? `🩸${ch.injuryTiers} tiers (~${eta.cycles}c to heal${eta.viaInfirmary ? ' in infirmary' : ' resting'})` : 'healthy'} · tags: ${renderTags(m.tags)}`);
    }
    if (g.roster().every(m => m.character!.injuryTiers === 0) && g.state.quests.every(q => q.state !== 'open')) break;
  }
  const u = g.ai.usage();
  P(`\n════ AI: ${u.calls} calls · $${u.costUsd.toFixed(3)} ════`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) });
