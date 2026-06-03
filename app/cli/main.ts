// Airaider text CLI — the dogfooding front-end. Shares ALL game logic with the GUI
// via core/game.ts; only presentation lives here.
//   npm run cli                  interactive REPL (real AI if a key is present)
//   npm run cli -- auto 6        auto-play 6 cycles, printing every AI beat (dogfood)
//   npm run cli -- auto 6 --mock offline (no tokens)
//   flags: --seed=<s>  --mock
import { readFileSync } from 'node:fs';
import * as readline from 'node:readline';
import { GameEngine } from '../core/game.js';
import type { Quest, CharacterCard } from '../core/types.js';
import { BALANCE } from '../core/economy.js';
import { buildableRoomTypes } from '../core/fort.js';
import { status, leadsList, questCard, resultBlock, fortView, C } from './format.js';

function loadKey(): string | undefined {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try { return readFileSync(new URL('../../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)?.[1].trim(); } catch { return undefined; }
}

const argv = process.argv.slice(2);
const flag = (name: string) => argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const flagVal = (name: string) => flag(name)?.split('=')[1];
const useMock = !!flag('mock');
const seed = flagVal('seed') ?? 'airaider';
const apiKey = loadKey();
const provider: 'openai' | 'mock' = useMock || !apiKey ? 'mock' : 'openai';

const aiLog = (s: string) => { if (flag('verbose')) console.log(C.dim(s)); };
const eng = await GameEngine.create({ provider, apiKey, seed, log: aiLog });
console.log(C.dim(`narrator: ${provider}${provider === 'mock' ? ' (offline)' : ''}  seed: ${seed}\n`));

// ---- fit heuristic for auto-assign ------------------------------------------
function slotFit(m: CharacterCard, q: Quest, slotIndex: number): number {
  const t = q.slots[slotIndex].tested;
  let s = m.attrs[t.attribute];
  for (const f of t.favored) { const tag = m.tags.find((x) => x.id === f); if (tag) s += BALANCE.favoredBonus(tag.tier); }
  return s - m.injuries.length * 2;
}
function autoAssign(): void {
  for (const q of eng.activeQuests()) {
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i].filledBy) continue;
      const elig = eng.eligibleMercs(q, i).sort((a, b) => slotFit(b, q, i) - slotFit(a, q, i));
      if (elig.length) eng.assign(q.id, i, elig[0].id);
    }
  }
}

// ---- auto-play (dogfood) ----------------------------------------------------
async function autoPlay(cycles: number): Promise<void> {
  for (let c = 0; c < cycles; c++) {
    console.log('\n' + status(eng) + '\n');
    console.log(leadsList(eng) + '\n');
    // pursue: prefer chain continuations, then fillable fresh; bounded by free mercs
    const order = [...eng.leads()].sort((a, b) => (b.chain.kind !== 'none' ? 2 : 0) - (a.chain.kind !== 'none' ? 2 : 0));
    let pursued = 0;
    for (const lead of order) {
      if (eng.freeMercs().length < 1 || pursued >= 3) break;
      const res = await eng.pursue(lead.id);
      if ('error' in res) continue;
      pursued++;
      console.log(C.cyan('» pursued: ') + questCard(eng, res) + '\n');
    }
    autoAssign();
    console.log(C.b('— End of day —'));
    const results = await eng.endDay();
    for (const r of results) console.log(resultBlock(r) + '\n');
    if (!results.length) console.log(C.dim('  (nothing resolved)\n'));
  }
  console.log('\n' + status(eng));
  console.log('\n' + C.mag('Sagas:'));
  for (const ch of Object.values(eng.state.chains)) console.log(`  "${ch.title}" [${ch.state}] ${ch.beatsResolved} beats, ${ch.mercCyclesSpent}/${ch.climaxTarget} cycles — ${C.dim(ch.hook)}`);
}

// ---- interactive REPL -------------------------------------------------------
function help(): void {
  console.log([
    C.b('Commands:'),
    '  s / status            roster, gold, prestige', '  l / leads             the lead board',
    '  p <n>                 pursue lead n (AI generates the quest)', '  q / quests            active quests + odds',
    '  a <quest> <slot> <merc>  assign a merc to a slot', '  auto                  auto-fill all quests (best fit)',
    '  e / endday            resolve everything, see what happens', '  f / fort              fort grid + buildable rooms',
    '  build <cell> <type>   build a room', '  excavate <floor> <l|r>   dig a cell · dig <u|d>  new floor',
    '  bedroom <room> <merc> · display <room> <card>', '  heal <merc> · clear <liab> · ransom <cap> · recruit <cap>',
    '  play <n>              auto-play n cycles', '  h / help · quit',
  ].join('\n'));
}
function findMerc(token: string): CharacterCard | undefined {
  return eng.mercs().concat(eng.captives()).find((m) => m.id === token || m.name.toLowerCase().startsWith(token.toLowerCase()));
}
function showQuests(): void {
  const qs = eng.activeQuests();
  if (!qs.length) { console.log(C.dim('no active quests — pursue a lead')); return; }
  qs.forEach((q) => console.log(questCard(eng, q) + '\n'));
}

