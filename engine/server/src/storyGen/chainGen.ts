// chainGen — the validated story-chain generators as PURE, importable functions.
//
// This file has NO main(), NO file I/O, NO /tmp, NO process side effects, so it
// can be imported by the campaign driver AND by the thin CLI wrappers
// (genesis.ts, questWriter.ts) without anything running on import.
//
// Three generators, all "engine owns numbers, AI owns flavor":
//   buildBible    collide a seed with the character pool -> a hidden truth bible
//   writeQuest    bible + chain-state -> the next POV-locked player quest card
//   resolveQuest  quest + outcome tier -> aftermath prose + chain-state delta
//
// Pacing (how many quests a chain runs) is engine-owned: TARGET by stakes.

import OpenAI from 'openai';
import { z } from 'zod';
import { type PoolCharacter } from '../chainBible/characterPool.js';
import { type Seed, type Stakes } from './seeds.js';
import { callJson, type Effort } from './ai.js';

// ---------------------------------------------------------------------------
// Models (engine-side defaults; callers may override per call)
// ---------------------------------------------------------------------------
export const BIBLE_MODEL = process.env.AIRAIDER_BIBLE_MODEL ?? 'gpt-5-mini';
export const BIBLE_EFFORT = (process.env.AIRAIDER_BIBLE_EFFORT ?? 'low') as Effort;
export const QUEST_MODEL = process.env.AIRAIDER_QUEST_MODEL ?? 'gpt-5-mini';
export const QUEST_EFFORT = (process.env.AIRAIDER_QUEST_EFFORT ?? 'low') as Effort;
export const FIT_MODEL = process.env.AIRAIDER_FIT_MODEL ?? 'gpt-5-nano';
export const FIT_EFFORT = (process.env.AIRAIDER_FIT_EFFORT ?? 'minimal') as Effort;

// ---------------------------------------------------------------------------
// Schemas + types
// ---------------------------------------------------------------------------
const GenesisSchema = z.object({
  kernel: z.string().min(20),
  coreCharacterIds: z.array(z.string()).min(1).max(3),
  newRoleNeeded: z.string().optional(),
});
export type Genesis = z.infer<typeof GenesisSchema>;

const PersonSchema = z.object({
  name: z.string().min(2),
  who: z.string().min(10),
  history: z.array(z.string().min(8)).min(1),
  wants: z.string().min(6),
  feels: z.string().min(6),
  conceals: z.union([z.string(), z.boolean(), z.null(), z.record(z.any())]).optional(),
});

const DirectionSchema = z.object({
  kind: z.enum(['ambient', 'active']).optional(),
  hook: z.string().min(10),
});

const BibleSchema = z.object({
  title: z.string().min(2).max(80),
  leadBlurb: z.string().min(20),
  cast: z.array(z.object({
    person: PersonSchema,
    roleInStory: z.string().optional(),
    coined: z.boolean().optional(),
  })).min(2).max(6),
  situation: z.string().min(30),
  tensions: z.array(z.union([z.string().min(15), z.record(z.any())])).min(1),
  openDirections: z.array(z.union([DirectionSchema, z.string().min(10)])).min(2).max(6),
});
export type Bible = z.infer<typeof BibleSchema>;

const strArr = z.array(z.string()).optional();

const QuestSchema = z.object({
  questTitle: z.string().min(2),
  card: z.string().min(20),
  missionFiction: z.string().min(8),
  hiddenPurpose: z.string().min(8),
  assignmentAsk: z.object({
    desiredStats: strArr,
    desiredTraits: strArr,
    fictionalReason: z.string().optional(),
  }),
  revealOnSuccess: strArr,
  revealOnFailure: strArr,
  closesChain: z.union([z.boolean(), z.string(), z.null()]).optional(),
  closingReason: z.string().optional(),
});
export type Quest = z.infer<typeof QuestSchema>;

