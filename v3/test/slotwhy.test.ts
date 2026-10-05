// WHY an item earns what it does (designer 2026-10-06: "when an item placed into something gets 4.8 prestige, the reason
// why somewhere I can see"). Game.slotWhy / roomWhy say it in plain words, read from the score's own parts (fillDetail,
// roomMate, the room's band, slotShare) — so the words follow the number. Both UIs print these lines (the GUI room panel
// and sheet, the CLI room view and `fit`), and setInRoom's result carries the short why.
import { describe, it, expect } from 'vitest';
import { Game, RANK_RULE, GROUP_RULE, MATE_BONUS } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { HELD, mintStackable, freshId, type Card } from '../src/engine/cards.js';
import { T, CONCEPT, CONCEPTS, GROUPS, bandOf, type TagInstance } from '../src/engine/tags.js';
import { fillDetail, fillScore, BAND_SCORE, GROUP_FIT, type TagQuery } from '../src/engine/overlap.js';
import { ADJACENCY_MULT, typeBand } from '../src/engine/fort.js';
import { infirmaryHealRate, REST_HEAL_PER_CYCLE } from '../src/engine/injury.js';
import { roomDesc } from '../src/game/roomInfo.js';
import { render } from '../cli/format.js';

function rich(): Game {
  const g = new Game(new MockProvider(5), 5);
  g.state.cards.push(mintStackable('gold', 100000));
  g.state.fort.ghTier = 6;
  for (let i = 0; i < 8; i++) g.excavate();
  return g;
}
function relic(g: Game, tags: [string, number][]): Card {
  const c: Card = { id: freshId('r'), name: `Relic ${tags.map(t => t[0]).join('-')}`, value: 80, tags: [{ concept: 'relic' }, ...tags.map(([t, n]) => T(t, n))], location: HELD('inventory'), chainIds: [] };
  g.state.cards.push(c);
  return c;
}
/** build a room with `places` places, in a given cell when asked */
function room(g: Game, type: string, places = 2, cell?: { floor: number; col: number }) {
  const r = g.build(type, undefined, cell);
  expect(r.ok, r.msg).toBe(true);
  const rm = g.room(r.id!)!;
  for (let i = 0; i < places; i++) expect(g.upgrade(rm.id).ok).toBe(true);
  return rm;
}
const dist = (a: { floor: number; col: number }, b: { floor: number; col: number }) => Math.abs(a.floor - b.floor) + Math.abs(a.col - b.col);
/** two free cells side by side (or, apart = true, two that are not) */
function cellPair(g: Game, apart = false) {
  const free = g.freeCells();
  for (const a of free) for (const b of free) if (a !== b && (apart ? dist(a, b) > 1 : dist(a, b) === 1)) return [a, b] as const;
  throw new Error('no cell pair');
}

