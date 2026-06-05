// CONFORMANCE HARNESS — the test that would have caught the bugs I missed.
// It does NOT just read prose; it asserts (1) AI-call COVERAGE (every Narrator method
// the flowchart requires actually fires — catches dead code like the unused flesh call),
// (2) STATE INTEGRITY of delivered characters (name/who/backstory/quirks per CARDS.md —
// catches "looked fleshed in prose but the card was empty"), and (3) FLOWCHART INVARIANTS
// (engine-set N before AI; reward fixed at birth; AI proposedReward consumed; chains
// conclude or spawn a sequel). Run: npm run conformance
import { initGame, allMercs, captives } from './state.js';
import { stockLeadBoard } from './leads.js';
import { rngFrom } from './rng.js';
import { GameEngine } from './game.js';
import { MockNarrator, type Narrator } from './ai.js';
import { BALANCE } from './economy.js';
import type { Quest, CharacterCard } from './types.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.error('  ✗ ' + m); } };

// ---- a Narrator that counts every method call (coverage) --------------------
class CountingNarrator implements Narrator {
  readonly kind = 'mock' as const;
  inner = new MockNarrator();
  calls: Record<string, number> = { cardAsk: 0, outcome: 0, flesh: 0, genesis: 0, chainBeat: 0, conceptTags: 0 };
  lastProposed = '';
  outcomeProposalsSeen = 0; outcomeLearnedReturned = 0;   // resolution consumes the beat's proposal → learned/loot
  cardAsk(i: Parameters<Narrator['cardAsk']>[0]) { this.calls.cardAsk++; return this.inner.cardAsk(i); }
  async outcome(i: Parameters<Narrator['outcome']>[0]) { this.calls.outcome++; if (i.proposedReveal || i.proposedLoot) this.outcomeProposalsSeen++; const o = await this.inner.outcome(i); if (o.learned || o.loot) this.outcomeLearnedReturned++; return o; }
  flesh(i: Parameters<Narrator['flesh']>[0]) { this.calls.flesh++; return this.inner.flesh(i); }
  genesis(i: Parameters<Narrator['genesis']>[0]) { this.calls.genesis++; return this.inner.genesis(i); }
  async chainBeat(i: Parameters<Narrator['chainBeat']>[0]) { this.calls.chainBeat++; const o = await this.inner.chainBeat(i); this.lastProposed = o.proposedReward; return o; }
  conceptTags(i: Parameters<Narrator['conceptTags']>[0]) { this.calls.conceptTags++; return this.inner.conceptTags(i); }
}

const state = initGame('conformance');
const ai = new CountingNarrator();
const eng = new GameEngine(state, ai);
stockLeadBoard(state, rngFrom(`${state.seed}:board:${state.cycle}`));

// ---- play many cycles, asserting invariants the whole way --------------------
let beatRewardsChecked = 0, beatRewardsThemed = 0, finalesSeen = 0, chainsConcluded = 0;
const sequelLeadIds = new Set<string>();   // accumulate across the whole run (they get pursued/expire)
const before = new Set(Object.keys(state.chains));
const slotFit = (m: CharacterCard, q: Quest, i: number) => {
  const t = q.slots[i].tested; let s = m.attrs[t.attribute];
  for (const f of t.favored) { const tag = m.tags.find((x) => x.id === f); if (tag) s += BALANCE.favoredBonus(tag.tier); }
  return s - m.injuries.length * 2;
};

