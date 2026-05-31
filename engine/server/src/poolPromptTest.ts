// PROMPT-TEST: can the AI pick characters from a pool + advance their arcs?
//
// We do NOT build a real character pool service yet. We hand-craft a fake
// pool of ~15 characters in Mireford, hand the AI three sequential bible
// geneses, carry arcState updates by hand between them, and read the
// results. Goal: see if the AI reuses sensibly + chains stay cohesive +
// token usage stays bounded.
//
// Usage:
//   cd engine/server
//   npx tsx src/poolPromptTest.ts <label>

import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { z } from 'zod';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) {
  console.error('Need OPENAI_API_KEY');
  process.exit(1);
}

const label = process.argv[2] ?? 'unlabeled';
const outDir = resolve('/home/irvan/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/experiments');
mkdirSync(outDir, { recursive: true });

// ---------------- character shape ----------------

type CharacterRole = 'mercenary' | 'captive' | 'npc' | 'dead';

interface PoolCharacter {
  id: string;
  name: string;
  region: string;
  role: CharacterRole;
  tags: string[];
  surface: string;
  want: string;
  need: string;
  ghost: string;
  lie: string;
  secret: string;
  arcState: string;
}

// ---------------- hand-crafted pool (15 characters in Mireford) ----------------

const POOL: PoolCharacter[] = [
  // Fort mercenaries (3 — would be in cached prefix)
  {
    id: 'char_marek', name: 'Marek Voss', region: 'Mireford', role: 'mercenary',
    tags: ['veteran', 'sergeant', 'mire-born'],
    surface: 'A heavy-jawed sergeant in his late forties; greying at the temples, walks with a stiffness from an old hip wound.',
    want: 'keep his company alive through one more winter',
    need: 'stop measuring his worth by who he failed to bring home',
    ghost: 'commanded the rear-guard at the Coldfen rout; brought back seven of forty',
    lie: 'a captain who survives his men deserves what he gets',
    secret: 'he keeps a list of the thirty-three names in a folded scrap inside his coat',
    arcState: 'commands the fort; quiet since the last winter campaign',
  },
  {
    id: 'char_roselle', name: 'Roselle Vance', region: 'Mireford', role: 'mercenary',
    tags: ['lettered', 'light-footed', 'haunted'],
    surface: 'A thin woman in her thirties with ink-stained fingers and a hood she keeps up indoors.',
    want: 'remain unrecognised in the towns she passes through',
    need: 'accept that her past is not an accusation she has to disprove',
    ghost: 'fled the abbey at Penholt the night the abbot was hanged',
    lie: 'if she stays still long enough, someone will come for her',
    secret: 'she carries a small enamelled icon she will not name, and a folded page from the abbot\'s last letter',
    arcState: 'recently completed a chain that confronted her past; she now carries a public title "Reckoned With"',
  },
  {
    id: 'char_tibalt', name: 'Tibalt Renn', region: 'Mireford', role: 'mercenary',
    tags: ['young', 'eager', 'crossbow'],
    surface: 'A wiry youth, twenty-two, with a habit of polishing his crossbow during conversations.',
    want: 'be taken seriously by Marek',
    need: 'stop measuring himself against the older men',
    ghost: 'his older brother took the merc contract that should have been his and never came back',
    lie: 'if he is brave enough, fast enough, the company will not have to bury him',
    secret: 'he has been writing letters home that he never sends',
    arcState: 'recovering from a leg wound taken in the last contract',
  },
  // Captives (1)
  {
    id: 'char_drust', name: 'Drust Halren', region: 'Mireford', role: 'captive',
    tags: ['smuggler', 'barge-rat', 'quiet'],
    surface: 'A thin man with watermarks on his sleeves and the careful eyes of someone who has been hit before.',
    want: 'get back on a barge before his name is forgotten in the fens',
    need: 'accept that the men he ran with do not consider him worth the rescue',
    ghost: 'was once the favoured nephew of a Tevin barge-master who left him to the watch',
    lie: 'if he stays useful, someone will buy him out',
    secret: 'he has a list of names sewn into the lining of his belt',
    arcState: 'held in the fort dungeon for three weeks; has not yet been sold or ransomed',
  },
  // Fixed regional landmarks (3 — would be in cached prefix)
  {
    id: 'char_halvern', name: 'Halvern Coate', region: 'Mireford', role: 'npc',
    tags: ['magistrate', 'old-soldier', 'tired'],
    surface: 'The magistrate of Mireford. Mid-sixties, a soldier\'s posture and a clerk\'s habits, a man who has not slept well in three months.',
    want: 'hold the town through to the spring caravan',
    need: 'understand that the lie he is maintaining has already started taking the town',
    ghost: 'as a young officer signed a requisition that emptied a village of its grain in a famine year',
    lie: 'a competent man can hold a lie long enough for the truth to no longer matter',
    secret: 'he has been buying salt from a Tevin smuggler-ring at six times the old price, paid from a reserve that has six weeks left',
    arcState: 'in office, increasingly desperate; has begun making quiet requests of strangers',
  },
  {
    id: 'char_abbess_lira', name: 'Abbess Lira Vesh', region: 'Mireford', role: 'npc',
    tags: ['abbess', 'archivist', 'careful'],
    surface: 'A small woman in her fifties with quiet authority and ink under her nails.',
    want: 'keep the abbey out of the magistrate\'s troubles',
    need: 'stop pretending that her vows forbid her involvement in civic matters',
    ghost: 'failed to rally the abbey when raiders came; surviving sisters died later because she counselled nonresistance',
    lie: 'if I keep my hands clean, I keep the abbey pure',
    secret: 'she keeps a hidden account book of hush payments and authorized relief consignments',
    arcState: 'has been seen meeting with strangers at odd hours',
  },
  {
    id: 'char_harbour_jorun', name: 'Jorun Maerle', region: 'Mireford', role: 'npc',
    tags: ['harbour-master', 'old-sailor', 'corruptible'],
    surface: 'A wide-shouldered man with a permanent salt-burn across his cheekbones and a stutter when he\'s drunk.',
    want: 'get his daughter married to a cooper before her dowry runs out',
    need: 'stop borrowing from men whose books he does not read',
    ghost: 'lost a ship and three men in a storm he could have read coming',
    lie: 'a careful man can keep small debts small',
    secret: 'he owes the Tevin barge-ring more than the harbour\'s yearly excise',
    arcState: 'in office; visibly anxious during the last muster',
  },
  // Recently active NPCs (4)
  {
    id: 'char_iselle', name: 'Iselle Brun', region: 'Mireford', role: 'npc',
    tags: ['smuggler-captain', 'cunning', 'tevin-tied'],
    surface: 'A woman in her late thirties in unmarked sailor\'s coat, hair cropped short, eyes that take in a room in one look.',
    want: 'turn Mireford into a Tevin laundering hub before winter',
    need: 'realize the people she is using are not interchangeable with the people she ran with as a girl',
    ghost: 'grew up in a smuggler family that was sold out by their own when the watch closed in',
    lie: 'the only debt that matters is the one you can prove on paper',
    secret: 'she keeps a barge moored under a false freight-license at the Greyford reach',
    arcState: 'slipped onto a barge during a fort raid last month; her whereabouts are not currently known',
  },
  {
    id: 'char_father_wend', name: 'Father Renn Wend', region: 'Mireford', role: 'npc',
    tags: ['cleric', 'scheming', 'old-blood'],
    surface: 'A thin priest in his fifties with a tic in his right eye and a habit of clasping his hands behind his back.',
    want: 'manufacture a noble heir before the Ardren keep reverts to the crown',
    need: 'admit that he is not saving the house, he is saving his own posting',
    ghost: 'was passed over for an abbey seat thirty years ago because his birth was contested',
    lie: 'small dishonesties serve great goods',
    secret: 'he has been writing to a southern cousin-branch of House Ardren forging endorsements',
    arcState: 'has taken to walking the road to Vael\'s End at odd hours',
  },
  {
    id: 'char_steward_brann', name: 'Brann Olwyn', region: 'Mireford', role: 'npc',
    tags: ['steward', 'old-soldier', 'loyal-beyond-reason'],
    surface: 'Forty-three, a limp from an old campaign, the careful hands of a man who has spent twenty years writing other people\'s ledgers.',
    want: 'see Lady Cessa Ardren through to a quiet end',
    need: 'accept that the kindness that kept him at Vael\'s End has become a chain on him',
    ghost: 'a Border Watch campaign that broke him and left him with no place to go except the keep that took him in',
    lie: 'loyalty is the only currency I cannot lose',
    secret: 'he has begun, against every habit, hiring strangers for things the watch should be doing',
    arcState: 'still at Vael\'s End; Lady Cessa is fading',
  },
  {
    id: 'char_cessa', name: 'Lady Cessa Ardren', region: 'Mireford', role: 'npc',
    tags: ['noble', 'dying', 'last-of-house'],
    surface: 'Eighty-one, bedridden, lucid in flashes; the last living Ardren.',
    want: 'die without leaving Brann a successor he has to obey',
    need: 'admit that what she has done to him over twenty years was cruelty disguised as need',
    ghost: 'outlived three children and a husband; the keep is the only thing she has not buried',
    lie: 'if I do not name an heir, Brann will not leave',
    secret: 'she has been writing letters to Brann she has burned for twelve years',
    arcState: 'in her last weeks; refusing visitors',
  },
  // Older NPCs (3 — would be candidates for dynamic sample at lower priority)
  {
    id: 'char_holm', name: 'Captain Mar Holm', region: 'Mireford', role: 'npc',
    tags: ['crown-adjutant', 'patient', 'rough-with-papers'],
    surface: 'A heavy-set crown adjutant who carries his tax ledger like a weapon.',
    want: 'inventory Vael\'s End for the crown\'s benefit',
    need: 'realize that the order he serves is not as tidy as the ledger he keeps',
    ghost: 'lost a brother to a noble house\'s private justice and never said so out loud',
    lie: 'the crown is the only law worth serving',
    secret: 'he has been told the inventory is the first step to a takeover',
    arcState: 'returning to Vael\'s End within the month',
  },
  {
    id: 'char_widow_helle', name: 'Sister Helle Brand', region: 'Mireford', role: 'npc',
    tags: ['archivist', 'nervous', 'careful-hand'],
    surface: 'A thin woman in her forties with ink to her elbows and a habit of glancing at doorways.',
    want: 'keep her name out of any ledger the magistrate sees',
    need: 'stop believing she can buy safety by burning the right page',
    ghost: 'as a young scribe witnessed a debt-bond she did not report and watched the family ruined',
    lie: 'silence keeps the small safe',
    secret: 'she has been quietly destroying ledger pages that name her cousins',
    arcState: 'still at the abbey; very tired',
  },
  {
    id: 'char_gideon', name: 'Gideon Harrow', region: 'Mireford', role: 'mercenary',
    tags: ['quartermaster', 'precise', 'cautious'],
    surface: 'A thick-forearmed quartermaster with a clerk\'s precision and a soldier\'s suspicion of improvisation.',
    want: 'secure reliable supply lines before the spring thaw',
    need: 'stop trusting only rigid procedure and learn to trust competent people',
    ghost: 'lost half a convoy because he refused an officer\'s improvisation',
    lie: 'only strict adherence to plan keeps men alive',
    secret: 'he knows where Marek has hidden a diverted village seed-fund and fears its discovery',
    arcState: 'managing the fort\'s books; quiet but watchful',
  },
];

