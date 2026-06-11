// Quest + chain pipeline (docs/QUESTS.md). The spine: pursue a lead → engine sets
// N/V and rolls the reward → AI writes card+ask (or chain beat) → assign → resolve
// (roll → outcome) → deliver (full / half+liability / none+punishment). Chains build
// a story around a focal character generated at genesis; the finale roll decides its fate.
//
// Engine owns every number; the Narrator only writes fiction. Kept in one module
// because one-off, chain-beat, and finale share buildQuest/assign/resolve/deliver.

import type {
  GameState, Lead, Quest, QuestSlot, Chain, CharacterCard, Outcome, RewardBundle, ApproachGroup,
} from './types.js';
import type { Rng } from './rng.js';
import { rngFrom, randInt, pick } from './rng.js';
import type { Narrator } from './ai.js';
import { tagLabels, renderBible } from './ai.js';
import {
  BALANCE, thresholdFor, resolveRoll, estimateOdds, attrsAtLevel,
  generateCharacter, type RollTest,
} from './economy.js';
import { generateReward } from './reward.js';
import { pickThemes, pickPlace, pickTone, pickNameSeeds, pickArrival, pickProp, pickPressure, pickClient } from './seeds.js';
import { characterFromGen, liabilityCard, type MkId } from './cards.js';
import { tagDef } from './tags.js';
import { uid, addCard, logLine, allMercs, captives } from './state.js';
import { slotCountFor, queueMainChain, LEAD_TTL } from './leads.js';
import { captiveCapacity, levelCap } from './fort.js';

const mk = (state: GameState): MkId => (p: string) => uid(state, p);

// ---- value ------------------------------------------------------------------
function questValue(level: number, rarity: Quest['rarity'], n: number): number {
  return Math.round(BALANCE.vBase(level) * BALANCE.rarityMult[rarity] * n);
}
// resolution word budget — scales with STAKES (position × rarity), so a legendary finale reads weighty
// and a common one-off stays tight (BALANCE.resWords, calibrated by reading _exp_reslength.ts).
function resolutionWords(quest: Quest): { before: string; after: string; finale: boolean } {
  const pos: 'oneoff' | 'beat' | 'finale' = quest.finale ? 'finale' : quest.chainId ? 'beat' : 'oneoff';
  const [b0, b1, a0, a1] = BALANCE.resWords[pos][quest.rarity] ?? BALANCE.resWords[pos].common;
  return { before: `${b0}-${b1}`, after: `${a0}-${a1}`, finale: !!quest.finale };
}
function isRisky(lead: Lead): boolean {
  return lead.rarity === 'rare' || lead.rarity === 'legendary' || lead.archetype === 'raid' || lead.archetype === 'capture';
}

