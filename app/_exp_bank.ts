// REWARD-BANK validation (mock, offline, deterministic). Drives a starts-new chain beat-by-beat,
// FORCING each beat's outcome to a scripted pattern, and prints bank accrual + finale crystallization.
// Scenarios: all-success · mid-failures-within-budget · budget-blown→last-chance · finale-failure.
import { GameEngine } from './core/game.js';
import type { Chain } from './core/types.js';

const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');

// pattern: 'S' force success (threshold 1) · 'F' force failure (threshold 99). Indexed by beat number.
// opts.group: which finale approach-group to staff ('winover' recruit / 'subdue' captive / 'ransom' gold).
// opts.arc/opts.budget: override the arc length / failure budget once the chain exists (to test last-chance).
async function run(label: string, pattern: string, opts: { group?: string; arc?: number; budget?: number; focalValue?: number } = {}) {
  const eng = await GameEngine.create({ provider: 'mock', seed: `bank-${label}` });
  let chainId = '';
  let beatN = 0;
  const goldBefore = eng.gold;
  console.log(`\n###### ${label}  pattern=${pattern}${opts.group ? ` group=${opts.group}` : ''}${opts.arc ? ` arc→${opts.arc} budget→${opts.budget}` : ''}`);
  for (let c = 0; c < 20; c++) {
    // pursue: start the chain, then follow its continuation lead
    let pursued = false;
    if (!chainId) {
      const l = eng.leads().find((x) => x.chain.kind === 'starts-new');
      if (l) { const q: any = await eng.pursue(l.id); if (!('error' in q)) { chainId = q.chainId; pursued = true;
        const ch = eng.state.chains[chainId] as Chain;
        if (opts.arc) ch.arc = Array.from({ length: opts.arc }, (_, i) => `step ${i + 1}`);
        if (opts.budget !== undefined) ch.failBudget = opts.budget;
        if (opts.focalValue !== undefined) (eng.state.cards[ch.focalCardIds[0]] as any).value = opts.focalValue;
        console.log(`  chain "${strip(ch.title)}" rarity=${ch.rarity} arc=${(ch.arc||[]).length} failBudget=${ch.failBudget} focalValue=${(eng.state.cards[ch.focalCardIds[0]] as any).value}`);
      } }
    } else {
      const cont = eng.leads().find((x) => x.chain.kind === 'continues' && x.chain.chainId === chainId);
      if (cont) { const q: any = await eng.pursue(cont.id); if (!('error' in q)) pursued = true; }
    }
    if (!pursued) { await eng.endDay(); if (eng.state.chains[chainId]?.state === 'done') break; continue; }

    // assign + force this beat's outcome
    beatN++;
    const force = (pattern[beatN - 1] ?? 'S') === 'F' ? 99 : 1;
    for (const aq of eng.activeQuests()) {
      if (aq.groups) {
        // staff exactly ONE approach-group (default the first), so we see that group's payout path
        const g = aq.groups.find((x: any) => x.id === opts.group) ?? aq.groups[0];
        for (const i of g.slotIndices) { const e = eng.eligibleMercs(aq, i); if (e.length) eng.assign(aq.id, i, e[0].id); }
        aq.groups.forEach((x: any) => x.threshold = force);
      } else {
        for (let i = 0; i < aq.slots.length; i++) { const e = eng.eligibleMercs(aq, i); if (e.length) eng.assign(aq.id, i, e[0].id); }
      }
      aq.threshold = force;
    }
    const activeBefore = eng.activeQuests().map((q) => ({ finale: q.finale }));
    const res = await eng.endDay();
    const ch = eng.state.chains[chainId] as Chain;
    const r0 = res[0];
    console.log(`  beat ${beatN}${activeBefore[0]?.finale ? ' (FINALE)' : ''}: ${r0?.outcome?.toUpperCase()}  bank=${ch?.bank}  failsSpent=${ch?.failsSpent}  lastChance=${!!ch?.lastChance}  → ${r0?.delivered?.map(strip).join(', ') || '—'}`);
    if (ch?.state === 'done') break;
  }
  console.log(`  GOLD gained: ${eng.gold - goldBefore}`);
}

await run('A recruit+surplus', 'SSSSSSSS', { group: 'winover' });   // bank ≫ focal → focal + surplus gold
await run('B subdue', 'SSSSSSSS', { group: 'subdue' });            // captive + surplus gold
await run('C ransom', 'SSSSSSSS', { group: 'ransom' });            // all bank as gold, focal sold
await run('D give-with-debt', 'SSSS', { group: 'winover', focalValue: 500 });  // bank 240 < 500, ≥40% → focal + debt
await run('D2 void-to-gold', 'SSSS', { group: 'winover', focalValue: 1000 });  // bank 240 < 40% of 1000 → focal slips, gold
await run('E last-chance early finale', 'SFF', { arc: 7, budget: 1 });  // budget 1, 2 fails → beat 4 forced finale (not 7)
await run('F finale-fail forfeits', 'SSSF', { group: 'winover' });  // succeed through, blow the finale → 0 reward
