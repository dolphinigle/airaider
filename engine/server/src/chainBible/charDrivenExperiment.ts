// charDrivenExperiment — experiment harness to make chain bibles CHARACTER-DRIVEN.
//
// Hypothesis: the current bible centers the SITUATION (backstoryThreads = "why this
// situation exists"), so output is plot/conspiracy-driven. Character-driven stories
// center a PROTAGONIST'S internal arc (want vs need, the lie they believe, the wound)
// with the external situation as the crucible that cracks the lie.
//
// This harness A/Bs three approaches on the SAME anchors so we can READ the difference:
//   V0  baseline        — current BIBLE_SYSTEM, no hint
//   V1  hint-only        — current BIBLE_SYSTEM + a character-core hint (themeKeywords/readerFlavor)
//   V2  char-spine + hint — character-arc-centered prompt + the same hint
//
// Run: cd engine/server && npx tsx src/chainBible/charDrivenExperiment.ts [v0|v1|v2|all] [specIndex]

import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { CharacterPool } from './characterPool.js';
import { generateBible, BIBLE_SYSTEM, type BibleRequest, type Bible } from './biblePipeline.js';

loadDotenv({ path: join(homedir(), '.airaider', 'openai.env'), override: true });

const SEED_PATH = join(process.cwd(), 'data', 'seed_pool_mireford.json');
const TMP_POOL = '/tmp/airaider-chardriven-pool.json';
const TRANSCRIPT_PATH = '/tmp/airaider-chardriven-transcript.md';

// ----------------------------------------------------------------------------
// HINT DECK (prototype of the user's "1000+ handcrafted hints" idea).
// These are CHARACTER CORES, not plot MacGuffins. Each names an internal
// engine (want vs need, a lie, a wound) the bible should build a person around.
// ----------------------------------------------------------------------------
interface Hint { id: string; kind: string; seed: string; }
const HINT_DECK: Hint[] = [
  { id: 'grief-unsaid', kind: 'personal grief',
    seed: 'Center one person who lost someone before they could say a thing that mattered. They want proof of what happened; what they need is to forgive themselves for the last words they did say. Their lie: "if I find the truth, the guilt ends."' },
  { id: 'mercy-cowardice', kind: 'guilt / self-deception',
    seed: 'Center one person who did something they call mercy but was really cowardice (let a man drown, abandoned a post, looked away). They want the past to stay buried; what they need is to be seen and still kept. Their lie: "if anyone knew, no one would keep me."' },
  { id: 'faith-performed', kind: 'faith as performance',
    seed: 'Center a believer who stopped believing and performs faith to protect other people\'s hope. They want to keep the performance intact; what they need is permission to grieve their own lost god. Their lie: "my doubt would break the people who lean on me."' },
  { id: 'shared-dead-love', kind: 'rivalry over a dead love',
    seed: 'Center two people who both loved someone now dead and blame each other for the death. Each wants the other to admit fault; what they both need is to mourn together instead of alone. The lie: "if I forgive them, I betray the dead."' },
  { id: 'duty-over-child', kind: 'parent / duty',
    seed: 'Center a parent who once chose duty (or survival) over their child, and now the grown child stands in front of them not knowing who they are. They want to be useful without being known; what they need is to be claimed and to claim. Their lie: "they are better off never learning what I chose."' },
  { id: 'fallen-pride', kind: 'pride / shame of a fall',
    seed: 'Center someone once renowned (a captain, a healer, a craftsman) hiding how far they have fallen, faking competence they no longer have. They want respect back; what they need is to admit the fall and be helped. Their lie: "if they see I am diminished, I am nothing."' },
  { id: 'oath-vs-person', kind: 'loyalty test',
    seed: 'Center someone bound by an oath that now requires harming a specific person they have come to care for. They want to keep their honor intact; what they need is to learn an oath kept against a person is not honor. Their lie: "the oath is who I am; without it I am a traitor."' },
  { id: 'hunter-becomes-kin', kind: 'revenge to empathy',
    seed: 'Center a person hunting someone for a wrong, who slowly finds the hunted is more human, more wronged, than expected. They want the kill/justice they came for; what they need is to let the hatred go without it feeling like surrender. Their lie: "if I stop hating them, my own loss means nothing."' },
];

