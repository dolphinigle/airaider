// PROTO-GAME: Scenario templates used to materialize a Lead → FixtureScenario.
// Kept intentionally small for the prototype: one slot-pair per archetype.
// All archetypes map to the existing 'contract' FixtureScenario archetype
// because that's the type the day-resolver knows how to run.

import type { FixtureScenario } from './scenarios.js';
import type { Lead, LeadArchetype } from './leads.js';

interface SlotTemplate {
  id: string;
  description: string;
  preferredAttr?: 'physical' | 'agility' | 'intelligence' | 'charisma' | 'willpower';
  preferredTags?: string[];
}

const SLOTS_BY_ARCHETYPE: Record<LeadArchetype, SlotTemplate[]> = {
  raid: [
    { id: 'breach',  description: 'force the door and lead the first rush', preferredAttr: 'physical', preferredTags: ['phys:muscular'] },
    { id: 'flank',   description: 'circle wide and cut off the line of retreat', preferredAttr: 'agility', preferredTags: ['phys:quick'] },
  ],
  recovery: [
    { id: 'track',   description: 'read the trail and find where the thing was taken', preferredAttr: 'intelligence', preferredTags: ['bg:scholar'] },
    { id: 'recover', description: 'carry the thing back out without dropping it', preferredAttr: 'physical', preferredTags: ['phys:muscular'] },
  ],
  contract: [
    { id: 'parley',  description: 'work the contact and learn what the contract really asks', preferredAttr: 'charisma', preferredTags: ['pers:silver-tongue'] },
    { id: 'enforce', description: 'be the body in the room that makes the deal hold', preferredAttr: 'willpower', preferredTags: ['temp:brave'] },
  ],
  heist: [
    { id: 'lockwork', description: 'defeat the lock and the trap behind it', preferredAttr: 'agility', preferredTags: ['phys:quick'] },
    { id: 'lookout',  description: 'mark the rounds and signal when to move', preferredAttr: 'intelligence', preferredTags: ['pers:stoic'] },
  ],
};

const TITLE_BY_ARCHETYPE: Record<LeadArchetype, string> = {
  raid: 'Raid',
  recovery: 'Recovery',
  contract: 'Contract',
  heist: 'Heist',
};

const TARGET_BY_ARCHETYPE: Record<LeadArchetype, (region: string) => string> = {
  raid: (region) => `strike the target near ${region} and take the field`,
  recovery: (region) => `bring back what was lost outside ${region}`,
  contract: (region) => `fulfil the patron's quiet request in ${region}`,
  heist: (region) => `lift the prize from the holding at ${region} without a trace`,
};

/** Convert a Lead into a FixtureScenario the day-loop can run. */
export function templateFor(lead: Lead): FixtureScenario {
  const slots = SLOTS_BY_ARCHETYPE[lead.archetype];
  // DC 1..5 → coinBudget 3..7
  const coinBudget = Math.min(7, Math.max(3, 2 + lead.dc));
  return {
    id: `scenario-from-${lead.id}`,
    archetype: 'contract', // mapped — keeps resolver happy
    title: `${TITLE_BY_ARCHETYPE[lead.archetype]} at ${lead.region}`,
    target: TARGET_BY_ARCHETYPE[lead.archetype](lead.region),
    slots,
    partySize: { min: slots.length, max: slots.length },
    coinBudget,
    seed: `scenario-${lead.id}`,
    // No assignments[] — the cliGame deploy-picker will fill them.
    // No factionContext / approaches / seasonModifier in MVP.
  };
}
