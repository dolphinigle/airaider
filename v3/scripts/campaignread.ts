// Full-campaign reading harness — real AI, long run, EVERY player-facing line logged:
// quest cards (with roster printed for leak checks), resolutions (before/after + dice),
// chain beats → finale, then bibles, story state, and all character dossiers.
// Usage: npx tsx scripts/campaignread.ts [cycles] [seed] [maxUsd] [outfile]

import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ROOM_TYPE } from '../src/engine/fort.js';
import { cardType, hasTag } from '../src/engine/cards.js';
import { coins } from '../src/engine/roll.js';
import { fillScore } from '../src/engine/overlap.js';

const cycles = Number(process.argv[2] ?? 30);
const seed = Number(process.argv[3] ?? 11001);
const maxUsd = Number(process.argv[4] ?? 1.5);
const LOG = process.argv[5] ?? `/home/irvan/.claude/jobs/2eaaf8c2/tmp/campaign-${seed}.log`;

const g = new Game(makeOpenAiProvider(), seed);
const out: string[] = [];
const say = (s: string) => out.push(s);

// tavern early: without it every rescue "moves on", the roster freezes at 2, and a third of
// cycles read as dead air — starving the very features under test.
// LONG-PLAY generalization (2026-07-11): the old fixed list had NO bedrooms (rosters froze at 5
// forever) and only forest scouting (the City could never be entered) — now every gate/scouting/
// recruiting/comfort building joins the queue as it unlocks, bedrooms whenever roster-bound.
const ORDER = ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall',
  'tavern', 'infirmary', 'dining-hall', 'kitchen', 'garden', 'dungeon', 'holding-cell',
  'scouting-city', 'recruiting-city', 'library', 'market', 'ransom-office', 'smithy',
  'trophy-room', 'gallery', 'shrine', 'chronicle', 'hospital',
  'scouting-coast', 'recruiting-coast', 'scouting-underdeep', 'scouting-highlands', 'recruiting-highlands'];

for (let c = 0; c < cycles; c++) {
  if (g.ai.usage().costUsd > maxUsd) { say(`[cost cap hit at cycle ${c}]`); break }
  g.ghUpgrade();
  if (g.freeCells().length === 0) g.excavate();
  // MERC BEDROOMS drive BOTH roster capacity (+1 each) and level caps — and build('bedroom')
  // without an ownerId targets the BOSS (who has one) and fails silently: every prior run froze
  // at roster 5 / level 6 because of exactly this. One bedroom per merc, owner named.
  const bedless = g.roster().find(m => !g.state.fort.rooms.some(r => r.ownerId === m.id));
  if (bedless && g.gold() > 400) {
    const goldBefore = g.gold();
    if (g.build('bedroom', bedless.id).ok) say(`c${g.state.cycle} BUILD bedroom for ${bedless.name} (−${goldBefore - g.gold()}g)`);
  }
  const wantCell = g.state.holding.length > 0 && g.captives().length >= g.captiveCapacity();
  const queue = [...(wantCell ? ['dungeon-cell'] : []), ...ORDER];
  let built = false;
  for (const b of queue) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || (st.reason === 'already built' && b !== 'dungeon-cell')) continue;
    if (st.reason?.startsWith('costs')) break;
    if (st.reason) continue;
    const goldBefore = g.gold();
    if (!g.build(b).ok) continue;
    say(`c${g.state.cycle} BUILD ${b} (−${goldBefore - g.gold()}g)`);   // spends were invisible to readers
    built = true;
    break;
  }
  // ladder fuel: when the ORDER list is exhausted, ANY unlocked-unbuilt room feeds prestige
  // (the tier ladder starved at T7-T8 with 34-54k gold idle)
  if (!built && g.gold() > 800) {
    const any = g.buildableTypes().find(x => !x.reason && x.type !== 'bedroom' && x.type !== 'great-hall');
    if (any) {
      const goldBefore = g.gold();
      if (g.build(any.type).ok) say(`c${g.state.cycle} BUILD ${any.type} (−${goldBefore - g.gold()}g)`);
    }
  }
  // up to TWO upgrades a cycle when flush — the single-upgrade habit was a prestige binder
  for (let u = 0; u < 2; u++) {
    const up = g.state.fort.rooms.filter(r => ROOM_TYPE[r.type]!.species === 'comfort')
      .sort((a, b) => a.slots.length - b.slots.length)[0];
    if (!up || g.gold() < (u === 0 ? 300 : 700)) break;
    const goldBefore = g.gold();
    if (g.upgrade(up.id).ok) say(`c${g.state.cycle} UPGRADE ${up.type} (−${goldBefore - g.gold()}g)`);
    else break;
  }
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
  for (const s of [...g.state.tavern]) {
    const cand = g.card(s.cardId);
    if (cand && g.roster().length < g.rosterCapacity() && g.gold() > cand.value * 1.2 + 100) {
      const r = g.hire(s.cardId);
      if (r.ok) say(`c${g.state.cycle} HIRE ${cand.name} — ${cand.character?.who ?? ''}`);
    }
  }
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
      // saga cards carry no meaningful archetype (beats serve the bible) — the label lied
      // ("[hunt · beat 1]" → "[investigate · FINALE]" read as a mid-saga family flip)
      say(`\nc${g.state.cycle} ▶ CARD [${q.rarity}${q.chainId ? ` · ${q.isFinale ? 'FINALE' : `beat ${q.beatIndex}`}` : ` ${q.archetype}`}] ${q.title}`);
      say(`  (roster now: ${g.roster().map(m => m.name).join(', ')})`);
      say(`  ${q.situation}`);
      say(`  [list line: ${q.job}]`);   // NOT on the player's card (2026-07-06 merge) — lists only
      if (q.approaches) for (const a of q.approaches) say(`  APPROACH OFFERED: ${a.label}`);
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
      say(`  CHOSE APPROACH: ${q.approaches.find(a => a.id === bestG)!.label}`);
    }
    // never SPLIT the roster across quests it can't fully man — 1+2 parked across a 2-slot and
    // a 3-slot quest froze a campaign for six cycles
    const activeSlots = q.slots.filter(s => !q.approaches || s.groupId === q.chosenApproach);
    if (activeSlots.filter(s => !s.filledBy).length > fit().length) continue;
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy || (q.approaches && slot.groupId !== q.chosenApproach)) continue;
      const free = fit();
      if (!free.length) break;
      const best = free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!;
      g.assign(q.id, i, best.id);
    }
    const o = g.questOdds(q.id);
    // 0-coin parties are GUARANTEED losses — the old `coins > 0 &&` guard marched them (3×/run)
    if (o.coins < o.bar * 0.7 && !q.isFinale) g.abandon(q.id);
  }
  const report = await g.endCycle();
  for (const line of report) say(`  ${line}`);
}

