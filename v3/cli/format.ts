// CLI rendering — compact tables for the dogfooding shell.

import type { Game } from '../src/game/game.js';
import { renderTags } from '../src/engine/tags.js';
import { ROOM_TYPE, GH_THRESHOLDS, maxSlotsAtTier, upgradeCost, excavateCost, ransomRate, marketSellRate } from '../src/engine/fort.js';
import { RANSOM_RATE, SELL_RATE } from '../src/engine/economy.js';
import { REGION } from '../src/engine/regions.js';
import { cardType, stackKind, isLiability } from '../src/engine/cards.js';
import { slotThreshold, coins, explainCoins } from '../src/engine/roll.js';
import { fillScore } from '../src/engine/overlap.js';
import { QUEST_TTL } from '../src/game/game.js';
import { xpNeeded } from '../src/engine/growth.js';

const pct = (x: number | null) => x === null ? '—' : `${Math.round(x * 100)}%`;

export const render = {
  welcome(): string {
    return [
      '╔════════════════════════════════════════════╗',
      '║  AIRAIDER v3 — the fort remembers          ║',
      '╚════════════════════════════════════════════╝',
      "Type 'help' for commands. Start by building a Map room: build map-room",
    ].join('\n');
  },

  help(): string {
    return [
      'VIEWS   fort · rooms · room <id> · roster · merc <id> · leads · quests · quest <id>',
      '        captives · items · chains · chain <id> · lore <id> · tavern · holding',
      '        buildable · status · log [n]',
      'BUILD   build <type> [ownerId] · upgrade <roomId> · renovate <roomId> <style>',
      '        excavate · gh   (styles: human elven wolfkin lizardkin ancient exotic)',
      'CARDS   slot <roomId> <idx> <cardId> · unslot <roomId> <idx> · focus <mercId> single|dual|none <attr> [attr2]',
      'QUESTS  pursue <leadId> · assign <qId> <slot> <mercId> · unassign <qId> <slot> · approach <qId> <gId>',
      'PEOPLE  hire <id> · accept <id> · ransom <id> · sell <id> · settle <id> · interrogate <id> · heal <id>',
      'TURN    end   — commit the cycle: everything rolls, the AI narrates',
      'META    save [name] · quit',
    ].join('\n');
  },

  status(g: Game): string {
    const need = GH_THRESHOLDS[g.state.fort.ghTier + 1];
    return [
      `cycle ${g.state.cycle} · gold ${g.gold()} · prestige ${g.prestige().toFixed(1)}${need ? `/${need} for GH T${g.state.fort.ghTier + 1}` : ''} · GH T${g.state.fort.ghTier}`,
      `roster ${g.roster().length}/${g.rosterCapacity()} · captives ${g.captives().length}/${g.captiveCapacity()} · regions: ${g.state.unlockedRegions.join(', ') || 'none'}`,
      `leads ${g.visibleLeads().length} · open quests ${g.state.quests.filter(q => q.state === 'open').length} · live chains ${g.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending').length}`,
    ].join('\n');
  },

  fort(g: Game): string {
    const floors = new Map<number, string[]>();
    const maxFloor = Math.max(...g.state.fort.cells.map(c => c.floor));
    for (let f = 0; f <= maxFloor; f++) {
      const row: string[] = [];
      const cols = g.state.fort.cells.filter(c => c.floor === f).length;
      for (let c = 0; c < cols; c++) {
        const room = g.state.fort.rooms.find(r => r.cell.floor === f && r.cell.col === c);
        row.push(room ? `[${ROOM_TYPE[room.type]!.name.slice(0, 14).padEnd(14)}]` : '[ · empty · · ]');
      }
      floors.set(f, row);
    }
    const lines = [...floors.entries()].map(([f, row]) => `F${f}  ${row.join(' ')}`);
    return `${this.status(g)}\n${lines.join('\n')}`;
  },

  rooms(g: Game): string {
    const lines = g.state.fort.rooms.map(r => {
      const t = ROOM_TYPE[r.type]!;
      const c = t.species === 'comfort' ? g.comfort(r) : 0;
      const ben = t.benefit === 'prestige' ? ` →P ${c.toFixed(1)}`
        : t.benefit === 'cap' ? ` →cap ${Math.max(6, Math.floor(3 + 0.9 * c))}`
        : t.species === 'comfort' ? ` [${t.benefit}] ${c.toFixed(1)}` : '';
      const slots = r.slots.length ? ` slots[${r.slots.map(s => s ? g.card(s)?.name?.split(' ')[0] ?? '?' : '·').join('|')}]` : '';
      const owner = r.ownerId ? ` owner=${r.ownerId === 'you' ? 'you' : g.card(r.ownerId)?.name ?? r.ownerId}` : '';
      return `${r.id.padEnd(10)} ${t.name.padEnd(24)}${ben}${slots}${owner}`;
    });
    const p = g.prestige();
    lines.push(`— GLOBAL PRESTIGE ${p.toFixed(1)} = Σ theme-room comfort (rooms marked →P)`);
    return lines.join('\n');
  },

  roomDetail(g: Game, id: string): string {
    const r = g.room(id);
    if (!r) return 'no such room';
    const t = ROOM_TYPE[r.type]!;
    const lines = [`${t.name} (${r.id}) — ${t.species}, benefit: ${t.benefit}${r.style ? `, style: ${r.style}` : ''}`];
    if (t.species === 'comfort') {
      const wants = g.effectiveWants(r);
      lines.push(`comfort ${g.comfort(r).toFixed(1)} · wants: ${wants.map(w => w.match).join(', ') || '(none — renovate to set a theme)'}`);
      r.slots.forEach((s, i) => {
        const c = s ? g.card(s) : null;
        const fit = c ? ` (fit ${fillScore(c.tags, wants).toFixed(2)})` : '';
        lines.push(`  slot ${i}: ${c ? `${c.name}${fit} [${renderTags(c.tags)}]` : '(empty)'}`);
      });
      if (!r.slots.length) lines.push('  (no slots yet — upgrade to add)');
      const max = maxSlotsAtTier(g.state.fort.ghTier);
      if (r.slots.length < max) lines.push(`  upgrade: +1 slot for ${upgradeCost(t, r.slots.length)}g (max ${max} at GH T${g.state.fort.ghTier})`);
      else lines.push(`  (slot depth ${r.slots.length}/${max} — gated by Great Hall tier)`);
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
      return `${m.id.padEnd(5)} ${m.name.padEnd(22)} L${ch.level}/${cap}${ch.level >= cap ? '⛔CAP' : ''} S${a.str.toFixed(0)} D${a.dex.toFixed(0)} I${a.int.toFixed(0)} C${a.cha.toFixed(0)} N${a.con.toFixed(0)}${injury}${busy}\n      ${renderTags(m.tags)}`;
    }).join('\n') || '(no mercs)';
  },

  merc(g: Game, id: string): string {
    const m = g.card(id);
    if (!m?.character) return 'no such merc';
    const ch = m.character;
    return [
      `${m.name} — L${ch.level} (cap ${g.capOf(m.id)}) ${ch.role} · xp ${ch.xp}/${xpNeeded(ch.level)} to L${ch.level + 1}` +
      (ch.injuryTiers > 0 ? ` · 🩸${ch.injuryTiers} (~${g.healEta(m).cycles}c ${g.healEta(m).viaInfirmary ? 'infirmary' : 'rest — build an Infirmary'}${g.hasRoom('hospital') ? ', or pay-heal' : ''})` : ''),
      `tags: ${renderTags(m.tags)}`,
      `attrs: STR ${ch.attrs.str.toFixed(1)} DEX ${ch.attrs.dex.toFixed(1)} INT ${ch.attrs.int.toFixed(1)} CHA ${ch.attrs.cha.toFixed(1)} CON ${ch.attrs.con.toFixed(1)}`,
      `focus: ${ch.focus.kind === 'none' ? 'none (generalist growth)' : ch.focus.kind === 'single' ? `${ch.focus.attr.toUpperCase()} (one GREAT stat)` : `${ch.focus.a.toUpperCase()}+${ch.focus.b.toUpperCase()} (two GOOD)`} · who: ${ch.who ?? '—'}`,
      ch.backstory ? `backstory: ${ch.backstory}` : '',
      ch.quirks?.length ? `quirks: ${ch.quirks.join('; ')}` : '',
      `dossier:\n${g.dossier(m.id) || '  (no memories yet)'}`,
    ].filter(Boolean).join('\n');
  },

  leads(g: Game): string {
    const leads = g.visibleLeads();
    if (!leads.length) return g.hasRoom('map-room') ? '(the board is empty — earn leads through quests and hunts)' : '(build a Map room first)';
    return leads.map(l => {
      const exp = l.expiresAtCycle === null ? 'standing' : `c${l.expiresAtCycle}`;
      const chain = l.chainInfo.kind === 'none' ? '' : l.chainInfo.kind === 'starts-new' ? ' ✦STORY' : ' ⛓CONT';
      return `${l.id.padEnd(9)} ${l.rarity.padEnd(8)} L${String(l.level).padEnd(3)} ${REGION[l.region]!.name.padEnd(18)} ${l.archetype.padEnd(12)}${chain} exp:${exp}${l.title ? ` — ${l.title}` : ''}`;
    }).join('\n');
  },

  quests(g: Game): string {
    const qs = g.state.quests.filter(q => q.state === 'open');
    if (!qs.length) return '(no open quests — pursue a lead)';
    return qs.map(q => {
      const filled = q.slots.filter(s => s.filledBy).length;
      return `${q.id.padEnd(5)} ${q.title.slice(0, 40).padEnd(40)} L${q.level} ${q.rarity} ${filled}/${q.slots.length} filled · lapses c${q.createdCycle + QUEST_TTL}${q.isFinale ? ' 🎬FINALE' : q.chainId ? ` 📖beat${q.beatIndex}` : ''}`;
    }).join('\n');
  },

  questDetail(g: Game, id: string): string {
    const q = g.state.quests.find(x => x.id === id);
    if (!q) return 'no such quest';
    const lines = [
      `═══ ${q.title} ═══  (${q.id}, L${q.level} ${q.rarity}, ${REGION[q.region]!.name}, lapses c${q.createdCycle + QUEST_TTL})`,
      q.situation,
      `REWARD envelope: ${q.rewardSpecs.map(r => r.kind).join(' + ') || (q.isFinale ? 'the focal character' : 'side loot')}`,
    ];
    if (q.approaches) {
      lines.push(`APPROACHES (pick one)${q.chosenApproach ? ` — chosen: ${q.chosenApproach}` : ''}:`);
      // §9: the player sees EVERY branch's envelope before committing
      for (const a of q.approaches) {
        const slot = q.slots.find(x => x.groupId === a.id);
        if (!slot) continue;
        const t = slot.test;
        const best = g.roster().filter(m => m.location.kind === 'held')
          .map(m => ({ m, n: coins(m, t) })).sort((x, y) => y.n - x.n)[0];
        const mark = q.chosenApproach === a.id ? '▶' : ' ';
        lines.push(`${mark} [${a.id}] ${a.label} → ${a.rewardKind} · tests ${t.attributes.join('+').toUpperCase()} (${t.difficulty}, bar ${slotThreshold(t).toFixed(1)})${t.favored.length ? ` favors ${t.favored.join(',')}` : ''}${best ? ` · best: ${best.m.name} ${best.n}c` : ''}`);
      }
    }
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    q.slots.forEach((s, i) => {
      if (q.approaches && !active.includes(s)) return;
      const t = s.test;
      const bar = slotThreshold(t).toFixed(1);
      const merc = s.filledBy ? g.card(s.filledBy) : null;
      const c = merc ? ` ← ${merc.name} (${explainCoins(merc, t)})` : '';
      const req = s.requirement.kind === 'must-be' ? ` ⚑ must be ${g.card(s.requirement.cardId)?.name ?? '?'}`
        : s.requirement.kind === 'must-have' ? ` ⚑ needs ${s.requirement.concept}${s.requirement.minRank ? ` (${s.requirement.minRank}+)` : ''}` : '';
      lines.push(`  slot ${i}: tests ${t.attributes.join('+').toUpperCase()} (${t.difficulty}, bar ${bar})${t.favored.length ? ` favors ${t.favored.join(',')}` : ''}${t.clashing.length ? ` clashes ${t.clashing.join(',')}` : ''}${req}${c}`);
      if (!merc) {
        const cands = g.roster().filter(m => m.location.kind === 'held')
          .map(m => ({ m, n: coins(m, t) })).sort((a, b) => b.n - a.n).slice(0, 4);
        if (cands.length) lines.push(`      candidates: ${cands.map(x => `${x.m.name} ${x.n}c`).join(' · ')}`);
      }
    });
    if (!q.approaches || q.chosenApproach) {
      const o = g.questOdds(q.id);
      lines.push(`ODDS: ${o.coins} coins vs bar ${o.bar.toFixed(1)}${o.precision > 0 ? ` → success ${pct(o.success)} · partial+ ${pct(o.partial)}${o.precision === 1 ? ' (coarse)' : ''}` : ' (build an Oracle for %)'}`);
    } else {
      lines.push('ODDS: choose an approach first (each branch rolls its own test)');
    }
    return lines.join('\n');
  },

  captives(g: Game): string {
    const cs = g.captives();
    if (!cs.length) return '(no captives)';
    return cs.map(c => {
      const where = c.location.kind === 'room' ? `in ${c.location.roomId}` : 'cells';
      const ob = c.tags.some(t => t.concept === 'obedient') ? ' obedient' : ' raw';
      const brk = g.state.breaking.find(b => b.cardId === c.id);
      const office = g.state.fort.rooms.find(r => r.type === 'ransom-office');
      const rate = office ? ransomRate(g.comfort(office)) : RANSOM_RATE;
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} mark ${c.value}g (ransom ~${Math.round(c.value * rate)}g · sell ~${Math.round(c.value * SELL_RATE)}g)${ob}${brk ? ` (breaking, done c${brk.doneAtCycle})` : ''} ${where}\n      ${renderTags(c.tags)}`;
    }).join('\n');
  },

  items(g: Game): string {
    const rs = g.relics();
    const stacks = g.state.cards.filter(c => cardType(c) === 'stackable' && (c.qty ?? 0) > 0 && stackKind(c) !== 'gold');
    const market = g.state.fort.rooms.find(x => x.type === 'market');
    const sellRate = market ? marketSellRate(g.comfort(market)) : SELL_RATE;
    const lines = rs.map(r => {
      const where = r.location.kind === 'room' ? ` in ${r.location.roomId}` : '';
      return `${r.id.padEnd(5)} ${r.name.padEnd(24)} mark ${r.value}g (sell ~${Math.round(r.value * sellRate)}g)${where}  ${renderTags(r.tags)}`;
    });
    for (const s of stacks) lines.push(`${s.id.padEnd(5)} ${s.name} ×${s.qty}${isLiability(s) ? ` ⚠LIABILITY — settle for ${Math.abs(s.value) * (s.qty ?? 1)}g or it bites (collector leads)` : ''}`);
    return lines.join('\n') || '(nothing)';
  },

  chains(g: Game): string {
    return g.state.chains.map(c => {
      const focal = g.card(c.focalId);
      return `${c.id.padEnd(9)} ${c.bible.title.slice(0, 36).padEnd(36)} ${c.state.padEnd(14)} beat ${c.beatIndex}/${c.expectedBeats} bank ${c.bank.toFixed(0)}g focal: ${focal?.name ?? '?'}`;
    }).join('\n') || '(no stories yet — pursue a ✦STORY lead)';
  },

  chainDetail(g: Game, id: string): string {
    const c = g.state.chains.find(x => x.id === id);
    if (!c) return 'no such chain';
    const focal = g.card(c.focalId);
    return [
      `═══ ${c.bible.title} ═══ (${c.state})`,
      `focal: ${focal?.name} · likely fate: ${c.kind} · payoff ~${c.payoff.toFixed(0)}g · bank ${c.bank.toFixed(0)}g · effort ${c.cyclesSpent.toFixed(0)}/${(c.expectedBeats * 1.5).toFixed(0)} merc-cycles · failures ${c.failures}/${c.failureBudget}`,
      `now: ${c.story.currentSituation}`,
      c.story.knownToPlayer.length ? `known: ${c.story.knownToPlayer.join(' · ')}` : '',
      c.story.openThreads.length ? `threads: ${c.story.openThreads.join(' · ')}` : '',
    ].filter(Boolean).join('\n');
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
      const who = c.character!.who ? `\n      "${c.character!.who}"` : '';
      const story = c.character!.backstory ? `\n      ${c.character!.backstory}` : '';
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} L${c.character!.level} mark ${c.value}g — hire ~${Math.round(c.value * 1.2)}g, leaves c${s.expiresAtCycle}${who}\n      ${renderTags(c.tags)}${story}`;
    }).join('\n') || '(nobody drinking today)';
  },

  holding(g: Game): string {
    return g.state.holding.map(s => {
      const c = g.card(s.cardId)!;
      const who = c.character!.who ? `\n      "${c.character!.who}"` : '';
      return `${c.id.padEnd(5)} ${c.name.padEnd(22)} mark ${c.value}g — accept before c${s.expiresAtCycle}${who}\n      ${renderTags(c.tags)}`;
    }).join('\n') || '(holding is empty)';
  },

  buildable(g: Game): string {
    return g.buildableTypes()
      .filter(b => !b.reason || !b.reason.startsWith('already'))
      .map(b => `${b.type.padEnd(22)} ${String(b.cost).padStart(6)}g ${b.reason ? `— ${b.reason}` : '✓ buildable'}`)
      .join('\n');
  },

  log(g: Game, n: number): string {
    return g.state.log.slice(-n).map(l => `c${l.cycle} [${l.kind}] ${l.text}`).join('\n');
  },

  cycleReport(g: Game, report: string[]): string {
    const head = `━━━ CYCLE ${g.state.cycle} RESOLVES ━━━`;
    return [head, ...(report.length ? report : ['(a quiet cycle — nothing committed)']), this.status(g)].join('\n');
  },
};
