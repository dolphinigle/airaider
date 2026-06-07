// RESOLUTION-WRITING experiment. One fixed mid-saga beat, resolved many ways, to settle two questions
// the user raised: (A) STYLE — narration vs dialogue vs combination (+ show-don't-tell, clear outcome);
// (B) CONTEXT — minimal vs story-so-far+truth-direction vs full-bible-on-a-cheaper-model. Real AI; prints
// each variant's beforeRoll/afterRoll + word counts + cached/in/out tokens, so we READ and tabulate.
import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const client = new OpenAI({ apiKey: key });
const wc = (s: string) => (s || '').trim().split(/\s+/).filter(Boolean).length;

// ---- the fixed scenario (a mid-saga beat, SUCCESS) --------------------------
const BIBLE = `TITLE: The Drowned Bell of Vant
GOAL: recover the Vant family's sunken church-bell from the flooded crypt and return it to old Hedda before the bishop's men melt it for coin.
SITUATION (hidden truth): the bell was sunk on purpose — Hedda's late son Toller drowned it (and himself) to hide a false relic he had cast into it; the bishop's agent Movar knows, and wants it melted to bury the fraud.
CAST:
- Hedda (grieving mother, the petitioner) — wants the bell back, believes her son a saint.
- Movar (the bishop's agent) — wants the bell melted before the forgery is found.
- Toller (Hedda's drowned son) — the forger; dead.`;
const STORY_SO_FAR = `Beat 1: the company met Hedda at the fort and agreed to recover the bell; learned it lies in the flooded crypt under the old church. Beat 2: at the crypt they found Movar's men draining it with a hand-pump, drove them off, but Movar slipped away with a ledger.`;
const SITUATION = `Waist-deep in the flooded crypt, the company reaches the bell at last — but a rusted chain binds it to a sunken slab, and the water climbs as Movar's men work the sluice somewhere above.`;
const JOB = `Free the bell from the chained slab and haul it up before the crypt floods.`;
const PARTY = `Marek of Saltreach [soldier, master of weapons, brave]\nSigrun Edda [hunter, stealthy, clever]`;
const REVEAL = `scratched inside the bell's lip: Toller's mark — proof the relic was his forgery, not a saint's.`;
const WORDS = '70-100';

// ---- prompt pieces ----------------------------------------------------------
const OUT_FORMAT = `Output JSON only: { "beforeRoll": "30-45 words: the buildup, ending ON THE BRINK the instant before the dice decide — do NOT state the result", "afterRoll": "${WORDS} words: the consequence, OUTCOME = SUCCESS" }`;
const BASE = `You narrate the RESULT of a mercenary job the company already took, in a grimdark, low-medieval world.`;

const STYLE_NONE = '';   // baseline: no writing guidance (the current state)
const STYLE_SHARED =
  `\nWRITING (fiction a player reads):\n` +
  `- SHOW, DON'T LABEL. NEVER filter through a faculty or adverb-label ("his scholar's eye found", "she said angrily", "with a soldier's instinct"). Show the ACT or the LINE itself — if someone is angry, give the words ("How dare you.").\n` +
  `- BE CLEAR ABOUT THE RESULT: the reader must finish knowing EXACTLY what the company achieved or failed to achieve, and what they now hold or know — never leave it vague or mood-only.\n` +
  `- Concrete and sensory but plain; no purple abstractions (weight / shadow / fate).`;
const MODE_COMBO = `\n- Mix tight action with DIALOGUE: where a named person is present, let them SPEAK — a spoken line carries character and fact better than description.`;
const MODE_NARRATION = `\n- Tell it in tight third-person action; use dialogue only sparingly.`;
const MODE_DIALOGUE = `\n- Carry the scene mostly through what people SAY to each other, with minimal narration between the lines.`;

const CTX_MIN = `\n\nJOB CARD:\nsituation: ${SITUATION}\njob: ${JOB}\nPARTY:\n${PARTY}\nOUTCOME: SUCCESS\nON SUCCESS the company comes away knowing: ${REVEAL}`;
const CTX_DIRECTION = `\n\nSTORY SO FAR: ${STORY_SO_FAR}` + CTX_MIN;
const CTX_BIBLE = `\n\nHIDDEN BIBLE (context to ground the prose — do NOT dump it; the player never sees it):\n${BIBLE}\n\nSTORY SO FAR: ${STORY_SO_FAR}` + CTX_MIN;

const VARIANTS: Array<{ label: string; system: string; user: string; model: string }> = [
  { label: 'V0 baseline (no style, minimal ctx)', system: BASE + '\n' + OUT_FORMAT, user: CTX_MIN, model: 'gpt-5-mini' },
  { label: 'V1 STYLE combo + minimal ctx', system: BASE + STYLE_SHARED + MODE_COMBO + '\n' + OUT_FORMAT, user: CTX_MIN, model: 'gpt-5-mini' },
  { label: 'V2 STYLE narration + minimal ctx', system: BASE + STYLE_SHARED + MODE_NARRATION + '\n' + OUT_FORMAT, user: CTX_MIN, model: 'gpt-5-mini' },
  { label: 'V3 STYLE dialogue + minimal ctx', system: BASE + STYLE_SHARED + MODE_DIALOGUE + '\n' + OUT_FORMAT, user: CTX_MIN, model: 'gpt-5-mini' },
  { label: 'V4 STYLE combo + story+direction', system: BASE + STYLE_SHARED + MODE_COMBO + '\n' + OUT_FORMAT, user: CTX_DIRECTION, model: 'gpt-5-mini' },
  { label: 'V5 STYLE combo + BIBLE on NANO', system: BASE + STYLE_SHARED + MODE_COMBO + '\n' + OUT_FORMAT, user: CTX_BIBLE, model: 'gpt-5-nano' },
  { label: 'V6 STYLE combo + BIBLE on mini', system: BASE + STYLE_SHARED + MODE_COMBO + '\n' + OUT_FORMAT, user: CTX_BIBLE, model: 'gpt-5-mini' },
];

for (const v of VARIANTS) {
  try {
    const res = await client.chat.completions.create({
      model: v.model, messages: [{ role: 'system', content: v.system }, { role: 'user', content: v.user }],
      response_format: { type: 'json_object' }, max_completion_tokens: 1200,
      ...({ reasoning_effort: 'low' } as Record<string, unknown>),
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
    const j = JSON.parse(res.choices[0]?.message?.content ?? '{}');
    const u = res.usage as any;
    console.log(`\n##### ${v.label}  [${v.model}]  in=${u?.prompt_tokens} cached=${u?.prompt_tokens_details?.cached_tokens ?? 0} out=${u?.completion_tokens}`);
    console.log(`  BEFORE (${wc(j.beforeRoll)}w): ${j.beforeRoll}`);
    console.log(`  AFTER  (${wc(j.afterRoll)}w): ${j.afterRoll}`);
  } catch (e) { console.log(`\n##### ${v.label} — ERROR ${String(e).slice(0, 120)}`); }
}
