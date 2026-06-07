// GENESIS DESIGN EXPERIMENT: 2x2 — {straight vs apparent-goal+twist} × {why-ladders vs lean}.
// Same focal+themes+place+tone per row, all 4 variants, measure quality (read) + token cost.
import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
import { GameEngine } from './core/game.js';
import { generateCharacter } from './core/economy.js';
import { tagLabels } from './core/ai.js';
import { rngFrom } from './core/rng.js';
import { pickThemes, pickPlace, pickTone } from './core/seeds.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const client = new OpenAI({ apiKey: key });
const strip = (s: string) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');

const BASE =
  `You design a QUEST for a MERCENARY COMPANY (the player runs it) and the truth behind it. Given a CORE PERSON (their tags), a few THEMES, a SETTING, and a TONE.\n` +
  `Build a quest they have a clear REASON to take and a STAKE in: a HOOK (why a merc company takes it — pay / a person to save/escort/find / a threat to remove / the person asks them directly) and a GOAL (one clear thing to achieve). The core person's tags must be CENTRAL. FUSE the themes (a spark, not a checklist). Match the TONE — not every saga is grim. Clinical voice, state what IS. JSON only.\n`;

function variantSpec(twist: boolean, ladders: boolean) {
  const person = ladders
    ? `{ "name","who": one line known of them, "history": [a WHY-LADDER, ordered cause→cause→bedrock — 3-7 links], "want": plain human want, "role": client/companion/quarry/obstacle/ally/prize }`
    : `{ "name","who": ONE vivid line (who they are + the one thing that matters about them here), "want": plain human want, "role": client/companion/quarry/obstacle/ally/prize }`;
  const goalField = twist
    ? `"apparentGoal": what the JOB LOOKS LIKE on the board / what the client claims (the player commits to THIS),\n  "twist": <=20 words — how the truth DIFFERS from the apparent goal (the client lies / the quarry is the victim / the prize is a trap / the real job is worse or other). Set "none" for a straight job with no misdirection — make ~half straight.,\n  "realSituation": 2-4 sentences — what is ACTUALLY true (may match the apparent goal, or subvert it)`
    : `"goal": one clear thing the company is engaged to achieve,\n  "situation": 2-4 sentences — the honest truth behind the job`;
  const sys = BASE +
    (twist ? `APPARENT vs REAL: the job the player sees may be a MISDIRECTION. Give the apparent goal they commit to, then the real situation, then the twist between them. A good twist is fair (the truth was there to find) and changes what the right thing to do is. ~half the quests should be straight (twist:"none").\n` : ``) +
    (ladders ? `BUILD EACH KEY PERSON BY ASKING "WHY?" TO BEDROCK — each history bullet a prior cause, to something irreducible (a love, loss, vow, debt, shame). Ladder DEEP only the core person + 1 other; edge cast stay shallow.\n` : `Keep people LEAN: one vivid line each + a want. NO backstory ladders — just who they are and what they want now.\n`) +
    `Output JSON: { "title": concrete action-title, "leadBlurb": 1-2 sentences the player reads on the job board (a clear, inviting job), ${goalField.includes('apparentGoal') ? goalField.split(',\n')[0] : '"goal":...'},\n  ${goalField}, "people": [ ${person} ] }`;
  return sys;
}

const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'gx' });
const N = Number(process.argv[2] || 3);
const VARIANTS = [
  { id: 'A straight+ladders', twist: false, ladders: true },
  { id: 'B twist+ladders', twist: true, ladders: true },
  { id: 'C straight+lean', twist: false, ladders: false },
  { id: 'D twist+lean', twist: true, ladders: false },
];

async function gen(sys: string, user: string) {
  const res = await client.chat.completions.create({
    model: 'gpt-5-mini', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    response_format: { type: 'json_object' }, max_completion_tokens: 4000,
    reasoning_effort: 'low',
  } as any);
  return { text: res.choices[0]?.message?.content || '', out: res.usage?.completion_tokens ?? 0 };
}

for (let i = 0; i < N; i++) {
  const r = rngFrom(`gx-${i}`);
  const gc = generateCharacter(r, { targetValue: 90, level: 2, maxSkills: 2 });
  const tags = tagLabels(gc.tags);
  const themes = pickThemes(r), place = pickPlace(r), tone = pickTone(r);
  const user = `CORE PERSON tags: [${tags.join(', ')}]. Invent and NAME them.\nTHEMES (fuse): ${themes}\nSETTING: ${place}\nTONE: ${tone}\nBuild the quest. JSON only.`;
  console.log(`\n\n######### FOCAL ${i}  [${tags.join(', ')}]\n  themes: ${themes} · ${place} · ${tone.split('—')[0].trim()}`);
  const rows = await Promise.all(VARIANTS.map(v => gen(variantSpec(v.twist, v.ladders), user).then(g => ({ v, g }))));
  for (const { v, g } of rows) {
    let o: any = {}; try { o = JSON.parse(g.text); } catch { /* */ }
    console.log(`\n----- ${v.id}  (out=${g.out} tok) -----`);
    console.log(`  title:   ${strip(o.title)}`);
    console.log(`  blurb:   ${strip(o.leadBlurb)}`);
    console.log(`  ${v.twist ? 'apparent' : 'goal'}: ${strip(o.apparentGoal || o.goal)}`);
    if (v.twist) console.log(`  TWIST:   ${strip(o.twist)}`);
    console.log(`  real:    ${strip(o.realSituation || o.situation).slice(0, 220)}`);
    const ppl = (o.people || []).map((p: any) => `${p.name} (${p.role || '?'}, wants ${strip(p.want)})${p.history ? ` [${p.history.length}-link ladder]` : ''}`);
    console.log(`  people:  ${ppl.join(' | ')}`);
  }
}