function landmarks(): PoolCharacter[] {
  // The "always-around" cached prefix landmarks for Mireford.
  return POOL.filter(c => ['char_halvern', 'char_abbess_lira', 'char_harbour_jorun'].includes(c.id));
}

function fortRoster(): PoolCharacter[] {
  return POOL.filter(c => c.role === 'mercenary' || c.role === 'captive');
}

function regionNpcSample(rarity: 'rare' | 'legendary', exclude: Set<string>): PoolCharacter[] {
  // Filter: region npcs not already in prefix
  const inPrefix = new Set([...landmarks(), ...fortRoster()].map(c => c.id));
  const candidates = POOL.filter(
    c => c.role === 'npc' && c.region === 'Mireford' && !inPrefix.has(c.id) && !exclude.has(c.id),
  );
  const K = rarity === 'rare' ? 6 : 8;
  return candidates.slice(0, K);
}

// ---------------- bible cast schema ----------------

const CastExistingSchema = z.object({
  kind: z.literal('existing'),
  characterId: z.string(),
  roleInChain: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  arcStateAfterChain: z.string().min(8).max(220),
});
const CastNewSchema = z.object({
  kind: z.literal('new'),
  character: z.object({
    name: z.string().min(2),
    tags: z.array(z.string()).max(8),
    surface: z.string().min(8),
    want: z.string().min(4),
    need: z.string().min(4),
    ghost: z.string().min(4),
    lie: z.string().min(4),
    secret: z.string().min(4),
  }),
  roleInChain: z.enum(['protagonist', 'antagonist', 'complication', 'ally']),
  arcStateAfterChain: z.string().min(8).max(220),
});
const CastEntrySchema = z.discriminatedUnion('kind', [CastExistingSchema, CastNewSchema]);

