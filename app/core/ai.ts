// The AI layer — a Narrator abstraction the game talks to (UI-agnostic, swappable).
// Two implementations: OpenAINarrator (real gpt-5-mini, ./openaiNarrator.ts) and the
// MockNarrator below (deterministic, offline — for fast loop tests without burning tokens).
// The engine owns all numbers; the Narrator only writes fiction + picks tags from the vocab.

import { rngFrom, pick, type Rng } from './rng.js';
import { tagLabel } from './tags.js';
import type { Attributes, Attribute } from './types.js';

// ---- IO types (what each call gives and gets) -------------------------------
export interface AskOut {
  attribute: Attribute;
  favoredTags: string[];                 // canonical ids
  slots: Array<{ kind: 'open' } | { kind: 'must-have'; tag: string }>;
}
export interface CardAskInput {
  archetype: string; location: string; slotCount: number; rewardSeed: string;
}
export interface CardAskOut { situation: string; job: string; ask: AskOut }

export interface OutcomeInput {
  situation: string; job: string;
  party: Array<{ name: string; tags: string[] }>;   // tags = display labels
  outcome: 'success' | 'partial' | 'failure';
  captiveTags?: string[];                            // display labels, if a captive delivered
  risky: boolean;
  approach?: string;                                 // chosen finale branch intent (win-over / subdue / ransom)
}
export interface OutcomeOut {
  beforeRoll: string; afterRoll: string;
  captive?: { name: string; who: string } | null;
  punishment?: string | null;                       // short flavor for a failure consequence
}

export interface FleshInput { tags: string[]; attrs: Attributes; context: string }
export interface FleshOut { name: string; who: string; backstory: string; quirks: string[] }

export interface GenesisInput {
  focalTags: string[][];        // each focal character's display tags — THE story seed
  region: string;
  personal?: boolean;           // true = this existing merc's own buried past
  name?: string;                // the focal's name (for personal chains)
  avoid?: string[];             // hooks of recent sagas — make THIS premise distinct from them
}
export interface GenesisOut {
  title: string; hook: string; bible: string; direction: string; climax: string;
}

export interface ChainBeatInput {
  bible: string; chainState: string; region: string; slotCount: number; beatConstraint: string;
}
export interface ChainBeatOut {
  situation: string; job: string; ask: AskOut; proposedReward: string; newLayerRevealed: string;
}

export interface ConceptTagsInput { concept: string }
export interface ConceptTagsOut { name: string; who: string; tags: string[] }

// A record of one AI call (for the in-game prompt/response log).
export interface AICallRecord {
  n: number;
  kind: string;                 // cardAsk / outcome / flesh / genesis / chainBeat / conceptTags
  model: string;
  effort?: string;
  ms?: number;                  // wall-clock latency of the call
  system: string;
  user: string;
  response: string;
  promptTokens?: number;
  completionTokens?: number;
  cachedTokens?: number;
}

export interface Narrator {
  readonly kind: 'openai' | 'mock';
  cardAsk(i: CardAskInput): Promise<CardAskOut>;
  outcome(i: OutcomeInput): Promise<OutcomeOut>;
  flesh(i: FleshInput): Promise<FleshOut>;
  genesis(i: GenesisInput): Promise<GenesisOut>;
  chainBeat(i: ChainBeatInput): Promise<ChainBeatOut>;
  conceptTags(i: ConceptTagsInput): Promise<ConceptTagsOut>;
}

// ---- attribute & favored-tag heuristics shared by the mock ------------------
const ARCH_ATTR: Record<string, Attribute> = {
  capture: 'agility', raid: 'physical', rescue: 'charisma', escort: 'willpower',
  investigate: 'intelligence', hunt: 'agility', contract: 'physical', scout: 'intelligence',
};
const ARCH_FAVORED: Record<string, string[]> = {
  capture: ['skill:stealth', 'bg:hunter'], hunt: ['bg:hunter', 'skill:beast'],
  raid: ['phys:muscular', 'bg:soldier'], escort: ['pers:brave', 'phys:tough'],
  rescue: ['pers:kind', 'skill:heal'], contract: ['bg:soldier'],
  investigate: ['skill:lore', 'phys:clever'], scout: ['skill:stealth', 'phys:clever'],
};

// ---- MockNarrator: deterministic, offline ----------------------------------
const NAMES = ['Marek', 'Ivo', 'Adeliza', 'Bran', 'Sigrun', 'Wulf', 'Edda', 'Cuthbert', 'Hilde', 'Joran', 'Reyna', 'Garrick'];
const BYNAMES = ['the Quiet', 'Greyborn', 'Wulfson', 'of Saltreach', 'One-Hand', 'the Patient', 'Crow', 'Emberhand'];

export class MockNarrator implements Narrator {
  readonly kind = 'mock' as const;
  private r(seed: unknown): Rng { return rngFrom(JSON.stringify(seed)); }

