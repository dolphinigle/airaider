// GH tier-pacing sim — mock AI, long horizon, play policy modeled on campaignread.ts.
// Prints per seed: tier-arrival cycles, prestige/gold curve samples, per-stage binder mix,
// rarity mix of leads at c5/c10, City-unlock check.
// Usage: npx tsx scripts/_tiersim.ts [cycles] [seeds] [--quiet]

import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { ROOM_TYPE, GH_THRESHOLDS } from '../src/game/game.js';
import { ghUpgradeCost, maxSlotsAtTier } from '../src/engine/fort.js';
import { cardType, hasTag } from '../src/engine/cards.js';
import { coins } from '../src/engine/roll.js';
import { fillScore } from '../src/engine/overlap.js';

const CYCLES = Number(process.argv[2] ?? 120);
const NSEEDS = Number(process.argv[3] ?? 10);
const QUIET = process.argv.includes('--quiet');
// --eager: a tier-chasing player buys a theme room's FIRST slot as soon as it's affordable
// (campaignread's gold>300 reserve delays first slots to ~c15-20 — this variant measures
// whether the early windows are reachable for a player who plays toward the tier)
const EAGER = process.argv.includes('--eager');
const SEEDS = Array.from({ length: NSEEDS }, (_, i) => 11001 + i * 100);

// campaignread ORDER, extended through the tier ladder (one build per cycle, save-for-next
// on "costs" — same policy). dungeon-cell capped at 2 (multiBuild would loop forever).
const ORDER = [
  'map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall',
  'tavern', 'infirmary', 'dining-hall', 'kitchen', 'garden', 'dungeon', 'holding-cell',
  'gallery', 'trophy-room', 'torture-chamber', 'dungeon-cell',
  'library', 'market', 'smithy', 'hall-of-arms', 'shrine', 'ransom-office',
  'scouting-city', 'recruiting-city', 'chronicle', 'music-hall', 'menagerie', 'oracle',
  'treasure-vault', 'curiosity-cabinet', 'crypt', 'hospital',
  'gambling-den', 'bathhouse', 'brewery', 'stables', 'feast-hall',
  'scouting-coast', 'recruiting-coast',
  'scouting-underdeep', 'recruiting-underdeep',
  'scouting-highlands', 'recruiting-highlands',
];

interface SeedResult {
  seed: number;
  tierAt: Record<number, number>;          // tier → cycle reached
  cityUnlockedAt: number | null;
  prestigeSamples: string[];
  binderMix: Record<string, Record<string, number>>;   // "T2→3" → binder → cycles
  rarityAt: Record<number, string>;
  finalPrestige: number; finalGold: number; finalTier: number;
}