const PoolBibleOutSchema = z.object({
  title: z.string().min(2).max(80),
  shape: z.enum(['tight', 'classic', 'ensemble', 'twist-heavy']),
  controllingIdea: z.string().min(10).max(220),
  cast: z.array(CastEntrySchema).min(2).max(6),
  surfaceSituation: z.string().min(20),
  hiddenSituation: z.string().min(20),
  trajectory: z.string().min(20),
  setupPayoffs: z.array(z.object({ plant: z.string(), payoff: z.string() })).min(1).max(6),
  dramaticIrony: z.string().optional(),
});

// ---------------- prompt ----------------

const SYSTEM = `You are the showrunner of a grimdark mercenary-fort game. You author chain bibles — compact reference documents a writers' room works from. A bible is NOT prose; it is the underlying CHARACTERS + SITUATION + TRAJECTORY a downstream writer will turn into quests one at a time.

This world keeps a CHARACTER POOL. Characters persist across chains: their want/need/ghost/lie/secret stay the same, their arcState updates with what happens. Your job is to BUILD A CAST primarily by reusing pool characters whose existing wounds and lies fit the role you need them to play. Coin a new character ONLY when no pool character can plausibly fill a role.

CRAFT REQUIREMENTS (compact, in JSON):
- title: a short evocative chain title (2-8 words). No "The Weight of X" / "The Shadow of Y" patterns. Name a specific concrete thing/person/place from the chain.
- shape: PICK ONE based on what the situation needs. Don't always pick the same.
    "tight"        — two cast members (protagonist + antagonist), single confrontation, 1-2 plants, may omit dramaticIrony. Best for personal feuds, ambushes, one-night problems. controllingIdea + surface + hidden + trajectory should be TERSE (1-2 sentences each).
    "classic"      — 3 cast members, 2-3 plants, has dramaticIrony. Best for a balanced quest. Medium length everywhere.
    "ensemble"     — 4-6 cast members, 3-5 plants, has dramaticIrony, hiddenSituation is fuller (4-6 sentences) because there are more parties. Best for political/multi-faction chains.
    "twist-heavy"  — 2-3 cast, 4-6 plants/payoffs, dramaticIrony is the centerpiece (2-3 sentences naming WHEN each side learns the truth). hiddenSituation must clearly contradict surfaceSituation. Best for revelations, betrayals, identity-flip reveals.
  Engine guidance: common rarity tends toward tight; legendary tends toward ensemble or twist-heavy. But the situation OVERRIDES rarity — a legendary personal duel should still be tight.
- controllingIdea: one sentence stating what the chain ARGUES (a moral claim, not a plot).
- cast: 2-6 characters with roleInChain (protagonist | antagonist | complication | ally). Cast SIZE matches your chosen shape — don't always pick 4. For each, EITHER:
    { "kind": "existing", "characterId": "<exact id from pool>", "roleInChain": "...", "arcStateAfterChain": "<one-line update describing where this character ends up>" }
    or:
    { "kind": "new", "character": { "name", "tags", "surface", "want", "need", "ghost", "lie", "secret" }, "roleInChain": "...", "arcStateAfterChain": "..." }
- surfaceSituation: 2-3 sentences. What strangers/mercenaries are told.
- hiddenSituation: 3-5 sentences. What's really going on.
- trajectory: 3-5 sentences ending with how the climax delivers the reward.
- setupPayoffs: 1-6 plant/payoff pairs (specific named objects/habits/places). Count matches your shape — tight: 1-2, classic: 2-3, ensemble: 3-5, twist-heavy: 4-6.
- dramaticIrony: 1-2 sentences naming what player knows / characters don't, when each side learns. OMIT this field for "tight" shape if the chain has no real irony layer.

REUSE DISCIPLINE (READ TWICE):
- Pool characters are SHOWN with their full story (want/need/ghost/lie/secret/arcState). Read them. The point of a pool is that a character whose existing lie ALREADY MIRRORS the bible's needed antagonist role is a much richer choice than coining a stranger.
- For each role, ask first: does any pool character fit naturally? If yes, use them.
- If you reuse, the arcStateAfterChain MUST reflect how THIS chain changes them (or doesn't — a chain can leave a character entrenched in their lie, which is also fine, just say so).
- If you coin new, the new character's want/need/ghost/lie/secret must be as specific as the pool ones (no "haunted by his past" — name the past).
- Anchor mercenaries / required characters MUST appear in the cast (engine provides them).

NAMING (when coining new):
- Do NOT use a first name or last name that overlaps with any pool character (e.g. if pool has "Marek Voss", you cannot coin "Marek Halren" or "Janne Voss").
- Period-appropriate Germanic/Celtic/Slavic names.

ARCSTATE DISCIPLINE:
- arcStateAfterChain is one line, max ~150 chars. It is the line a future bible-author will read to know where this character stands. Be specific: "ousted from Vael's End, now drifting in Greyford with a Mareth seal he never returned" is good. "Lives on, changed" is bad.

BANNED TOKENS (any inflection): weight, weighed, weighing, weighs, shadow, shadows, burden, burdened, ghosts, fate, destined, destiny, glorious, ancient evil, darkness descends, grip tightens, tightens its grip, stranglehold. When you want to convey heaviness, name a specific physical thing.

ANTI-FIXATION: if the engine lists "recently-used motifs/devices" (ledgers, sealed cloaks, hidden lists, smuggling, etc.), DO NOT make those the chain's central device. Pick a different concrete object/situation as the inciting hook. Recurring locations are fine; recurring central devices are not.

Output JSON only.`;