describe('Game.slotWhy — why an item earns its share', () => {
  it('an exact match: names the tag and its rank, says a full match; the only item carries the base inside its share', () => {
    const g = rich();
    const garden = room(g, 'garden');                       // wants nature, decoration, curio · minor band 1–30
    const a = relic(g, [['curio', 1], ['human-style', 1]]);
    const res = g.setInRoom(garden.id, a.id);
    expect(res.ok).toBe(true);
    const w = g.slotWhy(garden.id, 0)!;
    expect(w.fit).toBe('full');
    expect(w.chip).toBe('full match · curio (low)');
    expect(w.lines[0]).toBe("Full match: its curio (low) tag is one of the Garden's wants — each rank higher counts double.");
    // the first item: its share is the room's whole prestige, and the base (the band's floor, 1.0 here) is inside it
    const share = g.slotShare(garden.id, 0)!.prestige;
    expect(share).toBeCloseTo(g.prestige(), 9);
    expect(w.lines[1]).toBe(`It is the room's only item, so it also switches on the room's base: 1.0 of its ${share.toFixed(1)} ✦.`);
    expect(w.own).toBe(2);
    // the room's half: where the room stands against its ceiling
    expect(w.lines.at(-1)).toBe(`Each further item adds less as the room fills — the Garden is at ${g.prestige().toFixed(1)} of a 30 ✦ ceiling.`);
    expect(w.lines.length).toBeGreaterThanOrEqual(2);
    expect(w.lines.length).toBeLessThanOrEqual(4);
    // the set-in result says the short why
    expect(res.msg).toMatch(/ · why: full match on its curio \(low\) tag, and it switched on the room's base$/);
  });

  it('a higher rank is named as such (the score doubles per rank — the line says so)', () => {
    const g = rich();
    const garden = room(g, 'garden');
    const a = relic(g, [['curio', 16]]);
    g.setInRoom(garden.id, a.id);
    expect(g.slotWhy(garden.id, 0)!.chip).toBe('full match · curio (legendary)');
    expect(fillScore(a.tags, garden.wants)).toBe(8);
  });

  it('a group match: half, naming the tag and the wanted kind', () => {
    const g = rich();
    const garden = room(g, 'garden');
    garden.wants = [{ match: 'form' }];                     // a want naming the whole relic-form group
    const a = relic(g, [['curio', 1]]);
    g.setInRoom(garden.id, a.id);
    const w = g.slotWhy(garden.id, 0)!;
    expect(w.fit).toBe('half');
    expect(w.chip).toBe('half match · curio (low)');
    expect(w.lines[0]).toBe('Half match: its curio (low) tag is a kind of “form”, which the Garden wants — half an exact match.');
    expect(fillDetail(a.tags, garden.wants)).toMatchObject({ fit: 'half', score: 0.5, want: 'form' });
  });

  it('no match: says so and lists what the room wants; the item still earns the least an item can', () => {
    const g = rich();
    const garden = room(g, 'garden');
    const a = relic(g, [['curio', 1]]), b = relic(g, [['clothes', 3]]);
    g.setInRoom(garden.id, a.id);
    const res = g.setInRoom(garden.id, b.id);
    const w = g.slotWhy(garden.id, 1)!;
    expect(w.fit).toBe('none');
    expect(w.chip).toBe('no match');
    expect(w.lines[0]).toBe('No match: none of its tags is one the Garden wants (nature, decoration, curio) — it counts the least an item can.');
    expect(g.slotShare(garden.id, 1)!.prestige).toBeGreaterThan(0);
    expect(res.msg).toMatch(/ · why: no match with what the Garden wants$/);
    // a second item: neither carries the base any more (removing either keeps it)
    expect(g.slotWhy(garden.id, 0)!.lines.some(l => /only item/.test(l))).toBe(false);
    expect(w.own).toBe(1);
  });

  it('the neighbour bonus: named when the mate is next door, offered at the room level when it is not', () => {
    const g = rich();
    const [k1, d1] = cellPair(g);
    const kitchen = room(g, 'kitchen', 2, k1);
    room(g, 'dining-hall', 0, d1);
    const a = relic(g, [['food', 9]]);
    const res = g.setInRoom(kitchen.id, a.id);
    const w = g.slotWhy(kitchen.id, 0)!;
    expect(w.lines).toContain('The Dining hall next door makes every item here count 20% more.');
    expect(w.lines.length).toBe(4);                         // match · base · neighbour · fill
    expect(g.roomWhy(kitchen.id)).toContain('The Dining hall next door makes every item here count 20% more.');
    expect(res.msg).toMatch(/; the Dining hall next door adds 20%$/);

    const h = rich();
    const [k2, d2] = cellPair(h, true);
    const lone = room(h, 'kitchen', 2, k2);
    room(h, 'dining-hall', 0, d2);
    h.setInRoom(lone.id, relic(h, [['food', 9]]).id);
    expect(h.slotWhy(lone.id, 0)!.lines.some(l => /next door/.test(l))).toBe(false);
    expect(h.roomWhy(lone.id)).toContain('A Dining hall built next door would make every item here count 20% more.');
    // the bonus is real: the same item earns more beside its mate
    expect(g.prestige()).toBeGreaterThan(h.prestige());
  });

  it('roomWhy: the wants, the base and the ceiling — empty and filled; nothing for racks', () => {
    const g = rich();
    const garden = room(g, 'garden');
    expect(g.roomWhy(garden.id)).toEqual([
      'Wants: nature, decoration, curio — an item earns by its best matching tag; each rank higher counts double.',
      'Empty — the first item switches on a 1.0 ✦ base; each further item adds less, toward a 30 ✦ ceiling.',
    ]);
    g.setInRoom(garden.id, relic(g, [['nature', 5]]).id);
    expect(g.roomWhy(garden.id)[1]).toBe(`At ${g.prestige().toFixed(1)} of a 30 ✦ ceiling — the first item switched on a 1.0 ✦ base; each further item adds less.`);
    g.build('dungeon');
    const rack = room(g, 'torture-chamber', 1);
    expect(g.roomWhy(rack.id)).toEqual([]);
  });

  it('function rooms say the same match, and the fill in the room’s own effect words', () => {
    const g = rich();
    const inf = room(g, 'infirmary');
    const res = g.setInRoom(inf.id, relic(g, [['furniture', 6]]).id);
    const w = g.slotWhy(inf.id, 0)!;
    expect(w.fit).toBe('full');
    expect(w.lines[1]).toBe(`It is the room's only item, so it also switches the room's base on — without it, ${g.slotShare(inf.id, 0)!.effectAfter}.`);
    expect(w.lines.at(-1)).toMatch(/^Each further item adds less as the room fills — heals ×\d\.\d now, heals ×\d\.\d at best\.$/);
    expect(res.msg).toMatch(/, and it switched on the room's base$/);
    // the room's base shows in an infirmary (×1.0 → ×1.1), so the room line names it
    expect(g.roomWhy(inf.id)[1]).toMatch(/the first item switches its base on/);
  });

  it('an item that changes nothing yet says so — never a base the before → after shows did not happen', () => {
    // a soldier's bedroom: one low furniture item's comfort gives a cap under the bunk floor (6) — level cap 6 either way
    const g = rich();
    const merc = g.roster()[0]!;
    const bed = g.room(g.build('bedroom', merc.id).id!)!;
    expect(g.upgrade(bed.id).ok).toBe(true);
    const wants = g.effectiveWants(bed);
    const tag = wants[0]!.match;
    const res = g.setInRoom(bed.id, relic(g, [[tag, 1]]).id);
    expect(res.ok, res.msg).toBe(true);
    expect(res.msg).toMatch(/level cap 6 → level cap 6/);
    const w = g.slotWhy(bed.id, 0)!;
    expect(w.lines.some(l => /base/.test(l))).toBe(false);
    expect(w.lines[1]).toBe('It does not change the room yet — level cap 6 with or without it.');
    expect(res.msg).toMatch(/, not yet enough to change the room$/);
    expect(res.msg).not.toMatch(/switched on the room's base/);
    // the room line names no base either (its base, cap 3 + a little, sits under the bunk floor)
    expect(g.roomWhy(bed.id)[1]).not.toMatch(/base/);
  });

  it('the rule words are built from the engine constants (a tuned number re-words the line)', () => {
    const steps = BAND_SCORE.slice(1).map((v, i) => v / BAND_SCORE[i]!);
    if (steps.every(x => x === 2)) expect(RANK_RULE).toBe('each rank higher counts double');
    else expect(RANK_RULE).toMatch(/\d/);
    expect(GROUP_RULE).toBe(GROUP_FIT === 0.5 ? 'half an exact match' : `${Math.round(GROUP_FIT * 100)}% of an exact match`);
    expect(MATE_BONUS).toBe(`${Math.round((ADJACENCY_MULT - 1) * 100)}%`);
  });

  it('the build-list line under a room promises the same best the room’s why prints (read from the engine curve)', () => {
    const top = (infirmaryHealRate(typeBand('infirmary')[1]) / REST_HEAL_PER_CYCLE).toFixed(1);
    expect(roomDesc('infirmary')).toContain(`up to ${top} times as fast`);
    const g = rich();
    const inf = room(g, 'infirmary');
    g.setInRoom(inf.id, relic(g, [['furniture', 6]]).id);
    expect(g.roomWhy(inf.id)[1]).toContain(`at best heals ×${top}`);
  });

  it('fillDetail scores exactly as the §20 fill rule (the reason and the number are one read)', () => {
    // the rule as fort.ts read it before the reason existed: best exact band score, else half a group match, else 0.25
    const BAND = [1, 2, 4, 8];
    const rule = (tags: TagInstance[], wants: TagQuery[]) => {
      if (!wants.length) return 0.25;
      let best = 0, half = 0;
      for (const t of tags) {
        const c = CONCEPT[t.concept];
        if (!c || ['type', 'kind', 'gender', 'status'].includes(c.group)) continue;
        const s = BAND[bandOf(t.concept, t.tier ?? 1)]!;
        for (const w of wants) { if (t.concept === w.match) best = Math.max(best, s); else if (c.group === w.match) half = Math.max(half, s / 2) }
      }
      return Math.max(best, half, 0.25);
    };
    const words = CONCEPTS.map(c => c.id), groups = Object.keys(GROUPS);
    let seed = 7;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n };
    for (let i = 0; i < 400; i++) {
      const tags = Array.from({ length: 1 + rnd(5) }, () => { const w = words[rnd(words.length)]!; return T(w, 1 + rnd(20)) });
      const wants = Array.from({ length: rnd(4) }, () => ({ match: rnd(5) ? words[rnd(words.length)]! : groups[rnd(groups.length)]! }));
      const d = fillDetail(tags, wants);
      expect(d.score).toBe(rule(tags, wants));
      if (d.fit === 'full') expect(d.tag!.concept).toBe(d.want);
      if (d.fit === 'half') expect(CONCEPT[d.tag!.concept]!.group).toBe(d.want);
    }
  });
});

describe('the CLI prints the same why lines', () => {
  it('room view: the room’s half once at its head, each item’s own lines under its place; fit <relic> prints them whole', () => {
    const g = rich();
    const garden = room(g, 'garden');
    const a = relic(g, [['curio', 1]]), b = relic(g, [['clothes', 3]]);
    g.setInRoom(garden.id, a.id); g.setInRoom(garden.id, b.id);
    const out = render.roomDetail(g, garden.id).split('\n');
    const head = out.findIndex(l => l.startsWith('  comfort '));
    expect(out[head]).not.toMatch(/wants:/);                // the why line names the wants
    expect(out.slice(head + 1, head + 1 + g.roomWhy(garden.id).length)).toEqual(g.roomWhy(garden.id).map(l => `  ${l}`));
    for (const i of [0, 1]) {
      const at = out.findIndex(l => l.startsWith(`  place ${i}: `));
      const w = g.slotWhy(garden.id, i)!;
      expect(out.slice(at + 1, at + 1 + w.own)).toEqual(w.lines.slice(0, w.own).map(l => `      ${l}`));
    }
    const fit = render.fit(g, a.id).split('\n');
    expect(fit.slice(1, 1 + g.slotWhy(garden.id, 0)!.lines.length)).toEqual(g.slotWhy(garden.id, 0)!.lines.map(l => `  ${l}`));
  });
});
