import { readFileSync } from 'node:fs';
import { z } from 'zod';

const AttrEnum = z.enum(['physical', 'agility', 'intelligence', 'charisma', 'willpower']);

const ApproachSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** One-sentence pitch shown to the player and the LLM. */
  summary: z.string().min(1),
  /** Per-slot tweaks applied when this approach is chosen. */
  slotModifiers: z.record(
    z.string(),
    z.object({
      coinDelta: z.number().int().optional(),
      /** If set, the assigned merc must carry this tag id or the slot loses 1 coin. */
      requireTag: z.string().optional(),
    }),
  ).optional(),
  /** Stylistic hint passed to the LLM (kept short). */
  narrativeHint: z.string().optional(),
});

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
  /** M5.3: 2-3 player-selectable approaches that re-shape the slot economy. */
  approaches: z.array(ApproachSchema).optional(),
  /** Default approach id (used if --approach not supplied). */
  defaultApproachId: z.string().optional(),
});

export type FixtureScenario = z.infer<typeof ScenarioSchema>;
export type ScenarioApproach = z.infer<typeof ApproachSchema>;

export function loadScenario(path: string): FixtureScenario {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return ScenarioSchema.parse(raw);
}
