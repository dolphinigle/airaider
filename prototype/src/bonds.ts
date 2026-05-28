// M6.2 — co-deployment relationship bonds.
//
// Every time two mercs deploy together (same scenario or same errand party)
// we increment a shared co-deployment counter on each side. When both sides
// have ≥ BOND_THRESHOLD shared deployments a bond is considered formed; in
// scenario resolution a bonded pair counts as a synergy pair (caps still
// apply via SYNERGY_CAP in the resolver).

import type { Roster } from './roster.js';

export const BOND_THRESHOLD = 3;
export const BOND_TAG_ID = 'bond:trusts';

export interface BondFormation {
  mercA: string;
  mercB: string;
  /** Day on which the bond crossed the threshold (1-based, derived from roster.dayCount). */
  onDay: number;
}

/** Sorted pair key, stable across argument order. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Increment co-deployment counters for every pair in `mercIds`. Returns the
 * pairs that crossed the BOND_THRESHOLD as a result of this call (one-shot
 * per pair). Skips mercs missing from the roster (just-died safety).
 */
export function recordCoDeployment(
  roster: Roster,
  mercIds: readonly string[],
): BondFormation[] {
  const formed: BondFormation[] = [];
  const present = mercIds.filter((id) => roster.states.has(id));
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i]!;
      const b = present[j]!;
      const sa = roster.states.get(a)!;
      const sb = roster.states.get(b)!;
      const beforeA = sa.coDeployments[b] ?? 0;
      const beforeB = sb.coDeployments[a] ?? 0;
      const afterA = beforeA + 1;
      const afterB = beforeB + 1;
      sa.coDeployments[b] = afterA;
      sb.coDeployments[a] = afterB;
      const wasBonded = beforeA >= BOND_THRESHOLD && beforeB >= BOND_THRESHOLD;
      const isBonded = afterA >= BOND_THRESHOLD && afterB >= BOND_THRESHOLD;
      if (!wasBonded && isBonded) {
        const [m1, m2] = a < b ? [a, b] : [b, a];
        formed.push({ mercA: m1, mercB: m2, onDay: roster.dayCount + 1 });
      }
    }
  }
  return formed;
}

/**
 * Returns the set of currently-bonded pair keys for the roster — used by the
 * resolver to inject bond synergy entries without mutating merc tag lists.
 */
export function bondedPairsOf(roster: Roster): Set<string> {
  const set = new Set<string>();
  for (const [id, state] of roster.states) {
    for (const [other, count] of Object.entries(state.coDeployments)) {
      if (count < BOND_THRESHOLD) continue;
      const otherState = roster.states.get(other);
      if (!otherState) continue;
      if ((otherState.coDeployments[id] ?? 0) < BOND_THRESHOLD) continue;
      set.add(pairKey(id, other));
    }
  }
  return set;
}

/**
 * M9.7 — bond grief. For every merc in `killedIds`, find their surviving
 * bond-partners (per `bondsBefore`, a Set of pairKeys captured BEFORE
 * applyCasualties stripped the deceased states) and add `griefAmount`
 * fatigue to each survivor. Returns the per-survivor delta records so
 * callers can render a grief block.
 *
 * Multiple bond losses stack additively on the same survivor. The
 * survivor's fatigue is the only field mutated; no caps applied here.
 */
export const BOND_GRIEF_FATIGUE = 2;

/** M9.8: number of days after a bond loss during which the survivor still
 *  carries a `recentlyLostBondPartner` flavor hint to the scenario LLM. */
export const BOND_GRIEF_HINT_WINDOW_DAYS = 7;

export function applyBondGrief(
  roster: Roster,
  killedIds: Iterable<string>,
  bondsBefore: Set<string>,
  griefAmount: number = BOND_GRIEF_FATIGUE,
): Array<{ survivorId: string; deceasedId: string; before: number; after: number }> {
  const out: Array<{ survivorId: string; deceasedId: string; before: number; after: number }> = [];
  const killSet = new Set(killedIds);
  // M9.8: build an id->name map so we can stamp the deceased's NAME on the
  // survivor for the scenario-narrator hint. The deceased has been moved
  // to roster.deceased by applyCasualties before this runs.
  const nameOf = (id: string): string | undefined => {
    const d = roster.deceased.find((x) => x.id === id);
    return d?.name;
  };
  for (const deadId of killSet) {
    for (const key of bondsBefore) {
      const [a, b] = key.split('|');
      if (!a || !b) continue;
      let other: string | null = null;
      if (a === deadId) other = b;
      else if (b === deadId) other = a;
      if (!other) continue;
      if (killSet.has(other)) continue;
      if (!roster.mercs.find((m) => m.id === other)) continue;
      const st = roster.states.get(other);
      if (!st) continue;
      const before = st.fatigue;
      st.fatigue = before + griefAmount;
      // M9.8: stamp survivor with grief hint (most recent only; if they were
      // already grieving someone else this day, overwrite with the latest).
      const deceasedName = nameOf(deadId) ?? deadId;
      st.recentGriefPartner = deceasedName;
      st.recentGriefDay = roster.dayCount;
      out.push({ survivorId: other, deceasedId: deadId, before, after: st.fatigue });
    }
  }
  return out;
}

/**
 * M9.8: clear stale grief hints whose `recentGriefDay` is older than
 * `BOND_GRIEF_HINT_WINDOW_DAYS` relative to `currentDay`. Call this at
 * end-of-day after dayCount has been advanced.
 */
export function pruneStaleGriefHints(roster: Roster, currentDay: number, windowDays: number = BOND_GRIEF_HINT_WINDOW_DAYS): number {
  let cleared = 0;
  for (const st of roster.states.values()) {
    if (st.recentGriefDay === undefined) continue;
    if (currentDay - st.recentGriefDay > windowDays) {
      delete st.recentGriefDay;
      delete st.recentGriefPartner;
      cleared++;
    }
  }
  return cleared;
}
