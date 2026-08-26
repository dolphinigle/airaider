// Headless playtest of the GUI's concurrency, running the React client's EXACT state machine
// (fresh / held / poll cadence) against a real server with a slow mock. The browser is the only
// thing missing; every request, race and gate below is the real one.
// Usage: npx tsx scripts/_guiplay.ts [port] [latencyMs]
import { spawn, type ChildProcess } from 'node:child_process';

const PORT = Number(process.argv[2] ?? 3299);
const LAT = process.argv[3] ?? '2500';
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let fails = 0;
const ok = (cond: unknown, what: string, detail = '') => {
  if (cond) console.log(`   ✓ ${what}`);
  else { fails++; console.log(`   ✗ FAIL ${what}${detail ? ` — ${detail}` : ''}`) }
};

async function state(): Promise<any> { return (await fetch(`${BASE}/api/state`)).json() }
async function act(type: string, ...args: (string | number)[]): Promise<any> {
  return (await fetch(`${BASE}/api/action`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, args }),
  })).json();
}

/** kill the server and everything it spawned */
function stop(p: ChildProcess) { try { process.kill(-p.pid!, 'SIGKILL') } catch { p.kill('SIGKILL') } }

/** a killed server holds :PORT for a moment; booting into EADDRINUSE silently talks to the OLD
 *  process, which quietly invalidates any scenario that just changed the server's env */
async function waitPortFree(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try { await state() } catch { return }
    await sleep(250);
  }
  throw new Error(`port ${PORT} never freed`);
}

async function boot(fresh = true, extra: Record<string, string> = {}): Promise<ChildProcess> {
  await waitPortFree();
  // detached so the whole GROUP can be killed: `npx` is a wrapper around a wrapper around node,
  // and killing the pid we get back leaves the actual server holding the port
  const p = spawn('npx', ['tsx', 'server/main.ts'], {
    env: { ...process.env, PORT: String(PORT), AIRAIDER_MOCK_LATENCY_MS: LAT, ...(fresh ? { AIRAIDER_FRESH: '1' } : {}), ...extra },
    stdio: ['ignore', 'pipe', 'pipe'], detached: true,
  });
  p.stderr!.on('data', d => { const t = String(d); if (!/ExperimentalWarning/.test(t)) console.log(`   [server:err] ${t.trim().slice(0, 200)}`) });
  for (let i = 0; i < 80; i++) { try { await state(); return p } catch { await sleep(250) } }
  throw new Error('server never came up');
}

/** the client's own rules, copied from web/App.tsx — if these drift, this harness lies */
const freshOf = (s: any, reckAt: number | null) => reckAt === null || s.cycle > reckAt;
const heldOf = (s: any, reckAt: number | null, busy: boolean) =>
  busy && (!freshOf(s, reckAt) || !!s.reckoningWriting);
const linesOf = (s: any, reckAt: number | null) => (freshOf(s, reckAt) ? (s.lastReport ?? []) : []);

/** click END and watch the reckoning page exactly as the browser would */
async function endCycleAsPlayer(label: string) {
  const s0 = await state();
  const reckAt = s0.cycle;
  let busy = true;
  const t0 = Date.now();
  const frames: { t: number; lines: number; held: boolean; pending: number; done: number }[] = [];
  const post = act('end').then(r => { busy = false; return r });
  let proceedAt: number | null = null;
  while (busy || proceedAt === null) {
    const s = await state();
    const lines: string[] = linesOf(s, reckAt);
    const held = heldOf(s, reckAt, busy);
    frames.push({
      t: Date.now() - t0, lines: lines.length, held,
      pending: lines.filter(l => l.startsWith('✎')).length,
      done: lines.filter(l => l.startsWith('⚄')).length,
    });
    if (!held && proceedAt === null) proceedAt = Date.now() - t0;
    if (proceedAt !== null && !busy) break;
    await sleep(500);
  }
  const r = await post;
  const total = Date.now() - t0;
  console.log(`   timeline: ${frames.map(f => `${(f.t / 1000).toFixed(1)}s[${f.lines}L ${f.pending}⏳ ${f.done}⚄${f.held ? ' held' : ' OPEN'}]`).join(' ')}`);
  console.log(`   ${label}: PROCEED at ${(proceedAt! / 1000).toFixed(1)}s, POST returned at ${(total / 1000).toFixed(1)}s (saved ${((total - proceedAt!) / 1000).toFixed(1)}s)`);
  return { frames, proceedAt: proceedAt!, total, msg: r.msg };
}

