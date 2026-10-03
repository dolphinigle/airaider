// OpenAI provider — the three tiers below (plan · writer · nano); the saga storyteller's one template-keyed call.
// Every response zod-validated; the engine canonicalizes tags and guards names/edges.
// Key from OPENAI_API_KEY via ../.env or ~/.airaider/openai.env (never printed/committed).
// Transport 'claude' (AIRAIDER_AI=claude / --claude): the same prompts through the headless Claude CLI on
// the designer's subscription — the free PLAYTEST transport; production stays here on GPT (claudecli.ts).

import OpenAI from 'openai';
import { glossOf, ruleOf, seenOf, errandOf, type Archetype } from '../engine/archetypes.js';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  AiProvider, AiUsage, AiCallRecord, QuestWriteInput, QuestWriteOut,
  ResolveQuestInput, ResolveQuestOut, ThemeRollInput, ThemeRollOut, SelectorInput,
  FleshInput, FleshOut, CampaignDirection, DirectionRead } from './provider.js';
import { appendCallLog } from './calllog.js';
import { runClaude, claudeOptsFor, claudePool } from './claudecli.js';
import type { SagaCall } from './provider.js';
import { renderSaga } from './prompts/saga/render.js';

// THREE TIERS (designer 2026-10-03: "use diff model for the 'harder' part like generating saga"; "replace all
// gpt-5-mini"; "move everything to luna"). 🛠 each is env-overridable for A/B:
//   PLAN   — the saga's plan, the hardest call (once per saga): GPT-6 Sol
//   WRITER — everything the player reads (cards, reports, flesh): GPT-6 Luna — beat gpt-5-mini blind at ¼ the
//            cost on the same prompts (scripts/sagalab/modelcmp/RESULT4.md)
//   NANO   — the mechanical tier (ids, picks): GPT-6 Luna too ("move everything to luna" — gpt-5-nano was cheaper
//            by well under a cent a playthrough; one model family, better instruction-following)
const PLAN_MODEL = process.env.AIRAIDER_PLAN_MODEL || 'gpt-6-sol';
const WRITER_MODEL = process.env.AIRAIDER_WRITER_MODEL || 'gpt-6-luna';
const NANO_MODEL = process.env.AIRAIDER_NANO_MODEL || 'gpt-6-luna';
export const OPENAI_MODELS = { plan: PLAN_MODEL, writer: WRITER_MODEL, nano: NANO_MODEL };
/** list price per 1M tokens: [input, cached input, output] — the meter's rates (unknown models meter as gpt-5-mini) */
const PRICES: Record<string, [number, number, number]> = {
  'gpt-5-mini': [0.25, 0.025, 2], 'gpt-5-nano': [0.05, 0.005, 0.4], 'gpt-5.4-mini': [0.75, 0.075, 4.5],
  'gpt-5.6-luna': [0.2, 0.02, 1.2], 'gpt-6-luna': [0.1, 0.01, 0.5], 'gpt-6-sol': [2, 0.2, 10], 'gpt-6.1-sol': [2, 0.2, 10],
  'gpt-6-astra': [10, 1, 50],
};
const priceOf = (m: string) => PRICES[m] ?? PRICES['gpt-5-mini']!;
/** the mechanical tier's call purposes */
const NANO_PURPOSES = new Set(['themeRoll', 'select']);
/** the gpt-5 and gpt-6 families are reasoning models (reasoning_effort); 4.x reject it */
const isReasoningModel = (m: string) => /^gpt-[56]/.test(m);
/** 'minimal' exists only on the original gpt-5 family; GPT-6 takes none|low|medium|high — the nearest is low */
const effortFor = (m: string, e: 'minimal' | 'low' | 'medium') => e === 'minimal' && !/^gpt-5(-mini|-nano)?$/.test(m) ? 'low' : e;

