// FAILURE-HANDLING experiment: when a mid-quest beat FAILS, what should the next beat be? Same prior
// state (beat 1 success, beat 2 FAILED), then generate beat 3 four ways and read which plays best.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { generateCharacter } from './core/economy.js';
import { tagLabels, renderBible } from './core/ai.js';
import { rngFrom } from './core/rng.js';
import { pickThemes, pickPlace, pickTone } from './core/seeds.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'or' });

async function beat(bible: string, chainState: string, instr: string, region: string) {
  const b: any = await eng.ai.chainBeat({ bible, chainState, region, slotCount: 2, beatConstraint: instr, introduced: [] });
  return b;
}
const N = Number(process.argv[2] || 2);
for (let i = 0; i < N; i++) {
  const r = rngFrom(`or-${i}`);
  const gc = generateCharacter(r, { targetValue: 90, level: 3, maxSkills: 2 });
  const g: any = await eng.ai.genesis({ focalTags: [tagLabels(gc.tags)], region: 'the Ashmoor hills', rarity: 'rare', seed: pickThemes(r), place: pickPlace(r), tone: pickTone(r), twist: false, expectedBeats: 5 });
  const bible = renderBible(g); const arc = g.arc?.length >= 4 ? g.arc : ['take the job', 'press deeper', 'a hard step', 'close in', 'the reckoning'];
  const focal = g.cast?.[0]?.name ?? 'the focal';
  console.log(`\n\n######### "${strip(g.title)}"  GOAL: ${strip(g.goal)}`);
  console.log('ARC: ' + arc.map((s: string, j: number) => `${j + 1}. ${strip(s)}`).join('\n     '));

  // beat 1 (opener, success) + beat 2 (the HARD step, which we say FAILED)
  const b1 = await beat(bible, 'The saga is just beginning.', `STEP 1 of ${arc.length}. Realize: "${arc[0]}". The OPENER — the job is offered; the "job" line is ONLY this opening action, not the goal. closesChain:false.`, 'the Ashmoor hills');
  let cs = `Step 1: the company set to "${strip(b1.job)}" and now knows: ${strip(b1.newLayerRevealed)}.`;
  const b2 = await beat(bible, cs, `STEP 2 of ${arc.length}. Realize: "${arc[1]}". A middle step; the "job" line is this step's concrete action, not the goal. closesChain:false.`, 'the Ashmoor hills');
  cs += ` Step 2: the company set to "${strip(b2.job)}" but FAILED — they did NOT complete it; the people grow warier and the situation worsens.`;
  console.log(`\n  STEP 1 (ok): ${strip(b1.job)}`);
  console.log(`  STEP 2 (FAILED): ${strip(b2.job)}`);

  // now generate the NEXT beat 4 different ways from the SAME failed state
  const variants: Record<string, string> = {
    'A retry-same-step': `The previous step FAILED. STEP 2 of ${arc.length} AGAIN — RE-ATTEMPT the SAME step "${arc[1]}" under worse conditions (warier foes, less time). The "job" line is this step's action; do NOT pretend it succeeded. closesChain:false.`,
    'B consequence-branch': `The previous step FAILED. Do NOT retry it. Write the CONSEQUENCE as a NEW situation that pushes the story forward — the company is now worse off (captured / scattered / a rival seized the advantage / a betrayal surfaces). It need NOT match the planned next step; let the failure bend the path. The "job" line is the company's new concrete task. closesChain:false.`,
    'C cost-forward': `The previous step FAILED but the company scraped through at a COST. ADVANCE to STEP 3 "${arc[2]}", carrying a visible cost from that failure into this beat (a wound, a loss, a worse position, the goal harder). The "job" line is step 3's action. closesChain:false.`,
    'D setback-then-advance': `The previous step FAILED. This beat shows the FALLOUT of that failure (the company pays for it — a wound, a loss, a worse position) AND begins to regain footing toward the goal; next beat will resume the plan. The "job" line is the company's concrete task to recover. closesChain:false.`,
  };
  for (const [label, instr] of Object.entries(variants)) {
    const b: any = await beat(bible, cs, instr, 'the Ashmoor hills');
    console.log(`\n  --- ${label} ---`);
    console.log(`  situation: ${strip(b.situation).slice(0, 240)}`);
    console.log(`  job: ${strip(b.job)}`);
  }
}
