import { ARCHETYPE_NAMES, glossOf, profileOf, slotRangeOf } from '../src/engine/archetypes.js';
for (const a of ARCHETYPE_NAMES)
  console.log(`${a.padEnd(13)} ${profileOf(a).padEnd(8)} ${JSON.stringify(slotRangeOf(a)).padEnd(7)} ${glossOf(a)}`);
console.log(`\n${ARCHETYPE_NAMES.length} archetypes`);
