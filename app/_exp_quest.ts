// QUEST-GENERATOR experiment: does UNIFYING beat=arc-step (one numbering, arc drives content, drop the
// competing SCENE_KINDS / "vary" / beat-vs-step mismatch) make cleaner quests than the CURRENT layered
// instruction? Same bible per row, both variants, read the beat sequences.
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { generateCharacter } from './core/economy.js';
import { tagLabels, renderBible } from './core/ai.js';
import { rngFrom } from './core/rng.js';
import { pickThemes, pickPlace, pickTone } from './core/seeds.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'q' });

const MODES = ['a named cast member comes to the company in person', 'the company is already out in the field on the last thread and comes upon this', 'a rumor, a summons, or a sealed letter reaches the fort', 'an official, a rival, or a creditor comes to press the matter', 'a frightened bystander or a child brings urgent word'];
const TIMES = ['grey morning', 'high noon', 'a hot afternoon', 'dusk', 'after dark', 'in driving rain'];
const SCENE = ['get closer to a cast member and what they privately want', 'uncover one concrete piece of the buried truth', 'a danger forces the company to protect or extract someone', "two cast members' wants collide out in the open", 'a betrayal, a double-cross, or a hard choice surfaces'];

// CURRENT-style instruction (mirrors makeBeatQuest today: beat# + clamped arc-step + SCENE turn + vary)
function instrCurrent(k: number, n: number, arc: string[], focal: string, off: number) {
  const mode = k === 1 ? MODES[0] : MODES[1 + ((k - 2 + off) % (MODES.length - 1))];
  const time = TIMES[(k - 1) % TIMES.length];
  const opening = ` OPEN this beat as: ${mode}; set it around ${time} (woven into a sentence). Do NOT reuse the previous beat's opening.`;
  const step = (i: number) => `"${arc[Math.max(0, Math.min(i, n - 1))]}"`;
  if (k === 1) return `This is BEAT 1 — the OPENER, where the company is OFFERED this job. Realize the arc's FIRST step: ${step(0)}. Center on ${focal}; the "job" LINE is ONLY THIS FIRST STEP, do NOT complete the goal. closesChain:false.` + opening;
  if (k === n) return `This is the FINALE — the arc's LAST step: ${step(n - 1)}. The goal is finally ACHIEVED or RESOLVED here. closesChain:true.` + opening;
  const midK = Math.max(1, Math.min(k - 1, n >= 3 ? n - 2 : n - 1));
  const fn = SCENE[(k - 2 + off) % SCENE.length];
  return `This is BEAT ${k}. Realize roughly arc step ${midK + 1} of ${n}: ${step(midK)}. Take ONE concrete STEP forward — a DIFFERENT kind of task than every prior beat (vary the verb AND the focus). Aim at the dramatic turn "${fn}". The company must NOT complete the goal yet. keep it open (closesChain:false).` + opening;
}

// UNIFIED-style: the arc IS the beats, 1:1. one numbering ("step k of n"), the arc step drives content,
// the opener/finale are just step 1 / step n. No competing SCENE turn, no beat-vs-step mismatch.
function instrUnified(k: number, n: number, arc: string[], focal: string, off: number) {
  const mode = k === 1 ? MODES[0] : MODES[1 + ((k - 2 + off) % (MODES.length - 1))];
  const time = TIMES[(k - 1) % TIMES.length];
  const where = k === 1 ? `OPEN at the fort/where the job is offered` : `OPEN it as: ${mode}`;
  const role = k === 1
    ? `This OPENS the quest — the company is offered the job. Center on ${focal} as a real person; do NOT complete the goal, just begin it.`
    : k === n
      ? `This is the FINAL step — the goal is ACHIEVED or RESOLVED here; pay off whatever has surfaced. It must read as the peak.`
      : `This is a MIDDLE step — escalate toward the goal; the company does NOT complete it yet.`;
  return `STEP ${k} of ${n} of this quest. Write the quest beat that realizes THIS planned step, exactly:\n  → "${arc[k - 1] ?? arc[arc.length - 1]}"\n${role} Make it a clearly different scene from the earlier steps (new place/people/action). ${where}; set it around ${time}, woven into a sentence. closesChain:${k === n}.`;
}

async function playVariant(label: string, build: (k: number, n: number, arc: string[], f: string, o: number) => string, bible: string, arc: string[], focal: string, region: string, off: number) {
  const n = arc.length; let chainState = 'The saga is just beginning; the player knows nothing yet.';
  const out: string[] = [`\n----- ${label} -----`];
  for (let k = 1; k <= n; k++) {
    const beat: any = await eng.ai.chainBeat({ bible, chainState, region, slotCount: 2, beatConstraint: build(k, n, arc, focal, off), introduced: [] });
    out.push(`  ${k === n ? 'FIN' : 'b' + k}: ${strip(beat.job)}`);
    chainState += ` Step ${k}: the company set to "${strip(beat.job)}" and now knows: ${strip(beat.newLayerRevealed)}.`;
  }
  return out.join('\n');
}

const N = Number(process.argv[2] || 3);
for (let i = 0; i < N; i++) {
  const r = rngFrom(`q-${i}`);
  const gc = generateCharacter(r, { targetValue: 90, level: 3, maxSkills: 2 });
  const g: any = await eng.ai.genesis({ focalTags: [tagLabels(gc.tags)], region: 'the Ashmoor hills', rarity: 'rare', seed: pickThemes(r), place: pickPlace(r), tone: pickTone(r), twist: r() < 0.4, expectedBeats: 5 });
  const bible = renderBible(g); const arc = g.arc?.length ? g.arc : ['take the job', 'press deeper', 'a turn', 'close in', 'the reckoning'];
  const focal = g.cast?.[0]?.name ?? 'the focal';
  console.log(`\n\n######### QUEST ${i}: "${strip(g.title)}"  (arc ${arc.length} steps${g.twistReveal ? ', TWIST' : ''})`);
  console.log('GOAL: ' + strip(g.goal));
  console.log('ARC: ' + arc.map((s: string, j: number) => `${j + 1}.${strip(s).slice(0, 40)}`).join('  '));
  const off = Math.floor(r() * MODES.length);
  const [cur, uni] = await Promise.all([
    playVariant('A CURRENT (beat# + clamped arc-step + SCENE turn)', instrCurrent, bible, arc, focal, off),
    playVariant('B UNIFIED (step k=arc step, 1:1)', instrUnified, bible, arc, focal, off),
  ]);
  console.log(cur); console.log(uni);
}
