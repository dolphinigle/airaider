// Saga theme seeds — docs/STORYTELLER.md §D (designer 2026-10-01): the plan call takes a DEALT seed
// from day one, chosen through ONE dealer function. Repetition is fixed later by editing
// data/themes.json (see data/THEMES.md) or this dealer — never by a prompt rule, never by a redesign.
// Pure: the caller passes the rng (storyRng in play) and the ids it has dealt so far.
//
// Phase 1: lab-only (scripts/sagalab/probe.ts). Nothing in the game calls this yet.

import type { Rng } from './rng.js';
import raw from './data/themes.json';

export type ThemeTone = 'strange' | 'tender' | 'grim' | 'political' | 'funny' | 'personal' | 'tense';
export type ThemeScale = 'family' | 'village' | 'town' | 'city' | 'region';
export interface Theme { id: string; theme: string; group: number; sub: string; tone: ThemeTone; scale: ThemeScale }
export interface DealtSeed { id: string; theme: string; tone: ThemeTone; scale: ThemeScale }

/** a theme never comes back within this many deals */
export const THEME_NO_REPEAT = 50;
/** how many of the latest deals make their tone and scale less likely next (a soft "not again so soon") */
const SOFT_RECENT = 3;
const SOFT_TONE = 0.35;
const SOFT_SCALE = 0.6;

/** a stable id from the theme's own words (FNV-1a), so pruning or reordering the library never
 *  re-points a remembered id at a different theme */
export function themeId(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return `th-${h.toString(36).padStart(7, '0')}`;
}

export const THEMES: readonly Theme[] = (raw as Omit<Theme, 'id'>[]).map(t => ({ ...t, id: themeId(t.theme) }));
const BY_ID = new Map(THEMES.map(t => [t.id, t]));

/** per-theme weights whose tone totals are all equal and whose scale totals are all equal (raking a
 *  tone factor × a scale factor). The library is uneven (family 28%, region 14%); balancing the
 *  margins rather than the 35 tone×scale cells keeps a small cell's few themes from being over-dealt. */
function balanced(items: readonly Theme[]): number[] {
  const cell = new Map<string, number>();
  for (const x of items) cell.set(`${x.tone}|${x.scale}`, (cell.get(`${x.tone}|${x.scale}`) ?? 0) + 1);
  const tones = [...new Set(items.map(t => t.tone))], scales = [...new Set(items.map(t => t.scale))];
  const n = (t: string, s: string) => cell.get(`${t}|${s}`) ?? 0;
  const a = new Map(tones.map(t => [t, 1])), b = new Map(scales.map(s => [s, 1]));
  for (let it = 0; it < 30; it++) {
    for (const t of tones) a.set(t, 1 / tones.length / scales.reduce((z, s) => z + n(t, s) * b.get(s)!, 0));
    for (const s of scales) b.set(s, 1 / scales.length / tones.reduce((z, t) => z + n(t, s) * a.get(t)!, 0));
  }
  return items.map(x => a.get(x.tone)! * b.get(x.scale)!);
}

/** Deal ONE theme. `recentIds` = the ids dealt so far, oldest first (only the last THEME_NO_REPEAT
 *  matter). Never repeats within that window; tones and scales come out evenly, and the tone and
 *  scale of the last few deals are less likely next. Does not touch `recentIds`. */
export function dealSeed(rng: Rng, recentIds: readonly string[]): DealtSeed {
  const window = new Set(recentIds.slice(-THEME_NO_REPEAT));
  let pool = THEMES.filter(t => !window.has(t.id));
  if (!pool.length) pool = THEMES.filter(t => t.id !== recentIds[recentIds.length - 1]);   // a library smaller than the window
  const latest = recentIds.slice(-SOFT_RECENT).map(id => BY_ID.get(id)).filter((t): t is Theme => !!t);
  const soft = (k: 'tone' | 'scale', v: string, f: number) => f ** latest.filter(t => t[k] === v).length;
  const toneF = new Map([...new Set(pool.map(t => t.tone))].map(v => [v, soft('tone', v, SOFT_TONE)]));
  const scaleF = new Map([...new Set(pool.map(t => t.scale))].map(v => [v, soft('scale', v, SOFT_SCALE)]));
  const w = balanced(pool).map((x, i) => x * toneF.get(pool[i]!.tone)! * scaleF.get(pool[i]!.scale)!);
  const t = rng.weighted(pool.map((x, i) => [x, w[i]!] as const));
  return { id: t.id, theme: t.theme, tone: t.tone, scale: t.scale };
}
