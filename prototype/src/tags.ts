import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Tag } from './types.js';

const TagSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  tier: z.union([
    z.literal(5), z.literal(4), z.literal(3), z.literal(2), z.literal(1),
  ]),
  mutexGroup: z.string().optional(),
  attrBias: z.record(z.string(), z.number()).optional(),
  label: z.string().min(1),
});

export function loadTags(path: string): Map<string, Tag> {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const arr = z.array(TagSchema).parse(raw);
  const m = new Map<string, Tag>();
  for (const t of arr) {
    if (m.has(t.id)) throw new Error(`Duplicate tag id: ${t.id}`);
    m.set(t.id, t as Tag);
  }
  return m;
}