function poolBlock(chars: PoolCharacter[], label: string): string {
  if (chars.length === 0) return `${label}: (none)`;
  const lines: string[] = [`${label} (${chars.length}):`];
  for (const c of chars) {
    lines.push(`  - id="${c.id}" name="${c.name}" role=${c.role} tags=[${c.tags.join(',')}]`);
    lines.push(`    surface: ${c.surface}`);
    lines.push(`    want: ${c.want}`);
    lines.push(`    need: ${c.need}`);
    lines.push(`    ghost: ${c.ghost}`);
    lines.push(`    lie: ${c.lie}`);
    lines.push(`    secret: ${c.secret}`);
    lines.push(`    arcState: ${c.arcState}`);
  }
  return lines.join('\n');
}

interface RunChain {
  label: string;
  rarity: 'rare' | 'legendary';
  rewardSpec: string;
  themeKeywords: readonly string[];
  seedLeadBlurb?: string;
  requiredAnchorId?: string;
  isUnitChain?: boolean;
  forbidReuse?: boolean;
  recentMotifs?: readonly string[];
  model?: 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-5';
  readerFlavor?: string;
}

async function runChain(req: RunChain): Promise<{
  request: RunChain;
  prefix: PoolCharacter[];
  sample: PoolCharacter[];
  required?: PoolCharacter;
  bible: z.infer<typeof PoolBibleOutSchema>;
  reuseCount: number;
  newCount: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const client = new OpenAI({ apiKey });
  const prefix = [...landmarks(), ...fortRoster()];
  const required = req.requiredAnchorId ? POOL.find(c => c.id === req.requiredAnchorId) : undefined;
  const excludeFromSample = new Set([...(required ? [required.id] : [])]);
  const sample = regionNpcSample(req.rarity, excludeFromSample);

  const userParts: string[] = [];
  userParts.push(`CHARACTER POOL — for cast reuse`);
  userParts.push(``);
  userParts.push(poolBlock(prefix, 'FORT ROSTER + LANDMARKS (cached prefix)'));
  userParts.push(``);
  userParts.push(poolBlock(sample, `REGION NPC SAMPLE for this chain`));
  if (required) {
    userParts.push(``);
    const anchorLabel = req.isUnitChain
      ? 'REQUIRED IN CAST — this is a UNIT CHAIN: the anchor MUST be protagonist, and the controllingIdea/hiddenSituation/trajectory MUST be driven by their want/need/ghost/lie. The chain exists to advance THEIR arc. Other cast members serve that arc.'
      : 'REQUIRED IN CAST — engine has anchored this character (you MUST include them)';
    userParts.push(poolBlock([required], anchorLabel));
  }
  userParts.push(``);
  userParts.push(`CHAIN SPEC`);
  userParts.push(`Region: Mireford`);
  userParts.push(`Rarity: ${req.rarity}`);
  userParts.push(`Engine-declared reward (climax must deliver this naturally): ${req.rewardSpec}`);
  if (req.themeKeywords.length) userParts.push(`Theme keywords: ${req.themeKeywords.join(', ')}`);
  if (req.seedLeadBlurb) userParts.push(`Inciting hint (must reflect in surfaceSituation): ${req.seedLeadBlurb}`);
  userParts.push(``);
  if (req.readerFlavor) {
    userParts.push(``);
    userParts.push(`READER PREFERENCE (the player has stated this preference; weave it into the bible while keeping the grimdark setting intact):`);
    userParts.push(req.readerFlavor);
  }
  if (req.recentMotifs && req.recentMotifs.length) {
    userParts.push(``);
    userParts.push(`RECENTLY-USED CENTRAL DEVICES (do NOT reuse as this chain's central device): ${req.recentMotifs.join(' | ')}`);
  }
  if (req.forbidReuse) {
    userParts.push(``);
    userParts.push(`POOL OVERRIDE: This chain takes place far from the fort's usual operating area. NO pool character would plausibly be on stage here. You MUST coin every cast member as kind:"new". The pool block above is provided ONLY as a naming-style reference (so coined names don't clash with pool names) — do NOT cast anyone from the pool. Coin 2-4 fresh characters with full want/need/ghost/lie/secret.`);
  }
  userParts.push(``);
  userParts.push(`Author the bible now. Output JSON only.`);

  const usr = userParts.join('\n');
  // Estimate token usage roughly
  const approxInputChars = SYSTEM.length + usr.length;
  console.log(`  [${req.label}] approx input chars: ${approxInputChars} (~${Math.round(approxInputChars / 4)} tokens)`);

  const resp = await client.chat.completions.create({
    model: req.model ?? 'gpt-5-mini',
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: usr },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 14000,
    stream: false,
  });
  const content = resp.choices[0]?.message?.content ?? '{}';
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (e) {
    console.error(`  [${req.label}] JSON parse failed; raw output:\n${content.slice(0, 500)}`);
    throw e;
  }
  const parseResult = PoolBibleOutSchema.safeParse(raw);
  if (!parseResult.success) {
    const dumpPath = resolve(outDir, `pool-prompt-test-${label}-${req.label}-raw.json`);
    writeFileSync(dumpPath, JSON.stringify(raw, null, 2));
    console.error(`  [${req.label}] schema failure — wrote raw to ${dumpPath}`);
    console.error(`  [${req.label}] top-level keys: ${Object.keys(raw as object).join(', ')}`);
    throw parseResult.error.errors;
  }
  const parsed = parseResult.data;
  const reuseCount = parsed.cast.filter(c => c.kind === 'existing').length;
  const newCount = parsed.cast.filter(c => c.kind === 'new').length;
  // Surface OpenAI's prompt-cache hit count if present.
  // Cached tokens are billed at ~10% of normal input rate. Cache requires the
  // prompt prefix to be byte-identical across calls (and >=1024 tokens).
  const cachedTokens =
    (resp.usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })
      ?.prompt_tokens_details?.cached_tokens ?? 0;
  return {
    request: req,
    prefix,
    sample,
    required,
    bible: parsed,
    reuseCount,
    newCount,
    promptTokens: resp.usage?.prompt_tokens ?? 0,
    completionTokens: resp.usage?.completion_tokens ?? 0,
    cachedTokens,
    systemPrompt: SYSTEM,
    userPrompt: usr,
    rawResponse: content,
  };
}