// ----------------------------------------------------------------------------
// V2 — character-arc-centered system prompt, derived from BIBLE_SYSTEM by
// transformation. We (a) prepend a CHARACTER IS THE SPINE principle, and
// (b) replace the backstoryThreads "THE HEART" framing so the heart is the
// protagonist's wound/lie arc, with situation backstory serving the person.
// ----------------------------------------------------------------------------
const CHAR_SPINE_PREAMBLE = `CHARACTER IS THE SPINE (READ FIRST — THIS OVERRIDES THE OLD "SITUATION IS THE HEART" FRAMING):

A chain is engaging because of a PERSON changing, not a mystery being solved. The plot (the body, the chit, the missing brother) is only the CRUCIBLE — the pressure that forces a person to confront something inside themselves.

Before anything else, pick ONE protagonist (for unit chains this is the anchor; for regional chains pick the cast member whose inner life this chain will track — it can be a merc, a victim, or even the antagonist). Build the chain around their internal engine:
  - WANT: the external thing they pursue (find the brother, clear their name, bury the ledger).
  - NEED: the internal truth they must reach (forgive themselves, be seen, let the dead rest). WANT and NEED must PULL AGAINST each other.
  - LIE: the false belief, rooted in a wound, that the chain will crack ("if I find the truth the guilt ends", "if they knew me they'd cast me out").
  - WOUND: the specific past event that planted the lie.
The chain's SPINE is: each movement squeezes the lie harder, until the climax forces the protagonist to either embrace the truth (they change) or cling to the lie (a tragic, earned fall). EITHER is good — but it must be a PERSON'S choice, not a clue being found.

The external mystery exists to serve this. If you could swap the protagonist for a stranger and the plot would run identically, you have written a procedural, not a story. SOLVE-THE-MYSTERY chains are SLOP; WATCH-A-PERSON-CRACK chains are the product.

CAST DISCIPLINE OVERRIDES "BIAS UP": when there is a clear protagonist (always, now), the protagonist's arc is the THROUGHLINE and every cast member must exist to PRESSURE THE PROTAGONIST'S LIE — as the person who knows their secret, who will be hurt if they choose wrong, who tempts them to keep lying, who mirrors the choice. Do NOT add cast to run a parallel conspiracy or political subplot that the protagonist merely observes. A chain about one person cracking is usually TIGHT (2-4) or CLASSIC (4-6), rarely ensemble. Prefer FEWER cast, each loaded against the protagonist's wound, over a wide political web. If a pool character does not touch the protagonist's lie, leave them out.

`;

const HEART_OLD = `- backstoryThreads: 3-7 TERSE bullets. THIS IS THE HEART OF THE BIBLE. Pick the ONE central WHY of this chain's situation/character and go DEEP — answer the why-chain ONE LINK AT A TIME until you reach something irreducible (a vow, a love, a loss, a debt). Each bullet is ONE link. Breadth-first ("everyone has a secret") is BAD; depth-first ("here is exactly why THIS situation exists") is GOOD. The bible exists so no asspulling happens — if a later quest reveals X about a character, X must already be in backstoryThreads or be a natural consequence of it.`;
const HEART_NEW = `- backstoryThreads: 3-7 TERSE bullets. These serve THE PROTAGONIST'S ARC (the spine). Go DEEP one link at a time, but the why-chain must terminate in the protagonist's WOUND — the irreducible loss/vow/debt that planted their LIE. At least the final 2-3 links must be about the protagonist (why they carry this wound, why they believe this lie). Earlier links may set up the external situation, but only insofar as it is the crucible that will squeeze that lie. Breadth-first ("everyone has a secret") is BAD; a wound-chain ending in the protagonist is GOOD. The bible exists so no asspulling happens — if a later quest reveals X, X must already be here or be a natural consequence.`;

