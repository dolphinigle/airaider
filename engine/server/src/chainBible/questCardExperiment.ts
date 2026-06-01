// questCardExperiment — generate the PLAYER-FACING quest-list blurb (the "card")
// from a bible. This is LITERARY tier, not clinical: its only job is to make the
// player WANT to take the quest, using ONLY surface-visible facts (never the
// hiddenSituation). Generates 3 variants so we can read which voice entices.
//
// Run: cd engine/server && AIRAIDER_BEAT_MODEL=gpt-5-mini AIRAIDER_BEAT_EFFORT=low \
//        npx tsx src/chainBible/questCardExperiment.ts [tibalt]

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';
import type { Bible } from './biblePipeline.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const BEAT_MODEL = process.env.AIRAIDER_BEAT_MODEL ?? 'gpt-5-mini';
const BEAT_EFFORT = (process.env.AIRAIDER_BEAT_EFFORT ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';

const CardSchema = z.object({
  title: z.string().min(3),        // short evocative quest name for the list
  hook: z.string().min(20),        // 2-4 sentences of enticing copy; surface facts only
  postedBy: z.string().min(3),     // who pinned this lead (in-world), e.g. "a wagoner, hands shaking"
  lure: z.string().min(4),         // the one-line promise of reward/answer that makes you click
});

const CARD_SYSTEM = `You write the QUEST CARD a player sees on a mercenary fort's lead board. This is the ONLY text shown before the player commits units — its single job is to make the player WANT to take this quest. Think of a good RPG quest hook or a Path-of-Exile-flavour bit of flavour text: a small human mystery, a stake, an itch.

INPUTS: the chain's SURFACE situation, the first onramp, the lead-board blurb, and the texture details. You may ONLY use surface-visible facts. You must NOT reveal or hint at the hiddenSituation, the protagonist's secret, the antagonist, or the reward mechanics — the player has not earned those yet.

WRITE TO ENTICE:
- Open on a concrete, sensory image or a person at the gate — not a summary.
- Pose a small mystery or unmet need that a merc could resolve. Leave a question hanging.
- Imply stakes or reward WITHOUT naming game mechanics (no "trait", no "prestige", no numbers).
- Make it feel like a door the player wants to open. Specific, grounded, grim, human.

VOICE: literary but lean. Mud-and-iron grimdark. Concrete nouns, no purple adjectives stacked. 2-4 sentences in the hook. NEVER mention the player, "you", units, or stats — it's an in-world notice.
BANNED TOKENS: weight, shadow, burden, ghosts, fate, destiny.

Output JSON: { title, hook, postedBy, lure }.`;

async function genCard(client: OpenAI, bible: Bible, variantNote: string) {
  const user = [
    `SURFACE SITUATION: ${bible.surfaceSituation}`,
    `FIRST ONRAMP: ${bible.firstBeatOnramp}`,
    `EXISTING (clinical) BLURB to improve on: ${bible.leadBoardBlurb}`,
    `TEXTURE (sensory details you may use): ${(bible.texture ?? []).join(' | ')}`,
    ``,
    variantNote,
    `Write the quest card. Output JSON only.`,
  ].join('\n');
  const res = await client.chat.completions.create({
    model: BEAT_MODEL,
    messages: [{ role: 'system', content: CARD_SYSTEM }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 1200,
    reasoning_effort: BEAT_EFFORT,
  } as never);
  const content = (res as { choices: { message: { content: string } }[] }).choices[0].message.content;
  return CardSchema.parse(JSON.parse(content));
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });

  const which = (process.argv[2] ?? 'tibalt').toLowerCase();
  const bible = JSON.parse(readFileSync(`/tmp/airaider-bible-${which}.json`, 'utf8')) as Bible;

  const variants = [
    'VARIANT A — terse and ominous: 2 sentences, let the silence do the work.',
    'VARIANT B — human and aching: lead with the person who posted it and what they have lost.',
    'VARIANT C — hook-forward intrigue: lead with the strange object and the question it raises.',
  ];
  console.log(`# QUEST CARD VARIANTS — ${which}\n`);
  console.log(`(clinical bible blurb, for contrast): "${bible.leadBoardBlurb}"\n`);
  for (const v of variants) {
    const card = await genCard(client, bible, v);
    console.log(`---`);
    console.log(`${v.split('—')[0].trim()}`);
    console.log(`⚜ ${card.title}`);
    console.log(`${card.hook}`);
    console.log(`— posted by ${card.postedBy}`);
    console.log(`(${card.lure})`);
    console.log(``);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
