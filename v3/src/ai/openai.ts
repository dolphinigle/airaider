// OpenAI provider — gpt-5-mini (writer/genesis/resolution/theme), gpt-5-nano (selector).
// Every response zod-validated; the engine canonicalizes tags and guards names/edges.
// Key from OPENAI_API_KEY via ../.env or ~/.airaider/openai.env (never printed/committed).

import OpenAI from 'openai';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  AiProvider, AiUsage, QuestWriteInput, QuestWriteOut, GenesisInput, GenesisOut,
  ResolveQuestInput, ResolveQuestOut, ThemeRollInput, ThemeRollOut, SelectorInput,
} from './provider.js';

const WRITER_MODEL = 'gpt-5-mini';
const NANO_MODEL = 'gpt-5-nano';

function loadKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const p of [path.resolve(process.cwd(), '../.env'), path.resolve(process.cwd(), '.env'), path.join(os.homedir(), '.airaider/openai.env')]) {
    try {
      const txt = fs.readFileSync(p, 'utf8');
      const m = txt.match(/OPENAI_API_KEY\s*=\s*"?([^"\n]+)"?/);
      if (m) return m[1]!.trim();
    } catch { /* next */ }
  }
  throw new Error('OPENAI_API_KEY not found (set env or .env / ~/.airaider/openai.env)');
}

// ---- schemas (permissive; engine guards after) --------------------------------------------

/** array-of-strings — tolerate a bare string (the model sometimes collapses singletons) */
const zStrArr = z.union([z.array(z.string()), z.string(), z.null()]).default([]).transform(v =>
  v === null ? [] : typeof v === 'string' ? (v ? [v] : []) : v);

/** importance 0..1 — tolerate numbers, numeric strings, and band words */
const zImportance = z.union([z.number(), z.string()]).default(0.4).transform(v => {
  if (typeof v === 'number') return Math.max(0, Math.min(1, v));
  const n = parseFloat(v);
  if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
  const words: Record<string, number> = { core: 0.85, defining: 0.9, high: 0.8, medium: 0.5, mid: 0.5, low: 0.3, trivial: 0.15 };
  return words[v.toLowerCase().trim()] ?? 0.4;
});

const zAsk = z.object({
  attribute: z.string(),
  extraAttribute: z.string().nullish(),
  favored: zStrArr,
  clashing: zStrArr,
});
const zQuestWrite = z.object({
  title: z.string(),
  situation: z.string(),
  job: z.string(),
  ask: z.array(zAsk).default([]),
  proposedRewardKind: z.string().nullish(),
  closesChain: z.union([z.boolean(), z.string(), z.null()]).nullish()
    .transform(v => typeof v === 'string' ? ['true', 'yes'].includes(v.toLowerCase()) : v ?? undefined),
  approaches: z.array(z.object({
    label: z.string(), rewardKind: z.string().default('gold'),
    attribute: z.string().default('cha'), favored: zStrArr,
  })).nullish(),
});
const zGenesis = z.object({
  title: z.string(),
  kernel: z.string(),
  cast: z.array(z.object({
    name: z.string(), who: z.string(), want: z.string().default(''),
    role: z.string().default(''), loreId: z.string().nullish(),
  })).default([]),
  situation: z.string(),
  goal: z.string().default(''),
  arc: zStrArr,
  twistReveal: z.string().nullish(),
  tensions: zStrArr,
  openDirections: zStrArr,
  relevantIds: zStrArr,
  newPlaces: z.array(z.object({ name: z.string(), blurb: z.string().default('') })).default([]),
  newEdges: z.array(z.object({
    from: z.string(), to: z.string(), type: z.string(),
    blurb: z.string().default(''), importance: zImportance,
  })).default([]),
});
const zResolveOne = z.object({
  questId: z.string(),
  before: z.string(),
  after: z.string(),
  injuries: z.array(z.object({
    characterId: z.string(),
    band: z.enum(['none', 'low', 'med', 'high']).default('none'),
  })).default([]),
  fleshed: z.array(z.object({
    characterId: z.string(), who: z.string().default(''),
    backstory: z.string().default(''), quirks: zStrArr,
  })).default([]),
  edges: z.array(z.object({
    from: z.string(), to: z.string(), type: z.string(),
    blurb: z.string().default(''), importance: zImportance,
  })).default([]),
  storyUpdate: z.object({
    currentSituation: z.string(),
    newlyRevealed: zStrArr,
    openThreads: zStrArr,
  }).nullish(),
});
const zTheme = z.object({ wants: zStrArr, flavorLine: z.string().default('') });
const zSelect = z.object({ ids: zStrArr });

