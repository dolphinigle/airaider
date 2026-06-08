// QUALITY playtest: drive a real chain + one-offs, capture every prompt, and dump the PROSE (intros,
// offers, resolutions) + one FULL prompt per kind so we READ the writing and the prompt — not invariants.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import type { AICallRecord } from './core/ai.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const calls: AICallRecord[] = [];
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[2] || 'ql1', onCall: (r) => calls.push(r) });

// play ~6 cycles: pursue one-offs + chains, succeed everything so chains reach finales
for (let c = 0; c < 7; c++) {
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  for (const l of leads) { if (eng.freeMercs().length === 0) break; const q: any = await eng.pursue(l.id); if (!q || 'error' in q) continue; }
  for (const q of eng.activeQuests()) {
    if (q.groups) { const g = q.groups[0]; for (const i of g.slotIndices) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); } q.groups.forEach((x: any) => x.threshold = 1); }
    else for (let i = 0; i < q.slots.length; i++) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); }
    q.threshold = 1;
  }
  await eng.endDay();
}

const J = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };
console.log('\n===== INTROS (situation) — read for boss-POV, dialogue, clarity, smells =====');
for (const r of calls.filter((c) => c.kind === 'cardAsk' || c.kind === 'chainBeat')) {
  const j = J(r.response);
  console.log(`\n[${r.kind}] OFFER:[${j.offeredReward?.kind}] "${strip(j.offeredReward?.label)}"`);
  console.log(`  ${strip(j.situation)}`);
}
console.log('\n\n===== RESOLUTIONS (afterRoll) — read for dialogue, show-dont-tell, clear outcome, malus =====');
for (const r of calls.filter((c) => c.kind === 'outcome')) {
  const j = J(r.response);
  console.log(`\n  AFTER: ${strip(j.afterRoll)}`);
  if (j.malus && j.malus.kind !== 'none') console.log(`    malus:[${j.malus.kind}] "${strip(j.malus.label)}"`);
}
console.log('\n\n===== ONE FULL cardAsk (one-off) PROMPT — read the prompt itself =====');
const ca = calls.find((c) => c.kind === 'cardAsk');
if (ca) { console.log('--- SYSTEM ---\n' + ca.system); console.log('\n--- USER ---\n' + ca.user); console.log('\n--- RESPONSE ---\n' + ca.response); }
console.log('\n\n===== ONE FULL chainBeat PROMPT =====');
const cb = calls.find((c) => c.kind === 'chainBeat');
if (cb) { console.log('--- USER (bible+instruction) ---\n' + cb.user); }
