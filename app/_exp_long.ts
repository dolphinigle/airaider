// EXTENSIVE genesis experiment: {variant} × {length=rarity} × {reps}, played END-TO-END to finale via the
// real engine (only genesis differs per variant). Captures full transcript + auto-metrics. Reads later.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import OpenAI from 'openai';
import { initGame } from './core/state.js';
import { makeNarrator, tagLabels, type Narrator, type GenesisOut } from './core/ai.js';
import { GameEngine } from './core/game.js';
import { stockLeadBoard } from './core/leads.js';
import { rngFrom } from './core/rng.js';
import { pickThemes, pickPlace, pickTone } from './core/seeds.js';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const client = new OpenAI({ apiKey: key });
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
mkdirSync('/tmp/long', { recursive: true });

const BASE =
  `You design a QUEST for a MERCENARY COMPANY (the player runs it) and the truth behind it. Given a CORE PERSON (tags), THEMES, SETTING, TONE.\n` +
  `Build a quest with a clear HOOK (why a merc company takes it — pay / a person to save/escort/find / a threat) and a GOAL (one clear thing to achieve). Core person's tags CENTRAL. FUSE themes. Match TONE. Clinical voice. JSON only.\n`;

function variantSys(twist: boolean, ladders: boolean, forceTwist: boolean) {
  const person = ladders
    ? `{ "name","who","history":[3-7 cause→bedrock why-ladder],"want","role":client/companion/quarry/obstacle/ally/prize }`
    : `{ "name","who": one vivid line,"want","role":client/companion/quarry/obstacle/ally/prize }`;
  const twistField = twist
    ? `"goal": the APPARENT job the player commits to,\n  "twist": ${forceTwist ? `<=20 words — how the truth DIFFERS from the apparent goal (client lies / quarry is the victim / prize is a trap)` : `"none" — this is a STRAIGHT job, no misdirection`},\n  "situation": 2-4 sentences of the REAL truth`
    : `"goal": the clear thing to achieve,\n  "situation": 2-4 sentences, the honest truth`;
  return BASE +
    (twist && forceTwist ? `MISDIRECTION: the job the player sees is NOT the whole truth — give the apparent goal, then the real situation, then the twist. A good twist is FAIR (findable) and changes what the right thing to do is.\n` : ``) +
    (ladders ? `Ladder the core person + 1 other DEEP (why→bedrock); edge cast shallow.\n` : `People LEAN: one vivid line + a want each. NO backstory ladders.\n`) +
    `Output JSON: { "title": concrete action-title, "leadBlurb": 1-2 sentences (clear inviting job-board text), ${twistField}, "obstacles": [1-3 short: what stands in the way], "people": [ ${person} ] }`;
}

function makeVariantNarrator(inner: Narrator, twist: boolean, ladders: boolean): Narrator {
  const sys = variantSys(twist, ladders, twist);
  const wrap: any = { kind: 'openai' };
  for (const m of ['cardAsk', 'outcome', 'flesh', 'chainBeat', 'conceptTags'] as const) wrap[m] = (i: any) => (inner as any)[m](i);
  wrap.genesis = async (i: any): Promise<GenesisOut> => {
    const tagsStr = i.focalTags[0]?.join(', ') ?? '';
    const user = `CORE PERSON tags: [${tagsStr}].${i.personal ? ` (existing merc ${i.name})` : ' Invent and NAME them.'}\nTHEMES: ${i.seed}\nSETTING: ${i.place}\nTONE: ${i.tone}\nBuild the quest. JSON only.`;
    let o: any = {};
    try {
      const res = await client.chat.completions.create({ model: 'gpt-5-mini', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], response_format: { type: 'json_object' }, max_completion_tokens: 4000, reasoning_effort: 'low' } as any);
      o = JSON.parse(res.choices[0]?.message?.content || '{}');
    } catch { /* fall through to mock-ish */ }
    const people = (o.people ?? []).map((p: any) => ({ name: String(p.name ?? 'Unknown'), who: String(p.who ?? ''), history: Array.isArray(p.history) ? p.history.map(String) : [], wants: String(p.want ?? p.wants ?? ''), feels: '', conceals: undefined, role: p.role ? String(p.role) : undefined }));
    const hasTwist = twist && o.twist && String(o.twist).toLowerCase() !== 'none';
    const apparent = String(o.goal ?? 'help the petitioner');
    const situation = hasTwist
      ? `THE JOB APPEARS TO BE: ${apparent}. THE TRUTH (surfaces across beats, not stated up front): ${String(o.situation ?? '')} THE TWIST: ${String(o.twist)}`
      : String(o.situation ?? '');
    const obstacles: string[] = Array.isArray(o.obstacles) ? o.obstacles.map(String) : [];
    return {
      title: String(o.title ?? 'A Job in the Fens'), leadBlurb: String(o.leadBlurb ?? ''), goal: apparent,
      cast: people.length ? people : [{ name: 'Petitioner', who: 'a worried local', history: [], wants: 'help', feels: '', role: 'client' }],
      situation, tensions: obstacles,
      directions: [{ kind: 'active', hook: apparent }, { kind: 'ambient', hook: obstacles[0] ?? 'time presses on the job' }],
    } as GenesisOut;
  };
  // expose whether the genesis produced a twist (for metrics), via a side channel
  wrap.__twistMode = twist;
  return wrap as Narrator;
}