const TRAJ_OLD = `Plot-only trajectories are SLOP. They pass schema and they bore.`;
const TRAJ_NEW = `Plot-only trajectories are SLOP. They pass schema and they bore. Each beat must move the PROTAGONIST'S INNER STATE, not just the plot: name (clinically) what the beat does to their lie — tempts it, confirms it, cracks it, or finally breaks it. The climax is the moment the lie is forced to the surface and the protagonist chooses truth or clings.`;

function buildV2System(): string {
  let s = BIBLE_SYSTEM;
  s = s.replace(HEART_OLD, HEART_NEW);
  s = s.replace(TRAJ_OLD, TRAJ_NEW);
  // Insert the spine preamble right after the opening paragraph block.
  const anchor = 'CRAFT REQUIREMENTS (compact, in JSON):';
  s = s.replace(anchor, CHAR_SPINE_PREAMBLE + anchor);
  return s;
}

// ----------------------------------------------------------------------------
// Specs — pick anchors with PERSONAL wounds so character-drive can show.
// ----------------------------------------------------------------------------
interface Spec { label: string; hintId: string; req: Omit<BibleRequest, 'pool'>; }
const SPECS: Spec[] = [
  {
    label: 'UNIT rare — Tibalt (vanished brother) — grief-unsaid',
    hintId: 'grief-unsaid',
    req: {
      region: 'Mireford', rarity: 'rare',
      rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_tibalt', traitName: 'Steady Bolt' },
      requiredAnchorId: 'char_tibalt', isUnitChain: true,
      seedLeadBlurb: 'A wagoner asks the fort if anyone ever found the courier who vanished on the Coldfen road three winters back.',
    },
  },
  {
    label: 'UNIT rare — Roselle (icon she will not name) — faith-performed',
    hintId: 'faith-performed',
    req: {
      region: 'Mireford', rarity: 'rare',
      rewardSpec: { kind: 'unique_trait_on_anchor', anchorId: 'char_roselle', traitName: 'Quiet Vigil' },
      requiredAnchorId: 'char_roselle', isUnitChain: true,
      seedLeadBlurb: 'A grieving family at Penholt begs for someone to recover a relic the abbey says was never theirs.',
    },
  },
  {
    label: 'REGIONAL rare — drowned man at Greyford — mercy-cowardice',
    hintId: 'mercy-cowardice',
    req: {
      region: 'Mireford', rarity: 'rare',
      rewardSpec: { kind: 'captive_to_dungeon' },
      seedLeadBlurb: 'A drowned man washed up at Greyford with a sealed letter sewn into his cloak.',
    },
  },
];

