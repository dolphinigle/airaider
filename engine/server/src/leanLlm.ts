// PROTO-GUI v0.5: leaner OpenAI scenario LLM tuned for playtest cost.
//
// Why a separate impl instead of reusing prototype/src/llm/openai.ts:
// - The prototype version dumps the entire ScenarioLLMRequest (raw merc
//   attribute numbers, slot ids, fatigueAtStart, bonded-id lists, etc.)
//   into the user message. Per playtest feedback those numeric fields
//   carry no narrative signal but burn tokens.
// - The prototype version also asks for one short contribution line per
//   merc PLUS a 2-3 sentence outcome. Per feedback, contribution lines
//   are noisy filler — a single richer outcome paragraph is better fuel.
//
// This impl:
// - Renders party + scenario as compact PROSE the model can read at a
//   glance (no JSON attribute soup).
// - Returns one richer outcomeNarrative (4-6 sentences) and zero
//   contribution lines (engine accepts an empty array — the GUI just
//   renders no per-merc bullets, which the operator prefers).
// - Same ScenarioLLM interface so it plugs into resolveScenario() with
//   no engine changes.

import OpenAI from 'openai';
import { z } from 'zod';
import type {
  ScenarioLLM,
  ScenarioLLMRequest,
  ScenarioLLMNarration,
} from '../../../prototype/src/llm/interface.js';

const NarrationSchema = z.object({
  outcomeNarrative: z.string(),
});

const SYSTEM_PROMPT = `You are the narration engine for a grimdark mercenary-fort game.
The ENGINE owns numbers and outcome; you own FLAVOR.

PLAYER PREFERENCES (apply to all prose):
- tone: grimdark — pragmatic, mortal, mud-and-blood, no glory
- writing style: terse — short sentences, concrete nouns, zero purple prose
- NPC gender: balanced
- cultural register: pan-european (Germanic + Celtic + Slavic feel)

Rules:
- The outcome band is GIVEN (catastrophic / unfavorable / favorable / catastrophic-favorable). You narrate WHY it happened in-fiction.
- Do NOT invent stats, dice rolls, new mechanics, or new characters who weren't in the party or the lead's blurb.
- Use each merc's NAME at least once. Lean on their TAGS (cautious, light-footed, etc.) and standout TRAITS (high INT, low STR) for colour — these are the only "stats" you may reference, and only by feel, never by number.
- If a merc has a backstory, you may anchor ONE small concrete detail from it (an object, a place, a habit). Never summarise the backstory verbatim.

CONCRETENESS (this is non-negotiable):
- The LEAD HOOK below tells you WHAT the job actually is. Use it. Name the specific thing won, lost, or carried back.
- BANNED PHRASES: "the prize", "the goods", "their reward", "the target", "the mark", "what they came for", "the spoils", "the relic", "the treasure" — these are placeholders. Replace them with the SPECIFIC thing from the lead hook (a name, an object, a corpse, a sum, a vow, an heirloom, a letter, a child, etc.). If the blurb says "the abbey's reliquary", you say "the bone-locked St. Hadric reliquary" or just "the reliquary", NOT "the prize".
- Include at least ONE sensory detail per outcome: a smell, a sound, a weight, a temperature, an injury, a small object. No abstractions.
- Include at least ONE proper noun beyond the merc names: a place, a person mentioned in the blurb, an object, a faction.

PERIOD (low-medieval, grimdark):
- NO anachronisms. NO sirens, alarms, electricity, firearms, modern phrasing ("sirens blared", "the system kicked in"). Use bells, hue-and-cry, watch-horns, torches, lanterns.
- NO fantasy clichés ("destiny", "the chosen one", "ancient prophecy") unless the lead blurb explicitly invites it.
- Outcomes for UNFAVORABLE or CATASTROPHIC bands should feel actually bad — a wound that will fester, a name burned, a guild now hostile, a body left behind. Don't soften an unfavorable result into "they escaped fine, mostly".

LENGTH: 4-6 sentences, single paragraph. Show the moment, then the consequence.
Output must be valid JSON: { "outcomeNarrative": "..." }`;

