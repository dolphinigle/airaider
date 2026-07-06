// PART 2 — NEW-PLAYER WALKTHROUGH, cycles 1..N, real AI. Prints EXACTLY what the web
// UI presents (same fields, same order: menus → fort/build → leads → quest cards →
// assignment dropdowns → odds line → end-cycle report), acting as a naive first-time
// player: follow the on-screen hints, pursue leads, assign best-coins, end cycle.
// Usage: set -a; source /home/irvan/airaider/.env; set +a; npx tsx scripts/playerwalk.ts [seed] [cycles]

import { Game, QUEST_TTL } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { REGION } from '../src/engine/regions.js';
import { renderTags } from '../src/engine/tags.js';
import { slotThreshold, coins, explainCoins } from '../src/engine/roll.js';
import { hireCost } from '../src/engine/economy.js';
import { xpNeeded } from '../src/engine/growth.js';
import type { Quest } from '../src/engine/quests.js';

const seed = Number(process.argv[2] ?? 88011);
const CYCLES = Number(process.argv[3] ?? 6);
const g = new Game(makeOpenAiProvider(), seed);
const P = (s = '') => console.log(s);

function menus(): string {
  return g.menuGates().map(m => `${m.open ? '·' : '🔒'}${m.key}${m.open ? '' : `(need ${m.need})`}`).join(' ');
}
function rosterView() {
  for (const m of g.roster()) {
    const ch = m.character!;
    const eta = g.healEta(m);
    P(`   ${m.name}  L${ch.level}/${g.capOf(m.id)} · xp ${ch.xp}/${xpNeeded(ch.level)} · ${ch.injuryTiers > 0 ? `🩸${ch.injuryTiers} (~${eta.cycles}c to heal)` : 'healthy'} · ${m.location.kind === 'quest' ? '⚔ committed' : 'free'}`);
    P(`     tags: ${renderTags(m.tags)}`);
  }
}
function leadsView() {
  const ls = g.visibleLeads();
  if (!ls.length) { P('   The board is empty — leads are earned: run hunts, finish quests.'); return }
  for (const l of ls)
    P(`   ${l.rarity} L${l.level} ${REGION[l.region]!.name} ${l.archetype} ${l.chainInfo.kind === 'starts-new' ? '✦ story ' : l.chainInfo.kind === 'continues' ? '⛓ continues ' : ''}${l.title ?? ''} ${l.expiresAtCycle === null ? '[standing]' : `[expires c${l.expiresAtCycle}]`}`);
}
function questCard(q: Quest) {
  P(`   ┌─ ${q.title}  (L${q.level} · ${q.rarity} · ${REGION[q.region]!.name} · lapses c${q.createdCycle + QUEST_TTL}${q.isFinale ? ' · 🎬 FINALE' : q.chainId ? ` · beat ${q.beatIndex}` : ''})`);
  P(`   │ ${q.situation}`);
  P(`   │ JOB: ${q.job} · REWARD: ${q.rewardSpecs.map(r => r.kind).join(' + ') || (q.isFinale ? 'the focal character' : 'side loot')}`);
  if (q.approaches) {
    P(`   │ APPROACH (each branch rolls its own test):`);
    for (const a of q.approaches) {
      const sl = q.slots.find(s => s.groupId === a.id);
      P(`   │   [${q.chosenApproach === a.id ? 'x' : ' '}] ${a.label} → ${a.rewardKind}${sl ? ` — tests ${sl.test.attributes.join('+').toUpperCase()} (${sl.test.difficulty}, bar ${slotThreshold(sl.test).toFixed(1)})${sl.test.favored.length ? ` · favors ${sl.test.favored.join(', ')}` : ''}` : ''}`);
    }
  }
  q.slots.forEach((sl, i) => {
    if (q.approaches && sl.groupId !== q.chosenApproach) return;
    const req = sl.requirement.kind === 'must-be' ? ` · ⚑ must be ${g.card(sl.requirement.cardId)?.name ?? '?'}`
      : sl.requirement.kind === 'must-have' ? ` · ⚑ needs ${sl.requirement.concept}` : '';
    P(`   │ slot ${i}: tests ${sl.test.attributes.join('+').toUpperCase()} (${sl.test.difficulty}, bar ${slotThreshold(sl.test).toFixed(1)})${sl.test.favored.length ? ` · favors ${sl.test.favored.join(', ')}` : ''}${sl.test.clashing.length ? ` · clashes ${sl.test.clashing.join(', ')}` : ''}${req}`);
    if (sl.filledBy) P(`   │         → ${g.card(sl.filledBy)!.name} (${explainCoins(g.card(sl.filledBy)!, sl.test)})`);
    else {
      const fits = g.roster().filter(m => m.location.kind === 'held')
        .map(m => ({ m, c: coins(m, sl.test) })).sort((a, b) => b.c - a.c);
      P(`   │         dropdown: ${fits.map(f => `${f.m.name} (${f.c}c · ${explainCoins(f.m, sl.test)})`).join(' | ') || '(nobody free)'}`);
    }
  });
  const o = g.questOdds(q.id);
  const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
  const ready = active.length > 0 && active.every(s => s.filledBy);
  P(`   └ ${q.approaches && !q.chosenApproach ? 'ODDS: pick an approach first' : !ready ? '⏸ will not march — every slot must be filled' : `ODDS: ${o.coins} coins vs bar ${o.bar.toFixed(1)}`}${o.success !== null ? ` → success ${Math.round(o.success * 100)}%` : ' (build an Oracle for %)'}`);
}