async function handle(line: string): Promise<boolean> {
  const [cmd, ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case '': return true;
    case 's': case 'status': console.log(status(eng)); return true;
    case 'l': case 'leads': console.log(leadsList(eng)); return true;
    case 'q': case 'quests': showQuests(); return true;
    case 'f': case 'fort': {
      console.log(fortView(eng));
      console.log(C.dim('buildable: ' + buildableRoomTypes(eng.state).map((t) => `${t.key}(${t.cost}g)`).join(' ')));
      return true;
    }
    case 'p': {
      const lead = eng.leads()[Number(args[0])];
      if (!lead) { console.log(C.red('no such lead')); return true; }
      process.stdout.write(C.dim('  …generating…\r'));
      const res = await eng.pursue(lead.id);
      if ('error' in res) console.log(C.red(res.error)); else console.log(questCard(eng, res));
      return true;
    }
    case 'a': {
      const q = eng.activeQuests().find((x) => x.id === args[0]) ?? eng.activeQuests()[Number(args[0])];
      const merc = findMerc(args[2]);
      if (!q || !merc) { console.log(C.red('usage: a <quest> <slot> <merc>')); return true; }
      console.log(eng.assign(q.id, Number(args[1]), merc.id) ? C.grn('assigned') : C.red('not eligible'));
      return true;
    }
    case 'auto': autoAssign(); showQuests(); return true;
    case 'e': case 'endday': {
      process.stdout.write(C.dim('  …resolving…\r'));
      const results = await eng.endDay();
      for (const r of results) console.log(resultBlock(r) + '\n');
      if (!results.length) console.log(C.dim('nothing resolved'));
      console.log(status(eng));
      return true;
    }
    case 'build': console.log(report(eng.buildRoom(Number(args[0]), args[1]))); return true;
    case 'excavate': console.log(report(eng.excavate(Number(args[0]), args[1] === 'l' ? -1 : 1))); return true;
    case 'dig': console.log(report(eng.digFloor(args[0] === 'd' ? -1 : 1))); return true;
    case 'bedroom': console.log(eng.setBedroomOwner(args[0], findMerc(args[1])?.id ?? '') ? C.grn('ok') : C.red('no')); return true;
    case 'display': console.log(eng.placeDisplay(args[0], findMerc(args[1])?.id ?? args[1]) ? C.grn('ok') : C.red('no')); return true;
    case 'heal': console.log(report(eng.healInjury(findMerc(args[0])?.id ?? ''))); return true;
    case 'clear': console.log(report(eng.clearLiability(args[0]))); return true;
    case 'ransom': console.log(report(eng.ransomCaptive(findMerc(args[0])?.id ?? ''))); return true;
    case 'recruit': console.log(report(eng.recruitCaptive(findMerc(args[0])?.id ?? ''))); return true;
    case 'play': await autoPlay(Number(args[0] || 1)); return true;
    case 'h': case 'help': help(); return true;
    case 'quit': case 'exit': return false;
    default: console.log(C.dim('? type h for help')); return true;
  }
}
function report(r: { error: string } | { ok: true } | { ok: true; gold: number }): string {
  return 'error' in r ? C.red(r.error) : C.grn('ok' + ('gold' in r ? ` (+${r.gold}g)` : ''));
}

// ---- entry ------------------------------------------------------------------
const autoIdx = argv.indexOf('auto');
if (autoIdx >= 0) {
  const n = Number(argv[autoIdx + 1]) || 6;
  await autoPlay(n);
  process.exit(0);
}

console.log(status(eng) + '\n' + C.dim('type h for help, or `play 3` to auto-run.\n'));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: C.cyan('› ') });
rl.prompt();
rl.on('line', async (line) => {
  try { if (!(await handle(line))) { rl.close(); return; } } catch (e) { console.log(C.red(String(e))); }
  rl.prompt();
});
rl.on('close', () => { console.log(C.dim('\nfarewell.')); process.exit(0); });