/** build a fort and get `want` quests staffed and marching */
async function stageMarching(want: number) {
  await act('build', 'map-room'); await act('build', 'lead-room');
  for (let round = 0; round < 14; round++) {
    let s = await state();
    const open = s.quests.length;
    for (const l of s.leads.slice(0, want - open)) await act('pursue', l.id);
    s = await state();
    for (const q of s.quests) {
      if (q.approaches && !q.chosenApproach) await act('approach', q.id, q.approaches[0].id);
      for (const slot of q.slots) {
        if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
        const free = (await state()).roster.find((m: any) => m.location.kind === 'held');
        if (free) await act('assign', q.id, slot.idx, free.id);
      }
    }
    s = await state();
    const marching = s.quests.filter((q: any) => q.ready).length;
    if (marching >= want) return marching;
    await act('end');
  }
  return (await state()).quests.filter((q: any) => q.ready).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// `real` mode: the same client state machine against a REAL-AI server — the closest thing to
// the designer sitting in front of the browser. One cycle, two quests, ~5 calls.
if (process.argv[4] === 'real') {
  const srvR = await boot(true, { AIRAIDER_AI: 'openai' });
  try {
    const staged = await stageMarching(2);
    const s0 = await state();
    console.log(`\n══ REAL AI: ${staged} quest(s) marching, cycle ${s0.cycle} ══`);
    const reckAt = s0.cycle;
    let busy = true;
    const t0 = Date.now();
    const post = act('end').then(r => { busy = false; return r });
    let proceedAt: number | null = null;
    let lastShown = -1;
    while (busy) {
      const st = await state();
      const lines: string[] = linesOf(st, reckAt);
      const held = heldOf(st, reckAt, busy);
      if (lines.length !== lastShown) {
        console.log(`   t+${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${String(lines.length).padStart(3)} lines  ` +
          `${lines.filter(l => l.startsWith('✎')).length} still out  ${held ? 'held' : 'PROCEED open'}`);
        lastShown = lines.length;
      }
      if (!held && proceedAt === null) proceedAt = Date.now() - t0;
      await sleep(500);
    }
    const total = Date.now() - t0;
    await post;
    const s1 = await state();
    console.log(`   PROCEED at ${(proceedAt! / 1000).toFixed(1)}s · cycle finished at ${(total / 1000).toFixed(1)}s ` +
      `→ ${((total - proceedAt!) / 1000).toFixed(1)}s of tail skipped · $${s1.ai.costUsd.toFixed(3)}`);
    console.log('\n   ── the page, as the player reads it ──');
    for (const l of s1.lastReport) console.log(`   ${l.slice(0, 108)}`);
    ok(!s1.lastReport.some((l: string) => l.startsWith('✎')), 'no placeholder survives');
    ok(s1.lastReport.filter((l: string) => l.startsWith('⚄')).length === staged, 'every marching quest got a roll line');
  } finally { stop(srvR) }
  console.log(`\n${fails === 0 ? '✅ real-AI run clean' : `❌ ${fails} failed`}`);
  process.exit(fails === 0 ? 0 : 1);
}

let srv = await boot();
try {
  console.log(`\n══ S1: the first cycle — a quest marching AND a guaranteed flesh tail ══`);
  {
    // the founders have no who/backstory yet, so fleshPass makes a real call this cycle; and a
    // quest can be staffed in cycle 0 without ending one first — so this is the ONE scenario
    // where the tail is guaranteed and the PROCEED-early promise is actually testable
    const staged = await stageMarching(1);
    console.log(`   staged ${staged} marching quest(s) in cycle 0`);
    const s0 = await state();
    const reckAt = s0.cycle;
    let busy = true;
    const t0 = Date.now();
    const post = act('end').then(r => { busy = false; return r });
    const frames: string[] = [];
    let proceedAt: number | null = null;
    while (busy) {
      const st = await state();
      const lines: string[] = linesOf(st, reckAt);
      const held = heldOf(st, reckAt, busy);
      frames.push(`${((Date.now() - t0) / 1000).toFixed(1)}s[${lines.length}L ${lines.filter(l => l.startsWith('✎')).length}✎ ${lines.filter(l => l.startsWith('⚄')).length}⚄${held ? ' held' : ' OPEN'}]`);
      if (!held && proceedAt === null) proceedAt = Date.now() - t0;
      await sleep(500);
    }
    const total = Date.now() - t0;
    await post;
    console.log(`   timeline: ${frames.join(' ')}`);
    console.log(`   PROCEED at ${proceedAt === null ? 'never' : (proceedAt / 1000).toFixed(1) + 's'}, POST returned at ${(total / 1000).toFixed(1)}s`);
    ok(proceedAt !== null, 'PROCEED unlocked at some point');
    ok(proceedAt !== null && proceedAt < total - 300, 'PROCEED unlocked BEFORE the flesh tail finished',
      `proceed ${proceedAt}ms vs post ${total}ms`);
    const s1 = await state();
    ok(s1.lastReport.some((l: string) => l.startsWith('⚄')), 'the roll line made it into the report');
    ok(!s1.lastReport.some((l: string) => l.startsWith('✎')), 'no placeholder survives');
    ok(!s1.reckoningWriting, 'writing is false once the cycle ends');
  }

  console.log(`\n══ S1b: a cycle with NOTHING marching ══`);
  {
    const r = await endCycleAsPlayer('S1b');
    const s = await state();
    ok(s.lastReport.some((l: string) => l.includes('quiet cycle')), 'the quiet-cycle line is shown');
    ok(r.proceedAt <= r.total, 'PROCEED never unlocks after the POST returns');
  }

  console.log(`\n══ S2: two quests marching — do they land separately? ══`);
  const marching = await stageMarching(2);
  console.log(`   staged ${marching} marching quest(s)`);
  {
    const r = await endCycleAsPlayer('S2');
    const firstWithContent = r.frames.find(f => f.lines > 0);
    ok(firstWithContent && firstWithContent.t < 1200, 'the page has content within a second',
      JSON.stringify(r.frames.slice(0, 2)));
    const sawPlaceholder = r.frames.some(f => f.pending > 0);
    const mixed = r.frames.find(f => f.pending > 0 && f.done > 0);
    if (marching >= 2) {
      ok(sawPlaceholder, 'a quest slot was observably held open while its report was out', JSON.stringify(r.frames));
      ok(mixed, 'one report was readable while another was still out', JSON.stringify(r.frames));
    }
    ok(r.frames.at(-1)!.pending === 0, 'no placeholder survives the cycle');
  }

  console.log(`\n══ S3: act in the fort immediately after PROCEED ══`);
  {
    await stageMarching(1);
    const s0 = await state();
    const reckAt = s0.cycle;
    let busy = true;
    const t0 = Date.now();
    const post = act('end').then(r => { busy = false; return r });
    while (heldOf(await state(), reckAt, busy)) await sleep(200);
    const proceedAt = Date.now() - t0;
    const tBuild = Date.now();
    const b = await act('build', 'mess-hall');
    const buildMs = Date.now() - tBuild;
    await post;
    console.log(`   PROCEED at ${(proceedAt / 1000).toFixed(1)}s, then a build took ${(buildMs / 1000).toFixed(1)}s → ${b.msg}`);
    const tailed = proceedAt < (Date.now() - t0) - 300;
    if (tailed) ok(buildMs < 1500, 'a fort action right after PROCEED is not stalled behind the cycle tail',
      `took ${(buildMs / 1000).toFixed(1)}s — it queues behind the still-open end request`);
    else console.log('   (no flesh tail this cycle — nothing to stall behind; not asserted)');
  }

  console.log(`\n══ S4: double END (double-click / two tabs) ══`);
  {
    await stageMarching(1);
    const before = (await state()).cycle;
    const [a, b] = await Promise.all([act('end'), act('end')]);
    const after = (await state()).cycle;
    console.log(`   cycle ${before} → ${after}; msgs: ${JSON.stringify([a.msg, b.msg])}`);
    ok(after === before + 1, 'a double END resolves exactly ONE cycle', `went ${before}→${after}`);
    ok([a, b].some(x => !x.ok && /already resolving/.test(x.msg)), 'the second END is refused, not queued',
      JSON.stringify([a.msg, b.msg]));
    ok(!(await state()).reckoningWriting, 'nothing is left writing');
    const rep = (await state()).lastReport;
    ok(!rep.some((l: string) => l.includes('already resolving')), 'the report was not replaced by the guard message',
      JSON.stringify(rep.slice(0, 2)));
  }

  console.log(`\n══ S5: a NEW browser tab opens mid-reckoning (reckAt = null) ══`);
  {
    await stageMarching(1);
    let busy = true;
    const post = act('end').then(r => { busy = false; return r });
    await sleep(400);
    const s = await state();
    const lines = linesOf(s, null);            // a fresh tab has no reckAt
    const held = heldOf(s, null, false);       // …and no in-flight POST of its own
    console.log(`   fresh tab sees ${lines.length} line(s), held=${held}, writing=${s.reckoningWriting}`);
    ok(lines.length > 0, 'a fresh tab sees the live report, not an empty page');
    ok(!held, 'a fresh tab is never trapped (its PROCEED is enabled)');
    await post;
  }

  console.log(`\n══ S6: server dies mid-reckoning — is the player trapped? ══`);
  {
    await stageMarching(1);
    const s0 = await state();
    const reckAt = s0.cycle;
    let busy = true;
    let postErr = false;
    const post = act('end').catch(() => { postErr = true }).then(() => { busy = false });
    await sleep(300);
    stop(srv);
    await post;
    const held = heldOf(s0, reckAt, busy);   // s is frozen at the last good poll
    console.log(`   POST failed=${postErr}, busy=${busy}, held(frozen state)=${held}`);
    ok(!held, 'PROCEED is enabled once the request settles, even on a dead server');
    srv = await boot(false);   // reload from the autosave, as the player would
    const s2 = await state();
    console.log(`   server restarted at cycle ${s2.cycle}; lastReport ${s2.lastReport.length} line(s)`);
    ok(!s2.reckoningWriting, 'a restarted server is not stuck writing');
  }
  console.log(`\n══ S7: the reckoning's AI call FAILS mid-cycle ══`);
  {
    stop(srv);
    srv = await boot(true, { AIRAIDER_MOCK_FAIL_RESOLVE: '1' });
    const staged = await stageMarching(1);
    console.log(`   staged ${staged} marching quest(s), provider set to fail`);
    const s0 = await state();
    const reckAt = s0.cycle;
    let busy = true;
    const post = act('end').then(r => { busy = false; return r });
    let sawHeld = false;
    for (let i = 0; i < 40 && busy; i++) { if (heldOf(await state(), reckAt, busy)) sawHeld = true; await sleep(200) }
    const r = await post;
    const s1 = await state();
    console.log(`   POST → ok=${r.ok} msg=${String(r.msg).slice(0, 90)}`);
    console.log(`   report now: ${JSON.stringify(s1.lastReport.slice(0, 2))}`);
    ok(!heldOf(s1, reckAt, false), 'the player is not held on a page that will never finish');
    ok(!s1.reckoningWriting, 'writing is cleared after the failure');
    ok(s1.lastReport.some((l: string) => l.includes('broke off')), 'the page says the reckoning broke off',
      'it would otherwise show the PREVIOUS cycle as if it were this one');
    ok(!s1.lastReport.some((l: string) => l.startsWith('✎')), 'no placeholder is left stranded');
    // and the game must still be playable
    const b2 = await act('build', 'mess-hall');
    ok(b2.ok || /costs|already/.test(b2.msg), 'the fort still takes actions after a broken reckoning', b2.msg);
    void sawHeld;
  }

} finally {
  stop(srv);
  await sleep(200);
}
console.log(`\n${fails === 0 ? '✅ all checks passed' : `❌ ${fails} check(s) failed`}`);
process.exit(fails === 0 ? 0 : 1);
