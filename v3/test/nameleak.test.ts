// Names reach the writer only once the player may know them (STORYTELLER §2.5): 20 mock sagas on real game worlds. No
// unmet name in a plan or a card payload; no soldier's name on a card but the personal saga's own; a person whose name
// the player has read with their label never gets the full label again (label once).
import { describe, it, expect } from 'vitest';
import { seedIdCounter } from '../src/engine/cards.js';
import type { LabPath } from '../src/engine/lab.js';
import { an } from '../src/engine/plainwords.js';
import { headNoun } from '../src/ai/storyteller.js';
import { newGame, sagaChain, playSaga } from './sagaharness.js';

const nameParts = (n: string) => n.split(/\s+/).filter(x => x.length > 2 && /^\p{Lu}/u.test(x));
const says = (text: string, name: string) => nameParts(name).some(p => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
const PATHS: LabPath[] = ['clean', 'bumpy', 'lastchance', 'failing'];

describe('name leaks — 20 seeds', () => {
  for (let seed = 1; seed <= 20; seed++) it(`seed ${seed}`, async () => {
    seedIdCounter(1);
    const personal = seed % 3 === 0;
    const N = 3 + (seed % 4);
    const { g, ai } = newGame(seed * 101);
    const { chain, focal } = sagaChain(g, { N, personal });
    const before: { met: Set<string>; named: Set<string> }[] = [];
    await playSaga(g, chain, personal ? 'personal' : PATHS[seed % PATHS.length]!, focal, () => {
      const k = chain.saga!.knowing;
      before.push({ met: new Set(k.met), named: new Set(k.named) });
    });
    const plan = chain.saga!.plan!;
    const cast = chain.saga!.world.cast;
    // the plan sees only the names of the known
    const planUser = JSON.stringify(ai.calls.find(c => c.template === 'plan')!.payload);
    for (const p of cast) if (!p.known) expect(says(planUser, p.name), `plan names ${p.name}`).toBe(false);
    const cards = ai.calls.filter(c => c.template === 'card');
    expect(cards).toHaveLength(before.length);
    const soldiers = g.roster().filter(m => !(personal && m.id === focal.id));
    cards.forEach((c, i) => {
      const user = JSON.stringify(c.payload);
      const k = before[i]!;
      // nobody unmet is named on a card
      for (const p of cast) if (!k.met.has(p.id)) expect(says(user, p.name), `card ${i + 1} names unmet ${p.name}`).toBe(false);
      // no soldier of the company is named on a card, but a personal saga's own
      for (const m of soldiers) expect(says(user, m.name), `card ${i + 1} names soldier ${m.name}`).toBe(false);
      // label once: a person already read by name and label is dealt the name — at most with its role word where the
      // dealt text calls them by it ("a merchant") — never introduced again
      for (const e of (c.payload.names ?? []) as { name?: string; label?: string; intro?: boolean }[]) {
        const p = plan.cast.find(x => x.name === e.name);
        if (!p || p.seat === 'soldier' || !k.named.has(p.id)) continue;
        expect(e.intro, `card ${i + 1}: ${p.name} introduced twice`).toBeUndefined();
        if (e.label !== undefined) expect(e.label, `card ${i + 1}: ${p.name} keeps more than the role word`).toBe(an(headNoun(p.label)));
      }
    });
  });
});
