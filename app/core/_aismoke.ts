// Real-AI smoke test of the Narrator against the LOCKED vocab. Hits the network.
// Run: npm run aismoke   (needs OPENAI_API_KEY in ../.env or env)
import { readFileSync } from 'node:fs';
import { makeNarrator } from './ai.js';

function loadKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
    const m = env.match(/OPENAI_API_KEY=(.+)/);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  throw new Error('no OPENAI_API_KEY');
}

const log = (s: string) => console.log(s);
const n = await makeNarrator({ provider: 'openai', apiKey: loadKey(), log });
console.log('narrator:', n.kind, '\n');

console.log('— cardAsk (capture/2)');
const ca = await n.cardAsk({ archetype: 'capture', location: 'the Saltreach fens', slotCount: 2, rewardSeed: 'a sullen poacher taken alive' });
console.log(JSON.stringify(ca, null, 2), '\n');

console.log('— conceptTags');
const ct = await n.conceptTags({ concept: 'a captured knight, proud and scarred' });
console.log(JSON.stringify(ct, null, 2), '\n');

console.log('— flesh');
const fl = await n.flesh({ tags: ['Soldier', 'Brave', 'Scarred', 'Male', 'Human'], attrs: { physical: 7, agility: 4, intelligence: 3, charisma: 4, willpower: 5 }, context: 'taken captive in a fen raid' });
console.log(JSON.stringify(fl, null, 2), '\n');

console.log('— outcome (partial)');
const oc = await n.outcome({
  situation: ca.situation, job: ca.job,
  party: [{ name: 'Marek of Saltreach', tags: ['Soldier', 'Brave', 'Scarred'] }, { name: 'Ivo Wulfson', tags: ['Hunter', 'Stealthy'] }],
  outcome: 'partial', captiveTags: ['Cruel', 'Scarred'], risky: true,
});
console.log(JSON.stringify(oc, null, 2), '\n');

console.log('— genesis');
const gen = await n.genesis({ focalTags: [['Female', 'Noble', 'Proud', 'Frail']], region: 'the river marches of Kovar' });
console.log(JSON.stringify(gen, null, 2), '\n');

console.log('— chainBeat (beat 1)');
const cb = await n.chainBeat({ bible: gen.bible, chainState: 'Beat 1: nothing known yet.', region: 'the river marches of Kovar', slotCount: 2, beatConstraint: 'Write beat 1 (the deniable opener)' });
console.log(JSON.stringify(cb, null, 2), '\n');

console.log('✓ smoke complete');
