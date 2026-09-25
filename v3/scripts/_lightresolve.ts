// A/B for the ROUTINE one-off report: does it do the card's job, or grab the reward off the scene?
// Playtest 2026-09-25: 3 of 3 light reports staged the pay ("seized the offered purse", "swept the
// pouch free") and 2 of 3 replaced the job with the loot (a stolen-totem job came home with a
// shield and no totem). Arms, all on the SAME card and the SAME rolled outcome:
//   A base · B NOCOIN (coin never dealt to the narrator) · C NOCOIN + LIGHTJOB (job-first line)
// Usage: OUT=<file> KEY=<file> npx tsx scripts/_lightresolve.ts [games] [seed]
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { boardPool } from '../src/engine/archetypes.js';
import type { ResolveQuestInput, ResolveQuestOut } from '../src/ai/provider.js';

const GAMES = Number(process.argv[2] ?? 10);
const SEED = Number(process.argv[3] ?? 7700);
const base = makeOpenAiProvider();
const captured: { input: ResolveQuestInput; out?: ResolveQuestOut; job: string }[] = [];
const ai = { ...base, resolve: async (inputs: ResolveQuestInput[], onEach?: (o: ResolveQuestOut) => void) => {
  const outs = await base.resolve(inputs, onEach);
  inputs.forEach((i, k) => captured.push({ input: i, out: outs[k], job: i.job ?? '' }));
  return outs;
} };

await Promise.all(Array.from({ length: GAMES }, async (_, gi) => {
  const g = new Game(ai as never, SEED + gi * 13);
  g.build('map-room');
  const pool = process.env.ARCHES ? process.env.ARCHES.split(',') as never[] : boardPool({ hasDungeon: false });
  for (let k = 0; k < 2; k++) {
    g.state.leads.push({ id: `lr-${gi}-${k}`, rarity: 'common', level: 2, region: 'forests',
      archetype: pool[(gi * 2 + k) % pool.length]!, chainInfo: { kind: 'none' }, expiresAtCycle: 40, source: 'reward' });
    await g.pursue(`lr-${gi}-${k}`);
  }
  g.autoAssignAll();
  await g.endCycle();
}));

const light = captured.filter(c => (process.env.ALLREG === '1' || c.input.gravity?.startsWith('a small')) && !c.input.chainContext);
console.log(`captured ${captured.length}, light ${light.length}`);
const stripCoin = (s: string) => s.split(', ').filter(b => !/^\d+ gold$/.test(b)).join(', ') || 'nothing beyond the job itself';

type Row = { id: string; arm: string; card: string; job: string; outcome: string; delivered: string; before: string; after: string; earned?: string };
const rows: Row[] = [];
for (const c of light) {
  const i = c.input;
  rows.push({ id: '', arm: 'A', card: i.situation ?? '', job: c.job, outcome: i.outcome, delivered: i.deliveredSummary ?? '', before: c.out?.before ?? '', after: c.out?.after ?? '', earned: i.earnedLead });
}
async function arm(name: string, env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  // mirror the engine's describeDelivery for arms that change what is dealt
  const deal = (d: string) => { let x = stripCoin(d);
    if (env.LIGHTNORELIC === '1') x = x.split(', ').filter(b => !/^the [A-Z]/.test(b)).join(', ') || 'nothing beyond the job itself';
    return x };
  const outs = await base.resolve(light.map(c => ({ ...c.input, deliveredSummary: deal(c.input.deliveredSummary ?? '') })));
  for (const [k] of Object.entries(env)) delete process.env[k];
  outs.forEach((o, k) => { const i = light[k]!.input;
    rows.push({ id: '', arm: name, card: i.situation ?? '', job: light[k]!.job, outcome: i.outcome, delivered: deal(i.deliveredSummary ?? ''), before: o.before, after: o.after, earned: i.earnedLead }) });
}
// ARMS="D:BEFORE2=1;E:CLOSE2=1;F:BEFORE2=1,CLOSE2=1" — each arm re-narrates the SAME inputs.
// Unset: the original N12 arms (B no coin, C no coin + job-first).
const spec = process.env.ARMS ?? 'B:LIGHTJOB=0;C:';
for (const a of spec.split(';').filter(Boolean)) {
  const [name, envs] = a.split(':');
  await arm(name!, Object.fromEntries((envs ?? '').split(',').filter(Boolean).map(kv => kv.split('=') as [string, string])));
}

// blind: shuffle, label R01.., key kept separately
const shuffled = rows.map(r => ({ r, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.r);
shuffled.forEach((r, n) => { r.id = `R${String(n + 1).padStart(2, '0')}` });
fs.writeFileSync(process.env.KEY!, JSON.stringify(shuffled.map(r => ({ id: r.id, arm: r.arm, card: r.card.slice(0, 40) }))));
fs.writeFileSync(process.env.OUT!, shuffled.map(r =>
  `## ${r.id}\nCARD: ${r.card}\nTHE JOB (what the company was hired to do): ${r.job}\nOUTCOME: ${r.outcome}${process.env.SHOW_EARNED === '1' && r.earned ? `\nWORK THE COMPANY IS LATER OFFERED: ${r.earned}` : ''}\nREPORT: ${r.before} ${r.after}`).join('\n\n'));
console.log(`$${base.usage().costUsd.toFixed(2)}`);