  async cardAsk(i: CardAskInput): Promise<CardAskOut> {
    return {
      situation: `A petitioner reaches the gate from ${i.location}: ${i.rewardSeed}.`,
      job: `Take the ${i.archetype} job and see it done.`,
      ask: { attribute: ARCH_ATTR[i.archetype] ?? 'physical', favoredTags: ARCH_FAVORED[i.archetype] ?? [], slots: Array.from({ length: i.slotCount }, () => ({ kind: 'open' as const })) },
    };
  }
  async outcome(i: OutcomeInput): Promise<OutcomeOut> {
    const who = i.party.map((p) => p.name).join(', ');
    const lines: Record<typeof i.outcome, string> = {
      success: `${who} carried it cleanly.`,
      partial: `${who} got it done, but not without cost.`,
      failure: `${who} came back empty-handed.`,
    };
    const r = this.r(i);
    return {
      beforeRoll: `${who} set out for the job at first light.`,
      afterRoll: lines[i.outcome],
      captive: i.captiveTags && i.outcome !== 'failure'
        ? { name: `${pick(r, NAMES)} ${pick(r, BYNAMES)}`, who: `A captive marked by ${i.captiveTags.slice(0, 2).join(' and ')}.` }
        : null,
      punishment: i.outcome === 'failure' && i.risky ? 'a wound taken in the retreat' : null,
    };
  }
  async flesh(i: FleshInput): Promise<FleshOut> {
    const r = this.r(i);
    return {
      name: `${pick(r, NAMES)} ${pick(r, BYNAMES)}`,
      who: `Known for ${i.tags.slice(0, 2).join(' and ') || 'little'}.`,
      backstory: `Came up hard; bears the marks of ${i.tags[0] ?? 'a rough road'}. ${i.context}.`,
      quirks: [`fingers an old token when ${i.tags[0] ?? 'uneasy'}`],
    };
  }
  async genesis(i: GenesisInput): Promise<GenesisOut> {
    const r = this.r(i);
    const seed = i.focalTags[0]?.[2] ?? i.focalTags[0]?.[0] ?? 'a stranger';
    return {
      title: `The ${pick(r, ['Debt', 'Wolf', 'Ledger', 'Vow', 'Oath'])} of ${i.region}`,
      hook: `${i.personal ? (i.name ?? 'A merc') + "'s past" : 'A figure'} marked by ${seed} surfaces in ${i.region}.`,
      bible: `Truth derived from the focal's tags (${i.focalTags[0]?.join(', ') ?? '—'}): their nature hides a buried cause. Each beat reveals one layer.`,
      direction: i.personal ? 'Forces the merc to face who they are.' : 'Likely ends with a powerful recruit — or their grave.',
      climax: 'A reckoning rooted in their own nature.',
    };
  }
  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    return {
      situation: `A new turn in the matter at ${i.region}: ${i.beatConstraint}.`,
      job: 'Follow the thread one step further.',
      ask: { attribute: 'intelligence', favoredTags: ['skill:lore', 'pers:brave'], slots: Array.from({ length: i.slotCount }, () => ({ kind: 'open' as const })) },
      proposedReward: 'a little coin and a clue',
      newLayerRevealed: 'one more layer of the truth surfaces',
    };
  }
  async conceptTags(i: ConceptTagsInput): Promise<ConceptTagsOut> {
    const r = this.r(i);
    return { name: `${pick(r, NAMES)} ${pick(r, BYNAMES)}`, who: i.concept, tags: ['gender:male', 'race:human'] };
  }
}

// tiny helper used by both narrators / callers to render a card's tags as labels
export function tagLabels(tags: Array<{ id: string; tier: number }>): string[] {
  return tags.map((t) => tagLabel(t.id, t.tier));
}

// ---- resilient wrapper: never let one bad AI call crash the game ------------
// Tries the primary narrator; on any throw, logs and falls back to the mock so the
// cycle always completes. (The primary already retries internally; this is the net.)
export class ResilientNarrator implements Narrator {
  readonly kind: 'openai' | 'mock';
  constructor(private primary: Narrator, private fallback: Narrator, private log: (s: string) => void = () => {}) { this.kind = primary.kind; }
  private async guard<T>(name: string, fn: (n: Narrator) => Promise<T>): Promise<T> {
    try { return await fn(this.primary); }
    catch (e) { this.log(`  ⚠ ${name} fell back to mock: ${String(e).slice(0, 100)}`); return fn(this.fallback); }
  }
  cardAsk(i: CardAskInput) { return this.guard('cardAsk', (n) => n.cardAsk(i)); }
  outcome(i: OutcomeInput) { return this.guard('outcome', (n) => n.outcome(i)); }
  flesh(i: FleshInput) { return this.guard('flesh', (n) => n.flesh(i)); }
  genesis(i: GenesisInput) { return this.guard('genesis', (n) => n.genesis(i)); }
  chainBeat(i: ChainBeatInput) { return this.guard('chainBeat', (n) => n.chainBeat(i)); }
  conceptTags(i: ConceptTagsInput) { return this.guard('conceptTags', (n) => n.conceptTags(i)); }
}

// ---- factory ----------------------------------------------------------------
export interface NarratorOptions {
  provider?: 'openai' | 'mock'; apiKey?: string; model?: string;
  log?: (s: string) => void; browser?: boolean;
  effort?: 'minimal' | 'low' | 'medium';          // reasoning_effort override for ALL calls
  narrativeEffort?: 'minimal' | 'low' | 'medium'; // reasoning_effort for the narrative tier only
  onCall?: (rec: AICallRecord) => void;   // structured per-call hook for the AI log
}
export async function makeNarrator(opts: NarratorOptions = {}): Promise<Narrator> {
  const provider = opts.provider ?? (opts.apiKey ? 'openai' : 'mock');
  if (provider === 'openai') {
    const { OpenAINarrator } = await import('./openaiNarrator.js');
    return new ResilientNarrator(new OpenAINarrator(opts), new MockNarrator(), opts.log);
  }
  return new MockNarrator();
}