for (let c = 0; c < 30; c++) {
  // pursue everything fillable, chains first (to drive genesis/chainBeat/finale)
  const leads = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 1 : 0) - (a.chain.kind !== 'none' ? 1 : 0));
  for (const lead of leads) {
    if (eng.freeMercs().length === 0) break;
    const q = await eng.pursue(lead.id);
    if (q && !('error' in q)) {
      // INVARIANT: N is engine-set and the reward bundle exists BEFORE assignment (reward-first)
      ok(q.slots.length >= 1, 'quest has engine-set slots before assignment');
      ok(!!q.reward, 'reward bundle fixed at quest birth');
      // INVARIANT: a chain beat carries the AI's PROPOSED reveal + loot (resolution decides the actuals)
      if (q.chainId && !q.finale) {
        beatRewardsChecked++;
        if (q.proposedLoot || q.stakes) beatRewardsThemed++;
      }
      if (q.finale) finalesSeen++;
    }
  }
  // assign best-fit (grouped finales: pick the branch+merc with the best fit, so finales can succeed)
  for (const q of eng.activeQuests()) {
    if (q.groups) {
      let best: { slot: number; merc: string; fit: number } | null = null;
      for (const g of q.groups) { const i = g.slotIndices[0]; for (const m of eng.eligibleMercs(q, i)) { const fit = slotFit(m, q, i); if (!best || fit > best.fit) best = { slot: i, merc: m.id, fit }; } }
      if (best) eng.assign(q.id, best.slot, best.merc);
      // force the finale to LAND (low threshold) so the success-only sequel path is exercised
      q.threshold = 1; q.groups.forEach((g) => { g.threshold = 1; });
      continue;
    }
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i].filledBy) continue;
      const e = eng.eligibleMercs(q, i).sort((a, b) => slotFit(b, q, i) - slotFit(a, q, i));
      if (e.length) eng.assign(q.id, i, e[0].id);
    }
  }
  // record sequel leads as they appear (before they're pursued/expire)
  for (const l of eng.leads()) if (l.sequelOf) sequelLeadIds.add(l.id);
  const results = await eng.endDay();
  for (const r of results) if (r.chainDone) chainsConcluded++;
  for (const l of eng.leads()) if (l.sequelOf) sequelLeadIds.add(l.id); // catch freshly-spawned sequels before next cycle pursues them

  // STATE INTEGRITY: every owned merc/captive is a COMPLETE character (CARDS.md)
  for (const ch of [...allMercs(state), ...captives(state)]) {
    ok(ch.name !== 'Unknown' && ch.name.length > 0, `owned character is named (${ch.id})`);
    ok(!!ch.who && ch.who.length > 0, `owned character has a who (${ch.name})`);
    ok(!!ch.backstory && ch.backstory.length > 0, `owned character has a backstory (${ch.name})`);
    ok(ch.quirks.length > 0, `owned character has quirks (${ch.name})`);
  }
  // INVARIANT: chains that concluded are 'done'; live ones spawn a continuation lead
  for (const chain of Object.values(state.chains)) {
    if (chain.state !== 'done') {
      const hasLead = eng.leads().some((l) => l.chain.kind === 'continues' && l.chain.chainId === chain.id)
        || eng.activeQuests().some((q) => q.chainId === chain.id);
      ok(hasLead, `live saga "${chain.title}" stays reachable (continuation lead or active quest)`);
    }
  }
}

for (const l of eng.leads()) if (l.sequelOf) sequelLeadIds.add(l.id);
const sequelsSeen = sequelLeadIds.size;

console.log('\n— AI-call coverage (every flowchart actor must fire)');
for (const [m, n] of Object.entries(ai.calls)) console.log(`  ${m}: ${n}`);
ok(ai.calls.cardAsk > 0, 'cardAsk fires (one-off handoff)');
ok(ai.calls.outcome > 0, 'outcome fires (resolution narration)');
ok(ai.calls.genesis > 0, 'genesis fires (chain bible)');
ok(ai.calls.chainBeat > 0, 'chainBeat fires (chain beats)');
ok(ai.calls.flesh > 0, 'flesh fires (delivered characters get backstory+quirks) — DEAD CODE CHECK');

console.log(`\n— flowchart invariants`);
console.log(`  beat proposals: ${beatRewardsThemed}/${beatRewardsChecked} beats carry a proposed reveal/loot`);
ok(beatRewardsChecked === 0 || beatRewardsThemed > 0, 'chain beats carry the AI proposal (reveal/loot)');
console.log(`  resolution consumed proposal → learned/loot: ${ai.outcomeLearnedReturned}/${ai.outcomeProposalsSeen}`);
ok(ai.outcomeProposalsSeen === 0 || ai.outcomeLearnedReturned > 0, 'resolution decides learned/loot from the beat proposal');
console.log(`  finales seen=${finalesSeen} · chains concluded=${chainsConcluded} · sequels seeded=${sequelsSeen}`);
ok(chainsConcluded === 0 || sequelsSeen > 0, 'a concluded saga can seed a sequel lead (step 17)');
console.log(`  new chains born=${Object.keys(state.chains).length - before.size}`);

console.log(`\n${fail === 0 ? '✓ CONFORMS' : '✗ NONCONFORMANCE'} — ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