async function runSeed(seed: number): Promise<SeedResult> {
  const g = new Game(new MockProvider(seed), seed);
  const tierAt: Record<number, number> = {};
  let cityUnlockedAt: number | null = null;
  const prestigeSamples: string[] = [];
  const binderMix: Record<string, Record<string, number>> = {};
  const rarityAt: Record<number, string> = {};
  const leadRarity: Record<string, string> = {};       // every lead ever seen

  for (let c = 0; c < CYCLES; c++) {
    if (g.ghUpgrade().ok) tierAt[g.state.fort.ghTier] = g.state.cycle;
    if (g.freeCells().length === 0) g.excavate();
    for (const b of ORDER) {
      if (b === 'dungeon-cell' && g.state.fort.rooms.filter(r => r.type === 'dungeon-cell').length >= 2) continue;
      const st = g.buildableTypes().find(x => x.type === b);
      if (!st || st.reason === 'already built') continue;
      if (st.reason?.startsWith('costs')) break;       // save for it
      if (st.reason) continue;
      g.build(b);
      break;
    }
    const up = g.state.fort.rooms.filter(r => ROOM_TYPE[r.type]!.species === 'comfort')
      .sort((a, b) => a.slots.length - b.slots.length)[0];
    if (up && g.gold() > 300) g.upgrade(up.id);
    else if (EAGER) {
      const bare = g.state.fort.rooms.find(r => ROOM_TYPE[r.type]!.benefit === 'prestige' && r.slots.length === 0);
      if (bare) g.upgrade(bare.id);
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
      if (cand && g.roster().length < g.rosterCapacity() && g.gold() > cand.value * 1.2 + 100) g.hire(s.cardId);
    }
    const fit = () => g.roster().filter(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
    const liveChains = g.state.chains.filter(x => x.state === 'active' || x.state === 'finale-pending').length;
    const leads = [...g.visibleLeads()]
      .filter(l => l.chainInfo.kind !== 'starts-new' || liveChains < 2)
      .sort((a, b) => (a.chainInfo.kind === 'continues' ? 0 : a.expiresAtCycle !== null ? 1 : 2) -
        (b.chainInfo.kind === 'continues' ? 0 : b.expiresAtCycle !== null ? 1 : 2));
    for (const l of g.visibleLeads()) leadRarity[l.id] = l.rarity;
    for (const lead of leads) {
      const openSlots = g.state.quests.filter(q => q.state === 'open')
        .reduce((s, q) => s + q.slots.filter(x => !x.filledBy).length, 0);
      if (openSlots >= fit().length) break;
      await g.pursue(lead.id);
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
      }
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
      if (o.coins < o.bar * 0.7 && !q.isFinale) g.abandon(q.id);
    }
    const report = await g.endCycle();
    if (process.env.TIER_ANNOUNCE)   // announcement smoke: the 🏛 line must reach the report
      for (const line of report) if (line.includes('🏛')) console.log(`[seed ${seed}] c${g.state.cycle} REPORT: ${line}`);
    if (g.ghUpgrade().ok) tierAt[g.state.fort.ghTier] = g.state.cycle;   // prestige moved this cycle

    // ---- instrumentation ----
    const cyc = g.state.cycle;
    const p = g.prestige(), gold = g.gold(), t = g.state.fort.ghTier;
    if (cityUnlockedAt === null && g.state.unlockedRegions.includes('city')) cityUnlockedAt = cyc;
    if (cyc % 10 === 0 || cyc === 5) prestigeSamples.push(`c${cyc}:T${t} P${p.toFixed(0)} ${gold}g`);
    if (cyc === 5 || cyc === 10) {
      const mix: Record<string, number> = {};
      for (const r of Object.values(leadRarity)) mix[r] = (mix[r] ?? 0) + 1;
      rarityAt[cyc] = ['common', 'uncommon', 'rare'].map(r => `${r[0]}${mix[r] ?? 0}`).join('/');
    }
    // binder: why is the NEXT tier not here yet?
    const need = GH_THRESHOLDS[t + 1];
    if (need !== undefined) {
      let binder: string;
      if (p >= need) binder = gold < ghUpgradeCost(t + 1) ? 'gold-gh' : 'ready';
      else {
        const themeRooms = g.state.fort.rooms.filter(r => ROOM_TYPE[r.type]!.benefit === 'prestige');
        const buildable = ORDER.some(b => {
          const rt = ROOM_TYPE[b]; if (!rt || rt.benefit !== 'prestige') return false;
          const st = g.buildableTypes().find(x => x.type === b);
          return st && !st.reason;
        });
        const maxS = maxSlotsAtTier(t);
        const emptySlots = themeRooms.reduce((s, r) => s + r.slots.filter(x => !x).length, 0);
        const upgradable = themeRooms.some(r => r.slots.length < maxS);
        const heldRelics = g.state.cards.filter(c => cardType(c) === 'relic' && c.location.kind === 'held').length;
        if (emptySlots > 0 && heldRelics > 0) binder = 'relic-fit';
        else if (emptySlots > 0) binder = 'relic-supply';
        else if (upgradable) binder = gold > 300 ? 'upgrade-lag' : 'gold-upgrades';
        else if (buildable) binder = 'build-lag';
        else if (!themeRooms.some(r => r.slots.length < maxS)) binder = 'slot-cap';
        else binder = 'other';
      }
      const stage = `T${t}→${t + 1}`;
      binderMix[stage] = binderMix[stage] ?? {};
      binderMix[stage]![binder] = (binderMix[stage]![binder] ?? 0) + 1;
    }
  }
  return {
    seed, tierAt, cityUnlockedAt, prestigeSamples, binderMix, rarityAt,
    finalPrestige: g.prestige(), finalGold: g.gold(), finalTier: g.state.fort.ghTier,
  };
}

const results: SeedResult[] = [];
for (const seed of SEEDS) results.push(await runSeed(seed));

const tiers = Array.from({ length: 14 }, (_, i) => i + 2);
console.log(`\n══ tier arrival (cycle) · ${CYCLES} cycles · ${NSEEDS} seeds ══`);
console.log('seed   ' + tiers.map(t => `T${t}`.padStart(5)).join('') + '  city  P@end  g@end');
for (const r of results) {
  console.log(String(r.seed).padEnd(7) +
    tiers.map(t => (r.tierAt[t] !== undefined ? String(r.tierAt[t]) : '—').padStart(5)).join('') +
    String(r.cityUnlockedAt ?? '—').padStart(6) +
    String(Math.round(r.finalPrestige)).padStart(7) + String(r.finalGold).padStart(7));
}
for (const t of tiers) {
  const arr = results.filter(r => r.tierAt[t] !== undefined).map(r => r.tierAt[t]!).sort((a, b) => a - b);
  if (!arr.length) { console.log(`T${t}: never reached`); continue }
  console.log(`T${t}: ${arr.length}/${NSEEDS} seeds · median c${arr[Math.floor(arr.length / 2)]} · range c${arr[0]}-c${arr[arr.length - 1]}`);
}

if (!QUIET) {
  console.log('\n══ per-seed detail ══');
  for (const r of results) {
    console.log(`\nseed ${r.seed} — rarity mix c5 ${r.rarityAt[5] ?? '?'} · c10 ${r.rarityAt[10] ?? '?'}`);
    console.log('  ' + r.prestigeSamples.join(' · '));
    for (const [stage, mix] of Object.entries(r.binderMix)) {
      const tot = Object.values(mix).reduce((a, b) => a + b, 0);
      console.log(`  ${stage} (${tot}cy): ` + Object.entries(mix).sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${v}`).join(' · '));
    }
  }
}