// ---- shared rules blocks ---------------------------------------------------------------------

const NUMBER_BAN =
  'HARD RULES: never output numbers, prices, dice, or difficulty values — the engine owns all numbers. ' +
  'Never invent character NAMES — use exactly the names given to you. Keep prose tight; low-medieval register, no modern idiom.';

const EDGE_TYPES_LINE =
  'edge types (use ONLY these): rival-of, scarred-by, bonded-by, owes, saved-by, kin-of, betrayed-by, served-with, born-in, member-of, captive-of, loves, fears, defeated, freed-by, party-to. ' +
  'Direction: from = the state-holder (the betrayed, the debtor, the rescued).';

export function makeOpenAiProvider(): AiProvider {
  const client = new OpenAI({ apiKey: loadKey() });
  const usage: AiUsage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

  async function call<S extends z.ZodTypeAny>(model: string, system: string, user: string, schema: S): Promise<z.output<S>> {
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
    });
    usage.calls++;
    usage.inputTokens += res.usage?.prompt_tokens ?? 0;
    usage.outputTokens += res.usage?.completion_tokens ?? 0;
    // rough gpt-5-mini pricing guess for the meter only
    usage.costUsd += ((res.usage?.prompt_tokens ?? 0) * 0.25 + (res.usage?.completion_tokens ?? 0) * 2) / 1e6;
    const raw = res.choices[0]?.message?.content ?? '{}';
    return schema.parse(JSON.parse(raw));
  }

  return {
    name: 'openai',
    usage: () => ({ ...usage }),

    async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
      const system = [
        'You write quest cards for a dark-fantasy mercenary-company game. POV-locked: only what arrives at the fort gate. State the job plainly.',
        NUMBER_BAN,
        'Respond as JSON: {title, situation (2-3 sentences), job (1 sentence), ask: [{attribute (str|dex|int|cha|con), extraAttribute?, favored: [skill words], clashing: [words]}] — one per slot,',
        'proposedRewardKind? (gold|captive|recruit|relic), closesChain? (beats only), approaches? (finale only: [{label, rewardKind (recruit|captive|gold), attribute, favored}]) }.',
        'Favored/clashing must come from: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food — or personality words (cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive).',
        input.kind === 'beat' ? 'This is ONE BEAT of an ongoing saga: reveal at most 1 new layer; react to the story state; beat 1 makes the player CARE (a low-stakes shared moment) before plot pressure.' : '',
        input.kind === 'finale' ? 'This is the FINALE: write 2-3 mutually exclusive APPROACHES (win over / subdue / cash out — fit the fiction), each testing a different attribute.' : '',
      ].filter(Boolean).join('\n');
      const user = JSON.stringify({
        archetype: input.archetype, region: input.region, regionLore: input.regionSeed,
        rarity: input.rarity, slotCount: input.slotCount, rewardEnvelope: input.rewardEnvelope,
        KEYWORDS: input.keywords.join(', ') || undefined,
        framedCharacter: input.framedCharacter,
        bible: input.bible, storyState: input.storyState,
        beat: input.beatIndex, expectedBeats: input.expectedBeats, focalName: input.focalName,
      });
      const out = await call(WRITER_MODEL, system, user, zQuestWrite);
      return {
        ...out,
        proposedRewardKind: out.proposedRewardKind ?? undefined,
        closesChain: out.closesChain ?? undefined,
        approaches: out.approaches ?? undefined,
        ask: out.ask.map(a => ({ ...a, extraAttribute: a.extraAttribute ?? null, requirementTag: null })),
      };
    },

    async genesis(input: GenesisInput): Promise<GenesisOut> {
      const system = [
        'You are the writers\'-room for a saga in a dark-fantasy mercenary-fort game. Build a hidden BIBLE: settled truth, told plainly — mystery is the quest-writer\'s job later.',
        'Collide the SEED with the SLATE into a one-line KERNEL. Pick 1-3 core people; the FOCAL MUST be core. LEAN cast: one line + want + role each, no essays. Reuse slate people before coining new ones.',
        NUMBER_BAN,
        EDGE_TYPES_LINE,
        'If you coin NEW people, take names strictly from assignedNames (in order). New places may be freely named.',
        'Respond as JSON: {title, kernel, cast:[{name, who, want, role, loreId?}], situation, goal, arc:[3-5 rough steps], twistReveal (null unless twist=true), tensions:[], openDirections:[2],',
        'relevantIds:[slate ids actually used], newPlaces:[{name,blurb}], newEdges:[{from,to,type,blurb,importance: a NUMBER 0-1}] (ids only from the slate/focal)}.',
      ].join('\n');
      const out = await call(WRITER_MODEL, system, JSON.stringify(input), zGenesis);
      return {
        ...out,
        twistReveal: out.twistReveal ?? null,
        cast: out.cast.map(c => ({ ...c, loreId: c.loreId ?? undefined })),
      };
    },

    async resolve(inputs: ResolveQuestInput[]): Promise<ResolveQuestOut[]> {
      // one batched call per quest, fired in parallel (the cycle's single reckoning)
      const system = [
        'You narrate quest resolutions for a dark-fantasy mercenary game. Produce, in order:',
        '1) "before": the lead-in, written WITHOUT looking at the outcome — a neutral setup that cannot leak it (2-3 sentences).',
        '2) "after": what happened, knowing the outcome (2-4 sentences). Give EVERY party member their own beat driven by their tags/quirks/dossier — never the party as a blob. Name the delivered rewards exactly as given.',
        'Injuries: judge from the fiction per member (none/low/med/high) — typically on failure, sometimes none even then; never death.',
        'Flesh each delivered character: who (one line), backstory (2 sentences), quirks (1-2 concrete habits).',
        NUMBER_BAN, EDGE_TYPES_LINE,
        'Memory edges: 0-2 per quest, only for moments that should be REMEMBERED. importance is a NUMBER between 0 and 1 (0.8+ = defining/core). Use character ids given.',
        'Respond as JSON matching: {questId, before, after, injuries:[{characterId,band}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}], storyUpdate?:{currentSituation,newlyRevealed,openThreads}}',
      ].join('\n');
      const outs = await Promise.all(inputs.map(q =>
        call(WRITER_MODEL, system, JSON.stringify(q), zResolveOne).catch((e): ResolveQuestOut => {
          if (process.env.AI_DEBUG) console.error(`[ai] resolve fallback for ${q.questId}:`, (e as Error).message?.slice(0, 500));
          return fallbackResolve(q);
        })));
      return outs.map(o => ({ ...o, storyUpdate: o.storyUpdate ?? undefined }));

      function fallbackResolve(q: ResolveQuestInput): ResolveQuestOut {
        return ({
          questId: q.questId,
          before: `${q.party.map(p => p.name).join(', ')} set out.`,
          after: q.outcome === 'success' ? `It goes their way: ${q.deliveredSummary}.` : q.outcome === 'partial' ? `A messy half-win: ${q.deliveredSummary}.` : 'It comes apart, and they walk home with nothing.',
          injuries: [], fleshed: [], edges: [],
        });
      }
    },

    async themeRoll(input: ThemeRollInput): Promise<ThemeRollOut> {
      const system = [
        'A player renovates a fort room in a style. Choose 3-5 wanted tag WORDS for the room theme — strictly from the provided vocabulary list. One flavor line.',
        NUMBER_BAN,
        'Respond as JSON: {wants:[words], flavorLine}',
      ].join('\n');
      return call(WRITER_MODEL, system, JSON.stringify(input), zTheme);
    },

    async select(input: SelectorInput): Promise<string[]> {
      const system = 'Pick which candidates need FULL dossier context for the writing task. Respond as JSON: {ids:[...]} — at most the requested max. Ids exactly as given.';
      const out = await call(NANO_MODEL, system, JSON.stringify(input), zSelect);
      const legal = new Set(input.candidates.map(c => c.id));
      return out.ids.filter(id => legal.has(id.replace(/^id=/, ''))).slice(0, input.max);
    },
  };
}