async function main() {
  P(`══════ PART 2 · NEW-PLAYER WALKTHROUGH (seed ${seed}, REAL AI, ${CYCLES} cycles) ══════`);
  P(`\n▶ STEP: first screen (cycle ${g.state.cycle})`);
  P(`   gold ${g.gold()} · prestige ${g.prestige()} · roster cap ${g.rosterCapacity()}`);
  P(`   menus: ${menus()}`);
  P(`   log: ${g.state.log.map(l => l.text).join(' | ')}`);
  P(`   ROSTER TAB:`); rosterView();
  P(`   FORT TAB rooms: ${g.state.fort.rooms.map(r => r.type).join(', ')}`);
  P(`   BUILD TAB: ${g.buildableTypes().map(t => `${t.type} ${t.reason ? `[${t.reason}]` : `$${t.cost}`}`).join(' · ')}`);

  P(`\n▶ STEP: follow the log hint — build a Map room`);
  P(`   ${g.build('map-room').msg} · gold ${g.gold()}`);
  P(`   menus now: ${menus()}`);
  P(`   LEADS TAB:`); leadsView();

  for (let c = 1; c <= CYCLES; c++) {
    P(`\n════════ CYCLE ${g.state.cycle} (day ${c}) ════════`);

    // naive build reflex: if a locked tab names a room we can afford, build it (player
    // follows the 🔒 hints) — but only one building per cycle
    const locked = g.menuGates().filter(m => !m.open);
    for (const lk of locked) {
      const bt = g.buildableTypes().find(t => ROOMKEY(lk.need) === t.type && !t.reason);
      if (bt) { const r = g.build(bt.type); P(`▶ build ${bt.type} (unlocks '${lk.key}' tab): ${r.msg} · gold ${g.gold()}`); break }
    }

    // recruits tab (if open)
    if (g.state.tavern.length) {
      P(`▶ RECRUITS TAB:`);
      for (const s of [...g.state.tavern]) {
        const cand = g.card(s.cardId)!;
        P(`   ${cand.name} — hire $${hireCost(cand.value)} (have $${g.gold()}) · expires c${s.expiresAtCycle} · ${cand.character?.who ?? '(no who-line)'}`);
        P(`     tags: ${renderTags(cand.tags)}`);
        if (g.roster().length < g.rosterCapacity() && g.gold() >= hireCost(cand.value) + 60) {
          const r = g.hire(s.cardId); P(`   → hire: ${r.msg}`);
        }
      }
    }
    if (g.state.holding.length) {
      P(`▶ STAGING (holding) TAB:`);
      for (const s of [...g.state.holding]) {
        const cand = g.card(s.cardId)!;
        P(`   ${cand.name} (captive candidate, expires c${s.expiresAtCycle}) tags: ${renderTags(cand.tags)}`);
        const r = g.acceptCaptive(s.cardId); P(`   → accept: ${r.msg}`);
      }
    }

    // pursue: keep at most 2 open quests (roster is tiny), prefer continues > expiring
    P(`▶ LEADS TAB:`); leadsView();
    const sorted = [...g.visibleLeads()].sort((a, b) =>
      (a.chainInfo.kind === 'continues' ? 0 : a.expiresAtCycle !== null ? 1 : 2) -
      (b.chainInfo.kind === 'continues' ? 0 : b.expiresAtCycle !== null ? 1 : 2));
    for (const lead of sorted) {
      if (g.state.quests.filter(q => q.state === 'open').length >= 2) break;
      const r = await g.pursue(lead.id);
      P(`▶ pursue ${lead.archetype}${lead.title ? ` "${lead.title}"` : ''} → ${r.ok ? 'NEW QUEST CARD:' : r.msg}`);
    }

    // quests tab: choose approaches, assign best-coins, show the full card as the web renders it
    P(`▶ QUESTS TAB:`);
    const open = g.state.quests.filter(q => q.state === 'open');
    if (!open.length) P('   No open quests. Pursue a lead.');
    for (const q of open) {
      if (q.approaches && !q.chosenApproach) {
        // naive: pick the approach whose best merc has most coins
        let best = q.approaches[0]!.id, bc = -1;
        for (const a of q.approaches) {
          const sl = q.slots.find(s => s.groupId === a.id); if (!sl) continue;
          const c0 = Math.max(0, ...g.roster().filter(m => m.location.kind === 'held').map(m => coins(m, sl.test)));
          if (c0 > bc) { bc = c0; best = a.id }
        }
        g.chooseApproach(q.id, best);
      }
      for (let i = 0; i < q.slots.length; i++) {
        const sl = q.slots[i]!;
        if (sl.filledBy || (q.approaches && sl.groupId !== q.chosenApproach)) continue;
        const free = g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
        if (!free.length) break;
        const bm = free.sort((a, b) => coins(b, sl.test) - coins(a, sl.test))[0]!;
        const r = g.assign(q.id, i, bm.id);
        if (!r.ok) P(`   (assign ${bm.name} → slot ${i} REFUSED: ${r.msg})`);
      }
      questCard(q);
    }

    P(`▶ ROSTER TAB before END:`); rosterView();
    P(`▶ END CYCLE — the report, verbatim:`);
    const report = await g.endCycle();
    for (const line of report) P(`   ${line}`);
    P(`   [gold ${g.gold()} · prestige ${g.prestige()} · menus: ${menus()}]`);
  }

  const u = g.ai.usage();
  const failed = g.ai.callLog().filter(r => !r.ok);
  if (failed.length) { P(`\nFAILED AI CALLS:`); for (const r of failed) P(`  #${r.n} ${r.purpose}: ${r.error}`) }
  P(`\n════ AI: ${u.calls} calls · $${u.costUsd.toFixed(3)} ════`);
}

// map a menu-gate "need" (room display name) back to the buildable type id
import { ROOM_TYPES } from '../src/engine/fort.js';
function ROOMKEY(displayName: string): string {
  return ROOM_TYPES.find(rt => rt.name === displayName)?.id ?? displayName;
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) });