function attrDescriptor(value: number): string | null {
  // Attribute scale is 0-5 (5 = peerless). Only surface the extremes —
  // mid-range values carry no narrative signal.
  if (value >= 5) return 'peerless';
  if (value >= 4) return 'high';
  if (value <= 1) return 'low';
  return null;
}

function mercLine(p: ScenarioLLMRequest['party'][number]): string {
  const { merc, tier, fatigueAtStart, recentlyLostBondPartner } = p;
  const parts: string[] = [merc.name];
  const standoutAttrs = (Object.entries(merc.attrs) as Array<[string, number]>)
    .map(([k, v]) => {
      const d = attrDescriptor(v);
      return d ? `${d} ${k.toUpperCase()}` : null;
    })
    .filter((s): s is string => !!s);
  if (standoutAttrs.length > 0) parts.push(standoutAttrs.join(', '));
  // Flat tag list — gender, traits, veterancy all together. Cheapest +
  // easiest format for the model to read.
  const flatTags: string[] = merc.tags.map((t) => t.label);
  if (tier && tier !== 'rookie') flatTags.push(tier);
  if (flatTags.length > 0) parts.push(flatTags.join(', '));
  if (fatigueAtStart && fatigueAtStart >= 2) parts.push(`worn (fatigue)`);
  if (recentlyLostBondPartner) parts.push(`grieving ${recentlyLostBondPartner}`);
  let line = parts.join('. ');
  if (merc.backstory) line += `\n  backstory: ${merc.backstory}`;
  return `- ${line}`;
}

function bandFlavor(band: ScenarioLLMRequest['band']): string {
  switch (band) {
    case 'catastrophic-favorable': return 'a triumph past hope (more than they came for)';
    case 'favorable': return 'a clean win';
    case 'unfavorable': return 'they got SOME of what they came for, but at a cost';
    case 'catastrophic': return 'a disaster — the job is lost';
  }
}

export interface LeanOpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  callLimit?: number;
}

export class LeanOpenAIScenarioLLM implements ScenarioLLM {
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private callLimit: number;
  private callCount = 0;

  constructor(cfg: LeanOpenAIConfig) {
    if (!cfg.apiKey) throw new Error('LeanOpenAIScenarioLLM requires apiKey');
    this.client = new OpenAI({ apiKey: cfg.apiKey });
    this.model = cfg.model ?? 'gpt-4.1-nano';
    this.maxTokens = cfg.maxTokens ?? 500;
    this.temperature = cfg.temperature ?? 0.8;
    this.callLimit = cfg.callLimit ?? 50;
    this.name = `lean-openai:${this.model}`;
  }

  async narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration> {
    if (this.callCount >= this.callLimit) {
      throw new Error(`LeanOpenAIScenarioLLM call-limit ${this.callLimit} reached`);
    }
    this.callCount++;

    const partyBlock = req.party.map(mercLine).join('\n');
    const seasonLine = req.season ? `Season: ${req.season}.\n` : '';
    const approachLine = req.approach ? `Approach chosen: ${req.approach.label} — ${req.approach.summary}.\n` : '';
    const factionLine = req.factionContext && req.factionContext.length > 0
      ? `Factions: ${req.factionContext.map((f) => `${f.factionId}${f.standingTier ? ` (${f.standingTier})` : ''}`).join(', ')}.\n`
      : '';
    const synergyLine = req.synergy && req.synergy.pairs.length > 0
      ? `Bonded pairs in party: ${req.synergy.pairs.map((p) => `${p.mercA}+${p.mercB}`).join(', ')}.\n`
      : '';
    const leadHookLine = req.leadHook
      ? `LEAD HOOK — the actual job, in the patron's words:\n  "${req.leadHook.blurb}" (${req.leadHook.archetype} job near ${req.leadHook.region}, ${req.leadHook.rarity})\nYou MUST name the specific thing/person/place from this blurb in the outcome. Don't say "the prize" — say what it actually is.\n\n`
      : '';

    const userPrompt = `Job: "${req.scenarioTitle}" — ${req.scenarioTarget}.
${seasonLine}${approachLine}${factionLine}${synergyLine}${leadHookLine}Party:
${partyBlock}

Outcome (ENGINE-DECIDED, you must narrate consistent with this):
- band: ${req.band} (${bandFlavor(req.band)})
- why: ${req.bandReason}

Narrate the moment. 4-6 sentences. Name the specific stakes from the lead hook. Return JSON: { "outcomeNarrative": "..." }`;

    if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
      console.log(`[lean-llm:prompt] system:\n${SYSTEM_PROMPT}`);
      console.log(`[lean-llm:prompt] user:\n${userPrompt}`);
    }

    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lean_scenario_narration',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { outcomeNarrative: { type: 'string' } },
            required: ['outcomeNarrative'],
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned no content');
    let parsed: unknown;
    try { parsed = JSON.parse(content); }
    catch (err) { throw new Error(`OpenAI returned non-JSON: ${(err as Error).message}\n${content}`); }
    const { outcomeNarrative } = NarrationSchema.parse(parsed);
    return { contributions: [], outcomeNarrative };
  }
}

