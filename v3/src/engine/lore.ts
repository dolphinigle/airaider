// Lore — LORE.md / §14. LoreNode + memory-EDGES; salience decay with CORE pinning;
// SOFT-DELETE only; the engine renders dossiers/blurbs from edges (the AI never writes
// a dossier directly). Retrieval = deterministic ranked recall (+ optional AI selector).

export type EdgeType =
  | 'rival-of' | 'scarred-by' | 'bonded-by' | 'owes' | 'saved-by' | 'kin-of'
  | 'betrayed-by' | 'served-with' | 'born-in' | 'member-of' | 'captive-of'
  | 'loves' | 'fears' | 'defeated' | 'freed-by' | 'party-to';

export const EDGE_TYPES: EdgeType[] = [
  'rival-of', 'scarred-by', 'bonded-by', 'owes', 'saved-by', 'kin-of',
  'betrayed-by', 'served-with', 'born-in', 'member-of', 'captive-of',
  'loves', 'fears', 'defeated', 'freed-by', 'party-to',
];

export type NodeKind = 'character' | 'relic' | 'place' | 'faction' | 'saga';

export interface LoreNode {
  id: string;               // characters/relics share the Card id (one object, one id)
  kind: NodeKind;
  name: string;
  blurb: string;            // ≤~25 tokens, stable, prompt-cacheable
  identity: string;         // stable identity line (race/background/origin) — dossier base
  active: boolean;
  createdCycle: number;
}

export interface RelEdge {
  id: string;
  from: string;             // the state-holder (the betrayed, the debtor, the rescued)
  to: string;
  type: EdgeType;
  salience: number;         // 0..1 at lastCycle
  core: boolean;            // AI-flagged importance ≥ ~0.8 → PINNED, never decays
  active: boolean;          // soft-delete: inactive = hidden from AI, player-readable
  lastCycle: number;
  blurb: string;            // one-liner ("deserted his unit at the ford")
  sourceChainId?: string;
}

export const DECAY = 0.97;
export const SALIENCE_FLOOR = 0.12;   // below → flip inactive (GC-to-inactive, never delete)
export const CORE_IMPORTANCE = 0.8;
export const CANDIDATE_CAP = 14;
export const DOSSIER_TOP_K = 6;

export interface LoreGraph {
  nodes: Record<string, LoreNode>;
  edges: RelEdge[];
}

export function newGraph(): LoreGraph { return { nodes: {}, edges: [] } }

export function effectiveSalience(e: RelEdge, cycle: number): number {
  if (e.core) return e.salience;      // pinned — never decays
  return e.salience * Math.pow(DECAY, Math.max(0, cycle - e.lastCycle));
}

/** per-cycle pass: decay bookkeeping + GC-to-inactive (soft-delete only) */
export function decayPass(g: LoreGraph, cycle: number): void {
  for (const e of g.edges) {
    if (!e.active || e.core) continue;
    if (effectiveSalience(e, cycle) < SALIENCE_FLOOR) e.active = false;
  }
}

/** supersession: a new status edge (captive-of → freed-by) deactivates the superseded one */
const SUPERSEDES: Partial<Record<EdgeType, EdgeType[]>> = {
  'freed-by': ['captive-of'],
};
export function addEdge(g: LoreGraph, e: RelEdge): void {
  const sup = SUPERSEDES[e.type];
  if (sup) {
    for (const old of g.edges) {
      if (old.active && old.from === e.from && sup.includes(old.type)) old.active = false;
    }
  }
  g.edges.push(e);
}

/** touch: an edge referenced again refreshes (re-anchors decay) */
export function touchEdge(e: RelEdge, cycle: number, bump = 0): void {
  e.salience = Math.min(1, effectiveSalience(e, cycle) + bump);
  e.lastCycle = cycle;
}

// ---- recall (engine, deterministic, zero tokens — LORE §3.1) ------------------------------

export interface Candidate {
  node: LoreNode;
  relationPhrase: string;    // "kin-of focal; deserted" — lets the selector judge from blurbs
  score: number;
}

