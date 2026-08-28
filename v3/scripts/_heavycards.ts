// HEAVY one-off cards only (rare leads roll 'a serious matter'/'a grave affair'), with a
// naked-proper-noun count. The light register bans proper nouns outright; the heavy one has no
// naming contract at all, so this is where a reader meets "Hawford" having never heard of it.
// Usage: OUT=<file> npx tsx scripts/_heavycards.ts [seed] [n]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ARCHETYPE_NAMES, glossOf } from '../src/engine/archetypes.js';
import { Rng } from '../src/engine/rng.js';
import type { Lead } from '../src/engine/quests.js';
import { REGION } from '../src/engine/regions.js';

const seed = Number(process.argv[2] ?? 8001);
const want = Number(process.argv[3] ?? 12);
const rng = new Rng(seed);
const pool = ARCHETYPE_NAMES.filter(a => a !== 'lead-hunt');

/** a capitalised token that is NOT sentence-initial and is not introduced appositively
 *  ("a mill town, Hawford") is a name the reader was handed cold. */
function nakedNames(text: string, dealt: string[] = []): string[] {
  const known = new Set(dealt.flatMap(d => d.split(/[^A-Za-z']+/)).filter(Boolean));
  const out: string[] = [];
  for (const sent of text.split(/(?<=[.!?])\s+/)) {
    const toks = sent.split(/\s+/);
    for (let i = 1; i < toks.length; i++) {
      const raw = toks[i]!, w = raw.replace(/[^A-Za-z'-]/g, '');
      if (!/^[A-Z][a-z'-]{2,}$/.test(w)) continue;
      if (/^(The|A|An|He|She|They|It|His|Her|Their|No|Not|Their)$/.test(w)) continue;
      const prev = toks[i - 1]!;
      const appositive = /,$/.test(prev);            // "…a mill town, Hawford…"
      if (!appositive && !known.has(w) && !known.has(w.replace(/'s$/, ''))) out.push(w);
    }
  }
  return out;
}

const g = new Game(makeOpenAiProvider(), seed);
g.build('map-room'); g.build('dungeon');
const rows: { arch: string; gravity: string; card: string; naked: string[] }[] = [];
for (let i = 0; i < want; i++) {
  const arch = rng.pick(pool);
  const lead: Lead = {
    id: `hv-${i}`, rarity: 'rare', level: 3 + (i % 3), region: 'forests', archetype: arch,
    chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward',
  };
  g.state.leads.push(lead);
  const r = await g.pursue(lead.id);
  if (!r.ok || !r.questId) { console.log(`!! ${arch}: ${r.msg}`); continue }
  const q = g.state.quests.find(x => x.id === r.questId)!;
  // only the REGION is something the player already knows. A dealt person's name still has to be
  // introduced on the card — that it was dealt is no help to the reader meeting it.
  const dealt = [REGION[lead.region]?.name ?? '', REGION[lead.region]?.landmark ?? ''].filter(Boolean);
  const naked = nakedNames(q.situation, dealt);
  rows.push({ arch, gravity: q.gravity ?? '?', card: q.situation, naked });
  console.log(`### ${arch} — ${q.gravity}\nGLOSS: ${glossOf(arch as never)}\nCARD:  ${q.situation}\nNAKED: ${naked.join(', ') || '—'}\n`);
}
const heavy = rows.filter(r => !r.gravity.startsWith('a small'));
const clean = heavy.filter(r => r.naked.length === 0).length;
const line = `heavy cards ${heavy.length}/${rows.length} · clean of naked names ${clean}/${heavy.length}` +
  ` (${heavy.length ? Math.round(100 * clean / heavy.length) : 0}%) · ~$${g.ai.usage().costUsd.toFixed(2)}`;
console.log('\n' + line);
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/heavy.json', JSON.stringify({ line, rows }, null, 1));
