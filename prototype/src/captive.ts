// Captive disposition cycle (CANONICAL §captive-cycle).
//
// After a captive-archetype scenario resolves favorably, the player owns a
// captive and must choose ONE disposition. Each action has a different
// engine effect AND a different narrative tone — this module proves the
// LLM can render distinct grimdark consequences for the same input.

import type { Merc, Tag } from './types.js';

export type CaptiveAction = 'ransom' | 'sell' | 'display' | 'recruit' | 'execute';

export const CAPTIVE_ACTIONS: readonly CaptiveAction[] = [
  'ransom', 'sell', 'display', 'recruit', 'execute',
];

export interface Captive {
  id: string;
  name: string;
  /** What sort of captive this is — narrative hook, not an engine type. */
  archetype: string;
  /** Free-text background; the LLM will weave it into the disposition. */
  backstory: string;
  /** Optional tags carried by the captive (used if recruited). */
  tags: Tag[];
  /** A simple 1..5 "how feared / valuable" indicator. */
  notoriety: number;
  /** Notoriety at capture time. Used as an anchor for room-effect caps
   *  (e.g. interrogation can only multiply by a fixed factor). Optional
   *  for back-compat with pre-Stage-C saves. */
  baseNotoriety?: number;
  /** Days the captive has spent in their CURRENT cell. Resets to 0 when
   *  moved. Drives per-day room effects (interrogation tenderise,
   *  pike-display decay). */
  daysInRoom?: number;
  /** PROTO-GAME v14: which dungeon-category cell the captive is held in.
   *  Optional — fresh captures arrive unassigned; player assigns from the
   *  captives menu. Adjacency effects depend on this. */
  cellIdx?: number;
}

/** Engine-side effects of a disposition — concrete, no narration. */
export interface CaptiveEffect {
  action: CaptiveAction;
  /** Gold delta (positive = paid to player, negative = costs player). */
  goldDelta: number;
  /** Reputation tag the fort earns. */
  reputationGain: 'merciful' | 'mercenary' | 'feared' | 'just' | 'ruthless';
  /** If true, the captive is consumed (no longer in roster / world). */
  captiveRemoved: boolean;
  /** If set, the captive joins the player roster as a fresh merc (loyalty 0).
   *  M11.2: when accompanied by `benchPrice`, the captive is dropped onto
   *  the tavern bench at that discount price instead of straight into the
   *  active roster — the player still has to pay to hire them. */
  recruitedAs?: Merc;
  /** M11.2: discount price at which `recruitedAs` is posted to the hire
   *  bench. Always present when `recruitedAs` is, set by `effectOf`. */
  benchPrice?: number;
  /**
   * M7.3: when set, the disposition is unavailable in the current fort
   * context (e.g. recruit blocked because fort level is too low). The
   * effect's other fields are zeroed out / suppressed and the LLM gets a
   * "blocked" hint so the narrator can render the refusal in flavor.
   */
  blocked?: { reason: string };
}

/** M7.3: minimum fort level required to take on a captive as a recruit. */
export const RECRUIT_MIN_FORT_LEVEL = 2;

/** M11.6: canonical tag id appended to a captive who gets recruited; lives in
 *  data/tags.json so it survives a roster round-trip via the tag pool. */
export const FORMER_CAPTIVE_TAG_ID = 'bg:former-captive';

/** M11.2: discount price (gold) at which a recruited captive is posted to the
 *  tavern bench. Scales with notoriety but consistently undercuts the standard
 *  HIRE_BASE_PRICE (5g) for low-notoriety captives. */
export function captiveBenchPrice(notoriety: number): number {
  return Math.max(1, notoriety + 1);
}

export interface EffectContext {
  /** When provided AND action='recruit', a fortLevel below the minimum
   *  blocks the recruit and the captive remains. */
  fortLevel?: number;
  /** M11.6: when provided AND action='recruit', this tag is appended to
   *  the recruit's tag list so the captive's backstory carries into
   *  future scenarios as the `bg:former-captive` (or similar) tag. */
  formerCaptiveTag?: Tag;
  /** PROTO-GAME v14: when true (captive cell is adjacent to a chapel), the
   *  recruit disposition posts the captive at a free bench price (0g) and
   *  bypasses the fort-level gate. Models a "converted by the chapel"
   *  narrative. */
  chapelAdjacent?: boolean;
  /** PROTO-GAME v14: when true (captive cell is adjacent to a smithy), the
   *  ransom disposition is enriched (+5g flat) — the smith forges chains
   *  ornate enough to extract a higher ransom from the family. */
  smithyAdjacent?: boolean;
}

export function effectOf(
  captive: Captive,
  action: CaptiveAction,
  ctx: EffectContext = {},
): CaptiveEffect {
  const notor = captive.notoriety;
  switch (action) {
    case 'ransom':
      return {
        action,
        // PROTO-GAME v14: smithy-adjacent captive ransoms for +5g (ornate chains).
        goldDelta: 10 + notor * 5 + (ctx.smithyAdjacent ? 5 : 0),
        reputationGain: 'mercenary',
        captiveRemoved: true,
      };
    case 'sell':
      return {
        action,
        goldDelta: 6 + notor * 2,
        reputationGain: 'ruthless',
        captiveRemoved: true,
      };
    case 'display':
      return {
        action,
        goldDelta: 0,
        reputationGain: 'feared',
        captiveRemoved: true,
      };
    case 'recruit':
      // PROTO-GAME v14: chapel-adjacent captives are "converted" — they
      // bypass the fort-level gate AND post to the bench for free.
      if (!ctx.chapelAdjacent && ctx.fortLevel !== undefined && ctx.fortLevel < RECRUIT_MIN_FORT_LEVEL) {
        return {
          action,
          goldDelta: 0,
          reputationGain: 'mercenary',
          captiveRemoved: false,
          blocked: {
            reason: `fort level ${ctx.fortLevel} below required ${RECRUIT_MIN_FORT_LEVEL} for recruit (build a Chapel adjacent to bypass)`,
          },
        };
      }
      return {
        action,
        goldDelta: 0,
        reputationGain: 'mercenary',
        captiveRemoved: false,
        recruitedAs: captiveToMerc(captive, ctx.formerCaptiveTag),
        benchPrice: ctx.chapelAdjacent ? 0 : captiveBenchPrice(captive.notoriety),
      };
    case 'execute':
      return {
        action,
        goldDelta: 0,
        reputationGain: 'just',
        captiveRemoved: true,
      };
  }
}

function captiveToMerc(c: Captive, formerCaptiveTag?: Tag): Merc {
  // M11.6: append `bg:former-captive` (or whatever tag the caller supplied)
  // so the captive's prior life carries into LLM scenario prompts. Deduped
  // by tag id to keep the tag list canonical.
  const tagIds = new Set(c.tags.map((t) => t.id));
  const tags = [...c.tags];
  if (formerCaptiveTag && !tagIds.has(formerCaptiveTag.id)) {
    tags.push(formerCaptiveTag);
  }
  return {
    id: `recruit-${c.id}`,
    name: c.name,
    attrs: {
      physical: 3, agility: 3, intelligence: 3, charisma: 2, willpower: 2,
    },
    tags,
    veterancy: 0,
    wage: 1,
    hp: 3,
  };
}
