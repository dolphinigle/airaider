// questInteractive — drive the agency quest-writer ONE STEP AT A TIME so a human
// (or the CLI agent on the human's behalf) makes each decision live.
//
// State persists to /tmp/airaider-interactive-<id>.json between invocations.
//
// Commands:
//   start <tibalt|roselle|marek> [--fresh]   reset state, generate bible, print blurb + roster
//   scene                                    generate the next quest scene, print options, STOP
//   resolve <optionIndex>                    resolve the pending scene with the chosen option
//
// Run: cd engine/server && AIRAIDER_BEAT_MODEL=gpt-5-mini AIRAIDER_BEAT_EFFORT=low \
//        npx tsx src/chainBible/questInteractive.ts <command> [...args]

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
const MAX_QUESTS = 5;

const OptionSchema = z.object({
  action: z.string().min(2),
  fiction: z.string().min(4),
  pull: z.string(),
  risk: z.string().min(4),
});
const QuestSceneSchema = z.object({
  scene: z.string().min(20),
  notices: z.string().min(10),
  decisionPrompt: z.string().min(4),
  options: z.array(OptionSchema).min(2).max(3),
  isClimax: z.boolean(),
});
type QuestScene = z.infer<typeof QuestSceneSchema>;

const QuestOutcomeSchema = z.object({
  outcome: z.string().min(20),
  lieMovement: z.string().min(6),
});
type QuestOutcome = z.infer<typeof QuestOutcomeSchema>;

const QUEST_SCENE_SYSTEM = `You write ONE quest at a time for a grimdark mercenary-fort game. The player runs a fort and DEPLOYS a mercenary into a situation. Your quest is the SCENE the deployed merc walks into — and it MUST STOP at a real decision the PLAYER makes. You are NOT narrating an outcome; you are handing the player a live choice.

You have the chain BIBLE and the PRIOR QUESTS (with the player's prior choices and how they resolved).

THE ONE RULE THAT MATTERS — AGENCY:
- Do NOT resolve the situation. Walk the merc up to a fork and STOP. The player decides; the engine resolves next.
- The decision must bear on the PROTAGONIST'S LIE (from the bible): one option pushes them toward the hard truth, one lets them retreat into the comfortable lie, optionally one goes sideways. Mark each with "pull".
- EVERY option must carry a GENUINE RISK/COST. If one option is obviously best, you have written bookkeeping, not a choice. The truth-option should cost something real (danger, a relationship, the fort's safety); the comfort-option should cost something internal (the protagonist's growth, a buried guilt). Make the player actually hesitate.
- VARY the decision TYPE across quests — not always truth-vs-comfort phrasing. Some quests: who to trust, who to send, what to spend, where to look, whether to keep a promise. The LIE pressure should be underneath, not the surface label.
- The choice is the protagonist's, surfaced THROUGH the player. Frame it in fiction, not menu-speak.

PLAYER ONBOARDING:
- The player discovers chains on a lead board and knows NO cast member's name until met on-stage. Quest 1's scene must arrive cold from the leadBoardBlurb; introduce one or two cast by encountering them. Later quests may name earlier-met cast.
- Reveal the hiddenSituation beat by beat. Quest 1 shows only what the merc sees arriving cold.

CLIMAX: when the chain's trajectory ending is the choice in front of the player, set isClimax=true. The climax decision IS the moment the lie breaks or holds — make it the hardest choice of the chain. Do NOT foreshadow or name the chain's reward before the climax.

VOICE: terse, present-tense, mud-and-iron. Concrete nouns. No internal monologue dumps. BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny, grip tightens.

scene: 3-5 sentences, ends at the fork, UNRESOLVED.
notices: 1-2 sentences — what the deployed merc privately reads in the scene (shows their want/lie without stating it as a label).
decisionPrompt: the question put to the player, in fiction.
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

interface PlayedQuest { scene: QuestScene; chosenIndex: number; outcome: QuestOutcome; }
interface State {
  specId: string;
  protagonist: string;
  bible: Bible;
  played: PlayedQuest[];
  pendingScene: QuestScene | null;
}

interface Spec { id: string; protagonist: string; hintId: string; req: Omit<BibleRequest, 'pool'>; }
const SPECS: Record<string, Spec> = {
  tibalt: { id: 'tibalt', protagonist: 'Tibalt', hintId: 'grief-unsaid', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
    requiredAnchorId: 'char_tibalt', isUnitChain: true,
    seedLeadBlurb: 'A wagoner asks the fort if anyone ever found the courier who vanished on the Coldfen road three winters back.' } },
  roselle: { id: 'roselle', protagonist: 'Roselle', hintId: 'faith-performed', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_roselle', traitName: 'Quiet Vigil' },
    requiredAnchorId: 'char_roselle', isUnitChain: true,
    seedLeadBlurb: 'A grieving family at Penholt begs for someone to recover a relic the abbey says was never theirs.' } },
  marek: { id: 'marek', protagonist: 'Marek', hintId: 'mercy-cowardice', req: {
    region: 'Mireford', rarity: 'rare',
    rewardSpec: { kind: 'captive_to_dungeon' },
    seedLeadBlurb: 'A drowned man washed up at Greyford with a sealed letter sewn into his cloak.' } },
};

function statePath(id: string): string { return `/tmp/airaider-interactive-${id}.json`; }
function activePath(): string { return '/tmp/airaider-interactive-active.txt'; }
function loadState(): State {
  if (!existsSync(activePath())) throw new Error('no active session — run "start <spec>" first');
  const id = readFileSync(activePath(), 'utf8').trim();
  return JSON.parse(readFileSync(statePath(id), 'utf8')) as State;
}
function saveState(s: State): void {
  writeFileSync(statePath(s.specId), JSON.stringify(s, null, 2));
  writeFileSync(activePath(), s.specId);
}

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

function priorBlock(played: PlayedQuest[]): string {
  if (played.length === 0) return '(none yet)';
  return played.map((p, i) =>
    `Quest ${i + 1}: scene="${p.scene.scene}" | PLAYER CHOSE: ${p.scene.options[p.chosenIndex].action} (${p.scene.options[p.chosenIndex].pull}) | result="${p.outcome.outcome}" | lie: ${p.outcome.lieMovement}`
  ).join('\n');
}

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  return new OpenAI({ apiKey });
}

async function cmdStart(which: string, fresh: boolean): Promise<void> {
  const spec = SPECS[which];
  if (!spec) throw new Error(`unknown spec ${which} (tibalt|roselle|marek)`);
  const c = client();
  const bible = await getBible(c, spec, fresh);
  const pool = setupPool();
  const roster = pool.all().filter((m) => m.role === 'mercenary').map((m) => `${m.name} — ${(m.tags ?? []).join(', ')}`);
  const state: State = { specId: spec.id, protagonist: spec.protagonist, bible, played: [], pendingScene: null };
  saveState(state);
  console.log(`=== NEW PLAYTHROUGH: ${spec.id} (protagonist ${spec.protagonist}) ===`);
  console.log(`beats=${BEAT_MODEL}/${BEAT_EFFORT}`);
  console.log(``);
  console.log(`FORT ROSTER (who you can deploy):`);
  roster.forEach((r) => console.log(`  - ${r}`));
  console.log(``);
  console.log(`LEAD BOARD BLURB (this is all the player sees up front):`);
  console.log(`  "${bible.leadBoardBlurb}"`);
}

async function cmdScene(): Promise<void> {
  const s = loadState();
  if (s.pendingScene) throw new Error('a scene is already pending — resolve it first');
  if (s.played.length >= MAX_QUESTS) throw new Error('chain complete (max quests reached)');
  const c = client();
  const i = s.played.length;
  const forceClimax = i === MAX_QUESTS - 1;
  const sceneUser = [
    `BIBLE:`, JSON.stringify(s.bible, null, 2), ``,
    `PRIOR QUESTS (with player choices):`, priorBlock(s.played), ``,
    `Write quest ${i + 1}. The deployed merc is the protagonist (${s.protagonist}).`,
    forceClimax ? `This MUST be the climax (isClimax=true): the choice that breaks or holds the lie.` : `If the trajectory's ending is the choice now in front of the player, set isClimax=true; otherwise false.`,
    `Output JSON only.`,
  ].join('\n');
  const scene = await callJson(c, QUEST_SCENE_SYSTEM, sceneUser, QuestSceneSchema);
  s.pendingScene = scene;
  saveState(s);
  console.log(`### QUEST ${i + 1}${scene.isClimax ? ' — CLIMAX' : ''}`);
  console.log(``);
  console.log(`SCENE: ${scene.scene}`);
  console.log(``);
  console.log(`(${s.protagonist} notices): ${scene.notices}`);
  console.log(``);
  console.log(`DECISION: ${scene.decisionPrompt}`);
  console.log(``);
  scene.options.forEach((o, idx) => {
    console.log(`  [${idx}] ${o.action} — ${o.fiction}`);
    console.log(`        risk: ${o.risk}`);
  });
}

async function cmdResolve(optIdx: number): Promise<void> {
  const s = loadState();
  if (!s.pendingScene) throw new Error('no pending scene — run "scene" first');
  const scene = s.pendingScene;
  if (optIdx < 0 || optIdx >= scene.options.length) throw new Error(`option ${optIdx} out of range`);
  const chosen = scene.options[optIdx];
  const c = client();
  const outcomeUser = [
    `BIBLE:`, JSON.stringify(s.bible, null, 2), ``,
    `QUEST SCENE: ${scene.scene}`,
    `DECISION: ${scene.decisionPrompt}`,
    `OPTIONS: ${scene.options.map((o) => `${o.action} [${o.pull}] (risk: ${o.risk})`).join(' | ')}`,
    ``,
    `THE PLAYER CHOSE: ${chosen.action} [${chosen.pull}]`,
    `Resolve this choice. Output JSON only.`,
  ].join('\n');
  const outcome = await callJson(c, QUEST_OUTCOME_SYSTEM, outcomeUser, QuestOutcomeSchema);
  s.played.push({ scene, chosenIndex: optIdx, outcome });
  s.pendingScene = null;
  saveState(s);
  console.log(`YOU CHOSE: ${chosen.action}`);
  console.log(``);
  console.log(`OUTCOME: ${outcome.outcome}`);
  console.log(``);
  console.log(`(lie): ${outcome.lieMovement}`);
  if (scene.isClimax) console.log(`\n=== CHAIN COMPLETE ===`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (cmd === 'start') {
    await cmdStart((process.argv[3] ?? 'tibalt').toLowerCase(), process.argv.includes('--fresh'));
  } else if (cmd === 'scene') {
    await cmdScene();
  } else if (cmd === 'resolve') {
    await cmdResolve(parseInt(process.argv[3], 10));
  } else {
    throw new Error('usage: start <spec> [--fresh] | scene | resolve <optionIndex>');
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
