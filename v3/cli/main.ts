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
      if (done) break;
    }
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY ?? false });
  const prompt = () => { if (process.stdin.isTTY) rl.setPrompt(`\n[c${game.state.cycle} | ${game.gold()}g | P${game.prestige().toFixed(0)} | GH T${game.state.fort.ghTier}] > `); if (process.stdin.isTTY) rl.prompt() };
  prompt();
  for await (const line of rl) {
    try {
      const done = await exec(game, line.trim());
      if (done) break;
    } catch (e) {
      console.log(`error: ${(e as Error).message}`);
    }
    prompt();
  }
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
    case 'quit': case 'exit': return true;

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
    case 'pursue': { const r = await game.pursue(rest[0]!); say(r); if (r.ok && r.questId) console.log(render.questDetail(game, r.questId)); break }
    case 'assign': say(game.assign(rest[0]!, Number(rest[1]), rest[2]!)); break;
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
      const report = await game.endCycle();
      console.log(render.cycleReport(game, report));
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

main().catch(e => { console.error(e); process.exit(1) });