// ---------------------------------------------------------------------------
// Stage E: AI-flavored captive spawn.
//
// Engine decides notoriety + tags. AI decides name + archetype + backstory,
// keeping it consistent with the lead's blurb so a "deserter in the marsh"
// produces a captive that reads as a deserter, not a Star-Crowned dragon-slayer.
// ---------------------------------------------------------------------------

const CAPTIVE_FLAVOR_SYSTEM = `You are the flavor engine for a grimdark mercenary-fort game.
The ENGINE has just rolled a captive's notoriety and tags. You return a name + archetype + 1-2 sentence backstory that makes that captive feel like a believable consequence of the LEAD the player pursued.

PLAYER PREFERENCES (apply to all flavor):
- tone: grimdark
- writing: terse
- NPC gender: balanced
- cultural register: pan-european

Rules:
- Archetype must follow the lead's blurb. "deserter in the marsh" → archetype 'deserter'. "guildsman's courier" → 'courier'. "witness needed alive" → 'witness'. NEVER invent a 'Lost Heir' if the blurb says 'deserter'.
- Name: 1 first name, optional 1 epithet/clan ("Marek of the Fen"). Match cultural register.
- Backstory: 1-2 sentences. Mention how the tags shaped them ("the bog still on him; flinches at lanterns"). No grand destiny. No magic unless tags say so.
- Return STRICT JSON: { "name": "...", "archetype": "...", "backstory": "..." }.`;

const CaptiveFlavorSchema = z.object({
  name: z.string().min(1),
  archetype: z.string().min(1),
  backstory: z.string().min(1),
});

export interface CaptiveFlavorInput {
  leadBlurb: string;
  leadArchetype: string;
  leadRegion: string;
  leadRarity: string;
  notoriety: number;
  tagLabels: readonly string[];
}

export interface CaptiveFlavorOutput {
  name: string;
  archetype: string;
  backstory: string;
}

export async function flavorCaptive(
  apiKey: string,
  model: string,
  input: CaptiveFlavorInput,
): Promise<CaptiveFlavorOutput> {
  const client = new OpenAI({ apiKey });
  const userPrompt = `Lead pursued: "${input.leadBlurb}"
Lead archetype: ${input.leadArchetype}  region: ${input.leadRegion}  rarity: ${input.leadRarity}
Captive (engine-decided): notoriety ${input.notoriety}, tags [${input.tagLabels.join(', ')}]

Return JSON: { "name": "...", "archetype": "...", "backstory": "..." }`;

  if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
    console.log(`[lean-llm:captive-flavor] user:\n${userPrompt}`);
  }

  const resp = await client.chat.completions.create({
    model,
    max_tokens: 300,
    temperature: 0.9,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'captive_flavor',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            archetype: { type: 'string' },
            backstory: { type: 'string' },
          },
          required: ['name', 'archetype', 'backstory'],
        },
      },
    },
    messages: [
      { role: 'system', content: CAPTIVE_FLAVOR_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });
  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no content for captive flavor');
  const parsed = CaptiveFlavorSchema.parse(JSON.parse(content));
  if (process.env.AIRAIDER_LLM_VERBOSE !== '0') {
    console.log(`[lean-llm:captive-flavor] ← ${parsed.name} (${parsed.archetype}): ${parsed.backstory}`);
  }
  return parsed;
}
