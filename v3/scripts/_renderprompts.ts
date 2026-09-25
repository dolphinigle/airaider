// Render FULL prompts (system + user, exactly as sent) for the context-free verifier gate:
// one scouting (lead-hunt) card and one personal-saga beat-1 card.
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
const OUT = process.env.OUT!;
const ai = makeOpenAiProvider();
const g = new Game(ai, 4040);
g.build('map-room'); g.build('lead-room');
g.state.leads.push({ id: 'rp-lh', rarity: 'common', level: 2, region: 'forests', archetype: 'lead-hunt',
  chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'hunt' });
await g.pursue('rp-lh');
const merc = g.roster()[0]!;
merc.character!.backstory = 'She left her brother at a river crossing the winter the ferry burned. She has never said why.';
g.ensureLoreNode(merc);
(g as unknown as { spawnPersonalChainLead(m: unknown): void }).spawnPersonalChainLead(merc);
await g.pursue(g.state.leads.find(l => l.source === 'personal')!.id);
const recs = ai.callLog().filter(r => r.purpose === 'writeQuest');
const scout = recs.find(r => r.systemPreview.includes('word gathers'));
const personal = recs.find(r => r.systemPreview.includes('rosterNames'));
for (const [k, r] of [['scout', scout], ['personal', personal]] as const)
  if (r) fs.writeFileSync(`${OUT}/verify-${k}.txt`, `=== SYSTEM MESSAGE ===\n${r.systemPreview}\n\n=== USER MESSAGE ===\n${r.userPrompt}`);
console.log('scout', !!scout, 'personal', !!personal);
