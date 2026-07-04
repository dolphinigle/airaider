// Autoplay driver — plays a sensible bedroom-lean policy for N cycles (mock AI).
// The dogfooding + pacing harness: verifies the whole loop holds up over a campaign.
// Usage: npx tsx scripts/autoplay.ts [cycles] [seed] [--verbose]

import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { ROOM_TYPE } from '../src/engine/fort.js';
import { cardType, hasTag } from '../src/engine/cards.js';

const cycles = Number(process.argv[2] ?? 150);
const seed = Number(process.argv[3] ?? 21);
const verbose = process.argv.includes('--verbose');

const g = new Game(new MockProvider(seed), seed);
const say = (s: string) => verbose && console.log(s);

// the §20.2 median opening, adapted
const BUILD_ORDER = [
  'map-room', 'lead-room', 'mess-hall', 'storage', 'scouting-forests', 'recruiting-forests',
  'infirmary', 'dining-hall', 'kitchen', 'garden', 'tavern', 'dungeon', 'holding-cell',
  'dungeon-cell', 'torture-chamber', 'trophy-room', 'gallery', 'library', 'market',
  'ransom-office', 'smithy', 'shrine',
  'scouting-city', 'recruiting-city',     // region 2 the moment T4 opens it
  'dungeon-cell', 'oracle', 'interrogation', 'chronicle',
  'music-hall', 'menagerie', 'hospital', 'treasure-vault',
  'curiosity-cabinet', 'crypt',
  'scouting-coast', 'recruiting-coast',   // region 3 at T7
  'gambling-den', 'bathhouse', 'brewery', 'stables', 'feast-hall',
];
let bedroomsBuilt = 0;
const INFRA = new Set(['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests']);

const tierAt: Record<number, number> = {};

