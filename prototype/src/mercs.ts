import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Merc, Tag, AttributeBlock } from './types.js';

const MercSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  attrs: z.object({
    physical: z.number().int().min(1).max(7),
    agility: z.number().int().min(1).max(7),
    intelligence: z.number().int().min(1).max(7),
    charisma: z.number().int().min(1).max(7),
    willpower: z.number().int().min(1).max(7),
  }),
  tagIds: z.array(z.string()).min(0),
  veterancy: z.number().int().min(0).max(5).default(0),
  wage: z.number().int().min(0).default(1),
  hp: z.number().int().min(0).max(3).default(3),
  backstory: z.string().optional(),
});

export function loadMercs(path: string, tagPool: Map<string, Tag>): Map<string, Merc> {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const arr = z.array(MercSchema).parse(raw);
  const m = new Map<string, Merc>();
  for (const r of arr) {
    if (m.has(r.id)) throw new Error(`Duplicate merc id: ${r.id}`);
    const tags = r.tagIds.map((id) => {
      const t = tagPool.get(id);
      if (!t) throw new Error(`Merc ${r.id} references unknown tag: ${id}`);
      return t;
    });
    enforceMutex(r.id, tags);
    m.set(r.id, {
      id: r.id,
      name: r.name,
      attrs: r.attrs as AttributeBlock,
      tags,
      veterancy: r.veterancy,
      wage: r.wage,
      hp: r.hp,
      backstory: r.backstory,
    });
  }
  return m;
}

function enforceMutex(mercId: string, tags: Tag[]): void {
  const groups = new Map<string, string>();
  for (const t of tags) {
    if (!t.mutexGroup) continue;
    const prev = groups.get(t.mutexGroup);
    if (prev) {
      throw new Error(
        `Merc ${mercId}: tags ${prev} and ${t.id} both in mutex group ${t.mutexGroup}`,
      );
    }
    groups.set(t.mutexGroup, t.id);
  }
}
