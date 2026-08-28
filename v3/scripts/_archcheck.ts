import { ARCHETYPE_NAMES, profileOf, boardPool } from '../src/engine/archetypes.js';
import collections from 'node:util';
const byP: Record<string, string[]> = {};
for (const a of ARCHETYPE_NAMES) (byP[profileOf(a)] ??= []).push(a);
for (const [p, xs] of Object.entries(byP)) console.log(`${p.padEnd(8)} ${xs.length}  ${xs.join(', ')}`);
console.log(`\ntotal ${ARCHETYPE_NAMES.length}`);
console.log(`board pool without a dungeon: ${boardPool({ hasDungeon: false }).length}`);
console.log(`board pool with a dungeon:    ${boardPool({ hasDungeon: true }).length}`);
