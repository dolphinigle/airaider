// RECURRING_CAST §5 A/B. A world that ALREADY has history is injected, so most sagas return to a
// known face immediately and the prose can be compared without playing twelve sagas first.
// KNOWN_FACE=0 → the old behaviour (the reveal gate is per-chain, so a known face is staged as a
// stranger). Default → the chain opens knowing them.
// Usage: OUT=<file> npx tsx scripts/_knownface.ts [sagas] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { guardEdges } from '../src/engine/lore.js';
import type { Lead } from '../src/engine/quests.js';

const WANT = Number(process.argv[2] ?? 8);
const SEED = Number(process.argv[3] ?? 771);
const g = new Game(makeOpenAiProvider(), SEED);
g.build('map-room'); g.build('lead-room'); g.build('dungeon');
for (let i = 0; i < 4; i++) { const t = g.state.tavern?.[0]; if (t) g.hire(t.id) }

// six faces the company already has history with
const FACES: [string, string, string][] = [
  ['Maldea', 'A widow who holds the burned grange on the ridge.', 'hired the company to buy back the men who fired her farm'],
  ['Asbjorn of the Pass', 'A hard-faced trader who moves prisoners on the forest roads.', 'sold a prisoner out from under the company and kept the fee'],
  ['Hanala', 'A scrawny elven servant who knows the smaller paths.', 'guided the company through the winter huts and asked for a place'],
  ['Norion Dawnsinger', 'A woodland steward who manages the border cutting rights.', 'paid the company late, and blamed the grove for it'],
  ['Bausanne', 'An elf peasant with a quick hand and a temper.', 'was taken by the company and let go at the ford'],
  ['Kymme Ashworth', 'A sickly chapel priest with a clever tongue.', 'was sold to cover a market debt before the company found him'],
];
FACES.forEach(([name, blurb], i) => {
  g.state.lore.nodes[`lore-k${i}`] = { id: `lore-k${i}`, kind: 'character', name, blurb,
    identity: blurb, active: true, createdCycle: 0 };
});
const TYPES = ['party-to', 'rival-of', 'owes', 'betrayed-by', 'saved-by'] as const;
FACES.forEach(([, , memory], i) => {
  if (i === 0) return;
  guardEdges(g.state.lore, [{ from: `lore-k${i}`, to: 'lore-k0', type: TYPES[i % TYPES.length]!,
    blurb: memory, importance: i === 1 ? 0.85 : 0.5 }], 1, () => `ek${i}`);
});

const out: string[] = [];
const say = (t: string) => { out.push(t); console.log(t) };
say(`# §5 A/B — KNOWN_FACE=${process.env.KNOWN_FACE ?? '1'} · seed ${SEED}`);
let returning = 0, namedOnCard = 0;
for (let k = 1; k <= WANT; k++) {
  if (g.ai.usage().costUsd > Number(process.env.BUDGET ?? 1.0)) { say('(budget reached)'); break }
  const known = new Set(Object.values(g.state.lore.nodes)
    .filter(n => n.active && n.kind === 'character' && !g.card(n.id) && !g.state.cards.some(c => c.name === n.name))
    .map(n => n.name));
  const lead: Lead = { id: `kf-${k}`, rarity: 'uncommon', level: 3, region: 'forests',
    archetype: 'investigate', chainInfo: { kind: 'starts-new' }, expiresAtCycle: null, source: 'reward' };
  g.state.leads.push(lead);
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) continue;
  const chain = g.state.chains[g.state.chains.length - 1]!;
  const focal = g.card(chain.focalId);
  if (!focal || !known.has(focal.name)) continue;      // only returning-face sagas are the subject
  returning++;
  const q = g.state.quests.find(x => x.id === r.questId)!;
  const named = q.situation.includes(focal.name.split(' ')[0]!);
  if (named) namedOnCard++;
  say(`\n## ${focal.name}${named ? '' : '   ← NOT NAMED ON THE CARD'}`);
  say(`RECORD: ${(g.dossier(chain.focalId) || '').split('\n').slice(1).join(' | ') || '(none)'}`);
  say(`CARD  : ${q.situation}`);
  say(`JOB   : ${q.job}`);
  g.autoAssignAll(); await g.endCycle();
}
say(`\nRESULT: ${returning} returning-face sagas · named on the card: ${namedOnCard}/${returning} · $${g.ai.usage().costUsd.toFixed(2)}`);
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/kf.md', out.join('\n'));
