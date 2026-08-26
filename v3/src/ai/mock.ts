// Deterministic mock provider — the full game is playable offline. Templates keyed
// off a seeded RNG; obeys every engine contract (names as-given, no numbers).

import { Rng } from '../engine/rng.js';
import type {
  AiProvider, AiUsage, QuestWriteInput, QuestWriteOut, GenesisInput, GenesisOut,
  ResolveQuestInput, ResolveQuestOut, ThemeRollInput, ThemeRollOut, SelectorInput,
  FleshInput, FleshOut,
} from './provider.js';

const JOBS: Record<string, string[]> = {
  raid: ['Hit the camp before first light and take what they owe.', 'Storm the stockade; leave the rest to burn.'],
  capture: ['Bring the quarry back breathing — the rope is optional.', 'Take them alive; dead men pay no ransom.'],
  rescue: ['Get them out before the trail goes cold.', 'Someone wants them back. Go be the someone who delivers.'],
  escort: ['See the cargo through the pass. Whole.', 'Walk them to the gate and dare anyone to object.'],
  investigate: ['Find out what actually happened — and to whom.', 'Ask the questions no one else dares ask.'],
  hunt: ['Track it. Corner it. End it.', 'The trail is fresh; the bounty is fresher.'],
  contract: ['Do the job, take the coin, ask nothing.', 'A quiet favor for a loud purse.'],
  'lead-hunt': ['Sweep the region for rumors worth chasing.', 'Buy drinks, open ears, bring back threads.'],
};

const SITS = [
  'A mud-spattered rider arrives at the gate with the offer.',
  'Word comes through the {region} channels — quietly, twice.',
  'A sealed note, a nervous messenger, and half the payment up front.',
  'One of the regulars at the fort gate swears this one is real.',
];

export class MockProvider implements AiProvider {
  readonly name = 'mock';
  private rng: Rng;
  private _usage: AiUsage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

  constructor(seed = 1337) { this.rng = new Rng(seed) }
  usage(): AiUsage { return { ...this._usage } }
  callLog() { return [] }
  private tick() { this._usage.calls++ }

  async writeQuest(input: QuestWriteInput): Promise<QuestWriteOut> {
    this.tick();
    const kw = (input.keywords ?? []).slice(0, 2).join(', ');
    const arch = input.archetype ?? 'investigate';
    const title = input.kind === 'finale'
      ? `The Reckoning: ${input.focalName ?? 'the end of it'}`
      : `${cap(arch)} — ${kw || input.location.split(' — ')[0]}`;
    const situation = (this.rng.pick(SITS)).replace('{region}', input.location.split(' — ')[0]!) +
      (input.framedCharacter ? ` They speak of one ${input.framedCharacter.name} — ${input.framedCharacter.tags}.` : '') +
      (kw ? ` (${kw} figure in it.)` : '');
    const out: QuestWriteOut = {
      title,
      situation,
      job: this.rng.pick(JOBS[arch] ?? JOBS.contract!),
      ask: [], // engine falls back to defaultAsk when empty (mock keeps engine authoritative)
    };
    // §4 pattern-B: shape a partial quarry (type from the "AI", tier left to the engine)
    if (input.framedCharacter?.partial) out.quarryTags = [this.rng.pick(['soldier', 'criminal (high)', 'hunter', 'beautiful (mid)'])];
    if (input.kind === 'finale') {
      out.approaches = [
        { label: 'Win them over', rewardKind: 'recruit', attribute: 'cha', favored: ['social'] },
        { label: 'Subdue them', rewardKind: 'captive', attribute: 'str', favored: ['melee', 'intimidation'] },
        { label: 'Sell what you know', rewardKind: 'gold', attribute: 'int', favored: ['roguery'] },
      ];
    }
    return out;
  }

  async genesis(input: GenesisInput): Promise<GenesisOut> {
    this.tick();
    const f = input.focal.name;
    const extraName = input.assignedNames[0] ?? 'a stranger';
    const slate = input.slate ?? [];
    const known = slate[0];
    return {
      title: `The ${cap(this.rng.pick(['debt', 'oath', 'road', 'price', 'shadow']))} of ${f}`,
      kernel: `${f} is the key to ${input.seed}`,
      cast: [
        { name: f, who: `the one this is all about (${input.focal.tags})`, want: 'what they lost back', role: 'focal' },
        { name: extraName, who: 'a go-between with a stake of their own', want: 'to come out ahead', role: 'broker' },
        ...(known ? [{ name: known.name, who: known.blurb, want: 'old business settled', role: 'complication', loreId: known.id }] : []),
      ],
      situation: `Out in ${input.location.split(' — ')[0]}, ${input.seed} — and ${f} stands at the middle of it.`,
      goal: `Resolve what binds ${f} — likely ending as ${input.kind}.`,
      arc: ['a thread surfaces', 'the price becomes clear', 'sides must be chosen', 'the reckoning'],
      twistReveal: input.twist ? `${extraName} serves someone unseen.` : null,
      tensions: [`${f} vs what they owe`, `${extraName} plays both sides`],
      openDirections: [`follow the thread of ${f}`, 'let it lie and see who comes knocking'],
      relevantIds: slate.slice(0, 2).map(s => s.id),
      newPlaces: [],
      newEdges: known ? [{ from: known.id, to: known.id, type: 'party-to', blurb: 'drawn into the affair', importance: 0.4 }] : [],
    };
  }

