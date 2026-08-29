// Text UI — the dogfooding shell. Interactive REPL over the Game facade, plus a
// batch mode (`--script file` or commands via stdin pipe) so an agent can play it.
// Usage: npm run cli [-- --ai] [--seed N] [--load save.json] [--script cmds.txt]

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { render } from './format.js';
import type { AiProvider } from '../src/ai/provider.js';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const SAVE_DIR = path.join(process.cwd(), 'saves');
const LOG_DIR = path.join(process.cwd(), 'logs');
const SESSION_LOG = path.join(LOG_DIR, 'session-cli.jsonl');
function slog(entry: Record<string, unknown>) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(SESSION_LOG, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* never break play */ }
}

async function main() {
  // fresh seed per run — a fixed default replayed the same draws every game (--seed pins one)
  const seed = Number(opt('seed') ?? Date.now() % 2 ** 31);
  let ai: AiProvider;
  if (flag('ai')) {
    ai = makeOpenAiProvider();
    console.log('AI: OpenAI (real)');
  } else {
    ai = new MockProvider(seed);
    console.log('AI: mock (deterministic; use --ai for the real thing)');
  }

  let game: Game;
  const loadPath = opt('load');
  if (loadPath) {
    game = Game.load(ai, fs.readFileSync(loadPath, 'utf8'));
    console.log(`Loaded ${loadPath} (cycle ${game.state.cycle})`);
  } else {
    game = new Game(ai, seed);
  }

  console.log(render.welcome());
  console.log(render.fort(game));

  const scriptPath = opt('script');
  if (scriptPath) {
    const lines = fs.readFileSync(scriptPath, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    for (const line of lines) {
      console.log(`\n> ${line}`);
      const done = await exec(game, line);
      announceJobs(game);
      if (done) break;
    }
    return;
  }

  // a card that lands while you are staring at the fort should reach you there, not the next time
  // you happen to type something
  const ticker = setInterval(() => {
    const before = jobsSeen.size;
    announceJobs(game);
    if (before !== jobsSeen.size || game.jobs().some(j => j.state === 'done' || j.state === 'failed')) prompt();
  }, 1000);
  ticker.unref?.();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY ?? false });
  const prompt = () => {
    if (!process.stdin.isTTY) return;
    const out = game.jobs().filter(j => j.state === 'queued' || j.state === 'running').length;
    rl.setPrompt(`\n[c${game.state.cycle} | ${game.gold()}g | P${game.prestige().toFixed(0)} | GH T${game.state.fort.ghTier}${out ? ` | ✎${out}` : ''}] > `);
    rl.prompt();
  };
  prompt();
  for await (const line of rl) {
    try {
      const done = await exec(game, line.trim());
      if (done) break;
      announceJobs(game);
    } catch (e) {
      console.log(`error: ${(e as Error).message}`);
    }
    prompt();
  }
}

/** A job that finished must SAY so, wherever the player's attention is — the board updating
 *  silently is how you end up re-reading the leads list to find out if anything happened. */
const jobsSeen = new Map<string, string>();
function announceJobs(game: Game): void {
  for (const j of game.jobs()) {
    if (jobsSeen.get(j.id) === j.state) continue;
    const was = jobsSeen.get(j.id);
    jobsSeen.set(j.id, j.state);
    if (!was && j.state !== 'done' && j.state !== 'failed') continue;   // first sighting while still working
    if (j.state === 'done') {
      console.log(`\n✔ ${j.title} — the card is ready${j.questId ? ` (${j.questId})` : ''}.`);
      if (j.questId) console.log(render.questDetail(game, j.questId));
    } else if (j.state === 'failed') {
      console.log(`\n✗ ${j.title} — could not be written: ${j.error ?? 'no reason given'}. The lead is still on the board.`);
    }
  }
}

/** THE RECKONING, live. The text UI shows the SAME thing the GUI's reckoning page does — each
 *  quest's slot held open the moment END is pressed, then filled when its own call lands — because
 *  this is the surface that can actually be played here, and a feature that only exists in the
 *  surface nobody can drive is a feature nobody has tried. Batch mode still runs to completion
 *  (the facade contract): it renders the same stream, it just never waits for a keypress. */
