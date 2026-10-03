// CLI rendering — compact tables for the dogfooding shell.

import { Game, type ReckonMeta, type CycleSummary, type EndWarning, type NextStep } from '../src/game/game.js';
import { renderTags } from '../src/engine/tags.js';
import { roomDesc, roomWants } from '../src/game/roomInfo.js';
import { ROOM_TYPE } from '../src/engine/fort.js';
import { unitWorth, unitStars, unitPeak } from '../src/engine/economy.js';
import { leadBand } from '../src/engine/quests.js';
import { REGION } from '../src/engine/regions.js';
import { cardType, stackKind, isLiability } from '../src/engine/cards.js';
import { slotThreshold, coins, explainCoins, coinsWhy, slotStrength, BAND_TEXT } from '../src/engine/roll.js';
import { xpNeeded } from '../src/engine/growth.js';
import { logLines, matterLine } from '../src/ai/storyteller.js';

const pct = (x: number | null) => x === null ? '—' : `${Math.round(x * 100)}%`;

/** colour for a terminal only — a pipe or a log file gets the plain words */
const TTY = !!process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: string, t: string) => TTY ? `\x1b[${code}m${t}\x1b[0m` : t;
const OUTCOME_COLOR: Record<string, string> = { success: '1;32', partial: '1;33', failure: '1;31' };

/** where a next step happens, as the command that shows it */
const stepView = (t: NextStep['target']): string =>
  t.screen === 'quest' ? `quest ${t.questId}` : t.screen === 'room' ? `room ${t.roomId}` : t.screen === 'leads' ? 'leads'
  : t.screen === 'holding' ? 'holding' : t.screen === 'tavern' ? 'tavern' : t.screen === 'build' ? 'buildable' : t.screen === 'fort' ? 'fort' : 'quests';
const stepLine = (st: NextStep) =>
  `${st.urgent ? '!' : '·'} ${st.text}${st.detail ? ` (${st.detail})` : ''}` +
  (st.act ? ` → ${st.act.label} ('${st.act.cli}')${st.act.then ? `, then ${st.act.then}` : ''}${st.act.block ? ` [${st.act.block}]` : ''}`
    : st.kind === 'end' ? " → 'end'" : ` → '${stepView(st.target)}'`);

/** what the captive count counts — ONE phrase for every surface that shows it */
export const CAPTIVE_COUNT_NOTE = 'counts captives in the cells, on the rack or on show — holding does not count until you take them';

/** reward kinds as the board's icons say them */
const KIND_WORD: Record<string, string> = { captive: '⛓captive', recruit: '☺recruit', relic: '◆relic', lead: '🧭lead', gold: '¤gold' };
const kindsLine = (ks: string[]) => ks.map(k => KIND_WORD[k] ?? k).join(' ');

/** the coin reasons, compact: "+roguery −playful wound −9" */
const whyLine = (w: { plus: string[]; minus: string[]; wound: number }) =>
  [...w.plus.map(x => `+${x}`), ...w.minus.map(x => `−${x}`), ...(w.wound ? [`wound −${w.wound}`] : [])].join(' ');

/** a fix, as a typed hint: "→ Add a place · 84g ('upgrade room-3')" */
const fixLine = (f: { label: string; action?: string; roomId?: string; type?: string; block?: string | null } | null | undefined): string => {
  if (!f) return '';
  // a blocked raise names no command: its block says why typing 'gh' would not do what the label promises
  const cmd = f.action === 'upgrade' ? `upgrade ${f.roomId}` : f.action === 'build' ? `build ${f.type}` : f.action === 'excavate' ? 'excavate' : f.action === 'gh' && !f.block ? 'gh' : '';
  return ` → ${f.label}${cmd ? ` ('${cmd}')` : ''}${f.block ? ` [${f.block}]` : ''}`;
};

/** leads the text UI has listed — the twin of the web's unseen-leads count */
const seenLeads = new Set<string>();

/** the rarity marker (2026-08-27): what a person is actually WORTH from their tags, and how that
 *  compares to what was spent making them. `value` is the mark and is identical for a jackpot and
 *  a dud, so it can never show this. */
const mark = (c: { tags: { concept: string; tier?: number }[]; value: number }) =>
  `${('★'.repeat(unitStars(c as never)) || '·').padEnd(4)} ${String(unitWorth(c as never)).padStart(5)}g`;

