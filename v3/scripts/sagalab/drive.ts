// SAGA LAB — the driver (docs/STORYTELLER.md §5.0). Plays lab sagas through the REAL text UI
// (docs/DOGFOODING.md): it spawns `cli/main.ts`, pipes ONE command at a time and reads until the
// dev `mark` echo, so every text a judge later reads is exactly what the CLI printed.
//
//   npx tsx scripts/sagalab/drive.ts --set A [--ai] [--fixtures A01,A02] [--run NAME]
//                                    [--parallel N] [--max-cycles 45] [--oneoffs]
//
// Per fixture: a fresh CLI on the fixture's seed (AIRAIDER_FORCE_OUTCOMES=1, AIRAIDER_CALL_LOG set)
// → `lab saga <fixture>` → pursue → wait → quest → approach (finale, per the fixture's kind) →
// auto → end! → reckoning … until the saga closes or 45 cycles; then chain, chains, save, ailog json.
// Only the lab saga and its continuations are pursued (one-offs only with --oneoffs).
//
// Writes runs/<run>/drive/<fixture>/: transcript.jsonl (every command: tag, out, t0, t1),
// stdout.log (the raw stream), calls.jsonl (every AI call), ailog.json, save.json, drive.json.
// The scratch save goes through saves/_lab_*.json and is deleted once copied.

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LabFixture } from '../../src/engine/lab.js';

const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = path.join(V3, 'scripts/sagalab');

const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined };
const flag = (name: string) => argv.includes(`--${name}`);

export interface TranscriptEntry {
  i: number; cmd: string; tag: string; questId?: string; out: string; t0: number; t1: number;
}
export interface DriveSummary {
  fixture: LabFixture; fixturePath: string; run: string; ai: boolean;
  ok: boolean; closed: boolean; chainId: string | null; chainState: string | null;
  cycles: number; pursues: { leadId: string; ms: number; ok: boolean }[];
  problems: string[]; wallMs: number; startedAt: string;
}

/** one CLI process, driven a command at a time */
class Cli {
  private proc: ChildProcessWithoutNullStreams;
  private pending = '';
  private tok = 0;
  private waiter: { tok: string; resolve: (s: string) => void; reject: (e: Error) => void; timer: NodeJS.Timeout } | null = null;
  private exited: number | null = null;
  exitPromise: Promise<number>;

