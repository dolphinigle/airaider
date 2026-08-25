// throwaway: lint every want/tell in MOTIVES2 as if it were card text
import { lintCard } from './cardlint.js';
import { MOTIVES2 } from './motives2.js';
const input: any = { kind: 'one-off', location: '', level: 1, rarity: 'common', slotCount: 1, rewardEnvelope: '' };
let flags = 0, bad = 0;
for (const m of MOTIVES2) for (const [field, text] of [['want', m.want], ['tell', m.tell]] as const) {
  const f = lintCard(text, input, 'rite');
  if (f.length) { flags += f.length; bad++; console.log(`${field}: ${text}\n   -> ${f.map(x => x.code + (x.detail ? `(${x.detail})` : '')).join(', ')}`); }
}
console.log(`pool=${MOTIVES2.length} strings=${MOTIVES2.length * 2} flaggedStrings=${bad} totalFlags=${flags}`);
// duplicate + near-duplicate tells
const seen = new Map<string, number>();
for (const m of MOTIVES2) seen.set(m.tell, (seen.get(m.tell) ?? 0) + 1);
const dups = [...seen].filter(([, n]) => n > 1);
console.log('exact dup tells:', dups.length, dups.map(d => d[0]));
const dupw = new Map<string, number>();
for (const m of MOTIVES2) dupw.set(m.want, (dupw.get(m.want) ?? 0) + 1);
console.log('exact dup wants:', [...dupw].filter(([, n]) => n > 1).map(d => d[0]));
