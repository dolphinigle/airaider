// Apply save migrations to a save file in place (a running server holds its own copy in memory,
// so stop the server before running this). Usage: npx tsx scripts/_migrate_save.ts saves/web.json
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
const path = process.argv[2] ?? 'saves/web.json';
const before = JSON.parse(fs.readFileSync(path, 'utf8'));
const g = Game.load(new MockProvider(1), fs.readFileSync(path, 'utf8'));
fs.writeFileSync(path, g.save());
const b = (before.leads ?? []).map((l: any) => `${l.id}:${l.archetype}`).join(' ');
const a = (g.state.leads ?? []).map(l => `${l.id}:${l.archetype}`).join(' ');
console.log('before:', b);
console.log('after :', a);
console.log(b === a ? 'no change' : 'MIGRATED');