// ---- building a quest from an AI ask ----------------------------------------
interface AskShape {
  attribute: RollTest['attribute'];
  favoredTags: string[];
  slots: Array<{ kind: 'open' } | { kind: 'must-have'; tag: string }>;
}
/** Opposites of favored personality/physical tags bite the roll. */
function clashingFor(favored: string[]): string[] {
  const out: string[] = [];
  for (const id of favored) { const opp = tagDef(id)?.opposite; if (opp) out.push(opp); }
  return out;
}
function buildSlots(ask: AskShape, n: number, ownedTags: Set<string>): QuestSlot[] {
  const clashing = clashingFor(ask.favoredTags);
  const slots: QuestSlot[] = [];
  let mustHaves = 0;
  for (let i = 0; i < n; i++) {
    const req = ask.slots[i] ?? { kind: 'open' as const };
    // keep a must-have only if (a) some merc can satisfy it AND (b) we haven't already used one
    // (≥2 hard requirements routinely make a quest unfillable — the AI over-requires). The fit
    // bonus still rewards bringing the right merc to an "open" slot.
    const keep = req.kind === 'must-have' && ownedTags.has(req.tag) && mustHaves < 1;
    if (keep) mustHaves++;
    slots.push({
      index: i,
      requirement: keep ? { kind: 'must-have', tag: (req as { tag: string }).tag } : { kind: 'open' },
      tested: { attribute: ask.attribute, favored: ask.favoredTags, clashing },
    });
  }
  return slots;
}
function ownedMercTags(state: GameState): Set<string> {
  const s = new Set<string>();
  for (const m of allMercs(state)) for (const t of m.tags) s.add(t.id);
  return s;
}
// recent sagas fed to genesis so each new bible is steered AWAY from repeats — title PLUS a short
// premise snippet (titles alone don't stop the model re-using the same PLOT, e.g. wolf-woman-killed-
// a-man, even under different titles). Pull the hidden SITUATION line out of the rendered bible.
function recentTitles(state: GameState): string[] {
  return Object.values(state.chains).slice(-4).map((c) => {
    const m = /SITUATION \(hidden truth\):\s*([^\n]+)/.exec(c.bible || '');
    const premise = m ? m[1].trim().split(/(?<=[.!?])\s/).slice(0, 2).join(' ').slice(0, 200) : '';
    return premise ? `${c.title} — ${premise}` : c.title;
  }).filter(Boolean);
}
// the bible's cast names (from rendered "- Name (who): ..." lines) — used to track who the player has
// already met so beats orient a name only on first appearance.
function bibleCastNames(bible: string): string[] {
  return [...bible.matchAll(/^- ([^(]+?)\s*\(/gm)].map((m) => m[1].trim()).filter((n) => n.length > 1);
}
// THEME-KEYWORD spark handed to genesis alongside the focal (experiment-validated > a concrete premise:
// keywords make the focal's own tags central and read far less "canned"). Deriving the story purely from
// the person's tags converges on one shape; a few raw themes decorrelate it and the AI fuses them.
function pickKernel(_state: GameState, r: Rng): string {
  return pickThemes(r);
}
// engine ROLLS how many arc steps (incl. the finale) may branch — scales with rarity, with variety
// (some chains are fully linear). The bible proposes WHICH steps within this cap (PROMPT_RULES §3).
function rollChoiceBudget(r: Rng, rarity: Quest['rarity']): number {
  const range = ({ common: [0, 1], uncommon: [1, 2], rare: [1, 2], legendary: [2, 3] } as Record<string, [number, number]>)[rarity] ?? [1, 1];
  return randInt(r, range[0], range[1]);
}
// names used in recent sagas (focal + cast) — handed to genesis as AVOID so names don't converge.
function recentNames(state: GameState): string[] {
  const out = new Set<string>();
  // roster first: a NEW character must never echo a company merc's name (read showed a buyer
  // "Aldric Voss" sharing scenes with roster merc "Aldric the Patient" — ambiguous prose)
  for (const c of Object.values(state.cards))
    if (c.class === 'character' && (c as CharacterCard).role === 'merc') out.add(c.name.split(' ')[0]);
  for (const c of Object.values(state.chains).slice(-3)) {
    const focal = state.cards[c.focalCardIds[0]] as CharacterCard | undefined;
    if (focal?.name && focal.name !== 'Unknown') out.add(focal.name.split(' ')[0]);
    for (const n of bibleCastNames(c.bible || '')) out.add(n.split(' ')[0]);
  }
  return [...out].slice(0, 16);
}
// places used by recent sagas — avoid-window so same-session chains don't share a landmark.
function recentPlaces(state: GameState): string[] {
  return Object.values(state.chains).slice(-4).map((c) => c.place ?? '').filter(Boolean);
}
// a few existing world characters genesis MAY weave in as SECONDARY cast (recurrence = attachment,
// QUEST_BIBLE.md §4 "reuse the pool first"). Never the focal; a small sample so the model can choose.
function gatherPoolCast(state: GameState, r: Rng, focalId: string): Array<{ name: string; who: string; tags: string[] }> {
  const pool = [...allMercs(state), ...captives(state)]
    .filter((c) => c.id !== focalId && c.name && c.name !== 'Unknown' && c.who);
  // shuffle by seeded sort, take up to 3 (the prompt casts at most one or two, and only where they fit)
  const shuffled = pool.map((c) => ({ c, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.c).slice(0, 3);
  // mark company mercs so the bible can't cast them as client/payer/quarry (they work FOR the player)
  return shuffled.map((c) => ({ name: c.name, who: `${c.role === 'merc' ? 'COMPANY MERCENARY — ' : ''}${c.who ?? ''}`, tags: tagLabels(c.tags).slice(0, 5) }));
}
// theme-defining tags of recent (non-personal) focals — excluded from the next focal so the
// ARCHETYPE varies. Skills alone weren't enough: reading showed every focal coming out a
// "beautiful, scarred, notorious wolf-witch" because those physical/notoriety tags (not just
// skills) seed the same story. Exclude skill + physical + notoriety across the recent window so
// consecutive sagas don't all center the same kind of person. (Race/gender are identity-floor,
// added separately, so they're left alone.)
function recentFocalSkills(state: GameState): string[] {
  const out = new Set<string>();
  for (const c of Object.values(state.chains).slice(-3)) {
    if (c.personal) continue;
    const focal = state.cards[c.focalCardIds[0]] as CharacterCard | undefined;
    if (focal) for (const t of focal.tags) {
      if (t.id.startsWith('skill:') || t.id.startsWith('phys:') || t.id.startsWith('noto:')) out.add(t.id);
    }
  }
  return [...out];
}

// ---- pursue (dispatch) ------------------------------------------------------
export async function pursueLead(state: GameState, ai: Narrator, lead: Lead): Promise<Quest> {
  const r = rngFrom(`${state.seed}:pursue:${lead.id}`);
  state.leads = state.leads.filter((l) => l.id !== lead.id);
  if (lead.chain.kind === 'starts-new') return genesisChainAndBeat(state, ai, r, lead);
  if (lead.chain.kind === 'continues') return continueChain(state, ai, r, lead, lead.chain.chainId);
  if (lead.chain.kind === 'personal') return genesisPersonalChain(state, ai, r, lead, lead.chain.mercId);
  return pursueOneOff(state, ai, r, lead);
}

// the engine-readable reward KIND of a bundle (for telling the AI what the engine already rolled).
function offerKindOf(reward: RewardBundle): 'gold' | 'captive' | 'recruit' {
  return reward.kindHint === 'recruit' ? 'recruit' : reward.kindHint === 'captive' ? 'captive' : 'gold';
}
async function pursueOneOff(state: GameState, ai: Narrator, r: Rng, lead: Lead): Promise<Quest> {
  const n = slotCountFor(lead, r);
  const V = questValue(lead.level, lead.rarity, n);
  // REWARD-FIRST (ECONOMY/QUESTS): the engine rolls the reward, THEN the AI writes the job + a player-facing
  // label around it — the AI dresses the reward, it doesn't pick it.
  const reward = generateReward(r, mk(state), state.cycle, { V, archetype: lead.archetype, isChain: false, level: lead.level });
  // if the reward is a PERSON, hand the writer their rolled identity — a named quarry must fit the
  // actual unit (read showed a card promising "Eira" while the rolled captive was a male wolfman)
  const unit = reward.cards.find((c): c is CharacterCard => c.class === 'character');
  const quarryHint = unit ? tagLabels(unit.tags.filter((t) => t.id.startsWith('gender:') || t.id.startsWith('race:') || t.id.startsWith('bg:'))).join(', ') : undefined;
  const card = await ai.cardAsk({ archetype: lead.archetype, location: lead.location, slotCount: n, rewardKind: offerKindOf(reward), quarryHint, theme: pickThemes(r), prop: pickProp(r), arrival: pickArrival(r) });
  const quest: Quest = {
    id: uid(state, 'quest'), leadId: lead.id, rarity: lead.rarity, level: lead.level, location: lead.location,
    archetype: lead.archetype, title: card.job.slice(0, 48), situation: card.situation, job: card.job,
    // PROMISE = GRANT: the offer's kind is the ROLLED kind (the AI only words the label); 'unknown'
    // (a true mystery) and 'none' (a plea) are the only AI-allowed deviations.
    offeredReward: ['unknown', 'none'].includes(card.offeredReward.kind)
      ? card.offeredReward
      : { kind: offerKindOf(reward), label: card.offeredReward.label },
    stakes: '', slots: buildSlots(card.ask, n, ownedMercTags(state)), threshold: thresholdFor(n, lead.level),
    reward, risky: isRisky(lead),
  };
  state.quests[quest.id] = quest;
  logLine(state, `Pursued: ${quest.job}`);
  return quest;
}

// ---- chains -----------------------------------------------------------------
async function genesisChainAndBeat(state: GameState, ai: Narrator, r: Rng, lead: Lead): Promise<Quest> {
  // engine rolls the FOCAL character first (role-agnostic), as a STRONG-for-level character.
  // role 'npc' (not merc) while pending: not on the roster, not sendable — the finale decides their fate.
  // exclude recent focals' SKILL tags so we don't get e.g. three "sinister cook" sagas in a row.
  // The focal's value is the payout TARGET; the actual reward is the merc-day BANK accrued over the
  // beats (REWARD_BANK.md) — bank ≥ value → focal + surplus gold; short → focal+debt or void-to-gold.
  const gen = generateCharacter(r, { targetValue: BALANCE.maxCharValue(lead.level), level: lead.level, exclude: recentFocalSkills(state), maxSkills: 2 });
  const focal = characterFromGen(mk(state), gen, 'npc', state.cycle);
  focal.location = 'limbo';
  addCard(state, focal);
  const kernel = pickKernel(state, r);
  const arcBeats = ({ common: 4, uncommon: 5, rare: 6, legendary: 7 } as Record<string, number>)[lead.rarity] ?? 5;
  const twist = r() < 0.3;   // engine rolls misdirection; the AI never decides
  // REWARD-FIRST (like one-offs): the END reward — the core person — is rolled BEFORE the bible. Decide its
  // KIND here too (a quarry you take, or an ally you win), so the bible is framed to deliver it.
  const coreKind: 'recruit' | 'captive' = (twist || r() < 0.4) ? 'captive' : 'recruit';
  const coreReward = `${lead.rarity} ${coreKind}: [${tagLabels(focal.tags).join(', ')}]`;
  const poolCastMax = r() < 0.45 ? randInt(r, 1, 2) : 0;   // engine rolls how many recurring faces may return
  const maxChoices = rollChoiceBudget(r, lead.rarity);    // engine rolls how many arc steps may branch
  // seed the focal with a NAME (the AI may tweak it) instead of inventing one cold; the rest seed the cast.
  // filter seeds against names already in the world — two same-cycle geneses drew 'Anika' independently
  // and produced accidental crossover sagas (both titled around the same person).
  const taken = new Set(recentNames(state));
  const nameSeeds = pickNameSeeds(r, 8).filter((n) => !taken.has(n));
  if (!nameSeeds.length) nameSeeds.push(`Var${uid(state, 'nm').slice(-3)}`);
  focal.name = nameSeeds[0];
  const place = pickPlace(r, recentPlaces(state));
  const g = await ai.genesis({ focalTags: [tagLabels(focal.tags)], region: lead.location, rarity: lead.rarity, coreKind, name: nameSeeds[0], avoid: recentTitles(state), seed: kernel, place, tone: pickTone(r), prop: pickProp(r), pressure: pickPressure(r), client: pickClient(r), twist, expectedBeats: arcBeats, poolCast: gatherPoolCast(state, r, focal.id), poolCastMax, maxChoices, nameSeeds: nameSeeds.slice(1), avoidNames: recentNames(state) });
  // the bible NAMES the core person (cast[0]) — that's the focal; adopt their NAME so beats and the
  // card match. who/backstory are written cleanly by flesh at delivery (the bible's why-ladder is the
  // HIDDEN writers'-room reference, NOT a readable dossier bio).
  // ENGINE GUARD (don't trust the prompt): if the model cast an EXISTING world character as the core
  // person (seen in play: it made roster-merc Marek the focal → the finale would deliver a second
  // Marek), keep the seeded focal name instead of adopting the collision.
  const core = g.cast[0];
  const worldNames = new Set(Object.values(state.cards)
    .filter((c): c is CharacterCard => c.class === 'character' && c.id !== focal.id)
    .map((c) => c.name.split(' ')[0]));
  if (core && !worldNames.has(core.name.split(' ')[0])) focal.name = core.name;
  const chain: Chain = {
    id: uid(state, 'chain'), title: g.title, hook: g.leadBlurb, bible: renderBible(g), direction: g.directions[0]?.hook ?? '',
    focalCardIds: [focal.id], coreKind, coreReward, rarity: lead.rarity, level: lead.level, expectedBeats: arcBeats, beatsResolved: 0,
    mercCyclesSpent: 0, climaxTarget: arcBeats, state: 'live', log: [], seedKernel: kernel, place, arc: g.arc,
    choiceSteps: g.choiceSteps, choiceBudget: maxChoices,
    bank: 0, failsSpent: 0, failBudget: BALANCE.failBudget[lead.rarity],
  };
  focal.chainIds.push(chain.id);
  state.chains[chain.id] = chain;
  logLine(state, `A new saga begins: "${chain.title}" — ${chain.hook}`);
  return makeBeatQuest(state, ai, r, lead, chain);
}

// A newly-joined merc's MAIN chain — a saga ABOUT them (focal = the existing merc).
// The finale develops THEM (renown / a scar / death), not a new acquisition.
async function genesisPersonalChain(state: GameState, ai: Narrator, r: Rng, lead: Lead, mercId: string): Promise<Quest> {
  state.pendingMainChains = state.pendingMainChains.filter((id) => id !== mercId);
  const merc = state.cards[mercId] as CharacterCard | undefined;
  if (!merc || merc.role !== 'merc') return pursueOneOff(state, ai, r, lead);
  const B = randInt(r, 2, 3);
  const kernel = pickKernel(state, r);
  const twist = r() < 0.3;
  const poolCastMax = r() < 0.45 ? randInt(r, 1, 2) : 0;
  const maxChoices = rollChoiceBudget(r, lead.rarity);
  const place = pickPlace(r, recentPlaces(state));
  const g = await ai.genesis({ focalTags: [tagLabels(merc.tags)], region: lead.location, rarity: lead.rarity, personal: true, name: merc.name, who: merc.who, backstory: merc.backstory, avoid: recentTitles(state), seed: kernel, place, tone: pickTone(r), prop: pickProp(r), pressure: pickPressure(r), client: pickClient(r), twist, expectedBeats: B * 2, poolCast: gatherPoolCast(state, r, merc.id), poolCastMax, maxChoices, nameSeeds: pickNameSeeds(r), avoidNames: recentNames(state) });
  const chain: Chain = {
    id: uid(state, 'chain'), title: g.title, hook: g.leadBlurb, bible: renderBible(g), direction: g.directions[0]?.hook ?? '',
    focalCardIds: [merc.id], rarity: lead.rarity, level: merc.level, expectedBeats: B * 2, beatsResolved: 0,
    // personal beats run ~1 merc each (the anchor); a few beats to breathe before the finale.
    mercCyclesSpent: 0, climaxTarget: B * 2, state: 'live', log: [], personal: true, seedKernel: kernel, arc: g.arc,
    choiceSteps: g.choiceSteps, choiceBudget: maxChoices,
    bank: 0, failsSpent: 0, failBudget: BALANCE.failBudget[lead.rarity],
  };
  merc.chainIds.push(chain.id);
  state.chains[chain.id] = chain;
  logLine(state, `${merc.name}'s own saga begins: "${chain.title}" — ${chain.hook}`);
  return makeBeatQuest(state, ai, r, lead, chain, merc.id);
}

async function continueChain(state: GameState, ai: Narrator, r: Rng, lead: Lead, chainId: string): Promise<Quest> {
  const chain = state.chains[chainId];
  if (!chain) return pursueOneOff(state, ai, r, lead);
  const anchor = chain.personal ? chain.focalCardIds[0] : undefined;
  return makeBeatQuest(state, ai, r, lead, chain, anchor);
}

// chain beats are small encounters (1-2), not the genesis lead's archetype size; finales a touch bigger
function beatSlotCount(chain: Chain, r: Rng, isFinale: boolean): number {
  const rare = chain.rarity === 'rare' || chain.rarity === 'legendary';
  if (isFinale) return 2 + (rare ? 1 : 0);
  return 1 + (r() < 0.4 ? 1 : 0);
}
async function makeBeatQuest(state: GameState, ai: Narrator, r: Rng, lead: Lead, chain: Chain, anchorMercId?: string): Promise<Quest> {
  const beatNum = chain.beatsResolved + 1;            // beat counter (length / display / rotation)
  const isBeatOne = chain.beatsResolved === 0;
  // THE ARC ADVANCES EVERY BEAT (no retry). A failed step is NOT re-attempted — the story moves on and
  // the NEXT beat opens from the fallout (consequence), per the off-rails experiment. The engine's
  // failure BUDGET, not retries, governs how many stumbles a saga survives (REWARD_BANK.md §4).
  const arc = chain.arc ?? [];
  const nSteps = arc.length || (chain.expectedBeats ?? 4);
  const stepIdx = Math.min(chain.beatsResolved, Math.max(0, nSteps - 1)); // arc step this beat realizes
  const reachedLast = chain.beatsResolved >= nSteps - 1;   // done all but the last step → this IS the finale
  const lastChance = (chain.failsSpent ?? 0) > (chain.failBudget ?? 99); // budget blown → forced desperate finale
  const isFinale = !isBeatOne && (reachedLast || lastChance);
  const n = beatSlotCount(chain, r, isFinale);

  const focalName = (state.cards[chain.focalCardIds[0]] as CharacterCard | undefined)?.name ?? 'the person this saga is about';

  // engine-rotated ARRIVAL spark so beats don't all open the same way (a strong model tic). NO time of
  // day — the fort runs in DAYS, not hours. Beat 1 is the human petitioner (attachment); later beats vary.
  const MODES = [
    'a named cast member comes to the fort in person',
    'one of your own mercs brings word / drops a notice on your desk',
    'a rumor, a summons, or a sealed letter reaches the fort',
    'an official, a rival, or a creditor comes to press the matter',
    'a frightened bystander or a child brings urgent word to the gate',
  ];
  const off = Math.floor(rngFrom(chain.id)() * MODES.length);
  const mode = isBeatOne ? MODES[0] : MODES[1 + ((beatNum - 2 + off) % (MODES.length - 1))];

  // each beat realizes the current ARC STEP (stepIdx = beatsResolved). One numbering: "STEP k of n".
  const step = (k: number) => arc.length ? `"${arc[Math.max(0, Math.min(k, arc.length - 1))]}"` : 'this step of the quest';
  const lastStep = arc.length ? `"${arc[arc.length - 1]}"` : 'the goal finally achieved';
  const kNum = Math.min(stepIdx + 1, nSteps);
  // a CONSEQUENCE note when the previous beat FAILED — this beat opens from the fallout (NOT a retry of
  // the same step): the company is worse off, but the story moves forward toward the goal regardless.
  const failNote = (!isBeatOne && chain.lastFailed) ? ' The previous step FAILED — OPEN from the fallout (a setback, loss, or worse position from that failure), then press on; do NOT re-attempt the same action and do NOT pretend it succeeded. If the arc step you are realizing ASSUMES something the company failed to get (an object not seized, a person not taken), ADAPT the step to where they actually stand — write the version of its INTENT that fits the fallout, never a job that handles a thing they do not have.' : '';
  // CHOICES: the bible proposed which arc steps branch (choiceSteps, may include the finale); the engine
  // honors at most choiceBudget of them (PROMPT_RULES §3). Mid-step branch = a sneak/fight/talk method choice.
  const branchPoints = (chain.choiceSteps ?? []).filter((s) => s >= 2 && s <= nSteps).slice(0, chain.choiceBudget ?? 0);
  const allowChoice = !isBeatOne && !isFinale && !anchorMercId && branchPoints.includes(stepIdx + 1);
  // the finale BRANCHES (player picks the fate) only if the engine granted the last step a choice;
  // either way the QUEST WRITER generates the ending options at finale time (kinds it), with full context.
  const finaleBranches = isFinale && !chain.personal && branchPoints.includes(nSteps);
  // CRITICAL discipline: the "job" line is THIS step's one concrete action — never a restatement of the
  // overall goal (the experiment showed early beats otherwise just echo the goal). Situation carries the goal.
  const jobRule = ' The "job" line is ONLY this step\'s ONE concrete action — NEVER a restatement of the overall goal (the player already knows the goal).';
  let instr: string;
  if (isBeatOne) {
    instr = `STEP 1 of ${nSteps} — the OPENER, where the company is OFFERED this job. Realize this step: ${step(0)}. Make the player CARE: a real person on stage in a small human moment (a grief, want, or kindness), centered on ${focalName} UNLESS they're the bible's hidden wrongdoer (then a victim / worried kin / bystander). The "situation" carries the client's offer/briefing (how the job ARRIVES); the "job" line is the company's first real mission in the field — a task whose outcome is in doubt (go after the thing, search the place, confront someone). Meeting, accepting, or 'getting directions' is the SITUATION, NOT the job. Do NOT complete the goal, do NOT capture/resolve ${focalName}, no faceless steward/clerk handing over a contract. Single approach — no "choices".`;
  } else if (isFinale) {
    const desperate = (!reachedLast || lastChance) ? ' This is a LAST-CHANCE finale: the company is OUT OF TIME after repeated setbacks — force it to a head from where they actually stand; everything rides on this, and the goal may yet slip.' : '';
    const endingAsk = chain.personal
      ? ' Do NOT output "choices" (this saga is ABOUT an existing company member — no acquisition).'
      : finaleBranches
        ? ` OUTPUT "choices": 2-3 story-logical ENDINGS for ${focalName} given how this finale actually unfolded — each with a "kind". Each label must NAME who/what it resolves and READ as its kind: recruit = they join your company; captive = you take/hold/cage them; gold = you hand off / sell / turn them in for coin. Vary the kind where it makes sense.`
        : ` OUTPUT "choices": exactly ONE ending — the company's single way to resolve ${focalName} here — its label NAMES them and matches its "kind" (recruit / captive / gold).`;
    instr = `STEP ${nSteps} of ${nSteps} — the FINALE. Realize the final step: ${lastStep}. The goal is ACHIEVED or RESOLVED here, paying off whatever truth surfaced; it MUST read as the peak, not a sudden stop. The offeredReward names the SAGA'S WHOLE PAYOFF in plain terms (the spoils gathered along the way and the person/prize at stake), not a small purse for the errand.${desperate}${jobRule}${failNote}${endingAsk}`;
  } else {
    instr = `STEP ${kNum} of ${nSteps}. Realize this step: ${step(stepIdx)}. A MIDDLE step that ESCALATES toward the goal — a clearly DIFFERENT scene from every prior step (new place / people / action; don't re-stage or re-fetch the same thing). The company does NOT complete the goal yet.${jobRule}${failNote}${allowChoice ? ' THIS STEP AFFORDS A CHOICE: offer 2-3 "choices" (approaches testing DIFFERENT attributes — sneak/fight/talk).' : ' Single approach — no "choices".'}`;
  }
  const opening = ` OPENING SPARK (a prompt to riff on for how this reaches the fort — weave it into the first sentence, do NOT copy it as a label or a fragment opener; NO time of day as scene dressing — a deadline inside the job's fiction is fine): ${mode}. Vary the opening from the previous beat.`;
  instr += opening;
  // a PERSONAL saga is about an existing company merc — they can't be "recruited" as its reward
  if (chain.personal) instr += ` ${focalName} ALREADY SERVES the company — the offeredReward is never recruiting or capturing them; the company's gain is coin, loot, or what the saga settles.`;

  const beat = await ai.chainBeat({
    bible: chain.bible, chainState: chain.log.length ? chain.log.join(' ') : 'The saga is just beginning; the player knows nothing yet.',
    region: lead.location, slotCount: n, beatConstraint: instr,
    choiceKind: (isFinale && !chain.personal) ? 'ending' : (allowChoice ? 'method' : undefined),
    introduced: chain.introducedNames ?? [],
  });
  // remember which cast members this beat puts on stage, so the NEXT beat orients a name only ONCE
  // (re-tagging "Sigrun, the field-healer" every beat reads badly). Scan the player-facing text.
  const shown = `${beat.situation} ${beat.job}`;
  const seen = new Set(chain.introducedNames ?? []);
  for (const name of bibleCastNames(chain.bible)) if (shown.includes(name.split(' ')[0])) seen.add(name);
  chain.introducedNames = [...seen];
  // isFinale was decided by the engine (last arc step / last-chance), computed above.
  // intermediate beats deliver NO card — their merc-day value is BANKED (REWARD_BANK.md) and crystallized
  // at the finale into the FOCAL character + surplus gold. A PERSONAL finale develops the existing merc.
  let reward: RewardBundle;
  if (isFinale && !chain.personal) {
    const focal = state.cards[chain.focalCardIds[0]] as CharacterCard | undefined;
    reward = { targetValue: focal?.value ?? questValue(chain.level, chain.rarity, 1), cards: focal ? [focal] : [], kindHint: 'recruit' };
  } else {
    // intermediate beat OR personal finale: no immediate reward bundle — value banks (finale crystallizes it).
    reward = { targetValue: 0, cards: [], kindHint: 'gold' };
  }
  // A non-personal finale offers MUTEX APPROACH-GROUPS (docs/QUESTS.md §9): the focal's
  // value/tags are fixed; the branch the player fills decides the KIND (welcome / cage / sell).
  let slots: QuestSlot[];
  let groups: ApproachGroup[] | undefined;
  if (isFinale && !chain.personal) {
    slots = []; groups = [];
    const fav = beat.ask.favoredTags;
    const clash = clashingFor(fav);
    // engine maps each reward KIND to the attribute it tests + a threshold multiplier (the mechanics);
    // the LABEL is the bible's story-logical phrasing when available, else a generic fallback.
    const KIND_SPEC: Record<'recruit' | 'captive' | 'gold', { attr: Quest['slots'][number]['tested']['attribute']; thr: number; fallback: string }> = {
      recruit: { attr: 'charisma', thr: 1.1, fallback: 'Win them over' },
      captive: { attr: 'physical', thr: 1.1, fallback: 'Subdue them' },
      gold: { attr: 'perception', thr: 0.75, fallback: 'Hand off for coin' },
    };
    const addGroup = (id: string, label: string, kind: 'recruit' | 'captive' | 'gold') => {
      const spec = KIND_SPEC[kind]; const index = slots.length;
      slots.push({ index, requirement: { kind: 'open' }, tested: { attribute: spec.attr, favored: fav, clashing: clash }, groupId: id });
      groups!.push({ id, label: label || spec.fallback, rewardKind: kind, threshold: Math.max(2, Math.round(thresholdFor(1, chain.level) * spec.thr)), slotIndices: [index] });
    };
    // ENDINGS come from the QUEST WRITER at finale time (beat.choices, each kinded) — informed by how the
    // finale actually unfolded. One group per KIND. (Was genesis.finaleChoices; unified into chainBeat.)
    const beatEndings = (beat.choices ?? []).filter((c) => c.kind && KIND_SPEC[c.kind as 'recruit' | 'captive' | 'gold']).map((c) => ({ label: c.label, kind: c.kind as 'recruit' | 'captive' | 'gold' }));
    const seenKinds = new Set<string>();
    const endings = beatEndings.filter((c) => !seenKinds.has(c.kind) && seenKinds.add(c.kind));
    if (finaleBranches && endings.length >= 2) endings.forEach((c, i) => addGroup(`end${i}`, c.label, c.kind));
    else if (endings.length >= 1) addGroup('end0', endings[0].label, endings[0].kind);   // single fate
    else { addGroup('winover', 'Win them over', 'recruit'); addGroup('subdue', 'Subdue them', 'captive'); addGroup('ransom', 'Ransom / sell', 'gold'); } // fallback (AI gave no kinded endings)
  } else if (allowChoice && beat.choices && beat.choices.length >= 2) {
    // MID-BEAT CHOICE: the AI offered distinct APPROACHES (sneak/fight/talk). Each is a mutex group with
    // one open slot testing a DIFFERENT attribute; the player picks HOW by which they staff. Reward is the
    // same side-loot whichever they pick — the choice changes the method/flavour + which mercs fit.
    slots = []; groups = [];
    for (const c of beat.choices) {
      const index = slots.length; const id = `appr${index}`;
      slots.push({ index, requirement: { kind: 'open' }, tested: { attribute: c.attribute as Quest['slots'][number]['tested']['attribute'], favored: c.favored, clashing: clashingFor(c.favored) }, groupId: id });
      groups.push({ id, label: c.label, rewardKind: 'gold', threshold: thresholdFor(1, chain.level), slotIndices: [index] });
    }
  } else {
    slots = buildSlots(beat.ask, n, ownedMercTags(state));
    // a personal-chain beat pins its anchor: slot 0 must be the merc the saga is about,
    // and every OTHER slot is forced open (else a second must:<tag> only the anchor satisfies → unfillable).
    if (anchorMercId && slots[0]) {
      slots[0].requirement = { kind: 'must-be', cardId: anchorMercId };
      for (let i = 1; i < slots.length; i++) slots[i].requirement = { kind: 'open' };
    }
  }
  const quest: Quest = {
    id: uid(state, 'quest'), leadId: lead.id, rarity: chain.rarity, level: chain.level, location: lead.location,
    archetype: 'investigate', chainId: chain.id, beat: chain.beatsResolved + 1, finale: isFinale,
    title: chain.title, situation: beat.situation, job: beat.job, stakes: beat.newLayerRevealed,
    // a MIDDLE beat never delivers a unit (mid-saga: no captures) — a recruit/captive KIND there would
    // be a false promise for THIS job; the label may still tease the saga's prize in words.
    proposedLoot: beat.proposedReward,
    offeredReward: beat.offeredReward && !isFinale && (beat.offeredReward.kind === 'recruit' || beat.offeredReward.kind === 'captive')
      ? { kind: 'gold', label: beat.offeredReward.label }
      : beat.offeredReward,
    immediate: !isFinale && !!beat.immediateReward,
    slots, groups, threshold: thresholdFor(n, chain.level),
    reward, risky: isFinale || chain.rarity === 'rare' || chain.rarity === 'legendary',
  };
  state.quests[quest.id] = quest;
  logLine(state, `${isFinale ? 'FINALE' : `Beat ${quest.beat}`} of "${chain.title}": ${quest.job}`);
  return quest;
}

// ---- assignment -------------------------------------------------------------
export function slotEligible(quest: Quest, slotIndex: number, merc: CharacterCard): boolean {
  const slot = quest.slots[slotIndex];
  if (!slot) return false;
  if (merc.location.startsWith('quest:') && merc.location !== `quest:${quest.id}`) return false;
  const req = slot.requirement;
  if (req.kind === 'must-be') return merc.id === req.cardId;
  if (req.kind === 'must-have') return merc.tags.some((t) => t.id === req.tag);
  return true;
}
export function assign(state: GameState, quest: Quest, slotIndex: number, mercId: string): boolean {
  const merc = state.cards[mercId] as CharacterCard | undefined;
  if (!merc || !slotEligible(quest, slotIndex, merc)) return false;
  // clear any prior slot this merc held on this quest
  for (const s of quest.slots) if (s.filledBy === mercId) s.filledBy = undefined;
  // mutex approach-groups: choosing a slot in one group frees every slot in the OTHER groups
  if (quest.groups) {
    const myGroup = quest.slots[slotIndex].groupId;
    for (const s of quest.slots) if (s.groupId !== myGroup && s.filledBy) { if (state.cards[s.filledBy]) state.cards[s.filledBy].location = 'roster'; s.filledBy = undefined; }
  }
  quest.slots[slotIndex].filledBy = mercId;
  merc.location = `quest:${quest.id}`;
  return true;
}

/** The approach-group the player has committed to (the one with a filled slot), if any. */
export function chosenGroup(quest: Quest): ApproachGroup | undefined {
  if (!quest.groups) return undefined;
  return quest.groups.find((g) => g.slotIndices.some((i) => quest.slots[i]?.filledBy));
}
function effectiveThreshold(quest: Quest): number {
  return chosenGroup(quest)?.threshold ?? quest.threshold;
}
export function unassign(state: GameState, quest: Quest, slotIndex: number): void {
  const id = quest.slots[slotIndex].filledBy;
  if (id && state.cards[id]) state.cards[id].location = 'roster';
  quest.slots[slotIndex].filledBy = undefined;
}
export function partyOf(state: GameState, quest: Quest): CharacterCard[] {
  return quest.slots.map((s) => s.filledBy && state.cards[s.filledBy]).filter(Boolean) as CharacterCard[];
}
export function questCoins(state: GameState, quest: Quest): number {
  const party = quest.slots.map((s) => (s.filledBy ? state.cards[s.filledBy] as CharacterCard : null));
  let total = 0;
  party.forEach((c, i) => { if (c) total += coinsForSlot(c, quest.slots[i]); });
  return total;
}
function coinsForSlot(c: CharacterCard, slot: QuestSlot): number {
  let coins = c.attrs[slot.tested.attribute];
  for (const f of slot.tested.favored) { const t = c.tags.find((x) => x.id === f); if (t) coins += BALANCE.favoredBonus(t.tier); }
  for (const inj of c.injuries) coins -= BALANCE.injuryPenalty(inj.tier);
  return Math.max(0, Math.round(coins));
}
export function questOdds(state: GameState, quest: Quest) {
  return estimateOdds(questCoins(state, quest), effectiveThreshold(quest));
}
export function isFilled(quest: Quest): boolean {
  // a grouped finale is "filled" once one approach-group's slots are all filled
  if (quest.groups) { const g = chosenGroup(quest); return !!g && g.slotIndices.every((i) => quest.slots[i]?.filledBy); }
  return quest.slots.every((s) => s.filledBy);
}

// ---- resolution -------------------------------------------------------------
export interface QuestResult {
  questId: string; outcome: Outcome; coins: number; heads: number; threshold: number;
  title: string; job: string;   // so the reveal can remind the player WHAT this quest was
  beforeText: string; afterText: string; delivered: string[]; chainDone?: boolean;
}

export async function resolveQuest(state: GameState, ai: Narrator, quest: Quest): Promise<QuestResult> {
  const r = rngFrom(`${state.seed}:resolve:${quest.id}:${state.cycle}`);
  const party = partyOf(state, quest);
  const coins = questCoins(state, quest);
  const threshold = effectiveThreshold(quest);
  const roll = resolveRoll(r, coins, threshold);
  const outcome = roll.outcome;

  // tags of the captive/recruit the bundle would deliver (for AI naming), if any & not failure
  const charCard = quest.reward.cards.find((c) => c.class === 'character') as CharacterCard | undefined;
  const captiveTags = charCard && outcome !== 'failure' ? tagLabels(charCard.tags) : undefined;

  // tell the narrator which approach the player chose so the prose matches it. Finale groups map to the
  // delivered KIND (welcome/cage/sell); a MID-BEAT choice group carries the player's chosen METHOD label.
  const g = chosenGroup(quest);
  const approach = !g ? undefined
    : !quest.finale ? `the company chose to: ${g.label} — the afterRoll MUST read as this approach`
    : g.rewardKind === 'recruit' ? 'win them over — persuade them to join the company'
      : g.rewardKind === 'captive' ? 'subdue them — overpower and take them captive'
      : 'ransom/sell — overpower them, then hand them off for coin';

  const words = resolutionWords(quest);
  // resolution gets the chain's BIBLE + recent log to GROUND the prose (experiment-validated; the
  // narrative model handles it without dragging in off-stage cast — REWARD_BANK.md / PROMPT_RULES).
  const rchain = quest.chainId ? state.chains[quest.chainId] : undefined;
  const narr = await ai.outcome({
    situation: quest.situation, job: quest.job,
    party: party.map((m) => ({ name: m.name, tags: tagLabels(m.tags).slice(0, 4) })),
    outcome, captiveTags, risky: quest.risky, approach,
    midSaga: !!quest.chainId && !quest.finale,
    bible: rchain?.bible, storySoFar: rchain?.log.slice(-3).join(' ') || undefined,
    finale: !!quest.finale, beforeWords: words.before, afterWords: words.after,
    // the beat only PROPOSES; the resolution AI decides (scaled to OUTCOME) what's actually learned/gained.
    proposedReveal: quest.chainId ? quest.stakes || undefined : undefined,
    proposedLoot: quest.chainId && !quest.finale ? quest.proposedLoot : undefined,
  });
  quest.outcome = outcome; quest.beforeText = narr.beforeRoll; quest.afterText = narr.afterRoll;
  // the resolution AI named the actual side-loot (intermediate beats) — theme the loot card from it.
  if (narr.loot && !quest.finale) { const loot = quest.reward.cards.find((c) => c.class !== 'character'); if (loot) loot.name = narr.loot.slice(0, 60); }

  const deliveredChars: CharacterCard[] = [];
  const delivered = deliverReward(state, r, quest, outcome, narr.captive ?? null, narr.malus ?? { kind: 'none', label: '' }, party, deliveredChars);

  // flowchart step 9: flesh delivered characters (backstory + quirks → the living dossier).
  // Only the keepers (mercs/captives) and only once (skip if already fleshed) to bound cost.
  for (const c of deliveredChars) {
    if (c.role === 'dead' || (c.backstory && c.quirks.length)) continue; // already a complete card
    try {
      const roster = Object.values(state.cards).filter((x): x is CharacterCard => x.class === 'character' && x.role === 'merc').map((m) => m.name.split(' ')[0]);
      const f = await ai.flesh({ tags: tagLabels(c.tags), attrs: c.attrs, context: `acquired via "${quest.job}"`, nameSeeds: pickNameSeeds(r, 3), avoidNames: [...new Set([...roster, ...recentNames(state)])].slice(0, 16) });
      if (f.name && (!c.name || c.name === 'Unknown')) c.name = f.name;
      if (f.who && !c.who) c.who = f.who;
      if (!c.backstory) c.backstory = f.backstory;            // keep a chain focal's why-ladder backstory
      if (!c.quirks.length && f.quirks?.length) c.quirks = f.quirks;
    } catch { /* leave what we have */ }
  }

  // free mercs + grant xp + level
  for (const m of party) {
    m.location = 'roster';
    grantXp(state, m, quest.level, outcome);
  }

  // chain bookkeeping
  let chainDone = false;
  if (quest.chainId) chainDone = recordBeat(state, quest, outcome, party.length, narr.learned ?? null);

  delete state.quests[quest.id];
  logLine(state, `${outcome.toUpperCase()} — ${quest.job}`);
  return { questId: quest.id, outcome, coins, heads: roll.heads, threshold, title: quest.title, job: quest.job, beforeText: narr.beforeRoll, afterText: narr.afterRoll, delivered, chainDone };
}

function grantXp(state: GameState, m: CharacterCard, level: number, outcome: Outcome): void {
  const gain = level * (outcome === 'success' ? 3 : outcome === 'partial' ? 1 : 0);
  if (!gain) return;
  m.xp += gain;
  const need = (lvl: number) => 6 + lvl * 4;
  const cap = levelCap(state, m.id);
  while (m.xp >= need(m.level) && m.level < cap) {
    m.xp -= need(m.level); m.level += 1;
    m.attrs = attrsAtLevel(m.base, m.talents, m.level);
  }
}

// ---- delivery ---------------------------------------------------------------
function deliverReward(state: GameState, r: Rng, quest: Quest, outcome: Outcome, aiCaptive: { name: string; who: string } | null, malus: { kind: 'none' | 'debt' | 'injury' | 'liability'; label: string }, party: CharacterCard[], delivered: CharacterCard[]): string[] {
  const out: string[] = [];
  const bundle = quest.reward;
  // CHAIN BANK ACCRUAL (REWARD_BANK.md): each beat earns its merc-cycles, scaled to the outcome. A beat the
  // AI flagged IMMEDIATE pays a share now and banks the floor; every other beat banks in full; the finale
  // banks its own earn then crystallizes below. Done before the failure return (on failure earned = 0).
  let immediateGold = 0;
  if (quest.chainId) {
    const ch = state.chains[quest.chainId];
    if (ch) {
      const scale = outcome === 'success' ? 1 : outcome === 'partial' ? 0.5 : 0;
      const earned = Math.round(party.length * BALANCE.vBase(ch.level) * BALANCE.rarityMult[ch.rarity] * scale);
      if (!quest.finale && quest.immediate) {
        const banked = Math.round(earned * BALANCE.minDeferShare);
        immediateGold = earned - banked;
        ch.bank = (ch.bank ?? 0) + banked;
        if (immediateGold > 0) state.gold += immediateGold;
      } else {
        ch.bank = (ch.bank ?? 0) + earned;
      }
    }
  }
  if (outcome === 'failure') {
    // AI-chosen MALUS (engine-readable). Only 'debt' is wired (a negative-gold liability); injury/liability
    // are narrated + FLAGGED for later mechanical effects. 'none' = a clean failure.
    // ENGINE GATE (ECONOMY §5): a failure punishment lands ONLY on risky quests — the AI proposes,
    // the engine decides. (A dropped gate here made every failure stack a debt — fail-spam.)
    if (!quest.risky) malus = { kind: 'none', label: '' };
    if (malus.kind === 'debt') {
      const d = liabilityCard(mk(state), 'debt', Math.round(BALANCE.vBase(quest.level) * 0.5), state.cycle); d.location = 'roster'; addCard(state, d);
      out.push(`a debt — ${malus.label || 'you owe coin now'}`);
    } else if (malus.kind !== 'none' && malus.label) {
      out.push(malus.label);   // TODO: wire injury (wound a merc) / liability (evidence/mess card) effects
    } else out.push('nothing gained');
    // on a finale failure the focal character is lost; intermediate beats keep it safe
    if (quest.finale) handleFinaleFate(state, quest, 'failure', out, aiCaptive, delivered);
    return out;
  }

  if (quest.finale) { handleFinaleFate(state, quest, outcome, out, aiCaptive, delivered); return out; }

  // INTERMEDIATE chain beat (non-failure): the merc-day value was BANKED above (and a share paid now if the
  // AI flagged immediate loot). Surface what happened so the gamble + the running bank are both visible.
  if (quest.chainId) {
    const ch = state.chains[quest.chainId];
    if (immediateGold > 0) out.push(`looted ${immediateGold} gold${quest.proposedLoot ? ` (${quest.proposedLoot})` : ''} — the rest banks toward the saga (~${ch?.bank ?? 0})`);
    else out.push(`spoils gathered toward the saga's end (~${ch?.bank ?? 0} banked)`);
    return out;
  }

  const scale = outcome === 'partial' ? 0.5 : 1;
  let positive = 0;
  for (const card of bundle.cards) {
    if (card.class === 'gold') { const g = Math.round(card.value * scale); state.gold += g; positive += g; out.push(/gold$/.test(card.name) ? `${g} gold` : `${card.name} (${g}g)`); }
    // a person can't be halved: on a partial you keep the WHOLE unit (full value) — the
    // value is balanced back to V/2 by the saddling liability below.
    else if (card.class === 'character') { deliverCharacter(state, card, outcome, aiCaptive, out); delivered.push(card); positive += card.value; }
    else if (card.class === 'liability') { card.location = 'roster'; addCard(state, card); out.push(card.name); }
  }
  // partial balancing: bring delivered net to ~V/2 with a liability (saddle) or skip if already near
  if (outcome === 'partial') {
    const desired = bundle.targetValue * 0.5;
    const gap = positive - desired;
    if (gap > BALANCE.vBase(1) * 0.5) { const l = liabilityCard(mk(state), pickLiab(r), Math.round(gap), state.cycle); l.location = 'roster'; addCard(state, l); out.push(`(saddled with ${l.name.toLowerCase()})`); }
  }
  return out;
}

function deliverCharacter(state: GameState, card: CharacterCard, outcome: Outcome, aiCaptive: { name: string; who: string } | null, out: string[]): void {
  if (aiCaptive) { card.name = aiCaptive.name; card.who = aiCaptive.who; }
  // partial-wound a recruited character
  if (outcome === 'partial') card.injuries.push({ id: 'injury:wound', tier: 4 });
  // capture capacity gates captives
  if (card.role === 'captive') {
    const held = Object.values(state.cards).filter((c) => c.class === 'character' && (c as CharacterCard).role === 'captive').length;
    card.location = held < captiveCapacity(state) ? 'dungeon' : 'roster';
  } else card.location = 'roster';
  addCard(state, card);
  out.push(`${card.role === 'captive' ? 'captive' : 'recruit'}: ${card.name}${outcome === 'partial' ? ' (wounded)' : ''}`);
}

// The finale crystallizes the accrued BANK into the reward (REWARD_BANK.md §3): the bank already
// includes this finale beat's earn (accrued in resolveQuest). Failure forfeits everything; otherwise
// the focal materializes, reconciled against the bank (surplus gold / give-with-debt / void-to-gold).
function handleFinaleFate(state: GameState, quest: Quest, outcome: Outcome, out: string[], aiCaptive: { name: string; who: string } | null, delivered: CharacterCard[]): void {
  const chain = quest.chainId ? state.chains[quest.chainId] : undefined;
  const focal = chain && state.cards[chain.focalCardIds[0]] as CharacterCard | undefined;
  if (!chain || !focal) return;
  const bank = Math.round(chain.bank ?? 0);
  // a PERSONAL finale develops the existing merc; non-failure still pays the saga's earned coin.
  if (chain.personal) {
    handlePersonalFinale(focal, outcome, out);
    if (outcome !== 'failure' && bank > 0) { state.gold += bank; out.push(`the company earned ${bank} gold over the saga`); }
    return;
  }
  // FINALE FAILURE → quest failed → 0 reward: the focal is lost, the bank forfeited (ECONOMY §5).
  // Played sessions showed this moment was too quiet — a saga's death deserves a loud, explicit line.
  if (outcome === 'failure') {
    focal.role = 'dead'; focal.location = 'limbo';
    out.push(`✝ ${focal.name} is LOST — the saga ends in failure${bank > 0 ? `, and the ${bank} gold banked over its course is forfeit` : ''}`);
    return;
  }
  // the focal kept their BIBLE name across every beat; who/backstory are fleshed after delivery.
  if (aiCaptive && (!focal.name || focal.name === 'Unknown')) { focal.name = aiCaptive.name; focal.who = aiCaptive.who; }
  const kind = chosenGroup(quest)?.rewardKind ?? 'recruit';
  // RANSOM / SELL → take the whole bank as gold; the focal leaves your story.
  if (kind === 'gold') {
    focal.role = 'dead'; focal.location = 'limbo';
    if (bank > 0) { state.gold += bank; out.push(`${focal.name} is handed off — ${bank} gold for the company`); }
    else out.push(`the deal collapses — ${focal.name} slips away with nothing gained`);
    return;
  }
  // WIN OVER / SUBDUE → deliver the focal, reconciled against the realized bank.
  const target = Math.round(focal.value);
  // VOID-TO-GOLD: too little was gathered to hold them — they slip away; salvage the bank as gold.
  if (bank < target * BALANCE.focalKeepFraction) {
    focal.role = 'dead'; focal.location = 'limbo';
    if (bank > 0) state.gold += bank;
    out.push(`too little was gathered — ${focal.name} slips away; ${bank} gold salvaged`);
    return;
  }
  const wounded = outcome === 'partial';
  if (wounded) focal.injuries.push({ id: 'injury:wound', tier: 3 });
  if (kind === 'captive') {
    const held = captives(state).length;
    focal.role = 'captive'; focal.location = held < captiveCapacity(state) ? 'dungeon' : 'roster';
    delivered.push(focal);
    out.push(`${focal.name} is taken captive${wounded ? ', wounded' : ''}`);
  } else { // recruit
    focal.role = 'merc'; focal.location = 'roster'; queueMainChain(state, focal.id);
    delivered.push(focal);
    out.push(`${focal.name} joins the company${wounded ? ', but wounded' : ''}`);
  }
  // SURPLUS gold above the focal's value, or a DEBT for the shortfall (give-with-debt, ECONOMY §5).
  if (bank > target) { const surplus = bank - target; state.gold += surplus; out.push(`+${surplus} gold gathered along the way`); }
  else if (bank < target) { const gap = target - bank; const d = liabilityCard(mk(state), 'debt', gap, state.cycle); d.location = 'roster'; addCard(state, d); out.push(`but saddled with a ${gap}-gold debt (the saga cost more than it paid)`); }
}

// A personal finale develops the EXISTING merc, gated by the roll (docs/QUESTS.md §6).
function handlePersonalFinale(merc: CharacterCard, outcome: Outcome, out: string[]): void {
  if (outcome === 'success') {
    // renown — a stamped tag + a surge of veterancy
    if (!merc.tags.some((t) => t.id.startsWith('noto:'))) merc.tags.push({ id: 'noto:famous', tier: 2 });
    merc.xp += 30;
    out.push(`${merc.name} settles their past and earns renown (famous)`);
  } else if (outcome === 'partial') {
    // a partial reckoning always leaves a mark: a scar, or — if already scarred — dark renown
    if (!merc.tags.some((t) => t.id === 'phys:scarred')) { merc.tags.push({ id: 'phys:scarred', tier: 3 }); out.push(`${merc.name} closes the chapter, but it leaves a scar`); }
    else if (!merc.tags.some((t) => t.id.startsWith('noto:'))) { merc.tags.push({ id: 'noto:infamous', tier: 3 }); out.push(`${merc.name} closes the chapter, but the truth follows them (infamous)`); }
    else out.push(`${merc.name} closes the chapter at a cost`);
    merc.xp += 10;
  } else {
    // the gamble of a personal saga: it can claim them. Say WHAT happened (played sessions showed the
    // prose often leaves them alive-but-broken while the roster line just shrank — name the departure).
    merc.role = 'dead'; merc.location = 'limbo';
    out.push(`✝ ${merc.name}'s past catches them at last — broken by it, they walk out of the fort and do not come back`);
  }
}

const pickLiab = (r: Rng) => (['evidence', 'mess', 'debt'] as const)[randInt(r, 0, 2)];

// ---- chain post-beat bookkeeping -------------------------------------------
function recordBeat(state: GameState, quest: Quest, outcome: Outcome, partySize: number, learned: string | null): boolean {
  const chain = quest.chainId ? state.chains[quest.chainId] : undefined;
  if (!chain) return false;
  chain.mercCyclesSpent += partySize;        // effort spent (display)
  chain.beatsResolved += 1;
  // THE ARC ADVANCES EVERY BEAT (no retry). A failed MIDDLE beat spends from the failure BUDGET; once
  // the budget is blown the chain goes to a forced LAST-CHANCE finale (REWARD_BANK.md §4).
  chain.lastFailed = outcome === 'failure';
  if (outcome === 'failure' && !quest.finale) {
    chain.failsSpent = (chain.failsSpent ?? 0) + 1;
    if (chain.failsSpent > (chain.failBudget ?? 99)) chain.lastChance = true;
  }
  // `learned` is what the RESOLUTION AI decided the company actually came away knowing (scaled to the
  // outcome — full on success, hedged on partial, empty on failure). A failure advances the WORLD (people
  // react, the company is worse off) — the next beat opens from the fallout, never retries the step.
  const result = learned
    ? `and the company now knows: ${learned}`
    : `but FAILED — worse off, nothing gained`;
  chain.log.push(`Beat ${chain.beatsResolved}: the company set to "${quest.job}" ${result}.`);
  if (quest.finale) { chain.state = 'done'; if (outcome !== 'failure') maybeSpawnSequel(state, chain); return true; }
  return false;
}

// flowchart step 17: a resolved saga MAY leave a loose thread → a sequel lead on the board.
function maybeSpawnSequel(state: GameState, chain: Chain): void {
  const r = rngFrom(`${state.seed}:sequel:${chain.id}`);
  if (r() >= 0.6) return;
  const order: Quest['rarity'][] = ['common', 'uncommon', 'rare', 'legendary'];
  const rarity = order[Math.min(order.length - 1, order.indexOf(chain.rarity) + 1)]; // sequels raise the stakes
  state.leads.push({
    id: `lead_sequel_${chain.id}_${state.cycle}`,
    rarity, level: chain.level + 1, location: pick(r, state.unlockedLocations),
    archetype: 'investigate', chain: { kind: 'starts-new' },
    title: `Echo of "${chain.title}"`, hook: `The end of ${chain.title} left a thread unpulled.`,
    expiresCycle: state.cycle + LEAD_TTL + 2, sequelOf: chain.id,
  });
  logLine(state, `A loose thread remains from "${chain.title}" — a new lead surfaces.`);
}