function applyArcStateUpdates(bible: z.infer<typeof PoolBibleOutSchema>, label: string): void {
  // Mutate the pool: existing characters get arcState updated; new characters
  // get added; THIS IS WHERE the real engine would persist. For this prompt
  // test, we just patch the in-memory POOL array.
  for (const c of bible.cast) {
    if (c.kind === 'existing') {
      const target = POOL.find(p => p.id === c.characterId);
      if (target) {
        console.log(`  pool: updated ${target.id} arcState ← ${c.arcStateAfterChain}`);
        target.arcState = c.arcStateAfterChain;
      } else {
        console.warn(`  pool: AI referenced unknown id "${c.characterId}" — would fall back to coin-new`);
      }
    } else {
      const newId = `char_${label}_${POOL.length}`;
      const nc = c.character;
      console.log(`  pool: added new ${newId} "${nc.name}" (role=${c.roleInChain})`);
      POOL.push({
        id: newId,
        name: nc.name,
        region: 'Mireford',
        role: c.roleInChain === 'ally' ? 'npc' : 'npc',
        tags: nc.tags,
        surface: nc.surface,
        want: nc.want,
        need: nc.need,
        ghost: nc.ghost,
        lie: nc.lie,
        secret: nc.secret,
        arcState: c.arcStateAfterChain,
      });
    }
  }
}

