// questAgencyExperiment — prototype an AGENCY quest-writer and compare to the
// current narrate-the-outcome beat-writer.
//
// PROBLEM (read in questPlaytest): the current beat HOOK poses a situation and the
// BODY resolves it FOR the player. The player picks a merc, then watches a movie.
// No decision, no branch, no consequence => "player doesn't feel they're doing
// anything."
//
// THIS HARNESS plays a chain in two phases per quest:
//   1) SCENE+DECISION: the deployed merc walks into a scene that STOPS at a real
//      choice (2-3 options), each bearing differently on the protagonist's LIE
//      (push toward truth vs retreat to comfort) with a genuine tradeoff/risk.
//   2) OUTCOME: given the player's pick, resolve what happens + how it moved the lie.
// A "player policy" auto-picks options so we can read a full playthrough; run it
// twice (--policy truth | comfort) to see the chain actually BRANCH.
//
// Run: cd engine/server && npx tsx src/chainBible/questAgencyExperiment.ts [tibalt|roselle|marek] [--policy truth|comfort] [--fresh]
//   AIRAIDER_BEAT_MODEL=gpt-5-mini AIRAIDER_BEAT_EFFORT=low recommended.

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { CharacterPool } from './characterPool.js';
import { generateBible, type BibleRequest, type Bible } from './biblePipeline.js';
import { buildCharSpineSystem, applyHint, HINT_DECK } from './charDrivenPrompt.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-agency-pool.json';
const BEAT_MODEL = process.env.AIRAIDER_BEAT_MODEL ?? 'gpt-5-mini';
const BEAT_EFFORT = (process.env.AIRAIDER_BEAT_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Agency quest schema. The SCENE stops at a DECISION. Options bear on the LIE.
// ---------------------------------------------------------------------------
const OptionSchema = z.object({
  action: z.string().min(2),          // short imperative label the player clicks
  fiction: z.string().min(4),         // one sentence of in-world flavor
  pull: z.string(),                   // 'toward-truth' | 'toward-comfort' | 'sideways' (normalized at read)
  risk: z.string().min(4),            // the genuine tradeoff/cost (so no dominant answer)
});
const QuestSceneSchema = z.object({
  scene: z.string().min(20),          // merc walks in; ends AT the choice, unresolved
  notices: z.string().min(10),        // the protagonist's read — shows their want/lie
  decisionPrompt: z.string().min(4),  // the question put to the player, in fiction
  options: z.array(OptionSchema).min(2).max(3),
  isClimax: z.boolean(),
});
type QuestScene = z.infer<typeof QuestSceneSchema>;

const QuestOutcomeSchema = z.object({
  outcome: z.string().min(20),        // what happens as a result of the player's pick
  lieMovement: z.string().min(6),     // clinical: what this did to the protagonist's lie
});
type QuestOutcome = z.infer<typeof QuestOutcomeSchema>;

const QUEST_SCENE_SYSTEM = `You write ONE quest at a time for a grimdark mercenary-fort game. The player runs a fort and DEPLOYS a mercenary into a situation. Your quest is the SCENE the deployed merc walks into — and it MUST STOP at a real decision the PLAYER makes. You are NOT narrating an outcome; you are handing the player a live choice.

You have the chain BIBLE and the PRIOR QUESTS (with the player's prior choices and how they resolved).

THE ONE RULE THAT MATTERS — AGENCY:
- Do NOT resolve the situation. Walk the merc up to a fork and STOP. The player decides; the engine resolves next.
- The decision must bear on the PROTAGONIST'S LIE (from the bible): one option pushes them toward the hard truth, one lets them retreat into the comfortable lie, optionally one goes sideways. Mark each with "pull".
- EVERY option must carry a GENUINE RISK/COST. If one option is obviously best, you have written bookkeeping, not a choice. The truth-option should cost something real (danger, a relationship, the fort's safety); the comfort-option should cost something internal (the protagonist's growth, a buried guilt). Make the player actually hesitate.
- The choice is the protagonist's, surfaced THROUGH the player. Frame it in fiction, not menu-speak.

PLAYER ONBOARDING:
- The player discovers chains on a lead board and knows NO cast member's name until met on-stage. Quest 1's scene must arrive cold from the leadBoardBlurb; introduce one or two cast by encountering them. Later quests may name earlier-met cast.
- Reveal the hiddenSituation beat by beat. Quest 1 shows only what the merc sees arriving cold.

CLIMAX: when the chain's trajectory ending is the choice in front of the player, set isClimax=true. The climax decision IS the moment the lie breaks or holds — make it the hardest choice of the chain.

VOICE: terse, present-tense, mud-and-iron. Concrete nouns. No internal monologue dumps. BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny, grip tightens.

scene: 3-5 sentences, ends at the fork, UNRESOLVED.
notices: 1-2 sentences — what the deployed merc privately reads in the scene (shows their want/lie without stating it as a label).
decisionPrompt: the question put to the player, in fiction (e.g. "Drust will talk — but only if you let him walk. Do you?").
options: 2-3, each { action (short), fiction (1 sentence), pull, risk }.

Output JSON only.`;

const QUEST_OUTCOME_SYSTEM = `You resolve ONE quest decision in a grimdark mercenary-fort game. You have the chain BIBLE, the quest SCENE, the OPTIONS, and the OPTION THE PLAYER CHOSE. Narrate what happens as a result — and what it does to the PROTAGONIST'S LIE.

- Resolve ONLY the chosen option. Honor its stated risk: the cost should actually land (the danger arrives, the relationship frays, the guilt deepens or eases).
- The outcome must MOVE the protagonist's inner state in the direction the choice implied (toward truth = the lie cracks a little or breaks; toward comfort = the lie hardens and something is lost).
- Cite concrete objects/places from the bible and scene. Stay faithful to bible names — do NOT invent character names not in the bible.

VOICE: terse, present-tense, mud-and-iron. BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny, grip tightens. Do not reuse 3-word phrases from prior quests.

outcome: 3-5 sentences of what happens.
lieMovement: ONE clinical sentence naming what this did to the protagonist's lie (cracked / hardened / held / broke).

Output JSON only.`;

interface PlayedQuest { scene: QuestScene; chosen: { action: string; pull: string }; outcome: QuestOutcome; }

interface Spec { id: string; rarity: BibleRequest['rarity']; hintId: string; protagonist: string; req: Omit<BibleRequest, 'pool'>; }
const SPECS: Record<string, Spec> = {
  tibalt: { id: 'tibalt', rarity: 'rare', hintId: 'grief-unsaid', protagonist: 'Tibalt', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
    requiredAnchorId: 'char_tibalt', isUnitChain: true,
    seedLeadBlurb: 'A wagoner asks the fort if anyone ever found the courier who vanished on the Coldfen road three winters back.' } },
  roselle: { id: 'roselle', rarity: 'rare', hintId: 'faith-performed', protagonist: 'Roselle', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_roselle', traitName: 'Quiet Vigil' },
    requiredAnchorId: 'char_roselle', isUnitChain: true,
    seedLeadBlurb: 'A grieving family at Penholt begs for someone to recover a relic the abbey says was never theirs.' } },
  marek: { id: 'marek', rarity: 'rare', hintId: 'mercy-cowardice', protagonist: 'Marek', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'captive_to_dungeon' },
    seedLeadBlurb: 'A drowned man washed up at Greyford with a sealed letter sewn into his cloak.' } },
};

