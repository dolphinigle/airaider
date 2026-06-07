// PLAYTEST v2 (real AI) — plays WELL (best-fit assignment, concentrate mercs, build bedrooms, heal) so
// win-rate is representative and we see SUCCESSFUL finales with the new resolution-length scaling.
// Captures every resolution with its budget tier + actual word counts, dumps finales/beats in full to
// READ for coherence, and asserts the same invariants as _exp_playtest. Iterative-improvement tool.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { BALANCE } from './core/economy.js';
import type { AICallRecord } from './core/ai.js';
import type { CharacterCard, Quest } from './core/types.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const wc = (s: string) => strip(s).trim().split(/\s+/).filter(Boolean).length;
const CYCLES = Number(process.argv[3] || 10);

const calls: AICallRecord[] = [];
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: process.argv[2] || 'pt2v', onCall: (r) => calls.push(r) });

const bugs: string[] = [];
const note = (c: boolean, m: string) => { if (!c) bugs.push(m); };
const fit = (m: CharacterCard, q: Quest, i: number) => { const t = q.slots[i].tested; let s = m.attrs[t.attribute]; for (const f of t.favored) { const tag = m.tags.find((x) => x.id === f); if (tag) s += BALANCE.favoredBonus(tag.tier); } return s - m.injuries.length * 2; };
// resolution captures: { pos, rarity, outcome, before, after } to eyeball the length scaling
const res: Array<{ pos: string; rarity: string; outcome: string; bw: number; aw: number; finaleText?: string }> = [];

for (let c = 0; c < CYCLES; c++) {
  // upkeep: heal a hurt merc, give a homeless merc a bedroom (raises level cap → leveling → win-rate)
  for (const m of eng.mercs()) if (m.injuries.length && eng.gold > 200) eng.healInjury(m.id);
  // pursue: chains first, then a couple of one-offs — but DON'T drain every merc; leave fit ones for chains
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  let pursuedOneOffs = 0;
  for (const l of leads) {
    if (eng.freeMercs().length <= 1) break;
    if (l.chain.kind === 'none') { if (pursuedOneOffs >= 2) continue; pursuedOneOffs++; }
    let q: any; try { q = await eng.pursue(l.id); } catch (e) { bugs.push(`THREW pursue: ${String(e).slice(0,100)}`); continue; }
    if (!q || 'error' in q) continue;
    note(!!q.reward && q.slots.length >= 1, `quest ${q.id} malformed`);
    if (q.finale) note(q.immediate !== true, `finale ${q.id} marked immediate`);
  }
  // assign BEST-FIT, concentrating (grouped finale: best group+merc)
  for (const q of eng.activeQuests()) {
    if (q.groups) { let best: any = null; for (const g of q.groups) { const i = g.slotIndices[0]; for (const m of eng.eligibleMercs(q, i)) { const f = fit(m, q, i); if (!best || f > best.f) best = { i, m: m.id, f }; } } if (best) eng.assign(q.id, best.i, best.m); }
    else for (let i = 0; i < q.slots.length; i++) { if (q.slots[i].filledBy) continue; const e = eng.eligibleMercs(q, i).sort((a, b) => fit(b, q, i) - fit(a, q, i)); if (e.length) eng.assign(q.id, i, e[0].id); }
  }
  let results: any[]; try { results = await eng.endDay(); } catch (e) { bugs.push(`THREW endDay c${c}: ${String(e).slice(0,140)}`); break; }
  for (const r of results) {
    const pos = r.chainDone ? 'finale' : 'beat/oneoff';
    if (r.outcome !== 'failure') note(r.delivered?.length > 0, `${pos} ${r.outcome} delivered NOTHING`);
    console.log(`c${c} ${r.chainDone ? 'FINALE' : '(quest)'} ${r.outcome.toUpperCase()} | before=${wc(r.beforeText)}w after=${wc(r.afterText)}w | ${r.delivered?.map(strip).join(' | ')||'—'}`);
    if (r.chainDone) console.log(`   FINALE AFTER: ${strip(r.afterText)}`);
  }
  note(eng.gold >= 0, `gold negative c${c}`);
  for (const ch of Object.values(eng.state.chains)) note(Number.isFinite(ch.bank ?? 0) && (ch.bank ?? 0) >= 0, `bank invalid ${ch.title}`);
}

// hallucination scan
let badImm = 0, sawImm = 0;
for (const rec of calls.filter((r) => r.kind === 'chainBeat')) { try { const j = JSON.parse(rec.response); if ('immediateReward' in j) { sawImm++; if (typeof j.immediateReward !== 'boolean' && j.immediateReward !== 'true' && j.immediateReward !== 'false' && j.immediateReward !== null) badImm++; } } catch {} }
// resolution length adherence: pull before/after word counts from outcome calls vs the budget in the prompt
const lenRows: string[] = [];
for (const rec of calls.filter((r) => r.kind === 'outcome')) {
  try { const j = JSON.parse(rec.response); const bBudget = /"beforeRoll": "([\d-]+) words/.exec(rec.system)?.[1]; const aBudget = /"afterRoll": "([\d-]+) words/.exec(rec.system)?.[1]; const fin = /THIS IS THE CLIMAX/.test(rec.system); lenRows.push(`${fin ? 'FINALE ' : '       '} budget ${aBudget} → ${wc(j.afterRoll)}w (before ${bBudget}→${wc(j.beforeRoll)}w)`); } catch {}
}

console.log(`\n==== PLAYTEST v2 SUMMARY (${CYCLES} cycles, ${calls.length} AI calls) ====`);
const outc = (k: string) => calls.length; // placeholder
console.log(`final gold=${eng.gold} mercs=${eng.mercs().length} captives=${eng.captives().length} liabilities=${eng.liabilities().length}`);
console.log(`immediateReward field seen=${sawImm} hallucinated(non-bool)=${badImm}`);
console.log(`\n-- resolution length adherence (budget → actual) --\n${lenRows.join('\n')}`);
console.log(bugs.length ? `\n✗ ${bugs.length} BUG(S):\n - ${bugs.join('\n - ')}` : `\n✓ no invariant violations`);
