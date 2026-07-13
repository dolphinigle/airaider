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
  ResolveQuestInput, ResolveQuestOut, ThemeRollInput, ThemeRollOut, SelectorInput, ReviewInput, ReviewOut,
  FleshInput, FleshOut,
} from './provider.js';

// 🛠 lab-overridable (model A/B, e.g. AIRAIDER_WRITER_MODEL=gpt-5.4-nano)
const WRITER_MODEL = process.env.AIRAIDER_WRITER_MODEL || 'gpt-5-mini';
const NANO_MODEL = process.env.AIRAIDER_NANO_MODEL || 'gpt-5-nano';

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
    // the forearm was the only anatomy in this world (11 of 14 second-half wounds).
    // ONE pick per text — a per-occurrence rotation made a wound MIGRATE inside its own
    // report ("struck her forearm… a cut to her shoulder": judges flagged it twice)
    .replace(/\bforearm\b/g, ['forearm', 'shoulder', 'shin', 'hip', 'upper arm'][ei % 5]!)
    // abstract-closer stamp — survived two rounds of prompt bans; dropping the sentence
    // whole is the proven safe transform
    .replace(/(^|[.!?]\s+)The matter closed[^.!?]*[.!?]\s*/g, '$1')
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
    // QUESTS §11 actorUpdates — the WHEREABOUTS ledger (single-location truth per person/object)
    actorUpdates: z.record(z.string()).nullish(),
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
const zReview = z.object({ ok: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true'), defects: zStrArr });

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

const TAG_VOCAB = '════ TAG VOCABULARY ════\nThe complete list of trait words the game engine knows.\nSKILLS: melee, ranged, leadership, magic-fire, magic-earth, magic-water, magic-dark, social, roguery, lore, heal, craft, nature, performance, intimidation, food.\nPERSONALITY: cool, hotheaded, serious, playful, greedy, generous, loner, gregarious, lustful, chaste, dominant, submissive, calculating, instinctive.\nLOOKS: tall, short, endowed, flat.\nquarryTags ALONE may also use — TRADES: ruler, soldier, criminal, priest, mystic, artisan, adventurer, entertainer, merchant, scholar, courtesan, sailor, slave, hunter, peasant, servant. BODY: muscular, scrawny, nimble, clumsy, clever, dull, beautiful, ugly, tough, sickly.\n════════════════════════';

const ASK_SPEC = '- ask: EXACTLY slotCount entries — one per soldier the job needs. attribute (str|dex|int|cha|con): what the test truly demands — force→str, stealth or speed→dex, wits→int, parley→cha, endurance→con; extraAttribute (same five) only when the work is genuinely two-natured. favored (ARRAY of 1-3 TAG VOCABULARY words): traits that help. clashing (ARRAY of 0-2, same list): traits that hurt.\n- requiredTag (rare — at most ONE slot per card, most cards none): one TAG VOCABULARY word the job truly DEMANDS; may carry a rank — "word (mid)" — when mere dabbling won\'t do.';

function oneOffSystem(input: QuestWriteInput): string {
  return [
    '═══ THE JOB ═══\nYou write ONE job card for a dark-fantasy mercenary-fort GAME. The player is the company BOSS at the fort; the card is a short briefing TO them ("you"): what came in, what the job is, what it pays. They read it once and pick which soldiers to SEND — the boss never goes, and the job has not started. Only what has reached the fort goes on the card. GAME WRITING, not literature: every sentence gives the player something to use — the problem, the place, the client, the task, the hands, the pay, or the risk; a mood-only sentence is cut. Plain everyday words a farmhand would say; short sentences, mostly one clause, no semicolons. People stay NAMELESS BY TRADE — a name appears only when this message hands you one, and only for someone the job centers on.',
    '═══ YOUR INPUTS ═══',
    '- location: the land and its anchor facts. A named landmark may be used bare (never with an epithet); other places come from placeNameSuggestions or coined small places of the land.',
    input.intake ? '- intake: HOW this matter reached the company — a settled FACT: the opening must agree with it, but most cards need NO sentence for it; never quote its wording.' : '',
    input.opening ? '- opening.spark: seed atoms for how the matter arrives, separated by " · " — combine into an opening of your own; use what serves; never quote their wording. Time of day only when it matters, never the first words.' : '',
    '- keywords (when given): optional sparks — use what serves, drop the rest; rebuild phrasing in your own words; a modern word is rendered as its period idea. A feeling word colors what happens — never an adjective stapled onto a person.',
    '- rarity: sets size — common = local trouble told short; uncommon and rare may run bigger. level: the weight-class of the work — high level means matters worthy of veterans. slotCount: how many soldiers.',
    input.gravity ? '- gravity: sets TONE only — small jobs read brisk, serious matters straight, only a grave affair reads heavy.' : '',
    '- rewardEnvelope: the payout\'s shape — the fiction makes it plausible and the pay plain (they work for PAY, never a payoff-free plea). A person may be promised ONLY when the envelope grants a person — and the company\'s claim to them stands on its OWN footing (they have nowhere to return, choose to come, owe a debt, or are lawfully taken): no payer "hands", "grants", or "lets keep" a person they do not hold. Goods beyond the pay stay UNNAMED on the card (what the job turns up is the report\'s to tell); no talk of stores or inventories.',
    '- archetype (when given): raid = hit a holdout for spoils; capture = take someone alive; rescue = free someone held; escort = guard a journey; investigate = uncover a hidden thing; hunt = track down a person or beast; contract = an agreed task for set pay (the work IS the premise); lead-hunt = sweep for rumors (never promise "further work" — the engine announces leads). The job matches its archetype, specific to this place.',
    '- rosterNames + rosterPronouns: the player\'s soldiers — the whole company, sendable candidates only, never clients or foes; card prose never names them.',
    input.framedCharacter ? '- framedCharacter: the person the job delivers — the ONE person who must carry their given name, FIRST in the situation (grounded there) before any other field may use it; match them exactly (name, pronoun, tags). A dossier or lastSeen means the world knows them: continue their story in NEW words (lastSeen\'s FACTS are settled — captors, place, cause may not change). npcNameSuggestions (when given): a name for at most one or two people the job CENTERS on.' : '- npcNameSuggestions (when given): a name for at most one or two people the job CENTERS on; nameless-by-trade stays the default.',
    '- avoid (when given): the player\'s recent cards — different premise, different props, never a reused name.',
    TAGS_NOTE,
    NUMBER_BAN,
    TAG_VOCAB,
    `═══ YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?}]${input.framedCharacter?.partial ? ', quarryTags' : ''}} ═══`,
    '- title: short and concrete — never prefixed with the archetype label.',
    '- situation: THE card. Common = 3-5 short sentences; uncommon and rare may take up to three short paragraphs. Shape: the MATTER first (what is wrong and where) → who wants it done (one clause at most; none when the matter is visible from the walls) → the task as the outcome wanted (one errand, never an itinerary) → pay and loot rights in their OWN short sentence. ONE FACT PER SENTENCE. Never open on a messenger arriving. Vary what signals the wrongness (an absence, a sound, animal behavior, damage, a person\'s state — an abandoned object is overused). The card knows only what its sources could know: a hidden thing is suspected or rumored, never stated as fact — finding out is the job. Most cards need no risk line; when one appears, flowing prose, never a labeled clause. State intent and rumor, never a named person\'s scripted future action.',
    '- job (ONE terse line): the task for the boss\'s lists — never copies the situation\'s sentences, no names the situation did not introduce; a find-or-learn task poses the QUESTION, never the answer.',
    ASK_SPEC,
    input.framedCharacter?.partial ? '- quarryTags (framedCharacter is PARTIAL — its tags carry just race and sex): up to 3 TAG VOCABULARY words (the quarryTags-only lists allowed) that make the person your card describes; race and sex are already set — spend every word on a NEW trait; optional rank "word (low|mid|high|legendary)".' : '- quarryTags: omit it here.',
    '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way and is understood on one skim — subject and verb early.\n2. ONE LEDGER, fixed before you write: who holds the wanted thing NOW (one holder, ONE place — stated once and never moved by a later sentence), who pays to change that, and what the company keeps — then no clause reassigns them. The wanted thing is never already in the fort\'s or the payer\'s hands.  Pay stands in its OWN sentence with a NAMED payer (a trade suffices).\n3. Every word in favored, clashing, requiredTag, or quarryTags is copied EXACTLY from TAG VOCABULARY — a near-synonym is thrown away by the engine.\n4. Period diction only (nothing after the age of candles and horses); never echo an instruction or field name; the account-book (ledger, registry, record-book) is BANNED as a plot object.\nRespond as the JSON object specified above — nothing else.',
  ].filter(Boolean).join('\n');
}

function sagaSystem(input: QuestWriteInput): string {
  return [
    '═══ THE JOB ═══\nYou write the NEXT card of an ongoing SAGA in a dark-fantasy mercenary-fort GAME. The player is the company BOSS at the fort; the card is a short briefing TO them ("you"): what has just changed in a matter they are already working, and what this step\'s errand is. They read it once and pick which soldiers to SEND — the boss never goes. GAME WRITING, not literature: every sentence gives the player something to use; a mood-only sentence is cut. Plain everyday words; short sentences, mostly one clause, no semicolons. Open on the ongoing matter and what has just changed — no region context.',
    '═══ THE RECORD (hard constraints) ═══\nstoryState.history = the saga\'s prior reports, oldest first — the settled truth: an object rests where the last report left it, people and places keep their exact names, finished work is never re-posed. storyState.actorStates = WHEREABOUTS, the single authoritative truth of where each person and object rests — the card may not place them elsewhere or re-take what the company holds. knownToPlayer entries are immovable. introducedNames = people already met (bare name; orient everyone else once). lastBeatOutcome = what the previous step changed: open on the situation it created; between steps the world moves ONLY as it says (a step reported UNTAKEN is re-posed afresh — the world did not move). Where the bible disagrees with the record, the RECORD wins.',
    '═══ THE STEP ═══\narcStep = the ONE step this card covers — the job is THIS step, nothing more; when the record shows its work already done or its target gone, derive the job from what genuinely remains (the loose end, the handover, the settlement). bible.situation carries THE CLIENT\'S OPEN TELLING — that is card material; the truth beyond it stays hidden until the party finds it. bible.goal = the engagement, known from beat 1: state it in ONE plain sentence; only the finale settles it. A find-or-learn step: the card poses the QUESTION only — the answer stays off the card.',
    '═══ NAMES & PLACES ═══\nName people ONLY from bible.cast, rosterNames, or relevantLore. A cast entry with offstage: true has NO name — when this step runs into its pressure it shows nameless by trade in your own words. Beyond introducedNames and the goal/arcStep\'s own names, introduce at most TWO people and ONE place by name. Soldiers stay out of card prose (sole exception: the focal when focalIsMerc) and are never PINNED to a place or errand — where each soldier goes is the player\'s assignment alone. The bible\'s geography outranks placeNameSuggestions; a place never wears a person\'s name; the bible\'s coinages are notes — render them in your own plain words. relevantLore flags: companySoldier = the player\'s own; companyCaptive = in the cells (NO ONE ELSE is in custody); atTheFort = at the fort right now; outOfReach = free in the world, never at the fort or in custody. The focal\'s SEX comes from their tags — never flip a pronoun; a focal who is a soldier lives at the fort, goes only where the player sends them, never hires or pays the company, and is never promised as a payment or prize.',
    input.kind === 'beat' ? '═══ THIS MID-SAGA STEP ═══\nNever the saga\'s goal; the objective differs materially from the previous job (new ground, new claimant, new leverage, or raised stakes) and its obstacle is a NEW CLASS of trouble — never the last one re-armed or renamed. The job is WINNABLE: success is a change the party can force, never another person\'s free choice, never an outcome the card forecloses. A pressure an earlier card announced either ACTS here or is dropped. Delivery to the client is later work: a mid-step finds, secures, or opens the way, never ends with the prize delivered. rewardEnvelope = this step\'s modest pay, phrased in your own words; when this step\'s objective is a PERSON, the card may promise that person-outcome. Each ask entry MAY add mustBeFocal: true — ONLY when focalIsMerc is true and this step stages that soldier\'s own matter in person; in doubt, omit.' + (input.beatIndex === 1 ? '\nBEAT 1: the player\'s FIRST sight of the saga — a cold reader gets the hook and its WHY, the hire, and this errand, NOTHING of the road beyond. This card is the board POSTING read BEFORE the job is taken: write the matter and this first errand as work still TO DO — never narrate the company accepting the job, riding out, or arriving. Open on the CLIENT and the matter they bring, never on "what has changed" and never naming "the hire" or "the job" as an actor. Keep it low-stakes. It alone carries the CARE MOMENT: one small human moment with the focal, aimed by the saga\'s telling — warmth where wronged, wariness where dangerous; a focal who cannot be at the fort arrives in a witness\'s detail. (Later cards carry no character business.)' : '') : '',
    input.kind === 'finale' ? '═══ THE FINALE ═══\nThe arc\'s LAST step: the matter comes to a head. It opens from the RECORD as it stands — what earlier steps did STAYS done; when the record shows the work complete, stage the SETTLEMENT (the handover, the payment, the reckoning), never a re-run. It stands on ground and people the player has SEEN and puts knownToPlayer facts to USE. It never reframes the focal against the saga\'s telling — a protected person stays protected — unless a REVEALED twist says otherwise; a twist the player never met is REVEALED here (the truth comes out at the end, never quietly dies).\nPLANS: slotCount counts mutually exclusive PLANS — the company sends soldiers down ONE. Output approaches with EXACTLY slotCount entries and ask with the SAME count in the SAME order (ask[i] = plan i\'s test: same attribute, favored echoing the plan\'s; no clashing or requiredTag). ALL plans settle the same central person (focalName), each testing a different attribute. rewardKind = what the COMPANY nets: recruit = they join; captive = the company holds them; gold = they pass out of the company\'s hands for value. Offer only kinds the saga\'s telling can honor; when focalIsMerc is true no plan trades or targets the soldier — each settles the MATTER. A label promises ONLY what its rewardKind delivers (captive reads seize/hold, gold reads sell/collect, recruit reads win over) — never a fate no kind grants, never a handover on a captive plan; labels are field orders in plain words naming only people the situation grounds. The situation presents the matter at its head and may sketch the choice in one sentence; the labels carry the fork. rewardEnvelope names the central prize and DEFAULT ending — the plans decide what lands.' : '',
    input.fixNotes?.length ? 'fixNotes = defects a zero-context reader found in your REJECTED previous draft: write a fresh card with none of them.' : '',
    TAGS_NOTE,
    NUMBER_BAN,
    TAG_VOCAB,
    `═══ YOUR OUTPUT — respond as JSON: {title, situation, job, ask: [{attribute, extraAttribute?, favored, clashing, requiredTag?${input.kind === 'beat' ? ', mustBeFocal?' : ''}}]${input.kind === 'finale' ? ', approaches: [{label, rewardKind, attribute, favored}]' : ''}} ═══`,
    '- title: short and concrete, about THIS step.',
    '- situation: THE card. 3-5 short sentences (uncommon and rare may run longer). Shape: what has just changed → this step\'s task as the outcome wanted → pay in its OWN short sentence, named in the world\'s words (the client\'s coin, goods off the dead) — never this message\'s own wording. ONE FACT PER SENTENCE. State intent and rumor, never a named person\'s scripted future action; risk lines are flowing prose, never a labeled clause.',
    '- job (ONE terse line): THIS step\'s errand for the boss\'s lists — never the saga\'s final delivery, never a name the situation did not introduce; a find-or-learn task poses the QUESTION, never the answer.',
    ASK_SPEC,
    '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way and is understood on one skim — subject and verb early.\n2. Stage ONLY the dealt step: the cast, places, terms, and dangers of LATER steps stay off the card entirely; the RECORD and WHEREABOUTS are law.\n3. First use of any person, place, or thing — the client included — says in its own sentence who or what it is, shape "NAME, a TRADE of PLACE"; a card whose reader cannot say who hires them, what the matter is, and why it matters has failed.\n4. Every word in favored, clashing, or requiredTag is copied EXACTLY from TAG VOCABULARY; period diction; never echo an instruction or field name ("step", "plan", "focal", "beat" never appear on a card); the account-book is BANNED as a plot object.\nRespond as the JSON object specified above — nothing else.',
  ].filter(Boolean).join('\n');
}



// ── resolve system prompts (§0: self-contained per shape, rules once, critical at end) ──────

const RESOLVE_CORE_HEAD = 'You narrate the result of a job a mercenary company\'s soldiers were SENT on, in a dark-fantasy low-medieval world. The OUTCOME is already decided and given to you. The reader is the company\'s boss, who stayed at the fort: narrate the sent party in third person — never "you" in the field.\nGAME WRITING, not literature: entries in a game session log, read once between dice rolls. Past tense. Plain everyday English; short sentences; no semicolons; no similes. Every sentence changes the picture of the job — progress, a setback, a cost, a gain, a fact learned; a sentence of soldiers merely moving or handling gear is cut, and so is a mood-only sentence.';

const RESOLVE_INPUTS = [
  '═══ YOUR INPUTS ═══',
  '- outcome: success = the job done clean — the JOB AS WRITTEN, no more and no less: everything the job line asked for lands, and never take or finish what it only asked to find or scout. partial = done at a COST you must show. failure = the job NOT done; a consequence lands.',
  '- party: the soldiers sent, COMPLETE (one soldier means ALONE — no "the others"; every member comes home with the party). Pronouns come from tags — a "female" tag is she/her in every clause. A member\'s dossier memory may surface ONLY when the scene calls it up — one touch per person at most, most reports need none, expressed as a NEW action; an invented memory reads true once and false forever. Party members are never the culprit of their own job.',
  '- sceneFacet: one facet you MAY take a single concrete detail from (never write the field\'s name or wording).',
  '- deliveredSummary: what ends in the COMPANY\'s hands — weave items and people into the action as things changing hands in-fiction, never repeating its amounts or wording. THE CARD\'S FICTION IS BINDING: the job\'s own objective, as the card words it, resolves on screen FIRST and completely; an item this lists that the card never mentioned surfaces after that as an UNLOOKED-FOR find on ground the text itself shows as OWNERLESS — off the fallen, buried and forgotten, among an abandoned wreck — never on premises anyone on the card owns, lives on, or works, and never renamed to stand in for the card\'s objective. GOLD IS NEVER STAGED: no purses, no payment moments, no telling of pay received, reported, or logged — pay lives entirely outside your text. If the job\'s wording seems to promise away something this lists, the company\'s take wins — the fiction explains how.',
  '- deliveredCharacters (when given): people the job handed over — flesh each: who = ONE character-card line, shape "A [station or origin]. [One hook — a drive, a past, or a temper.]" — timeless identity, never current custody or quest-state; backstory = 2 sentences of concrete events growing out of THIS job\'s fiction, one detail a reader could love, pity, or worry over; quirks = 1-2 concrete PHYSICAL habits, an action never an adjective (never the stock fidgets: fingering an object, humming, wrist-rubbing, cloth-folding).',
  '- fixNotes (when given): defects a zero-context reader found in your REJECTED previous report — write it afresh with none of them.',
].join('\n');

const RESOLVE_OUTPUT = (finale: boolean) => [
  '═══ YOUR OUTPUT ═══',
  '1) "before" — the SETUP, written WITHOUT looking at the outcome, in two moves: the party arrives, then the CHALLENGE SHOWS ITSELF — the LAST sentence states, in the indicative, the concrete thing that now stands in the way — a live obstacle, never the prize itself, never a statement that something cannot be reached, never an order or task restated — on a full stop (never an em-dash, ellipsis, or scenery). Everything the outcome will need — foes, tools, helpers — is on stage HERE. It ADDS something the card did not say, never hints at the result, never reveals what the job has yet to find. Vary the opening sentence\'s grammar report to report; skip the departure from the fort (mist, rain, and time-of-day openers are stamps).',
  '2) "after" — what happened, knowing the outcome. The first sentence is the decisive moment or its result, never a restatement of the job. Events in the order they mattered: how the attempt met the challenge, what it cost, what the company now holds or knows. The reader must finish knowing EXACTLY what was achieved or lost; a learn-or-uncover job states the answer IN FULL (a fact "learned" but not said is nothing reported). Name a party member only where they personally turned the job; a member with no such moment gets no invented one, and never their trait word. Wounds ride inside their action beats — never a default body part, never the same wound sentence twice, never a wound not listed in injuries. On failure, show in-fiction what was lost — fresh words each time. An unnamed person enters by trade, never a coined name; an absent client is not staged. End where the story stops — a concrete event or holding, never a summing-up; walking home is the overused closer. ONE SCENE, ONE TRUTH: the after acts ONLY through people and things the before staged, exactly as it left them — same place, same state (a thing on a stall is taken from the stall; a person staged alive dies only by an on-screen event); the party stays on the staged ground to the last act (no cutting away and back); no new foes, tools, or helpers appear mid-outcome; a staged threat acts or is dealt with, never reported absent.',
  '- injuries: ONLY when the fiction put a member in harm\'s way — a clean success lists none, never death, empty array when nobody was hurt. cause = an exact phrase FROM YOUR OWN after text showing that person taking the hurt. Bands: low = days; med = weeks and a scar; high = months — and the wound\'s LANGUAGE matches its band (a low wound reads as a nick, never a lodged spear).',
  `- WORD BUDGET (hard caps, count): common → before ≤25, after ≤45. uncommon → ≤35 / ≤65. rare${finale ? ' or finale' : ''} → ≤50 / ≤95. When it cannot all fit keep, in order: the RESULT, the cost, the client\'s promise handled, any character touch.`,
  '- edges: 0-2, only moments that should be REMEMBERED; blurb one line; importance a NUMBER 0-1 (0.8+ = defining); ids only from party/deliveredCharacters in this message.',
].join('\n');

const RESOLVE_ANCHOR = '═══ ABOVE ALL (write now) ═══\n1. Every sentence parses ONE way on one skim — subject and verb early; a carry-list holds only what hands can carry.\n2. The result is unmistakable: what was won or lost, what the company now holds or knows.\n3. The report ENDS at the job\'s last act in the field — payment, handover to the payer, and the walk home all live OUTSIDE your text.\n4. Period diction; never echo an instruction or field name ("approach", "plan", "outcome", "step", "dice", "roll" are system words that never appear in prose); the account-book (ledger, registry, record-book) is BANNED in prose.\nRespond as the JSON object specified below — nothing else.';

const ONEOFF_RESOLVE_SYSTEM = [
  RESOLVE_CORE_HEAD,
  RESOLVE_INPUTS,
  TAGS_NOTE, NUMBER_BAN, EDGE_TYPES_LINE,
  RESOLVE_OUTPUT(false),
  RESOLVE_ANCHOR,
  'Respond as JSON matching: {questId, before, after, injuries:[{characterId, band: STRICTLY "low"|"med"|"high", cause}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}]}',
].join('\n');

function sagaResolveSystem(q: ResolveQuestInput): string {
  const finale = !!q.chainContext?.isFinale;
  return [
    RESOLVE_CORE_HEAD,
    RESOLVE_INPUTS,
    '═══ THE SAGA STEP ═══\nThis job is ONE STEP of a longer saga. The report performs chainContext.arcStep and nothing else. When arcStep ends in "→ yields: …", that is what a SUCCESS delivers, shown concretely (a partial delivers it dearly or in part; a failure withholds it). stepsNotYet = later steps — their work, prizes, and targets may not land or resolve here, however big the roll (a big roll is THIS step done exceptionally well). ' + (finale ? '' : 'The saga\'s goal stays unachieved whatever the dice said; when a success as written would settle it, complete the JOB while the larger matter visibly stays open. ') + 'What a resolution settles STAYS settled; storyState is the PAST — never re-staged, and this report never repeats a prior report\'s event sequence (a second attempt goes DIFFERENTLY). storyState.actorStates = WHEREABOUTS, the single truth of where each person and object rests: the report starts them there; only on-screen action moves them. A focal who is a company soldier is never handed into custody. ONLY this party\'s soldiers appear; between jobs every soldier returns to the fort — no report leaves one posted or holding something in the field. bible = the hidden truth (the STATE outranks its plan).',
    finale ? '═══ THE FINALE ═══\nThe ENGINE decides every disposition — who joins, leaves, dies, owns: narrate what was delivered as given. chainContext.fate = what becomes of the central person; it COMPOSES with the outcome: the job\'s own objective resolves on screen FIRST, the fate lands after, never instead. End the person exactly on the fate in the fiction\'s own words: kept WITH the company = the report ends with them back with the company; sent OUT = they leave into the arrangement, never escaping or kept after all. chainContext.approach = the plan the company CHOSE, a CONTRACT: the first after-sentence shows it executed by its own terms, every action its label names happens or fails on screen, and a failure fails THE CHOSEN plan; each rejectedApproaches plan\'s distinctive route, trick, or prop may not appear. The report ACCOUNTS for every named captive, prize, and open obligation still live in storyState — kept, returned, lost, or written off, each in a clause.' : '',
    TAGS_NOTE, NUMBER_BAN, EDGE_TYPES_LINE,
    RESOLVE_OUTPUT(finale),
    '- storyUpdate: its truth SCALES with the outcome (success = the full new fact; partial = part, bought dear; failure = nothing concrete). currentSituation states concretely what changed — who holds what, who moved where — names spelled exactly as earlier text spelled them. actorUpdates = the WHEREABOUTS ledger: {"name": "where they now are / who holds it"}, only entries this report changed. newlyRevealed = only facts NOT already in storyState. openThreads = the saga\'s live loose ends, replacing the old list. sagaSettled = true ONLY if the central matter is essentially settled with nothing real left to do' + (finale ? '' : ' (the game then brings the saga to its head next step)') + '.',
    RESOLVE_ANCHOR,
    'Respond as JSON matching: {questId, before, after, injuries:[{characterId, band: STRICTLY "low"|"med"|"high", cause}], fleshed:[{characterId,who,backstory,quirks}], edges:[{from,to,type,blurb,importance}], storyUpdate:{currentSituation, newlyRevealed:[strings], openThreads:[strings], actorUpdates:{name: "one line"}, sagaSettled: boolean}}',
  ].filter(Boolean).join('\n');
}

export function makeOpenAiProvider(): AiProvider {
  const client = new OpenAI({ apiKey: loadKey() });
  const usage: AiUsage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const records: AiCallRecord[] = [];
  let purposeCtx = '?';           // set by each public method before calling

  async function call<S extends z.ZodTypeAny>(model: string, system: string, user: string, schema: S, effort?: 'minimal' | 'low' | 'medium'): Promise<z.output<S>> {
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
      // reasoning_effort exists only on the gpt-5 (reasoning) family; 4.x models reject it
      const isReasoning = /^gpt-5/.test(model);
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' },
        ...(isReasoning ? { reasoning_effort: effort ?? (model === NANO_MODEL ? 'minimal' : 'low') } : {}),
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
  async function callR<S extends z.ZodTypeAny>(model: string, system: string, user: string, schema: S, effort?: 'minimal' | 'low' | 'medium'): Promise<z.output<S>> {
    try { return await call(model, system, user, schema, effort) }
    catch (e) {
      if (process.env.AI_DEBUG) console.error('[ai] retrying after:', (e as Error).message?.slice(0, 200));
      return call(model, system, user, schema, effort);
    }
  }

  return {
    name: 'openai',
    usage: () => ({ ...usage }),
    callLog: () => [...records],

    async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
      purposeCtx = 'writeQuest';
      // §0 + 2026-07-13 research ruling: TWO self-contained prompts (one-off / saga) — the old
      // shared-prompt-plus-override ("THIS BLOCK WINS") shipped a contradiction small models
      // can't arbitrate; every rule stated ONCE; output spec + critical rules at the END.
      const system = (input.kind === 'one-off' ? oneOffSystem(input) : sagaSystem(input));

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
        fixNotes: input.fixNotes?.length ? input.fixNotes : undefined,
        beat: input.beatIndex, expectedBeats: input.expectedBeats, arcStep: input.arcStep, focalName: input.focalName,
        focalIsMerc: input.focalIsMerc,
        opening: input.opening,
        intake: input.intake,
      });
      // 🛠 effort A/B (2026-07-12, seeds 39019 low vs 40020 medium): medium bought NO judge-score
      // gain on cards (4-5/10 both) at 2.3x cost and 3x latency — cards stay LOW; structure over effort
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
        'You are the writers\'-room for a saga in a dark-fantasy mercenary-fort game: the player runs a mercenary company for profit and takes this saga\'s jobs one at a time. Build the hidden BIBLE — the settled truth behind the whole saga, told plainly. COMMIT TO THE TRUTH: nothing "unknown" in the bible; every fact has a cause. Invent the WORLD\'s past freely — never the COMPANY\'s (the slate and dossiers hold ALL company history that exists). The saga is a QUEST the company takes for gain; the player is a participant, never a spectator.',
        '═══ THE ARC — the story\'s spine ═══\nA SIMPLE, LINEAR story a tired player could retell in one breath, written as a CAUSAL CHAIN of EXACTLY expectedBeats steps. Each step: "<one errand at one place, using the previous step\'s yield> → yields: <the ONE thing found, learned, or changed that the next step uses>". Step 1 = take the job plus the first field errand, and its errand half names ONLY what the hire itself knows — every person and place the saga discovers enters as some step\'s yield, never before. The goal lands only at the LAST step. No two steps share a place or a person-outcome. Anyone the arc names must be in cast (or stay nameless by trade).',
        '═══ TRUTH vs SURFACE ═══\nsituation = the true state of things told straight — but it HIDES the twist (twistReveal ALONE carries it; no twist → situation is simply the full truth) and never hides what the JOB is. goal = what the company believes it is working toward across the WHOLE saga, never just step 1\'s errand — stated plainly in the words of the HIRE: only what the client knows at hiring — no attribution prefix, no option branches, and NEVER a name, place, or fact that a later step exists to discover (those live only in their steps\' yields). twistReveal (null unless twist=true) = the one fact that recontextualizes the goal, built to surface at a MIDDLE step. Give every opposing pressure a FACE in the cast — a threat no beat can stage drains every beat. Alternatives and contingencies live in openDirections.',
        '═══ CAST — STRICTLY 1-3, each with a part the arc actually gives them ═══\nwho = ONE plain sentence: station or origin plus one hook — never a metaphor, never an echo of tag words. want = the want itself as a to-infinitive or noun phrase (no subject prefix): ONE concrete human thing that could be handed over, done, or stopped — never an abstraction; an obstacle\'s want OPPOSES the goal. role = exactly one of client / companion / quarry / obstacle / ally / prize — "prize" only for a person who IS the prize (a focal who holds a thing-prize is quarry). Never pad with coined companions: the player\'s soldiers fill that role and are never cast entries (sole exception: a saga about one of them).',
        'YOUR INPUTS: seed = the what-if spark — collide it with the people given into a one-line KERNEL of pure story (never restate keywords, tone, or stakes inside it). keywords = motifs, not a checklist. tone = the whole saga\'s register. stakes and rarity = how weighty; size the drama. location = the land and its anchors — never lift its phrasing; set most sagas AWAY from any landmark, coining small places. focal = who the saga is ABOUT (core cast; their dossier outranks their blurb). kind = the likely ENDING — recruit: they may join the company (role usually prize); captive: they may end in its cells (quarry); gold-hoard: the prize is a treasure they are the key to (quarry); development: a matter from one of the company\'s OWN soldiers\' past comes TO them at the fort — the soldier lives at the fort and marches with the company, never staged dwelling or ailing elsewhere, and ends still the company\'s own (companion).',
        'slate = people the world knows. Reuse before coining — a reused person keeps their SIDE, never clients two sagas at once, and dark history with the company (fled it, robbed it) is carried plainly in situation. Existing people carry their id as loreId; coined people omit it. Flags: companySoldier = context, never cast (sole exception above); companyCaptive = in the cells, and NO ONE ELSE is in custody; atTheFort = at the fort now, never staged elsewhere; outOfReach = free in the world, never at the fort or in custody.',
        'avoid = the player\'s recent sagas: differ from EVERY entry in premise, central object, places, devices, and how the matter is contested and settled. A [SETTLED: …] tail is finished history — never re-staged as upcoming, never contradicted.',
        'assignedNames = the ONLY names for coined people, sex-marked: match both ways, order free, the marks never output. newPlaces = coined places, never sharing a first syllable with the landmark or any place this message names; each blurb one plain sentence under fifteen words. Titles are concrete ACTION-titles, never a poetic two-noun. Law and claims speak in period words — rights, pledges, sworn witness. One prop is BANNED anywhere in the bible: the account-book — ledger, manifest, registry, record-book by any name. Never echo these instructions or field names in prose; no semicolons — split into two sentences.',
        NUMBER_BAN,
        EDGE_TYPES_LINE,
        TAGS_NOTE,
        'Respond as JSON: {title, kernel, cast:[{name, who, want, role, loreId?}], situation, goal, arc:[expectedBeats short step strings], twistReveal, tensions:[2-4 short strings: obstacles along the road to the goal], openDirections:[2 strings: one concrete next step toward the goal, one pressure that unfolds with or without the company], relevantIds:[every slate/focal id you used anywhere — a simple checksum of reuse], newPlaces:[{name,blurb}], newEdges:[{from,to,type,blurb,importance}]}.',
        'newEdges = NEW history between EXISTING people only (ids from slate/focal): blurb one line, importance a NUMBER 0-1 (0.8+ = defining). Coined-cast ties live in the bible itself — an empty array is often right. A tie touching a company soldier grows only from hooks their dossier already holds.',
        // recency anchor (§0)
        '═══ ABOVE ALL (write now) ═══\n1. The arc is a SIMPLE causal chain: each step uses the previous step\'s yield and ends "→ yields: …" (except the last); the thing to be found appears only AFTER "→ yields:", never in the errand half.\n2. NOTHING ENTERS FROM NOWHERE: every person, place, and object a step touches comes from the hire, that step\'s own named ground, or an earlier step\'s yield — a rescuer, key, or destination that first appears in the step that needs it is a broken story.\n3. The LAST step settles the CLIENT\'s hire AS CONTRACTED, at the ground the hire named — carried to the client, or home to the fort/your keeping; when the hire delivers home it ends AT THE FORT, never at a fresh meeting-place invented for the ending, and the prize reaches the client, no one else. The client receives what they hired for or visibly loses it — an arc step never refuses the client (when the truth turns against the hire, the last step PRESENTS that reckoning; it does not decide it). The focal\'s ending (kind) rides WITH the settlement, never instead of it.\n4. situation HIDES the twist; twistReveal alone carries it. Cast strictly 1-3, each with a real part; differ from every avoid entry.\nRespond as the JSON object specified above — nothing else.',
      ].join('\n');
      // 🛠 genesis stays at MEDIUM: 1-2 calls per saga, no gameplay latency, and the bible seeds
      // every downstream card (cards/resolve reverted to low after the 39019/40020 A/B)
      const out = await callR(WRITER_MODEL, system, JSON.stringify(input), zGenesis, 'medium');
      return {
        ...out,
        twistReveal: out.twistReveal ?? null,
        cast: out.cast.map(c => ({ ...c, loreId: c.loreId ?? undefined })),
      };
    },

    async resolve(inputs: ResolveQuestInput[]): Promise<ResolveQuestOut[]> {
      purposeCtx = 'resolve';
      // one batched call per quest, fired in parallel (the cycle's single reckoning);
      // §0: two self-contained prompts (one-off / saga) — no arbitration clauses, rules
      // stated once, output spec + critical rules at the END
      const pick = (q: ResolveQuestInput) => q.chainContext ? sagaResolveSystem(q) : ONEOFF_RESOLVE_SYSTEM;
      const outs = await Promise.all(inputs.map(q =>
        callR(WRITER_MODEL, pick(q), JSON.stringify(q), zResolveOne).catch((e): ResolveQuestOut => {
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
        TAGS_NOTE,
        NUMBER_BAN,
        '(Spans and ages told in words are fine; prices, pay, and tallies stay banned.)',
        '- who: their CHARACTER-CARD line — the sentence under a hero\'s portrait. Shape: their station or origin, then ONE hook (a drive, a past, or a temper): "A [what they are/were]. [What drives or marks them.]" Two short plain sentences at most, third person. TIMELESS identity only — never current custody, quest-state, or willingness (those change; the line must not), never a micro-habit (habits live in quirks), never a metaphor or simile ("like a…" and "wore X like Y" are the tell), never merely their name, never a riddle or a poem.',
        '- backstory: 2 sentences of origin that FIT their tags and how they arrived, carrying one detail a reader could love, pity, or worry over — SHOWN inside the telling, never announced as a labeled fact. Plain concrete events — who, where, what happened; never lyrical vagueness or withheld mysteries (a fact the reader can hold beats a mood they cannot). Every word must be consistent with every tag — never contradict one. Never echo these instructions or their wording in the prose.',
        '- if a `saga` is given, that person IS who that story was about (saga.kernel = the one-line idea it was built on; saga.want = what they wanted in it): their backstory must grow out of it so a player who followed the saga recognizes them. Never contradict the saga; never retell it — tell what came BEFORE it.',
        '- quirks: 1-2 concrete PHYSICAL habits a watcher could notice (an action, never an adjective; each a short phrase of a few words). BANNED stock quirks: fingering/thumbing an object, humming or whistling, rubbing a wrist, folding a cloth corner — reach wider (gait, eating, grooming, small rituals, how they stand or carry things), give each person in this batch a DIFFERENT kind of habit, and avoidQuirks (when given) lists habits living characters already own: never re-deal one.',
        'Make the people DISTINCT from each other — no two in a batch open their who-line with the same station phrase (context says how they came; the STATION is yours to individuate). No semicolons — split into two sentences. One prop is BANNED (the trade\'s most overused): the account-book — ledger, manifest, registry, record-book by any name.',
        '═══ ABOVE ALL (write now) ═══\n1. Every line is plain and concrete — a fact the reader can hold, never a mood, metaphor, or riddle.\n2. who is TIMELESS; habits live only in quirks; nothing contradicts a tag.\n3. Each person in the batch is DISTINCT: different station openers, different kinds of habit.\nRespond as JSON: {people:[{characterId, who, backstory, quirks:[...]}]} — ids exactly as given, nothing else.',
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

    async review(input: ReviewInput): Promise<ReviewOut> {
      purposeCtx = 'review';
      const system = [
        'You are a tired player skimming ONE piece of quest text once. You run a mercenary company from your fort: "you", "the company", "the fort", your soldiers, and pay/loot phrasing are ALWAYS known to you. Report ONLY defects of these three kinds:',
        '1) UNPARSEABLE: a sentence that does not parse one way on one read (garden path, a pronoun with two plausible antecedents, self-contradiction within the text, word salad).',
        '2) UNGROUNDED: a name or invented term whose KIND you cannot even tell — not a person vs place vs thing question the sentence itself answers. A name whose sentence makes its kind and part plain (a place ridden through, a person who hires or blocks you) is grounded enough; so is anything on the KNOWN list.',
        '3) LEDGER BREAK: a REAL contradiction of the WHEREABOUTS list — an object or person placed with a DIFFERENT holder or place than it says, or re-taking what it says is already held. A rewording of the same holder/place is NOT a break.',
        'Judge like a player, not an editor: flag only what would actually stop or mislead you mid-read. Style, tone, length, and mild oddness pass. Quote each defective phrase.',
        'Respond as JSON: {ok: true|false, defects: ["<kind>: <quoted phrase> — <why in a few words>", ... at most 3]}. ok=true with [] when nothing would stop you.',
      ].join('\n');
      const out = await call(WRITER_MODEL, system, JSON.stringify(input), zReview);
      return { ok: !!out.ok && out.defects.length === 0, defects: out.defects.slice(0, 3) };
    },
  };
}