/** candidates = the focal's edge-neighbors ranked by salience (1–2 hops, no recursion) + wildcards */
export function recall(g: LoreGraph, focalId: string, cycle: number, wildcardIds: string[] = []): Candidate[] {
  const seen = new Map<string, Candidate>();
  const neighbors = (id: string, hopPenalty: number) => {
    const out: { other: string; e: RelEdge }[] = [];
    for (const e of g.edges) {
      if (!e.active) continue;
      if (e.from === id) out.push({ other: e.to, e });
      else if (e.to === id) out.push({ other: e.from, e });
    }
    for (const { other, e } of out) {
      if (other === focalId) continue;
      const node = g.nodes[other];
      if (!node || !node.active) continue;
      const s = effectiveSalience(e, cycle) * hopPenalty;
      const existing = seen.get(other);
      if (!existing || existing.score < s) {
        seen.set(other, { node, relationPhrase: `${e.type} ${g.nodes[id]?.name ?? id}: ${e.blurb}`, score: s });
      }
    }
    return out.map(o => o.other);
  };
  const hop1 = neighbors(focalId, 1);
  for (const n of hop1.slice(0, 8)) neighbors(n, 0.4);   // 2nd hop, damped, no recursion
  for (const w of wildcardIds) {
    const node = g.nodes[w];
    if (node?.active && !seen.has(w)) seen.set(w, { node, relationPhrase: 'thematic wildcard', score: 0.1 });
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, CANDIDATE_CAP);
}

// ---- dossier render (engine-derived, bounded — LORE §2) -----------------------------------

/** dossier = stable identity + top-K salience-ranked ACTIVE memory-edges (never a growing blob) */
export function renderDossier(g: LoreGraph, id: string, cycle: number): string {
  const node = g.nodes[id];
  if (!node) return '';
  const memories = g.edges
    .filter(e => e.active && (e.from === id || e.to === id))
    .sort((a, b) => effectiveSalience(b, cycle) - effectiveSalience(a, cycle))
    .slice(0, DOSSIER_TOP_K)
    .map(e => {
      const other = g.nodes[e.from === id ? e.to : e.from]?.name ?? '?';
      const dir = e.from === id ? e.type : `(${e.type} by)`;
      return `- ${dir} ${other}: ${e.blurb}${e.core ? ' [core]' : ''}`;
    });
  return `${node.name} — ${node.identity}\n${memories.join('\n')}`;
}

/** the Chronicle view: full history INCLUDING inactive (player-readable, never AI-fed) */
export function chronicleOf(g: LoreGraph, id: string): RelEdge[] {
  return g.edges.filter(e => e.from === id || e.to === id);
}

// ---- write-back guards (LORE §3.3) ----------------------------------------------------------

/** persist AI-emitted edges, guarded: both endpoints must resolve; type must be in the enum */
export function guardEdges(g: LoreGraph, proposed: {
  from: string; to: string; type: string; blurb: string; importance: number;
}[], cycle: number, idGen: () => string, sourceChainId?: string): RelEdge[] {
  const ok: RelEdge[] = [];
  for (const p of proposed) {
    if (!g.nodes[p.from] || !g.nodes[p.to]) continue;
    if (!EDGE_TYPES.includes(p.type as EdgeType)) continue;
    const importance = Math.max(0, Math.min(1, p.importance));
    // DEDUP: an active edge with the same (from,to,type) is the SAME memory retold —
    // refresh it (touch + best blurb) instead of stacking near-copies (LORE §2 append
    // is for NEW facts; a repeated fact re-anchors salience)
    const dup = g.edges.find(e => e.active && e.type === p.type &&
      ((e.from === p.from && e.to === p.to) || (e.from === p.to && e.to === p.from)));
    if (dup) {
      touchEdge(dup, cycle, importance * 0.3);
      if (p.blurb.length > dup.blurb.length) dup.blurb = p.blurb.slice(0, 160);
      if (importance >= CORE_IMPORTANCE) dup.core = true;
      continue;
    }
    const e: RelEdge = {
      id: idGen(), from: p.from, to: p.to, type: p.type as EdgeType,
      salience: Math.max(0.3, importance), core: importance >= CORE_IMPORTANCE,
      active: true, lastCycle: cycle, blurb: p.blurb.slice(0, 160), sourceChainId,
    };
    addEdge(g, e);
    ok.push(e);
  }
  return ok;
}