async function runReckoning(game: Game): Promise<string[]> {
  const t0 = Date.now();
  const done = game.endCycle();
  let settled: string[] | null = null;
  let failed: unknown;
  done.then(r => { settled = r }, e => { failed = e });

  // the header is printed on the first sighting of a live reckoning, NOT before: END now drains the
  // map table first, so the cycle number does not bump until that finishes, and a header printed
  // eagerly names the cycle that is ending rather than the one resolving
  let headed = false;
  const header = () => { if (!headed) { headed = true; console.log(render.reckoningHead(game)) } };
  // A terminal cannot rewrite what it printed, so it prints each BLOCK once when first seen — the
  // placeholder, which already carries the quest's title and its CARD, so there is something to
  // read during the wait exactly as there is on the page — and then appends only what the landed
  // report ADDS. The placeholder's lines are a prefix of the finished block by construction.
  const printedLen = new Map<number, number>();
  let completeAt: number | null = null;
  const stamp = (l: string) => console.log(render.reckoningLine(l, Date.now() - t0));

  const sweep = (blocks: string[][]) => {
    blocks.forEach((b, i) => {
      if (!b.length) return;
      const was = printedLen.get(i) ?? 0;
      if (b.length === was) return;
      // how much of what we printed still stands? (a block that was REVISED rather than extended —
      // the error path replaces its lines — must be reprinted, not silently half-shown)
      const prev = printedBlocks.get(i) ?? [];
      let common = 0;
      while (common < prev.length && common < b.length && prev[common] === b[common]) common++;
      // the ✎ line is the one thing a landed block DROPS rather than keeps, so losing exactly it
      // is not a revision — it is the report arriving. The stale line stays on screen above, which
      // is how a terminal reads anyway: "…being written…", then the report.
      const kept = was - (prev[was - 1]?.startsWith('✎') ? 1 : 0);
      if (common < kept) { stamp('(revised)'); for (const l of b) stamp(l) }
      else {
        // the arriving lines are detached from the header printed minutes of screen ago — on a page
        // the block fills under its own title, in a stream it needs to say whose report this is
        if (was > 0 && b.length > kept) stamp(`▸ ${b[0]!.replace(/^— /, '')}`);
        for (let k = Math.max(common, kept); k < b.length; k++) stamp(b[k]!);
      }
      printedLen.set(i, b.length);
      printedBlocks.set(i, [...b]);
    });
  };
  const printedBlocks = new Map<number, string[]>();

  while (settled === null && failed === undefined) {
    const v = game.reckoningView();
    if (v) {
      header();
      sweep(v.blocks);
      if (!v.writing && completeAt === null) completeAt = Date.now() - t0;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  if (failed !== undefined) {
    console.log(`\n⚠ the reckoning broke off — this cycle could not be resolved.\n  (${(failed as Error).message?.slice(0, 160)})`);
    throw failed;
  }
  const report = settled as unknown as string[];
  header();
  // a fast provider can finish the whole cycle between two polls — the final shape is kept by the
  // engine precisely so nothing goes unprinted just because we blinked
  sweep(game.lastReckoningBlocks());
  const total = Date.now() - t0;
  console.log(render.reckoningFoot(game, completeAt ?? total, completeAt === null ? null : total - completeAt));
  return report;
}

/** returns true to quit */
async function exec(game: Game, line: string): Promise<boolean> {
  if (!line) return false;
  const [cmd, ...rest] = line.split(/\s+/);
  const arg = rest.join(' ');
  const say = (r: { ok: boolean; msg: string }) => {
    console.log(r.ok ? `✓ ${r.msg}` : `✗ ${r.msg}`);
    slog({ cycle: game.state.cycle, action: cmd, args: rest, ok: r.ok, msg: r.msg });
  };
  // gate rooms open menus — view commands report the missing room instead of an empty list
  const locked = (key: string): string | null => {
    const g = game.menuGates().find(m => m.key === key);
    return g && !g.open ? `🔒 locked — build a ${g.need} first` : null;
  };

  switch (cmd) {
    case 'help': console.log(render.help()); break;
    case 'quit': case 'exit': {
      // N3: work does not survive closing the game — but it must SAY so rather than vanish, and
      // the process must not sit for a minute holding a genesis nobody will ever read
      const b = render.jobsBrief(game);
      if (b) console.log(`${b} — dropped: the map table does not work while the game is closed.`);
      return true;
    }

    // ---- views
    case 'fort': console.log(render.fort(game)); break;
    case 'rooms': console.log(render.rooms(game)); break;
    case 'room': console.log(render.roomDetail(game, arg)); break;
    case 'roster': console.log(render.roster(game)); break;
    case 'merc': console.log(render.merc(game, arg)); break;
    case 'leads': console.log(locked('leads') ?? render.leads(game)); break;
    case 'quests': console.log(locked('quests') ?? render.quests(game)); break;
    case 'quest': console.log(render.questDetail(game, arg)); break;
    case 'captives': console.log(locked('captives') ?? render.captives(game)); break;
    case 'items': console.log(locked('items') ?? render.items(game)); break;
    case 'chains': console.log(render.chains(game)); break;
    case 'chain': console.log(render.chainDetail(game, arg)); break;
    case 'lore': console.log(locked('lore') ?? render.lore(game, arg)); break;
    case 'log': console.log(render.log(game, Number(arg) || 15)); break;
    case 'reckoning': case 'last': console.log(render.reckoning(game, arg)); break;
    case 'tavern': console.log(locked('recruits') ?? render.tavern(game)); break;
    case 'holding': console.log(locked('staging') ?? render.holding(game)); break;
    case 'buildable': console.log(render.buildable(game)); break;
    case 'status': console.log(render.status(game)); break;

    // ---- actions
    case 'build': say(game.build(rest[0]!, rest[1])); break;
    case 'upgrade': say(game.upgrade(rest[0]!)); break;
    case 'renovate': say(await game.renovate(rest[0]!, rest[1] ?? 'human')); break;
    case 'excavate': say(game.excavate()); break;
    case 'gh': say(game.ghUpgrade()); break;
    case 'slot': say(game.slot(rest[0]!, Number(rest[1]), rest[2]!)); break;
    case 'unslot': say(game.unslot(rest[0]!, Number(rest[1]))); break;
    // TEMPO G1: the click is ANSWERED, not obeyed — the map table takes the job and the board
    // stays yours. The card arrives when it arrives (announceJobs prints it).
    case 'pursue': {
      const r = game.enqueuePursue(rest[0]!);
      say(r);
      if (r.ok) { const b = render.jobsBrief(game); if (b) console.log(b) }
      break;
    }
    case 'jobs': console.log(render.jobs(game)); break;
    case 'cancel': say(game.cancelJob(rest[0]!)); break;
    case 'inflight': {
      const n = Math.max(1, Math.min(6, Number(rest[0]) || game.maxInFlight));
      game.maxInFlight = n;
      say({ ok: true, msg: `the map table works ${n} job(s) at once` });
      break;
    }
    case 'wait': {
      const b = render.jobsBrief(game);
      console.log(b ? `${b} — waiting…` : '(nothing out)');
      await game.drain();
      announceJobs(game);
      break;
    }
    case 'assign': say(game.assign(rest[0]!, Number(rest[1]), rest[2]!)); break;
    // the SAME engine call the web's Auto button makes — never a second implementation (G5)
    case 'auto': say(!rest[0] || rest[0] === 'all' ? game.autoAssignAll() : game.autoAssign(rest[0]!)); break;
    case 'unassign': say(game.unassign(rest[0]!, Number(rest[1]))); break;
    case 'approach': say(game.chooseApproach(rest[0]!, rest[1]!)); break;
    case 'abandon': say(game.abandon(rest[0]!)); break;
    case 'hire': say(game.hire(rest[0]!)); break;
    case 'accept': say(game.acceptCaptive(rest[0]!)); break;
    case 'ransom': say(game.ransom(rest[0]!)); break;
    case 'sell': say(game.sell(rest[0]!)); break;
    case 'settle': say(game.payOffLiability(rest[0]!)); break;
    case 'interrogate': say(game.interrogate(rest[0]!)); break;
    case 'heal': say(game.payHeal(rest[0]!)); break;
    case 'focus': {
      const [id, kind, a, b] = rest;
      const focus = kind === 'single' ? { kind: 'single' as const, attr: a as never }
        : kind === 'dual' ? { kind: 'dual' as const, a: a as never, b: b as never }
        : { kind: 'none' as const };
      say(game.setFocus(id!, focus as never)); break;
    }

    case 'end': {
      const b = render.jobsBrief(game);
      if (b) { console.log(`${b} — the cycle waits for the map table…`); await game.drain(); announceJobs(game) }
      const report = await runReckoning(game);
      slog({ cycle: game.state.cycle, action: 'end', report, ai: game.ai.usage() });
      break;
    }

    case 'save': {
      fs.mkdirSync(SAVE_DIR, { recursive: true });
      const p = path.join(SAVE_DIR, `${arg || 'game'}.json`);
      fs.writeFileSync(p, game.save());
      console.log(`saved → ${p}`);
      break;
    }

    default: console.log(`unknown command: ${cmd} (try 'help')`);
  }
  return false;
}

// an in-flight AI call keeps node alive long after the player has left — quitting must actually
// quit (measured 2026-08-26: a 66s genesis held the process for nearly two minutes after `quit`)
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) });
