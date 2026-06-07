// The AI layer — a Narrator abstraction the game talks to (UI-agnostic, swappable).
// Two implementations: OpenAINarrator (real gpt-5-mini, ./openaiNarrator.ts) and the
// MockNarrator below (deterministic, offline — for fast loop tests without burning tokens).
// The engine owns all numbers; the Narrator only writes fiction + picks tags from the vocab.

import { rngFrom, pick, type Rng } from './rng.js';
import { tagPlain } from './tags.js';
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
  midSaga?: boolean;                                 // a NON-finale chain beat — named cast must survive & stay free
  finale?: boolean;                                  // the saga's CLIMAX — narrate with the weight of an ending
  beforeWords?: string;                              // engine-set word budget for beforeRoll (scales w/ stakes); default 35-55
  afterWords?: string;                               // engine-set word budget for afterRoll (scales w/ stakes); default 55-90
  // the beat only PROPOSES; the resolution AI (which knows the OUTCOME) decides what is actually learned/gained.
  proposedReveal?: string;                           // the truth the beat is SET UP to surface (a suggestion)
  proposedLoot?: string;                             // the side-loot the beat is set up to drop (a suggestion)
}
export interface OutcomeOut {
  beforeRoll: string; afterRoll: string;
  captive?: { name: string; who: string } | null;
  punishment?: string | null;                       // short flavor for a failure consequence
  learned?: string | null;                          // what the company ACTUALLY comes away knowing (scaled to
                                                     // the outcome; '' / null on a clean failure). Decided here.
  loot?: string | null;                             // the side-loot flavor actually gained ('' / null if none)
}

export interface FleshInput { tags: string[]; attrs: Attributes; context: string }
export interface FleshOut { name: string; who: string; backstory: string; quirks: string[] }

export interface GenesisInput {
  focalTags: string[][];        // each focal character's display tags — THE story seed
  region: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary'; // depth scales with stakes
  personal?: boolean;           // true = this existing merc's own buried past
  name?: string;                // the focal's name (for personal chains)
  who?: string;                 // the focal's known-for line (personal chains)
  backstory?: string;           // the focal's existing backstory (personal chains)
  avoid?: string[];             // titles/blurbs of recent sagas — make THIS distinct
  seed?: string;                // a hand-crafted concrete PREMISE to build around — decorrelates the
                                // story SHAPE from the focal's tags (which converge on "hidden secret")
  place?: string;               // a concrete SETTING within the region (so sagas aren't all "a fen-hamlet")
  tone?: string;                // the engine-set register (slice-of-life … dark) so not every saga is grim
  twist?: boolean;              // engine-rolled: this quest's apparent goal is a misdirection
  expectedBeats?: number;       // engine's rough beat budget → sizes the planned arc
  poolCast?: Array<{ name: string; who: string; tags: string[] }>; // existing world characters the
                                // bible MAY cast as SECONDARY people (recurrence = attachment, QUEST_BIBLE.md §4)
  poolCastMax?: number;         // engine-rolled cap on how many recurring faces this saga may reuse (0-2)
}
// A bible person carries a WHY-LADDER (history: cause → cause → bedrock). docs/QUEST_BIBLE.md
export interface BiblePerson {
  name: string; who: string; history: string[]; wants: string; feels: string; conceals?: string; role?: string;
}
export interface GenesisOut {
  title: string;                // concrete, names a real thing/person/place
  leadBlurb: string;            // the player-facing job-board teaser — a clear job the company would take
  goal: string;                 // the APPARENT throughline the company commits to (may be a misdirection)
  arc: string[];                // a ROUGH ordered guide: step 1 = take the job … last = goal achieved
  twistReveal?: string;         // if a twist quest: how the truth subverts the apparent goal
  choiceSteps?: number[];       // bible-proposed arc steps (1-based) that afford a sneak/fight/talk choice
  finaleChoices?: Array<{ label: string; kind: 'recruit' | 'captive' | 'gold' }>; // story-logical endings
  cast: BiblePerson[];          // the lean cast (role + want + one line); cast[0] is the focal
  situation: string;            // the ground truth, told straight
  tensions: string[];           // "<A> wants X; <B> wants Y; because <reason>"
  directions: Array<{ kind: 'ambient' | 'active'; hook: string }>; // quest seeds toward the fort
}

/** Render a structured bible into the clinical-truth text the beat-writer consumes. */
export function renderBible(b: GenesisOut): string {
  // lean cast (role + want + one line) or, for kept characters, a deep why-ladder — render only the
  // parts present, so a lean person doesn't show dangling ": ." / "feels: ." noise.
  const cast = b.cast.map((p) => {
    const role = p.role ? ` [${p.role}]` : '';
    const hist = p.history?.length ? ` ${p.history.join(' → ')}.` : '';
    const feels = p.feels ? ` feels: ${p.feels}.` : '';
    const conceals = p.conceals ? ` conceals: ${p.conceals}.` : '';
    return `- ${p.name} (${p.who})${role} — wants: ${p.wants}.${feels}${hist}${conceals}`;
  }).join('\n');
  const dirs = b.directions.map((d) => `- [${d.kind}] ${d.hook}`).join('\n');
  const arc = (b.arc?.length) ? `\nROUGH ARC (a guide, not a script — step 1 opens, last step achieves the goal):\n${b.arc.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}` : '';
  return `TITLE: ${b.title}\nQUEST GOAL (apparent): ${b.goal || '(the throughline)'}${b.twistReveal ? `\nTHE TWIST (hidden from the player; surfaces across beats): ${b.twistReveal}` : ''}${arc}\nSITUATION (the truth behind the job): ${b.situation}\nCAST:\n${cast}\nTENSIONS:\n- ${b.tensions.join('\n- ')}\nOPEN DIRECTIONS:\n${dirs}`;
}