say(`\n\n════════ CHAINS (bible + story) ════════`);
for (const ch of g.state.chains) {
  const b = ch.bible;
  say(`\n■ [${ch.state} · ${ch.rarity} · beats ${ch.beatIndex}/${ch.expectedBeats}] ${b.title}`);
  say(`  KERNEL: ${b.kernel}`);
  say(`  GOAL: ${b.goal}`);
  say(`  ARC: ${b.arc.join(' → ')}`);
  if (b.twist) say(`  TWIST: ${b.twist}`);
  say(`  CAST: ${b.cast.map(x => `${x.name} (${x.role} — wants ${x.want})`).join(' · ')}`);
  say(`  KNOWN TO PLAYER: ${ch.story.knownToPlayer.join(' | ') || '(none)'}`);
  say(`  INTRODUCED: ${(ch.story.introducedNames ?? []).join(', ') || '(none)'}`);
  say(`  NOW: ${ch.story.currentSituation}`);
}

say(`\n\n════════ DOSSIERS (every character with prose) ════════`);
for (const card of g.state.cards.filter(x => x.character && (x.character.who || x.character.backstory))) {
  const ch = card.character!;
  say(`\n■ ${card.name} [${ch.role}] ${renderLoc(card)}`);
  say(`  WHO: ${ch.who ?? '—'}`);
  say(`  BACKSTORY: ${ch.backstory ?? '—'}`);
  say(`  QUIRKS: ${(ch.quirks ?? []).join(' · ') || '—'}`);
}
function renderLoc(c: { location: { kind: string; state?: string } }) {
  return `(${c.location.kind}${(c.location as { state?: string }).state ? `:${(c.location as { state?: string }).state}` : ''})`;
}

const failed = g.ai.callLog().filter(r => !r.ok);
if (failed.length) {
  say(`\n════════ FAILED AI CALLS ════════`);
  for (const r of failed) say(`#${r.n} ${r.purpose} (${r.model}): ${r.error ?? '?'}\n  OUTPUT: ${(r.output ?? '').slice(0, 400)}`);
}
const u = g.ai.usage();
say(`\n════ cycle ${g.state.cycle} · gold ${g.gold()} · AI ${u.calls} calls ~$${u.costUsd.toFixed(2)} ════`);
fs.writeFileSync(LOG, out.join('\n'));
// raw calls ride along for lint passes (out-of-vocab ask tags, rendered-prompt verifier reads)
fs.writeFileSync(`${LOG}.calls.json`, JSON.stringify(g.ai.callLog(), null, 1));
console.log(`done → ${LOG} (${out.length} lines)`);
