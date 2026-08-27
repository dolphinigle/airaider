// The Card — CARDS.md / §7.1: THREE types, `type` is a tag. Uniform rule:
// every card = tags + value(mark) + location. Only characters grow; stackables
// are MINTED (fixed tags + qty); cards never attach to cards.

import { type TagInstance, type Attribute, hasTag, tierOf } from './tags.js';

export type CharRole = 'merc' | 'captive' | 'npc';

/** where a card is (GAME_STATE §1): a CardSlot reference or a holding state */
export type Location =
  | { kind: 'room'; roomId: string; slot: number }
  | { kind: 'quest'; questId: string; slot: number }
  | { kind: 'held'; state: 'roster' | 'inventory' | 'staged' | 'limbo' | 'lore' };

export const HELD = (state: 'roster' | 'inventory' | 'staged' | 'limbo' | 'lore'): Location =>
  ({ kind: 'held', state });

export interface AttrVector { str: number; dex: number; int: number; cha: number; con: number }

export type Focus = { kind: 'none' } | { kind: 'single'; attr: Attribute } | { kind: 'dual'; a: Attribute; b: Attribute };

export interface CharacterData {
  role: CharRole;
  level: number;
  xp: number;
  /** BANKED attribute values (past growth sticks — §10; grown on level-up, never recomputed) */
  attrs: AttrVector;
  /** natural growth lean: fixed-sum-5 share vector (reshaped by focus for FUTURE levels) */
  growthLean: AttrVector;
  focus: Focus;
  injuryTiers: number;      // §11 — intrinsic state, NOT a tag (GAME_STATE §1)
  who?: string;             // AI-written one-liner
  backstory?: string;
  quirks?: string[];
  /** the job this person came out of, kept so their story can be written to FIT it. The resolver
   *  normally writes them at delivery; this is what the fallback flesh pass has to work from when
   *  it doesn't (2026-08-27: without it a rescued shrine novice was given a courtesan's past). */
  origin?: { title: string; situation: string; job: string };
}

export interface Card {
  id: string;
  name: string;
  tags: TagInstance[];
  /** MARKED value (§2.5): the generation target, not Σ tags */
  value: number;
  location: Location;
  chainIds: string[];
  character?: CharacterData; // present iff type:character
  qty?: number;              // present iff type:stackable
  story?: string;            // relics: AI flavor (what exactly it is)
}

export function cardType(c: Card): 'character' | 'relic' | 'stackable' {
  if (hasTag(c.tags, 'character')) return 'character';
  if (hasTag(c.tags, 'relic')) return 'relic';
  return 'stackable';
}

export function stackKind(c: Card): string | null {
  for (const k of ['gold', 'debt', 'evidence', 'mess']) if (hasTag(c.tags, k)) return k;
  return null;
}

/** stacks merge iff tag-sets match (§7.1) */
export function sameStack(a: Card, b: Card): boolean {
  if (cardType(a) !== 'stackable' || cardType(b) !== 'stackable') return false;
  const key = (c: Card) => c.tags.map(t => `${t.concept}:${t.tier ?? ''}`).sort().join('|');
  return key(a) === key(b);
}

/** a card's worth: singulars = the mark; stackables = qty × unit value */
export function cardWorth(c: Card): number {
  return cardType(c) === 'stackable' ? (c.qty ?? 0) * c.value : c.value;
}

export function isLiability(c: Card): boolean {
  const k = stackKind(c);
  return k === 'debt' || k === 'evidence' || k === 'mess';
}

let nextId = 1;
export function freshId(prefix: string): string { return `${prefix}${nextId++}` }
export function seedIdCounter(n: number): void { nextId = n }
export function idCounter(): number { return nextId }

export function mintStackable(kind: 'gold' | 'debt' | 'evidence' | 'mess', qty: number, unitValue = 1): Card {
  return {
    id: freshId('s'), name: kind, qty,
    tags: [{ concept: 'stackable' }, { concept: kind }],
    value: kind === 'gold' ? unitValue : -Math.abs(unitValue),
    location: HELD('inventory'), chainIds: [],
  };
}

export function attrOf(c: Card, a: Attribute): number {
  return c.character?.attrs[a] ?? 0;
}

export function levelOf(c: Card): number { return c.character?.level ?? 0 }

/** body/injury summary line for UI */
export function statusOf(c: Card): string {
  const ch = c.character;
  if (!ch) return '';
  const parts: string[] = [];
  if (ch.injuryTiers > 0) parts.push(`injured ${ch.injuryTiers}`);
  if (hasTag(c.tags, 'obedient')) parts.push('obedient');
  return parts.join(', ');
}

export { hasTag, tierOf };