function setupPool(): CharacterPool {
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  return pool;
}

async function getBible(client: OpenAI, spec: Spec, fresh: boolean): Promise<Bible> {
  const cachePath = `/tmp/airaider-bible-${spec.id}.json`;
  if (!fresh && existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8')) as Bible;
  const hint = HINT_DECK.find((h) => h.id === spec.hintId)!;
  const { bible } = await generateBible(client, { pool: setupPool(), ...applyHint(spec.req, hint) }, buildCharSpineSystem());
  writeFileSync(cachePath, JSON.stringify(bible, null, 2));
  return bible;
}

async function callJson<T>(client: OpenAI, system: string, user: string, schema: z.ZodType<T>): Promise<T> {
  const res = await client.chat.completions.create({
    model: BEAT_MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 3000,
    reasoning_effort: BEAT_EFFORT,
  } as never);
  const content = (res as { choices: { message: { content: string } }[] }).choices[0].message.content;
  return schema.parse(JSON.parse(content));
}

function pickOption(scene: QuestScene, policy: string): OptionType {
  const want = policy === 'comfort' ? 'comfort' : 'truth';
  return scene.options.find((o) => o.pull.toLowerCase().includes(want)) ?? scene.options[0];
}
type OptionType = z.infer<typeof OptionSchema>;

function priorBlock(played: PlayedQuest[]): string {
  if (played.length === 0) return '(none yet)';
  return played.map((p, i) =>
    `Quest ${i + 1}: scene="${p.scene.scene}" | PLAYER CHOSE: ${p.chosen.action} (${p.chosen.pull}) | result="${p.outcome.outcome}" | lie: ${p.outcome.lieMovement}`
  ).join('\n');
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });

  const which = (process.argv[2] ?? 'tibalt').toLowerCase();
  const policyIdx = process.argv.indexOf('--policy');
  const policy = policyIdx >= 0 ? process.argv[policyIdx + 1] : 'truth';
  const fresh = process.argv.includes('--fresh');
  const spec = SPECS[which];
  if (!spec) throw new Error(`unknown spec ${which}`);

  const out: string[] = [];
  const log = (s: string) => { out.push(s); console.log(s); };

  const bible = await getBible(client, spec, fresh);
  log(`# AGENCY QUEST PLAYTHROUGH — ${spec.id}, protagonist=${spec.protagonist}, policy=${policy}, beats=${BEAT_MODEL}/${BEAT_EFFORT}`);
  log(``);
  log(`## BIBLE: "${bible.title}" (${bible.shape})`);
  log(`leadBoardBlurb: ${bible.leadBoardBlurb}`);
  log(``);

  const played: PlayedQuest[] = [];
  const maxQuests = 5;
  const bibleJson = JSON.stringify(bible, null, 2);

  for (let i = 0; i < maxQuests; i++) {
    const forceClimax = i === maxQuests - 1;
    const sceneUser = [
      `BIBLE:`, bibleJson, ``,
      `PRIOR QUESTS (with player choices):`, priorBlock(played), ``,
      `Write quest ${i + 1}. The deployed merc is the protagonist (${spec.protagonist}).`,
      forceClimax ? `This MUST be the climax (isClimax=true): the choice that breaks or holds the lie.` : `If the trajectory's ending is the choice now in front of the player, set isClimax=true; otherwise false.`,
      `Output JSON only.`,
    ].join('\n');

    const scene = await callJson(client, QUEST_SCENE_SYSTEM, sceneUser, QuestSceneSchema);
    const chosen = pickOption(scene, policy);

    log(`### QUEST ${i + 1}${scene.isClimax ? ' — CLIMAX' : ''}`);
    log(`SCENE: ${scene.scene}`);
    log(`(${spec.protagonist} notices): ${scene.notices}`);
    log(``);
    log(`DECISION: ${scene.decisionPrompt}`);
    for (const o of scene.options) {
      const mark = o === chosen ? '>>>' : '   ';
      log(`${mark} [${o.pull}] ${o.action} — ${o.fiction}  (risk: ${o.risk})`);
    }
    log(``);

    const outcomeUser = [
      `BIBLE:`, bibleJson, ``,
      `QUEST SCENE: ${scene.scene}`,
      `DECISION: ${scene.decisionPrompt}`,
      `OPTIONS: ${scene.options.map((o) => `${o.action} [${o.pull}] (risk: ${o.risk})`).join(' | ')}`,
      ``,
      `THE PLAYER CHOSE: ${chosen.action} [${chosen.pull}]`,
      `Resolve this choice. Output JSON only.`,
    ].join('\n');
    const outcome = await callJson(client, QUEST_OUTCOME_SYSTEM, outcomeUser, QuestOutcomeSchema);
    log(`PLAYER CHOSE: ${chosen.action}`);
    log(`OUTCOME: ${outcome.outcome}`);
    log(`(lie ${policy === 'comfort' ? 'hardens' : 'cracks'}): ${outcome.lieMovement}`);
    log(``);

    played.push({ scene, chosen: { action: chosen.action, pull: chosen.pull }, outcome });
    if (scene.isClimax) break;
  }

  const outPath = `/tmp/airaider-agency-${spec.id}-${policy}.md`;
  writeFileSync(outPath, out.join('\n'));
  console.log(`\nTranscript: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
