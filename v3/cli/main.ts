// Text UI — the dogfooding shell. Interactive REPL over the Game facade, plus a
// batch mode (`--script file` or commands via stdin pipe) so an agent can play it.
// Usage: npm run cli [-- --ai | --sonnet (= --claude)] [--seed N] [--load save.json] [--script cmds.txt]
//   --ai (or AIRAIDER_AI=openai) = OpenAI, production, billed · --claude (or AIRAIDER_AI=claude) = the
//   designer's FREE playtest transport: the same prompts via the headless Claude CLI on the subscription

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { Game, type ReckonMeta, directionSummary } from '../src/game/game.js';
import { aiKindFrom, makeAi } from '../src/ai/select.js';
import { render, slotAt } from './format.js';
import type { AiProvider } from '../src/ai/provider.js';
import { readCallLog, callLogPath } from '../src/ai/calllog.js';

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
  // the same picker as the GUI server (AIRAIDER_AI), plus the flags, which win
  const picked = aiKindFrom(process.env.AIRAIDER_AI, { ai: flag('ai'), claude: flag('claude'), sonnet: flag('sonnet') });
  if (picked.warning) console.log(picked.warning);
  let ai: AiProvider;
  try {
    const made = makeAi(picked.kind, seed);
    ai = made.ai;
    console.log(made.banner);
  } catch (e) { console.error((e as Error).message); process.exit(1) }

  let game: Game;
  const loadPath = opt('load');
  if (loadPath) {
    game = Game.load(ai, fs.readFileSync(loadPath, 'utf8'));
    console.log(`Loaded ${loadPath} (cycle ${game.state.cycle})`);
  } else {
    game = new Game(ai, seed);
  }

  console.log(render.welcome(game));
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
    if (announceJobs(game)) prompt();
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
 *  silently is how you end up re-reading the leads list to find out if anything happened.
 *  ARRIVALS are announced by settle number (Game.arrivals) — the same rule the GUI's toast uses,
 *  so a job that lands between two looks is announced exactly once on both surfaces.
 *  Returns how many were announced. */
let arrivalSeen = 0;
function announceJobs(game: Game): number {
  const got = game.arrivals(arrivalSeen);
  for (const j of got) {
    arrivalSeen = Math.max(arrivalSeen, j.seq ?? 0);
    if (j.state === 'done') {
      console.log(`\n✔ ${j.questTitle ?? j.title} — the card is ready${j.questId ? ` (${j.questId})` : ''}.`);
      // what the landing did beyond the card (a soldier its must-be place locked in) — the GUI's arrival toast says the same,
      // ⚠ when it changed what marches at END (Job.warn — the toast's warn tone; `say` marks a warn reply the same way)
      if (j.note) console.log(j.warn ? `⚠ ${j.note}` : j.note);
      if (j.questId) console.log(render.questDetail(game, j.questId));
    } else if (j.state === 'failed') {
      console.log(`\n✗ ${j.title} — could not be written: ${j.error ?? 'no reason given'}. The lead is still on the board.`);
    }
  }
  return got.length;
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
  // the verdict banner goes up once, when a quest's report LANDS (the engine lists a quest's meta
  // only then) — '━━ SUCCESS ━━ title'
  const bannered = new Set<string>();
  let meta: ReckonMeta[] = [];
  const banner = (b: string[]) => {
    const m = meta.find(x => b[0]?.endsWith(`(${x.questId})`));
    if (!m || bannered.has(m.questId)) return false;
    bannered.add(m.questId);
    stamp(render.verdictBanner(m));
    return true;
  };

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
        const bannerUp = b.length > kept && banner(b);
        if (was > 0 && b.length > kept && !bannerUp) stamp(`▸ ${b[0]!.replace(/^— /, '')}`);
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
      meta = v.meta;
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
  meta = game.reckoningAt()?.meta ?? [];
  sweep(game.lastReckoningBlocks());
  const total = Date.now() - t0;
  // the printout ends on the TALLY — the cycle's spoils, totalled by the engine
  const sum = game.reckoningAt()?.summary;
  if (sum) console.log(`\n${render.tally(sum)}`);
  console.log(render.reckoningFoot(game, completeAt ?? total, completeAt === null ? null : total - completeAt));
  return report;
}

