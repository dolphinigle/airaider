import { sampleKeywords, sampleKeywordsLight } from '../src/ai/keywords.js';
import { Rng } from '../src/engine/rng.js';
const r = new Rng(5);
const heavy: string[] = [], light: string[] = [];
for (let i = 0; i < 3; i++) heavy.push(sampleKeywords(r).join(' · '));
for (let i = 0; i < 5; i++) light.push(sampleKeywordsLight(r).join(','));
console.log(`${(process.env.KW ?? 'base').padEnd(9)} heavy: ${heavy[0]}`);
console.log(`${''.padEnd(9)} light: ${light.join(' | ')}`);