for (let c = 0; c < cycles; c++) {
  // 1) Great Hall first (the clock)
  const gh = g.ghUpgrade();
  if (gh.ok) { tierAt[g.state.fort.ghTier] = g.state.cycle; say(`c${g.state.cycle}: ${gh.msg}`) }

  // 2) build: infrastructure first, then bedrooms interleaved (bedroom-lean)
  if (g.freeCells().length === 0) g.excavate();
  const infraDone = [...INFRA].every(t => g.hasRoom(t));
  const wantBedroom = infraDone && bedroomsBuilt < Math.min(2 + g.state.fort.ghTier, g.roster().length);
  if (wantBedroom && g.gold() > 240) {
    const owner = g.roster().find(m =>
      !g.state.fort.rooms.some(r => r.ownerId === m.id));
    if (owner && g.build('bedroom', owner.id).ok) { bedroomsBuilt++; say(`c${g.state.cycle}: bedroom for ${owner.name}`) }
  }
  const order = infraDone ? BUILD_ORDER : BUILD_ORDER.filter(b => INFRA.has(b));
  for (const b of order) {
    const status = g.buildableTypes().find(x => x.type === b);
    if (!status) continue;
    if (status.reason === 'already built') continue;
    if (status.reason?.startsWith('costs')) break;   // save up for the next thing in order
    if (status.reason) continue;
    if (b === 'dungeon-cell' && (g.captiveCapacity() >= 24 || g.captiveCapacity() >= g.captives().length + 3)) continue;
    const r = g.build(b);
    if (r.ok) say(`c${g.state.cycle}: built ${b}`);
    break;
  }

  // 3) upgrades: cheapest comfort room below the slot gate (theme + bedrooms first)
  const up = g.state.fort.rooms
    .filter(r => ROOM_TYPE[r.type]!.species === 'comfort')
    .sort((a, b) => a.slots.length - b.slots.length)[0];
  if (up && g.gold() > 220) {
    const r = g.upgrade(up.id);
    if (r.ok) say(`c${g.state.cycle}: upgraded ${up.type} → ${up.slots.length} slots`);
  }

  // 4) staffing: for each empty slot pick the BEST-FIT free fill (fillScore-aware);
  //    swap in strictly better fills (replacement staffing, §20.2 rule 5)
  const { fillScore } = await import('../src/engine/overlap.js');
  const freeFills = () => g.state.cards.filter(card =>
    (cardType(card) === 'relic' && card.location.kind === 'held') ||
    (card.character?.role === 'captive' && hasTag(card.tags, 'obedient') && card.location.kind === 'held'));
  for (const room of g.state.fort.rooms) {
    const rt = ROOM_TYPE[room.type]!;
    if (rt.species !== 'comfort' || rt.benefit === 'break') continue;
    for (let idx = 0; idx < room.slots.length; idx++) {
      if (room.slots[idx]) continue;
      const cands = freeFills()
        .map(card => ({ card, s: fillScore(card.tags, g.effectiveWants(room)) }))
        .sort((a, b) => b.s - a.s);
      const best = cands[0];
      if (!best || best.s <= 0.3) continue;   // don't waste good relics as junk fill
      const res = g.slot(room.id, idx, best.card.id);
      if (res.ok) say(`c${g.state.cycle}: slotted ${best.card.name} → ${room.type} (fit ${best.s})`);
    }
  }
  // renovate the newest theme room toward the loot stream once affordable (rule 4)
  if (g.gold() > 400 && g.state.cycle % 20 === 0) {
    const unstyled = g.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'prestige' && !r.style);
    if (unstyled) {
      const styles = ['elven', 'ancient', 'human', 'exotic'];
      const r = await g.renovate(unstyled.id, styles[g.state.cycle % styles.length]!);
      if (r.ok) say(`c${g.state.cycle}: ${r.msg}`);
    }
  }

  // 5) captives: break raw ones (rack), accept from holding; hire from tavern
  for (const s of [...g.state.holding]) g.acceptCaptive(s.cardId);
  const rack = g.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'break');
  if (rack) {
    for (const captive of g.captives().filter(x => !hasTag(x.tags, 'obedient') && x.location.kind === 'held')) {
      const idx = rack.slots.indexOf(null);
      if (idx < 0) break;
      g.slot(rack.id, idx, captive.id);
    }
  }
  // sell junk relics (unslottable fits) — a human monetizes the dead drops
  const { fillScore: fs2 } = await import('../src/engine/overlap.js');
  const idleRelics = g.relics().filter(r => r.location.kind === 'held');
  for (const relic of idleRelics) {
    const bestFit = Math.max(0, ...g.state.fort.rooms
      .filter(r => ROOM_TYPE[r.type]!.species === 'comfort')
      .map(r => fs2(relic.tags, g.effectiveWants(r))));
    if (bestFit <= 0.5 && idleRelics.length > 3) g.sell(relic.id);
  }
  // hire: stretch for the roster — width IS the pursue budget (mercs are the constraint)
  for (const s of [...g.state.tavern]) {
    const cand = g.card(s.cardId);
    if (!cand) continue;
    const cost = Math.round(cand.value * 1.2);
    const desperate = g.roster().length <= 3;   // the 3rd/4th merc is pivotal — stretch
    if (g.roster().length < g.rosterCapacity() && g.gold() > cost + (desperate ? 0 : 100)) {
      const r = g.hire(s.cardId);
      if (r.ok) say(`c${g.state.cycle}: hired ${cand.name} (${cost}g)`);
    }
  }
  // set a training focus for any merc without one (their best natural attr)
  for (const m of g.roster()) {
    if (m.character!.focus.kind !== 'none') continue;
    const attrs = Object.entries(m.character!.attrs).sort((a, b) => b[1] - a[1]);
    g.setFocus(m.id, { kind: 'single', attr: attrs[0]![0] as never } as never);
  }
  // interrogate a captive occasionally (the lead faucet nobody remembers)
  if (g.state.cycle % 15 === 0 && g.gold() > 500) {
    const talker = g.captives().find(x => !hasTag(x.tags, 'interrogated'));
    if (talker) g.interrogate(talker.id);
  }
  // ransom surplus RAW captives only (keep the best 16 for breaking; obedient are the
  // prestige workforce — never sold by policy)
  const raw = g.captives().filter(x => !hasTag(x.tags, 'obedient') && x.location.kind === 'held')
    .sort((a, b) => b.value - a.value);
  for (const c of raw.slice(16)) g.ransom(c.id);

  // 6) quests — play like a human: read the odds (always visible), send winnable work,
  // abandon what can't be manned or won.
  const { coins } = await import('../src/engine/roll.js');
  const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
  const median = () => {
    const ls = g.roster().map(m => m.character!.level).sort((a, b) => a - b);
    return ls[Math.floor(ls.length / 2)] ?? 1;
  };
  // pursue: leads near our level; at most 2 live chains; hunts as filler
  const liveChains = g.state.chains.filter(c => c.state === 'active' || c.state === 'finale-pending').length;
  const leads = [...g.visibleLeads()]
    .filter(l => Math.abs(l.level - median()) <= 3)
    .filter(l => l.chainInfo.kind !== 'starts-new' || liveChains < 2)
    .sort((a, b) => {
      const score = (l: typeof a) =>
        (l.chainInfo.kind === 'continues' ? 0 : l.expiresAtCycle !== null ? 1 : 2) * 10 + Math.abs(l.level - median());
      return score(a) - score(b);
    });
  for (const lead of leads) {
    const openSlots = g.state.quests.filter(q => q.state === 'open')
      .reduce((s, q) => s + q.slots.filter(x => !x.filledBy).length, 0);
    if (openSlots >= fit().length) break;
    await g.pursue(lead.id);
  }
  // fill: quests closest to complete first; then keep only decent odds
  const openQs = g.state.quests.filter(q => q.state === 'open')
    .sort((a, b) => a.slots.filter(s => !s.filledBy).length - b.slots.filter(s => !s.filledBy).length);
  for (const q of openQs) {
    if (q.approaches && !q.chosenApproach) {
      // pick the approach our roster rolls best
      let bestG = q.approaches[0]!.id, bestC = -1;
      for (const a of q.approaches) {
        const slot = q.slots.find(s => s.groupId === a.id);
        if (!slot) continue;
        const c = Math.max(0, ...fit().map(m => coins(m, slot.test)));
        if (c > bestC) { bestC = c; bestG = a.id }
      }
      g.chooseApproach(q.id, bestG);
    }
    for (let i = 0; i < q.slots.length; i++) {
      const slot = q.slots[i]!;
      if (slot.filledBy) continue;
      if (q.approaches && slot.groupId !== q.chosenApproach) continue;
      const free = fit();
      if (!free.length) break;
      const best = free.sort((a, b) => coins(b, slot.test) - coins(a, slot.test))[0]!;
      g.assign(q.id, i, best.id);
    }
    const active = q.approaches ? q.slots.filter(s => s.groupId === q.chosenApproach) : q.slots;
    const filled = active.every(s => s.filledBy);
    if (filled) {
      const o = g.questOdds(q.id);
      const pSuccess = o.success ?? (o.coins >= o.bar * 1.3 ? 0.9 : o.coins >= o.bar ? 0.5 : 0.1);
      if (pSuccess < 0.25 && !q.isFinale) {  // don't send suicide parties
        g.abandon(q.id);
        say(`c${g.state.cycle}: abandoned ${q.title} (odds too thin)`);
      }
    } else if (active.some(s => !s.filledBy) && fit().length === 0 && active.filter(s => s.filledBy).length === 0) {
      g.abandon(q.id); // can't man it at all — free the board
    }
  }

  const report = await g.endCycle();
  if (verbose) for (const line of report) console.log(`   ${line}`);

  // tripwire: every cycle must leave a structurally consistent state
  const { assertAudit } = await import('../src/game/audit.js');
  assertAudit(g, `cycle ${g.state.cycle}`);
}