export const render = {
  welcome(g: Game): string {
    const first = g.nextSteps()[0];
    return [
      '╔════════════════════════════════════════════╗',
      '║  AIRAIDER v3 — the fort remembers          ║',
      '╚════════════════════════════════════════════╝',
      `Type 'help' for commands, 'next' for what to do.${first ? ` First: ${stepLine(first)}` : ''}`,
    ].join('\n');
  },

  help(): string {
    return [
      'VIEWS   fort · rooms · room <id> · roster · merc <id> · leads · quests · quest <id>',
      '        captives · items · chains · chain <id> · lore <id> · tavern · holding',
      '        buildable · status · next · log [n|dev] · reckoning [cycle|list] · ai · ailog',
      'BUILD   build <type> [ownerId] [F,C] · upgrade <roomId> · renovate <roomId> <style>',
      '        excavate · gh   (styles: human elven wolfkin lizardkin ancient exotic)',
      'ROOMS   setin <cardId> <roomId> [idx] — set a relic / captive in a room (best free place, or a swap that gains)',
      '        fit <cardId> — where it could go: a soldier on every quest, a captive or relic in every room',
      '        fit <cardId> <roomId> — that room place by place (an occupied place swaps: what it costs)',
      '        unslot <roomId> <idx> (off a rack: unslot! — breaking is lost) · slot <roomId> <idx> <cardId>',
      '        focus <mercId> single|dual|none <attr> [attr2]',
      'QUESTS  pursue <leadId> · pursue all · assign <qId> <slot> <mercId> · unassign <qId> <slot> · clear <qId>',
      '        approach <qId> <gId> — switching a manned plan sends its party back: approach! (or repeat) to do it',
      '        auto [qId|all]   — man a quest (or every quest) with the best fit going',
      '        send <qId> <mercId> [slot] — into that place (swapping its holder) or their best free one',
      '        abandon <qId> — says what it costs; abandon! <qId> (or repeat it) to do it',
      'QUEUE   jobs · wait · cancel <jobId> · inflight <n>   (pursue returns at once; cards arrive later)',
      'PEOPLE  hire <id> · accept <id> · ransom <id> · sell <id> · settle <id> · interrogate <id> · heal <id>',
      '        (on the rack, or on show earning prestige: ransom! / sell! — it says what is lost)',
      'TURN    end   — commit the cycle: everything rolls, the AI narrates. When something would go cold (a quest,',
      "        a saga's lead, a captive in holding, a guest at the tavern), a part-filled quest won't march or a",
      '        finale has no approach, it lists them: end! (or end again) to go on',
      '        next  — what to do next, most pressing first (status shows the top 3)',
      'SETTINGS direction [text|clear] — tell the AI storyteller your theme and trait wishes (e.g. "Dark fantasy; make the NPCs men")',
      'META    save [name] · quit',
    ].join('\n');
  },

  status(g: Game): string {
    const gh = g.ghInfo();
    const ghLine = gh.next === null ? `GH T${gh.tier} (final tier)`
      : `GH T${gh.tier}→T${gh.next}: prestige ${gh.have.toFixed(1)}/${gh.need} ${gh.have >= gh.need! ? '✓' : '✗'} · gold ${gh.gold}/${gh.cost} ${gh.gold >= gh.cost! ? '✓' : '✗'}` +
        `${gh.unlocks.length ? ` · opens ${gh.unlocks.slice(0, 4).map(u => u.name).join(', ')}${gh.unlocks.length > 4 ? '…' : ''}` : ''}` +
        (gh.ready ? `  — READY: type 'gh'` : '');
    const unseen = g.visibleLeads().filter(l => !seenLeads.has(l.id)).length;
    return [
      `cycle ${g.state.cycle} · gold ${g.gold()} · prestige ${g.prestige().toFixed(1)} · GH T${g.state.fort.ghTier}`,
      ghLine,
      `roster ${g.roster().length}/${g.rosterCapacity()} · captives ${g.captives().length}/${g.captiveCapacity()}${g.captiveCapacity() ? ` (${CAPTIVE_COUNT_NOTE})` : ''}${g.state.holding.length ? ` · ${g.state.holding.length} in holding ('holding')` : ''} · regions: ${g.activeRegions().map(r => REGION[r]?.name ?? r).join(', ')}`,
      `leads ${g.visibleLeads().length}${unseen ? ` (${unseen} unseen — 'leads')` : ''} · open quests ${g.state.quests.filter(q => q.state === 'open').length} · live chains ${g.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending').length}`,
      this.jobsBrief(g),
      (n => `marching at END: ${n ? `${n} part${n === 1 ? 'y' : 'ies'}` : 'nobody'}${(w => w ? ` · ${w} warning${w === 1 ? '' : 's'} ('end' lists them)` : '')(g.endWarnings().length)}`)(g.marching()),
      ...g.nextSteps().slice(0, 3).map((st, i) => `${i ? '      ' : 'next: '}${stepLine(st)}`),
    ].filter(Boolean).join('\n');
  },

  /** R4: the whole next-steps list */
  nextSteps(g: Game): string {
    return ['NEXT (most pressing first):', ...g.nextSteps().map(st => `  ${stepLine(st)}`)].join('\n');
  },

  /** R5: what END would lose — printed before 'end!' is asked for */
  endWarnings(w: EndWarning[]): string {
    return ['END would leave behind:', ...w.map(x => `  ${(x.questId ?? x.key).padEnd(6)} ${x.title} — ${x.text}`)].join('\n');
  },

  /** '━━ SUCCESS ━━ title' — the verdict, over its quest's report */
  verdictBanner(m: ReckonMeta): string {
    return paint(OUTCOME_COLOR[m.outcome] ?? '1', `━━ ${m.outcome.toUpperCase()} ━━`) + ` ${m.title}${m.isFinale ? ' ♛' : ''}`;
  },

  /** the cycle's spoils in one line (the web's tally strip says the same, from the same summary) */
  tally(sum: CycleSummary): string {
    const o = sum.outcomes, marched = o.success + o.partial + o.failure;
    const verdicts = marched ? ` · ${[o.success && `${o.success} success`, o.partial && `${o.partial} partial`, o.failure && `${o.failure} failed`].filter(Boolean).join(', ')}` : '';
    return `${paint('1', `TALLY c${sum.cycle}:`)} ${Game.tallyLine(sum)}${verdicts}`;
  },

  fort(g: Game): string {
    const floors = new Map<number, string[]>();
    const maxFloor = Math.max(...g.state.fort.cells.map(c => c.floor));
    for (let f = 0; f <= maxFloor; f++) {
      const row: string[] = [];
      const cols = g.state.fort.cells.filter(c => c.floor === f).length;
      for (let c = 0; c < cols; c++) {
        const room = g.state.fort.rooms.find(r => r.cell.floor === f && r.cell.col === c);
        row.push(room ? `[${ROOM_TYPE[room.type]!.name.slice(0, 14).padEnd(14)}]` : `[ free · ${f},${c}`.padEnd(15) + ']');
      }
      floors.set(f, row);
    }
    const lines = [...floors.entries()].map(([f, row]) => `F${f}  ${row.join(' ')}`);
    const free = g.freeCells();
    return `${this.status(g)}\n${lines.join('\n')}${free.length ? `\n(build into a free cell: build <type> F,C — e.g. build ${g.buildableTypes().find(b => !b.reason)?.type ?? 'garden'} ${free[0]!.floor},${free[0]!.col})` : ''}`;
  },

  rooms(g: Game): string {
    const lines = g.state.fort.rooms.map(r => {
      const t = ROOM_TYPE[r.type]!;
      const eff = g.roomEffect(r);
      const slots = r.slots.length ? ` [${r.slots.map(s => s ? g.card(s)?.name?.split(' ')[0] ?? '?' : '·').join('|')}]` : '';
      const owner = r.ownerId ? ` owner=${r.ownerId === 'you' ? 'you' : g.card(r.ownerId)?.name ?? r.ownerId}` : '';
      return `${r.id.padEnd(10)} ${t.name.padEnd(24)}${eff ? ` ${eff}` : ''}${slots}${owner}`;
    });
    lines.push(`— GLOBAL PRESTIGE ${g.prestige().toFixed(1)} = ${g.prestigeSources().filter(x => x.prestige > 0).map(x => `${x.name} ${x.prestige.toFixed(1)}`).join(' + ') || 'nothing yet — set relics and tamed captives in prestige rooms'}`);
    return lines.join('\n');
  },

  roomDetail(g: Game, id: string): string {
    const r = g.room(id);
    if (!r) return 'no such room';
    const t = ROOM_TYPE[r.type]!;
    const kind = g.roomKind(r);
    const eff = g.roomEffect(r);
    const lines = [`${t.name} (${r.id}) — ${roomDesc(r.type, g.activeRegions())}${r.style ? ` · style: ${r.style}` : ''}${eff ? `\n  now: ${eff}` : ''}`];
    // the prisoner hub: every captive you hold, by state (R7: stationing does not free a cell)
    if (r.type === 'dungeon' || r.type === 'dungeon-cell') {
      const cs = g.captives();
      lines.push(`  captives ${cs.length}/${g.captiveCapacity()} — ${CAPTIVE_COUNT_NOTE}`);
      const by = (st: string) => cs.filter(c => g.captiveState(c.id)?.state === st);
      const row = (c: { id: string; name: string }) => {
        const s = g.captiveState(c.id)!;
        const rows = g.roomPlacementsFor(c.id);
        const best = rows.find(p => p.ok);
        // nothing takes them: the SAME place-to-make the prisoner hub and the next-steps scroll name
        const pf = g.placeFixFor(c.id, rows);
        const make = pf ? ` → ${pf.roomName}: ${fixLine(pf.fix as never).slice(3)}` : '';
        const tail = s.state === 'breaking' ? `tamed by cycle ${s.doneAt} (${s.doneAt! - g.state.cycle} left) in the ${s.whereName}`
          : s.state === 'onShow' ? `on show in the ${s.whereName}`
          : best ? `best: ${best.roomName} — ${best.label} ('setin ${c.id} ${best.roomId}')`
          : s.state === 'raw' ? `ransom ~${g.ransomQuote(c.id)}g · sell ~${g.sellQuote(c.id)}g · no rack free${make}`
          : `no free place${make}`;
        const ask = g.hasRoom('interrogation') && !g.card(c.id)!.tags.some(t => t.concept === 'interrogated') ? ` · 'interrogate ${c.id}'` : '';
        return `    ${c.id.padEnd(6)} ${c.name.padEnd(24)} ${tail}${ask}`;
      };
      for (const [st, label] of [['raw', 'RAW'], ['breaking', 'BREAKING'], ['tamed', 'TAMED'], ['onShow', 'ON SHOW']] as const) {
        const xs = by(st);
        if (xs.length) lines.push(`  ${label} (${xs.length})`, ...xs.map(row));
      }
      if (g.state.holding.length) lines.push(`  in holding: ${g.state.holding.length} — 'holding'`);
      return lines.join('\n');
    }
    if (t.species === 'comfort') {
      const wants = g.effectiveWants(r);
      lines.push(`  comfort ${g.comfort(r).toFixed(1)} · wants: ${wants.map(w => w.match).join(', ') || '(none — renovate to set a theme)'} · takes ${kind === 'rack' ? 'raw captives' : 'relics & tamed captives'}`);
      r.slots.forEach((s, i) => {
        const c = s ? g.card(s) : null;
        if (!c) { lines.push(`  place ${i}: (empty)`); return }
        const brk = g.state.breaking.find(b => b.cardId === c.id);
        const share = g.slotShare(r.id, i);
        const tail = brk ? ` (tamed by cycle ${brk.doneAtCycle}, ${brk.doneAtCycle - g.state.cycle} left — unslot! loses it)`
          : share ? ` (${share.prestige > 0.05 ? `−${share.prestige.toFixed(1)} prestige` : `→ ${share.effectAfter}`} if taken out)` : '';
        lines.push(`  place ${i}: ${c.name}${tail} [${renderTags(c.tags)}]`);
      });
      const add = g.addPlaceFix(r);
      if (!r.slots.length) lines.push(`  (no places yet)${fixLine(add)}`);
      else if (add) lines.push(`  ${fixLine(add).slice(3)}`);
      const cands = g.roomCandidates(r.id);
      const ok = cands.filter(c => c.ok);
      if (ok.length) lines.push(`  CANDIDATES (setin <cardId> ${r.id}):`, ...ok.slice(0, 8).map(c => `    ${c.cardId.padEnd(6)} ${c.name.padEnd(24)} ${c.label}`));
      else if (cands.length) lines.push(`  nothing you hold fits here now (${cands[0]!.reason})`);
    }
    return lines.join('\n');
  },

  roster(g: Game): string {
    return g.roster().map(m => {
      const ch = m.character!;
      const a = ch.attrs;
      const busy = m.location.kind === 'quest' ? ` ⚔ on ${m.location.questId}` : '';
      const injury = ch.injuryTiers > 0 ? ` 🩸${ch.injuryTiers}(~${g.healEta(m).cycles}c)` : '';
      const cap = g.capOf(m.id);
      return `${m.id.padEnd(5)} ${m.name.padEnd(22)} L${ch.level}/${cap}${ch.level >= cap ? '⛔CAP' : ''} S${a.str.toFixed(0)} D${a.dex.toFixed(0)} I${a.int.toFixed(0)} C${a.cha.toFixed(0)} N${a.con.toFixed(0)} ${mark(m)}${injury}${busy}\n      ${renderTags(m.tags)}`;
    }).join('\n') || '(no mercs)';
  },

  merc(g: Game, id: string): string {
    const m = g.card(id);
    if (!m?.character) return 'no such merc';
    const ch = m.character;
    return [
      `${m.name} — L${ch.level} (cap ${g.capOf(m.id)}) ${ch.role} · xp ${ch.xp}/${xpNeeded(ch.level)} to L${ch.level + 1}` +
      (ch.injuryTiers > 0 ? ` · 🩸${ch.injuryTiers}: −${g.woundPenalty(m.id)} on every roll (~${g.healEta(m).cycles}c ${g.healEta(m).viaInfirmary ? 'infirmary' : 'rest — build an Infirmary'}${g.hasRoom('hospital') ? ', or pay-heal' : ''})` : ''),
      (() => {
        const bed = g.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'cap' && r.ownerId === m.id);
        return bed ? `bedroom (${bed.id}): ${g.roomEffect(bed)} — fill it to raise the cap`
          : `no bedroom of their own — capped at ${g.capOf(m.id)} ('build bedroom ${m.id}')`;
      })(),
      (() => { const pk = unitPeak(m); return `worth ${unitWorth(m)}g from their tags ${'★'.repeat(unitStars(m)) || '·'}${pk ? ` · best: ${pk.concept} (${pk.rank})` : ''}   [mark ${m.value}g — what was spent making them]` })(),
      `tags: ${renderTags(m.tags)}`,
      `attrs: STR ${ch.attrs.str.toFixed(1)} DEX ${ch.attrs.dex.toFixed(1)} INT ${ch.attrs.int.toFixed(1)} CHA ${ch.attrs.cha.toFixed(1)} CON ${ch.attrs.con.toFixed(1)}`,
      `focus: ${ch.focus.kind === 'none' ? 'none (generalist growth)' : ch.focus.kind === 'single' ? `${ch.focus.attr.toUpperCase()} (one GREAT stat)` : `${ch.focus.a.toUpperCase()}+${ch.focus.b.toUpperCase()} (two GOOD)`} · who: ${ch.who ?? '—'}`,
      ch.backstory ? `backstory: ${ch.backstory}` : '',
      ch.quirks?.length ? `quirks: ${ch.quirks.join('; ')}` : '',
      `dossier:\n${g.dossier(m.id) || '  (no memories yet)'}`,
    ].filter(Boolean).join('\n');
  },

  leads(g: Game): string {
    const board = g.leadBoard();
    const waiting = g.leadsAwaitingLeadRoom();
    const tail = waiting ? `\n(+${waiting} more lead${waiting === 1 ? '' : 's'} earned — they wait on a Lead room to be read)` : '';
    if (!board.length) return (g.hasRoom('map-room') ? '(the board is empty — earn leads through quests and hunts)' : '(build a Map room first)') + tail;
    for (const r of board) seenLeads.add(r.lead.id);
    const n = board.filter(r => !r.blocked).length;
    return board.map(({ lead: l, blocked, onBoard, working }) => {
      const exp = l.expiresAtCycle === null ? 'standing' : `c${l.expiresAtCycle}`;
      const chain = l.chainInfo.kind === 'none' ? '' : l.chainInfo.kind === 'starts-new' ? ' ✦STORY' : ' ⛓CONT';
      // a lead the map table is already working must never read as simply available (TEMPO P2)
      const mark = working === 'running' ? ' ✎WRITING' : working === 'queued' ? ' ⋯QUEUED' : '';
      // ECONOMY §7.2: what the lead CARRIES, as a band — the engine holds the number
      const b = leadBand(l);
      const pay = b.band ? ` ${b.stars} ${b.label}` : '';
      const state = onBoard ? ` (on the board: ${onBoard})` : blocked && !working ? ` (${blocked})` : '';
      return `${l.id.padEnd(9)} ${l.rarity.padEnd(8)} L${String(l.level).padEnd(3)} ${REGION[l.region]!.name.padEnd(18)} ${l.archetype.padEnd(18)}${chain}${mark}${pay.padEnd(24)} exp:${exp}${l.title ? ` — ${l.title}` : ''}${state}`;
    }).join('\n') + (n > 1 ? `\n('pursue all' takes up all ${n})` : '') + tail;
  },

  /** re-read a past reckoning — the reports are archived in the save (RECKONINGS_KEPT), so this
   *  works after you have advanced, and after a restart. */
  reckoning(g: Game, arg?: string): string {
    const all = g.reckonings();
    if (!all.length) return '(no reckoning yet — end a cycle first)';
    if (arg === 'list') {
      return ['KEPT RECKONINGS (reckoning <cycle> to read one):',
        ...all.map(r => `  cycle ${String(r.cycle).padEnd(4)} ${r.lines.length} lines · ${(r.lines.find(l => l.startsWith('— ')) ?? r.lines[0] ?? '').slice(0, 60)}`)].join('\n');
    }
    const want = arg ? Number(arg) : undefined;
    const r = g.reckoningAt(Number.isFinite(want) ? want : undefined);
    if (!r) return `(no reckoning kept for cycle ${arg} — 'reckoning list' shows what is kept)`;
    const at = new Map(r.meta.map(m => [m.from, m]));
    const body = r.lines.flatMap((l, i) => (m => m ? [this.verdictBanner(m), l] : [l])(at.get(i)));
    return [`━━━ THE RECKONING · CYCLE ${r.cycle} ━━━`, ...body, ...(r.summary ? ['', this.tally(r.summary)] : [])].join('\n');
  },

  /** what the map table has OUT (TEMPO P2/P5) — finished work is not a list, it is a card on the
   *  board and a line that already announced itself. By cycle 7 of a playtest this was eight rows
   *  of ✔ from cycles ago, which is a history nobody asked for. Failures stay: they need retrying. */
  jobs(g: Game): string {
    const all = g.jobs();
    const js = all.filter(j => j.state !== 'done');
    const done = all.length - js.length;
    if (!js.length) return `(the map table is idle${done ? ` — ${done} card(s) delivered` : ''})`;
    return js.map(j => {
      const mark = j.state === 'running' ? '✎ writing ' : j.state === 'queued' ? '⋯ queued  ' : '✗ FAILED  ';
      const tail = j.state === 'failed' ? ` — ${j.error ?? 'no reason given'} (pursue it again to retry)` : '';
      return `${j.id.padEnd(7)} ${mark} ${j.title}${tail}`;
    }).join('\n') + `\n(at most ${g.maxInFlight} at once — 'inflight <n>' to change)`;
  },

  /** one line naming what is out, for the prompt and for post-command nudges */
  jobsBrief(g: Game): string | null {
    const js = g.jobs().filter(j => j.state === 'queued' || j.state === 'running');
    if (!js.length) return null;
    const r = js.filter(j => j.state === 'running').length;
    return `✎ the map table: ${r} writing${js.length - r ? `, ${js.length - r} queued` : ''}`;
  },

  quests(g: Game): string {
    const qs = g.state.quests.filter(q => q.state === 'open');
    if (!qs.length) return '(no open quests — pursue a lead)';
    return qs.map(q => {
      const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
      // one token per place — the attribute it tests; ◼ once manned
      const tokens = active.map(s => `${s.filledBy ? '◼' : '◻'}${s.test.attributes.map(a => a.toUpperCase()).join('+')}`).join(' ');
      const o = g.questOdds(q.id);
      const odds = q.approaches && !q.chosenApproach ? 'choose an approach'
        : o.band ? `ready · ${BAND_TEXT[o.band]}${o.success !== null ? ` ${pct(o.success)}` : ''}`
        : `${o.filled}/${o.of} placed`;
      const kinds = kindsLine(g.questRewardKinds(q.id));
      const warn = g.questRewardWarn(q.id);
      const due = g.questIsFaucet(q) ? '↻ this cycle' : `c${g.questLapsesAt(q)}${g.questStallAt(q) !== null ? ' (stalled)' : ''}${g.questUrgent(q) ? '!' : ''}`;
      return `${q.id.padEnd(5)} ${q.title.slice(0, 30).padEnd(30)} L${q.level} ${(tokens || '—').padEnd(16)} ${odds.padEnd(26)} ${kinds.padEnd(22)} ${due.padEnd(12)}${q.isFinale ? ' 🎬 finale' : q.saga ? ` 📖 part ${q.saga.part}${q.saga.again ? ' (again)' : ''}` : ''}${warn ? `  ⚠ ${warn}` : ''}`;
    }).join('\n') + (g.canReroll()
      ? "\n(a card you will not read is not a dead end: 'abandon <id>' puts the lead back — once a cycle)"
      : "\n(a lead has already been taken back up this cycle — 'abandon <id>' now spends the card)");
  },

  questDetail(g: Game, id: string): string {
    const q = g.state.quests.find(x => x.id === id);
    if (!q) return 'no such quest';
    const due = g.questIsFaucet(q) ? 'goes cold at the end of this cycle — the post will put up another' : `lapses c${g.questLapsesAt(q)}${g.questStallAt(q) !== null ? ` — set aside then unless it marches (it has failed to march ${q.stalls ?? 0}×)` : ''}`;
    const tail = `(${q.id}, L${q.level} ${q.rarity}, ${REGION[q.region]!.name}, ${due})`;
    const reward = `REWARD: ${g.questReward(q.id)}  [${kindsLine(g.questRewardKinds(q.id))}]${(w => w ? `  ⚠ ${w}` : '')(g.questRewardWarn(q.id))}`;
    const sg = q.saga;
    const lines = sg ? (() => {
      // a saga card: the quest log the engine rendered (the GUI's rows), the prose, the people it names — the same
      // order the quest page uses; no errand line (the road's ▶ row and the prose carry the job)
      const c = g.chainViews().find(x => x.id === q.chainId);
      const log = logLines(sg.rows);
      const matter = matterLine(g.questCast(q.id));
      const where = sg.part === null ? `the finale${sg.lastchance ? ' · the last chance' : ''}` : `part ${sg.part} of ${sg.of}${sg.again ? ' (again)' : ''}`;
      return [
        `═══ ${q.title} · ${c?.title ?? 'a saga'} ═══  ${tail}`,
        ...(sg.logFirst ? [...log, '', q.situation] : [q.situation, '', ...log]),
        ...(matter ? [matter] : []),
        reward,
        `SAGA: ${where} · setbacks ${sg.setbacks} of ${sg.budget}`,
      ];
    })() : [
      `═══ ${q.title} ═══  ${tail}`,
      q.situation,
      // parity with the GUI's writ: THE ERRAND is the job line (QUESTS 2026-07-06 (a) — the situation
      // is the card, the job its ledger line)
      ...(q.job ? [`ERRAND: ${q.job}`] : []),
      reward,
    ];
    if (q.approaches) {
      lines.push(`APPROACHES (pick one)${q.chosenApproach ? ` — chosen: ${q.chosenApproach}` : ''}:`);
      // §9: the player sees EVERY branch's envelope before committing
      for (const a of q.approaches) {
        const mark = q.chosenApproach === a.id ? '▶' : ' ';
        const warn = g.approachRewardWarn(q.id, a.id);
        lines.push(`${mark} [${a.id}] ${a.label}${(o => o ? ` → ${o}` : '')(g.approachOutcome(q.id, a.id))}${warn ? `  ⚠ ${warn}` : ''}`);
        // every place of the approach, and who it names (Game.approachBest — the quest page's cards)
        q.slots.forEach((slot, i) => {
          if (slot.groupId !== a.id) return;
          const t = slot.test, b = g.approachBest(q.id, i);
          lines.push(`      tests ${t.attributes.join('+').toUpperCase()} (${t.difficulty}, bar ${slotThreshold(t).toFixed(1)})${t.favored.length ? ` favors ${t.favored.join(',')}` : ''}`
            + (b ? ` · ${b.holder ? 'sent' : 'best'}: ${b.name} ${b.coins}c (${b.strength})${b.from ? ` (busy — on ${b.from.title}; sending moves them)` : ''}` : ' · nobody can take it'));
        });
      }
    }
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    q.slots.forEach((s, i) => {
      if (q.approaches && !active.includes(s)) return;
      const t = s.test;
      const bar = slotThreshold(t).toFixed(1);
      const merc = s.filledBy ? g.card(s.filledBy) : null;
      const c = merc ? ` ← ${merc.name} (${explainCoins(merc, t)}, ${slotStrength(coins(merc, t), slotThreshold(t))}${(w => w ? ` · ${w}` : '')(whyLine(coinsWhy(merc, t)))})` : '';
      const req = s.requirement.kind === 'must-be' ? ` ⚑ must be ${g.card(s.requirement.cardId)?.name ?? '?'}`
        : s.requirement.kind === 'must-have' ? ` ⚑ needs ${s.requirement.concept}${s.requirement.minRank ? ` (${s.requirement.minRank}+)` : ''}` : '';
      lines.push(`  slot ${i}: tests ${t.attributes.join('+').toUpperCase()} (${t.difficulty}, bar ${bar})${t.favored.length ? ` favors ${t.favored.join(',')}` : ''}${t.clashing.length ? ` clashes ${t.clashing.join(',')}` : ''}${req}${c}`);
      if (!merc) {
        // the same rows the quest page's niches read (Game.slotFits): legal first, then by coins
        const fits = g.slotFits(q.id, i);
        const legal = fits.filter(f => !f.blocked).slice(0, 4);
        const barred = fits.filter(f => f.blocked).slice(0, 2);
        if (legal.length) lines.push(`      candidates: ${legal.map(f => `${f.name} ${f.coins}c ${f.strength}${(w => w ? ` (${w})` : '')(whyLine(f.why))}${f.from ? ` [on ${f.from.questId}]` : ''}`).join(' · ')}`);
        if (barred.length) lines.push(`      ✗ ${barred.map(f => `${f.name} — ${f.blocked}`).join(' · ')}`);
        if (legal.length) lines.push(`      send ${q.id} <mercId> ${i}`);
      }
    });
    if (!q.approaches || q.chosenApproach) {
      const o = g.questOdds(q.id);
      const verdict = o.band ? ` — ${BAND_TEXT[o.band]}` : ` — ${o.of - o.filled} place${o.of - o.filled === 1 ? '' : 's'} still open`;
      lines.push(`ODDS: ${o.coins} coins · heads needed ${o.bar.toFixed(1)} (partial at ${o.partialAt.toFixed(1)})${verdict}${o.precision > 0 ? ` → success ${pct(o.success)} · partial+ ${pct(o.partial)}${o.precision === 1 ? ' (coarse)' : ''}` : o.band ? ' (an Oracle gives the %)' : ''}`);
    } else {
      lines.push('ODDS: choose an approach first (each branch rolls its own test)');
    }
    lines.push(`(abandon: ${g.abandonConsequence(q.id)})`);
    return lines.join('\n');
  },

  captives(g: Game): string {
    const cs = g.captives();
    if (!cs.length) return '(no captives)';
    const WORD = { raw: 'RAW', breaking: 'BREAKING', tamed: 'TAMED', onShow: 'ON SHOW' } as const;
    return `captives ${cs.length}/${g.captiveCapacity()} — ${CAPTIVE_COUNT_NOTE}\n` + cs.map(c => {
      const s = g.captiveState(c.id)!;
      const state = s.state === 'breaking' ? `BREAKING, tamed by c${s.doneAt} (${s.whereName})` : s.state === 'onShow' ? `ON SHOW ${s.whereName}` : WORD[s.state];
      const best = s.state === 'raw' || s.state === 'tamed' ? g.roomPlacementsFor(c.id).find(p => p.ok) : undefined;
      const next = best ? ` · ${best.roomName}: ${best.label} ('setin ${c.id} ${best.roomId}')` : '';
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} ${mark(c)} ${state.padEnd(26)} ransom ~${g.ransomQuote(c.id)}g · sell ~${g.sellQuote(c.id)}g${next}\n      ${renderTags(c.tags)}`;
    }).join('\n');
  },

  items(g: Game): string {
    const rs = g.relics();
    const stacks = g.state.cards.filter(c => cardType(c) === 'stackable' && (c.qty ?? 0) > 0 && stackKind(c) !== 'gold');
    const lines = rs.map(r => {
      const where = g.whereName(r.id);
      const best = g.roomPlacementsFor(r.id).find(p => p.ok);
      const next = best ? ` · ${best.roomName}: ${best.label}` : '';
      return `${r.id.padEnd(5)} ${r.name.padEnd(24)} ${where ? `ON SHOW ${where}`.padEnd(22) : 'in stores'.padEnd(22)} sell ~${g.sellQuote(r.id)}g${next}  ${renderTags(r.tags)}`;
    });
    for (const s of stacks) lines.push(`${s.id.padEnd(5)} ${s.name} ×${s.qty}${isLiability(s) ? ` ⚠LIABILITY — settle for ${g.settleQuote(s.id)}g ('settle ${s.id}') or it bites (collector leads)` : ''}`);
    return lines.join('\n') || '(nothing)';
  },

  chains(g: Game): string {
    const pips = (n: number, of: number, on = '●', off = '○') => on.repeat(Math.max(0, Math.min(n, of))) + off.repeat(Math.max(0, of - n));
    // live sagas first; each ends on where it stands in play (its quest, or the lead that continues it)
    const where = (c: ReturnType<Game['chainViews']>[number]) =>
      ` → ${c.next}${c.questId ? ` ('quest ${c.questId}')` : c.leadId && c.next === 'a lead to pursue' ? ` ('pursue ${c.leadId}')` : ''}`;
    return [...g.chainViews()].sort((a, b) => Number(b.live) - Number(a.live)).map(c =>
      `${c.id.padEnd(9)} ${c.title.slice(0, 36).padEnd(36)} ${c.state.padEnd(14)} part ${pips(c.part, c.of)} ${c.part}/${c.of} · progress ${c.effort.toFixed(0)}/${c.effortTarget.toFixed(0)} · setbacks ${pips(c.failures, c.failureBudget, '✗', '·')} · ${(c.bank || '—')}${c.focal ? ` · ${c.focal}` : ''}${where(c)}`,
    ).join('\n') || '(no stories yet — pursue a ✦STORY lead)';
  },

  /** the saga as the chronicle shows it (the GUI's Sagas tab, same rows, same order): the quest log as it stands, card
   *  1, the likely end and the economy, So far, the answer once the finale is played, the people seen */
  chainDetail(g: Game, id: string): string {
    const c = g.chainViews().find(x => x.id === id);
    if (!c) return 'no such chain';
    return [
      `═══ ${c.title} ═══ (${c.state})${c.personal ? ' — personal' : ''}`,
      ...logLines(c.rows),
      c.card1,
      `likely end: ${c.likely} · setbacks ${c.failures} of ${c.failureBudget} · set aside ${c.bank || '—'} · progress ${c.effort.toFixed(0)} of ~${c.effortTarget.toFixed(0)}`,
      'So far:', ...(c.soFar.length ? c.soFar : ['  (nothing played yet)']),
      ...(c.answer ? [`The answer: ${c.answer}`] : []),
      ...(c.people.length ? ['People:', ...c.people.map(p => p.name ? `  ${p.name} — ${p.label}` : `  ${p.label}`)] : []),
    ].filter(x => x !== '').join('\n');
  },

  lore(g: Game, id: string): string {
    if (!id) {
      return Object.values(g.state.lore.nodes).map(n =>
        `${n.id.padEnd(8)} ${(n.active ? '' : '(inactive) ') + n.name.padEnd(24)} ${n.kind.padEnd(9)} ${n.blurb.slice(0, 60)}`).join('\n') || '(empty)';
    }
    const dossier = g.dossier(id);
    const past = g.chronicle(id).filter(e => !e.active);
    return [
      dossier || 'no such entry',
      past.length ? `\nfaded pages (Chronicle):\n${past.map(e => `  · ${e.type}: ${e.blurb}`).join('\n')}` : '',
    ].join('');
  },

  tavern(g: Game): string {
    return g.state.tavern.map(s => {
      const c = g.card(s.cardId)!;
      const ch = c.character!;
      const who = ch.who ? `\n      "${ch.who}"` : '';
      const story = ch.backstory ? `\n      ${ch.backstory}` : '';
      const a = ch.attrs;
      const block = g.hireBlock(c.id);
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} L${ch.level} ${mark(c)} — hire ${g.hireQuote(c.id)}g${block ? ` ✗ ${block.reason}${fixLine(block.fix as never)}` : ''}, ${g.tavernDeadline(c.id) ?? 'waits (already paid for)'}` +
        `\n      S${a.str.toFixed(0)} D${a.dex.toFixed(0)} I${a.int.toFixed(0)} C${a.cha.toFixed(0)} N${a.con.toFixed(0)}${who}\n      ${renderTags(c.tags)}${story}`;
    }).join('\n') || '(nobody drinking today)';
  },

  holding(g: Game): string {
    return g.state.holding.map(s => {
      const c = g.card(s.cardId)!;
      const who = c.character!.who ? `\n      "${c.character!.who}"` : '';
      const block = g.acceptBlock(c.id);
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} ${mark(c)} — ransom ~${g.ransomQuote(c.id)}g · sell ~${g.sellQuote(c.id)}g · ${g.holdingDeadline(c.id)} → quick sale ~${g.lapseQuote(c.id)}g` +
        `\n      ${block ? `to the cells ✗ ${block.reason}${fixLine(block.fix as never)}` : `'accept ${c.id}' moves them to the cells`}${who}\n      ${renderTags(c.tags)}`;
    }).join('\n') || '(holding is empty)';
  },

  buildable(g: Game): string {
    // the same order the fort's build list uses: build now → needs a cell → needs gold → later tiers
    const ORDER: Record<string, number> = { none: 0, cell: 1, gold: 2, region: 3, tier: 4 };
    return g.buildableTypes()
      .filter(b => b.blocker !== 'built')
      .sort((a, b) => (ORDER[a.blocker ?? 'none']! - ORDER[b.blocker ?? 'none']!) || a.ghTier - b.ghTier || a.cost - b.cost)
      .map(b => {
        const wants = roomWants(b.type);
        const place = b.firstPlaceCost !== null ? ` · first place ${b.firstPlaceCost}g` : '';
        const owners = b.owners && !b.reason ? ` · for: ${b.owners.map(o => `${o.name} ('build ${b.type} ${o.id}')`).join(', ')}` : '';
        return `${b.type.padEnd(22)} ${String(b.cost).padStart(6)}g ${b.reason ? `— ${b.reason}` : '✓ buildable'}${place}${owners}\n      ${roomDesc(b.type, g.activeRegions())}${wants.length ? ` (wants: ${wants.join(', ')})` : ''}`;
      })
      .join('\n');
  },

  fit(g: Game, id: string, roomId?: string): string {
    const m = g.card(id);
    if (!m) return 'no such card';
    if (m.character?.role === 'merc') {
      const rows = g.placementsFor(id);
      if (!rows.length) return `${m.name}: no open place on any quest (a finale needs its approach picked first)`;
      // coins flipped and heads needed are different units ("15c vs 11.5" read as a pass): the
      // engine's strength word is the verdict, as on the GUI sheet
      return `${m.name} — best free place on each quest (coins · strength):\n` + rows
        .map(r => `  ${r.questId.padEnd(6)} ${r.title.slice(0, 40).padEnd(40)} slot ${r.idx} ${r.attr.padEnd(7)} ${String(r.coins).padStart(3)}c · ${r.strength}${r.here ? ' (here now)' : ''}${r.from ? ` (leaves ${r.from.title})` : ''}`)
        .join('\n') + `\n  send <qId> ${id} [slot]`;
    }
    // one room, place by place: what a drop on THAT place does (an occupied place swaps — the price)
    if (roomId) {
      const r = g.room(roomId);
      if (!r) return 'no such room';
      const plans = g.roomSlotPlans(roomId, id);
      if (!plans.length) return `${m.name}: the ${ROOM_TYPE[r.type]!.name} has no places to set it in`;
      return `${m.name} in the ${ROOM_TYPE[r.type]!.name}, place by place:\n` + plans.map((p, i) =>
        `  place ${i}: ${p.ok ? `${p.swapWithName ? '⇄ ' : ''}${p.label}${p.tone === 'bad' ? '  ⚠ loses' : ''}` : `✗ ${p.reason}`}`).join('\n')
        + `\n  setin ${id} ${roomId} <place>`;
    }
    // captives and relics: every room (the fort drag's glow and the sheet's "Set them in")
    const rows = g.roomPlacementsFor(id);
    if (!rows.length) return `${m.name}: nothing to set in a room (soldiers go on quests; stores stay stored)`;
    const s = g.captiveState(id);
    const head = s ? `${m.name} — ${s.state === 'breaking' ? `on the rack, tamed c${s.doneAt}` : s.state === 'onShow' ? `on show in the ${s.whereName}` : s.state}` : `${m.name}${g.whereName(id) ? ` — on show in the ${g.whereName(id)}` : ''}`;
    return `${head} — where it could go:\n` + rows.map(r =>
      `  ${r.ok ? '✓' : '✗'} ${(r.roomId ?? '—').padEnd(9)} ${r.roomName.padEnd(22)} ${r.ok ? r.label : `${r.reason}${fixLine(r.fix as never)}`}`,
    ).join('\n') + (rows.some(r => r.ok) ? `\n  setin ${id} <roomId> [idx]` : '');
  },

  log(g: Game, n: number, dev = false): string {
    return g.state.log.filter(l => dev || l.kind !== 'dev').slice(-n).map(l => `c${l.cycle} [${l.kind}] ${l.text}`).join('\n');
  },

  cycleReport(g: Game, report: string[]): string {
    const head = `━━━ CYCLE ${g.state.cycle} RESOLVES ━━━`;
    return [head, ...(report.length ? report : ['(a quiet cycle — nothing committed)']), this.status(g)].join('\n');
  },

  /** THE RECKONING, streamed — the text UI's version of the GUI's reckoning page. The terminal is
   *  append-only, so a quest's slot is announced once and its report printed when it lands; the
   *  elapsed stamp is the point of the exercise (this is the surface we dogfood tempo on). */
  reckoningHead(g: Game): string {
    return `\n━━━ THE RECKONING · CYCLE ${g.state.cycle} ━━━`;
  },
  /** one stamped line; a block that spans lines (prose laid out in paragraphs, a voiced card's
   *  '[bearer]' line) keeps the gutter — its later lines sit under the text, never flush-left */
  reckoningLine(line: string, elapsedMs: number): string {
    const stamp = `[+${(elapsedMs / 1000).toFixed(1)}s]`.padStart(9);
    const pad = ' '.repeat(stamp.length + 1);
    return `${stamp} ${line.split('\n').map((l, i) => i && l ? pad + l : l).join('\n')}`;
  },
  reckoningFoot(g: Game, elapsedMs: number, tailMs: number | null): string {
    const t = `report complete at +${(elapsedMs / 1000).toFixed(1)}s`;
    return `\n${t}${tailMs !== null ? ` · the cycle ran on for another ${(tailMs / 1000).toFixed(1)}s writing people up` : ''}\n${this.status(g)}`;
  },
};
