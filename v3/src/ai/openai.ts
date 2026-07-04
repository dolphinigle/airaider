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
  FleshInput, FleshOut,
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
const zFleshBatch = z.object({
  people: z.array(z.object({
    characterId: z.string(),
    who: z.string().default(''),
    backstory: z.string().default(''),
    quirks: zStrArr,
  })).default([]),
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

  /** one retry on parse/validation failure — a single hiccup must not ship fallback prose */
  async function callR<S extends z.ZodTypeAny>(model: string, system: string, user: string, schema: S): Promise<z.output<S>> {
    try { return await call(model, system, user, schema) }
    catch (e) {
      if (process.env.AI_DEBUG) console.error('[ai] retrying after:', (e as Error).message?.slice(0, 200));
      return call(model, system, user, schema);
    }
  }

  return {
    name: 'openai',
    usage: () => ({ ...usage }),

    async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
      const system = [
        'You write quest cards for a dark-fantasy mercenary-company game. POV-locked: the player knows only what reaches the fort. State the job plainly.',
        'BANNED CRUTCH: no ledgers/manifests/record-books as plot objects (grossly overused).',
        'VARIETY RULES: (1) LANDMARK — use the regionLore landmark in at most 1 card in 4; when you do, NEVER repeat its stock epithet — describe it freshly or leave it unnamed. Prefer the fresh placeNameSuggestions or coin hamlets/waysides/crossings. (2) ARRIVAL — a petitioner at the gate is only ONE mode; rotate: a nailed posting or writ · a returning patrol\'s report · a prisoner or survivor brought in · wreckage or a body found on the road · a summons FROM the fort outward · rumor at market. (3) SEEDS — every KEYWORDS seed must be LOAD-BEARING in the job or its twist; if a seed cannot serve the premise, transform it — never display it at the gate and drop it.',
        'ROSTER RULE: rosterNames are the player\'s own soldiers — the ones who will be SENT. NEVER write them (or near-variants of their names) as petitioners, clients, claimants, victims, or opponents in the card fiction.',
        NUMBER_BAN,
        'Respond as JSON: {title, situation (2-3 sentences), job (1 sentence), ask: [{attribute (str|dex|int|cha|con), extraAttribute?, favored: [skill words], clashing: [words]}] — one per slot,',
        'proposedRewardKind? (gold|captive|recruit|relic), closesChain? (beats only), approaches? (finale only: [{label, rewardKind (recruit|captive|gold), attribute, favored}]) }.',
        'Favored/clashing must come from: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food — or personality words (cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive).',
        input.kind === 'beat' ? 'This is ONE BEAT of an ongoing saga: reveal at most 1 new layer. BEAT 1 IS THE CARE BEAT: before any plot pressure, give one small HUMAN moment with the focal person — something concrete to like, pity, or worry about (how they treat an animal, what they carry, what they refuse to say) — and keep the job itself low-stakes and shared. THE BEAT MUST ADVANCE: open on a situation lastBeatOutcome CREATED; you may NOT re-pose the previous beat\'s job — the objective must be materially different (new location, new claimant, new leverage, or raised stakes).' : '',
        input.kind === 'finale' ? 'This is the FINALE: write 2-3 mutually exclusive APPROACHES (win over / subdue / cash out — fit the fiction), each testing a different attribute.' : '',
      ].filter(Boolean).join('\n');
      const user = JSON.stringify({
        archetype: input.archetype, region: input.region, regionLore: input.regionSeed,
        rarity: input.rarity, slotCount: input.slotCount, rewardEnvelope: input.rewardEnvelope,
        KEYWORDS: input.keywords.join(', ') || undefined,
        placeNameSuggestions: input.placeNameSuggestions,
        rosterNames: input.rosterNames,
        lastBeatOutcome: input.lastBeatOutcome,
        framedCharacter: input.framedCharacter,
        bible: input.bible, storyState: input.storyState,
        beat: input.beatIndex, expectedBeats: input.expectedBeats, focalName: input.focalName,
      });
      const out = await callR(WRITER_MODEL, system, user, zQuestWrite);
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
        'WANTS MUST BE HUMAN and specific — "to bury her brother where their mother lies", never "power" or "to come out ahead". The focal\'s want is the saga\'s heart: make it something a player could root for or against.',
        NUMBER_BAN,
        EDGE_TYPES_LINE,
        'If you coin NEW people, take names strictly from assignedNames (in order). New places may be freely named.',
        'BANNED CRUTCH: do NOT center the saga on a ledger, manifest, record-book, or registry (grossly overused). Vary the plot object per the keywords.',
        'Slate people marked as the player\'s own soldiers may be cast ONLY as the company\'s own people (comrades, escorts) — never as clients, claimants, victims, or antagonists.',
        'Respond as JSON: {title, kernel, cast:[{name, who, want, role, loreId?}], situation, goal, arc:[3-5 rough steps], twistReveal (null unless twist=true), tensions:[], openDirections:[2],',
        'relevantIds:[slate ids actually used], newPlaces:[{name,blurb}], newEdges:[{from,to,type,blurb,importance: a NUMBER 0-1}] (ids only from the slate/focal)}.',
      ].join('\n');
      const out = await callR(WRITER_MODEL, system, JSON.stringify(input), zGenesis);
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
        '1) "before": ONE short clause of departure tension, written WITHOUT looking at the outcome — it must ADD something (weather, a doubt, a detail), never restate the card.',
        '2) "after": what happened, knowing the outcome. Give EVERY party member their own beat SHOWN through one concrete physical action — NEVER use their trait word or its adverb (no "playful", "instinctive", "calculating" in prose). WEAVE the delivered rewards into the action ("the brewer counted out eighty gold and pressed the broken blade into his hands") — never a trailing "Item, N gold" list, never the deliveredSummary string verbatim, never "(npc)" or any parenthetical role.',
        'CONTINUITY IS THE PRODUCT: each dossier lists known-as, habits, and memories — when one is RELEVANT, let it surface (a quirk performed under stress, an old wound remembered at the wrong moment, two members who served together moving as a pair). Never info-dump a dossier; one touch per person at most.',
        'On failure: state in-fiction what the party came home without — NEVER the canned words "the reward is lost" or "nothing —".',
        'WORD BUDGET by rarity: common → before 1 short clause, after 2 sentences MAX. uncommon → 1/3. rare or finale → 2/5. Respect it strictly.',
        'Injuries: judge from the fiction per member (none/low/med/high) — typically on failure, sometimes none even then; never death.',
        'NEVER declare recruitments, joinings, departures, deaths, or ownership changes — the ENGINE decides all dispositions; you narrate only what was delivered as given.',
        'Flesh each delivered character: who (one line), backstory (2 sentences), quirks (1-2 concrete habits).',
        NUMBER_BAN, EDGE_TYPES_LINE,
        'Memory edges: 0-2 per quest, only for moments that should be REMEMBERED. importance is a NUMBER between 0 and 1 (0.8+ = defining/core). Use character ids given.',
        'storyUpdate.currentSituation must state CONCRETELY what changed (who holds what, who moved where) — never a vague "the trail continues".',
        'Respond as JSON matching: {questId, before, after, injuries:[{characterId,band}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}], storyUpdate?:{currentSituation,newlyRevealed,openThreads}}',
      ].join('\n');
      const outs = await Promise.all(inputs.map(q =>
        callR(WRITER_MODEL, system, JSON.stringify(q), zResolveOne).catch((e): ResolveQuestOut => {
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

    async flesh(inputs: FleshInput[]): Promise<FleshOut[]> {
      if (!inputs.length) return [];
      const system = [
        'You breathe life into characters of a dark-fantasy mercenary company. For EACH person given, write:',
        '- who: ONE line they would be known by around the fort — specific and human, never generic ("keeps the night watch nobody else wants" beats "a brave fighter").',
        '- backstory: 2 sentences of origin that FIT their tags and how they arrived. Give each one thing to love, pity, or worry about.',
        '- quirks: 1-2 concrete PHYSICAL habits a watcher could notice (an action, never an adjective).',
        'Make the people DISTINCT from each other. Low-medieval register.',
        NUMBER_BAN,
        'Respond as JSON: {people:[{characterId, who, backstory, quirks:[...]}]} — ids exactly as given.',
      ].join('\n');
      const out = await callR(WRITER_MODEL, system, JSON.stringify(inputs), zFleshBatch);
      const legal = new Set(inputs.map(i => i.characterId));
      return out.people.filter(p => legal.has(p.characterId));
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