// ---------------- the 3-chain run ----------------

const FURRY_FLAVOR = `The player enjoys character-driven anthropomorphic visual novels in the vein of "Nekojishi" and "Adastra" / "Astatos" — meaning: cast members are anthros (specify species in surface descriptions: fox, wolf, otter, bull, lynx, etc.); intimate emotional beats (vulnerability, tenderness, longing, mid-night confessions, romantic/queer subtext) are layered into the grimdark mercenary action; the controllingIdea may foreground intimacy/care/identity-as-species as much as politics. Do NOT abandon the grimdark setting — the mud and the marsh and the betrayals stay. Treat existing pool characters as anthros too: in the cast block's arcStateAfterChain you may include a species note for reused characters (e.g. "Marek Voss (mire-otter, greying)").`;

const CHAINS: RunChain[] = [
  {
    label: 'nano_baseline',
    rarity: 'rare',
    rewardSpec: 'rare recruit: an NPC from the cast joins the fort as a mid-career steward-soldier',
    themeKeywords: ['oath-bound', 'civic', 'lie'],
    seedLeadBlurb: 'A drowned smuggler washed up at Greyford with a noble house seal stitched into his cloak. Marek recognised the cipher.',
    model: 'gpt-5-nano',
  },
  {
    label: 'mini_furry',
    rarity: 'rare',
    rewardSpec: 'captive: an antagonist NPC ends the chain in the fort dungeon',
    themeKeywords: ['marsh-rite', 'old-faith', 'silence'],
    seedLeadBlurb: 'Three village children have gone missing from the marsh hamlet of Slowwater in successive new moons. The hamlet refuses outside help.',
    model: 'gpt-5-mini',
    readerFlavor: FURRY_FLAVOR,
  },
  {
    label: 'nano_furry',
    rarity: 'rare',
    rewardSpec: 'unique trait on Tibalt Renn: he resolves his fixation on his older brother — name a concrete narrative trait the climax earns',
    themeKeywords: ['brother', 'unfinished-contract', 'coming-of-age'],
    seedLeadBlurb: 'A wagoneer wintering at Mireford claims he hired a crossbowman three years ago whose description matches a man Tibalt knew.',
    requiredAnchorId: 'char_tibalt',
    isUnitChain: true,
    model: 'gpt-5-nano',
    readerFlavor: FURRY_FLAVOR,
  },
  {
    label: 'mini_furry_legendary',
    rarity: 'legendary',
    rewardSpec: 'rare item: a named artifact, +1 prestige in Mireford while owned',
    themeKeywords: ['relic', 'crown', 'reckoning'],
    seedLeadBlurb: 'A crown adjutant arrives unannounced at Mireford gate carrying a sealed writ; he refuses to name his business until Marek meets him in private.',
    model: 'gpt-5-mini',
    readerFlavor: FURRY_FLAVOR,
  },
];