async function playOne(label: string, variant: { twist: boolean; ladders: boolean }, rarity: 'common' | 'rare' | 'legendary', seed: string) {
  const state = initGame(seed);
  const inner = await makeNarrator({ provider: 'openai', apiKey: key });
  const ai = makeVariantNarrator(inner, variant.twist, variant.ladders);
  const eng = new GameEngine(state, ai);
  stockLeadBoard(state, rngFrom(`${seed}:board:0`));
  const level = rarity === 'common' ? 2 : rarity === 'rare' ? 4 : 6;
  let chainId = ''; const lines: string[] = [`### ${label} [${rarity}]`];
  for (let c = 0; c < 24 && (!chainId || (eng.state.chains as any)[chainId]?.state !== 'done'); c++) {
    let q: any = null;
    if (!chainId) {
      const l = eng.leads().find((x) => x.chain.kind === 'starts-new');
      if (l) { l.rarity = rarity; l.level = level; q = await eng.pursue(l.id); if (!('error' in q)) { chainId = q.chainId; const ch: any = eng.state.chains[chainId]; lines.push(`GOAL: ${strip(ch.bible.match(/QUEST GOAL: ([^\n]+)/)?.[1] || '')}`); lines.push(`SIT:  ${strip((ch.bible.match(/SITUATION[^:]*: ([^\n]+)/)?.[1] || '')).slice(0, 240)}`); lines.push(`BLURB: ${strip(ch.hook || '')}`); } }
    } else { const cont = eng.leads().find((x) => x.chain.kind === 'continues' && x.chain.chainId === chainId); if (cont) { q = await eng.pursue(cont.id); if ('error' in q) q = null; } }
    let assigned = false;
    if (q && !('error' in q)) lines.push(`\n${q.finale ? '== FINALE' : '-- beat ' + q.beat}: ${strip(q.job)}`);
    for (const aq of eng.activeQuests()) { for (let i = 0; i < aq.slots.length; i++) { const e = eng.eligibleMercs(aq, i); if (e.length) { eng.assign(aq.id, i, e[0].id); assigned = true; } } aq.threshold = 1; if (aq.groups) aq.groups.forEach((g: any) => g.threshold = 1); }
    const res = await eng.endDay();
    if (assigned) for (const rr of res) if (rr.beforeText) { lines.push(`   buildup: ${strip(rr.beforeText)}`); lines.push(`   roll: ${rr.outcome} (${rr.heads}/${rr.threshold})`); lines.push(`   after: ${strip(rr.afterText || '')}`); }
  }
  const ch: any = chainId ? eng.state.chains[chainId] : null;
  const beats = ch?.beatsResolved ?? 0;
  lines.push(`\n-- LOG: ${(ch?.log ?? []).map((l: string) => strip(l).replace(/^Beat \d+: the company set to /, '')).join(' || ')}`);
  writeFileSync(`/tmp/long/${label}.txt`, lines.join('\n'));
  const hasTwist = /THE TWIST:/.test(ch?.bible ?? '');
  return { label, variant: variant.twist ? (variant.ladders ? 'B twist+lad' : 'D twist+lean') : (variant.ladders ? 'A straight+lad' : 'C straight+lean'), rarity, beats, hasTwist, title: strip(ch?.title ?? '') };
}

// ---- the matrix --------------------------------------------------------------
const A = { twist: false, ladders: true }, B = { twist: true, ladders: true }, D = { twist: true, ladders: false };
const CELLS: Array<{ v: any; vn: string; rarity: 'common' | 'rare' | 'legendary' }> = [];
for (const rarity of ['common', 'rare', 'legendary'] as const) for (const [v, vn] of [[A, 'A'], [D, 'D']] as const) CELLS.push({ v, vn, rarity });
for (const rarity of ['rare'] as const) CELLS.push({ v: B, vn: 'B', rarity }); // ladder-isolation spot-check
const REPS = Number(process.argv[2] || 3);
const jobs: Array<{ label: string; v: any; rarity: any; seed: string }> = [];
for (const cell of CELLS) for (let rep = 0; rep < REPS; rep++) jobs.push({ label: `${cell.vn}-${cell.rarity}-r${rep}`, v: cell.v, rarity: cell.rarity, seed: `long-${cell.vn}-${cell.rarity}-${rep}` });

const POOL = 6; const summary: any[] = [];
for (let i = 0; i < jobs.length; i += POOL) {
  const chunk = jobs.slice(i, i + POOL);
  const r = await Promise.all(chunk.map((j) => playOne(j.label, j.v, j.rarity, j.seed).catch((e) => ({ label: j.label, error: String(e).slice(0, 80) } as any))));
  summary.push(...r);
  console.log(`done ${Math.min(i + POOL, jobs.length)}/${jobs.length}`);
}
console.log('\n===== SUMMARY =====');
console.log('label\tvariant\trarity\tbeats\ttwist\ttitle');
for (const s of summary) console.log(`${s.label}\t${s.variant ?? ''}\t${s.rarity ?? ''}\t${s.beats ?? ''}\t${s.hasTwist ?? ''}\t${s.title ?? s.error ?? ''}`);
writeFileSync('/tmp/long/_summary.json', JSON.stringify(summary, null, 1));
