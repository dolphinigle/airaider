// Long real-AI dogfood: ~35 cycles of sensible play with the OpenAI provider.
// Prose lands in scratch log for quality review. Hard cost cap.
// Usage: npx tsx scripts/realplay.ts [cycles] [seed] [maxUsd]

import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ROOM_TYPE } from '../src/engine/fort.js';
import { cardType, hasTag } from '../src/engine/cards.js';
import { coins } from '../src/engine/roll.js';
import { fillScore } from '../src/engine/overlap.js';
import { assertAudit } from '../src/game/audit.js';

const cycles = Number(process.argv[2] ?? 35);
const seed = Number(process.argv[3] ?? 7777);
const maxUsd = Number(process.argv[4] ?? 2);
const LOG = '/tmp/claude-1000/-home-irvan-airaider/aae74806-c696-46d6-b099-8565108c8a84/scratchpad/realplay.log';

const g = new Game(makeOpenAiProvider(), seed);
const out: string[] = [];
const say = (s: string) => out.push(s);

const ORDER = ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall',
  'infirmary', 'dining-hall', 'kitchen', 'garden', 'tavern', 'dungeon', 'holding-cell',
  'dungeon-cell', 'torture-chamber', 'trophy-room', 'gallery'];

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > maxUsd) { say(`[cost cap hit at cycle ${c}]`); break }
  g.ghUpgrade();
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ORDER) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || st.reason === 'already built') continue;
    if (st.reason?.startsWith('costs')) break;
    if (st.reason) continue;
    const r = g.build(b);
    if (r.ok) say(`c${g.state.cycle} BUILD ${b}`);
    break;
  }
  // bedroom for the first merc without one, once infra is up
  if (g.hasRoom('scouting-forests') && g.gold() > 260) {
    const owner = g.roster().find(m => !g.state.fort.rooms.some(r => r.ownerId === m.id));
    if (owner) g.build('bedroom', owner.id);
  }
  const up = g.state.fort.rooms.filter(r => ROOM_TYPE[r.type]!.species === 'comfort')
    .sort((a, b) => a.slots.length - b.slots.length)[0];
  if (up && g.gold() > 300) g.upgrade(up.id);
  // staff best fits
  for (const room of g.state.fort.rooms) {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' || rt.benefit === 'break') continue;
    for (let i = 0; i < room.slots.length; i++) {
      if (room.slots[i]) continue;
      const cands = g.state.cards.filter(card =>
        (cardType(card) === 'relic' && card.location.kind === 'held') ||
        (card.character?.role === 'captive' && hasTag(card.tags, 'obedient') && card.location.kind === 'held'))
        .map(card => ({ card, s: fillScore(card.tags, g.effectiveWants(room)) }))
        .sort((a, b) => b.s - a.s);
      if (cands[0] && cands[0].s > 0.3) g.slot(room.id, i, cands[0].card.id);
    }
  }
  for (const s of [...g.state.holding]) g.acceptCaptive(s.cardId);
  const rack = g.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'break');
  if (rack) for (const cap of g.captives().filter(x => !hasTag(x.tags, 'obedient') && x.location.kind === 'held')) {
    const idx = rack.slots.indexOf(null);
    if (idx < 0) break;
    g.slot(rack.id, idx, cap.id);
  }
  for (const s of [...g.state.tavern]) {
    const cand = g.card(s.cardId);
    if (cand && g.roster().length < g.rosterCapacity() && g.gold() > cand.value * 1.2 + 100) {
      const r = g.hire(s.cardId);
      if (r.ok) say(`c${g.state.cycle} HIRE ${cand.name}`);
    }
  }
  // pursue: chains first, then near-level leads
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  const liveChains = g.state.chains.filter(x => x.state === 'active' || x.state === 'finale-pending').length;
  const leads = [...g.visibleLeads()]
    .filter(l => l.chainInfo.kind !== 'starts-new' || liveChains < 2)
    .sort((a, b) => (a.chainInfo.kind === 'continues' ? 0 : a.expiresAtCycle !== null ? 1 : 2) -
      (b.chainInfo.kind === 'continues' ? 0 : b.expiresAtCycle !== null ? 1 : 2));
  for (const lead of leads) {
    const openSlots = g.state.quests.filter(q => q.state === 'open')
      .reduce((s, q) => s + q.slots.filter(x => !x.filledBy).length, 0);
    if (openSlots >= fit().length) break;
    const r = await g.pursue(lead.id);
    if (r.ok && r.questId) {
      const q = g.state.quests.find(x => x.id === r.questId)!;
      say(`\nc${g.state.cycle} ▶ PURSUE [${q.rarity}${q.chainId ? ` · ${q.isFinale ? 'FINALE' : `beat ${q.beatIndex}`}` : ''}] ${q.title}`);
      say(`  ${q.situation}`);
      say(`  JOB: ${q.job}`);
    }
  }
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    if (q.approaches && !q.chosenApproach) {
      let bestG = q.approaches[0]!.id, bestC = -1;
      for (const a of q.approaches) {
        const slot = q.slots.find(s => s.groupId === a.id);
        if (!slot) continue;
        const cbest = Math.max(0, ...fit().map(m => coins(m, slot.test)));
        if (cbest > bestC) { bestC = cbest; bestG = a.id }
      }
      g.chooseApproach(q.id, bestG);
      say(`  APPROACH: ${q.approaches.find(a => a.id === bestG)!.label}`);
    }
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
      const free = fit();
      if (!free.length) break;
      const best = free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!;
      g.assign(q.id, i, best.id);
    }
    const o = g.questOdds(q.id);
    if (o.coins > 0 && o.coins < o.bar * 0.7 && !q.isFinale) { g.abandon(q.id); say(`  (abandoned — thin odds)`) }
  }
  const report = await g.endCycle();
  for (const line of report) say(`  ${line}`);
  assertAudit(g, `realplay c${g.state.cycle}`);
}

const st = g.state;
const u = g.ai.usage();
say(`\n════ SUMMARY ════
cycle ${st.cycle} · gold ${g.gold()} · P ${g.prestige().toFixed(1)} · GH T${st.fort.ghTier}
roster: ${g.roster().map(m => `${m.name} L${m.character!.level}`).join(' · ')}
chains: ${st.chains.map(x => `${x.bible.title}[${x.state} b${x.beatIndex}]`).join(' · ')}
lore: ${Object.keys(st.lore.nodes).length} nodes / ${st.lore.edges.length} edges
AI: ${u.calls} calls · ${u.inputTokens} in / ${u.outputTokens} out · ~$${u.costUsd.toFixed(2)}`);

fs.writeFileSync(LOG, out.join('\n'));
console.log(out.slice(-14).join('\n'));
console.log(`\nfull prose log → ${LOG}`);