const ResolutionSchema = z.object({
  resolutionProse: z.string().min(20),
  newlyRevealed: strArr,
  threadsOpened: strArr,
  threadsClosed: strArr,
  actorUpdates: z.record(z.any()).optional(),
  currentSituation: z.string().min(10),
  closingNote: z.string().optional(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export type Outcome = 'clean_win' | 'narrow_win' | 'partial_loss' | 'failure';
export const OUTCOMES: Outcome[] = ['clean_win', 'narrow_win', 'partial_loss', 'failure'];

const FitSchema = z.object({
  partyFit: z.union([z.number(), z.string()]),   // 0..6; nano may stringify
  note: z.string().optional(),
});
export interface FitJudgement { partyFit: number; note: string; }

export interface ChainState {
  currentSituation: string;
  knownToPlayer: string[];
  openThreads: string[];
  closedThreads: string[];
  actorStates: Record<string, string>;
}

// Engine-owned pacing: how many quests a chain of this rarity should run.
export const TARGET: Record<Stakes, { target: number; max: number }> = {
  uncommon: { target: 2, max: 3 },
  rare: { target: 3, max: 4 },
  legendary: { target: 5, max: 6 },
};
export function pacingFor(stakes: Stakes): { target: number; max: number } {
  return TARGET[stakes];
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const GENESIS_SYSTEM = `You ignite stories. A good story idea is two unrelated sparks colliding to make something new (Stephen King: "two previously unrelated ideas come together and make something new under the sun").

You are given:
- a SEED: a "what if" spark.
- a SLATE of real people who already exist in this world (persistent characters), each with a name and what they are known for.

Your only job: find the COLLISION. Pick the 1-3 people from the slate on whom this seed lands hardest — where it would make the most believable, most charged "something new" — and state the kernel.

RULES:
- Choose people whose known life makes the seed BELIEVABLE on them, not random. The best collision is one a reader would believe could really happen to THIS person.
- The kernel is 2-3 plain sentences: who is caught in this, and the fresh situation the collision creates. Do NOT resolve it. Do NOT plot beats. Just ignite.
- If the collision genuinely needs one person who is not on the slate (e.g. an antagonist, a returning relative), say so in newRoleNeeded; otherwise omit it. Prefer using slate people.
- Clinical voice. No flourish. State what is, not how it feels.

Output JSON: { kernel, coreCharacterIds (exact ids from the slate), newRoleNeeded? }.`;

const BUILD_SYSTEM = `You build the believable hidden TRUTH of a story — the reference a writers' room works from. This is NOT prose and NOT a mystery. It is what is actually true, told straight. Mystery is added later by someone else who chooses what to reveal; your job is only to make the truth BELIEVABLE.

You are given the KERNEL (the collision) and the CORE PEOPLE it caught.

HOW TO BUILD EACH PERSON — ASK "WHY?" TO BEDROCK:
- Start from a present fact about them and ask "why?" again and again until you reach something irreducible — a love, a loss, a vow, a debt, a shame. Each "why" answer is ONE history bullet, in order. (Example: "she avoids the harbour → why? a man drowned there → why was that her doing? she untied the wrong line → why does she hide it? she let them blame a boy instead.")
- SECRETS ARE NOT A FIELD. A person conceals something ONLY when a FEELING makes hiding natural: shame, fear of being labeled, guilt, fear of loss. If their history + feeling produces concealment, put it in "conceals". If not, OMIT conceals. MOST people conceal NOTHING — that is correct and believable. Do not give everyone a secret.
- Ladder DEEP only for the core people the collision turns on. People at the edges stay shallow (a single history bullet is fine).

BELIEVABILITY RUBRIC (your output must pass it):
- Causality: every present fact traces to a prior cause in history.
- Ordinary motives: people act from plain human wants, not plot necessity.
- No coincidence-stacking: the situation is reachable without "and conveniently…".
- Few secret-bearers: 1-2 people conceal anything; the rest are exactly what they seem.
- Nobody behaves stupidly just to keep the situation alive.

COMMIT TO THE TRUTH (critical):
- This bible IS the settled, complete truth. It is what really happened, fully decided. NOTHING here is an open question.
- If a thing happened — a killing, a theft, a betrayal, a disappearance — you MUST state plainly WHO did it and WHY, in the situation and the relevant person's history. Decide it now.
- BANNED in the hidden layer: "unknown", "remains hidden", "it is unclear", "someone", "a mysterious figure", "the identity of X hangs on", "the truth of Y is never revealed". Those are the PLAYER's to discover later — but you, the author, already know, so write it down.
- Mystery is manufactured downstream when quests are written from this bible. Your job is the opposite: leave no mystery in the truth itself. If you find yourself withholding a fact, stop and commit to it.

OUTPUT (clinical truth fields; only leadBlurb may carry light flavor):
- title: short, concrete, names a real thing/person/place in the story. No "The Weight of X" patterns.
- leadBlurb: 1-2 sentences the PLAYER sees on a job board before meeting anyone. It must sound like a MUNDANE CONTRACT and reveal NONE of the hidden truth. Use physical anchors (a body, an unpaid debt, a missing barge), not the cast's secret names.
- cast: each { person { name, who, history[] (the why-ladder), wants, feels, conceals? }, roleInStory, coined? }.
  REUSE EXISTING PEOPLE FIRST. The slate you are given is the living population of this world. Draw the whole cast — core AND secondary — from the slate wherever a person could plausibly fill the role. When you use a slate person, the history you write is NEW canon being revealed about them; keep it consistent with what is already known of them (their known-for line and tags). Coin a brand-new person ONLY when a needed role has no plausible fit on the slate; set coined:true on those, and keep them few.
- situation: 2-4 sentences — the believable present truth, told straight (this is the hidden ground truth, not the player blurb).
- tensions: who clashes with whom, over what, and the plain reason. One bullet each.
- openDirections: 2-4 ways this could go, each { kind, hook }. Frame every hook toward the player's MERCENARY COMPANY / FORT — these are the seeds quests are written from. Provide AT LEAST ONE of each kind:
  - kind:"ambient" — something that unfolds with or without the company; it can resolve in the background and shift the situation even if the company never acts (a character drifting into the fort's orbit, a death, a deal closing). Low player agency; living-world pressure.
  - kind:"active" — a contract, plea, or opportunity the company is directly invited into and could take up (someone asks the company for help; a job the company can accept). This is a selectable quest seed.
  A hook may involve several cast members. NOT prescriptive beats — just plausible openings.

BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny. Name concrete things instead.

Output JSON only.`;

const QUEST_WRITER_SYSTEM = `You are the quest-writer for a grimdark mercenary-fort game. A hidden STORY BIBLE holds the complete, settled truth of a story. The player NEVER sees the bible. Your job: write the NEXT quest the player's mercenary company is offered, revealing the buried truth only a little at a time, through what the company can actually see and do.

You are given: the BIBLE (hidden truth), the CHAIN STATE (what is currently true and what the player already knows), and PACING.

HARD RULES:
- The player sees ONLY the "card". It must be concrete and enticing — a job, a plea, a rumor, a body — and must reveal NO hidden CAUSE. Symptoms, not causes. (A corpse, never the murderer's name; a missing barge, never the smuggling ring.)
- POV LOCK — the card is what arrives AT THE FORT. Write strictly from the company's vantage: ONLY what the client/messenger/rumor that comes to the gate actually says or shows, plus facts the company already established in earlier quests of this chain (see WHAT THE PLAYER ALREADY KNOWS). You have NO omniscient access. NEVER narrate the private thoughts, facial expressions, or unseen scenes of anyone the company has not yet met. If a person is off-scene, you may only report what the petitioner CLAIMS about them, explicitly attributed to the petitioner ("the steward says the tavernkeeper will not give it up") — never an all-seeing read of that person's face or heart.
- STATE THE JOB PLAINLY — the card must make the contract unambiguous: WHO is hiring, WHAT they want achieved, and the CONCRETE ACTION the company is asked to perform (escort / recover / guard / stand witness / intimidate / investigate / hunt...). The player must finish reading and know exactly what taking this job commits the company to do. End the card on the explicit ask.
- Reveal SLOWLY. One quest surfaces at most ONE new layer of the truth. Do not dump the conspiracy. Most of the bible stays buried for now.
- CONTINUITY: the quest must follow believably from the CHAIN STATE — react to what the company just did and to what is now in motion. Do not reset. After the first quest, drive the next one from open threads and the actors' reactions, not from a fresh unrelated job.
- The company's only agency is: take the job + assign units. Do NOT write mid-quest branching choices.
- assignmentAsk: name the qualities the job calls for as QUALITATIVE tags only (stats, traits) plus a fiction reason. NEVER numbers, gold, or rewards — the engine owns all numbers.
- PACING / ENDING IS ALLOWED, NEVER FORCED EARLY: while you are not yet permitted to end, keep the arc open (closesChain:false) and leave at least one thread driving forward. Once ending is PERMITTED, you may close — but ONLY if the arc has genuinely reached its climax: then write THIS quest as the climactic finale that pays off the buried truth, and set closesChain:true. If it has not peaked yet, keep driving and leave closesChain:false. At the hard limit you are out of room: write this quest as the climactic finale and set closesChain:true. NEVER slam an ending onto a quest that was not built as a climax — a finale must read as the arc's peak, not a sudden stop.

VOICE: the card may be vivid and literary; the hidden fields are clinical.
Output JSON only: { questTitle, card, missionFiction, hiddenPurpose, assignmentAsk { desiredStats[], desiredTraits[], fictionalReason }, revealOnSuccess[], revealOnFailure[], closesChain, closingReason }`;

const RESOLVER_SYSTEM = `You resolve a mercenary quest after the company has acted. You are given the BIBLE (hidden truth), the CHAIN STATE, the QUEST just attempted, and the OUTCOME (a tier plus which units were assigned). Write what happened and update the world.

OUTCOME SEMANTICS — every outcome MUST advance the story; failure changes the FUTURE, it never stalls:
- clean_win: the objective is achieved cleanly; the planned success-reveal surfaces; the situation shifts in the company's favor.
- narrow_win: achieved, but at a real cost or with a complication.
- partial_loss: only partly achieved; a thread is left raw; a cost lands.
- failure: the objective fails; an antagonist or the world advances; the chain stays alive on a changed footing.

HARD RULES:
- resolutionProse is player-facing: vivid, grimdark, concrete. Name the assigned units; let their traits color HOW it went. Reveal ONLY facts allowed by the quest's revealOnSuccess (for win tiers) or revealOnFailure (for loss tiers) — and nothing deeper from the bible.
- The BIBLE's PAST truth is IMMUTABLE. You may not retcon what really happened. Outcomes bend only the FUTURE: who now knows what, who reacts, what is set in motion.
- Update state truthfully: newlyRevealed (facts the player now knows), threadsClosed, threadsOpened, actorUpdates (name → short new status), and a rewritten currentSituation (the hidden present reality AFTER this quest).
- If this is the FINAL quest: bring the arc to a real close that pays off the bible's deeper truth — but still honor the outcome tier (a failed finale is a grim ending, not a triumph). Put the closing beat in closingNote.
Output JSON only: { resolutionProse, newlyRevealed[], threadsOpened[], threadsClosed[], actorUpdates{}, currentSituation, closingNote }`;

const FIT_JUDGE_SYSTEM = `You judge how well an assigned mercenary party suits a specific job. You are given the JOB (what the client asks, and the qualities the contract calls for) and the assigned PARTY (each merc's tags and short background).

Rate partyFit as a single integer 0-6:
- 0-1: actively wrong — nobody here suits this; sending them invites disaster.
- 2-3: adequate — they can attempt it, but they are not specialists.
- 4-5: well-suited — the party covers what the job asks; apt backgrounds.
- 6: ideal — these are exactly the right people for this job.

Weigh BOTH the explicitly desired stats/traits AND each merc's background/tags (a merc whose past directly fits the situation counts for a lot; a clear mismatch counts against). A larger apt party fits better than a single mismatched merc, but bodies alone are not fit.

Output JSON only: { partyFit (0-6 integer), note (one short clause on why) }`;

// ---------------------------------------------------------------------------
// Prompt-building helpers
// ---------------------------------------------------------------------------
function slateBlock(chars: PoolCharacter[]): string {
  return chars.map((c) => `- id="${c.id}" name="${c.name}" (${c.role}) — known for: ${c.surface} [tags: ${c.tags.join(', ')}]`).join('\n');
}

export function concealsLine(c: unknown): string | null {
  if (typeof c === 'string') return c.trim() || null;
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>;
    const what = o.what ?? o.secret ?? o.it ?? o.thing;
    const why = o.why ?? o.reason ?? o.because;
    if (what && why) return `${what} — ${why}`;
    const joined = Object.values(o).filter((v) => typeof v === 'string').join(' — ');
    return joined || null;
  }
  return null;
}

export function tensionLine(t: string | Record<string, unknown>): string {
  if (typeof t === 'string') return t;
  const parties = t.parties ?? t.between ?? t.who ?? t.sides;
  const over = t.over ?? t.about ?? t.reason ?? t.conflict ?? t.detail;
  if (parties && over) return `${parties} — over ${over}`;
  return Object.values(t).filter((v) => typeof v === 'string').join(' — ');
}

function depthDirective(stakes: Stakes): string {
  switch (stakes) {
    case 'uncommon':
      return [
        `STAKES: UNCOMMON — a tight, human story. Keep it lean and sharp.`,
        `- cast: 2-3 people. 1-2 of them deep (full why-ladder), the rest single-bullet edges.`,
        `- why-ladder: ~4-6 links for the deep people, ending at bedrock.`,
        `- situation: 2-3 sentences. tensions: 2-3. openDirections: 2-3.`,
        `- One clear emotional core. Do not sprawl into subplots.`,
      ].join('\n');
    case 'rare':
      return [
        `STAKES: RARE — a fuller story with more people pulled in. Go deeper and wider.`,
        `- cast: 3-5 people. 2-3 of them deep (full why-ladder), the rest meaningful but lighter.`,
        `- why-ladder: ~6-8 links for the deep people, ending at bedrock.`,
        `- situation: 3-5 sentences that lay out the interlocking truth. tensions: 3-4. openDirections: 3-4.`,
        `- The collision should implicate more than two lives; let a second pressure (a creditor, an institution, kin) bear on it.`,
      ].join('\n');
    case 'legendary':
      return [
        `STAKES: LEGENDARY — a large, interlocking story that could reshape a town. Go the deepest and widest.`,
        `- cast: 4-6 people. 3-4 of them deep (full why-ladder), each with a distinct stake.`,
        `- why-ladder: ~7-9 links for the deep people, tracing to childhood/formative bedrock.`,
        `- situation: 4-6 sentences. Make the truth layered: multiple parties, conflicting legitimate interests, real institutional weight. tensions: 4-5. openDirections: 4.`,
        `- The story should feel like it has a past that predates the seed and consequences that outlast it.`,
      ].join('\n');
  }
}

function bibleBlock(bible: Bible): string {
  const cast = bible.cast.map((c) => {
    const p = c.person;
    const conceal = typeof p.conceals === 'string' && p.conceals.trim() ? ` | conceals: ${p.conceals}` : '';
    return `- ${p.name} — ${c.roleInStory ?? p.who}. wants: ${p.wants}${conceal}`;
  }).join('\n');
  const tensions = bible.tensions.map((t) => `- ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n');
  return [
    `## BIBLE — TRUE SITUATION (hidden)`, bible.situation,
    ``, `## CAST (hidden)`, cast,
    ``, `## TENSIONS (hidden)`, tensions,
  ].join('\n');
}

function chainStateBlock(s: ChainState): string {
  const known = s.knownToPlayer.length ? s.knownToPlayer.map((k) => `- ${k}`).join('\n') : '- (the player knows only the original job posting)';
  const open = s.openThreads.length ? s.openThreads.map((t) => `- ${t}`).join('\n') : '- (none yet)';
  const actors = Object.entries(s.actorStates).map(([n, v]) => `- ${n}: ${v}`).join('\n') || '- (unchanged)';
  return [
    `## CHAIN STATE — CURRENT REALITY (hidden)`, s.currentSituation,
    ``, `## WHAT THE PLAYER ALREADY KNOWS`, known,
    ``, `## OPEN THREADS`, open,
    ``, `## ACTOR STATES`, actors,
  ].join('\n');
}

function pacingBlock(stepIndex: number, t: { target: number; max: number }): string {
  const canEndNow = stepIndex >= t.target;
  const mustEndNow = stepIndex >= t.max;
  const ending = mustEndNow
    ? `- HARD LIMIT REACHED — write this quest as the climactic finale and set closesChain:true.`
    : canEndNow
      ? `- ENDING NOW ALLOWED — you MAY close. Do so ONLY if the arc has reached its true climax (then set closesChain:true and write the finale); otherwise keep one thread driving and set closesChain:false.`
      : `- ENDING NOT YET ALLOWED — keep the arc open, leave closesChain:false and at least one thread driving forward.`;
  return [
    `## PACING`,
    `- this is quest #${stepIndex}; the chain should run about ${t.target} quests (hard limit ${t.max}).`,
    ending,
  ].join('\n');
}

export function truthy(v: unknown): boolean {
  return v === true || v === 'true';
}

// ---------------------------------------------------------------------------
// Chain-state helpers
// ---------------------------------------------------------------------------
export function newChainState(bible: Bible): ChainState {
  return {
    currentSituation: bible.situation,
    knownToPlayer: [],
    openThreads: [],
    closedThreads: [],
    actorStates: {},
  };
}

/** The active hook that opens this chain's spine (falls back to the first hook). */
export function drivingHookOf(bible: Bible): string {
  const active = bible.openDirections.find((d) => typeof d === 'object' && d.kind === 'active');
  if (active && typeof active === 'object') return active.hook;
  const first = bible.openDirections[0];
  return typeof first === 'object' ? first.hook : first;
}

export function mergeChainState(s: ChainState, r: Resolution): void {
  for (const k of r.newlyRevealed ?? []) if (!s.knownToPlayer.includes(k)) s.knownToPlayer.push(k);
  const closed = new Set(r.threadsClosed ?? []);
  s.openThreads = s.openThreads.filter((t) => !closed.has(t));
  for (const t of r.threadsClosed ?? []) if (!s.closedThreads.includes(t)) s.closedThreads.push(t);
  for (const t of r.threadsOpened ?? []) if (!s.openThreads.includes(t)) s.openThreads.push(t);
  for (const [name, st] of Object.entries(r.actorUpdates ?? {})) s.actorStates[name] = String(st);
  s.currentSituation = r.currentSituation;
}

// ---------------------------------------------------------------------------
// Generators (pure: client in, data out)
// ---------------------------------------------------------------------------
export async function buildBible(
  client: OpenAI,
  opts: { seed: Seed; slate: PoolCharacter[]; anchorId?: string; model?: string; effort?: Effort },
): Promise<{ genesis: Genesis; bible: Bible }> {
  const model = opts.model ?? BIBLE_MODEL;
  const effort = opts.effort ?? BIBLE_EFFORT;
  const slate = opts.slate.filter((c) => c.role !== 'landmark');

  const genesisUser = [
    `SEED: ${opts.seed.spark}`,
    opts.anchorId ? `REQUIRED: the collision must include character id="${opts.anchorId}".` : ``,
    ``,
    `SLATE (people who exist in this world):`,
    slateBlock(slate),
    ``,
    `Find the collision. Output JSON only.`,
  ].filter(Boolean).join('\n');
  const genesis = await callJson(client, { system: GENESIS_SYSTEM, user: genesisUser, schema: GenesisSchema, model, effort });

  const coreChars = genesis.coreCharacterIds.map((id) => slate.find((c) => c.id === id)).filter(Boolean) as PoolCharacter[];
  const coreIds = new Set(coreChars.map((c) => c.id));
  const secondary = slate.filter((c) => !coreIds.has(c.id));

  const buildUser = [
    `KERNEL (the collision to make believable):`, genesis.kernel,
    genesis.newRoleNeeded ? `\nThe kernel needs a coined person for this role: ${genesis.newRoleNeeded}` : ``,
    ``,
    `CORE PEOPLE (the collision turns on these — build them deep by why-laddering):`,
    coreChars.map((c) => `- name="${c.name}" — known for: ${c.surface} [tags: ${c.tags.join(', ')}]`).join('\n'),
    ``,
    `OTHER EXISTING PEOPLE in this world — DRAW SECONDARY CAST FROM THESE before coining anyone new:`,
    secondary.map((c) => `- name="${c.name}" (${c.role}) — known for: ${c.surface} [tags: ${c.tags.join(', ')}]`).join('\n'),
    ``,
    depthDirective(opts.seed.stakes),
    ``,
    `Build the believable hidden truth. Output JSON only.`,
  ].filter(Boolean).join('\n');
  const bible = await callJson(client, { system: BUILD_SYSTEM, user: buildUser, schema: BibleSchema, model, effort });

  return { genesis, bible };
}

export async function writeQuest(
  client: OpenAI,
  opts: { bible: Bible; state: ChainState; drivingHook: string; step: number; pacing: { target: number; max: number }; model?: string; effort?: Effort },
): Promise<Quest> {
  const questUser = [
    bibleBlock(opts.bible),
    ``, chainStateBlock(opts.state),
    ``, `## ACTIVE HOOK THAT OPENED THIS CHAIN`, opts.drivingHook,
    ``, pacingBlock(opts.step, opts.pacing),
    ``, `Write quest #${opts.step}. Output JSON only.`,
  ].join('\n');
  return callJson(client, { system: QUEST_WRITER_SYSTEM, user: questUser, schema: QuestSchema, model: opts.model ?? QUEST_MODEL, effort: opts.effort ?? QUEST_EFFORT });
}

export async function resolveQuest(
  client: OpenAI,
  opts: { bible: Bible; state: ChainState; quest: Quest; outcome: Outcome; assignedDesc: string; isFinal: boolean; model?: string; effort?: Effort },
): Promise<Resolution> {
  const outcomeBlock = [
    `## OUTCOME (engine-decided)`,
    `- tier: ${opts.outcome}`,
    `- assigned units: ${opts.assignedDesc}`,
    opts.isFinal ? `- THIS IS THE FINAL QUEST OF THE CHAIN — close the arc.` : `- the chain continues after this.`,
  ].join('\n');
  const resolveUser = [
    bibleBlock(opts.bible),
    ``, chainStateBlock(opts.state),
    ``, `## QUEST JUST ATTEMPTED`,
    `card: ${opts.quest.card}`,
    `hiddenPurpose: ${opts.quest.hiddenPurpose}`,
    `revealOnSuccess: ${(opts.quest.revealOnSuccess ?? []).join(' | ') || '(none)'}`,
    `revealOnFailure: ${(opts.quest.revealOnFailure ?? []).join(' | ') || '(none)'}`,
    ``, outcomeBlock,
    ``, `Resolve it. Output JSON only.`,
  ].join('\n');
  return callJson(client, { system: RESOLVER_SYSTEM, user: resolveUser, schema: ResolutionSchema, model: opts.model ?? QUEST_MODEL, effort: opts.effort ?? QUEST_EFFORT });
}

/** Qualitative party-fit judgement (AI owns the match; engine owns thresholds). */
export async function assessFit(
  client: OpenAI,
  opts: { quest: Quest; party: { name: string; tags: string[]; background: string }[]; model?: string; effort?: Effort },
): Promise<FitJudgement> {
  const partyBlock = opts.party.length
    ? opts.party.map((m) => `- ${m.name} [${m.tags.join(', ') || 'no tags'}] — ${m.background}`).join('\n')
    : '- (no one was assigned)';
  const user = [
    `## JOB`,
    `card: ${opts.quest.card}`,
    `desired stats: ${(opts.quest.assignmentAsk.desiredStats ?? []).join(', ') || '—'}`,
    `desired traits: ${(opts.quest.assignmentAsk.desiredTraits ?? []).join(', ') || '—'}`,
    opts.quest.assignmentAsk.fictionalReason ? `because: ${opts.quest.assignmentAsk.fictionalReason}` : ``,
    ``, `## ASSIGNED PARTY`, partyBlock,
    ``, `Rate the party's fit. Output JSON only.`,
  ].filter(Boolean).join('\n');
  const raw = await callJson(client, { system: FIT_JUDGE_SYSTEM, user, schema: FitSchema, model: opts.model ?? FIT_MODEL, effort: opts.effort ?? FIT_EFFORT });
  const n = typeof raw.partyFit === 'number' ? raw.partyFit : parseInt(String(raw.partyFit), 10);
  const partyFit = Number.isFinite(n) ? Math.max(0, Math.min(6, Math.round(n))) : 0;
  return { partyFit, note: raw.note ?? '' };
}

// ---------------------------------------------------------------------------
// Display (used by CLIs)
// ---------------------------------------------------------------------------
export function renderBible(seed: Seed, genesis: Genesis, bible: Bible): string {
  const L: string[] = [];
  L.push(`# BIBLE — "${bible.title}"`);
  L.push(`seed: [${seed.id}] ${seed.spark}`);
  L.push(`      (${seed.situation} · ${seed.emotionalCore} · ${seed.stakes})`);
  L.push(``);
  L.push(`## GENESIS (collision)`);
  L.push(genesis.kernel);
  if (genesis.newRoleNeeded) L.push(`(coined role: ${genesis.newRoleNeeded})`);
  L.push(``);
  L.push(`## LEAD BLURB (player sees this, nothing more)`);
  L.push(`"${bible.leadBlurb}"`);
  L.push(``);
  L.push(`## SITUATION (hidden truth)`);
  L.push(bible.situation);
  L.push(``);
  L.push(`## CAST`);
  for (const c of bible.cast) {
    const p = c.person;
    L.push(`### ${p.name}${c.roleInStory ? ` — ${c.roleInStory}` : ''}${c.coined ? ' [NEW]' : ''}`);
    L.push(`who: ${p.who}`);
    L.push(`history (why-ladder):`);
    p.history.forEach((h, i) => L.push(`  ${i + 1}. ${h}`));
    L.push(`wants: ${p.wants}`);
    L.push(`feels: ${p.feels}`);
    const concealsStr = concealsLine(p.conceals);
    if (concealsStr) L.push(`conceals: ${concealsStr}`);
    L.push(``);
  }
  L.push(`## TENSIONS`);
  bible.tensions.forEach((t) => L.push(`- ${tensionLine(t as string | Record<string, unknown>)}`));
  L.push(``);
  L.push(`## OPEN DIRECTIONS`);
  bible.openDirections.forEach((d) => {
    if (typeof d === 'string') { L.push(`- ${d}`); return; }
    const tag = d.kind ? `[${d.kind}] ` : '';
    L.push(`- ${tag}${d.hook}`);
  });
  return L.join('\n');
}
