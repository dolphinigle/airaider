// charDrivenPrompt — shared character-driven bible scaffolding.
//
// Extracted so multiple harnesses (charDrivenExperiment, questPlaytest) reuse the
// same CHARACTER-IS-THE-SPINE prompt transform and the character-core HINT DECK
// without re-running each other's top-level main().
//
// The transform takes the production BIBLE_SYSTEM and re-centers it on a
// protagonist's want/need/lie/wound arc (the situation becomes a crucible).

import { BIBLE_SYSTEM, type BibleRequest } from './biblePipeline.js';

export interface Hint { id: string; kind: string; seed: string; }

// Prototype of the user's "1000+ handcrafted hints" idea. Each is a CHARACTER CORE
// (a want vs need + a lie rooted in a wound), NOT a plot MacGuffin.
export const HINT_DECK: Hint[] = [
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

export function buildCharSpineSystem(): string {
  let s = BIBLE_SYSTEM;
  s = s.replace(HEART_OLD, HEART_NEW);
  s = s.replace(TRAJ_OLD, TRAJ_NEW);
  s = s.replace('CRAFT REQUIREMENTS (compact, in JSON):', CHAR_SPINE_PREAMBLE + 'CRAFT REQUIREMENTS (compact, in JSON):');
  return s;
}

export function applyHint(req: Omit<BibleRequest, 'pool'>, hint: Hint): Omit<BibleRequest, 'pool'> {
  return {
    ...req,
    themeKeywords: [hint.kind],
    readerFlavor: `CHARACTER CORE for this chain (build the protagonist around this): ${hint.seed}`,
  };
}
