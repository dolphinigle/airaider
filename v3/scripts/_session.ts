// A long PLAYTEST of the real CLI. Spawns `cli/main.ts` as a live interactive process, reads what
// it prints, and types the next command — so the thing under test is the actual UI: real command
// parsing, real rendering, real background ticker, real prompt. Only the hands are automated.
// Usage: npx tsx scripts/_session.ts [cycles] [seed] [--ai]
import { spawn } from 'node:child_process';

const cycles = Number(process.argv[2] ?? 8);
const seed = Number(process.argv[3] ?? 4711);
const real = process.argv.includes('--ai');

const args = ['tsx', 'cli/main.ts', '--seed', String(seed), ...(real ? ['--ai'] : [])];
const cli = spawn('npx', args, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env } });
let buf = '';
cli.stdout.on('data', d => { buf += d; process.stdout.write(d) });
cli.stderr.on('data', d => { const t = String(d); if (!/ExperimentalWarning/.test(t)) process.stdout.write(`[err] ${t}`) });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
/** type a command, then wait for the output to go quiet */
async function say(cmd: string, quietMs = 500): Promise<string> {
  buf = '';
  cli.stdin.write(cmd + '\n');
  let last = -1;
  for (let i = 0; i < 800; i++) {          // up to ~4 min for a slow genesis
    await sleep(quietMs / 2);
    if (buf.length === last && buf.length > 0) break;
    last = buf.length;
  }
  return buf;
}
const idsIn = (out: string, re: RegExp) => [...out.matchAll(re)].map(m => m[1]!);

await sleep(2500);
for (let c = 0; c < cycles; c++) {
  console.log(`\n\n############ playtest cycle ${c} ############`);
  await say('gh');
  const b = await say('buildable');
  const affordable = idsIn(b, /^(\S+)\s+\d+g ✓ buildable/gm);
  // the Map room and the Lead room are the gates for leads and quests — a player builds those
  // FIRST and everything else after (preferring comfort, so prestige actually moves). Getting this
  // wrong starves the whole run: no map room, no leads, nothing to pursue, ten silent cycles.
  const ORDER = ['map-room', 'lead-room', 'scouting-forests', 'infirmary', 'mess-hall', 'dining-hall',
    'kitchen', 'garden', 'tavern', 'recruiting-forests', 'bedroom'];
  const want = ORDER.find(t => affordable.includes(t)) ?? affordable[0];
  if (want) await say(`build ${want}`);

  // THE POINT: fire everything on the board at once, then keep playing while they are written.
  // Let leads ACCUMULATE — pursuing one a cycle never queues anything, and the board drips one
  // per cycle, so a player who wants a full slate waits a beat and then fires the lot.
  const leadsOut = await say('leads');
  const leads = idsIn(leadsOut, /^(lead-\d+)\s+(?!.*(?:WRITING|QUEUED))/gm);
  if (leads.length >= 2 || c % 3 === 0) for (const l of leads.slice(0, 4)) await say(`pursue ${l}`);
  await say('jobs');
  await say('roster');       // the board must be live while the map table works
  await say('fort');
  await say('wait', 900);    // …then collect

  // staff whatever can march, choosing a plan when the card offers one
  const qOut = await say('quests');
  const quests = idsIn(qOut, /^(q\d+)\s/gm);
  for (const q of quests) {
    const det = await say(`quest ${q}`);
    const groups = idsIn(det, /\[(g\d+)\]/gm);
    if (groups.length) await say(`approach ${q} ${groups[0]}`);
    // only mercs actually FREE this instant — a committed one is on another quest, and re-reading
    // the roster each time is what a person at the prompt does
    const rOut = await say('roster');
    const free = [...rOut.matchAll(/^(c\d+)\s+\S.*$/gm)].filter(x => !/⚔ on /.test(x[0])).map(x => x[1]!);
    const det2 = await say(`quest ${q}`);
    // an unfilled slot is one with no `← merc` on it (that arrow is the only cue the UI gives)
    const slots = [...det2.matchAll(/^ {2}slot (\d+): (?!.*←).*$/gm)].map(x => Number(x[1]));
    let k = 0;
    for (const sl of slots) { if (k >= free.length) break; await say(`assign ${q} ${sl} ${free[k++]}`) }
  }
  await say('end', 900);
  await say('status');
}
await say('quit');
await sleep(1500);
cli.kill('SIGKILL');
