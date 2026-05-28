// Roster persistence — the small bit of state that survives across days.
//
// CANONICAL §state: a roster is the fort's living crew plus runtime state.
// For the prototype we persist: merc identities (refs to data/mercs.json by
// id PLUS any generated/recruited mercs in full), per-merc fatigue and hp,
// veterancy, captives currently held, gold, reputation counters, and day#.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { z } from 'zod';
import type { Merc, Tag } from './types.js';
import type { Captive, CaptiveEffect } from './captive.js';

const AttrBlockSchema = z.object({
  physical: z.number().int().min(1).max(7),
  agility: z.number().int().min(1).max(7),
  intelligence: z.number().int().min(1).max(7),
  charisma: z.number().int().min(1).max(7),
  willpower: z.number().int().min(1).max(7),
});

const MercStateSchema = z.object({
  id: z.string(),
  fatigue: z.number().int().min(0).default(0),
  hpDamage: z.number().int().min(0).default(0),
  veterancyGain: z.number().int().min(0).default(0),
});

const GeneratedMercSchema = z.object({
  id: z.string(),
  name: z.string(),
  attrs: AttrBlockSchema,
  tagIds: z.array(z.string()),
  veterancy: z.number().int().min(0).max(5).default(0),
  wage: z.number().int().min(0).default(1),
  hp: z.number().int().min(0).max(3).default(3),
});

const CaptiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: z.string(),
  backstory: z.string(),
  notoriety: z.number().int().min(1).max(5),
  tagIds: z.array(z.string()),
});

const DeceasedSchema = z.object({
  id: z.string(),
  name: z.string(),
  dayDied: z.number().int().min(0),
  reason: z.string(),
});

const RoasterSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]).default(2),
  dayCount: z.number().int().min(0).default(0),
  gold: z.number().int().default(0),
  reputation: z.record(z.string(), z.number().int()).default({}),
  /** Mercs by id reference data/mercs.json. */
  rosterMercIds: z.array(z.string()).default([]),
  /** Procedurally-generated or recruited mercs persisted in full. */
  generatedMercs: z.array(GeneratedMercSchema).default([]),
  mercStates: z.array(MercStateSchema).default([]),
  captives: z.array(CaptiveSchema).default([]),
  /** M5.1: mercs who have died permanently. v2+. */
  deceased: z.array(DeceasedSchema).default([]),
});

export type RosterMercState = z.infer<typeof MercStateSchema>;
export type RosterDeceased = z.infer<typeof DeceasedSchema>;
export type RosterFile = z.infer<typeof RoasterSchema>;

export interface Roster {
  schemaVersion: 2;
  dayCount: number;
  gold: number;
  reputation: Record<string, number>;
  /** All mercs currently in the fort, resolved with their Tag[] objects. */
  mercs: Merc[];
  /** Runtime per-merc state keyed by merc id. */
  states: Map<string, RosterMercState>;
  captives: Captive[];
  /** M5.1: permadeath log. */
  deceased: RosterDeceased[];
}

export function newRoster(initialMercs: Merc[]): Roster {
  return {
    schemaVersion: 2,
    dayCount: 0,
    gold: 0,
    reputation: {},
    mercs: initialMercs,
    states: new Map(initialMercs.map((m) => [m.id, { id: m.id, fatigue: 0, hpDamage: 0, veterancyGain: 0 }])),
    captives: [],
    deceased: [],
  };
}

