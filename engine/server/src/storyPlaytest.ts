// Stage E playtest: exercise the lean LLM with a variety of leads + parties,
// print the narration to stdout. Used to verify the prose is concrete + fun.
//
// Run with: cd engine/server && OPENAI_API_KEY=... npx tsx src/storyPlaytest.ts

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { LeanOpenAIScenarioLLM } from './leanLlm.js';
import { resolveScenario } from '../../../prototype/src/resolver.js';
import { templateFor } from '../../../prototype/src/scenarioTemplates.js';
import { rngFromString } from '../../../prototype/src/rng.js';
import type { Lead } from '../../../prototype/src/leads.js';
import type { Merc, Tag } from '../../../prototype/src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('storyPlaytest needs OPENAI_API_KEY in .env');
  process.exit(1);
}

const llm = new LeanOpenAIScenarioLLM({ apiKey, model: 'gpt-4.1-nano' });

const TAGS: Record<string, Tag> = {
  cautious: { id: 'temp:cautious', label: 'cautious', category: 'temperament', rarity: 'common', tier: 1 },
  muscular: { id: 'phys:muscular', label: 'muscular', category: 'physique', rarity: 'common', tier: 1 },
  quick: { id: 'phys:quick', label: 'quick', category: 'physique', rarity: 'common', tier: 1 },
  silvertongue: { id: 'pers:silver-tongue', label: 'silver-tongued', category: 'personality', rarity: 'uncommon', tier: 2 },
  scarred: { id: 'phys:scarred', label: 'scarred', category: 'physique', rarity: 'common', tier: 1 },
  brave: { id: 'temp:brave', label: 'brave', category: 'temperament', rarity: 'common', tier: 1 },
  stoic: { id: 'pers:stoic', label: 'stoic', category: 'personality', rarity: 'common', tier: 1 },
  scholar: { id: 'bg:scholar', label: 'former scholar', category: 'background', rarity: 'uncommon', tier: 2 },
};

function merc(id: string, name: string, attrs: Partial<Merc['attrs']>, tagIds: string[], backstory?: string): Merc {
  return {
    id,
    name,
    attrs: { physical: 2, agility: 2, intelligence: 2, charisma: 2, willpower: 2, ...attrs },
    tags: tagIds.map((k) => TAGS[k]!).filter(Boolean),
    veterancy: 0,
    wage: 1,
    hp: 3,
    backstory,
  };
}

const veska = merc('veska', 'Veska', { physical: 4, willpower: 3 }, ['scarred', 'brave'], 'left a smithy in Greythorn after her brother died at the bellows');
const marek = merc('marek', 'Marek', { agility: 4, intelligence: 3 }, ['cautious', 'quick'], 'used to run salt in the marsh; still flinches at lanterns');
const ilse = merc('ilse', 'Ilse', { charisma: 4, intelligence: 3 }, ['silvertongue', 'stoic'], 'broker\'s clerk turned debt-collector');
const drust = merc('drust', 'Drust', { physical: 5, willpower: 4 }, ['muscular', 'brave', 'scarred'], 'fought in the border wars; deserted after the third winter');
const henna = merc('henna', 'Henna', { intelligence: 5, willpower: 3 }, ['scholar', 'stoic'], 'forged charter-letters in Crow\'s Ford for two seasons');

const LEADS: Lead[] = [
  { id: 'L-raid-1', rarity: 'common', archetype: 'raid', region: 'Eastfen', dc: 2, rewardGold: 12, pursueCost: 0, postedDay: 0, expiryDay: 5, blurb: 'a tax-cart limps home with thin escort' },
  { id: 'L-recovery-1', rarity: 'uncommon', archetype: 'recovery', region: 'Greythorn', dc: 3, rewardGold: 18, pursueCost: 0, postedDay: 0, expiryDay: 5, blurb: 'the abbey wants its reliquary back from the wolves that took it' },
  { id: 'L-captive-1', rarity: 'rare', archetype: 'captive', region: 'Saltmire', dc: 4, rewardGold: 24, pursueCost: 0, postedDay: 0, expiryDay: 5, blurb: 'a deserter is hiding in the marsh fen — alive he is worth more than dead' },
  { id: 'L-heist-1', rarity: 'uncommon', archetype: 'heist', region: 'Blackmoor', dc: 3, rewardGold: 20, pursueCost: 0, postedDay: 0, expiryDay: 5, blurb: 'a chapel\'s silver was never quite consecrated' },
  { id: 'L-contract-1', rarity: 'legendary', archetype: 'contract', region: 'Ironvale', dc: 5, rewardGold: 60, pursueCost: 0, postedDay: 0, expiryDay: 5, blurb: 'a magistrate quietly seeks unsworn hands for a delicate job' },
];

const PARTIES: Record<string, Merc[]> = {
  raid: [veska, marek],
  recovery: [henna, drust],
  captive: [drust, marek],
  heist: [marek, ilse],
  contract: [ilse, henna],
};

async function main() {
  for (const lead of LEADS) {
    const scenario = templateFor(lead);
    const party = PARTIES[lead.archetype]!;
    const assignments = party.slice(0, scenario.slots.length).map((m, i) => ({
      merc: m,
      slotId: scenario.slots[i]!.id,
    }));
    console.log(`\n=========================`);
    console.log(`LEAD: ${lead.archetype}/${lead.rarity} @ ${lead.region}`);
    console.log(`BLURB: "${lead.blurb}"`);
    console.log(`PARTY: ${party.map((p) => p.name).join(', ')}`);
    try {
      const rng = rngFromString(`playtest-${lead.id}`);
      const res = await resolveScenario({
        scenario,
        assignments,
        llm,
        rng,
        leadHook: {
          blurb: lead.blurb,
          archetype: lead.archetype,
          region: lead.region,
          rarity: lead.rarity,
        },
      });
      console.log(`BAND: ${res.band}`);
      console.log(`NARRATIVE: ${res.outcomeNarrative}`);
    } catch (err: any) {
      console.error(`✗ ${err?.message ?? String(err)}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
