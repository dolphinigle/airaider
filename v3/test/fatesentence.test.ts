// The finale's Outcome line (sagaflow.ts sagaFate, D18): ONE function, every branch settleFinale can take — checked
// against what settleFinale ACTUALLY does to the same game (the focal's role and place afterwards).
import { describe, it, expect } from 'vitest';
import { seedIdCounter } from '../src/engine/cards.js';
import { HELD } from '../src/engine/cards.js';
import type { FinaleFate } from '../src/engine/chains.js';
import type { Quest } from '../src/engine/quests.js';
import type { Outcome } from '../src/engine/roll.js';
import { WAY_REWARD, type Way } from '../src/engine/saga.js';
import type { Game } from '../src/game/game.js';
import * as flow from '../src/game/sagaflow.js';
import { newGame, sagaChain, hostFor } from './sagaharness.js';

interface Case {
  name: string; personal?: boolean; way: Way; outcome: Outcome; bank?: number;
  setup?: (g: Game, focalId: string) => void;
  says: RegExp;
  /** what settleFinale left: the focal's role and where they are */
  then: { role?: string; at: 'roster' | 'lore' | 'staged-tavern' | 'staged-holding'; chain: 'done' | 'slipped' };
}
const fateOf = (o: Outcome): FinaleFate => o === 'success' ? { fate: 'clean' } : o === 'partial' ? { fate: 'saddled' } : { fate: 'slipped', sequelRarity: 'uncommon' };
const makeMerc = (g: Game, id: string) => { const f = g.card(id)!; f.character!.role = 'merc'; f.location = HELD('roster') };
const noDungeon = (g: Game) => { (g as unknown as { hasRoom: (t: string) => boolean }).hasRoom = (t: string) => t !== 'dungeon' };
const dungeon = (cap: number, held: number) => (g: Game) => {
  Object.assign(g, { hasRoom: () => true, captiveCapacity: () => cap, captives: () => Array.from({ length: held }, () => g.roster()[0]!) });
};

const CASES: Case[] = [
  { name: 'slipped', way: 'captive', outcome: 'failure', says: /slips out of the company's reach, for now\.$/, then: { at: 'lore', chain: 'slipped' } },
  { name: 'slipped, the focal already a soldier', way: 'captive', outcome: 'failure', setup: makeMerc, says: /slips out of reach, for now; .* stays with the company\.$/, then: { role: 'merc', at: 'roster', chain: 'slipped' } },
  { name: 'personal, settled by words', personal: true, way: 'talk', outcome: 'success', says: /is talked round\.$/, then: { role: 'merc', at: 'roster', chain: 'done' } },
  { name: 'personal, settled by force', personal: true, way: 'fight', outcome: 'partial', says: /is beaten in a fight\.$/, then: { role: 'merc', at: 'roster', chain: 'done' } },
  { name: 'personal, settled unseen', personal: true, way: 'sneak', outcome: 'success', says: /^The company slips past .* unseen\.$/, then: { role: 'merc', at: 'roster', chain: 'done' } },
  { name: 'personal, slipped', personal: true, way: 'talk', outcome: 'failure', says: /still stands in .*'s way\.$/, then: { role: 'merc', at: 'roster', chain: 'slipped' } },
  { name: 'the focal joined mid-saga', way: 'recruit', outcome: 'success', setup: makeMerc, says: /who already stands with the company\.$/, then: { role: 'merc', at: 'roster', chain: 'done' } },
  { name: 'void: too thin a season to keep them', way: 'captive', outcome: 'success', bank: 1, says: /earned too little to keep/, then: { at: 'lore', chain: 'done' } },
  { name: 'gold', way: 'gold', outcome: 'success', says: /^The company takes .*'s treasure, and (he|she) goes free\.$/, then: { at: 'lore', chain: 'done' } },
  { name: 'gold on a thin bank is never void', way: 'gold', outcome: 'partial', bank: 1, says: /treasure/, then: { at: 'lore', chain: 'done' } },
  { name: 'recruit, room on the roster', way: 'recruit', outcome: 'success', setup: g => Object.assign(g, { rosterCapacity: () => 99 }), says: /joins the company\.$/, then: { role: 'merc', at: 'roster', chain: 'done' } },
  { name: 'recruit, the roster full', way: 'recruit', outcome: 'success', setup: g => Object.assign(g, { rosterCapacity: () => 0 }), says: /the roster is full, so (he|she) waits at the tavern\.$/, then: { role: 'npc', at: 'staged-tavern', chain: 'done' } },
  { name: 'captive, a Dungeon with room', way: 'captive', outcome: 'success', setup: dungeon(4, 0), says: /is taken to the fort's cells\.$/, then: { role: 'captive', at: 'staged-holding', chain: 'done' } },
  { name: 'captive, no Dungeon', way: 'captive', outcome: 'success', setup: noDungeon, says: /no Dungeon to hold/, then: { role: 'captive', at: 'staged-holding', chain: 'done' } },
  { name: 'captive, the cells full', way: 'captive', outcome: 'partial', setup: dungeon(1, 1), says: /cells are full\.$/, then: { role: 'captive', at: 'staged-holding', chain: 'done' } },
];

describe('sagaFate — the Outcome line agrees with settleFinale, branch by branch', () => {
  for (const c of CASES) it(c.name, async () => {
    seedIdCounter(1);
    const { g } = newGame(400 + CASES.indexOf(c));
    const { chain, focal } = sagaChain(g, { N: 3, personal: !!c.personal, kind: c.way === 'gold' ? 'gold-hoard' : c.way === 'recruit' ? 'recruit' : 'captive' });
    const host = hostFor(g);
    flow.deal(host, chain, undefined, focal);
    await flow.plan(host, chain);
    chain.bank = c.bank ?? focal.value * 2;
    c.setup?.(g, focal.id);
    const fate = fateOf(c.outcome);
    const line = flow.sagaFate(flow.fateFacts(host, chain, c.way, c.outcome, fate));
    expect(line).toMatch(c.says);
    // the same game, settled by the real thing
    const q = { approaches: [{ id: 'g0', label: 'the plan', rewardKind: WAY_REWARD[c.way] }], chosenApproach: 'g0' } as unknown as Quest;
    const report: string[] = [];
    (g as unknown as { settleFinale: (q: Quest, ch: typeof chain, r: { outcome: Outcome; party: never[] }, rep: string[], f: FinaleFate) => void })
      .settleFinale(q, chain, { outcome: c.outcome, party: [] }, report, fate);
    const f = g.card(focal.id)!;
    expect(chain.state).toBe(c.then.chain);
    if (c.then.role) expect(f.character!.role).toBe(c.then.role);
    const at = f.location.kind === 'held' ? f.location.state : f.location.kind;
    if (c.then.at === 'staged-tavern') { expect(at).toBe('staged'); expect(g.state.tavern.some(t => t.cardId === f.id)).toBe(true) }
    else if (c.then.at === 'staged-holding') { expect(at).toBe('staged'); expect(g.state.holding.some(t => t.cardId === f.id)).toBe(true) }
    else expect(at).toBe(c.then.at);
    // the sentence names the person settleFinale's own news line names (the personal soldier's foe excepted)
    if (!c.personal) expect(line).toContain(f.name);
  });
});