// ---- summary ------------------------------------------------------------------------------
const st = g.state;
console.log('\n══════ AUTOPLAY SUMMARY ══════');
console.log(`cycles ${st.cycle} · seed ${seed}`);
console.log(`GH tier ${st.fort.ghTier} (tier-at: ${Object.entries(tierAt).map(([t, c]) => `T${t}@c${c}`).join(' ')})`);
console.log(`prestige ${g.prestige().toFixed(1)} · gold ${g.gold()}`);
console.log(`rooms ${st.fort.rooms.length}: ${st.fort.rooms.map(r => r.type).join(', ')}`);
console.log(`roster ${g.roster().length}/${g.rosterCapacity()}: ${g.roster().map(m => `${m.name} L${m.character!.level}/${g.capOf(m.id)}`).join(' · ')}`);
console.log(`captives ${g.captives().length} (${g.captives().filter(c => hasTag(c.tags, 'obedient')).length} obedient) · relics ${g.relics().length}`);
console.log(`chains: ${st.chains.map(c => `${c.bible.title}[${c.state} b${c.beatIndex}]`).join(' · ') || 'none'}`);
console.log(`lore: ${Object.keys(st.lore.nodes).length} nodes, ${st.lore.edges.length} edges (${st.lore.edges.filter(e => e.active).length} active)`);
console.log(`leads on board ${g.visibleLeads().length} · AI calls ${(g.ai as MockProvider).usage().calls}`);
const saveArg = process.argv.find(a => a.startsWith('--save='));
if (saveArg) {
  const dest = saveArg.split('=')[1]!;
  fs.mkdirSync('saves', { recursive: true });
  fs.writeFileSync(dest, g.save());
  console.log('saved →', dest);
}
const resolved = st.log.filter(l => l.kind === 'resolve');
console.log(`quests resolved(last400log) ${resolved.length} (${resolved.filter(l => l.text.includes('success')).length} s / ${resolved.filter(l => l.text.includes('partial')).length} p / ${resolved.filter(l => l.text.includes('failure')).length} f)`);
console.log(`sizes: cards ${st.cards.length} · quests[] ${st.quests.length} · leads[] ${st.leads.length} · loreN ${Object.keys(st.lore.nodes).length} · loreE ${st.lore.edges.length} (${st.lore.edges.filter(e => e.active).length} act) · save ${(g.save().length / 1024).toFixed(0)}kB`);
