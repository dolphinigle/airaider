// SOLDIER PORTRAITS — painted once, after a soldier joins the roster, and cached per save.
// Cost rule (designer 2026-09-29): only the company's own soldiers get a portrait, and only
// after they join — never tavern candidates, captives or quest cast. Off with AIRAIDER_PORTRAITS=0;
// only runs with the real AI. UI-only: the engine never reads a portrait.
// Style (designer 2026-09-30: "use the art style from ../mahjong … still EXTREMELY cheap … hotter
// if appropriate"): mahjong's reference recipe (docs/research/art-pipeline.md there — refined anime,
// flat two-tone cel shading, chest-up bust, transparent ground), on gpt-image-2.5-sunburst at LOW
// quality: ~158 output tokens ≈ half a US cent a portrait. Measured 2026-09-30 against
// gpt-image-1-mini low (408 tokens, far worse) and gpt-image-2 low (same price, more painterly).

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Card } from '../src/engine/cards.js';
import { renderTags } from '../src/engine/tags.js';
import { loadKey } from '../src/ai/openai.js';

const MODEL = process.env.AIRAIDER_PORTRAIT_MODEL || 'gpt-image-2.5-sunburst';
/** bump when the style changes — older portraits are simply repainted */
const STYLE_VERSION = 'v2';
const MAX_AT_ONCE = 2;
const STYLE = 'Illustrated character portrait in a refined anime style, the look of a modern fantasy visual novel: clean '
  + 'confident linework, flat cel shading in two tones with a soft highlight, stylised rather than realistic — simplified '
  + 'anime facial features with a small nose, a soft jaw and refined expressive eyes drawn in anime style — a calm '
  + 'sophisticated palette. Three-quarter bust, chest-up crop, the whole head and hair inside the frame with a little '
  + 'space above. No props, no weapons, no objects in hand, no text, no logos. Tasteful and fully clothed.';
const RACE: Record<string, string> = {
  elf: 'elf, with long elegant pointed ears', human: 'human',
  lizardman: 'lizardfolk — a reptilian humanoid with a sleek snout, fine scales and striking eyes',
  wolfman: 'wolfkin — a wolf-headed humanoid with a thick mane and bright eyes',
};
// one canonical attribute per slot (mahjong's template); the traits pick it, the model draws it
const BODY: [string, string, string][] = [   // tag, female, male
  ['muscular', 'a strong, toned athletic figure', 'a powerful, well-muscled build'],
  ['scrawny', 'a slim, wiry figure', 'a lean, wiry build'],
  ['tough', 'a sturdy, athletic figure', 'a broad, sturdy build'],
  ['sickly', 'a slight, delicate figure', 'a slight, pale build'],
  ['endowed', 'a full, softly curved figure', 'a broad-chested build'],
  ['flat', 'a slender, willowy figure', 'a slender build'],
  ['nimble', 'a lithe, graceful figure', 'a lithe, agile build'],
];
const LOOK: [string, string, string][] = [
  ['beautiful', 'strikingly beautiful', 'strikingly handsome'],
  ['ugly', 'rugged and weathered, a scar across one cheek, magnetic all the same', 'rugged and weathered, a scar across one cheek, magnetic all the same'],
];
const MOOD: Record<string, string> = {
  playful: 'a playful sidelong smile', serious: 'a composed, serious look', hotheaded: 'a fiery, intense stare',
  cool: 'cool, unbothered calm', gregarious: 'a warm, open grin', shy: 'a shy, soft glance', submissive: 'a quiet, deferential gaze',
  calculating: 'a knowing, calculating half-smile', instinctive: 'alert, wild-eyed focus', generous: 'a kind, easy smile',
  greedy: 'a sly, hungry smirk', brave: 'a bold, steady gaze', cowardly: 'a wary, darting glance', cruel: 'a cold, cutting smile',
  kind: 'a gentle smile', proud: 'a proud, lifted chin', humble: 'a modest, soft smile', lustful: 'a slow, smouldering look',
  chaste: 'a reserved, calm look', honest: 'an open, direct gaze', deceitful: 'a charming smile that hides something',
};
const GARB: [string, string][] = [
  ['magic', 'layered mage robes with arcane embroidery'], ['heal', "a healer's fitted robes with a sash"],
  ['roguery', 'dark fitted leathers with a high collar'], ['ranged', "a hooded ranger's cloak over leathers"],
  ['hunter', "a hunter's wrap tunic and leather bracers"], ['melee', 'practical light armour of leather and steel'],
  ['intimidation', 'a battered brigandine with spiked pauldrons'], ['lore', "a scholar's long coat over mail"],
  ['social', 'fine tailored clothes with a silk scarf'], ['performance', "a performer's bright, flattering outfit"],
  ['craft', 'a leather work apron over a rolled-sleeve shirt'], ['nature', 'earthy layered cloth and a leaf-green mantle'],
  ['noble', 'fine tailored clothes with a silk scarf'], ['peasant', 'simple homespun clothes, neatly patched'],
];

export class Portraits {
  private painting = new Set<string>();
  private failures = new Map<string, number>();
  painted = 0;
  constructor(private dir: string, private enabled: boolean) {}

  private file(id: string) { return path.join(this.dir, `${id.replace(/[^\w-]/g, '_')}.${STYLE_VERSION}.webp`) }
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
    const has = (w: string) => words.some(x => x === w || x.startsWith(w + '-'));
    const race = Object.keys(RACE).find(r => has(r)) ?? 'human';
    const fem = has('female');
    const pick = (rows: [string, string, string][], dflt: [string, string]) =>
      (r => r ? (fem ? r[1] : r[2]) : (fem ? dflt[0] : dflt[1]))(rows.find(r => has(r[0])));
    const look = pick(LOOK, ['very attractive', 'very attractive']);
    const body = pick(BODY, ['a slim, softly curved athletic figure', 'a lean, athletic build']);
    const mood = words.map(w => MOOD[w]).find(Boolean) ?? 'a confident, easy look';
    const garb = GARB.find(g => has(g[0]))?.[1] ?? "practical, well-fitted adventurer's clothing";
    const who = c.character?.who ? ` Who they are: ${c.character.who}` : '';
    return [STYLE, `${c.name}, a ${fem ? 'female' : 'male'} ${RACE[race]}, a mercenary in their twenties, ${look}.`,
      `Expression: ${mood}.`, `Body: ${body}.`, `Clothing: ${garb}.`,
      'Pose: three-quarter view, chin level, turned slightly toward the viewer.',
      'Lighting: warm soft key light from the front left, a gentle rim light on the hair.' + who,
      'Isolated figure on a transparent background.'].join(' ');
  }

  private async paint(c: Card) {
    this.painting.add(c.id);
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${loadKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, prompt: this.prompt(c), size: '1024x1536', quality: 'low', background: 'transparent',
          output_format: 'webp', output_compression: 80, n: 1 }),
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