export interface ChainBeatInput {
  bible: string; chainState: string; region: string; slotCount: number; beatConstraint: string;
  introduced?: string[];   // names the player has already met — orient ONLY names NOT in this list
}
export interface ChainBeatOut {
  situation: string; job: string; ask: AskOut; proposedReward: string; newLayerRevealed: string;
  closesChain?: boolean;   // the AI's call: is THIS beat the arc's climax? (only honored when the engine permits)
  // the AI's call: does THIS beat hand the company tangible loot RIGHT NOW (raid/loot/seize/crack-a-chest),
  // vs only making progress? The engine sizes it AND still defers a share to the finale bank (REWARD_BANK.md).
  immediateReward?: boolean;
  // OPTIONAL: 2-3 distinct APPROACHES the player picks between (sneak vs fight vs talk) — a mid-beat choice
  choices?: Array<{ label: string; attribute: string; favored: string[] }>;
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
  capture: 'agility', raid: 'physical', rescue: 'charisma', escort: 'perception',
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
  private beatCount = 0;   // toggles immediateReward so both reward paths get exercised offline
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
      // mock: resolution decides learned/loot from the proposals, scaled to the outcome.
      learned: i.outcome === 'failure' ? null : (i.proposedReveal ?? null),
      loot: i.outcome === 'failure' ? null : (i.proposedLoot ?? null),
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
    const focalName = i.name ?? `${pick(r, NAMES)} ${pick(r, BYNAMES)}`;
    const seed = i.focalTags[0]?.[2] ?? i.focalTags[0]?.[0] ?? 'a hard road';
    return {
      title: `The Ledger of ${i.region}`,
      leadBlurb: `A petitioner from ${i.region} brings a debt unpaid and a name they won't say.`,
      goal: `settle the matter the petitioner from ${i.region} brings to the company`,
      arc: ['the petitioner brings the job to the gate', 'follow the trail and meet who it touches', 'the truth turns and the stakes rise', 'the reckoning that settles it'],
      choiceSteps: [2],
      finaleChoices: [{ label: 'Take them into the company', kind: 'recruit' }, { label: 'Cage them', kind: 'captive' }, { label: 'Hand them over for coin', kind: 'gold' }],
      cast: [
        { name: focalName, who: i.who ?? `known for ${seed}`, history: [`shaped by ${seed}`, 'made a choice they cannot undo', 'now hides what it cost'], wants: 'to keep the past buried', feels: 'shame', conceals: 'the thing they did' },
        { name: `${pick(r, NAMES)} of ${i.region}`, who: 'a witness', history: ['saw what happened'], wants: 'justice or silence-money', feels: 'fear', role: 'the one who remembers' },
      ],
      situation: `The focal (${i.focalTags[0]?.join(', ') ?? '—'}) did something in ${i.region} that a witness survived; both are bound to it.`,
      tensions: [`${focalName} wants the past buried; the witness wants it answered; because only one of them can be safe.`],
      directions: [{ kind: 'active', hook: `Someone hires the company to find the witness.` }, { kind: 'ambient', hook: `The witness drifts toward the fort's orbit.` }],
    };
  }
  async chainBeat(i: ChainBeatInput): Promise<ChainBeatOut> {
    return {
      situation: `A new turn in the matter at ${i.region}: ${i.beatConstraint}.`,
      job: 'Follow the thread one step further.',
      ask: { attribute: 'intelligence', favoredTags: ['skill:lore', 'pers:brave'], slots: Array.from({ length: i.slotCount }, () => ({ kind: 'open' as const })) },
      proposedReward: 'a little coin and a clue',
      newLayerRevealed: 'one more layer of the truth surfaces',
      closesChain: /finale|climax|out of room|close it now/i.test(i.beatConstraint),
      immediateReward: (++this.beatCount % 2 === 0),   // alternate so both immediate + deferred paths run
    };
  }
  async conceptTags(i: ConceptTagsInput): Promise<ConceptTagsOut> {
    const r = this.r(i);
    return { name: `${pick(r, NAMES)} ${pick(r, BYNAMES)}`, who: i.concept, tags: ['gender:male', 'race:human'] };
  }
}

// render a card's tags as CLEAR AI-facing descriptions (plain meaning, not flavor names)
export function tagLabels(tags: Array<{ id: string; tier: number }>): string[] {
  return tags.map((t) => tagPlain(t.id, t.tier));
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
