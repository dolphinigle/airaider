// SAGA LAB (docs/STORYTELLER.md §5.0) — lab-only engine pieces: the fixture's pins and the
// outcome rules a lab run forces. Pure; nothing here runs in play. A game only ever meets these
// through the CLI's hidden `lab saga` command and the AIRAIDER_FORCE_OUTCOMES flag.

import type { ChainKind, Rarity } from './economy.js';
import { PARTIAL_FRAC, type Outcome, type QuestRollResult } from './roll.js';

/** the five path types of §5.0. Rules are on the pinned N, because the failure budget
 *  max(2, ceil(N/2)) breaks fixed sequences. */
export type LabPath = 'clean' | 'bumpy' | 'failing' | 'lastchance' | 'personal';
export const LAB_PATHS: readonly LabPath[] = ['clean', 'bumpy', 'failing', 'lastchance', 'personal'];
/** the smallest N each path's rule can run on */
export const LAB_MIN_N: Record<LabPath, number> = { clean: 2, bumpy: 3, failing: 3, lastchance: 2, personal: 3 };

/** a lab fixture: what one saga pins so two arms can later be matched. `seed` is the game seed the
 *  driver starts the CLI with; everything not pinned here rolls from the game as it always does. */
export interface LabFixture {
  id: string;
  set?: string;
  seed: number;
  path: LabPath;
  spark: string;
  /** the saga's central person as a card spec — built from its OWN seed, so the same person comes
   *  back whatever state the game is in. A personal fixture makes them one of the company's soldiers. */
  focal: {
    name: string; sex: 'male' | 'female'; race: string; seed: number;
    value?: number; tags?: string[];
    /** a company soldier's past (personal fixtures) — set on the card, so the flesh pass leaves it */
    who?: string; backstory?: string;
  };
  N: number;
  kind: ChainKind;
  personal: boolean;
  twist: boolean;
  level?: number;
  rarity?: Rarity;
  region?: string;
  /** driver-side: which finale plan to choose (default: the kind's) */
  approach?: 'recruit' | 'captive' | 'gold';
  /** descriptive only — the genre this fixture's spark was picked for (§2.4.1 coverage) */
  shape?: string;
  note?: string;
}

/** what a chain remembers of its fixture: the path and every forced roll so far */
export interface ChainLab {
  fixture: string;
  path: LabPath;
  N: number;
  log: { job: number; finale: boolean; outcome: Outcome }[];
}

/** the fixture's shape errors, empty when it can be played */
export function labFixtureProblems(fx: Partial<LabFixture>): string[] {
  const out: string[] = [];
  if (!fx.id) out.push('id missing');
  if (typeof fx.seed !== 'number') out.push('seed missing');
  if (!fx.path || !LAB_PATHS.includes(fx.path)) out.push(`path must be one of ${LAB_PATHS.join('/')}`);
  if (!fx.spark) out.push('spark missing');
  if (!fx.focal?.name || !fx.focal.sex || !fx.focal.race || typeof fx.focal.seed !== 'number') out.push('focal needs name, sex, race, seed');
  if (typeof fx.N !== 'number' || fx.N < 2 || fx.N > 6) out.push('N must be 2–6');
  else if (fx.path && LAB_PATHS.includes(fx.path) && fx.N < LAB_MIN_N[fx.path]) out.push(`path ${fx.path} needs N ≥ ${LAB_MIN_N[fx.path]}`);
  if (!fx.kind || !['recruit', 'captive', 'gold-hoard'].includes(fx.kind)) out.push('kind must be recruit/captive/gold-hoard');
  if (typeof fx.personal !== 'boolean') out.push('personal must be true/false');
  if (typeof fx.twist !== 'boolean') out.push('twist must be true/false');
  if (fx.personal && fx.path !== 'personal') out.push('a personal fixture plays the personal path');
  return out;
}

/** §5.0's path rules. `job` = the saga step this attempt is on (1-based), `tryOnJob` = which try
 *  at that step, `attempt` = which non-finale attempt of the saga (both 1-based). */
export function labOutcome(path: LabPath, a: { isFinale: boolean; job: number; tryOnJob: number; attempt: number }): Outcome {
  switch (path) {
    case 'clean': return 'success';
    case 'bumpy':
      if (a.isFinale) return 'partial';
      if (a.job === 2) return a.tryOnJob === 1 ? 'failure' : 'partial';
      return 'success';
    case 'failing':   // alternate F and S until the showdown, however reached; finale F (slip)
      if (a.isFinale) return 'failure';
      return a.attempt % 2 === 1 ? 'failure' : 'success';
    case 'lastchance':   // F every attempt until the last-chance showdown; finale S
      return a.isFinale ? 'success' : 'failure';
    case 'personal':   // S, P, then S; finale S
      if (a.isFinale) return 'success';
      return a.attempt === 2 ? 'partial' : 'success';
  }
}

/** the next forced outcome for a chain's quest, from what its lab log already holds */
export function nextLabOutcome(lab: ChainLab, isFinale: boolean, job: number): Outcome {
  const done = lab.log.filter(e => !e.finale);
  return labOutcome(lab.path, {
    isFinale, job,
    tryOnJob: done.filter(e => e.job === job).length + 1,
    attempt: done.length + 1,
  });
}

/** the roll bent to `outcome`, with the heads moved just far enough that the ⚄ line agrees:
 *  the rolled heads when they already fit, else the nearest count that does. A count the party
 *  could not physically flip raises the coin total with it ("12 heads of 9 coins" never prints).
 *  A partial band too narrow to hold a whole head (a one-place finale's bar of 1.75 wants heads in
 *  [1.05, 1.75)) widens the ROLL's bar just enough to hold one — the quest's own test is untouched,
 *  and the ⚄ line still reads true ("2 heads vs bar 2.3, partial from 1.4"). */
export function forceRoll(rolled: QuestRollResult, outcome: Outcome): QuestRollResult {
  const need = (x: number) => Math.max(0, Math.ceil(x - 1e-9));
  const bar = need(rolled.totalBar), partialAt = need(PARTIAL_FRAC * rolled.totalBar);
  const [lo, hi] = outcome === 'success' ? [bar, Infinity]
    : outcome === 'partial' ? [partialAt, bar - 1]
    : [0, partialAt - 1];
  if (hi < lo && outcome === 'partial') {
    const heads = Math.max(1, partialAt);
    return { ...rolled, outcome, heads, totalCoins: Math.max(rolled.totalCoins, heads), totalBar: heads + 0.25 };
  }
  const heads = hi < lo ? rolled.heads : Math.min(hi, Math.max(lo, rolled.heads));
  return { ...rolled, outcome, heads, totalCoins: Math.max(rolled.totalCoins, heads) };
}
