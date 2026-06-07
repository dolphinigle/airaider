// Throwaway experiment runner — generate real bibles to get a FEEL.
// Run: cd prototype && npx tsx src/storyGen/_expBibleFeel.ts [seedId ...]
// Logs full prompts+responses to prototype/logs/llm-calls.jsonl (via ai.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeClient } from './ai.js';
import { buildBible } from './chainGen.js';
import { SEEDS } from './seeds.js';

const POOL = JSON.parse(
  readFileSync(join(process.cwd(), '..', 'engine', 'server', 'data', 'seed_pool_mireford.json'), 'utf8'),
) as Array<Record<string, unknown>>;
const slate = POOL.map((c) => ({
  id: c.id as string, name: c.name as string, role: c.role as string,
  surface: c.surface as string, tags: (c.tags as string[]) ?? [], region: c.region as string,
}));

function render(seed: { id: string; spark: string; stakes: string }, g: any, b: any): string {
  const L: string[] = [];
  L.push(`\n${'='.repeat(78)}`);
  L.push(`SEED [${seed.id}] (${seed.stakes}): ${seed.spark}`);
  L.push(`KERNEL: ${g.kernel}`);
  if (g.newRoleNeeded) L.push(`newRoleNeeded: ${g.newRoleNeeded}`);
  L.push(`\nTITLE: ${b.title}`);
  L.push(`LEAD: ${b.leadBlurb}`);
  L.push(`\nCAST (${b.cast.length}):`);
  for (const c of b.cast) {
    const p = c.person;
    L.push(`  • ${p.name} — ${c.roleInStory ?? ''}${c.coined ? ' [COINED]' : ''}`);
    L.push(`     who: ${p.who}`);
    (p.history ?? []).forEach((h: string, i: number) => L.push(`     why${i + 1}: ${h}`));
    L.push(`     wants: ${p.wants}`);
    L.push(`     feels: ${p.feels}`);
    if (p.conceals && p.conceals !== false) L.push(`     conceals: ${typeof p.conceals === 'string' ? p.conceals : JSON.stringify(p.conceals)}`);
  }
  L.push(`\nSITUATION: ${b.situation}`);
  L.push(`TENSIONS:`);
  for (const t of b.tensions) L.push(`  - ${typeof t === 'string' ? t : JSON.stringify(t)}`);
  L.push(`OPEN DIRECTIONS:`);
  for (const d of b.openDirections) L.push(`  - [${typeof d === 'string' ? '?' : d.kind}] ${typeof d === 'string' ? d : d.hook}`);
  return L.join('\n');
}

const want = process.argv.slice(2);
const seeds = want.length ? SEEDS.filter((s) => want.includes(s.id)) : SEEDS;
const client = makeClient();

for (const seed of seeds) {
  const t0 = Date.now();
  try {
    const { genesis, bible } = await buildBible(client, { seed, slate });
    console.log(render(seed, genesis, bible));
    console.log(`[${seed.id} ok ${((Date.now() - t0) / 1000).toFixed(1)}s]`);
  } catch (e) {
    console.log(`\n[${seed.id} FAILED ${((Date.now() - t0) / 1000).toFixed(1)}s] ${(e as Error).message}`);
  }
}
