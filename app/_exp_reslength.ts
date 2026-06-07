// RESOLUTION-LENGTH experiment. Hand-built job cards (a common one-off vs a saga finale) narrated at
// several candidate word budgets, real AI, with actual word counts — so we READ and pick the balance
// per (position × rarity). Budgets are passed straight to ai.outcome (the new beforeWords/afterWords).
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const wc = (s: string) => strip(s).trim().split(/\s+/).filter(Boolean).length;
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'reslen' });

const ONEOFF = {
  situation: 'A grain factor at the Saltgate posts a bounty: marsh-raiders have been bleeding his barge convoys at the Tallow Cut. He wants them scattered before the next moon-tide.',
  job: 'Ambush the marsh-raiders at the Tallow Cut and break their hold on the convoy route.',
  party: [{ name: 'Marek of Saltreach', tags: ['soldier', 'scarred', 'weapon'] }, { name: 'Sigrun Edda', tags: ['hunter', 'stealth', 'clever'] }],
};
const FINALE = {
  situation: "After dark at the Breakwater, Trak-Ith stands with the recovered logbook as Kellan Moor's men close in and the magistrate demands the deed be recorded. Everything the company bled for these past weeks comes down to this landing.",
  job: 'Force the reckoning at the Breakwater and settle the fate of Trak-Ith and the ferry once and for all.',
  party: [{ name: 'Marek of Saltreach', tags: ['soldier', 'scarred', 'weapon'] }, { name: 'Sigrun Edda', tags: ['hunter', 'stealth', 'clever'] }],
  approach: 'win them over — persuade them to join the company',
  finale: true as const,
};

async function shot(label: string, card: any, outcome: 'success' | 'partial', before: string, after: string) {
  const o = await eng.ai.outcome({ ...card, outcome, captiveTags: card.finale ? ['soldier', 'weapon'] : undefined, risky: true, beforeWords: before, afterWords: after });
  console.log(`\n### ${label}  [budget before=${before} after=${after}] outcome=${outcome}`);
  console.log(`  BEFORE (${wc(o.beforeRoll)}w): ${strip(o.beforeRoll)}`);
  console.log(`  AFTER  (${wc(o.afterRoll)}w): ${strip(o.afterRoll)}`);
}

// one-off: sweep short→medium
await shot('ONE-OFF common', ONEOFF, 'success', '22-34', '40-60');
await shot('ONE-OFF common', ONEOFF, 'success', '30-45', '55-80');
// finale: sweep medium→long→xlong
await shot('FINALE (common-ish)', FINALE, 'success', '40-60', '90-120');
await shot('FINALE (rare-ish)', FINALE, 'success', '50-72', '120-160');
await shot('FINALE (legendary)', FINALE, 'success', '60-85', '150-200');
// a partial finale at the long budget (does the cost-beat sustain the length?)
await shot('FINALE partial (rare-ish)', FINALE, 'partial', '50-72', '120-160');