  async resolve(inputs: ResolveQuestInput[], onEach?: (out: ResolveQuestOut) => void): Promise<ResolveQuestOut[]> {
    this.tick();
    // the mock settles instantly, so onEach fires in SUBMISSION order — the suite and the sims
    // stay bit-identical while the real provider fires in arrival order
    return inputs.map(q => {
      const lead = q.party[0];
      const before = `${q.party.map(p => p.name).join(', ')} set out: ${q.job.toLowerCase()}`;
      const after =
        q.outcome === 'success' ? `It goes clean. ${q.deliveredSummary}. ${lead?.name ?? 'The party'} takes the credit.` :
        q.outcome === 'partial' ? `It gets messy, but they come away with something: ${q.deliveredSummary}. Questions will follow.` :
        `It falls apart at the worst moment. Nothing to show but the walk home.`;
      const injuries = q.party.map(p => {
        let band: 'none' | 'low' | 'med' | 'high' = 'none';
        if (q.outcome === 'failure' && this.rng.chance(0.5)) band = this.rng.chance(0.3) ? 'med' : 'low';
        else if (q.outcome === 'partial' && this.rng.chance(0.2)) band = 'low';
        // cause must NAME the merc (multi-party guard drops nameless wounds — sims were blind
        // to the whole wound channel until 2026-07-10)
        return { characterId: p.id, band, cause: band === 'none' ? null : `${p.name} takes a knock ${q.outcome === 'failure' ? 'at the worst moment' : 'as it gets messy'}` };
      });
      const fleshed = q.deliveredCharacters.map(c => ({
        characterId: c.id,
        who: `known around ${this.rng.pick(['the docks', 'the market rows', 'the back roads', 'the old quarter'])} — ${c.tags.split(';')[0] ?? ''}`,
        backstory: `${c.name} ended up in this life the usual way: one bad season and one worse promise.`,
        quirks: [this.rng.pick(['counts coins twice', 'never sits with their back to a door', 'hums while working', 'keeps a pressed flower in a boot'])],
      }));
      const edges = q.party.length >= 2 && q.outcome !== 'failure'
        ? [{ from: q.party[0]!.id, to: q.party[1]!.id, type: 'served-with', blurb: `stood together — ${q.title}`, importance: 0.35 }]
        : q.outcome === 'failure' && q.party.length >= 1
          ? [{ from: q.party[0]!.id, to: q.party[0]!.id, type: 'scarred-by', blurb: `carries the failure of ${q.title}`, importance: 0.45 }]
          : [];
      const out: ResolveQuestOut = {
        questId: q.questId, before, after, injuries, fleshed,
        edges: edges.filter(e => e.from !== e.to),
        storyUpdate: q.chainContext ? {
          currentSituation: q.outcome === 'failure' ? 'The trail cools; doors close.' : 'The next thread is in hand.',
          newlyRevealed: q.outcome !== 'failure' ? ['another layer of the affair'] : [],
          openThreads: ['what the broker is not saying'],
        } : undefined,
      };
      // a throwing consumer never fails the batch — but it is never silent either
      try { onEach?.(out) } catch (e) { console.error('[mock] resolve onEach threw:', (e as Error).message) }
      return out;
    });
  }

  async flesh(inputs: FleshInput[]): Promise<FleshOut[]> {
    this.tick();
    return inputs.map(i => ({
      characterId: i.characterId,
      who: i.saga
        ? `the one the story of ${i.saga.title} was about`
        : `known for ${this.rng.pick(['mending kit nobody asked about', 'a laugh that starts fights', 'never sleeping before the watch horn', 'feeding the gate dogs', 'losing at dice on purpose'])}`,
      backstory: i.saga
        ? `Before "${i.saga.title}" there was already this: ${i.saga.kernel} ${i.name} wanted ${i.saga.want ?? 'out'}, and the company's season decided how that ended.`
        : `${i.name} came to the company as ${i.context}. What they left behind, they do not say.`,
      quirks: [this.rng.pick(['whets an already-sharp knife', 'braids and unbraids a leather cord', 'taps the doorframe twice on leaving', 'saves the crust of every loaf'])],
    }));
  }

  async themeRoll(input: ThemeRollInput): Promise<ThemeRollOut> {
    this.tick();
    const wants = [...input.hintWords];
    // style adds its cultural want; plus one flavorful extra from the vocabulary
    const extra = this.rng.pick(input.vocabulary.filter(v => !wants.includes(v)));
    if (extra) wants.push(extra);
    return { wants, flavorLine: `Redone ${input.style ?? 'plainly'}: the ${input.roomName.toLowerCase()} asks for ${wants.join(', ')}.` };
  }

  async select(input: SelectorInput): Promise<string[]> {
    this.tick();
    return input.candidates.slice(0, input.max).map(c => c.id);
  }

  async review(): Promise<{ ok: boolean; defects: string[] }> {
    this.tick();
    return { ok: true, defects: [] };   // mock text is deterministic — nothing to gate
  }
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }
