// Player-simulation harness for the chain-bible experiment.
//
// Runs the full pipeline end-to-end on multiple seeds:
//   1) generate the bible (gpt-5-mini)
//   2) loop: generateNextBeat -> mock play outcome -> push to history
//      until isClimax (or hardCap)
//   3) generate the epilogue from bible + outcome trace
//
// Dumps TWO views per seed:
//   - PLAYER VIEW: only what a player would see (hooks + outcome narrations
//     + epilogue). This is the artifact I read to judge engagement.
//   - EDITOR VIEW: the bible + craftNotes + reasoning per beat. For me to
//     understand why each beat exists.
//
// Usage:
//   cd engine/server
//   npx tsx src/simulateBibleChain.ts <label>

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import {
  generateChainBible,
  generateNextBeat,
  generateChainEpilogueFromBible,
  bibleModel,
  beatModel,
  type ChainBible,
  type BeatWithOutcome,
  type PlayOutcome,
} from './chainBibleExperiment.js';

loadEnv({ path: resolve(process.env.HOME ?? '', '.airaider/openai.env') });
if (!process.env.OPENAI_API_KEY) {
  console.error('Need OPENAI_API_KEY');
  process.exit(1);
}

const label = process.argv[2] ?? 'unlabeled';
const outDir = resolve('/home/irvan/.copilot/session-state/d7cc1691-5204-4791-a123-6cbe8add465f/files/experiments');
mkdirSync(outDir, { recursive: true });

// ---------- seeds ----------

interface Seed {
  name: string;
  region: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  rewardSpec: string;
  themeKeywords?: readonly string[];
  seedLeadBlurb?: string;
  anchorMerc?: { name: string; backstory?: string; tagLabels?: readonly string[] };
  // mock play outcomes — what "happens" each beat in our simulated playthrough
  outcomes: readonly { outcome: PlayOutcome; narration: string }[];
}

const SEEDS: Seed[] = [
  {
    name: 'mireford-rare-mostly-wins',
    region: 'Mireford',
    rarity: 'rare',
    rewardSpec: 'rare recruit: a mid-career steward-soldier who joins the fort with administrative + martial tags',
    themeKeywords: ['veteran', 'oath-bound', 'haunted'],
    seedLeadBlurb: 'A drowned smuggler washed up at Greyford with a noble house\'s seal stitched into his cloak.',
    outcomes: [
      { outcome: 'clean-win', narration: 'The mercenaries took the contract cleanly. Marek noticed the seal stitching looked recent.' },
      { outcome: 'narrow-win', narration: 'The escort job went sideways at the gate; Tibalt took a deep cut to the thigh. They got through.' },
      { outcome: 'clean-win', narration: 'They held the hall through the third bell without losses; Roselle copied the ledger by candle.' },
      { outcome: 'narrow-win', narration: 'The night raid succeeded but the smuggler-captain Iselle slipped onto a barge before they could close the wharf.' },
    ],
  },
  {
    name: 'highholt-rare-unit-chain',
    region: 'Highholt',
    rarity: 'rare',
    rewardSpec: 'permanent unique trait on the anchor mercenary: "Reckoned With" — +1 to any roll involving a vow or a debt',
    themeKeywords: ['scribe', 'haunted', 'oath-bound'],
    anchorMerc: {
      name: 'Roselle Vance',
      backstory: 'Former monastery scribe. Ran when the abbot was hanged. Carries a small enamelled icon she never explains.',
      tagLabels: ['lettered', 'light-footed', 'haunted'],
    },
    outcomes: [
      { outcome: 'clean-win', narration: 'Roselle went alone, returned with a smudged transcript and a name nobody recognised.' },
      { outcome: 'partial-loss', narration: 'Roselle and Marek were caught in the scriptorium; they got out, but the icon was taken from her.' },
      { outcome: 'narrow-win', narration: 'They cornered the witness on the river-road; he talked, but not before he wounded Roselle in the shoulder.' },
    ],
  },
  {
    name: 'coldwater-legendary-mixed',
    region: 'Coldwater Coast',
    rarity: 'legendary',
    rewardSpec: 'regional prestige + a unique heavy infantry recruit ("Banner-Sworn") who joins permanently and confers +1 morale to all mercs in the same room',
    themeKeywords: ['noble', 'oath-bound', 'mythic'],
    seedLeadBlurb: 'A salt-blistered courier reached Saltgate at dusk with a writ bearing the Doge of Ardun\'s personal seal.',
    outcomes: [
      { outcome: 'clean-win', narration: 'The mercenaries took the contract; the courier died of his wounds two days later, but not before naming Iselle.' },
      { outcome: 'narrow-win', narration: 'The Saltgate skirmish cost them Tibalt — he held the breach until the second-bell crew arrived, then went down to a crossbow.' },
      { outcome: 'clean-win', narration: 'Marek talked the harbour-master out of a closure that would have cost them three days.' },
      { outcome: 'partial-loss', narration: 'The duel for the Banner went badly; their champion lost a hand but kept his footing. The Banner stayed undecided.' },
      { outcome: 'narrow-win', narration: 'They took the docks at dawn; the Tevin captain surrendered the seal but burned the ledger first.' },
    ],
  },
];

function nextOutcome(seed: Seed, idx: number): { outcome: PlayOutcome; narration: string } {
  if (idx < seed.outcomes.length) return seed.outcomes[idx];
  // If the AI keeps generating beats beyond our scripted outcomes, default to a clean-win.
  return { outcome: 'clean-win', narration: 'A quiet success — by the time it was done, even the dogs had stopped barking.' };
}

// ---------- pricing ----------

const PRICES: Record<string, [number, number]> = {
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4.1-nano': [0.1, 0.4],
  'gpt-4.1-mini': [0.4, 1.6],
  'gpt-4.1': [2.0, 8.0],
  'gpt-4o': [2.5, 10.0],
  'gpt-5-nano': [0.05, 0.4],
  'gpt-5-mini': [0.25, 2.0],
  'gpt-5': [1.25, 10.0],
};

// ---------- runner ----------

interface RunResult {
  seedName: string;
  bible: ChainBible;
  beats: BeatWithOutcome[];
  climax: BeatWithOutcome;
  epilogue: string;
  beatCount: number;
}

async function runOne(seed: Seed): Promise<RunResult> {
  console.log(`\n--- seed: ${seed.name} (${seed.rarity}, ${seed.region}) ---`);
  console.log(`reward: ${seed.rewardSpec}`);
  console.log(`generating bible…`);
  const bible = await generateChainBible({
    region: seed.region,
    rarity: seed.rarity,
    rewardSpec: seed.rewardSpec,
    themeKeywords: seed.themeKeywords,
    seedLeadBlurb: seed.seedLeadBlurb,
    anchorMerc: seed.anchorMerc,
  });
  console.log(`  bible title: "${bible.title}"`);

  // Beat bounds by rarity — keep tight; AI should climax earlier when story is ready.
  // The bounds are HARD safety rails, not targets. Beat prompt says so explicitly.
  const bounds = {
    common: { min: 2, hardCap: 3 },
    uncommon: { min: 2, hardCap: 4 },
    rare: { min: 3, hardCap: 5 },
    legendary: { min: 3, hardCap: 6 },
  }[seed.rarity];

  const beats: BeatWithOutcome[] = [];
  let climax: BeatWithOutcome | null = null;
  for (let i = 0; i < bounds.hardCap; i++) {
    const next = await generateNextBeat({
      bible,
      priorBeats: beats,
      minBeats: bounds.min,
      hardCap: bounds.hardCap,
    });
    const outcome = nextOutcome(seed, i);
    const withOutcome: BeatWithOutcome = {
      ...next,
      outcome: outcome.outcome,
      outcomeNarration: outcome.narration,
    };
    console.log(`  beat ${i + 1}${next.isClimax ? ' [CLIMAX]' : ''}: ${next.beatTitle}`);
    if (next.isClimax) {
      climax = withOutcome;
      break;
    }
    beats.push(withOutcome);
  }
  if (!climax) {
    // Defensive: model never set isClimax. Treat last beat as climax.
    climax = beats.pop()!;
    console.log(`  *** no climax signal received; promoting last beat to climax ***`);
  }
  console.log(`generating epilogue…`);
  const epilogue = await generateChainEpilogueFromBible({ bible, beats, climax });
  return { seedName: seed.name, bible, beats, climax, epilogue, beatCount: beats.length + 1 };
}

// ---------- render ----------

function renderPlayerView(r: RunResult): string {
  const lines: string[] = [];
  lines.push(`=========================================================`);
  lines.push(`  ${r.bible.title}`);
  lines.push(`  ${r.bible.region} · ${r.bible.rarity}`);
  lines.push(`=========================================================`);
  lines.push(``);
  lines.push(`-- lead board shows --`);
  // Player initially only sees beat 1 + surface situation
  lines.push(`  ${r.beats[0]?.publicHook ?? r.climax.publicHook}`);
  lines.push(``);
  r.beats.forEach((b, i) => {
    lines.push(`--- step ${i + 1}: ${b.beatTitle} ---`);
    lines.push(`  hook:    ${b.publicHook}`);
    lines.push(`  outcome (${b.outcome}): ${b.outcomeNarration}`);
    lines.push(``);
  });
  lines.push(`--- CLIMAX: ${r.climax.beatTitle} ---`);
  lines.push(`  hook:    ${r.climax.publicHook}`);
  lines.push(`  outcome (${r.climax.outcome}): ${r.climax.outcomeNarration}`);
  lines.push(``);
  lines.push(`-- EPILOGUE --`);
  lines.push(r.epilogue);
  lines.push(``);
  return lines.join('\n');
}

function renderEditorView(r: RunResult): string {
  const lines: string[] = [];
  lines.push(`=========================================================`);
  lines.push(`  EDITOR VIEW: ${r.bible.title}`);
  lines.push(`=========================================================`);
  lines.push(``);
  lines.push(`# BIBLE`);
  lines.push(`Title: ${r.bible.title}`);
  lines.push(`Region: ${r.bible.region}    Rarity: ${r.bible.rarity}`);
  lines.push(`Reward spec: ${r.bible.rewardSpec}`);
  lines.push(``);
  lines.push(`Cast:`);
  for (const c of r.bible.cast) {
    lines.push(`  - ${c.name} (${c.role})`);
    lines.push(`      surface: ${c.surface}`);
    lines.push(`      want:    ${c.want}`);
    lines.push(`      need:    ${c.need}`);
    lines.push(`      ghost:   ${c.ghost}`);
    lines.push(`      lie:     ${c.lie}`);
    lines.push(`      secret:  ${c.secret}`);
  }
  lines.push(``);
  lines.push(`Surface situation: ${r.bible.surfaceSituation}`);
  lines.push(`Hidden situation:  ${r.bible.hiddenSituation}`);
  lines.push(`Trajectory:        ${r.bible.trajectory}`);
  lines.push(`Dramatic irony:    ${r.bible.dramaticIrony}`);
  lines.push(``);
  lines.push(`Setup/payoff ledger:`);
  for (const sp of r.bible.setupPayoffs) {
    lines.push(`  PLANT  → ${sp.plant}`);
    lines.push(`  PAYOFF → ${sp.payoff}`);
  }
  lines.push(``);
  lines.push(`# BEATS`);
  const allBeats = [...r.beats, r.climax];
  allBeats.forEach((b, i) => {
    const isClimax = i === allBeats.length - 1;
    lines.push(`## Beat ${i + 1}${isClimax ? ' (CLIMAX)' : ''}: ${b.beatTitle}`);
    lines.push(`  public hook: ${b.publicHook}`);
    lines.push(`  brief:       ${b.beatBrief}`);
    lines.push(`  craft note:  ${b.craftNote}`);
    lines.push(`  reasoning:   ${b.reasoning}`);
    lines.push(`  outcome:     ${b.outcome} — ${b.outcomeNarration}`);
    lines.push(``);
  });
  lines.push(`# EPILOGUE`);
  lines.push(r.epilogue);
  lines.push(``);
  return lines.join('\n');
}

// ---------- main ----------

async function main() {
  console.log(`==== bible-experiment ${label} ====`);
  console.log(`bible model: ${bibleModel()}`);
  console.log(`beat model:  ${beatModel()}`);

  const results: RunResult[] = [];
  for (const seed of SEEDS) {
    try {
      results.push(await runOne(seed));
    } catch (e) {
      console.error(`  *** seed ${seed.name} failed: ${(e as Error).message}`);
    }
  }

  // Write player view (the one I read as a player)
  const playerOut = results.map(renderPlayerView).join('\n\n');
  const playerPath = `${outDir}/bible-${label}-player.txt`;
  writeFileSync(playerPath, playerOut);
  console.log(`\nwrote player view: ${playerPath}`);

  // Write editor view (the one I read as the showrunner)
  const editorOut = results.map(renderEditorView).join('\n\n');
  const editorPath = `${outDir}/bible-${label}-editor.txt`;
  writeFileSync(editorPath, editorOut);
  console.log(`wrote editor view: ${editorPath}`);

  // Write structured JSON
  const jsonPath = `${outDir}/bible-${label}.json`;
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`wrote structured  : ${jsonPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