/** a destructive command waiting on its confirm: the same line again (or the `!` form) runs it */
let pendingConfirm: string | null = null;

/** returns true to quit */
async function exec(game: Game, line: string): Promise<boolean> {
  if (!line) return false;
  const [rawCmd, ...rest] = line.split(/\s+/);
  // `abandon!` / `unslot!` / `ransom!` / `sell!` = confirmed; repeating the exact line confirms too
  const bang = rawCmd!.endsWith('!');
  const cmd = bang ? rawCmd!.slice(0, -1) : rawCmd;
  const confirmed = bang || pendingConfirm === `${cmd} ${rest.join(' ')}`;
  pendingConfirm = null;
  const arg = rest.join(' ');
  const questOf = (id: string | undefined) => game.state.quests.find(q => q.id === id);
  const say = (r: { ok: boolean; msg: string; warn?: boolean }) => {
    console.log(r.ok ? `${r.warn ? '⚠' : '✓'} ${r.msg}` : `✗ ${r.msg}`);
    slog({ cycle: game.state.cycle, action: cmd, args: rest, ok: r.ok, msg: r.msg });
  };
  /** R1/critic c: a command that throws something away says what, and waits for its confirm */
  const guard = (what: string | null, form: string): boolean => {
    if (!what || confirmed) return true;
    pendingConfirm = `${cmd} ${rest.join(' ')}`;
    console.log(`⚠ ${what}\n  '${form}' (or the same command again) to go ahead.`);
    return false;
  };
  // gate rooms open menus — view commands report the missing room instead of an empty list
  const locked = (key: string): string | null => {
    const g = game.menuGates().find(m => m.key === key);
    // a gate the engine never enforces (locks:false) never says "build X first"
    return g && !g.open && g.locks ? `🔒 locked — build a ${g.need} first` : null;
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
    case 'leads': console.log(game.leadsAwaitingLeadRoom() ? render.leads(game) : locked('leads') ?? render.leads(game)); break;
    case 'quests': console.log(locked('quests') ?? render.quests(game)); break;
    case 'quest': console.log(render.questDetail(game, arg)); break;
    case 'captives': console.log(locked('captives') ?? render.captives(game)); break;
    case 'items': console.log(locked('items') ?? render.items(game)); break;
    case 'chains': console.log(render.chains(game)); break;
    case 'chain': console.log(render.chainDetail(game, arg)); break;
    case 'lore': console.log(locked('lore') ?? render.lore(game, arg)); break;
    case 'log': console.log(render.log(game, Number(rest.find(x => Number(x))) || 15, rest.includes('dev'))); break;
    // the GUI's AI chip: which AI is live and what this session cost (the claude transport: free, list price for information)
    case 'ai': {
      const u = game.ai.usage();
      console.log(game.ai.name === 'openai' ? `AI: OpenAI · ~$${u.costUsd.toFixed(2)} this session`
        : game.ai.name === 'claude' ? `AI: Claude subscription (playtest) · free — ~$${(u.listCostUsd ?? 0).toFixed(2)} at API list price`
        : 'AI: mock — no cost');
      console.log(`  ${u.calls} calls · ${u.inputTokens} in / ${u.outputTokens} out · the map table writes ${game.maxInFlight} at once ('inflight <n>')`);
      // the same line as the GUI popover: a provider that caps calls below that says so
      const pool = game.ai.concurrency;
      if (pool !== undefined) console.log(`  ${game.maxInFlight > pool ? `but only ${pool}` : `at most ${pool}`} AI calls run at a time — the reckoning's reports share them`);
      break;
    }
    // the GUI's 'ai' tab, for the text UI: every recent call's full prompt and raw reply, to a file
    case 'ailog': {
      // lab: `ailog json <file>` — the WHOLE call log (AIRAIDER_CALL_LOG's, untruncated) as one JSON
      // array; without the flag set, the provider's own ring is all there is
      if (rest[0] === 'json') {
        const out = path.resolve(rest[1] || path.join(LOG_DIR, `ai-calls-c${game.state.cycle}.json`));
        const recs = callLogPath() ? readCallLog() : game.ai.callLog();
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(recs, null, 1));
        console.log(`${recs.length} calls → ${out}${callLogPath() ? '' : ' (the ring only — set AIRAIDER_CALL_LOG for every call)'}`);
        break;
      }
      fs.mkdirSync(LOG_DIR, { recursive: true });
      const p = path.join(LOG_DIR, `ai-calls-c${game.state.cycle}.jsonl`);
      const recs = game.ai.callLog();
      fs.writeFileSync(p, recs.map(r => JSON.stringify(r)).join('\n') + '\n');
      console.log(`${recs.length} calls → ${p}`);
      break;
    }
    case 'reckoning': case 'last': console.log(render.reckoning(game, arg)); break;
    case 'tavern': console.log(locked('recruits') ?? render.tavern(game)); break;
    case 'holding': console.log(locked('staging') ?? render.holding(game)); break;
    case 'buildable': console.log(render.buildable(game)); break;
    case 'status': console.log(render.status(game)); break;
    case 'next': console.log(render.nextSteps(game)); break;

    // ---- actions
    // build <type> [ownerId] [F,C] — F,C = the free cell's floor and column (see 'fort'); default: the first free cell
    case 'build': {
      const at = rest.slice(1).find(t => /^\d+[,:]\d+$/.test(t));
      const owner = rest.slice(1).find(t => t !== at);
      const cell = at ? { floor: Number(at.split(/[,:]/)[0]), col: Number(at.split(/[,:]/)[1]) } : undefined;
      const r = game.build(rest[0]!, owner, cell); say({ ...r, msg: r.id ? `${r.msg} (${r.id})` : r.msg }); break
    }
    case 'upgrade': say(game.upgrade(rest[0]!)); break;
    case 'renovate': say(await game.renovate(rest[0]!, rest[1] ?? 'human')); break;
    case 'excavate': say(game.excavate()); break;
    case 'gh': say(game.ghUpgrade()); break;
    case 'slot': say(game.slot(rest[0]!, Number(rest[1]), rest[2]!)); break;
    // THE room path both UIs share (Game.setInRoom). Either order: setin <card> <room> [idx]
    case 'setin': {
      const [x, y, idx] = rest;
      const [roomId, cardId] = game.room(x ?? '') ? [x!, y!] : [y!, x!];
      say(game.setInRoom(roomId, cardId, idx === undefined ? undefined : Number(idx)));
      break;
    }
    case 'unslot': {
      const room = game.room(rest[0]!);
      const id = room?.slots[Number(rest[1])];
      const loss = id ? game.rackLoss(id) : null;
      if (!guard(loss && `${game.card(id!)?.name} comes off the rack — ${loss}.`, `unslot! ${rest.join(' ')}`)) break;
      say(game.unslot(rest[0]!, Number(rest[1])));
      break;
    }
    // TEMPO G1: the click is ANSWERED, not obeyed — the map table takes the job and the board
    // stays yours. The card arrives when it arrives (announceJobs prints it).
    case 'pursue': {
      const r = rest[0] === 'all' ? game.pursueAll() : game.enqueuePursue(rest[0]!);
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
    // a place number is the quest screen's: counted within the places in play (a chosen finale plan's own)
    case 'assign': say(game.assign(rest[0]!, slotAt(questOf(rest[0]), Number(rest[1])), rest[2]!)); break;
    // the SAME engine call the web's Auto button makes — never a second implementation (G5)
    case 'auto': say(!rest[0] || rest[0] === 'all' ? game.autoAssignAll() : game.autoAssign(rest[0]!)); break;
    // direction [text|clear] — the Settings screen's free text for the AI storyteller (theme + trait preferences)
    case 'direction': {
      if (!arg) { const d = game.direction(); console.log(d ? `DIRECTION: "${d.text}"\n  → ${directionSummary(d)}` : '(no direction set — e.g. direction Dark fantasy, grim; make the NPCs men)'); break }
      say(await game.setDirection(arg === 'clear' ? '' : arg)); break;
    }
    case 'send': say(game.sendTo(rest[0]!, rest[1]!, rest[2] === undefined ? undefined : slotAt(questOf(rest[0]), Number(rest[2])))); break;
    case 'fit': console.log(render.fit(game, rest[0] ?? '', rest[1])); break;
    case 'unassign': say(game.unassign(rest[0]!, slotAt(questOf(rest[0]), Number(rest[1])))); break;
    case 'clear': say(game.clearQuest(rest[0]!)); break;
    // THE MARCH WORD: a job only its must-be lock fills waits for it (the quest page's and the board's March / Hold)
    case 'march': say(game.setMarchWord(rest[0]!, true)); break;
    case 'hold': say(game.setMarchWord(rest[0]!, false)); break;
    case 'approach': {
      // switching a manned plan sends its party back — the quest page confirms on the same line
      const loss = game.approachSwitchLoss(rest[0]!, rest[1]!);
      if (!guard(loss && `${loss[0]!.toUpperCase()}${loss.slice(1)}.`, `approach! ${rest.join(' ')}`)) break;
      say(game.chooseApproach(rest[0]!, rest[1]!));
      break;
    }
    case 'abandon': {
      const q = game.state.quests.find(x => x.id === rest[0] && x.state === 'open');
      if (q && !guard(`Abandon ${q.title}? ${game.abandonConsequence(q.id)}`, `abandon! ${rest[0]}`)) break;
      say(game.abandon(rest[0]!));
      break;
    }
    case 'hire': say(game.hire(rest[0]!)); break;
    case 'accept': say(game.acceptCaptive(rest[0]!)); break;
    case 'ransom': case 'sell': {
      // ONE rule with the GUI: a card on a rack or on show says what cashing it out throws away, twice
      const rack = game.rackLoss(rest[0]!), show = game.cashOutLoss(rest[0]!);
      const what = rack ? `${game.card(rest[0]!)?.name} is on the rack — ${rack}.`
        : show ? `${game.card(rest[0]!)?.name} is on show — ${show}.` : null;
      if (!guard(what, `${cmd}! ${rest[0]}`)) break;
      say(cmd === 'ransom' ? game.ransom(rest[0]!) : game.sell(rest[0]!));
      break;
    }
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
      // R5: END with something to lose prints it and waits for 'end!' (or 'end' again)
      const w = game.endWarnings();
      // the jobs waiting for your word stay home — said every time, as information (never part of the confirm)
      const waiting = render.waitingForWord(game);
      if (waiting) console.log(waiting);
      if (w.length && !guard(render.endWarnings(w), 'end!')) break;
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

    // ---- SAGA LAB dev commands (docs/STORYTELLER.md §5.0) — CLI-only by design, not in 'help'.
    // `mark <token>` echoes, so a driver piping one command at a time knows where its output ends
    case 'mark': console.log(`⟦mark ${arg}⟧`); break;
    case 'lab': {
      if (rest[0] === 'saga' && rest[1]) {
        const p = path.resolve(rest.slice(1).join(' '));
        let fx: unknown;
        try { fx = JSON.parse(fs.readFileSync(p, 'utf8')) } catch (e) { console.log(`✗ cannot read fixture ${p}: ${(e as Error).message}`); break }
        say(game.labSaga(fx as never));
      } else if (rest[0] === 'state') console.log(JSON.stringify(game.labState()));
      else console.log('lab saga <fixture.json> · lab state');
      break;
    }

    default: console.log(`unknown command: ${cmd} (try 'help')`);
  }
  return false;
}

// an in-flight AI call keeps node alive long after the player has left — quitting must actually
// quit (measured 2026-08-26: a 66s genesis held the process for nearly two minutes after `quit`)
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) });
