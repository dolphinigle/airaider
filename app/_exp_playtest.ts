// PLAYTEST (real AI) for the reward-bank + immediate/defer change. Plays many cycles pursuing BOTH
// one-offs and chains, capturing every prompt, and ASSERTS invariants that the change could have broken:
//  - one-offs still deliver a reward on success/partial
//  - chain finales crystallize (focal delivered OR gold OR, on failure, lost) — never silently empty
//  - immediateReward is a clean bool the AI doesn't hallucinate; the engine never applies it to a finale
//  - bank is finite & non-negative; gold never goes negative; nothing throws
// Also dumps the immediate/defer decision + prose per beat so it can be read for coherence.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import type { AICallRecord } from './core/ai.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const CYCLES = Number(process.argv[3] || 12);

const calls: AICallRecord[] = [];
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[2] || 'pt1', onCall: (r) => calls.push(r) });

const bugs: string[] = [];
const note = (cond: boolean, msg: string) => { if (!cond) bugs.push(msg); };
let oneOffs = 0, beats = 0, finales = 0, immediateBeats = 0, deferredBeats = 0;
let lastGold = eng.gold;

for (let c = 0; c < CYCLES; c++) {
  // pursue one-offs AND chains (chains first to drive genesis/beats), within free mercs
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  for (const l of leads) {
    if (eng.freeMercs().length === 0) break;
    let q: any;
    try { q = await eng.pursue(l.id); } catch (e) { bugs.push(`THREW in pursue(${l.chain.kind}): ${String(e).slice(0,120)}`); continue; }
    if (!q || 'error' in q) continue;
    // INVARIANT: every quest is born with a reward bundle + engine slots
    note(!!q.reward && Array.isArray(q.slots) && q.slots.length >= 1, `quest ${q.id} malformed at birth`);
    if (!q.chainId) oneOffs++;
    else if (q.finale) { finales++; note(q.immediate !== true, `FINALE ${q.id} wrongly marked immediate (engine should never defer-flag a finale)`); }
    else { beats++; if (q.immediate) immediateBeats++; else deferredBeats++; }
  }
  // assign best available (grouped finales: one group), force nothing — let real odds decide
  for (const q of eng.activeQuests()) {
    if (q.groups) { const g = q.groups[0]; for (const i of g.slotIndices) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); } }
    else for (let i = 0; i < q.slots.length; i++) { const e = eng.eligibleMercs(q, i); if (e.length) eng.assign(q.id, i, e[0].id); }
  }
  let results: any[];
  try { results = await eng.endDay(); } catch (e) { bugs.push(`THREW in endDay cycle ${c}: ${String(e).slice(0,160)}`); break; }
  for (const r of results) {
    const q = eng.state.quests[r.questId]; // already deleted; use result
    const tag = r.chainDone ? 'FINALE' : '(quest)';
    // INVARIANT: a non-failure quest delivered SOMETHING
    if (r.outcome !== 'failure') note(r.delivered && r.delivered.length > 0, `${tag} ${r.questId} ${r.outcome} delivered NOTHING`);
    console.log(`  c${c} ${tag} ${r.outcome.toUpperCase()}: ${r.delivered?.map(strip).join(' | ') || '—'}`);
  }
  // INVARIANTS: gold + every chain bank stay sane
  note(eng.gold >= 0, `gold went NEGATIVE (${eng.gold}) cycle ${c}`);
  for (const ch of Object.values(eng.state.chains)) {
    note(Number.isFinite(ch.bank ?? 0) && (ch.bank ?? 0) >= 0, `chain "${ch.title}" bank invalid: ${ch.bank}`);
    note((ch.failsSpent ?? 0) >= 0, `chain "${ch.title}" failsSpent invalid: ${ch.failsSpent}`);
  }
  lastGold = eng.gold;
}

// ---- scan EVERY chainBeat AI response for reward-type hallucination ----
let badImmediate = 0, sawImmediateField = 0;
for (const rec of calls.filter((r) => r.kind === 'chainBeat')) {
  try { const j = JSON.parse(rec.response); if ('immediateReward' in j) { sawImmediateField++; if (typeof j.immediateReward !== 'boolean' && j.immediateReward !== 'true' && j.immediateReward !== 'false' && j.immediateReward !== null) badImmediate++; } }
  catch { /* non-JSON response (shouldn't happen post-validate) */ }
}

console.log(`\n==== PLAYTEST SUMMARY (${CYCLES} cycles, ${calls.length} AI calls) ====`);
console.log(`one-offs=${oneOffs} · chain beats=${beats} (immediate=${immediateBeats} deferred=${deferredBeats}) · finales=${finales}`);
console.log(`chainBeat responses with immediateReward field: ${sawImmediateField} · non-bool (hallucinated): ${badImmediate}`);
console.log(`final gold=${eng.gold} · mercs=${eng.mercs().length} · captives=${eng.captives().length} · liabilities=${eng.liabilities().length}`);
console.log(bugs.length ? `\n✗ ${bugs.length} BUG(S):\n - ${bugs.join('\n - ')}` : `\n✓ no invariant violations`);

// dump 2 chainBeat prompts+responses to read for coherence
console.log(`\n==== SAMPLE chainBeat PROMPT+RESPONSE (read for coherence) ====`);
for (const rec of calls.filter((r) => r.kind === 'chainBeat').slice(0, 1)) {
  console.log(`--- SYSTEM (head) ---\n${rec.system.slice(0, 400)}`);
  console.log(`--- USER ---\n${rec.user.slice(0, 900)}`);
  console.log(`--- RESPONSE ---\n${rec.response.slice(0, 700)}`);
}
