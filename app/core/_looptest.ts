// Headless integration test: auto-plays full cycles with the MOCK narrator (offline,
// deterministic) to exercise pursue → assign → endDay → deliver → chains end-to-end.
// Run: npm run looptest
import { GameEngine } from './game.js';
import { isFilled } from './quest.js';

const eng = await GameEngine.create({ provider: 'mock', seed: 'loop1' });
const CYCLES = 12;

function autoAssign() {
  for (const q of eng.activeQuests()) {
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i].filledBy) continue;
      const elig = eng.eligibleMercs(q, i);
      if (elig.length) eng.assign(q.id, i, elig[0].id);
    }
  }
}

let sagas = 0, finales = 0, deaths = 0, recruits = 0, captiveCount = 0, errors = 0;
for (let c = 0; c < CYCLES; c++) {
  // pursue: spend free mercs across leads (prefer chain continuations, then fillable)
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  for (const lead of leads) {
    if (eng.freeMercs().length === 0) break;
    const res = await eng.pursue(lead.id);
    if ('error' in res) { /* skip */ } else if (res.chainId) sagas++;
  }
  autoAssign();
  const filledCount = eng.activeQuests().filter(isFilled).length;
  const results = await eng.endDay();
  for (const r of results) {
    if (r.delivered.some((d) => /recruit|joins/.test(d))) recruits++;
    if (r.delivered.some((d) => /captive/.test(d))) captiveCount++;
    if (r.delivered.some((d) => /lost|grief/.test(d))) deaths++;
    if (r.chainDone) finales++;
  }
  console.log(`cycle ${c + 1}: quests=${results.length} filled=${filledCount} | gold=${eng.gold} mercs=${eng.mercs().length} captives=${eng.captives().length} prestige=${eng.globalPrestige()} liabilities=${eng.liabilities().length}`);
}

console.log(`\nsummary: sagas started=${Object.keys(eng.state.chains).length} chainDone=${finales} recruits=${recruits} captives=${captiveCount} deaths=${deaths} errors=${errors}`);
void sagas;
console.log('chains:', Object.values(eng.state.chains).map((c) => `"${c.title}" [${c.state}] beats=${c.beatsResolved}/${c.expectedBeats} cycles=${c.mercCyclesSpent}/${c.climaxTarget}`));
console.log('final roster:', eng.mercs().map((m) => `${m.name} L${m.level}${m.injuries.length ? ' (hurt)' : ''}`).join(', '));
console.log('✓ loop ran without throwing');
