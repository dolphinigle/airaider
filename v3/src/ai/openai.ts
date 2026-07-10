// OpenAI provider — gpt-5-mini (writer/genesis/resolution/theme), gpt-5-nano (selector).
// Every response zod-validated; the engine canonicalizes tags and guards names/edges.
// Key from OPENAI_API_KEY via ../.env or ~/.airaider/openai.env (never printed/committed).

import OpenAI from 'openai';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  AiProvider, AiUsage, AiCallRecord, QuestWriteInput, QuestWriteOut, GenesisInput, GenesisOut,
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
  (v === null ? [] : typeof v === 'string' ? (v ? [v] : []) : v).map(s => desemi(s)));

/** prose with a hard max-length guardrail (STORY_ENGINE §10: soft-clamp, never reject-to-fallback) */
// clamp at a SENTENCE boundary when one exists in the tail — a hidden truth ending
// "…renounce the…" handed every beat writer a broken fact.
// SEMICOLON SPLITTER: the no-semicolon rule was ignored ~23×/campaign — prose semicolons
// splice independent clauses, so splitting into two sentences is mechanically safe here
const desemi = (s: string) => s
  .replace(/;\s+(\S)/g, (_, c: string) => `. ${c.toUpperCase()}`)
  .replace(/—\s*(and|but|then|so)\s*$/i, '—');   // dangling conjunction after a brink em-dash
const zProse = (max: number) => z.string().transform(raw => {
  const s = desemi(raw);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : cut.replace(/\s+\S*$/, '') + '…';
});
const zProseD = (max: number) => zProse(max).catch('').default('');

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
  requiredTag: z.string().nullish(),
  mustBeFocal: z.union([z.boolean(), z.string(), z.null()]).nullish()
    .transform(v => typeof v === 'string' ? ['true', 'yes'].includes(v.toLowerCase()) : v ?? undefined),
});
const zQuestWrite = z.object({
  title: zProse(90),
  situation: zProse(1200),   // the merged card: 1-3 short paragraphs (2026-07-06 ruling)
  job: zProse(240),
  ask: z.array(zAsk).default([]),
  quarryTags: z.array(z.string()).nullish().transform(v => v ?? undefined),
  approaches: z.array(z.object({
    label: z.string(), rewardKind: z.string().default('gold'),
    attribute: z.string().default('cha'), favored: zStrArr,
  })).nullish(),
});
const zGenesis = z.object({
  title: zProse(90),
  kernel: zProse(320),
  cast: z.array(z.object({
    name: z.string(), who: zProse(240), want: zProseD(200),
    role: z.string().default(''), loreId: z.string().nullish(),
  })).default([]),
  situation: zProse(1100),
  goal: zProseD(400),
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
  before: zProse(800),
  after: zProse(1400),
  injuries: z.array(z.object({
    characterId: z.string(),
    band: z.enum(['none', 'low', 'med', 'high']).default('none'),
    cause: z.string().nullish(),   // must quote the model's own after-text (engine verifies)
  })).default([]),
  fleshed: z.array(z.object({
    characterId: z.string(), who: zProseD(240),
    backstory: zProseD(700), quirks: zStrArr,
  })).default([]),
  edges: z.array(z.object({
    from: z.string(), to: z.string(), type: z.string(),
    blurb: z.string().default(''), importance: zImportance,
  })).default([]),
  storyUpdate: z.object({
    currentSituation: z.string().transform(desemi),
    newlyRevealed: zStrArr,
    openThreads: zStrArr,
    sagaSettled: z.union([z.boolean(), z.string(), z.null()]).nullish()
      .transform(v => typeof v === 'string' ? ['true', 'yes'].includes(v.toLowerCase()) : v ?? undefined),
  }).nullish(),
});
const zFleshBatch = z.object({
  people: z.array(z.object({
    characterId: z.string(),
    who: zProseD(240),
    backstory: zProseD(700),
    quirks: zStrArr,
  })).default([]),
});
const zTheme = z.object({ wants: zStrArr, flavorLine: z.string().default('') });
const zSelect = z.object({ ids: zStrArr });

// ---- shared rules blocks ---------------------------------------------------------------------

const NUMBER_BAN =
  'HARD RULES: never write numbers, prices, or amounts in PROSE — the engine owns all numbers (sole exception: a JSON field whose schema itself demands a number). ' +
  'Character names must come from the names this message gives you — never coin your own. Keep prose tight; plain low register — no archaic diction, no modern idiom, no counting-house idiom (nothing is "filed", "processed", or "registered" — grievances are spoken, posted, or sworn), and no object or term from after the age of candles and horses; concrete nouns. ' +
  'BANNED purple words: "weight", "shadow", "burden", "fate", "destiny".';

const TAGS_NOTE =
  'TAGS NOTATION (wherever character tags appear in this message): tags read "word (rank)" — the rank marks how pronounced that trait is (low < mid < high < legendary; no rank = simply present). ' +
  'The words name a race or sex, a trade, skills (e.g. "food" = cookery, "lore" = book-learning, "nature" = field-and-wood craft), temperament, or LOOKS — appearance words describe appearance only. Never contradict a tag; never echo TRAIT words verbatim in prose (race and sex words are fine to use).';

const EDGE_TYPES_LINE =
  'edge types (use ONLY these): rival-of, scarred-by, bonded-by, owes, saved-by, kin-of, betrayed-by, served-with, born-in, member-of, captive-of, loves, fears, defeated, freed-by, party-to. ' +
  'Direction: from = the state-holder (the betrayed, the debtor, the rescued); "defeated" runs winner→loser; for symmetric types (rival-of, kin-of, bonded-by, served-with, party-to) either direction serves. People-to-people ties only.';

