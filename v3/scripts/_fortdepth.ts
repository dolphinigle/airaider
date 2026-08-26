// Is the fort phase thick enough to absorb a 60s wait? (TEMPO A12)
// Counts the MEANINGFUL, non-AI, affordable actions available to the player at the top of each
// cycle. Mock provider (instant) so the count is about the BOARD, not the model.
// Usage: npx tsx scripts/_fortdepth.ts [cycles] [seed]
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { ROOM_TYPE, maxSlotsAtTier, upgradeCost } from '../src/engine/fort.js';
import { cardType, hasTag } from '../src/engine/cards.js';
import { hireCost } from '../src/engine/economy.js';
import { fillScore } from '../src/engine/overlap.js';

const cycles = Number(process.argv[2] ?? 20);
const seed = Number(process.argv[3] ?? 31337);
const g = new Game(new MockProvider(seed), seed);

function depth() {
  const st = g.state;
  const gold = g.gold();
  const build = g.buildableTypes().filter(b => !b.reason).length;
  const upgrade = st.fort.rooms.filter(r => ROOM_TYPE[r.type]!.species === 'comfort'
    && r.slots.length < maxSlotsAtTier(st.fort.ghTier)
    && upgradeCost(ROOM_TYPE[r.type]!, r.slots.length) <= gold).length;
  const free = g.roster().filter(m => m.location.kind === 'held');
  const assign = st.quests.filter(q => q.state === 'open')
    .reduce((n, q) => n + (free.length ? q.slots.filter(s => !s.filledBy).length : 0), 0);
  // a room slot that is empty AND has a card that actually fits it
  const slotting = st.fort.rooms.filter(r => {
    if (!r.slots.some(s => !s)) return false;
    const wants = g.effectiveWants(r);
    return st.cards.some(c => c.location.kind === 'held' && (c.location.state === 'inventory' || c.location.state === 'roster')
      && (cardType(c) === 'relic' || (c.character?.role === 'captive' && hasTag(c.tags, 'obedient')))
      && fillScore(c.tags, wants) > 0);
  }).length;
  const hire = st.tavern.filter(s => hireCost(g.card(s.cardId)!.value) <= gold).length;
  const sell = g.relics().length + g.captives().length;
  const leads = g.visibleLeads().length;
  // CHOICES counts distinct options; CLICKS counts what the player can actually do in sequence
  // right now — builds/upgrades compete for the same purse, and an assign needs a free merc.
  const clicks = (build || upgrade ? 1 : 0) + Math.min(assign, free.length) + slotting + hire + sell;
  return { build, upgrade, assign: Math.min(assign, free.length), slotting, hire, sell, leads,
    total: build + upgrade + assign + slotting + hire + sell, clicks };
}

console.log('cycle  gold  build upg assign slot hire sell | CHOICES | CLICKS | leads');
for (let c = 1; c <= cycles; c++) {
  const d = depth();
  console.log(`${String(g.state.cycle).padStart(5)} ${String(g.gold()).padStart(5)}  ${String(d.build).padStart(5)} ${String(d.upgrade).padStart(3)} ${String(d.assign).padStart(6)} ${String(d.slotting).padStart(4)} ${String(d.hire).padStart(4)} ${String(d.sell).padStart(4)} | ${String(d.total).padStart(7)} | ${String(d.clicks).padStart(6)} | ${d.leads}`);
  // play a plausible cycle: build the next thing, pursue up to 2, staff what we can
  g.ghUpgrade();
  if (g.freeCells().length === 0) g.excavate();
  for (const b of ['map-room', 'lead-room', 'scouting-forests', 'recruiting-forests', 'mess-hall',
    'infirmary', 'dining-hall', 'kitchen', 'garden', 'tavern', 'dungeon', 'holding-cell']) {
    const st = g.buildableTypes().find(x => x.type === b);
    if (!st || st.reason) continue;
    g.build(b); break;
  }
  for (const l of g.visibleLeads().slice(0, 2)) await g.pursue(l.id);
  for (const q of g.state.quests.filter(q => q.state === 'open')) {
    for (let i = 0; i < q.slots.length; i++) {
      if (q.slots[i]!.filledBy) continue;
      const m = g.roster().find(m => m.location.kind === 'held' && m.character!.injuryTiers < 4);
      if (m) g.assign(q.id, i, m.id);
    }
  }
  await g.endCycle();
}