async function main(): Promise<void> {
  console.log(`==== pool-prompt-test ${label} ====`);
  const results: Awaited<ReturnType<typeof runChain>>[] = [];
  for (const c of CHAINS) {
    console.log(`\n--- ${c.label} (${c.rarity}) ---`);
    try {
      const r = await runChain(c);
      results.push(r);
      console.log(`  model: ${c.model ?? 'gpt-5-mini'}  bible: "${r.bible.title}"`);
      console.log(`  controlling: ${r.bible.controllingIdea}`);
      console.log(`  cast: reuse=${r.reuseCount} new=${r.newCount}`);
      console.log(`  tokens: in=${r.promptTokens} (cached=${r.cachedTokens}) out=${r.completionTokens}`);
      applyArcStateUpdates(r.bible, c.label);
    } catch (e) {
      console.error(`  *** chain ${c.label} failed: ${(e as Error).message}`);
      // Continue to next chain so we still see partial state
    }
  }

  // Final dump
  const lines: string[] = [];
  lines.push(`==== pool-prompt-test ${label} ====`);
  lines.push(``);
  lines.push(`# Final pool state (${POOL.length} characters)`);
  for (const c of POOL) {
    lines.push(`  ${c.id} ${c.name} (${c.role}): ${c.arcState}`);
  }
  lines.push(``);
  for (const r of results) {
    lines.push(`==========================================================`);
    lines.push(`# ${r.request.label}: ${r.bible.title}`);
    lines.push(`  model=${r.request.model ?? 'gpt-5-mini'}  rarity=${r.request.rarity}  shape=${r.bible.shape}  reward="${r.request.rewardSpec}"`);
    lines.push(`  controlling idea: ${r.bible.controllingIdea}`);
    lines.push(`  reuse=${r.reuseCount}  new=${r.newCount}  tokens=in:${r.promptTokens} cached:${r.cachedTokens} out:${r.completionTokens}`);
    lines.push(``);
    lines.push(`  CAST:`);
    for (const c of r.bible.cast) {
      if (c.kind === 'existing') {
        const ref = POOL.find(p => p.id === c.characterId);
        lines.push(`    [REUSE] ${c.characterId} (${ref?.name ?? '???'}) as ${c.roleInChain}`);
        lines.push(`            → arcState: ${c.arcStateAfterChain}`);
      } else {
        lines.push(`    [NEW]   ${c.character.name} as ${c.roleInChain}`);
        lines.push(`            surface: ${c.character.surface}`);
        lines.push(`            ghost: ${c.character.ghost}`);
        lines.push(`            lie: ${c.character.lie}`);
        lines.push(`            secret: ${c.character.secret}`);
        lines.push(`            → arcState: ${c.arcStateAfterChain}`);
      }
    }
    lines.push(``);
    lines.push(`  Surface: ${r.bible.surfaceSituation}`);
    lines.push(`  Hidden:  ${r.bible.hiddenSituation}`);
    lines.push(`  Traj:    ${r.bible.trajectory}`);
    lines.push(`  Irony:   ${r.bible.dramaticIrony}`);
    lines.push(``);
    lines.push(`  Setup/payoff ledger:`);
    for (const sp of r.bible.setupPayoffs) {
      lines.push(`    PLANT  → ${sp.plant}`);
      lines.push(`    PAYOFF → ${sp.payoff}`);
    }
    lines.push(``);
    lines.push(`  --- FULL PROMPT SENT ---`);
    lines.push(`  [SYSTEM]`);
    lines.push(r.systemPrompt.split('\n').map(l => '  | ' + l).join('\n'));
    lines.push(``);
    lines.push(`  [USER]`);
    lines.push(r.userPrompt.split('\n').map(l => '  | ' + l).join('\n'));
    lines.push(``);
    lines.push(`  --- RAW RESPONSE RECEIVED ---`);
    lines.push(r.rawResponse.split('\n').map(l => '  | ' + l).join('\n'));
    lines.push(``);
  }
  const outPath = `${outDir}/pool-prompt-test-${label}.txt`;
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nwrote: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
