import { readFileSync } from 'node:fs';
import { z } from 'zod';

const AttrEnum = z.enum(['physical', 'agility', 'intelligence', 'charisma', 'willpower']);

const ScenarioSchema = z.object({
  id: z.string().min(1),
  archetype: z.enum(['contract', 'recruit', 'captive', 'build', 'tavern']),
  title: z.string().min(1),
  target: z.string().min(1),
  slots: z.array(z.object({
    id: z.string().min(1),
    description: z.string().min(1),
    preferredAttr: AttrEnum.optional(),
    preferredTags: z.array(z.string()).optional(),
  })).min(1),
  partySize: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  }),
  coinBudget: z.number().int().min(1).max(7),
  /** Slot→merc assignments. In M0 the fixture provides these explicitly. */
  assignments: z.array(z.object({
    slotId: z.string().min(1),
    mercId: z.string().min(1),
  })).optional(),
  /** Seed for the Sultan-coin RNG; defaults to id. */
  seed: z.string().optional(),
});

export type FixtureScenario = z.infer<typeof ScenarioSchema>;

export function loadScenario(path: string): FixtureScenario {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return ScenarioSchema.parse(raw);
}