export function makeOpenAiProvider(): AiProvider {
  const client = new OpenAI({ apiKey: loadKey() });
  const usage: AiUsage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const records: AiCallRecord[] = [];
  let purposeCtx = '?';           // set by each public method before calling

  async function call<S extends z.ZodTypeAny>(model: string, system: string, user: string, schema: S): Promise<z.output<S>> {
    const t0 = Date.now();
    const rec: AiCallRecord = {
      n: usage.calls + 1, purpose: purposeCtx, model, durationMs: 0,
      inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, ok: false,
      systemPreview: system, userPrompt: user.slice(0, 20000),
    };
    records.push(rec);
    if (records.length > 120) records.splice(0, records.length - 120);
    try {
      // effort per tier (STORY_ENGINE §10.5): prose at low (PROMPTS.md — latency is gameplay),
      // the mechanical nano tier at minimal
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' },
        reasoning_effort: model === NANO_MODEL ? 'minimal' : 'low',
      } as never) as OpenAI.Chat.Completions.ChatCompletion;
      usage.calls++;
      const inTok = res.usage?.prompt_tokens ?? 0;
      const outTok = res.usage?.completion_tokens ?? 0;
      const cached = (res.usage as { prompt_tokens_details?: { cached_tokens?: number } } | undefined)
        ?.prompt_tokens_details?.cached_tokens ?? 0;
      usage.inputTokens += inTok;
      usage.outputTokens += outTok;
      // rough gpt-5-mini pricing for the meter (cached input at 10%)
      const cost = ((inTok - cached) * 0.25 + cached * 0.025 + outTok * 2) / 1e6;
      usage.costUsd += cost;
      rec.durationMs = Date.now() - t0;
      rec.inputTokens = inTok; rec.outputTokens = outTok; rec.cachedTokens = cached; rec.costUsd = cost;
      const raw = res.choices[0]?.message?.content ?? '{}';
      rec.output = raw.slice(0, 8000);
      const out = schema.parse(JSON.parse(raw));
      rec.ok = true;
      return out;
    } catch (e) {
      rec.durationMs = Date.now() - t0;
      rec.error = (e as Error).message?.slice(0, 300);
      throw e;
    }
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
    callLog: () => [...records],

    async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
      purposeCtx = 'writeQuest';
      const system = [
        'You write ONE job card for a dark-fantasy mercenary-fort GAME. The player is the company BOSS at the fort; the card is a short briefing TO them ("you"): what came in, what the job is, what it pays. They read it and pick which soldiers to SEND — the boss never goes, and the job has not started. Only what has reached the fort goes on the card; events elsewhere are report, not scene.',
        'GAME WRITING, not literature. Every sentence must give the player something they can use: the problem, the place, the client, the task, the hands it needs, the pay, or the risk — a sentence that only adds mood or fine phrasing is cut. PLAIN ENGLISH a tired player skims once and gets: common everyday words — if a farmhand would not say the word, use the plain one instead — short sentences of mostly one clause, no semicolons (split into two sentences). Second person throughout (never "us/we"). People stay NAMELESS BY TRADE — a name appears only when this message hands you one, and only for someone the job centers on: an anonymous petitioner keeps a small job small.',
        'YOUR INPUTS, field by field:',
        '- location: the land and its anchor facts. A named landmark may be used — bare, never with an attached epithet phrase; other places from placeNameSuggestions or coined hamlets, waysides, crossings.',
        input.intake ? '- intake: HOW this matter reached the company — a settled FACT, not a suggestion: the opening must agree with it (one clause at most spent on it; never quote its wording).' : '',
        input.opening ? '- opening.spark: color seed for the opening — build it your own way; never quote its wording. Time of day only when it matters to the job — never the card\'s first words.' : '',
        '- KEYWORDS (when given): optional sparks — use what serves the premise, drop the rest. Never quote a phrase\'s wording (rebuild it in your own); a single-word thing may simply be named.',
        '- gravity (when given): sets TONE only — a small everyday job reads brisk and workmanlike; a serious matter reads straight; only a grave affair reads heavy. rarity sets SIZE and length: common = local trouble told short whatever its tone; uncommon and rare may run bigger. slotCount: how many soldiers the job takes.',
        '- rewardEnvelope: the shape of the payout — the fiction must make that shape plausible and the pay plain (they work for pay; never a payoff-free plea). A person may be promised (rescued, captured, brought back) ONLY when the envelope grants a person; a goods-only envelope promises goods. rewardItems (when given): the prize objects — they end in the COMPANY\'s hands, never promised away to a client; when one is a thing a client seeks, the premise must say why the company keeps it (payment in kind, unclaimed salvage, a client who only wants the matter settled). The company\'s stores hold ONLY what this message lists — never write that a thing already sits at the fort.',
        '- archetype (when given): raid = hit a holdout for spoils; capture = take someone alive; rescue = free someone held; escort = guard on a journey; investigate = uncover a hidden thing; hunt = track down a person or beast; contract = an agreed task for set pay (the work itself is the premise, not a mystery); lead-hunt = sweep for rumors. The job matches it, specific to this place.',
        '- rosterNames + rosterPronouns: the player\'s soldiers — the WHOLE company (never invent other company men; village folk and their own watch are fine), sendable candidates only: never clients, victims, or foes.',
        '- framedCharacter (when given): the person the job delivers — the one person who MUST carry their given name; the card must match them exactly (name, pronoun, tags). A dossier or lastSeen means the world already knows them: continue their story — another try at a known matter, never fresh news, retold in NEW words (never copy lastSeen\'s wording — but its FACTS are settled: captors, place, and cause may not change on the retelling). npcNameSuggestions (when given): names for at most one or two others, only if the job truly needs them named.',
        '- avoid (when given): the player\'s recent cards — different premise, different props, and never reuse a name from them.',
        'YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?}], quarryTags?}. Field by field:',
        '- title: a short, concrete card name — never prefixed with the archetype label.',
        '- situation: THE card the player reads. A common card = 3-5 short sentences, never more, whatever its gravity; uncommon and rare may take up to three short paragraphs. Shape: THE MATTER ITSELF FIRST — what is wrong and where — then who wants it done (how word reached you is worth one clause at most, and when the matter is visible from the walls or already known, no bringer is needed at all) → the task, the hands it wants, the pay and risk. Never open on the arrival of a messenger. The task must be unmistakable from this text alone. A client\'s exact words may be quoted when they matter — never as a ritual. Vary how the card closes: a fixed forecast shape ("Expect …") is a stamp; most cards need no forecast line at all.',
        '- job (ONE terse line): the task summarized for the boss\'s lists — the situation stands alone without it; never copy its sentences; no names the situation did not introduce.',
        '- ask: EXACTLY slotCount entries — one per soldier the job needs. attribute (str|dex|int|cha|con): what the test truly demands — force→str, stealth or speed→dex, wits→int, parley→cha, endurance→con; extraAttribute (same five) only when the work is genuinely two-natured. favored (ARRAY of 1-3 words): traits that help — matched against the sent soldier\'s tags; clashing (ARRAY of 0-2): traits that hurt. VOCABULARY for favored/clashing/requiredTag — skills: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food; personality: cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive; looks: tall, short, endowed, flat.',
        '- requiredTag (rare — at most ONE slot per card, most cards none): one vocabulary word the job truly DEMANDS; a soldier without it cannot take the slot. It may carry a rank — "word (mid)" — when mere dabbling won\'t do.',
        input.framedCharacter?.partial ? '- quarryTags (framedCharacter is PARTIAL — its tags carry just race and sex): up to 3 words that make the person your card describes, so the engine can build them to match. Draw from the ask vocabulary above, plus trades: ruler, soldier, criminal, priest, mystic, artisan, adventurer, entertainer, merchant, scholar, courtesan, sailor, slave, hunter, peasant, servant; and body words: muscular, scrawny, nimble, clumsy, clever, dull, beautiful, ugly, tough, sickly. Optional rank per word — "word (low|mid|high|legendary)" — for how pronounced.' : '- quarryTags: omit this field.',
        'ALWAYS: sentences read once and understood; orient a person ONCE, plainly; race named at most once and only when it matters; never echo these instructions or field names in prose. One prop is BANNED as a plot object (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name; any other period document serves.',
        TAGS_NOTE,
        NUMBER_BAN,
        input.kind === 'beat' ? 'THIS CARD IS ONE STEP OF AN ONGOING SAGA — same briefing voice ("you"), but skip broad region context: open on the ongoing matter and what has just changed. Where this saga block and the standalone rules above disagree, THIS BLOCK WINS. framedCharacter is a one-off field and absent here — the focal is NOT a framedCharacter, and quarryTags are never output on a saga step. Extra inputs: bible = the story\'s hidden settled truth (the player NEVER sees it; this card may surface at most ONE new layer of it). Its fields: kernel = the saga\'s one-line idea; situation = the full hidden truth; goal = what the company believes it is working toward — the job on THIS card may NEVER be, or complete, that goal before the finale: pose only this step\'s partial objective; arc = the rough step-by-step guide — this card covers arc step number beat and ONLY that step (beat 1 = the taking-up of the matter, never the whole errand). When lastBeatOutcome or storyState contradict the arc\'s step (a failure changed things), the STATE wins — re-derive this step\'s objective from where things actually stand, never from the plan; cast = its people, each with who / want / role (their function in the story — e.g. client, companion, quarry, obstacle, ally, prize); twist = a hidden fact that recontextualizes the goal mid-saga (may be null); tensions and openDirections = pressure notes: let ONE color this step\'s complication, never resolve them; the bible\'s title and any loreId or actorStates entries are internal bookkeeping — ignore them. People in this card may be named ONLY from bible.cast, rosterNames (appearing solely as the company\'s own), or relevantLore entries — no other names; these pools OVERRIDE the standalone name fence (anyone in them may be named when the card touches them), and a person named only inside bible.situation surfaces by name ONLY as this card\'s one revealed layer. Places the bible names outrank placeNameSuggestions. rewardEnvelope on a mid-saga step reads "side loot": minor incidental valuables a step MAY shake loose — the saga\'s true prize lands only at its finale, and the plain-profit rule is satisfied by pay PROMISED for the saga (a card is not payoff-free when the client\'s pay stands behind it) — and when this step\'s objective is a PERSON (found, freed, escorted), the card may promise that person-outcome: the goods-envelope governs incidental loot, never the saga\'s own objective. relevantLore (when given) = what the world already remembers around this saga: each entry is a person or place, with its tie (relationPhrase), its tag-line (blurb), and sometimes a fuller dossier of memories — the card must stay CONSISTENT with these. An entry flagged companySoldier is one of the player\'s own soldiers (the rosterNames rules apply); one flagged companyCaptive sits in the company\'s cells and cannot walk the world free — and NO ONE ELSE is in the company\'s custody: a person the world last saw slipping away or handed off is FREE, wherever they now stand. focalDossier (when given) = what the world currently remembers of the focal, fresher than the bible — any focal moment must fit it. storyState = what the player has seen so far: currentSituation = where things stand for them; knownToPlayer = facts they hold; openThreads = loose ends; introducedNames = people already met (bare name only; orient everyone else once). beat / expectedBeats = which step this is of how many. focalName = who the saga is about. lastBeatOutcome (when given) = what the previous step changed: open on the situation it CREATED and never re-pose the previous job — the objective must be materially different (new location, new claimant, new leverage, or raised stakes). Between steps the world moves ONLY as lastBeatOutcome says — never invent an offscreen capture, delivery, or rescue to set this card up. BEAT 1 IS THE CARE BEAT: before any plot pressure, one small HUMAN moment with the focal (this moment IS usable information — it tells the player who this person is, and satisfies the every-sentence rule), its aim set by their cast role — a focal to be helped, won, or claimed (companion, ally, prize) invites something to like or pity; a quarry or obstacle focal invites what the bible\'s own telling of them supports: wariness, dark curiosity, or pity for a hunted wretch (a quarry is not always a villain — never make a true villain lovable at beat 1); if the focal cannot be present at the fort, that moment arrives secondhand through a witness\'s detail. Keep beat 1 low-stakes — its profit may rest on the client\'s PROMISE; nothing needs shaking loose yet. Each ask entry MAY gain one optional field, so its shape is {attribute, extraAttribute?, favored, clashing, requiredTag?, mustBeFocal?} — include mustBeFocal: true ONLY when focalIsMerc is true and this step is about that soldier\'s own past (it pins the slot to them); otherwise omit the field entirely.' : '',
        input.kind === 'finale' ? 'THIS IS THE FINALE — it covers the bible arc\'s LAST step and must bring the matter to a head. It opens from storyState AS IT STANDS: what earlier steps already did (a quarry captured, a token delivered, a claim proven) STAYS done — the finale settles the matter from there and never re-stages an earlier success as still to do. It stands on ground and people the player has SEEN (storyState) — a bible place never yet shown may appear only introduced as new. And it never reframes the focal against the saga\'s own telling: a person the saga protected stays protected, an accused stays merely accused, unless a REVEALED twist says otherwise. slotCount here counts the mutually exclusive PLANS (one slot each): the company sends soldiers down ONE plan — never write a party of slotCount. rewardEnvelope here names the saga\'s central prize. Also output approaches: 2-3 mutually exclusive plans, each {label, rewardKind, attribute, favored} — rewardKind (recruit|captive|gold) is what that plan would NET the company (win them over → recruit, subdue → captive, cash out → gold — fit the fiction); each plan tests a different attribute. The player picks ONE. A plan\'s label may promise ONLY what its rewardKind delivers: recruit = they join the company, captive = the company holds them, gold = they pass out of the company\'s hands for value — never promise a fate (freedom, release, mercy) that no rewardKind grants.' : '',
      ].filter(Boolean).join('\n');
      const user = JSON.stringify({
        archetype: input.archetype, location: input.location,
        rarity: input.rarity, slotCount: input.slotCount, rewardEnvelope: input.rewardEnvelope,
        KEYWORDS: input.keywords?.join(', ') || undefined,
        gravity: input.gravity,
        rewardItems: input.rewardItems?.length ? input.rewardItems : undefined,
        placeNameSuggestions: input.placeNameSuggestions,
        npcNameSuggestions: input.npcNameSuggestions,
        rosterNames: input.rosterNames,
        rosterPronouns: input.rosterPronouns,
        lastBeatOutcome: input.lastBeatOutcome,
        framedCharacter: input.framedCharacter,
        avoid: input.avoid?.length ? input.avoid : undefined,
        bible: input.bible, storyState: input.storyState,
        relevantLore: input.relevantLore?.length ? input.relevantLore : undefined,
        focalDossier: input.focalDossier,
        beat: input.beatIndex, expectedBeats: input.expectedBeats, focalName: input.focalName,
        focalIsMerc: input.focalIsMerc,
        opening: input.opening,
        intake: input.intake,
      });
      const out = await callR(WRITER_MODEL, system, user, zQuestWrite);
      return {
        ...out,
        approaches: out.approaches ?? undefined,
        ask: out.ask.map(a => ({
          ...a, extraAttribute: a.extraAttribute ?? null,
          requirementTag: a.requiredTag ?? null, mustBeFocal: a.mustBeFocal ?? false,
        })),
      };
    },

    async genesis(input: GenesisInput): Promise<GenesisOut> {
      purposeCtx = 'genesis';
      const system = [
        'You are the writers\'-room for a saga in a dark-fantasy mercenary-fort game. The player runs a mercenary company for profit and takes this saga\'s jobs one at a time. Build a hidden BIBLE — the settled truth behind the whole saga, told plainly (mystery is the quest-writer\'s job later). COMMIT TO THE TRUTH: nothing "unknown" or "mysterious" in the bible; every fact traces to a cause.',
        'It must be a QUEST the company would TAKE: a plain hook, a goal, and a stake for the company — and the player a PARTICIPANT in it, never a spectator.',
        'YOUR INPUTS, field by field:',
        '- seed: the what-if spark — collide it with the people given into a one-line KERNEL of pure story (never restate input fields — keywords, tone, stakes, rarity — inside it; if the seed resembles a recent saga in avoid, bend it somewhere new). keywords: motifs to weave where they serve the story (not a checklist). tone: write the whole saga in this register — not every saga is grim. stakes and rarity: how weighty the matter and its prize are; size the drama to them. location: the land\'s name and its anchor facts (never lift its phrasing). twist: when true, the saga hides a reveal (see TRUTH vs SURFACE); when false, twistReveal must be null.',
        '- focal: the person this saga is ABOUT — they must be core cast, and their tags are central to what it is about. Their dossier (when fuller than the tags) is what the world remembers of them. isExistingMerc true = they already serve the player. kind (top-level) = how the saga likely ENDS: recruit = the focal may end up joining the company; captive = the focal may end up in its cells; gold-hoard = the prize is a treasure the focal is the key to; development = a saga about one of the company\'s own. Aim the arc at that ending.',
        '- slate: people this world already knows, each with how they connect (relationPhrase; their blurb is their tag-line). Reuse slate people before coining new ones (a slate with no usable people means coin freely). EVERY cast entry for an existing person — slate or focal — carries that person\'s id as loreId (the link that ties them to the world); omit loreId only for newly coined people. companySoldier-flagged people are the player\'s own soldiers: they are CONTEXT, never cast entries (sole exception: a saga ABOUT one of them, whose role still comes from the enum). The situation may touch them only as the company\'s own — never as clients, claimants, victims, or antagonists (the company does not hire, pay, or petition itself). companyCaptive-flagged people sit in the company\'s cells and cannot walk the world free — and NO ONE ELSE is in the company\'s custody: never build the saga on someone being held at the fort unless that flag says so (a person last seen slipping away is FREE).',
        '- avoid: the player\'s recent sagas — do not reuse their premises, central objects, central PLACES, rites/devices, or title shapes; set this saga visibly apart from every entry.',
        '- assignedNames: the ONLY names for newly coined people. Each is marked with the sex it fits — match names to people (a man\'s name never lands on a woman); order is free; unused names stay unused; the marks are notes, never part of the name you output. New places may be freely named — but never one sharing its first syllable with the landmark or any place this message names (a coined twin-stem reads as the same place misspelled). Each newPlaces blurb = ONE plain sentence, complete in itself, under about fifteen words. expectedBeats: the arc must have EXACTLY this many steps.',
        TAGS_NOTE,
        'ARC SHAPE: step 1 = the company takes the job or meets the matter (the goal is NOT achieved here); middle steps = escalating turns that move across the world; the LAST step brings the matter to a head at the finale — never resolve the saga before it. EXACTLY expectedBeats steps, each a short phrase.',
        'TRUTH vs SURFACE: situation = the full true state of things, twist included, told straight. When the saga has an opposing pressure, give it a FACE in the cast (an obstacle or quarry who can actually appear) — a threat no beat can stage drains every beat. goal = what the COMPANY believes it is working toward across the WHOLE saga — scope it to the full arc, never to step 1\'s errand (a goal step 1 can complete makes every later step a rerun). The goal is SHOWN to the player from beat 1: state the engagement PLAINLY and objectively, scoped to what the client asked (when the saga has NO client — a found treasure, a company venture — the goal is the company\'s own aim, stated the same way) — no attribution prefix ("X says/states…" — downstream surfaces add their own), never option branches ("unless the company chooses…"), never facts the company has not yet learned; alternatives and contingencies belong in openDirections, hidden truths in situation. twistReveal (null unless twist=true) = the one fact that recontextualizes the goal, built to surface at a MIDDLE step; the finale then settles the matter as re-understood.',
        'cast.who is ONE human sentence a stranger could picture — NEVER a semicolon list or an echo of the tag words (the tags are already known; write the person, not the data). cast.want is the want itself, no subject prefix ("her family\'s claim restored", never "she wants her family\'s claim restored" — surfaces prepend the label). cast.role = EXACTLY ONE of: client, companion, quarry, obstacle, ally, prize — "prize" ONLY for a person who IS the prize; when the prize is a THING the focal holds or is the key to, the focal\'s role is quarry. LEAN cast: STRICTLY 1-3 people, one line + want + role each, no essays — never pad with coined "companions": the player\'s soldiers already fill that role and are never cast entries unless the saga is about one of them.',
        'PLACES: describe them in your own words — never lift the location\'s stock phrasing or epithet. When the location names a landmark, it is ONE spot in a wide land: set most sagas elsewhere — coin hamlets, crossings, holds (newPlaces); when it names none, coin freely inside the given land.',
        'TITLES: a concrete ACTION-title naming what the company is drawn into — never a poetic two-noun, never defaulted to the region landmark.',
        'WANTS MUST BE HUMAN and specific — ONE concrete thing that could be handed over, done, or stopped; never an abstraction like "power" or "to come out ahead". Invent each want fresh from THIS seed and cast. The focal\'s want is the saga\'s heart: make it something a player could root for or against.',
        'One prop is BANNED anywhere in the bible — center, cast wants, arc steps (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name. When a paper must matter, any other period document serves. (Everything in the bible SEEDS later cards; a banned prop planted here forces every writer downstream into a collision.)',
        'Never echo these instructions or field names in prose.',
        NUMBER_BAN,
        EDGE_TYPES_LINE,
        'Respond as JSON: {title, kernel, cast:[{name, who, want, role, loreId?}], situation, goal, arc:[expectedBeats short step strings], twistReveal, tensions:[2-4 short strings: obstacles along the road to the goal], openDirections:[2 strings: one concrete next step toward the goal, one pressure that unfolds with or without the company],',
        'relevantIds:[every slate/focal id you used anywhere — a simple checksum of reuse], newPlaces:[{name,blurb}], newEdges:[{from,to,type,blurb: one line saying what passed between them,importance: a NUMBER 0-1 (0.8+ = defining/core)}]. newEdges records NEW history between EXISTING world people only (ids from slate/focal); the coined cast\'s ties live in the bible itself, not here — an empty array is often right}.',
      ].join('\n');
      const out = await callR(WRITER_MODEL, system, JSON.stringify(input), zGenesis);
      return {
        ...out,
        twistReveal: out.twistReveal ?? null,
        cast: out.cast.map(c => ({ ...c, loreId: c.loreId ?? undefined })),
      };
    },

    async resolve(inputs: ResolveQuestInput[]): Promise<ResolveQuestOut[]> {
      purposeCtx = 'resolve';
      // one batched call per quest, fired in parallel (the cycle's single reckoning)
      const system = [
        'You narrate the result of a job a mercenary company\'s soldiers were SENT on, in a dark-fantasy low-medieval world. The OUTCOME is already decided and given to you. The reader is the company\'s boss, who stayed at the fort: narrate the sent party in third person — never "you" in the field.',
        'GAME WRITING, not literature: this is the field report the boss reads, with life in it — never a short story. Past tense, start to finish. Goods and people the company keeps come home to the company — said plainly and in FRESH words each time ("the company\'s keeping" is this rule\'s name, never a phrase to write) — and never handed to an invented fort official (there is no quartermaster, sergeant, or clerk; the roster is the whole company). Plain everyday English a tired player reads once and gets; short sentences, mostly one clause; no semicolons — split into two sentences instead. In the AFTER text every sentence tells the boss something: what the soldiers did, what it cost, what they hold or know now — ONE action per sentence, under about twenty words, and never ACTIONS chained with "and" or commas ("X did A, did B, and did C" is three sentences — compound objects and plain descriptions are fine). In the BEFORE text every sentence must raise the stakes or show the challenge — terrain that matters, a doubt, the moment of commitment. Either way, a sentence that is only decoration is cut.',
        'OUTCOME MEANINGS: success = the job done clean — and the JOB AS WRITTEN, no more: never take, deliver, or finish what the job only asked to find, learn, or scout. partial = done, but at a COST you must SHOW (a wound, a complication, a lesser haul). failure = the job NOT done; a consequence lands.',
        'BE CLEAR ABOUT THE RESULT: the reader must finish knowing EXACTLY what the company achieved or failed to achieve, and what they now hold or know — never vague, never mood-only. When the job\'s verb is to learn, uncover, or question, the result IS the answer found (or not found) — show what was learned, not merely an object carried home. When the answer is a person this message never names, name them by role or trade — that is a clear result, not vagueness; never coin a name for them. When the client is absent or unnamed, promised things wait at the fort in the company\'s hands — say so plainly.',
        'When chainContext is given, this job is one step of a longer saga: chainContext.bible is the hidden truth behind it, chainContext.storyState is what the player has seen — and the storyState is the PAST: an event it records (a rite performed, a token cast, a prize taken) is DONE and may never be re-staged as if happening now; this job moves FORWARD from it. Unless chainContext.isFinale is true, this step may advance the saga but NEVER finish it: the bible\'s goal stays unachieved whatever the dice said — a success here succeeds at THIS job only, and the bible\'s arc lists steps that belong to LATER cards: this resolution may not perform, recover, or complete ANY of them (a beat that also does the finale\'s work makes every later card a rerun). When the dice say success but the job as written would settle the whole saga, the report completes the JOB while the larger matter visibly stays open — a new hitch, a claim unpaid, a rite unfinished — and storyUpdate must leave a live thread. Without chainContext the job stands alone.',
        'Produce, in order:',
        '1) "before": the BUILDUP TO THE BRINK, written WITHOUT looking at the outcome: the scene sets, the challenge MATERIALISES, the party commits. BEGIN WHERE THE CHALLENGE IS — and vary WHAT that opening image is across reports: ground, weather, sound, people, the enemy\'s posture (a report that always opens on terrain sitting/crouching/lying somewhere is a stamp); never the departure ("[Name] left the fort with…" is a template — most reports need no departure at all). END on an em-dash the instant before the decisive thing lands: a COMPLETE image halted before its outcome, never a sentence broken mid-phrase. Draw the cut-off image from THIS job\'s own fiction. When this message carries more than one quest, no two brinks open with the same sentence shape. It must ADD something (terrain, a doubt, a detail), never restate the card (the given title/situation/job), never hint at the result.',
        'Party members are never the culprit, suspect, or wrongdoer of their own job — the company does not incriminate itself. The party list is COMPLETE: when one soldier was sent they are ALONE in the field — no "the others", no unnamed riders or party. After a person\'s first mention in a sentence, use their pronoun — never the same name twice in one sentence, and never "the elf/the man/the woman" as a name-substitute for someone already named. Each party member\'s pronoun comes from their tags — check before writing: a "female" tag is she/her in EVERY clause ("her hammer", "at her flank"); one slipped "his" on a named woman breaks the character.',
        '2) "after": what happened, knowing the outcome. Give EVERY party member their own beat SHOWN through one concrete physical action — NEVER use their trait word or its adverb (no "playful", "instinctive", "calculating" in prose). WEAVE delivered ITEMS and PEOPLE from deliveredSummary into the action as things changing hands in-fiction (gold in deliveredSummary is the engine\'s tally — there is nothing to weave when it lists only gold). GOLD IS NEVER STAGED: no purses, pouches, coin-counting, or payment moments in prose — the engine reports pay separately; the one exception is a job whose story IS the payment. deliveredSummary is what ends in the COMPANY\'s hands once the job settles; anything the job promised to a client is separate — show it handled as the job said, and if the job\'s wording seems to promise away something deliveredSummary says the company KEEPS, the company\'s take wins (payment in kind, a declined delivery, a claim that failed). Never repeat deliveredSummary\'s amounts or its wording verbatim, nor "(npc)" or any parenthetical role. End the after-text where the story actually stops — on the deed done, on someone\'s reaction, on what it sets in motion. When this message carries more than one quest, no two resolutions may end on the same closing image: walking back to the fort or gate is one image, not a default.',
        'CONTINUITY IS THE PRODUCT: a party member\'s dossier holds what the world remembers of them — possibly who they are known as, habits, and memories (each memory line names the other person, the tie between them, and what happened). When one is RELEVANT, let it surface (a quirk performed under stress, an old wound remembered at the wrong moment). A person who appears only in a dossier memory may be REMEMBERED in prose but never staged as present. A callback may reference ONLY events written in the dossier or storyState — never invent shared history: an invented memory reads true once and false forever. Never info-dump a dossier; one touch per person at most, and MOST resolutions need none — a habit surfaces only when this scene genuinely calls it up, never as a signature stamped on every job — and never narrated AS habitual ("as she always did" is the stamp announcing itself). The dossier\'s identity line says WHO they are — it is not a prop to stage: a signature object from it may appear in at most the rare job where it matters.',
        'HABITS VARY: when a habit does surface, never repeat it verbatim from the dossier — recur it as a NEW action expressing the same trait, never the same gesture every time.',
        'THE PAIR: when two or more party members are present, include exactly ONE interaction BETWEEN them — a passed object, an answered glance, one spoken line. Their bond (or friction) is the long game; build it a brick at a time.',
        'IF a departure appears at all (rare), vary its lead-in — mist, rain, fog, and clocks are stamps ("Dawn found them…"). Vary hurt too: the ACTION determines the wound\'s place and kind — never a default body part — and never the same wound SENTENCE twice ("took a cut to her [part] from a [thing]" is a stamp: vary the how and the words), and the wound rides INSIDE its action beat — never stapled onto the end of an unrelated sentence; never narrate a wound you did not list in injuries.',
        'On failure: state in-fiction what the party came home without — NEVER the canned words "the reward is lost" or "nothing —".',
        'WORD BUDGET by rarity: common → before 2 short sentences, after 2 sentences MAX. uncommon → 3/3. rare, or a saga finale (chainContext.isFinale true) → 4/5 (the payoff moment — keep the brink and resolution generous). The after budget grows by ONE sentence per party member beyond the first (each member\'s beat needs its own sentence under the one-action rule). Respect it strictly. When the budget cannot fit everything, keep in this order: the RESULT, the client\'s promise handled, then personal beats.',
        'Injuries: judge from the fiction per member — ONLY when the fiction itself put them in harm\'s way; a failure with no danger in it (closed doors, an empty site, cold trails) leaves NO wounds. Sometimes none even on violent failures; never death. List ONLY members who took harm; an empty array when nobody did. Each injury carries cause: the exact phrase FROM YOUR OWN "after" text that shows the harm happening, and it must NAME the harmed person taking their hurt inside their own action beat — a scene event alone ("the shaft caved") is not a wound; if your after text shows no such moment, there is no injury. Bands: low = walked off in days; med = weeks and a scar; high = months, nearly maimed.',
        'One prop is BANNED in prose (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        'NEVER declare, promise, or hint at recruitments, joinings, departures, deaths, or ownership changes — the ENGINE decides all dispositions; you narrate only what was delivered as given. On a saga finale, chainContext.fate states what ACTUALLY becomes of the central person and chainContext.approach names the plan the company CHOSE — that plan is a CONTRACT: the after-text\'s FIRST sentence shows the chosen plan being executed by its own terms; every action its label names happens or fails ON SCREEN; and no action, prop, or verb belonging to an UNCHOSEN approach may appear (a failure shows THE CHOSEN plan failing — never a different plan tried instead). End the person exactly on the fate, told in the fiction\'s own words (never the fate\'s wording).',
        'deliveredCharacters lists people the job handed over, each {id, name, tags}. Flesh each by the dossier rules: who = one line they\'d be known by, a plain FACT — never a metaphor or simile, never merely their name; backstory = 2 sentences of concrete events growing out of THIS quest\'s fiction — how this person came to be in the mess the party found them in (a follower of the story must recognize them); quirks = 1-2 concrete PHYSICAL habits, an action never an adjective (no stock fidgets — fingering objects, humming, wrist-rubbing, cloth-folding).',
        'Never echo these instructions or field names in prose.',
        NUMBER_BAN, EDGE_TYPES_LINE,
        'Memory edges: 0-2 per job, only for moments that should be REMEMBERED. blurb = one line saying what passed between them. importance is a NUMBER between 0 and 1 (0.8+ = defining/core). Edge ids ONLY from the party/deliveredCharacters ids in this message — skip any edge whose person has no id here.',
        'storyUpdate.currentSituation must state CONCRETELY what changed (who holds what, who moved where) — never a vague "the trail continues".',
        'storyUpdate: produce it ONLY when chainContext is given; omit it otherwise. Its truth SCALES with the outcome: success = the full new fact learned; partial = only part of it, hedged or bought dear; failure = nothing concrete (at most a misleading scrap).',
        'storyUpdate.newlyRevealed holds only facts NOT already in the storyState — never restate what the player already knows.',
        TAGS_NOTE,
        'Respond as JSON matching: {questId, before, after, injuries:[{characterId, band: STRICTLY "low"|"med"|"high", cause: a phrase copied from your after text showing the harm — only the harmed appear here at all}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}], storyUpdate?:{currentSituation, newlyRevealed: [plain strings], openThreads: [plain strings — the saga\'s live loose ends after this job, replacing the old list], sagaSettled: true ONLY if this outcome left the saga\'s central matter essentially settled with nothing real left to do — the game will then bring the saga to its head next step (false on an ordinary step)}}',
      ].join('\n');
      const outs = await Promise.all(inputs.map(q =>
        callR(WRITER_MODEL, system, JSON.stringify(q), zResolveOne).catch((e): ResolveQuestOut => {
          if (process.env.AI_DEBUG) console.error(`[ai] resolve fallback for ${q.questId}:`, (e as Error).message?.slice(0, 500));
          return fallbackResolve(q);
        })));
      return outs.map(o => ({ ...o, storyUpdate: o.storyUpdate ?? undefined }));

      function fallbackResolve(q: ResolveQuestInput): ResolveQuestOut {
        // deliveredSummary carries engine numbers — it must NEVER surface raw (the engine's
        // own grant lines already show the take); keep the fallback prose number-free
        return ({
          questId: q.questId,
          before: `${q.party.map(p => p.name).join(', ')} set out.`,
          after: q.outcome === 'success' ? 'The job came home clean; what was promised was taken.'
            : q.outcome === 'partial' ? 'A messy half-win — they brought back part of what they went for.'
            : 'It comes apart, and they walk home with nothing.',
          injuries: [], fleshed: [], edges: [],
        });
      }
    },

    async flesh(inputs: FleshInput[]): Promise<FleshOut[]> {
      purposeCtx = 'flesh';
      if (!inputs.length) return [];
      const system = [
        'You breathe life into characters of a dark-fantasy mercenary company. Each person comes with: name (use as-is), tags, role = what they are to the company (merc = one of its own soldiers, captive = held in its cells, hireling = staff), and context = how they came to the fort — let role and context shape the telling. The tags fix the person\'s SEX and STATION: "female" is she/her and "male" is he/him in every clause, whatever the name\'s sound; who/backstory keep whatever standing the tags and saga (when given) establish — never demote a story\'s central figure to background staff. For EACH person, write:',
        '- who: ONE line they would be known by around the fort — a plain FACT about them, specific and human, never a metaphor or simile ("like a…" and "wore X like Y" are the tell), never generic, never merely their name — one concrete duty, habit, or repute, in plain everyday words a player remembers; never a riddle or a poem.',
        '- backstory: 2 sentences of origin that FIT their tags and how they arrived, carrying one detail a reader could love, pity, or worry over — SHOWN inside the telling, never announced as a labeled fact. Plain concrete events — who, where, what happened; never lyrical vagueness or withheld mysteries (a fact the reader can hold beats a mood they cannot). Every word must be consistent with every tag — never contradict one. Never echo these instructions or their wording in the prose.',
        '- if a `saga` is given, that person IS who that story was about (saga.kernel = the one-line idea it was built on; saga.want = what they wanted in it): their backstory must grow out of it so a player who followed the saga recognizes them. Never contradict the saga; never retell it — tell what came BEFORE it.',
        '- quirks: 1-2 concrete PHYSICAL habits a watcher could notice (an action, never an adjective; each a short phrase of a few words). BANNED stock quirks: fingering/thumbing an object, humming or whistling, rubbing a wrist, folding a cloth corner — reach wider (gait, eating, grooming, speech rhythm, sleep, small rituals), and give each person in this batch a DIFFERENT kind of habit.',
        'Make the people DISTINCT from each other. No semicolons — split into two sentences. One prop is BANNED (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        TAGS_NOTE,
        NUMBER_BAN,
        '(For dossiers, homely counts — "two winters", "the youngest of three" — are fine; what stays banned are prices, pay, and tallies.)',
        'Respond as JSON: {people:[{characterId, who, backstory, quirks:[...]}]} — ids exactly as given.',
      ].join('\n');
      const out = await callR(WRITER_MODEL, system, JSON.stringify(inputs), zFleshBatch);
      const legal = new Set(inputs.map(i => i.characterId));
      return out.people.filter(p => legal.has(p.characterId));
    },

    async themeRoll(input: ThemeRollInput): Promise<ThemeRollOut> {
      purposeCtx = 'themeRoll';
      const system = [
        'A player renovates a fort room in a style. Choose 3-5 wanted tag WORDS for the room theme — strictly from the provided vocabulary list. One flavor line.',
        NUMBER_BAN,
        'Respond as JSON: {wants:[words], flavorLine}',
      ].join('\n');
      // mechanical tier: a vocab pick + one line — nano, not the prose model (STORY_ENGINE §10.5)
      return call(NANO_MODEL, system, JSON.stringify(input), zTheme);
    },

    async select(input: SelectorInput): Promise<string[]> {
      purposeCtx = 'select';
      const system = 'Pick which candidates need FULL dossier context for the writing task. Respond as JSON: {ids:[...]} — at most the requested max. Ids exactly as given.';
      const out = await call(NANO_MODEL, system, JSON.stringify(input), zSelect);
      const legal = new Set(input.candidates.map(c => c.id));
      return out.ids.filter(id => legal.has(id.replace(/^id=/, ''))).slice(0, input.max);
    },
  };
}
