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
const desemi = (s: string) => {
  // hash-seeded alternation so different texts break stamps differently (a per-call counter
  // once turned every "Expect" into "Count on" — and substituting words into arbitrary clauses
  // broke grammar: DROPPING whole sentences is the only safe mechanical move)
  let ei = [...s.slice(0, 40)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return s
    .replace(/;\s+(\S)/g, (_, c: string) => `. ${c.toUpperCase()}`)
    .replace(/—\s*(and|but|then|so)\s*$/i, '—')   // dangling conjunction after a brink em-dash
    // STAMP-BREAKERS: "Expect …" closed 20-27 cards/run (and word-substitutes mangled clauses);
    // "Pay is coin." ×21/run; "the company's keeping" ×9-12 incl. broken grammar
    .replace(/(^|[.!?]\s+)(?:Expect|Count on|There will be|Likely)\s[^.!?]*[.!?]\s*/g,
      (m, p: string) => (ei++ % 3 === 0 ? m : p))   // keep 1 in 3 forecast sentences (model still writes one on ~70% of cards)
    // 'custody' became the run's favorite word (×10) once the fences taught it — rotate
    .replace(/\binto (?:the )?(?:company(?:'s)?[ -])?custody\b/gi,
      () => ['into the company\'s hands', 'under the company\'s guard', 'into custody'][ei++ % 3]!)
    .replace(/(^|[.!?]\s+)(?:The )?[Pp]ay is coin\.\s*/g, (_, p: string) =>
      p + ['Coin on completion. ', 'Paid in coin. ', 'The pay is honest coin. '][ei++ % 3]!)
    .replace(/\bcrouched\b/g, () => ['crouched', 'knelt', 'bent low', 'dropped low'][ei++ % 4]!)
    // the forearm was the only anatomy in this world (11 of 14 second-half wounds)
    .replace(/\bforearm\b/g, () => ['forearm', 'shoulder', 'shin', 'hip', 'upper arm'][ei++ % 5]!)
    .replace(/\bto the company's keeping\b/gi, 'to the company')
    .replace(/\bthe company's keeping\b/gi, "the company's hands");
};
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
  // caps sized to the ≤50/≤95-word finale budgets plus headroom — the truncator is the
  // backstop; the prompt's hard word caps are the real limit (PROMPTS.md register)
  before: zProse(500),
  after: zProse(850),
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
  'Character names must come from the names this message gives you — never coin your own. Keep prose tight; plain low register — no archaic diction, no modern idiom, no counting-house idiom (nothing is "filed", "processed", or "registered"), and no object or term from after the age of candles and horses; concrete nouns. ' +
  'BANNED purple words: "weight", "shadow", "burden", "fate", "destiny".';

const TAGS_NOTE =
  'TAGS NOTATION (wherever character tags appear in this message): tags read "word (rank)" — the rank marks how pronounced that trait is (low < mid < high < legendary; no rank = simply present). ' +
  'The words name a race or sex, a trade, skills (e.g. "food" = cookery, "lore" = book-learning, "nature" = field-and-wood craft), temperament, or LOOKS — appearance words describe appearance only ("tall"/"short" = height, "endowed"/"flat" = figure, "clever"/"dull" = quickness of head). Never contradict a tag; when tags pull against each other, people are contradictory — let the higher-ranked lead and the others complicate it, never ignore one. Never echo TRAIT words verbatim in prose (race and sex words are fine to use).';

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
        '- location: the land and its anchor facts. A named landmark may be used — bare, never with an attached epithet phrase; other places from placeNameSuggestions or coined small places of the land.',
        input.intake ? '- intake: HOW this matter reached the company — a settled FACT, not a suggestion: the opening must agree with it, but most cards need NO sentence for it — fold it into the matter or leave it unsaid when the matter speaks for itself; never quote its wording.' : '',
        input.opening ? '- opening.spark: seed atoms for HOW the matter arrives or is noticed, separated by " · " — combine them into an opening of your own; use what serves, drop what doesn\'t; never quote their wording. Time of day only when it matters to the job — never the card\'s first words.' : '',
        '- KEYWORDS (when given): optional sparks — use what serves the premise, drop the rest. Never quote a phrase\'s wording (rebuild it in your own); a single-word THING may simply be named, unless the word itself is modern — then render its idea in period words. A feeling or stance word (grief, shyness, greed) colors what happens or why — NEVER an adjective stapled onto a person ("a shy X" tells; show it in what they do or fail to do). Keywords never override the envelope: one that invites promising something the envelope does not grant is backdrop, never the promise.',
        '- rarity: sets SIZE and length — common = local trouble told short whatever its tone; uncommon and rare may run bigger. slotCount: how many soldiers the job takes. level: the weight-class of the company\'s hired work — high-level jobs concern matters worthy of veterans, never petty salvage.',
        input.gravity ? '- gravity: sets TONE only — a small everyday job reads brisk and workmanlike; a serious matter reads straight; only a grave affair reads heavy.' : '',
        '- rewardEnvelope: the shape of the payout — the fiction must make that shape plausible and the pay plain (THE PLAIN-PROFIT RULE: they work for pay; never a payoff-free plea). A person may be promised (rescued, captured, brought back) ONLY when the envelope grants a person; a goods-only envelope promises goods. rewardItems (when given): the prize objects — they end in the COMPANY\'s hands, never promised away to a client; when one is a thing a client seeks, the premise must say why the company keeps it. The company\'s stores hold ONLY what this message lists — never write that a thing already sits at the fort.',
        '- archetype (when given): raid = hit a holdout for spoils; capture = take someone alive; rescue = free someone held; escort = guard on a journey; investigate = uncover a hidden thing; hunt = track down a person or beast; contract = an agreed task for set pay (the work itself is the premise, not a mystery); lead-hunt = sweep for rumors — vary WHAT the trail is about, who cares about it, and how it was picked up; the engine\'s own grant line announces any lead won, so the card never promises "further work" in so many words. The job matches its archetype, specific to this place.',
        '- rosterNames + rosterPronouns: the player\'s soldiers — the WHOLE company (never invent other company men; village folk and their own watch are fine), sendable candidates only: never clients, victims, or foes — and the card\'s prose never names them (the job has not started; the boss picks who goes after reading).',
        input.kind !== 'one-off' ? '' : '- framedCharacter (when given): the person the job delivers — the one person who MUST carry their given name; the card must match them exactly (name, pronoun, tags). A dossier or lastSeen means the world already knows them: continue their story — another try at a known matter, never fresh news, retold in NEW words (never copy lastSeen\'s wording — but its FACTS are settled: captors, place, and cause may not change on the retelling). npcNameSuggestions (when given): a name for at most one or two people the job CENTERS ON, and only if it truly needs them named — nameless-by-trade stays the default for everyone else.',
        '- avoid (when given): the player\'s recent cards — different premise, different props, and never reuse a name from them.',
        `YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?}]${input.kind === 'finale' ? ', approaches: [{label, rewardKind, attribute, favored}]' : ''}${input.framedCharacter?.partial ? ', quarryTags' : ''}}. Field by field:`,
        '- title: a short, concrete card name — never prefixed with the archetype label.',
        '- situation: THE card the player reads. A common card = 3-5 short sentences, never more, whatever its gravity; uncommon and rare may take up to three short paragraphs. Shape: THE MATTER ITSELF FIRST — what is wrong and where — then who wants it done (how word reached you is worth one clause at most, and when the matter is visible from the walls or already known, no bringer is needed at all) → the task, the hands it wants, the pay and risk. Never open on the arrival of a messenger. Vary what SIGNALS the wrongness — an absence, a sound, animal behavior, damage, a person\'s state — an object left behind is the trade\'s most overused signal, never the default. The task must be unmistakable from this text alone. THE CARD KNOWS ONLY WHAT ITS SOURCES COULD KNOW: what was seen from the walls stays at what eyes can see, a bringer knows what a person plausibly would — a hidden thing may be suspected or rumored, never described as fact (finding out is the job). A client\'s exact words may be quoted when they matter — never as a ritual. Most cards need no forecast line at all; when a risk line appears, give it a fresh shape.',
        '- job (ONE terse line): the task summarized for the boss\'s lists — the situation stands alone without it; never copy its sentences; no names the situation did not introduce.',
        '- ask: EXACTLY slotCount entries — one per soldier the job needs. attribute (str|dex|int|cha|con): what the test truly demands — force→str, stealth or speed→dex, wits→int, parley→cha, endurance→con; extraAttribute (same five) only when the work is genuinely two-natured. favored (ARRAY of 1-3 TAG VOCABULARY words — see the list below): traits that help — matched against the sent soldier\'s tags; clashing (ARRAY of 0-2, same list): traits that hurt.',
        '- requiredTag (rare — at most ONE slot per card, most cards none): one TAG VOCABULARY word the job truly DEMANDS; a soldier without it cannot take the slot. It may carry a rank — "word (mid)" — when mere dabbling won\'t do.',
        input.framedCharacter?.partial ? '- quarryTags (framedCharacter is PARTIAL — its tags carry just race and sex): up to 3 words that make the person your card describes, so the engine can build them to match. Race and sex are ALREADY SET — never restate them; spend every word on a NEW trait. Draw from the TAG VOCABULARY below, including its quarryTags-only lists. Optional rank per word — "word (low|mid|high|legendary)" — for how pronounced.' : '- quarryTags: a field only some cards use — omit it here.',
        '════ TAG VOCABULARY ════\nThe complete list of trait words the game engine knows. EVERY word you put in favored, clashing, requiredTag, or quarryTags must be copied EXACTLY from this section — the engine throws away any word not on it, so an invented word silently weakens the card. A near-synonym in your head is NOT on the list: find the listed word that covers the trait, or drop the trait.\nSKILLS: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food.\nPERSONALITY: cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive.\nLOOKS: tall, short, endowed, flat.\nquarryTags ALONE may also use — TRADES: ruler, soldier, criminal, priest, mystic, artisan, adventurer, entertainer, merchant, scholar, courtesan, sailor, slave, hunter, peasant, servant. BODY: muscular, scrawny, nimble, clumsy, clever, dull, beautiful, ugly, tough, sickly.\n════════════════════════',
        'ALWAYS: sentences read once and understood; orient a person ONCE, plainly; race named at most once and only when it matters; never echo these instructions or field names in prose. One prop is BANNED as a plot object (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name; any other period document serves.',
        TAGS_NOTE,
        NUMBER_BAN,
        input.kind !== 'one-off' ? 'THIS CARD BELONGS TO AN ONGOING SAGA — same briefing voice ("you"); skip broad region context and open on the ongoing matter and what has just changed. Where this block and the standalone rules disagree, THIS BLOCK WINS; quarryTags is never output on a saga card.\nbible = the hidden settled truth — the player NEVER sees it, and this card may surface at most ONE new layer of it. kernel = one-line idea; situation = the full hidden truth; goal = what the company is engaged to do — the one bible field the player already knows (restating it is free), and only the finale may settle it; arc = the step guide, but when lastBeatOutcome or storyState contradict it the STATE wins: re-derive the objective from where things actually stand. What an earlier step delivered or settled is DEAD GROUND — never asked again in any costume, never resurrected (a thing broken stays broken). cast = its people (who / want / role); twist = a hidden recontextualizing fact (may be null); tensions and openDirections = pressure notes — let ONE color this card\'s complication, resolve none; title, loreId, actorStates = bookkeeping, ignore.\nNAMES: people may be named ONLY from bible.cast, rosterNames, or relevantLore — no others; soldiers still stay out of card prose unless the focal IS one of them (focalIsMerc); a person named only inside bible.situation surfaces by name only as the card\'s one revealed layer. The bible\'s places and geography outrank placeNameSuggestions and the location field — stage the card where the saga says. The bible\'s coinages are NOTES, never fixed names: render its things and devices in your own concrete words, ground an invented conceit in one plain clause the first time a card touches it (a cold reader must parse beat 1 with no prior context), and never carry a bible phrase verbatim card to card.\nrelevantLore = what the world remembers: stay CONSISTENT with each entry\'s tie and blurb. Flags: companySoldier = the player\'s own; companyCaptive = in the company\'s cells — and NO ONE ELSE is in custody: custody exists only where that flag says so; atTheFort = physically at the fort right now, never staged acting elsewhere; outOfReach = free in the world, never at the fort or in custody unless won back on screen. focalDossier (when given) is fresher than the bible — any focal moment must fit it.\nstoryState = what the player has seen: currentSituation; knownToPlayer (a SETTLED: entry is immovable — build on it, never against it); openThreads; introducedNames = people already met (bare name; orient everyone else once). arcStep = the ONE step this card covers, dealt verbatim — this card\'s job is THIS step and nothing more. focalName = who the saga is about; focalIsMerc = whether they serve the company — such a focal is NEVER staged as the client hiring or paying the company (it does not hire itself): the matter is company business around its own soldier, pay comes from elsewhere or nowhere; the focal\'s SEX comes from their tags — check before writing a pronoun, never flip it mid-saga. lastBeatOutcome = what the previous step changed: open on the situation it CREATED, never re-pose the previous job (a step reported UNTAKEN is re-posed afresh — the world did not move); between steps the world moves ONLY as lastBeatOutcome says — never an invented offscreen capture, delivery, or rescue.' : '',
        input.kind === 'beat' ? 'THIS CARD IS ONE MID-SAGA STEP: it covers arcStep ONLY — never the saga\'s goal — and its objective must be materially different from the previous job (new ground, new claimant, new leverage, or raised stakes). Beat 1 (that is, when storyState.beat = 1) = taking up the matter plus the FIRST leg of real field work — there must be a job to send soldiers on, but never the errand\'s heart; when the dealt step holds no field work of its own, the job is the smallest first leg toward the next ground. Delivery to the CLIENT is ALWAYS later work: a mid-saga job may find, secure, or open the way, never end with the prize delivered. When the bible holds a twist that storyState does not yet contain, a MIDDLE step whose arcStep touches it surfaces it as the card\'s one revealed layer. rewardEnvelope here is side loot — the saga\'s true prize lands at the finale, and the plain-profit rule is satisfied by the client\'s promised pay; when this step\'s objective is a PERSON (found, freed, escorted), the card may promise that person-outcome. BEAT 1 IS THE CARE BEAT: one small HUMAN moment with the focal, early but inside the normal card shape, its aim following the bible\'s own telling of them — warmth or pity where it paints them warm or wronged, wariness or dark curiosity where it paints them dangerous (never make a true villain lovable); if the focal cannot be at the fort, the moment arrives secondhand through a witness\'s detail. Keep beat 1 low-stakes. Each ask entry MAY add mustBeFocal: true — ONLY when focalIsMerc is true and this step is about that soldier\'s own past; otherwise omit the field entirely.' : '',
        input.kind === 'finale' ? 'THIS IS THE FINALE — the arc\'s LAST step, bringing the matter to a head. It opens from storyState AS IT STANDS: what earlier steps did STAYS done, never re-staged as still to do; a saga forced early to its head still stages only the last step, the road to it folded into a clause. It stands on ground and people the player has SEEN, puts storyState.knownToPlayer facts to USE (proofs, leverage, allies shape the plans), and may not CONTRADICT one. It never reframes the focal against the saga\'s own telling: a protected person stays protected, an accused stays merely accused, unless a REVEALED twist says otherwise.\nPLANS: slotCount counts the mutually exclusive PLANS — the company sends soldiers down ONE plan, never a party of slotCount. Output approaches with EXACTLY slotCount entries and ask with the SAME count in the SAME order: ask[i] is plan i\'s test — same attribute, favored echoing the plan\'s; no clashing or requiredTag on plans. ALL plans settle the same central person (focalName), each testing a different attribute. rewardKind = what the COMPANY nets: recruit = they join the company; captive = the company holds them; gold = they pass out of the company\'s hands for value (ransomed home, paid off, claimed by kin). Offer only kinds the saga\'s telling can honor — a protected focal is not put in chains unless a revealed twist licenses it; when focalIsMerc is true no plan trades the soldier away: each settles the MATTER and the soldier stays the company\'s own. A label promises ONLY what its rewardKind delivers — captive reads seize/hold, gold reads sell/collect the price, recruit reads win them over — never a fate (freedom, release, mercy) no kind grants, never a handover on a captive plan, never a prize object the envelope keeps changing hands (word such plans around the claim, the price, or the right). Labels are field orders in the world\'s plain words, and no plan may presuppose a twist the player never met. The situation presents the matter at its head and may sketch the choice in one sentence; the labels carry the fork. rewardEnvelope names the saga\'s central prize and the DEFAULT ending — the plans decide what actually lands, and the standalone envelope cap does not bind them.' : '',
      ].filter(Boolean).join('\n');
      const user = JSON.stringify({
        archetype: input.archetype, location: input.location,
        // level was explained to the writer but never SENT — the verifier caught the model
        // hunting for a field that wasn't there (weight-class calibration silently dead)
        rarity: input.rarity, level: input.level, slotCount: input.slotCount, rewardEnvelope: input.rewardEnvelope,
        KEYWORDS: input.keywords?.join(', ') || undefined,
        gravity: input.gravity,
        rewardItems: input.rewardItems?.length ? input.rewardItems : undefined,
        placeNameSuggestions: input.placeNameSuggestions,
        npcNameSuggestions: input.npcNameSuggestions,
        rosterNames: input.rosterNames,
        rosterPronouns: input.rosterPronouns,
        lastBeatOutcome: input.lastBeatOutcome,
        framedCharacter: input.framedCharacter ?? undefined,
        avoid: input.avoid?.length ? input.avoid : undefined,
        bible: input.bible, storyState: input.storyState,
        relevantLore: input.relevantLore?.length ? input.relevantLore : undefined,
        focalDossier: input.focalDossier,
        beat: input.beatIndex, expectedBeats: input.expectedBeats, arcStep: input.arcStep, focalName: input.focalName,
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
        'You are the writers\'-room for a saga in a dark-fantasy mercenary-fort game. The player runs a mercenary company for profit and takes this saga\'s jobs one at a time. Build a hidden BIBLE — the settled truth behind the whole saga, told plainly (mystery is the quest-writer\'s job later). COMMIT TO THE TRUTH: nothing "unknown" or "mysterious" in the bible; every fact traces to a cause. The bible may invent the WORLD\'s past freely — never the COMPANY\'s: no sieges it survived, jobs it did, or promises made at its gate that the player never played (the slate and dossiers hold ALL company history that exists).',
        'It must be a QUEST the company would TAKE: a plain hook, a goal, and a stake for the company — and the player a PARTICIPANT in it, never a spectator.',
        'YOUR INPUTS, field by field:',
        '- seed: the what-if spark — collide it with the people given into a one-line KERNEL of pure story (never restate input fields — keywords, tone, stakes, rarity — inside it; if the seed resembles a recent saga in avoid, bend it somewhere new). keywords: motifs to weave where they serve the story (not a checklist). tone: write the whole saga in this register — not every saga is grim. stakes and rarity: how weighty the matter and its prize are; size the drama to them. location: the land\'s name and its anchor facts (never lift its phrasing). twist: when true, the saga hides a reveal (see TRUTH vs SURFACE); when false, twistReveal must be null.',
        '- focal: the person this saga is ABOUT — core cast; their tags are central to what it is about; their dossier (when fuller) is what the world remembers of them. isExistingMerc true = they already serve the player. kind = how the saga likely ENDS — recruit: the focal may end up joining the company (their role is usually prize); captive: may end in its cells (role: quarry); gold-hoard: the prize is a treasure the focal is the key to (role: quarry); development: a saga about one of the company\'s own, grown from ONE hook already in their dossier or backstory (their past stirring, not a fresh ambition) — it ends with the matter around the soldier settled and the soldier still the company\'s own (their role: companion). Aim the arc at that ending.',
        '- slate: people this world already knows (relationPhrase = the tie; blurb = their tag-line). Reuse slate people before coining new ones — but a reused person keeps the SIDE their blurb and other sagas give them (never flipping ally to villain unexplained) and never serves as the client of two sagas at once; blurbs and dossier lines are SETTLED history — build on them, never overwrite. EVERY cast entry for an existing person — slate or focal — carries that person\'s id as loreId; omit loreId only for newly coined people. Flags: companySoldier = the player\'s own soldiers — CONTEXT, never cast entries (sole exception: a saga ABOUT one of them), and never clients, claimants, victims, or antagonists (the company does not hire, pay, or petition itself); companyCaptive = in the company\'s cells — and NO ONE ELSE is in the company\'s custody: never build on someone being held at the fort unless that flag says so; atTheFort = physically AT the fort right now — never cast leading, dwelling, or acting elsewhere; outOfReach = passed out of the company\'s reach — free in the world, never at the fort or in its custody.',
        '- avoid: the player\'s recent sagas — do not reuse their premises, central objects, central PLACES, rites/devices, title shapes, or DISPUTE SHAPE (how the matter is contested and settled must differ visibly from every entry); set this saga apart from all of them.',
        '- assignedNames: the ONLY names for newly coined people. Each is marked with the sex it fits — match names to people, BOTH ways (a man\'s name never lands on a woman, a woman\'s never on a man); order is free; unused names stay unused; the marks are notes, never part of the name you output.',
        '- newPlaces (an OUTPUT, see the schema): coined places are freely named — but never sharing the first syllable of any word of the landmark or of a place this message names (a coined twin-stem reads as the same place misspelled). Each blurb = ONE plain sentence, complete in itself, under about fifteen words.',
        '- expectedBeats: the arc must have EXACTLY this many steps.',
        TAGS_NOTE,
        'ARC SHAPE: step 1 = the company takes the job AND does a real first leg of its work in the field — one sendable errand (taking the job is a clause of step 1, never the whole step: a fort-side meeting alone leaves the card writer nothing to send soldiers on); the goal is NOT achieved here; middle steps = escalating turns that move across the world; the LAST step brings the matter to a head at the finale — never resolve the saga before it. No two steps may target the same delivery, the same place, or the same person-outcome — each step changes WHAT is at stake, not just where. Anyone the arc names must be in the cast (or stay nameless by trade in the step) — quest cards may only name cast members, so an arc built on an unnamed stranger strands its own steps. EXACTLY expectedBeats steps, each a short phrase.',
        'TRUTH vs SURFACE: situation = the full true state of things, twist included, told straight. When the saga has an opposing pressure, give it a FACE in the cast (an obstacle or quarry who can actually appear) — a threat no beat can stage drains every beat. goal = what the COMPANY believes it is working toward across the WHOLE saga — scope it to the full arc, never to step 1\'s errand (a goal step 1 can complete makes every later step a rerun). The goal is SHOWN to the player from beat 1: state the engagement PLAINLY and objectively, scoped to what the client asked (when the saga has NO client — a found treasure, a company venture — the goal is the company\'s own aim, stated the same way) — no attribution prefix ("X says/states…" — downstream surfaces add their own), never option branches ("unless the company chooses…"), never facts the company has not yet learned; alternatives and contingencies belong in openDirections, hidden truths in situation. twistReveal (null unless twist=true) = the one fact that recontextualizes the goal, built to surface at a MIDDLE step; the finale then settles the matter as re-understood.',
        'cast.who is ONE character-card sentence — their station or origin plus one hook (a drive, a past, or a temper); plain and human, never a metaphor or simile, never merely their name, never an echo of the tag words (the tags are already known; write the person, not the data). cast.want is the want itself as a to-infinitive or noun phrase ("to bury her brother at the ford", "the sealed will read aloud") — no subject prefix (never "she wants the thing": surfaces prepend "wants", so a bare verb stub reads broken); each want belongs to ITS OWN person — never another cast member\'s, and never an arc step\'s wording pasted in — and an obstacle\'s want must OPPOSE or complicate the goal, never restate it (an obstacle who wants the goal done is no obstacle). cast.role = EXACTLY ONE of: client, companion, quarry, obstacle, ally, prize — "prize" ONLY for a person who IS the prize; when the prize is a THING the focal holds or is the key to, the focal\'s role is quarry. LEAN cast: STRICTLY 1-3 people, one line + want + role each, no essays — never pad with coined "companions": the player\'s soldiers already fill that role and are never cast entries unless the saga is about one of them. Every cast member must have a part the arc actually gives them — never list someone the steps give nothing to do.',
        'PLACES: describe them in your own words — never lift the location\'s stock phrasing or epithet. When the location names a landmark, it is ONE spot in a wide land: set most sagas elsewhere — coin small places of the land (newPlaces); when it names none, coin freely inside the given land.',
        'TITLES: a concrete ACTION-title naming what the company is drawn into — never a poetic two-noun, never defaulted to the region landmark.',
        'WANTS MUST BE HUMAN and specific — ONE concrete thing that could be handed over, done, or stopped; never an abstraction like "power" or "to come out ahead". Invent each want fresh from THIS seed and cast. The focal\'s want is the saga\'s heart: make it something a player could root for or against.',
        'LAW AND CLAIMS speak in period words — the register of rights, pledges, and sworn witness — never the vocabulary of modern courts and clerks.',
        'One prop is BANNED anywhere in the bible — center, cast wants, arc steps (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name. When a paper must matter, any other period document serves. (Everything in the bible SEEDS later cards; a banned prop planted here forces every writer downstream into a collision.)',
        'Never echo these instructions or field names in prose. No semicolons in any prose field — split into two sentences.',
        NUMBER_BAN,
        EDGE_TYPES_LINE,
        'Respond as JSON: {title, kernel, cast:[{name, who, want, role, loreId?}], situation, goal, arc:[expectedBeats short step strings], twistReveal, tensions:[2-4 short strings: obstacles along the road to the goal], openDirections:[2 strings: one concrete next step toward the goal, one pressure that unfolds with or without the company], relevantIds:[every slate/focal id you used anywhere — a simple checksum of reuse], newPlaces:[{name,blurb}], newEdges:[{from,to,type,blurb,importance}]}.',
        'newEdges records NEW history between EXISTING world people only (ids from slate/focal): blurb = one line saying what passed between them; importance = a NUMBER 0-1 (0.8+ = defining/core). The coined cast\'s ties live in the bible itself, not here — an empty array is often right. A tie touching a company soldier may only grow from hooks their dossier already holds — never fresh company deeds.',
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
        'GAME WRITING, not literature: these are entries in a game session log — the boss reads each once, between dice rolls, and must know exactly how the job went. Past tense. Plain everyday English; short plain sentences; no semicolons. No similes; any metaphor must stay physically sensible. EVERY sentence must change the picture of the job: progress, a setback, a cost, a gain, a fact learned. A sentence of soldiers merely moving, handling, carrying, or passing gear reports nothing and is cut, however active it sounds; so is a sentence that only sets mood. Goods and people the company keeps come home to the company — never handed to an invented fort official (there is no quartermaster or clerk; the roster is the whole company) — and never spend a sentence saying the company keeps its own pay or prizes: the engine\'s grant lines already say that.',
        'OUTCOME MEANINGS: success = the job done clean — and the JOB AS WRITTEN, no more: never take, deliver, or finish what the job only asked to find, learn, or scout. partial = done, but at a COST you must SHOW (a wound, a complication, a lesser haul). failure = the job NOT done; a consequence lands.',
        'BE CLEAR ABOUT THE RESULT: the reader must finish knowing EXACTLY what was achieved or lost and what the company now holds or knows. When the job\'s verb is to learn or uncover, the result IS the answer found (or not found) — show it. When the answer is a person this message never names, name them by role or trade — never coin a name. An absent client is not staged as a character — say plainly how the promise stands. A promised UNCANNY thing shows itself behaving as promised in ONE concrete moment, never handled as ordinary goods.',
        'When chainContext is given, this job is ONE STEP of a longer saga. bible = the hidden truth (kernel, situation, goal, cast with who/want/role, twist; arc/tensions/openDirections = the writers\'-room plan — the STATE outranks the plan; loreId and actorStates are bookkeeping, ignore them). storyState = what the player has seen, and it is the PAST: an event it records is DONE, never re-staged as happening now. This resolution performs chainContext.arcStep and ONLY that step. Unless chainContext.isFinale is true it may advance but NEVER finish the saga: the goal stays unachieved whatever the dice said, no later arc step\'s work or delivery happens here, and when a success as written would settle the whole saga, complete the JOB while the larger matter visibly stays open (storyUpdate leaves a live thread). What a resolution SETTLES stays settled: a thing broken stays broken, a proof taken stays taken. A focal who is one of the company\'s own soldiers is never handed into anyone\'s custody mid-saga. Without chainContext the job stands alone.',
        'Produce, in order:',
        '1) "before": the SETUP, written WITHOUT looking at the outcome, in two moves: the party arrives at the job, then the CHALLENGE SHOWS ITSELF — and the LAST sentence IS that challenge: the concrete thing the dice are about to decide (what bars the way, who stands up to them, what is worse than the card promised). The dice print right after this text, so end on the obstacle, plainly stated, on a full stop — never an em-dash, ellipsis, fragment, or a sentence of scenery. It must ADD something the card did not say, never restate the card, never hint at the result, and never reveal what the job has yet to find. sceneFacet names one facet you MAY take a single concrete detail from (never write the field\'s name or wording). Vary the opening sentence\'s grammar from report to report; skip the departure from the fort (mist, rain, and time-of-day openers are stamps).',
        'Party members are never the culprit or suspect of their own job. The party list is COMPLETE: one soldier sent means they were ALONE — no "the others". A party member always comes home with the party. After a person\'s first mention in a sentence use their pronoun — never the same name twice in one sentence, never "the elf/the man" for someone already named. Each member\'s pronoun comes from their tags — check before writing: a "female" tag is she/her in EVERY clause.',
        '2) "after": what happened, knowing the outcome. NEVER open by restating the job or its wording — the first sentence is the decisive moment or its immediate result. Report events in the order they mattered: how the attempt met the challenge, what it cost, what the company now holds or knows. Name a party member only where they personally turned the job — won it, botched it, found the thing, took the hurt; a member with no such moment gets NO invented one, and never describe a member with their trait word or its adverb. WEAVE items and people from deliveredSummary into the action as things changing hands in-fiction — never repeating its amounts or wording, nor "(npc)" or any parenthetical (gold there is the engine\'s tally; nothing to weave when it lists only gold). GOLD IS NEVER STAGED: no purses, coin-counting, or payment moments — the engine reports pay; the one exception is a job whose story IS the payment. deliveredSummary is what ends in the COMPANY\'s hands; if the job\'s wording seems to promise away something it says the company KEEPS, the company\'s take wins — the fiction explains how. End where the story stops — the deed done or what it sets in motion; walking back to the fort is the overused closer.',
        'CONTINUITY: a party member\'s dossier is what the world remembers of them. Let a memory or habit surface ONLY when this scene genuinely calls it up — one touch per person at most, MOST resolutions need none, never narrated as habitual ("as she always did" is a stamp), and a surfacing habit is expressed through a NEW action, never the dossier\'s gesture verbatim. A callback may reference ONLY events written in the dossier or storyState — an invented memory reads true once and false forever. A person who appears only in a dossier memory may be remembered, never staged as present.',
        'When two or more went, one exchange between them MAY appear — only when it turned the job (a decision, a warning, a grudge) and fits the budget; never as a ritual. Their bond is the long game; a brick at a time is plenty.',
        'Vary hurt: the ACTION determines the wound\'s place and kind — never a default body part, never the same wound sentence twice — and the wound rides INSIDE its action beat, never stapled onto an unrelated sentence; never narrate a wound not listed in injuries.',
        'On failure: show in-fiction what the failure cost — the thing they meant to bring home and didn\'t, told fresh each time (never a fixed frame, never the canned words "the reward is lost").',
        'WORD BUDGET (hard caps, count your words): common → before ≤25 words, after ≤45. uncommon → ≤35 / ≤65. rare, or a saga finale (chainContext.isFinale true) → ≤50 / ≤95 (the payoff — use the room). When it cannot all fit, keep in this order: the RESULT, the cost (wounds listed in injuries must still show in the after text), the client\'s promise handled, then any character touch.',
        'Injuries: ONLY when the fiction itself put a member in harm\'s way — a clean success lists none, a failure that risked no one leaves none, never death; an empty array when nobody was hurt. Each carries cause: an exact phrase FROM YOUR OWN after text showing that person taking their hurt inside their own action beat (a scene event alone is not a wound). Bands: low = walked off in days; med = weeks and a scar; high = months, nearly maimed — and the wound\'s LANGUAGE matches its band (a low wound reads as a nick, never a lodged spear).',
        'One prop is BANNED in prose (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        'The ENGINE decides every disposition — who joins, leaves, dies, owns, and every promised lead\'s content: narrate only what was delivered as given, never declaring or hinting at those yourself. On a saga finale, chainContext.fate states plainly what becomes of the central person. The fate COMPOSES with the job\'s outcome, never replaces it: the JOB\'s own objective resolves ON SCREEN first, the fate lands after it, never instead. chainContext.approach is the plan the company CHOSE — a CONTRACT: the first after-sentence shows it executed by its own terms, and every action its label names happens or fails on screen; what made each rejectedApproaches plan DIFFERENT — its distinctive route, trick, or prop — may not appear (an action the job itself requires stays free; a failure shows THE CHOSEN plan failing, never another plan tried). End the person exactly on the fate, in the fiction\'s own words, never the fate\'s wording: kept WITH the company = the report ends with them back with the company (an own soldier simply remains a soldier — never in custody or "the company\'s care"); sent OUT of the company\'s hands = they leave into the arrangement (sold, ransomed, handed over), never escaping or kept after all. The fate is the last word for the person; goods follow the company\'s-take rule above.',
        'deliveredCharacters lists people the job handed over ({id, name, tags}); flesh each: who = ONE character-card line, shape "A [station or origin]. [One hook — a drive, a past, or a temper.]" — TIMELESS identity: never current custody, quest-state, or willingness, never a micro-habit, metaphor, or merely their name; backstory = 2 sentences of concrete events growing out of THIS quest\'s fiction, carrying one detail a reader could love, pity, or worry over (spans and ages in words are fine; prices and tallies are not); quirks = 1-2 concrete PHYSICAL habits, an action never an adjective (never the stock fidgets: fingering an object, humming, wrist-rubbing, cloth-folding).',
        'Never echo these instructions or field names in prose — "approach", "plan", "roster", "lead", "envelope", "outcome" are system words: show the thing itself, never name the machinery.',
        NUMBER_BAN, EDGE_TYPES_LINE,
        'Memory edges: 0-2 per job, only for moments that should be REMEMBERED. blurb = one line saying what passed between them. importance is a NUMBER between 0 and 1 (0.8+ = defining/core). Edge ids ONLY from the party/deliveredCharacters ids in this message — skip any edge whose person has no id here.',
        'storyUpdate: ONLY when chainContext is given; omit otherwise. Its truth SCALES with the outcome: success = the full new fact learned; partial = part of it, hedged or bought dear; failure = nothing concrete. currentSituation states CONCRETELY what changed — who holds what, who moved where. newlyRevealed holds only facts NOT already in the storyState.',
        TAGS_NOTE,
        'Respond as JSON matching: {questId, before, after, injuries:[{characterId, band: STRICTLY "low"|"med"|"high", cause: a phrase copied from your after text showing the harm — only the harmed appear here at all}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}], storyUpdate?:{currentSituation, newlyRevealed: [plain strings], openThreads: [plain strings — the saga\'s live loose ends after this job, replacing the old list], sagaSettled: true ONLY if this outcome left the saga\'s central matter essentially settled with nothing real left to do — the game will then bring the saga to its head next step (false on an ordinary step; on a finale there IS no next step — it is simply whether the matter ended settled)}}',
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
        '- who: their CHARACTER-CARD line — the sentence under a hero\'s portrait. Shape: their station or origin, then ONE hook (a drive, a past, or a temper): "A [what they are/were]. [What drives or marks them.]" Two short plain sentences at most, third person. TIMELESS identity only — never current custody, quest-state, or willingness (those change; the line must not), never a micro-habit (habits live in quirks), never a metaphor or simile ("like a…" and "wore X like Y" are the tell), never merely their name, never a riddle or a poem.',
        '- backstory: 2 sentences of origin that FIT their tags and how they arrived, carrying one detail a reader could love, pity, or worry over — SHOWN inside the telling, never announced as a labeled fact. Plain concrete events — who, where, what happened; never lyrical vagueness or withheld mysteries (a fact the reader can hold beats a mood they cannot). Every word must be consistent with every tag — never contradict one. Never echo these instructions or their wording in the prose.',
        '- if a `saga` is given, that person IS who that story was about (saga.kernel = the one-line idea it was built on; saga.want = what they wanted in it): their backstory must grow out of it so a player who followed the saga recognizes them. Never contradict the saga; never retell it — tell what came BEFORE it.',
        '- quirks: 1-2 concrete PHYSICAL habits a watcher could notice (an action, never an adjective; each a short phrase of a few words). BANNED stock quirks: fingering/thumbing an object, humming or whistling, rubbing a wrist, folding a cloth corner — reach wider (gait, eating, grooming, small rituals, how they stand or carry things), give each person in this batch a DIFFERENT kind of habit, and avoidQuirks (when given) lists habits living characters already own: never re-deal one.',
        'Make the people DISTINCT from each other — no two in a batch open their who-line with the same station phrase (context says how they came; the STATION is yours to individuate). No semicolons — split into two sentences. One prop is BANNED (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        TAGS_NOTE,
        NUMBER_BAN,
        '(In these write-ups, spans and ages told in words are fine; what stays banned are prices, pay, and tallies.)',
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