function pretty(b: Bible): string {
  const lines: string[] = [];
  lines.push(`title: "${b.title}"   shape: ${b.shape}`);
  lines.push(``, `leadBoardBlurb:`, `  ${b.leadBoardBlurb}`);
  lines.push(``, `firstBeatOnramp:`, `  ${b.firstBeatOnramp}`);
  lines.push(``, `cast (${b.cast.length}):`);
  for (const c of b.cast) {
    if (c.kind === 'existing') {
      lines.push(`  [existing ${c.roleInChain}] ${c.characterId} — arc: ${c.arcStateAfterChain}`);
    } else {
      lines.push(`  [new ${c.roleInChain}] ${c.character.name} (${c.character.tags.join(',')})`);
      lines.push(`    want:${c.character.want} | need:${c.character.need}`);
      lines.push(`    ghost:${c.character.ghost} | lie:${c.character.lie} | secret:${c.character.secret}`);
      lines.push(`    arc: ${c.arcStateAfterChain}`);
    }
  }
  lines.push(``, `surfaceSituation:`, `  ${b.surfaceSituation}`);
  lines.push(``, `hiddenSituation:`, `  ${b.hiddenSituation}`);
  lines.push(``, `backstoryThreads (${b.backstoryThreads.length}):`);
  for (const t of b.backstoryThreads) lines.push(`  - ${t}`);
  lines.push(``, `conflictingInterests (${b.conflictingInterests.length}):`);
  for (const c of b.conflictingInterests) lines.push(`  - ${c}`);
  lines.push(``, `trajectory (${b.trajectory.length}):`);
  for (const t of b.trajectory) lines.push(`  - ${t}`);
  lines.push(``, `setupPayoffs (${b.setupPayoffs.length}):`);
  for (const p of b.setupPayoffs) lines.push(`  plant:${p.plant} -> payoff:${p.payoff}`);
  lines.push(``, `vignettes:`);
  for (const v of b.vignettes) lines.push(`  - ${v}`);
  lines.push(``, `antagonistHumanity:`, `  ${b.antagonistHumanity}`);
  if (b.dramaticIrony) lines.push(``, `dramaticIrony:`, `  ${b.dramaticIrony}`);
  return lines.join('\n');
}

function applyHint(req: Omit<BibleRequest, 'pool'>, hint: Hint): Omit<BibleRequest, 'pool'> {
  return {
    ...req,
    themeKeywords: [hint.kind],
    readerFlavor: `CHARACTER CORE for this chain (build the protagonist around this): ${hint.seed}`,
  };
}

function setupPool(): CharacterPool {
  if (!existsSync(SEED_PATH)) throw new Error(`missing seed pool ${SEED_PATH}`);
  copyFileSync(SEED_PATH, TMP_POOL);
  const pool = new CharacterPool();
  pool.load(TMP_POOL);
  return pool;
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const pool = setupPool();
  const v2System = buildV2System();

  const which = (process.argv[2] ?? 'all').toLowerCase();
  const specIdx = process.argv[3] ? parseInt(process.argv[3], 10) : -1;
  const variants = which === 'all' ? ['v0', 'v1', 'v2'] : [which];
  const specs = specIdx >= 0 ? [SPECS[specIdx]] : SPECS;

  const out: string[] = ['# Character-driven bible experiment', ''];
  let totalCost = 0;

  for (const spec of specs) {
    const hint = HINT_DECK.find((h) => h.id === spec.hintId)!;
    out.push(`## ${spec.label}`, '', `**Hint (${hint.kind}):** ${hint.seed}`, '');
    for (const v of variants) {
      let req: Omit<BibleRequest, 'pool'>;
      let system: string | undefined;
      if (v === 'v0') { req = spec.req; system = undefined; }
      else if (v === 'v1') { req = applyHint(spec.req, hint); system = undefined; }
      else { req = applyHint(spec.req, hint); system = v2System; }

      console.log(`\n>>> [${v}] ${spec.label}`);
      out.push(`### ${v.toUpperCase()} ${v === 'v0' ? '(baseline, no hint)' : v === 'v1' ? '(hint only)' : '(char-spine prompt + hint)'}`, '');
      try {
        const t0 = Date.now();
        const { bible, usage } = await generateBible(client, { pool, ...req }, system);
        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`[gen] ${usage.model} ${dt}s $${usage.costUsd.toFixed(4)}`);
        const body = pretty(bible);
        out.push('```', body, '```', '');
        totalCost += usage.costUsd;
      } catch (e) {
        console.log(`[FAIL] ${(e as Error).message}`);
        out.push(`**FAILED:** ${(e as Error).message}`, '');
      }
    }
  }

  console.log(`\nTOTAL COST $${totalCost.toFixed(4)}`);
  writeFileSync(TRANSCRIPT_PATH, out.join('\n'));
  console.log(`Transcript: ${TRANSCRIPT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
