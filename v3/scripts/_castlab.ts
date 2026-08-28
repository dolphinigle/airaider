// RECURRING_CAST §6 with the REAL AI. The mock cannot test this: introducedNames is filled by
// scanning player-facing prose for cast names, and mock prose contains none, so the reuse pool
// never fills. Here each saga is driven far enough to introduce its cast (genesis → beat 1 card →
// resolve), then written back, so the cast accumulates and reuse can be observed.
// Usage: OUT=<file> npx tsx scripts/_castlab.ts [sagas] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { edgeCount } from '../src/engine/lore.js';
import type { Lead } from '../src/engine/quests.js';

const WANT = Number(process.argv[2] ?? 12);
const SEED = Number(process.argv[3] ?? 4242);
const BUDGET = Number(process.env.BUDGET ?? 3.0);
const out: string[] = [];
const say = (s: string) => { out.push(s); console.log(s) };

const g = new Game(makeOpenAiProvider(), SEED);
g.build('map-room'); g.build('lead-room'); g.build('dungeon');
for (let i = 0; i < 4; i++) { const t = g.state.tavern?.[0]; if (t) g.hire(t.id) }

let reused = 0;
for (let k = 1; k <= WANT; k++) {
  if (g.ai.usage().costUsd > BUDGET) { say(`\n(budget ${BUDGET} reached)`); break }
  const poolBefore = Object.values(g.state.lore.nodes).filter(n =>
    n.active && n.kind === 'character' && !g.card(n.id) && !g.state.cards.some(c => c.name === n.name));
  const namesBefore = new Set(poolBefore.map(n => n.name));

  const lead: Lead = { id: `cl-${k}`, rarity: 'uncommon', level: 3, region: 'forests',
    archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward' };
  g.state.leads.push(lead);
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) { say(`saga ${k}: pursue failed — ${r.msg}`); continue }
  const chain = g.state.chains[g.state.chains.length - 1]!;
  const focal = g.card(chain.focalId);
  const isReuse = !!focal && namesBefore.has(focal.name);
  if (isReuse) reused++;

  const q = g.state.quests.find(x => x.id === r.questId)!;
  say(`\n${'═'.repeat(78)}`);
  say(`SAGA ${k}  ·  pool before: ${poolBefore.length} known face(s)  ·  P(new)=${(4/(4+poolBefore.length)*100).toFixed(0)}%`);
  say(`  focal: ${focal?.name}   ${isReuse ? '★★ A FACE THE PLAYER ALREADY KNOWS ★★' : '(new to the world)'}`);
  if (isReuse) say(`  their record before this saga:\n${(g.dossier(chain.focalId) || '(none)').split('\n').map(l => '    ' + l).join('\n')}`);
  say(`  title : ${chain.bible.title}`);
  say(`  CARD  : ${q.situation}`);
  say(`  JOB   : ${q.job}`);

  g.autoAssignAll();
  await g.endCycle();
  (g as unknown as { persistMetCast(c: unknown): void }).persistMetCast(chain);
}

const chars = Object.values(g.state.lore.nodes).filter(n => n.kind === 'character');
const pool = chars.filter(n => !g.card(n.id) && !g.state.cards.some(c => c.name === n.name));
say(`\n${'═'.repeat(78)}\nRESULT`);
say(`  sagas run:        ${g.state.chains.length}`);
say(`  reused a face:    ${reused}`);
say(`  reuse pool:       ${pool.length} lore-only faces`);
say(`  edgeless nodes:   ${chars.filter(n => !g.state.lore.edges.some(e => e.from === n.id || e.to === n.id)).length}`);
say(`  faces by weight:  ${pool.map(n => `${n.name}×${edgeCount(g.state.lore, n.id, g.state.cycle)}`).join(' · ') || '(none)'}`);
say(`  cost:             $${g.ai.usage().costUsd.toFixed(2)}`);
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/castlab.md', out.join('\n'));
