// SOLDIER PORTRAITS — painted once, after a soldier joins the roster, and cached per save.
// Cost rule (designer 2026-09-29): only the company's own soldiers get a portrait, and only
// after they join — never tavern candidates, captives or quest cast. gpt-image-1-mini at low
// quality is ~$0.003 a portrait. Off with AIRAIDER_PORTRAITS=0; only runs with the real AI.
// UI-only: the engine never reads a portrait, so the text UI loses nothing but the picture.

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Card } from '../src/engine/cards.js';
import { renderTags } from '../src/engine/tags.js';
import { loadKey } from '../src/ai/openai.js';

const STYLE = 'Full-length character card portrait, hand-inked illustration with bold black linework and a flat, '
  + 'limited palette (muted ochre, verdigris, oxblood, bone), like a dark-fantasy tarot card. Figure centred, '
  + 'standing, whole body visible, plain parchment background, no text, no border, no frame.';
const RACE: Record<string, string> = { lizardman: 'lizardfolk', wolfman: 'wolf-headed beastfolk', elf: 'elf', human: 'human' };
const MAX_AT_ONCE = 2;

export class Portraits {
  private painting = new Set<string>();
  private failures = new Map<string, number>();
  painted = 0;
  constructor(private dir: string, private enabled: boolean) {}

  private file(id: string) { return path.join(this.dir, `${id.replace(/[^\w-]/g, '_')}.webp`) }
  has(id: string) { return fs.existsSync(this.file(id)) }
  read(id: string): Buffer | null { return this.has(id) ? fs.readFileSync(this.file(id)) : null }
  isPainting(id: string) { return this.painting.has(id) }

  /** kick off paintings for soldiers who have none yet (non-blocking) */
  ensure(soldiers: Card[]) {
    if (!this.enabled) return;
    for (const c of soldiers) {
      if (this.painting.size >= MAX_AT_ONCE) return;
      if (this.has(c.id) || this.painting.has(c.id) || (this.failures.get(c.id) ?? 0) >= 2) continue;
      this.paint(c);
    }
  }

  private prompt(c: Card): string {
    const words = renderTags(c.tags).split('; ').map(t => t.replace(/ \((low|mid|high|legendary)\)$/, ''));
    const race = words.map(w => RACE[w]).find(Boolean) ?? 'human';
    const sex = words.includes('female') ? 'female' : words.includes('male') ? 'male' : '';
    const rest = words.filter(w => !RACE[w] && w !== 'female' && w !== 'male' && !w.startsWith('type:')).slice(0, 8);
    const who = c.character?.who ? ` ${c.character.who}` : '';
    return `A ${sex} ${race} mercenary.${who} Traits: ${rest.join(', ')}. ${STYLE}`.replace(/\s+/g, ' ');
  }

  private async paint(c: Card) {
    this.painting.add(c.id);
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${loadKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-image-1-mini', prompt: this.prompt(c), size: '1024x1536', quality: 'low',
          output_format: 'webp', output_compression: 70, n: 1 }),
      });
      const j = await r.json() as { data?: { b64_json: string }[]; error?: { message: string } };
      if (!j.data?.[0]) throw new Error(j.error?.message ?? `HTTP ${r.status}`);
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(this.file(c.id), Buffer.from(j.data[0].b64_json, 'base64'));
      this.painted++;
    } catch (e) {
      this.failures.set(c.id, (this.failures.get(c.id) ?? 0) + 1);
      console.log(`[portraits] ${c.name}: ${(e as Error).message?.slice(0, 160)}`);
    } finally {
      this.painting.delete(c.id);
    }
  }
}