export function loadKey(): string {
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
/** A cheap model told its prose "must be consistent with every tag" demonstrates compliance by
 *  PRINTING the tags — "(Tags: human, male, ranged (low), instinctive)" appended to a backstory,
 *  or a "TAGS NOTATION:" preamble. Reproduced 3/3 on 2026-08-27 after it reached the designer's
 *  own game. The prompt already forbids echoing its own wording and the model does it anyway
 *  (L1: a rule's wording comes back as prose), so this is engine enforcement, not a fifth ban. */
/** every word the tag system can produce — the test is CONTENT, not the label "Tags:", because
 *  banning that label just moved the echo: it came back as "(human. Male. Ranged (low). Instinctive)"
 *  at the head of the who-line instead (2026-08-27, second round) */
const TAG_ECHO_WORDS = new Set([
  'male', 'female', 'human', 'elf', 'wolfman', 'lizardman', 'low', 'mid', 'high', 'legendary', 'tags', 'tag', 'notation',
  'melee', 'ranged', 'leadership', 'social', 'roguery', 'lore', 'heal', 'craft', 'nature', 'performance', 'intimidation', 'food',
  'cool', 'hotheaded', 'serious', 'playful', 'greedy', 'generous', 'loner', 'gregarious', 'lustful', 'chaste', 'dominant',
  'submissive', 'calculating', 'instinctive', 'tall', 'short', 'endowed', 'flat', 'muscular', 'scrawny', 'nimble', 'clumsy',
  'clever', 'dull', 'beautiful', 'ugly', 'tough', 'sickly', 'ruler', 'soldier', 'criminal', 'priest', 'mystic', 'artisan',
  'adventurer', 'entertainer', 'merchant', 'scholar', 'courtesan', 'sailor', 'slave', 'hunter', 'peasant', 'servant',
]);
/** a run of text is a TAG LIST when nearly every word in it is one of those words */
const isTagList = (inner: string): boolean => {
  const words = inner.toLowerCase().split(/[^a-z-]+/).filter(w => w.length > 2);
  if (words.length < 3) return false;
  return words.filter(w => TAG_ECHO_WORDS.has(w)).length / words.length >= 0.75;
};

const stripTagEcho = (s: string) => {
  let out = s;
  // a bracketed aside anywhere that is just the tag line (one level of nesting: "ranged (low)")
  out = out.replace(/\s*\((?:[^()]|\([^()]*\))*\)/g, m => isTagList(m.slice(1, -1)) ? '' : m);
  out = out.replace(/\s*\[(?:[^[\]()]|\([^()]*\))*\]/g, m => isTagList(m.slice(1, -1)) ? '' : m);
  // or a bare label-and-list opening the field: "TAGS NOTATION: male, human, criminal (low)."
  out = out.replace(/^[^.!?]*[:：][^.!?]*[.!?]\s*/, m => isTagList(m) ? '' : m);
  return out.replace(/\s+([.,;!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
};

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
    // the forearm was the only anatomy in this world (11 of 14 second-half wounds).
    // ONE pick per text — a per-occurrence rotation made a wound MIGRATE inside its own
    // report ("struck her forearm… a cut to her shoulder": judges flagged it twice)
    .replace(/\bforearm\b/g, ['forearm', 'shoulder', 'shin', 'hip', 'upper arm'][ei % 5]!)
    // abstract-closer stamp — survived two rounds of prompt bans; dropping the sentence
    // whole is the proven safe transform
    .replace(/(^|[.!?]\s+)The matter closed[^.!?]*[.!?]\s*/g, '$1')
    .replace(/\bto the company's keeping\b/gi, 'to the company')
    .replace(/\bthe company's keeping\b/gi, "the company's hands")
    // 82001 read: "X reached <place>" opened 24/33 reports; "ownerless" and "the company's
    // pick" are RULE vocabulary (deliveredSummary/envelope wording) leaking into prose
    .replace(/^(\S[^.!?]*?) reached /, (_, p: string) =>
      `${p} ${['reached', 'came to', 'arrived at', 'drew up to'][ei++ % 4]!} `)
    .replace(/\bas (?:the company's|their) pick\b/gi, () =>
      ['as their own', 'for the company', 'as their due'][ei++ % 3]!)
    .replace(/\bownerless\b/gi, () => ['without an owner', 'unclaimed', 'left to no one'][ei++ % 3]!)
    // "barred" carried 4/8 obstacle sentences (lab 87001) — safe transitive pair rotation
    .replace(/\bbarred\b/gi, () => ['barred', 'blocked'][ei++ % 2]!)
    // scaffold-voice openers survived every prompt ban (5/8 cards, lab 90001) — stripping the
    // scaffold leaves a clean imperative ("Your task is to go…" → "Go…"), mechanically safe
    .replace(/(^|[.!?]\s+)(?:Your (?:task|next step) is to|The (?:open )?job is to|This step is to)\s+(\w)/g,
      (_, p: string, c: string) => p + c.toUpperCase());
};
const zProse = (max: number) => z.string().transform(raw => {
  const s = desemi(stripTagEcho(raw));
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
});
const zResolveOne = z.object({
  questId: z.string(),
  // caps sized to the ≤50/≤95-word finale budgets plus headroom — the truncator is the
  // backstop; the prompt's hard word caps are the real limit (PROMPTS.md register)
  before: zProse(500),
  // beat variant fields — tolerant/optional (non-beat outputs omit them)
  turn: zProseD(160),
  turnActor: z.string().optional(),
  speech: z.array(z.object({ who: z.string(), says: zProse(160) })).optional(),
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
  'The words name a race or sex, a trade, skills (e.g. "food" = cookery, "lore" = book-learning, "nature" = field-and-wood craft), temperament, or LOOKS — appearance words describe appearance only ("tall"/"short" = height, "endowed"/"flat" = figure). Never contradict a tag; when tags pull against each other, people are contradictory — let the higher-ranked lead and the others complicate it, never ignore one. Never echo TRAIT words verbatim in prose (race and sex words are fine to use).';

const EDGE_TYPES_LINE =
  'edge types (use ONLY these): rival-of, scarred-by, bonded-by, owes, saved-by, kin-of, betrayed-by, served-with, born-in, member-of, captive-of, loves, fears, defeated, freed-by, party-to. ' +
  'Direction: from = the state-holder (the betrayed, the debtor, the rescued); "defeated" runs winner→loser; for symmetric types (rival-of, kin-of, bonded-by, served-with, party-to) either direction serves. People-to-people ties only.';

// quarry extension renders ONLY when the card actually outputs quarryTags — for every other
// card that line was inert vocabulary a cold reader had to parse (context-free audit 2026-07-17)
const tagVocab = (withQuarry: boolean) => '════ TAG VOCABULARY ════\nThe complete list of trait words the game engine knows.\nSKILLS: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food.\nPERSONALITY: cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive.\nLOOKS: tall, short, endowed, flat.'
  + (withQuarry ? '\nquarryTags ALONE may also use — TRADES: ruler, soldier, criminal, priest, mystic, artisan, adventurer, entertainer, merchant, scholar, courtesan, sailor, slave, hunter, peasant, servant. BODY: muscular, scrawny, nimble, clumsy, clever, dull, beautiful, ugly, tough, sickly.' : '')
  + '\n════════════════════════';

const ASK_SPEC = '- ask: EXACTLY slotCount entries — one per soldier the job needs. What these DO: the player fills each slot from their own roster, and favored/clashing shift that soldier\'s odds up or down — they never bar anyone. requiredTag DOES bar: no soldier without it can take the slot, so a tag the player owns nobody with strands the card. attribute (str|dex|int|cha|con): what the test truly demands — force→str, stealth or speed→dex, wits→int, parley→cha, endurance→con; extraAttribute (same five) only when the work is genuinely two-natured. favored (ARRAY of 1-3 TAG VOCABULARY words): traits that help. clashing (ARRAY of 0-2, same list): traits that hurt.\n- requiredTag (rare — at most ONE slot per card, most cards none): one TAG VOCABULARY word the job truly DEMANDS; may carry a rank — "word (low|mid|high)" — when mere dabbling won\'t do.';

/** Only the archetype ACTUALLY dealt reaches the model. The old line defined all eight (77 words,
 *  ~68 of them about jobs not in play) — dead mass for a cheap model (§0) and seven concrete
 *  instances free to leak (L13). */
// the gloss now lives ON the archetype row (engine/archetypes.ts) — ~100 of them, and only the
// DRAWN one ever renders, so the pool costs the same prompt as the old eight did.
const archetypeLine = (a?: string): string => {
  const g = a ? glossOf(a as Archetype) : undefined;
  if (!g) return '';
  // the rule (when a kind of work has one) is its OWN sentence, never folded into the gloss
  const r = a ? ruleOf(a as Archetype) : undefined;
  return `- archetype: ${a} — ${g}. The job matches it, specific to this place.${r ? ` ${r}` : ''}`;
};

/** A ROUTINE JOB (designer ruling, 2026-08-27, from play: "reading one off quests become tiring
 *  after a while… one off shouldnt even have names etc… i think one sentence better").
 *
 *  A one-off is WORK, not a story: the board above the card already says what kind of job it is,
 *  where, how hard, and what it pays, so the prose owes the reader exactly ONE thing the row does
 *  not have — the reason this job is worse than the last one like it. Everything else is what made
 *  twenty of these tiring.
 *
 *  This prompt is deliberately a fraction of the full one (~1470 words). Its shortness is not
 *  thrift, it is the instruction: a model given eight things to use will use all eight, and the
 *  engine has already stopped dealing most of them (see THE INPUT DIET in game.ts). Serious and
 *  grave one-offs still get the full card prompt below. */
function oneOffLightSystem(input: QuestWriteInput): string {
  return [
    '═══ THE JOB ═══\nYou write ONE job card for a dark-fantasy mercenary-fort GAME. The player is the company BOSS at the fort; the card is the notice that reaches their table. This one is ROUTINE work — the kind the company does between the matters that mean something.',
    '═══ YOUR INPUTS ═══',
    '- location: the kind of country this job is in. It decides what trouble is PLAUSIBLE here — never name it.',
    input.shape ? '- shape: the KIND OF TURN this job takes — not what happens in it. Two jobs of the same kind should not read alike, and this is what makes them differ: let it decide WHO is really behind the trouble, or what the reader has wrong at first. It is never written on the card, only obeyed.' : '',
    input.obstacle ? '- obstacle: WHO stands in the way and what they do about it. This is a fact somebody could see, so BUILD THE SENTENCE ON IT — it is what makes this job different from the last one of its kind. Say it in your own words; the person is a station, never a name.' : '',
    input.method ? '- method: HOW the work gets done this time. Bend the job toward it and put it in your own words — never write the word itself.' : '',
    input.keywords?.length && input.hiring && process.env.HIRE2 !== '0' ? '- KEYWORDS: a single seed word. Let it colour WHY this person would come now, and never write the word itself.' :     input.keywords?.length && input.scouting && process.env.SCOUT !== '0' ? '- KEYWORDS: a single seed word. Let it colour what the talkers grumble about, and never write the word itself.' : input.keywords?.length ? '- KEYWORDS: a single seed word. It is there to make this job different from the last one — let it suggest what has gone wrong, and never write the word itself. Where it has more than one sense, any sense will do; pick one and commit.' : '',
    '- archetype: the shape of the work. slotCount: how many soldiers go — write EXACTLY that many ask entries.',
    archetypeLine(input.archetype),
    input.framedCharacter ? '- framedCharacter: the person this job is about, given by TAGS. On this card they have no name — call them by station or relation (the miller\'s son, a hired man, the widow). They are named later, in the report, when the company reaches them.' : '',
    input.avoid?.length ? '- avoid: the player\'s recent cards. Different trouble, different props.' : '',
    NUMBER_BAN,
    tagVocab(!!input.framedCharacter?.partial),
    `═══ YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?}]${input.framedCharacter?.partial ? ', quarryTags' : ''} }`,
    // first run produced "Punctured Barrels Report" and "Hollow Refuge Inquiry" — a card FILE
    // rather than a job. A title names the trouble, the way a person would say it out loud.
    input.scouting && process.env.SCOUT !== '0' ? '- title: three or four plain words naming where the company goes to listen, the way one of the company would say it. No name of any person or place.' : '- title: three or four plain words naming the trouble, the way one of the company would say it to another. No name of any person or place.',
    // A scouting run (lead-hunt) has its own form. The three permitted openers (found / missing /
    // stopped) are all MYSTERY shapes and the form outranks the fact (L32), so a lead-hunt was
    // always written as an investigation — designer: "shouldnt it be something like 'go to tavern
    // and fish for news'". MEASURED 2026-09-25, 2 rounds x 10 cards, 2 blind judges: reads as
    // scouting for work 0.0 -> 2.0 (of 2), prose 5.05 -> 4.9. SCOUT=0 restores the old card.
    // A hire (the recruiting post's faucet, whose whole purpose is to gain a recruit) fell into the
    // same L32 trap as the scouting run: built on "one thing somebody saw" it came out "the miller
    // saw the hunter peering through his shutter", and 8/10 errands hired a THIRD party to fix a
    // mystery. MEASURED 2026-09-25, 10 cards per arm, 2 blind judges: reads as a recruitment offer
    // 0.45 -> 2.0 (of 2), "I'd want this person" 0.1 -> 1.4, prose 4.15 -> 4.45. HIRE2=0 restores.
    (input.hiring && process.env.HIRE2 !== '0'
      ? '- situation: ONE SENTENCE: someone worth hiring, seen at what they do well — and why they would JOIN the company now. They are not in trouble with anyone, they need nothing done for them, and nothing else is wrong.'
      : input.scouting && process.env.SCOUT !== '0'
      ? '- situation: ONE SENTENCE: a place where word gathers — a common room, a market, a crossing — who passes through it, and the kind of trouble out in the country around that they grumble about. NOBODY BROUGHT THIS IN and nobody is hiring you: the company goes to LISTEN and comes back with word of paying work. Nothing is wrong at the place itself, and no single incident is named.'
      : process.env.SEEN !== '0' && process.env.SEEN2 !== '0' && seenOf(input.archetype as never)
      // A type with its own `seen` opener (and, for hunt/explore, its own errand). The found /
      // missing / stopped menu is a MYSTERY menu: a blind survey read hunt, research, adventure,
      // explore and fight cards as investigations. MEASURED 2026-09-25, blind type classification,
      // 2 judges: hunt 2/8 -> 5/8, explore 3/8 -> 7/8 (adventure 3/6 -> 4/6, research 5/6 -> 6/6),
      // prose flat (5.53 -> 5.38; +0.3 in the first round). SEEN2=0 restores.
      ? '- situation: ONE SENTENCE built on ONE THING SOMEBODY SAW: ' + seenOf(input.archetype as never) + '. Let that carry the job. A thing seen tells a reader more than the same matter stated as a fact, and it is what makes this job worth hiring armed strangers for.'
      : process.env.SEEN !== '0'
      ? '- situation: ONE SENTENCE built on ONE THING SOMEBODY SAW — what was found, what is missing, what someone has stopped doing — and let that carry the trouble. A thing seen tells a reader more than the same trouble stated as a fact, and it is what makes this job worth hiring armed strangers for.'
      : '- situation: ONE SENTENCE saying what is WRONG — the trouble that makes this job worth hiring armed strangers for.')
      + ' The errand itself goes in `job`, not here; the player is shown that separately. NO PROPER NOUNS AT ALL: no person\'s name, no place name, no house, guild or company name. Everyone is their station (a miller, the smith\'s widow, a bailiff) and every place is what it is. No pay, no messenger, no weather, no scenery. TWENTY WORDS AT MOST, and twelve is better.',
    // Examples teach LENGTH and nothing else, so they are built to be uncopyable: no shared
    // syntax between them, and none of them touches this region's terrain. The first draft's
    // examples wrote "the last two escorts" and "took the coin" — a number and a payment, both
    // banned two lines above, in the most imitable position in the prompt (cold-read, 2026-08-27).
    // These teach LENGTH. They are built so there is nothing else to take: no shared sentence
    // shape, three different registers (a theft, a person, a thing), and no number or payment in
    // any of them — an earlier set wrote "the last two escorts" and "the well has been fouled
    // twice", both amounts in prose, banned two lines above (cold-reads, 2026-08-27).
    process.env.NOEG === '1' || (input.scouting && process.env.SCOUT !== '0') || (input.hiring && process.env.HIRE2 !== '0') ? '' : '  Three of the right LENGTH, deliberately unalike: "Sheep keep going missing and the shepherd has stopped saying how." · "The tanner\'s daughter has not been seen since the fair and her father will not go to the watch." · "Something is in the flooded workings and the diggers have stopped going down."',
    // …and its own errand: JOB2's "where the job is to find something out, it ASKS the question"
    // turned every scouting errand into a manhunt ("find which speaker bragged of the knifing")
    (input.hiring && process.env.HIRE2 !== '0'
      ? '- job (ONE terse line, under twelve words): what the soldier offers to sign them on — never a fight, a capture or a rescue.'
      : input.scouting && process.env.SCOUT !== '0'
      ? '- job (ONE terse line): what the soldier does THERE to hear of work — sit with whoever talks, stand a round, ask who is hiring. Never someone or something to find: nobody yet knows what the work will be.'
      : process.env.SEEN2 !== '0' && errandOf(input.archetype as never)
      ? '- job (ONE terse line, under twelve words, ONE action): ' + errandOf(input.archetype as never) + '.'
      : process.env.JOB2 !== '0'
      ? '- job (ONE terse line): ONE action, about the very thing the situation put in front of the reader — never a checklist, and never a person, place or object the situation did not already show. Where the job is to find something out, it ASKS the question and never states the answer.'
      : '- job (ONE terse line): the errand itself, plainly — what the company is actually being sent to do. It names what the situation left out.'
        + (process.env.ONEJOB === '1' ? ' ONE action, never a checklist of them.' : '')),
    // The engine BUILDS the delivered person out of these words, so they are not decoration:
    // whatever the card implies the person is, say it here or they arrive as somebody else.
    input.framedCharacter?.partial ? '- quarryTags: up to 3 TAG VOCABULARY words for the person this job is about — their trade and their nature, as your sentence implies them (a shrine novice is a priest; a missing shepherd is a hunter or a peasant). Race and sex are already set: spend every word on something new. Optional rank: "word (low|mid|high)".' : '',
    ASK_SPEC,
    // TWO rules, not five. The first draft's block restated the situation rule, the tag rule and
    // the diction rule that all sit a few lines above it — a third of the prompt spent saying
    // things twice, in the position a cheap model reads hardest (§0: rule mass has a floor).
    '═══ ABOVE ALL (write now) ═══\n1. The situation is ONE sentence, twenty words at most, no proper nouns.\n2. Every word in favored, clashing' + (input.framedCharacter?.partial ? ', requiredTag or quarryTags' : ' or requiredTag') + ' is copied EXACTLY from TAG VOCABULARY — a near-synonym is thrown away by the engine.\nRespond as the JSON object specified above — nothing else.',
  ].filter(Boolean).join('\n');
}

function oneOffSystem(input: QuestWriteInput): string {
  // gravity is engine-rolled and one-offs now skew small (keywords.ts) — that roll is what picks
  // the register, so the two prompts never have to arbitrate between themselves
  if (input.gravity?.startsWith('a small')) return oneOffLightSystem(input);
  return [
    '═══ THE JOB ═══\nYou write ONE job card for a dark-fantasy mercenary-fort GAME. The player is the company BOSS at the fort; ' + (VOICED_ONE_OFF ? 'the card is the matter arriving in a VOICE — the words of whoever or whatever brought it to the fort, set down for the boss: what is wrong, what they want done, what it pays.' : 'the card is a short briefing TO them ("you"): what came in, what the job is, what it pays.') + ' They read it once and pick which soldiers to SEND — the boss never goes, and the job has not started. The card speaks TO the boss as \'you\'; the company is never \'we\', \'us\' or \'our\'.' + (input.selfDirected ? ' NOBODY BROUGHT THIS IN. There is no client, no messenger and no grievance: the company is going out to LOOK, and the card says where it means to go and what it expects to find there. Never invent someone to hire you.' : ' Only what has reached the fort goes on the card.') + ' GAME WRITING, not literature: every sentence gives the player something to use; a mood-only sentence is cut. Plain everyday words a farmhand would say; short sentences, mostly one clause, no semicolons. People stay NAMELESS BY TRADE — a name appears only when this message hands you one, and only for someone the job centers on. Introduce each person by WHAT THEY ARE TO THE OTHERS IN THE MATTER — who they serve, who they answer to, who they belong to — never by a bare word for a class of person standing alone.',
    '═══ YOUR INPUTS ═══',
    '- location: the land and its anchor facts. A named landmark may be used bare (never with an epithet); other places come from placeNameSuggestions or coined small places of the land.',
    input.intake ? '- intake: HOW this matter reached the company — a settled FACT: the opening must agree with it, but most cards need NO sentence for it; never quote its wording.' : '',
    input.opening ? '- opening.spark: seed atoms for how the matter arrives, separated by " · " — combine into an opening of your own; use what serves; never quote their wording.' : '',
    input.shape ? '- shape: the KIND OF TURN this job takes — not what happens in it. Two jobs of the same kind should not read alike, and this is what makes them differ: let it decide WHO is really behind the trouble, or what the reader has wrong at first. It is never written on the card, only obeyed.' : '',
    input.obstacle ? '- obstacle: WHO stands in the way and what they do about it — a fact somebody could see. Build on it: it is what makes this job different from the last one of its kind. Your own words; the person is a station, never a name.' : '',
    input.method ? '- method: HOW the work gets done this time. Bend the job toward it and write it in your own words — never write the word itself.' : '',
    input.keywords?.length ? '- KEYWORDS: sparks for the world, each LABELLED by what kind of seed it is (bond / happening / thing / quality) — use what serves and drop the rest. A label tells you where its word belongs; two of them never become one name or thing. NEVER print a label itself — only the word after it may reach the card. Rebuild phrasing in your own words; a modern word is rendered as its period idea. A feeling word colors what happens — never an adjective stapled onto a person.' : '',
    '- rarity: how uncommon the work is. level: the weight-class of the work — high level means matters worthy of veterans. slotCount: how many soldiers.',
    input.gravity ? '- gravity: sets TONE and the card\'s HARD WORD CEILING, which is a limit and never a target — a small everyday job: NO MORE THAN 25 WORDS, and one sentence is a perfectly good card; a serious matter: no more than 40; a grave affair: no more than 60. Coming in well under is always better than reaching it. Small jobs read brisk, serious matters straight, only a grave affair reads heavy; when a keyword pulls against it, gravity wins.' : '',
    '- rewardEnvelope: the payout\'s shape — the fiction makes it plausible and the pay plain (they work for PAY, never a payoff-free plea). Goods beyond the pay stay UNNAMED on the card (what the job turns up is the report\'s to tell); no talk of stores or inventories.'
      + (/person/.test(input.rewardEnvelope) ? ' The promised person\'s claim stands on its OWN footing (they have nowhere to return, choose to come, owe a debt, or are lawfully taken): no payer "hands", "grants", or "lets keep" a person they do not hold.' : ''),
    archetypeLine(input.archetype),
    input.framedCharacter ? '- framedCharacter: the person the job delivers — the ONE person who must carry their given name, FIRST in the situation (grounded there) before any other field may use it; match them exactly (name, pronoun, tags). A dossier or lastSeen means the world knows them: continue their story in NEW words (lastSeen\'s FACTS are settled — captors, place, cause may not change).' : '',
    input.avoid?.length ? '- avoid: the player\'s recent cards — different premise, different props, never a reused name.' : '',
    input.framedCharacter ? TAGS_NOTE : '',
    NUMBER_BAN,
    tagVocab(!!input.framedCharacter?.partial),
    `═══ YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?}]${input.framedCharacter?.partial ? ', quarryTags' : ''}} ═══`,
    '- title: short and concrete — never prefixed with the archetype label.',
    VOICED_ONE_OFF
      ? '- situation: THE card — the matter arrives in a VOICE. First line: the bearer alone in square brackets, named by station never by a name this message did not hand you — "[a drover off the south road]", "[a letter under a cracked seal]", "[the wall sentry]". Then the bearer\'s OWN words (a letter = its written text): first person, in the diction of their station — a drover does not talk like a lord, though all in plain period words. Common = 3-5 short sentences; uncommon and rare may run longer. Their telling: the MATTER first (' + (process.env.SEENV !== '0' && seenOf(input.archetype as never) ? seenOf(input.archetype as never) : 'what is wrong and where') + ') → the ask as the outcome wanted (one errand, never an itinerary).' + (NOPAY ? ' NEVER mention payment, coin, or what the company keeps — the boss is shown the pay separately, and a teller who haggles buries their own news.' : ' Then the pay in its OWN short sentence, promised in kind, never a sum.') + ' ONE FACT PER SENTENCE. The bearer says only what they could know: a hidden thing is suspected aloud, never stated as fact — finding out is the job. Vary what the bearer noticed first (an absence, a sound, animal behavior, damage, a person\'s state). State intent and rumor, never a named person\'s scripted future action. A matter visible from the fort\'s own walls comes as the sentry\'s report.'
      : '- situation: THE card, inside gravity\'s ceiling. Under a tight ceiling the beats MERGE rather than crowd: the pay rides in the same clause as the task, and on the smallest jobs the opening sentence and the one after it are the whole card. Shape: the MATTER first → who wants it done (one clause at most; none when the matter is visible from the walls) → the task as the outcome wanted (one errand, never an itinerary).' + (NOPAY ? ' NEVER mention payment, coin, or what the company keeps: the boss is shown the pay separately and the clause only crowds the card.' : ' → the pay LAST, as one clause turning on the work being done.') + ' ONE FACT PER SENTENCE. That FIRST sentence names what the job is about and the wrong in it — never a need, a wish, or what must happen — leading with whichever the reader needs first: the one wronged, the one who did it, or the word that reached the fort. TWELVE WORDS OR FEWER, subject and verb in the first four, never a command; where they went and who chased them wait for a later sentence. THE SENTENCE AFTER IT is the one that makes the matter bite, and it may run longer than the rest: it names whoever DID this — the hand behind the wrong, not the one it happened to — what they are to the others, and the act itself. Where no hand is behind it, that sentence names instead what stands in the way of putting it right. Either way it never restates the first sentence in other words. NAME A THING BY WHAT IT IS AND WHAT IS WRONG WITH IT before any word about what it is made of or looks like — a detail the reader cannot use yet is cut. The card knows only what its sources could know: a hidden thing is suspected or rumored, never stated as fact — finding out is the job. Most cards need no risk line; when one appears, flowing prose, never a labeled clause. State intent and rumor, never a named person\'s scripted future action.',
    (process.env.SEENV !== '0' && errandOf(input.archetype as never)
      ? '- job (ONE terse line, under twelve words, ONE action): ' + errandOf(input.archetype as never) + '; never copies the situation\'s sentences, no names the situation did not introduce.'
      : '- job (ONE terse line): the task for the boss\'s lists — never copies the situation\'s sentences, no names the situation did not introduce; a find-or-learn task poses the QUESTION, never the answer.')
      + (process.env.ONEJOB === '1' ? ' ONE action, never a checklist of them.' : ''),
    ASK_SPEC,
    input.framedCharacter?.partial ? '- quarryTags (framedCharacter is PARTIAL — its tags carry just race and sex): up to 3 TAG VOCABULARY words (the quarryTags-only lists allowed) that make the person your card describes; race and sex are already set — spend every word on a NEW trait; optional rank "word (low|mid|high|legendary)".' : '',
    '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way and is understood on one skim — subject and verb early.\n2. ONE LEDGER, fixed in your head before you write and NEVER written out as a sentence: who holds the wanted thing NOW (one holder, ONE place — stated once and never moved by a later sentence), who pays to change that (ONE hand pays, never two), and what the company keeps — then no clause reassigns them. The wanted thing is never already in the fort\'s hands or the hands that pay.  ' + (NOPAY ? 'The card never mentions pay at all.' : 'Pay is ONE clause naming who pays (a trade suffices); loot rights are not a sentence of their own.') + '\n3. Every word in favored, clashing, requiredTag' + (input.framedCharacter?.partial ? ', or quarryTags' : '') + ' is copied EXACTLY from TAG VOCABULARY — a near-synonym is thrown away by the engine.\n4. Period diction only (nothing after the age of candles and horses); never echo an instruction or field name; the account-book (ledger, registry, record-book) is BANNED as a plot object.\nRespond as the JSON object specified above — nothing else.',
  ].filter(Boolean).join('\n');
}

const PROSE_VARIANT = process.env.PROSE_VARIANT ?? 'diet';
// ── dialogue-framing lab (2026-07-19): CARD_VARIANT=dlg frames the card as the bearer's own
// first-person words; PROSE_VARIANT=dlg turns resolutions into script-format scenes. Both are
// bench variants — unset = shipped behavior.
const CARD_VARIANT = process.env.CARD_VARIANT ?? 'dlg';
/** ONE-OFFS ONLY. The saga voice-break class (a recurring client narrating himself in third
 *  person across mid-saga re-grounding) is unfixed — prosebench/DIALOGUE_AB.md §failure classes. */
const VOICED_ONE_OFF = CARD_VARIANT === 'dlg';
/** heavy-card lab (2026-08-28): NOPAY drops the card's pay clause — the engine already prints a
 *  banded reward on its own line in BOTH UIs (ECONOMY §7.1b), and three blind judges named
 *  'payment bookkeeping' and 'hedged double-asks' as what buries the heavy card's good image. */
const NOPAY = process.env.NOPAY === '1';
// Voice exemplars are MUNDANE on purpose (bleed-safe: no quests, no wonders, no props the game
// deals); each shows varied rhythm, one spoken fragment, one seen detail, a hard ending.
const VOICE_EXEMPLARS = [
  '«Marsh crossed at first light. Two horses were gone from the string, and the ferryman would not meet his eye. "Count them again," Marsh said. He stayed on the ramp, arms folded, until the man had. The count came up two short, and the ferryman\'s boy was gone too.»',
  '«The pens had held all winter, and then one night they didn\'t. Hedda found the fence post lifted out whole and set aside, the way a man sets aside a chair. Nothing torn, nothing bled. "Wolves pull," was all she said. "They don\'t lift." She nailed a lantern to the gate and sat up with the dog.»',
  '«Rain caught the column at the ford and the wagon went in to the axle. They carried the grain over by hand, sack by sack, while the carter stood on the bank telling them what each sack was worth. The last man over threw his sack down at the carter\'s feet. "Carry the next one yourself."»',
];
let exemplarTick = 0;

const RESOLVE_HEAD_FRAME = 'You narrate the result of a job a mercenary company\'s soldiers were SENT on, in a dark-fantasy low-medieval world. The OUTCOME is already decided and given to you. The reader is the company\'s boss, who stayed at the fort: narrate the sent party in third person — never "you" in the field. The job\'s CARD is printed directly above your text and the player has just read it: never re-tell what it already said — begin where it left off, and let its own people, places and hook carry through into what happens next.\n';
const RESOLVE_STYLE_DIET = 'Entries in a game session log, read once between dice rolls. Past tense. Plain words, real events, no ornament — every sentence earns its place by what happens in it.';
const RESOLVE_STYLE_BEAT = 'The report is a BEAT STRIP the game deals out in pieces around its own dice line: your "before", then the game shows the dice, then your "turn" caption and any speech, then your "after". Write each piece to be read alone in its slot. Plain words, real events, no ornament.';
const RESOLVE_STYLE_DLG = 'Entries in a game session log, read once between dice rolls. Past tense for the telling. The report is a PLAYED SCENE, set down line by line: every line opens with its teller in square brackets — [Narrator] for act and ground, a person\'s NAME for words they speak aloud (the spoken words alone, never "he said"). Narrator lines: plain words, real events, no ornament. Speech lines: a breath each, in the speaker\'s own diction, doing what narration cannot. Every rule below that speaks of sentences binds the [Narrator] lines; "before" ends on a [Narrator] line; the bracketed tags stand outside every word count.';

// round-2 (ROUND1_RESULTS): the opener stamped 8/8 (arrival formula) and the closer stamped as
// a demonstrative quote — a per-call prompt cannot see the last report's shape, so the ENGINE
// rotates the demanded shape (rotation precedent: pay-gloss pools). Pairs rotate together.
const SHAPE_ROTATION: [string, string][] = [
  ['Open "before" on the ground itself — what the place shows before any soldier is named.',
   'The LAST sentence of "after" is someone doing one last concrete thing — never a tally of goods, never what it all meant.'],
  ['Open "before" on the person or thing that will resist — the party arrives to find it already there.',
   'The LAST sentence of "after" is an IMAGE — a thing seen, still or in motion; never a tally of goods, never what it all meant.'],
  ['Open "before" on the party in motion, already at the place.',
   'The LAST sentence of "after" is a short EXCHANGE — someone speaks and someone answers or acts on it; never a tally of goods, never what it all meant.'],
];

// r3 (ROUND2 stamp verdict: 3 molds = 3 stamps): rotation goes COMBINATORIAL — independent
// co-prime axes (openers 4 × closers 5 × speech 3, cycle 60) so adjacent reports never share
// a shape and the one-quote-per-report cadence breaks. Style atomization: axes combine.
const R3_OPENERS = [
  'Open "before" on the ground itself — what the place shows before any soldier is named.',
  'Open "before" on the person or thing that will resist — the party arrives to find it already there.',
  'Open "before" on the party in motion, already at the place.',
  'Open "before" on the first thing HEARD or the first thing that MOVES.',
];
const R3_CLOSERS = [
  'The LAST sentence of "after" is someone doing one last concrete thing — never a tally of goods, never what it all meant.',
  'The LAST sentence of "after" is an IMAGE — a thing seen, still or in motion; never a tally of goods, never what it all meant.',
  'The LAST sentence of "after" is a short EXCHANGE — someone speaks and someone answers or acts on it; never a tally of goods, never what it all meant.',
  'The LAST sentence of "after" belongs to the OTHER side — what those left behind do or say as the party goes.',
  'The LAST sentence of "after" is the road — the party already moving, the place at their backs.',
];
const R3_SPEECH = [
  'No one speaks in this report — the telling is all act and image.',
  'One line of speech, quoted, that does something narration cannot — an answer, a refusal, a demand. Speech can be a fragment.',
  'One short exchange — two voices, a line each; people answer sideways.',
];
let r3tick = 0;

function resolveCoreHead(): string {
  if (PROSE_VARIANT === 'beat') return RESOLVE_HEAD_FRAME + RESOLVE_STYLE_BEAT;
  if (PROSE_VARIANT === 'dlg') return RESOLVE_HEAD_FRAME + RESOLVE_STYLE_DLG;
  if (PROSE_VARIANT === 'exemplar' || PROSE_VARIANT === 'stack') {
    return RESOLVE_HEAD_FRAME + RESOLVE_STYLE_DIET + '\nWrite in the VOICE of this sample — copy the voice, never its people, events, or words:\n'
      + VOICE_EXEMPLARS[exemplarTick++ % VOICE_EXEMPLARS.length];
  }
  if (PROSE_VARIANT === 'diet' || PROSE_VARIANT === 'r2') return RESOLVE_HEAD_FRAME + RESOLVE_STYLE_DIET;
  return RESOLVE_HEAD_FRAME + 'GAME WRITING, not literature: entries in a game session log, read once between dice rolls. Past tense. Plain everyday English; short sentences; no semicolons; no similes. Every sentence changes the picture of the job — progress, a setback, a cost, a gain, a fact learned; a sentence of soldiers merely moving or handling gear is cut, and so is a mood-only sentence.';
}

// the rule stack: rhythm, one spoken line, load-bearing strangeness (+r2: on-screen
// transactions — "the spear made the exchange" class), with r2's rotating opener shape
function proseStack(shape: string[] | null, sceneMode?: 'physical' | 'wits' | 'social'): string {
  if (PROSE_VARIANT !== 'stack' && PROSE_VARIANT !== 'diet' && PROSE_VARIANT !== 'r2' && PROSE_VARIANT !== 'r3' && PROSE_VARIANT !== 'r4' && PROSE_VARIANT !== 'dlg') return '';
  // r3: the speech directive rotates (none / one line / exchange) — the always-one-quote
  // cadence was itself a stamp; the line-quality bar (anti-receipt) rides the rolled directive
  const rhythm = PROSE_VARIANT === 'dlg'
    ? 'Vary the [Narrator] lines\' length — let one run long where cause links to effect, and keep the shortest for the moment that matters.'
    : 'Vary sentence length — let one sentence run long where cause links to effect, and keep the shortest for the moment that matters; never three sentences of the same length in a row.';
  const speech = PROSE_VARIANT === 'dlg'
    ? 'Break narrator runs with a voice where anyone on stage can speak — never three [Narrator] lines running then; a lone soldier gets no invented listener, and a silent scene may run all [Narrator]. The ground moves between exchanges.'
    : PROSE_VARIANT === 'r3' && shape?.[2]
    ? shape[2]
    : PROSE_VARIANT === 'r4'
      ? 'One line of speech, quoted, that does something narration cannot — an answer, a refusal, a demand. Speech can be a fragment; people answer sideways.'
      // round-5 parley branch REVERTED (batch K: the lone parley sample garbled its blocking —
      // mug/cup smear, informant's fact in the questioner's mouth — consistent with the
      // demand-overload law; n=1 but the prior is 3× measured)
      // SPARSE_SPEECH lab (2026-07-24, designer: "dialogue ONLY when needed"): drops the soft
      // one-line quota — narration leads, speech is the exception
      : process.env.SPARSE_SPEECH === '1'
        ? 'Dialogue is not required — quote a line only where it does what narration cannot: a demand, a refusal, an answer that turns the moment. Never quote for flavor.'
        // SHIPPED DEFAULT 2026-07-24 (batch N, SAMPLES_SPARSE_AB.md): scene-conditioned speech —
        // the engine's sceneMode decides where dialogue is INVITED (social) vs merely permitted.
        // Measured: permission-only reads as prohibition (0 quotes/14); the always-one quota
        // metronomes (16/16) and staples quotes on after their summary; scene-conditioning took
        // the batch's peaks (two 8s) at C 6.5 · A 6.25 · B 5.5. SPEECH_MODE=quota restores the quota.
        : process.env.SPEECH_MODE !== 'quota'
          ? (sceneMode === 'social'
            ? 'Words decide this job — let a short exchange carry the turn: two voices, a line each, people answer sideways.'
            : 'Dialogue is not required — quote a line only where it does what narration cannot: a demand, a refusal, an answer that turns the moment. Never quote for flavor.')
          : 'One line of speech, quoted, where it changes something. Speech can be a fragment; people answer sideways.';
  return '═══ THE TELLING ═══\n' + rhythm + '\n' + speech
    + '\nAnything uncanny on stage acts by its strange nature or stays off the stage — a wonder that two hired guards could replace is furniture.'
    + (PROSE_VARIANT === 'r2' ? '\nEvery give, take, or yield happens as hands, words, or blows ON SCREEN — never told as an abstract exchange or a price paid.' : '')
    // r3 (ROUND2): the garble class = the model juggling 4+ named props; cap the manifest
    + (PROSE_VARIANT === 'r3' || PROSE_VARIANT === 'r4' ? '\nThe "after" names at most TWO objects; everything else stays unnamed — "it", "the rest", or absent.' : '')
    + (shape && (PROSE_VARIANT === 'r2' || PROSE_VARIANT === 'r3') ? '\n' + shape[0] : '');
}

// inputs section per-call: rules about fields this call doesn't carry are pure parse-load
// for a cold model (context-free audit 2026-07-17)
const resolveInputs = (q: ResolveQuestInput) => [
  '═══ YOUR INPUTS ═══',
  '- outcome: success = the job done clean — the JOB AS WRITTEN, no more and no less: everything the job line asked for lands, and never take or finish what it only asked to find or scout. partial = done at a COST you must show. failure = the job NOT done; a consequence lands.',
  '- party: the soldiers sent, COMPLETE (one soldier means ALONE — no "the others"; every member comes home with the party). Pronouns come from tags — a "female" tag is she/her in every clause. A member\'s dossier memory may surface ONLY when the scene calls it up — one touch per person at most, most reports need none, expressed as a NEW action; an invented memory reads true once and false forever. Party members are never the culprit of their own job.',
  '- sceneFacet: one facet you MAY take a single concrete detail from (never write the field\'s name or wording); when it fits nothing in this job, ignore it.',
  // the loot rules are the longest paragraph here, and with coin no longer dealt (NOCOIN) most
  // reports have NO loot — a cold reader called them dead weight crowding out the rules that apply
  // (context-free check, 2026-09-25). They render only when there is something to weave.
  q.deliveredSummary === 'nothing beyond the job itself' && process.env.TRIM !== '0'
    ? '- deliveredSummary: nothing changes hands beyond the job itself — report the work, nothing else.'
    : '- deliveredSummary: what ends in the COMPANY\'s hands — weave any ITEMS or PEOPLE it lists into the action as things changing hands in-fiction, never repeating its amounts or wording (a take that is ONLY coin has nothing to weave — the report simply ends on the job done). THE CARD\'S FICTION IS BINDING: the job\'s own objective, as the card words it, resolves on screen FIRST and completely, and changes hands EXACTLY ONCE — never taken, handed over, or seized twice; an item this lists that the card never mentioned comes to hand DURING the work, in the place the scene is already standing in and as part of an action someone takes — never appended once the job is done, never on premises anyone on the card owns, lives on, or works, and never renamed to stand in for the card\'s objective. Do not invent unowned ground for it to lie on. GOLD IS NEVER STAGED: no purses, no payment moments, no telling of pay received, reported, or logged — pay lives entirely outside your text. If the job\'s wording seems to promise away something this lists, the company\'s take wins — the fiction explains how.',
  q.deliveredCharacters?.length ? '- deliveredCharacters: people the job handed over — flesh each: who = ONE character-card line, shape "A [station or origin]. [One hook — a drive, a past, or a temper.]" — timeless identity, never current custody or quest-state; backstory = 2 sentences of concrete events growing out of THIS job\'s fiction, one detail a reader could love, pity, or worry over; quirks = 1-2 concrete PHYSICAL habits, an action never an adjective (never the stock fidgets: fingering an object, humming, wrist-rubbing, cloth-folding).' : '',
  // LAB PCOST: the engine rolls what a partial costs. Left to itself the report reaches for blood
  // on nearly every partial (5 of 6 in one playthrough), where QUESTS §105 says a costly partial
  // carries a minor wound only occasionally.
  q.partialCost && process.env.PCOST !== '0' ? '- partialCost: the ONE price this partial exacts — wound (one of the party hurt), gear (something carried, lost or broken), time (it ran long), goodwill (someone there turned against the company) or finish (the job left rough). Show that price HAPPENING, in your own words; never write the word itself, and no wound unless it says wound.' : '',
  // LAB LEADWORD: the lead this job earns, minted before narration so the report can name it
  q.earnedLead && process.env.LEADWORD === '1' ? '- earnedLead: paying work the company comes home having HEARD OF — show them learning of it, in the field, in a clause; it is news of a job, never a job done.' : '',
  q.fixNotes?.length ? '- fixNotes: defects a zero-context reader found in your REJECTED previous report — write it afresh with none of them.' : '',
  PROSE_VARIANT === 'beat' ? '- sceneMode: how this job turns — physical = a bodily act decides it; wits = a found thing or fact decides it; social = words decide it (the speech IS the turn).' : '',
].filter(Boolean).join('\n');

const BEAT_OUTPUT = (finale: boolean) => [
  '═══ YOUR OUTPUT ═══',
  '1) "before" — the party arrives and the challenge shows itself: at most TWO sentences, past tense, written WITHOUT looking at the outcome; the last words put the concrete obstacle on stage — never the prize, never a task restated. Everything the turn will need is on stage here. Anything uncanny on stage acts by its strange nature or stays off.',
  '2) "turn" — ONE clause, PRESENT tense, no name in it (the game shows the doer): the single act that settles the job — what a comic panel would draw; on failure or partial, the act failing on screen. An act two eyes could watch — hands, feet, words moving; summary verbs (secures, handles, deals with, manages) are banned.',
  '3) "turnActor" — the given name of the party member who does it, exactly as party spells it.',
  '4) "speech" — spoken lines as {who, says}: sceneMode physical or wits → at most ONE line, only where words change something (none is fine); social → exactly TWO lines, an exchange — a demand or question and a sideways answer. Each line one breath, twelve words at most, in the speaker\'s own diction; who = a party member\'s given name or a person the before staged, named as the before named them.',
  '5) "after" — the YIELD: what the company now holds or knows and what it cost, at most TWO sentences, past tense; a learn-or-uncover job states the answer IN FULL; a FAILED job wins NOTHING — what it sought stays unfound and unlearned. A wound lands here in plain words. The last words are a concrete image or act — never a tally of goods, never what it all meant, and never a restatement of the turn.',
  '- injuries: ONLY when the fiction put a member in harm\'s way — a clean success lists none, never death, empty array when nobody was hurt. cause = an exact phrase FROM YOUR OWN after text showing that person taking the hurt. Bands: low = days; med = weeks and a scar; high = months — and the wound\'s LANGUAGE matches its band.',
  `- WORD BUDGET (hard caps, count): common → before ≤25, turn ≤12, each speech line ≤12, after ≤30. uncommon → ≤30 / ≤12 / ≤12 / ≤40. rare${finale ? ' or finale' : ''} → ≤40 / ≤14 / ≤12 / ≤55. Fewer words is BETTER — the strip is read in seconds between dice.`,
  '- edges: 0-2, only moments that should be REMEMBERED; blurb one line; importance a NUMBER 0-1 (0.8+ = defining); ids only from party/deliveredCharacters in this message.',
].join('\n');

const BEAT_ANCHOR = '═══ ABOVE ALL (write now) ═══\n1. Every piece parses ONE way on one skim — subject and verb early.\n2. From turn and after together the result is unmistakable: what was won or lost, what the company now holds or knows.\n3. GOLD IS NEVER STAGED and pay stays outside the text; no numbers or amounts in prose; period diction; never echo an instruction or field name ("approach", "plan", "outcome", "step", "dice", "roll", "obstacle", "sceneMode", "turn" are system words that never appear in the text); the account-book (ledger, registry, record-book) is BANNED in prose.\n4. The pieces never repeat each other — the after continues past the turn, it does not retell it.\nRespond as the JSON object specified below — nothing else.';

const RESOLVE_OUTPUT = (finale: boolean) => [
  '═══ YOUR OUTPUT ═══',
  '1) "before" — the SETUP, written WITHOUT looking at the outcome, in two moves: the party arrives, then the CHALLENGE SHOWS ITSELF — the LAST sentence states, in the indicative, the concrete thing that now stands in the way — a live obstacle, never the prize itself, never a statement that something cannot be reached, never an order or task restated — on a full stop (never an em-dash, ellipsis, or scenery). Everything the outcome will need — foes, tools, helpers — is on stage HERE. It ADDS something the card did not say, never hints at the result, never reveals what the job has yet to find. Vary the opening sentence\'s grammar AND the final obstacle sentence\'s shape report to report — the same verb of blocking twice running is a stamp; skip the departure from the fort (mist, rain, and time-of-day openers are stamps).',
  '2) "after" — what happened, knowing the outcome. The first sentence is the decisive moment or its result, never a restatement of the job. Events in the order they mattered: how the attempt met the challenge and what it cost. The reader must finish knowing EXACTLY what was achieved or lost; a learn-or-uncover job states the answer IN FULL, told ONCE — the find and what it means, never an inventory of signs (a fact "learned" but not said is nothing reported). Name a party member only where they personally turned the job; a member with no such moment gets no invented one, and never their trait word. ' + (PROSE_VARIANT === 'r3' || PROSE_VARIANT === 'r4' ? 'A wound lands in ONE plain sentence of its own — who was hurt, what struck, where it bit — set where it happened; never a default body part, never the same wound sentence twice, never a wound not listed in injuries.' : 'Wounds ride inside their action beats — never a default body part, never the same wound sentence twice, never a wound not listed in injuries.') + ' On failure, show in-fiction what was lost — fresh words each time. An unnamed person enters by trade, never a coined name; an absent client is not staged. ONE SCENE, ONE TRUTH: the after acts ONLY through people and things the before staged, exactly as it left them — same place, same state (a thing on a stall is taken from the stall; a person staged alive dies only by an on-screen event); the party stays on the staged ground to the last act (no cutting away and back); no new foes, tools, or helpers appear mid-outcome; a staged threat acts or is dealt with, never reported absent.',
  '- injuries: ONLY when the fiction put a member in harm\'s way — a clean success lists none, never death, empty array when nobody was hurt. cause = an exact phrase FROM YOUR OWN after text showing that person taking the hurt. Bands: low = days; med = weeks and a scar; high = months — and the wound\'s LANGUAGE matches its band (a low wound reads as a nick, never a lodged spear).',
  // SHIPPED 2026-07-18: reference-band budgets (FoC outcomes 60-250w measured from source; ours sat
  // at the 70w minimum). Blind A/B: long 5.8 vs short 5.2, best-of-batch scene needed the room;
  // watch class = investigate-scene evidence-inventory waffle. RES_SHORT=1 restores legacy caps.
  process.env.RES_SHORT !== '1'
    ? `- WORD BUDGET (hard caps, count), set by GRAVITY: a small everyday job → before ≤22, after ≤45. a serious matter → ≤40 / ≤90. a grave affair${finale ? ' or finale' : ''} → ≤60 / ≤140. On a small everyday job the report carries ONLY what was won or lost and what it cost — no second beat, no character touch, no closing image; it ends the moment the result is plain. Length is room, not a target — a report that says everything in fewer words is BETTER; spend the room on the confrontation and the cost, never on packing, travel, or restating. When it cannot all fit keep, in order: the RESULT, the cost, the client\'s promise handled, any character touch.`
    : `- WORD BUDGET (hard caps, count): common → before ≤25, after ≤45. uncommon → ≤35 / ≤65. rare${finale ? ' or finale' : ''} → ≤50 / ≤95. When it cannot all fit keep, in order: the RESULT, the cost, the client\'s promise handled, any character touch.`,
  // SPEECH_ANCHORS lab (2026-07-24, designer: RPG-style narration/dialogue alternation): prose
  // stays prose (script-format resolutions measured-worse, DIALOGUE_AB.md); the model merely
  // LISTS its own quotes with speakers so the renderer can split display at anchored quotes
  process.env.SPEECH_ANCHORS === '1'
    ? '- speech: every quoted line your before/after contain, in order, as {who, says} — says = the quote EXACTLY as it stands in your text, word for word; who = the speaker as your text names them (a given name, or a trade like "the barkeep"). No quotes in the text = empty array.'
    : '',
  '- edges: 0-2, only moments that should be REMEMBERED; blurb one line; importance a NUMBER 0-1 (0.8+ = defining); ids only from party/deliveredCharacters in this message.',
].filter(Boolean).join('\n');

const resolveAnchor = (shape: string[] | null) => '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way on one skim — subject and verb early; a carry-list holds only what hands can carry.\n2. The result is unmistakable' + (PROSE_VARIANT === 'r3' || PROSE_VARIANT === 'r4' ? ', shown ONCE — never restated in a second or third sentence' : '') + ': what was won or lost, what the company now holds or knows — and a FAILED job wins NOTHING: what it sought stays unfound and unlearned, never handed out by the failure\'s own telling.\n3. The report ENDS at the job\'s last act in the field: the coin payment and the walk home always stay OUTSIDE your text — but when the job\'s own objective is to deliver or hand something over AND the receiver stands on the staged ground, THAT handover IS the last act and is shown (a receiver elsewhere is never staged — the report ends with the goods secured for the road); only the coin that would follow it is not.\n4. Period diction; never echo an instruction or field name ("approach", "plan", "outcome", "step", "dice", "roll", "obstacle", "payer" are system words that never appear in prose); the account-book (ledger, registry, record-book) is BANNED in prose.\n'
  + (shape ? '5. ' + shape[1] + '\n'
    : PROSE_VARIANT === 'dlg' ? '5. The LAST line of after is a spoken line or a [Narrator] image — never a tally of goods, never what it all meant.\n'
    : (PROSE_VARIANT === 'stack' || PROSE_VARIANT === 'diet' || PROSE_VARIANT === 'r4') ? '5. The LAST sentence of after is a concrete act, an image, or a spoken line — never a tally of goods, never what it all meant.\n' : '')
  + 'Respond as the JSON object specified below — nothing else.';

// returns [openerDirective, closerDirective, speechDirective?] — r2 pairs, r3 triple
function rollShape(): string[] | null {
  if (PROSE_VARIANT === 'r2') return SHAPE_ROTATION[exemplarTick++ % SHAPE_ROTATION.length] ?? null;
  if (PROSE_VARIANT === 'r3') {
    const t = r3tick++;
    let closer = R3_CLOSERS[t % 5]!;
    const speech = R3_SPEECH[t % 3]!;
    // a no-speech report cannot demand an exchange closer
    if (t % 3 === 0 && t % 5 === 2) closer = R3_CLOSERS[1]!;
    return [R3_OPENERS[t % 4]!, closer, speech];
  }
  return null;
}

/** THE REPORT ON A ROUTINE JOB. Two beats — a staged arrival, then the outcome — is what a story
 *  step needs; on a job the company does between the matters that mean something, the arrival is
 *  filler and the reader has read twenty of them. One beat in, one beat out (designer, 2026-08-27).
 *  The craft stack (rhythm, speech, scene-mode, the rotated closer) is deliberately absent: it is
 *  what makes a saga step worth reading and what makes a routine one exhausting. */
const oneOffLightResolveSystem = (q: ResolveQuestInput): string => {
  const canBond = q.party.length > 1;   // both ends of an edge must be a soldier who was there
  return [
  resolveCoreHead(),
  resolveInputs(q),
  TAGS_NOTE, NUMBER_BAN, canBond ? EDGE_TYPES_LINE : '',
  '═══ YOUR OUTPUT ═══',
  // (BEFORE2/BEFORE3 — opening on the obstacle mid-act — measured 2026-09-25: +0.8 prose but
  // invented unexplained figures, and the clarity-safe rewrite gained nothing. Not shipped.)
  // (BEFORE4 — "what the job is about is in view" instead of "the thing in their way" — measured
  // 2026-09-25 on a mixed set incl. hires: invented obstacles 3/17 -> 1/17 but job done 1.85 -> 1.62
  // and prose 4.79 -> 4.38. Not shipped.)
  '1) "before" — ONE sentence: the party is on the ground and the thing in their way is visible. No approach, no weather, no journey, and nothing is taken yet. TWENTY WORDS AT MOST.',
  // MEASURED 2026-09-25 (with NOCOIN, same cards and outcomes, 2 blind judges, r 0.87): the job
  // actually done 9/14 -> 14/14, prose 3.89 -> 4.61. The old line made "whatever the company ends
  // up with" the subject of the report, so a stolen-totem job came home with a shield and no totem.
  process.env.LIGHTJOB !== '0'
    ? '- inside "after": the card\'s JOB is what gets done — its own objective, as the job words it, finished on screen' + (process.env.ANSWER === '1' ? '; a job that asks something gets its ANSWER, said plainly in the report itself' : '') + '. Anything deliveredSummary lists comes to hand in the same stroke, never instead of it — no separate discovery, no amounts.'
    : '- inside "after": whatever the company ends up with (deliveredSummary) changes hands in ONE clause of the work itself — no separate discovery, no amounts. If there is only coin to take, the report simply ends on the job done.',
  '2) "after" — what happened, knowing the outcome, and what it cost WHEN it cost something: a clean success costs nothing and says so by not mentioning it. Open on the decisive moment, not on a restatement of the job. FORTY-FIVE WORDS AT MOST, and coming in well under is better. ' + (process.env.TRIM === '0' ? 'No closing image, ' : '') + 'No line of speech, no second beat: it ends the moment the result is plain.',
  '- injuries: ONLY when the fiction put a member in harm\'s way — a clean success lists none, never invent one to fill the field. cause NAMES the member.',
  // Cards no longer carry names, so on a routine job the only people with ids are the soldiers
  // sent — a cold reader correctly refused to write an edge to "the widow" because it had no id
  // and was forbidden to coin one, and emitted [] for the wrong reason. Say the real rule: this
  // is routine work, it usually leaves no mark, and only the company's own people can be an end.
  canBond
    ? '- edges: BOTH ends must be an id from party — nobody else in this scene has one. Routine work rarely leaves a mark: [] is the normal answer, and 1 is the most a job like this ever earns. blurb one line; importance a NUMBER 0-1 (0.3 routine, 0.9 defining).'
    : '- edges: always [] — one soldier went out alone, and an edge joins two of the company\'s own.',
  q.deliveredCharacters?.length
    ? '- fleshed: one entry per deliveredCharacters id — this is the ONLY call that knows how they came into the company\'s hands, so their who/backstory must belong to THIS job.'
    : '- fleshed: [] — nobody is handed over on this job.',
  // MEASURED 2026-09-25, 3 rounds x ~16 cards, 2 blind judges each (r 0.86-0.89): "what the company
  // now holds" asked for the bookkeeping closer judges named every round ("into the company's
  // hands", "the job was done"). Showing the result by the act instead: prose 3.93 -> 4.63 pooled,
  // bookkeeping closers 35/49 -> 9/49, clarity unchanged (30/49 vs 29/49).
  '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way on one skim — subject and verb early.\n2. The result is unmistakable FROM THE ACT ITSELF — a FAILED job wins NOTHING.\n3. The last sentence is the job\'s last act in the field, or what it leaves behind to see — never a sentence saying the job is done, the task complete, or where the goods went. No numbers in prose.\n4. Period diction; never echo an instruction or a field name ("approach", "plan", "outcome", "step", "dice", "roll", "obstacle" are system words that never appear in prose).\nRespond as the JSON object specified below — nothing else.',
  'Respond as JSON matching: {questId (copy it back exactly), before, after, injuries:[{characterId (an id from party), band: STRICTLY "low"|"med"|"high" — note "med", not "mid", cause}], fleshed:'
    + (q.deliveredCharacters?.length ? '[{characterId,who,backstory,quirks}]' : ' []')
    + ', edges:[{from,to,type,blurb,importance}]}',
  ].filter(Boolean).join('\n');
};

const oneOffResolveSystem = (q: ResolveQuestInput, shape = rollShape()) => {
  // a small job is ROUTINE work and gets the one-beat report; serious and grave one-offs keep the
  // full craft stack, which is what the saga steps use
  if (q.gravity?.startsWith('a small') && PROSE_VARIANT !== 'beat') return oneOffLightResolveSystem(q);
  const beat = PROSE_VARIANT === 'beat';
  return [
    resolveCoreHead(),
    resolveInputs(q),
    TAGS_NOTE, NUMBER_BAN, EDGE_TYPES_LINE,
    beat ? BEAT_OUTPUT(false) : RESOLVE_OUTPUT(false),
    proseStack(shape, q.sceneMode),
    beat ? BEAT_ANCHOR : resolveAnchor(shape),
    'Respond as JSON matching: {questId, before, ' + (beat ? 'turn, turnActor, speech:[{who,says}], ' : '') + 'after, injuries:[{characterId, band: STRICTLY "low"|"med"|"high", cause}], fleshed:' + (q.deliveredCharacters?.length ? '[{characterId,who,backstory,quirks}]' : ' [] (no one was handed over)') + ', edges:[{from,to,type,blurb,importance}]}',
  ].filter(Boolean).join('\n');
};

/** the writer's TRANSPORT. 'openai' = production (and the default real AI). 'claude' = the designer's
 *  FREE playtest transport: the same prompts, byte for byte, sent through the headless Claude CLI on the
 *  Claude subscription (claudecli.ts; designer 2026-10-02 — production stays GPT) */
export type WriterTransport = 'openai' | 'claude';

export function makeOpenAiProvider(opts: { transport?: WriterTransport } = {}): AiProvider {
  const transport: WriterTransport = opts.transport ?? 'openai';
  let client: OpenAI | null = null;   // built on the first OpenAI call — the claude transport never needs the key
  if (transport === 'openai') client = new OpenAI({ apiKey: loadKey() });
  const usage: AiUsage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, ...(transport === 'claude' ? { listCostUsd: 0 } : {}) };
  const records: AiCallRecord[] = [];
  // TEMPO I8: purpose used to be ONE mutable variable set by whichever method ran last, and the
  // ordinal was read before it was incremented. With calls in flight at once that mislabels every
  // row and collides the numbering — and this log is the instrument the whole tempo phase is
  // measured with, so it has to be right BEFORE anything is concurrent. Both now travel with
  // the call.
  let ordinal = 0;
  // the player's campaign direction (Settings): appended to every WRITER call's system prompt, and
  // only when set — with none, every prompt is byte-for-byte what it was
  let direction: CampaignDirection | null = null;
  const DIRECTED = new Set(['writeQuest', 'resolve', 'flesh', 'themeRoll']);
  const directionBlock = (d: CampaignDirection) => `\n\nCAMPAIGN DIRECTION — the player chose this for their game. Let it shape the tone, `
    + `the setting details and who appears, within everything above. Never quote it or name it.\n${d.guidance}`
    + (d.avoid.length ? `\nKeep out of the story: ${d.avoid.join('; ')}.` : '');

  /** `extra.tier` names the call's tier outright (the saga calls: the plan on PLAN, the rest on WRITER); without it the
   *  tier is read off the purpose. `template` / `flags` label a saga call in the logs */
  type Extra = { tier?: 'plan' | 'writer' | 'nano'; template?: string; flags?: string[] };
  async function call<S extends z.ZodTypeAny>(purpose: string, model: string, system0: string, user: string, schema: S, effort?: 'minimal' | 'low' | 'medium', extra: Extra = {}): Promise<z.output<S>> {
    const system = direction && DIRECTED.has(purpose) ? system0 + directionBlock(direction) : system0;
    const t0 = Date.now();
    const rec: AiCallRecord = {
      n: ++ordinal, purpose, model, durationMs: 0,
      inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, ok: false,
      ...(extra.template ? { template: extra.template, flags: [...(extra.flags ?? [])].sort() } : {}),
      systemPreview: system, userPrompt: user.slice(0, 20000),
    };
    records.push(rec);
    if (records.length > 120) records.splice(0, records.length - 120);
    // AIRAIDER_CALL_LOG: the whole call, untruncated, as it settles (logging only)
    let rawOut: string | undefined;
    // the tier comes from the PURPOSE, never from model equality: tiers may share a model (all GPT-6 Luna today),
    // and the Claude transport still has to send the mechanical calls to Haiku and the rest to Sonnet
    const tier = extra.tier ?? (NANO_PURPOSES.has(purpose) ? 'nano' : 'writer');
    const tierEffort = effort ?? (tier === 'nano' ? 'minimal' : 'low');
    const claudeOpts = transport === 'claude' ? claudeOptsFor(tier, tierEffort) : null;
    const logFull = () => appendCallLog({
      t: new Date().toISOString(), provider: transport, n: rec.n, purpose,
      ...(rec.template ? { template: rec.template, flags: rec.flags } : {}), model: rec.model,
      effort: claudeOpts ? claudeOpts.effort ?? `thinking ${claudeOpts.thinkingTokens}` : isReasoningModel(model) ? effortFor(model, tierEffort) : undefined,
      durationMs: rec.durationMs, inputTokens: rec.inputTokens, outputTokens: rec.outputTokens,
      cachedTokens: rec.cachedTokens, costUsd: rec.costUsd, ...(rec.listCostUsd !== undefined ? { listCostUsd: rec.listCostUsd } : {}),
      ok: rec.ok, error: rec.error, system, user, output: rawOut,
    });
    try {
      if (claudeOpts) {
        // the playtest transport: same system + user text, the subscription pays (costUsd stays 0; the
        // API list price is kept as listCostUsd, for information only)
        rec.model = claudeOpts.model;
        const r = await runClaude(system, user, claudeOpts);
        usage.calls++;
        usage.inputTokens += r.inputTokens;
        usage.outputTokens += r.outputTokens;
        usage.listCostUsd = (usage.listCostUsd ?? 0) + r.listCostUsd;
        rec.model = r.model;
        rec.durationMs = Date.now() - t0;
        rec.inputTokens = r.inputTokens; rec.outputTokens = r.outputTokens; rec.cachedTokens = r.cachedTokens; rec.listCostUsd = r.listCostUsd;
        rec.output = r.text.slice(0, 8000);
        rawOut = r.text;
        if (!r.json) throw new Error('no JSON object in the reply');
        const out = schema.parse(r.json);
        rec.ok = true;
        logFull();
        return out;
      }
      // effort per tier (STORY_ENGINE §10.5): prose at low (PROMPTS.md — latency is gameplay),
      // the mechanical nano tier at minimal
      // reasoning_effort exists only on the reasoning families (gpt-5, gpt-6); 4.x models reject it
      const isReasoning = isReasoningModel(model);
      client ??= new OpenAI({ apiKey: loadKey() });
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' },
        ...(isReasoning ? { reasoning_effort: effortFor(model, tierEffort) } : {}),
      } as never) as OpenAI.Chat.Completions.ChatCompletion;
      usage.calls++;
      const inTok = res.usage?.prompt_tokens ?? 0;
      const outTok = res.usage?.completion_tokens ?? 0;
      const cached = (res.usage as { prompt_tokens_details?: { cached_tokens?: number } } | undefined)
        ?.prompt_tokens_details?.cached_tokens ?? 0;
      usage.inputTokens += inTok;
      usage.outputTokens += outTok;
      // list pricing per model for the meter
      const [pIn, pCached, pOut] = priceOf(model);
      const cost = ((inTok - cached) * pIn + cached * pCached + outTok * pOut) / 1e6;
      usage.costUsd += cost;
      rec.durationMs = Date.now() - t0;
      rec.inputTokens = inTok; rec.outputTokens = outTok; rec.cachedTokens = cached; rec.costUsd = cost;
      const raw = res.choices[0]?.message?.content ?? '{}';
      rec.output = raw.slice(0, 8000);
      rawOut = raw;
      const out = schema.parse(JSON.parse(raw));
      rec.ok = true;
      logFull();
      return out;
    } catch (e) {
      rec.durationMs = Date.now() - t0;
      rec.error = (e as Error).message?.slice(0, 300);
      logFull();
      throw e;
    }
  }

  /** one retry on parse/validation failure — a single hiccup must not ship fallback prose */
  async function callR<S extends z.ZodTypeAny>(purpose: string, model: string, system: string, user: string, schema: S, effort?: 'minimal' | 'low' | 'medium', extra: Extra = {}): Promise<z.output<S>> {
    try { return await call(purpose, model, system, user, schema, effort, extra) }
    catch (e) {
      if (process.env.AI_DEBUG) console.error('[ai] retrying after:', (e as Error).message?.slice(0, 200));
      return call(purpose, model, system, user, schema, effort, extra);
    }
  }

  // tolerant: a list, a comma string, or an object of lists (by group) all become one flat id list
  const zIds = z.preprocess(v => Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,;]/)
    : v && typeof v === 'object' ? Object.values(v as Record<string, unknown>).flat() : [], z.array(z.string()).transform(a => a.slice(0, 12)));
  const zDirection = z.object({
    guidance: z.string().default(''), npcPrefer: zIds, npcAvoid: zIds, recruitPrefer: zIds, recruitAvoid: zIds, avoid: zIds,
  });
  return {
    name: transport,
    ...(transport === 'claude' ? { concurrency: claudePool() } : {}),
    setDirection(d: CampaignDirection | null) { direction = d },
    async interpretDirection(text: string, vocab: Record<string, string[]>): Promise<DirectionRead> {
      const system = [
        'A player typed a free-text direction for the AI storyteller of their fantasy mercenary-company game.',
        'Turn it into JSON with exactly these fields:',
        '- guidance: the player\'s OWN tone/setting/content wishes restated as one or two plain instructions to a writer',
        '  (a bare genre like "dark fantasy" becomes what that means for the writing: tone, events, atmosphere). Add nothing',
        '  the player did not ask for. Leave out trait wishes — the lists below carry them. Empty string if they gave none.',
        '- npcPrefer / npcAvoid: TRAITS the player wants more of / never for the people the company MEETS (clients, villains,',
        '  captives, strangers). recruitPrefer / recruitAvoid: the same for people who JOIN the company as soldiers.',
        '  A wish about "characters" or "everyone" goes in both. Use ONLY ids from this vocabulary (group: ids):',
        ...Object.entries(vocab).map(([g, ids]) => `    ${g}: ${ids.join(', ')}`),
        '  Empty lists when the player says nothing about traits.',
        '- avoid: short phrases for story CONTENT the player explicitly does not want (empty list if none).',
        'Ignore anything that is not about the story or its people.',
        'Reply with ONE JSON object of exactly this shape (every list is a flat list of id strings):',
        '{"guidance": "...", "npcPrefer": [], "npcAvoid": [], "recruitPrefer": [], "recruitAvoid": [], "avoid": []}',
      ].join('\n');
      // once per settings save, so the writer model (accuracy over a fraction of a cent)
      const out = await call('direction', WRITER_MODEL, system, text, zDirection);
      return { guidance: out.guidance.slice(0, 400), npc: { prefer: out.npcPrefer, avoid: out.npcAvoid },
        recruit: { prefer: out.recruitPrefer, avoid: out.recruitAvoid }, avoid: out.avoid.map(a => a.slice(0, 80)) };
    },
    usage: () => ({ ...usage }),
    callLog: () => [...records],

    async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
      // §0 + 2026-07-13 research ruling: a self-contained prompt — every rule stated ONCE; output spec + critical rules at
      // the END. (Sagas are written by the v4 storyteller, sagaCall below.)
      const system = oneOffSystem(input);
      // a ROUTINE card is dealt only what it can spend. level/rarity/gravity/rewardEnvelope exist
      // for it only to be told to ignore them, and a cold reader counted that as a third of the
      // prompt spent introducing dead fields (2026-08-27).
      const routine = !!input.gravity?.startsWith('a small');

      const user = JSON.stringify({
        archetype: input.archetype, location: input.location, method: input.method, obstacle: input.obstacle,
        selfDirected: input.selfDirected, shape: input.shape,
        // level was explained to the writer but never SENT — the verifier caught the model
        // hunting for a field that wasn't there (weight-class calibration silently dead)
        ...(routine ? { slotCount: input.slotCount } : {
          rarity: input.rarity, level: input.level,
          slotCount: input.slotCount, rewardEnvelope: input.rewardEnvelope, gravity: input.gravity,
        }),
        KEYWORDS: input.keywords?.join(' · ') || undefined,
        rewardItems: input.rewardItems?.length ? input.rewardItems : undefined,
        placeNameSuggestions: input.placeNameSuggestions,
        framedCharacter: input.framedCharacter ?? undefined,
        avoid: input.avoid?.length ? input.avoid : undefined,
        opening: input.opening,
        intake: input.intake,
      });
      // 🛠 effort A/B (2026-07-12, seeds 39019 low vs 40020 medium): medium bought NO judge-score
      // gain on cards (4-5/10 both) at 2.3x cost and 3x latency — cards stay LOW; structure over effort
      const out = await callR('writeQuest', WRITER_MODEL, system, user, zQuestWrite);
      return {
        ...out,
        ask: out.ask.map(a => ({
          ...a, extraAttribute: a.extraAttribute ?? null,
          requirementTag: a.requiredTag ?? null, mustBeFocal: a.mustBeFocal ?? false,
        })),
      };
    },

    async resolve(inputs: ResolveQuestInput[], onEach?: (out: ResolveQuestOut) => void): Promise<ResolveQuestOut[]> {
      // a throwing consumer must never take the batch down with it (2026-08-26: onEach runs
      // engine effects — the reckoning still owes the player the other quests' reports)
      const emit = (out: ResolveQuestOut) => {
        try { onEach?.(out) } catch (e) { console.error('[ai] resolve onEach threw:', (e as Error).message?.slice(0, 300)) }
      };
      // one batched call per quest, fired in parallel (the cycle's single reckoning); a self-contained prompt — rules
      // stated once, output spec + critical rules at the END. (A saga's reports are the storyteller's, sagaCall below.)
      const pick = (q: ResolveQuestInput) => oneOffResolveSystem(q);
      // sceneMode is engine-computed unconditionally but only the beat prompt explains it — keep
      // it OUT of the user JSON otherwise (an unexplained field to a non-beat cold model)
      const userJson = (q: ResolveQuestInput) => {
        if (PROSE_VARIANT === 'beat') return JSON.stringify(q);
        const { sceneMode, earnedLead, partialCost, ...rest0 } = q;
        const rest = { ...rest0, ...(earnedLead && process.env.LEADWORD === '1' ? { earnedLead } : {}),
          ...(partialCost && process.env.PCOST !== '0' ? { partialCost } : {}) };
        // a routine report is never told what gravity or rarity are for, because there is nothing
        // for it to do with them — the prompt it got is already the one they chose (2026-08-27)
        if (q.gravity?.startsWith('a small')) {
          const { gravity, rarity, ...lean } = rest;
          return JSON.stringify(lean);
        }
        return JSON.stringify(rest);
      };
      // each call announces itself the instant IT settles — the fallback path included, so a
      // failed narration fills its slot on the screen instead of leaving a placeholder
      return await Promise.all(inputs.map(q =>
        callR('resolve', WRITER_MODEL, pick(q), userJson(q), zResolveOne).catch((e): ResolveQuestOut => {
          if (process.env.AI_DEBUG) console.error(`[ai] resolve fallback for ${q.questId}:`, (e as Error).message?.slice(0, 500));
          return fallbackResolve(q);
        }).then(o => {
          const out: ResolveQuestOut = o;
          emit(out);
          return out;
        })));

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
      if (!inputs.length) return [];
      const system = [
        'You breathe life into characters of a dark-fantasy mercenary company. Each person comes with: name (use as-is), tags, role = what they are to the company (merc = one of its own soldiers, captive = held in its cells, hireling = staff), and context = how they came to the fort — let role and context shape the telling. The tags fix the person\'s SEX and STATION: "female" is she/her and "male" is he/him in every clause, whatever the name\'s sound; who/backstory keep whatever standing the tags and saga (when given) establish — never demote a story\'s central figure to background staff. For EACH person, write:',
        TAGS_NOTE,
        NUMBER_BAN,
        '(Spans and ages told in words are fine; prices, pay, and tallies stay banned.)',
        '- who: their CHARACTER-CARD line — the sentence under a hero\'s portrait. Shape: their station or origin, then ONE hook (a drive, a past, or a temper): "A [what they are/were]. [What drives or marks them.]" Two short plain sentences at most, third person. TIMELESS identity only — never current custody, quest-state, or willingness (those change; the line must not), never a micro-habit (habits live in quirks), never a metaphor or simile ("like a…" and "wore X like Y" are the tell), never merely their name, never a riddle or a poem.',
        '- backstory: 2 sentences of origin that FIT their tags and how they arrived, carrying one detail a reader could love, pity, or worry over — SHOWN inside the telling, never announced as a labeled fact. Plain concrete events — who, where, what happened; never lyrical vagueness or withheld mysteries (a fact the reader can hold beats a mood they cannot). Every word must be consistent with every tag — never contradict one. Never echo these instructions or their wording in the prose.',
        '- if a `saga` is given, that person IS who that story was about (saga.kernel = the one-line idea it was built on; saga.want = what they wanted in it): their backstory must grow out of it so a player who followed the saga recognizes them. Never contradict the saga; never retell it — tell what came BEFORE it.',
        // Without this the fallback path knew only a four-word `context` string and had no choice
        // but to invent an origin — a rescued shrine novice was written a courtesan's past.
        '- if a `quest` is given, that is the JOB the company took to reach this person, and the card the player read (quest.situation) is what the player already believes about them. Their who and backstory must fit it: the trouble named there is the trouble they were in. Never retell the job — tell who they were BEFORE the company came for them.',
        '- quirks: 1-2 concrete PHYSICAL habits a watcher could notice (an action, never an adjective; each a short phrase of a few words). BANNED stock quirks: fingering/thumbing an object, humming or whistling, rubbing a wrist, folding a cloth corner — reach wider (gait, eating, grooming, small rituals, how they stand or carry things), give each person in this batch a DIFFERENT kind of habit, and avoidQuirks (when given) lists habits living characters already own: never re-deal one.',
        'Make the people DISTINCT from each other — no two in a batch open their who-line with the same station phrase (context says how they came; the STATION is yours to individuate). No semicolons — split into two sentences. One prop is BANNED (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        '═══ ABOVE ALL (write now) ═══\n1. Every line is plain and concrete — a fact the reader can hold, never a mood, metaphor, or riddle.\n2. who is TIMELESS; habits live only in quirks; nothing contradicts a tag.\n3. Each person in the batch is DISTINCT: different station openers, different kinds of habit.\nRespond as JSON: {people:[{characterId, who, backstory, quirks:[...]}]} — ids exactly as given, nothing else.',
      ].join('\n');
      const out = await callR('flesh', WRITER_MODEL, system, JSON.stringify(inputs), zFleshBatch);
      const legal = new Set(inputs.map(i => i.characterId));
      return out.people.filter(p => legal.has(p.characterId));
    },

    async themeRoll(input: ThemeRollInput): Promise<ThemeRollOut> {
      const system = [
        'A player renovates a fort room in a style. Choose 3-5 wanted tag WORDS for the room theme — strictly from the provided vocabulary list. One flavor line.',
        NUMBER_BAN,
        'Respond as JSON: {wants:[words], flavorLine}',
      ].join('\n');
      // mechanical tier: a vocab pick + one line — nano, not the prose model (STORY_ENGINE §10.5)
      return call('themeRoll', NANO_MODEL, system, JSON.stringify(input), zTheme);
    },

    async select(input: SelectorInput): Promise<string[]> {
      const system = 'Pick which candidates need FULL dossier context for the writing task. Respond as JSON: {ids:[...]} — at most the requested max. Ids exactly as given.';
      const out = await call('select', NANO_MODEL, system, JSON.stringify(input), zSelect);
      const legal = new Set(input.candidates.map(c => c.id));
      return out.ids.filter(id => legal.has(id.replace(/^id=/, ''))).slice(0, input.max);
    },

    /** the v4 saga storyteller (Phase 2 Step 3): the template rendered as measured, the payload sent verbatim (no
     *  zProse/desemi: the lab measured raw text), the tier named outright — the plan on PLAN (Sol; on the Claude
     *  transport AIRAIDER_CLAUDE_PLAN at medium), card/outline/report on WRITER. Not in DIRECTED: the direction rides in
     *  the payload, so a saga system prompt is byte-stable */
    async sagaCall(c: SagaCall): Promise<unknown> {
      return callR(c.template, c.tier === 'plan' ? PLAN_MODEL : WRITER_MODEL, renderSaga(c.template, c.flags, c.vars), JSON.stringify(c.payload),
        c.schema, c.effort, { tier: c.tier, template: c.template, flags: c.flags });
    },
  };
}