  constructor(args: string[], env: NodeJS.ProcessEnv, private raw: fs.WriteStream, private timeoutMs: number) {
    this.proc = spawn(args[0]!, args.slice(1), { cwd: V3, env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout.setEncoding('utf8');
    this.proc.stderr.setEncoding('utf8');
    this.proc.stdout.on('data', (d: string) => { raw.write(d); this.pending += d; this.check() });
    this.proc.stderr.on('data', (d: string) => { raw.write(`[stderr] ${d}`) });
    this.exitPromise = new Promise(res => this.proc.on('exit', code => {
      this.exited = code ?? -1;
      if (this.waiter) { clearTimeout(this.waiter.timer); this.waiter.reject(new Error(`the CLI exited (${code}) mid-command`)); this.waiter = null }
      res(this.exited);
    }));
  }

  private check() {
    if (!this.waiter) return;
    const marker = `⟦mark ${this.waiter.tok}⟧`;
    const at = this.pending.indexOf(marker);
    if (at < 0) return;
    const out = this.pending.slice(0, at);
    this.pending = this.pending.slice(at + marker.length).replace(/^\r?\n/, '');
    const w = this.waiter;
    this.waiter = null;
    clearTimeout(w.timer);
    w.resolve(out.replace(/\s+$/, ''));
  }

  /** type one command, wait for its mark; resolves with everything printed in between */
  send(cmd: string): Promise<string> {
    if (this.exited !== null) return Promise.reject(new Error('the CLI is not running'));
    const tok = `m${++this.tok}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(new Error(`timed out after ${this.timeoutMs}ms on: ${cmd}`));
      }, this.timeoutMs);
      this.waiter = { tok, resolve, reject, timer };
      this.proc.stdin.write(`${cmd}\nmark ${tok}\n`);
      this.check();
    });
  }

  async quit(): Promise<void> {
    if (this.exited !== null) return;
    this.proc.stdin.write('quit\n');
    this.proc.stdin.end();
    const t = setTimeout(() => this.proc.kill('SIGTERM'), 15000);   // only ever our own child
    await this.exitPromise;
    clearTimeout(t);
  }
  kill() { if (this.exited === null) this.proc.kill('SIGTERM') }
}

interface LabState {
  lab: 1; cycle: number; roster: number;
  chains: { id: string; title: string; state: string; beat: number; expectedBeats: number; failures: number; failureBudget: number; lab: { fixture: string } | null }[];
  quests: { id: string; title: string; chainId: string | null; beatIndex: number | null; isFinale: boolean; approaches: { id: string; label: string; rewardKind: string }[] | null; chosen: string | null; ready: boolean }[];
  leads: { id: string; kind: string; chainId: string | null; lab: string | null; title: string | null }[];
  jobs: { id: string; leadId: string; state: string; questId: string | null; error: string | null }[];
}

function parseState(out: string): LabState {
  const line = out.split('\n').find(l => l.startsWith('{"lab":1'));
  if (!line) throw new Error(`no lab state in: ${out.slice(0, 200)}`);
  return JSON.parse(line) as LabState;
}

/** the finale plan a fixture plays: its own `approach`, else the one its kind promises */
function pickApproach(q: NonNullable<LabState['quests'][number]['approaches']>, fx: LabFixture): string {
  const want = fx.approach ?? (fx.kind === 'gold-hoard' ? 'gold' : fx.kind);
  return (q.find(a => a.rewardKind === want) ?? q[0]!).id;
}

export async function driveOne(fxPath: string, run: string, o: { ai: boolean; maxCycles: number; oneoffs: boolean; timeoutMs: number }): Promise<DriveSummary> {
  const fx = JSON.parse(fs.readFileSync(fxPath, 'utf8')) as LabFixture;
  const dir = path.join(LAB, 'runs', run, 'drive', fx.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const raw = fs.createWriteStream(path.join(dir, 'stdout.log'));
  const tr = fs.createWriteStream(path.join(dir, 'transcript.jsonl'));
  const env: NodeJS.ProcessEnv = { ...process.env, AIRAIDER_FORCE_OUTCOMES: '1', AIRAIDER_CALL_LOG: path.join(dir, 'calls.jsonl') };
  const cli = new Cli([path.join(V3, 'node_modules/.bin/tsx'), 'cli/main.ts', '--seed', String(fx.seed), ...(o.ai ? ['--ai'] : [])], env, raw, o.timeoutMs);
  const sum: DriveSummary = {
    fixture: fx, fixturePath: path.relative(V3, fxPath), run, ai: o.ai, ok: false, closed: false,
    chainId: null, chainState: null, cycles: 0, pursues: [], problems: [], wallMs: 0, startedAt: new Date(t0).toISOString(),
  };
  let n = 0;
  const send = async (cmd: string, tag = 'cmd', questId?: string): Promise<string> => {
    const a = Date.now();
    const out = await cli.send(cmd);
    const e: TranscriptEntry = { i: n++, cmd, tag, ...(questId ? { questId } : {}), out, t0: a, t1: Date.now() };
    tr.write(JSON.stringify(e) + '\n');
    return out;
  };
  const say = (s: string) => console.log(`[${fx.id}] ${s}`);
  try {
    await send('', 'boot');
    const granted = await send(`lab saga ${fxPath}`, 'grant');
    if (!granted.includes('✓ lab saga')) throw new Error(`grant refused: ${granted}`);
    const seen = new Set<string>();
    let pursueFails = 0, stalls = 0;
    for (;;) {
      const st = parseState(await send('lab state', 'state'));
      const chain = st.chains.find(c => c.lab?.fixture === fx.id);
      if (chain) { sum.chainId = chain.id; sum.chainState = chain.state }
      if (chain && (chain.state === 'done' || chain.state === 'slipped')) { sum.closed = true; break }
      if (sum.cycles >= o.maxCycles) { sum.problems.push(`the saga did not close within ${o.maxCycles} cycles`); break }
      const q = chain ? st.quests.find(x => x.chainId === chain.id) : undefined;
      if (q) {
        // a finale's plan is chosen FIRST, so its card is read the way the player saw it once the
        // choice was made (▶ on the chosen plan) — the readers never choose, the lab does
        if (q.approaches && !q.chosen) await send(`approach ${q.id} ${pickApproach(q.approaches, fx)}`, 'approach', q.id);
        if (!seen.has(q.id)) {
          seen.add(q.id);
          await send(`quest ${q.id}`, 'card', q.id);
          say(`${q.isFinale ? 'finale' : `beat ${q.beatIndex}`}: ${q.title}`);
        }
        const manned = await send(`auto ${q.id}`, 'auto', q.id);
        if (manned.startsWith('✗') && !manned.includes('already manned')) {
          stalls++;
          sum.problems.push(`c${st.cycle}: ${q.id} could not be manned: ${manned.slice(0, 120)}`);
          if (stalls > 4) throw new Error('the lab quest cannot be manned');
        }
        if (o.oneoffs) await playOneOffs(send, st, chain?.id ?? null);
        await send('end!', 'end', q.id);
        sum.cycles++;
        await send('reckoning', 'reckoning', q.id);
        continue;
      }
      const lead = chain ? st.leads.find(l => l.chainId === chain.id) : st.leads.find(l => l.lab === fx.id);
      if (lead) {
        const a = Date.now();
        await send(`pursue ${lead.id}`, 'pursue');
        const w = await send('wait', 'wait');
        const failed = /could not be written/.test(w);
        sum.pursues.push({ leadId: lead.id, ms: Date.now() - a, ok: !failed });
        if (failed) {
          sum.problems.push(`c${st.cycle}: pursuing ${lead.id} failed: ${w.split('\n').find(l => l.includes('could not be written'))?.slice(0, 160)}`);
          if (++pursueFails > 3) throw new Error('the lab lead keeps failing to write');
        }
        continue;
      }
      if (!chain) throw new Error('the lab lead is gone and no saga began');
      // nothing on the board for the saga this cycle — let the cycle turn
      if (o.oneoffs) await playOneOffs(send, st, chain.id);
      await send('end!', 'end');
      sum.cycles++;
      await send('reckoning', 'reckoning');
    }
    if (sum.chainId) await send(`chain ${sum.chainId}`, 'chain');
    await send('chains', 'chains');
    const saveName = `_lab_${run}_${fx.id}`.replace(/[^\w.-]/g, '_');
    await send(`save ${saveName}`, 'save');
    const savePath = path.join(V3, 'saves', `${saveName}.json`);
    if (fs.existsSync(savePath)) { fs.copyFileSync(savePath, path.join(dir, 'save.json')); fs.unlinkSync(savePath) }
    else sum.problems.push('the save was not written');
    await send(`ailog json ${path.join(dir, 'ailog.json')}`, 'ailog');
    sum.ok = sum.closed;
  } catch (e) {
    sum.problems.push(`aborted: ${(e as Error).message}`);
    say(`ABORTED: ${(e as Error).message}`);
  } finally {
    await cli.quit().catch(() => cli.kill());
    tr.end(); raw.end();
    // a save left behind by an aborted run is still a scratch save — never leave one
    for (const f of fs.readdirSync(path.join(V3, 'saves')).filter(f => f.startsWith(`_lab_${run}_${fx.id}`.replace(/[^\w.-]/g, '_')))) {
      fs.unlinkSync(path.join(V3, 'saves', f));
    }
    sum.wallMs = Date.now() - t0;
    fs.writeFileSync(path.join(dir, 'drive.json'), JSON.stringify(sum, null, 2));
  }
  say(`${sum.closed ? `closed (${sum.chainState})` : 'NOT closed'} after ${sum.cycles} cycles, ${(sum.wallMs / 1000).toFixed(0)}s${sum.problems.length ? ` · ${sum.problems.length} problem(s)` : ''}`);
  return sum;
}

/** --oneoffs: take up every other lead too and man what can be manned (the lab saga stays first) */
async function playOneOffs(send: (cmd: string, tag?: string) => Promise<string>, st: LabState, chainId: string | null) {
  const others = st.leads.filter(l => l.kind === 'none' && l.chainId !== chainId && !l.lab);
  for (const l of others) await send(`pursue ${l.id}`, 'oneoff-pursue');
  if (others.length) await send('wait', 'oneoff-wait');
  await send('auto all', 'oneoff-auto');
}

async function main() {
  const set = opt('set');
  const only = opt('fixtures')?.split(',').map(s => s.trim()).filter(Boolean);
  if (!set && !only) {
    console.log('usage: npx tsx scripts/sagalab/drive.ts --set A|B [--fixtures A01,A02] [--ai] [--run NAME] [--parallel N] [--max-cycles 45] [--oneoffs]');
    process.exit(2);
  }
  const ai = flag('ai');
  const stamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const run = opt('run') ?? `${set ?? 'x'}_${ai ? 'ai' : 'mock'}_${stamp}`;
  const sets = set ? [set] : [...new Set(only!.map(f => f[0]!))];
  const files = sets.flatMap(s => fs.readdirSync(path.join(LAB, 'fixtures', s)).filter(f => f.endsWith('.json')).sort()
    .map(f => path.join(LAB, 'fixtures', s, f)))
    .filter(f => !only || only.includes(path.basename(f, '.json')));
  if (!files.length) { console.log('no fixtures matched'); process.exit(2) }
  const parallel = Math.max(1, Number(opt('parallel') ?? (ai ? 4 : 2)));
  const o = {
    ai, oneoffs: flag('oneoffs'),
    maxCycles: Number(opt('max-cycles') ?? 45),
    timeoutMs: Number(opt('timeout-ms') ?? (ai ? 20 * 60_000 : 120_000)),
  };
  const runDir = path.join(LAB, 'runs', run);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ run, set: set ?? null, fixtures: files.map(f => path.basename(f, '.json')), startedAt: new Date().toISOString(), ...o }, null, 2));
  console.log(`run ${run}: ${files.length} fixture(s), ${ai ? 'REAL AI' : 'mock'}, ${parallel} at once → ${path.relative(V3, runDir)}`);
  const queue = [...files];
  const results: DriveSummary[] = [];
  await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
    for (let f = queue.shift(); f; f = queue.shift()) results.push(await driveOne(f, run, o));
  }));
  const closed = results.filter(r => r.closed).length;
  console.log(`\n${closed}/${results.length} sagas closed. Next: npx tsx scripts/sagalab/extract.ts --run ${run}`);
  process.exit(closed === results.length ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