export function loadRoster(
  path: string,
  basePool: Map<string, Merc>,
  tagPool: Map<string, Tag>,
): Roster {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const parsed = RoasterSchema.parse(raw);

  const mercs: Merc[] = [];
  for (const id of parsed.rosterMercIds) {
    const m = basePool.get(id);
    if (!m) throw new Error(`roster: unknown base merc id ${id}`);
    mercs.push(m);
  }
  for (const g of parsed.generatedMercs) {
    const tags = g.tagIds.map((tid) => {
      const t = tagPool.get(tid);
      if (!t) throw new Error(`roster: unknown tag id ${tid} in generated merc ${g.id}`);
      return t;
    });
    mercs.push({
      id: g.id,
      name: g.name,
      attrs: g.attrs as import('./types.js').AttributeBlock,
      tags,
      veterancy: g.veterancy,
      wage: g.wage,
      hp: g.hp,
    });
  }
  const states = new Map<string, RosterMercState>(
    parsed.mercStates.map((s) => [s.id, s]),
  );
  for (const m of mercs) {
    if (!states.has(m.id)) states.set(m.id, { id: m.id, fatigue: 0, hpDamage: 0, veterancyGain: 0 });
  }
  const captives: Captive[] = parsed.captives.map((c) => ({
    id: c.id,
    name: c.name,
    archetype: c.archetype,
    backstory: c.backstory,
    notoriety: c.notoriety,
    tags: c.tagIds.map((tid) => {
      const t = tagPool.get(tid);
      if (!t) throw new Error(`roster: unknown tag id ${tid} in captive ${c.id}`);
      return t;
    }),
  }));

  return {
    schemaVersion: 2,
    dayCount: parsed.dayCount,
    gold: parsed.gold,
    reputation: parsed.reputation,
    mercs,
    states,
    captives,
    deceased: parsed.deceased,
  };
}

export function saveRoster(
  path: string,
  roster: Roster,
  basePool: Map<string, Merc>,
): void {
  const baseIds = new Set(basePool.keys());
  const rosterMercIds: string[] = [];
  const generatedMercs: z.infer<typeof GeneratedMercSchema>[] = [];
  for (const m of roster.mercs) {
    if (baseIds.has(m.id) && basePool.get(m.id) === m) {
      rosterMercIds.push(m.id);
    } else {
      generatedMercs.push({
        id: m.id,
        name: m.name,
        attrs: m.attrs,
        tagIds: m.tags.map((t) => t.id),
        veterancy: m.veterancy,
        wage: m.wage,
        hp: m.hp,
      });
    }
  }
  const file: RosterFile = {
    schemaVersion: 2,
    dayCount: roster.dayCount,
    gold: roster.gold,
    reputation: roster.reputation,
    rosterMercIds,
    generatedMercs,
    mercStates: [...roster.states.values()],
    captives: roster.captives.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      backstory: c.backstory,
      notoriety: c.notoriety,
      tagIds: c.tags.map((t) => t.id),
    })),
    deceased: roster.deceased,
  };
  writeFileSync(path, JSON.stringify(file, null, 2) + '\n', 'utf8');
}

/** Apply a captive disposition's CaptiveEffect to a roster, mutating it. */
export function applyCaptiveEffect(
  roster: Roster,
  captive: Captive,
  effect: CaptiveEffect,
): void {
  roster.gold += effect.goldDelta;
  roster.reputation[effect.reputationGain] = (roster.reputation[effect.reputationGain] ?? 0) + 1;
  if (effect.captiveRemoved) {
    roster.captives = roster.captives.filter((c) => c.id !== captive.id);
  }
  if (effect.recruitedAs) {
    roster.mercs.push(effect.recruitedAs);
    roster.states.set(effect.recruitedAs.id, {
      id: effect.recruitedAs.id, fatigue: 0, hpDamage: 0, veterancyGain: 0,
    });
    roster.captives = roster.captives.filter((c) => c.id !== captive.id);
  }
}

/**
 * M5.1: apply a list of casualties to the roster, mutating it.
 * Returns the ids of mercs killed (permadeath) by this batch.
 * A merc dies when hpDamage >= hp; they are moved from `mercs` into `deceased`
 * and their state record is dropped.
 */
export function applyCasualties(
  roster: Roster,
  casualties: Array<{ mercId: string; damage: number; reason: string }>,
): string[] {
  const killed: string[] = [];
  for (const c of casualties) {
    const merc = roster.mercs.find((m) => m.id === c.mercId);
    if (!merc) continue;
    const state =
      roster.states.get(c.mercId) ??
      { id: c.mercId, fatigue: 0, hpDamage: 0, veterancyGain: 0 };
    state.hpDamage += c.damage;
    roster.states.set(c.mercId, state);
    if (state.hpDamage >= merc.hp) {
      roster.deceased.push({
        id: merc.id,
        name: merc.name,
        dayDied: roster.dayCount,
        reason: c.reason,
      });
      roster.mercs = roster.mercs.filter((m) => m.id !== merc.id);
      roster.states.delete(merc.id);
      killed.push(merc.id);
    }
  }
  return killed;
}

/** Convenience: 'has this roster been saved before?' */
export function rosterExists(path: string): boolean {
  return existsSync(path);
}
