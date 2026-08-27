// The person a quest hands over is AUTHORED BY THE CARD (GENERATION_FLOW §4, "pattern-B"):
// the engine pre-rolls identity, the card writer says who they are via quarryTags, the engine
// builds the unit to match. Both halves shipped broken on 2026-08-27 — the routine card prompt
// never asked for quarryTags, and the routine report prompt told the resolver to flesh nobody —
// so a rescued shrine novice arrived as a nimble servant with an invented past. These pin it.
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { QuestWriteInput, QuestWriteOut, ResolveQuestInput, ResolveQuestOut, FleshInput, FleshOut } from '../src/ai/provider.js';
import type { Lead } from '../src/engine/quests.js';
import { unitWorth, unitStars, unitPeak } from '../src/engine/economy.js';

/** a writer that always proposes the same three traits, so the engine's half is observable */
class TagMock extends MockProvider {
  lastWrite?: QuestWriteInput;
  lastFlesh?: FleshInput[];
  override async writeQuest(i: QuestWriteInput): Promise<QuestWriteOut> {
    this.lastWrite = i;
    const out = await super.writeQuest(i);
    return { ...out, quarryTags: ['priest (mid)', 'scholar', 'frail' ] } as QuestWriteOut;
  }
  override async flesh(i: FleshInput[]): Promise<FleshOut[]> { this.lastFlesh = i; return super.flesh(i) }
}

const rescueLead = (id: string): Lead => ({
  id, rarity: 'common', level: 2, region: 'forests', archetype: 'rescue',
  chainInfo: { kind: 'none' }, expiresAtCycle: 99, source: 'starter',
});

function fresh(ai: MockProvider): Game {
  const g = new Game(ai, 4242);
  g.build('map-room'); g.build('lead-room');
  return g;
}

describe('the quest and the person it delivers', () => {
  it('builds the delivered person out of the tags the CARD proposed', async () => {
    const ai = new TagMock(4242);
    const g = fresh(ai);
    let person: ReturnType<Game['card']> | undefined;
    for (let i = 0; i < 8 && !person; i++) {
      g.state.leads.push(rescueLead(`lead-t${i}`));
      const lead = g.visibleLeads().at(-1)!;
      const r = await g.pursue(lead.id);
      if (!r.ok || !r.questId) continue;
      const q = g.state.quests.find(x => x.id === r.questId)!;
      person = q.rewardCards.find(c => c.character);
    }
    expect(person, 'no quest in 8 tries handed over a person').toBeTruthy();
    // the writer WAS asked (partial framedCharacter is the ask), and the engine honoured it
    expect(ai.lastWrite?.framedCharacter?.partial).toBe(true);
    // the engine canonicalises, rolls a tier inside each proposed band and prices the rest back
    // to budget, so not every proposal has to survive — but the card's voice must be IN there
    const concepts = person!.tags.map(t => t.concept);
    const landed = ['priest', 'scholar', 'frail'].filter(c => concepts.includes(c));
    expect(landed.length, `card proposed priest/scholar/frail, person is ${concepts.join(',')}`).toBeGreaterThan(0);
  });

  it('gives a delivered person the job they came out of, for whoever writes them later', async () => {
    const ai = new TagMock(77);
    const g = fresh(ai);
    let delivered: ReturnType<Game['card']> | undefined;
    for (let cycle = 0; cycle < 10 && !delivered; cycle++) {
      g.state.leads.push(rescueLead(`lead-q${cycle}`));
      for (const l of g.visibleLeads()) await g.pursue(l.id);
      for (const q of g.state.quests.filter(q => q.state === 'open')) {
        for (let s = 0; s < q.slots.length; s++) {
          if (q.slots[s]!.filledBy) continue;
          const m = g.roster().find(m => m.location.kind === 'held');
          if (m) g.assign(q.id, s, m.id);
        }
      }
      await g.endCycle();
      delivered = g.state.cards.find(c => c.character?.origin);
    }
    expect(delivered, 'nobody was delivered in 10 cycles').toBeTruthy();
    const o = delivered!.character!.origin!;
    expect(o.title, 'the job title is remembered on the person').toBeTruthy();
    expect(o.situation.length + o.job.length, 'the card and the errand are remembered too').toBeGreaterThan(0);
  });

  it('a person with no quest behind them carries no origin (founders, tavern walk-ins)', () => {
    const g = fresh(new MockProvider(5));
    for (const m of g.roster()) expect(m.character!.origin).toBeUndefined();
  });
});

// The prose sanitiser: a cheap model told its backstory "must be consistent with every tag"
// demonstrates compliance by PRINTING the tags. It reached the designer's game and reproduced
// 3/3 on re-flesh. The prompt already forbids echoing its own wording, so this is engine
// enforcement rather than a fifth ban (L1: a rule's wording comes back as prose).
describe('tag echo never reaches player-facing prose', () => {
  const TAG_ECHO_WORDS = new Set([
    'male', 'female', 'human', 'elf', 'wolfman', 'lizardman', 'low', 'mid', 'high', 'legendary', 'tags', 'tag', 'notation',
    'melee', 'ranged', 'leadership', 'social', 'roguery', 'lore', 'heal', 'craft', 'nature', 'performance', 'intimidation', 'food',
    'cool', 'hotheaded', 'serious', 'playful', 'greedy', 'generous', 'loner', 'gregarious', 'lustful', 'chaste', 'dominant',
    'submissive', 'calculating', 'instinctive', 'tall', 'short', 'endowed', 'flat', 'muscular', 'scrawny', 'nimble', 'clumsy',
    'clever', 'dull', 'beautiful', 'ugly', 'tough', 'sickly', 'ruler', 'soldier', 'criminal', 'priest', 'mystic', 'artisan',
    'adventurer', 'entertainer', 'merchant', 'scholar', 'courtesan', 'sailor', 'slave', 'hunter', 'peasant', 'servant',
  ]);
  /** a run of text is a TAG LIST when nearly every word in it is one of those words */
  const isTagList = (inner: string): boolean => {
    const words = inner.toLowerCase().split(/[^a-z-]+/).filter(w => w.length > 2);
    if (words.length < 3) return false;
    return words.filter(w => TAG_ECHO_WORDS.has(w)).length / words.length >= 0.75;
  };
  
  const stripTagEcho = (s: string) => {
    let out = s;
    // a bracketed aside anywhere that is just the tag line (one level of nesting: "ranged (low)")
    out = out.replace(/\s*\((?:[^()]|\([^()]*\))*\)/g, m => isTagList(m.slice(1, -1)) ? '' : m);
    out = out.replace(/\s*\[(?:[^[\]()]|\([^()]*\))*\]/g, m => isTagList(m.slice(1, -1)) ? '' : m);
    // or a bare label-and-list opening the field: "TAGS NOTATION: male, human, criminal (low)."
    out = out.replace(/^[^.!?]*[:：][^.!?]*[.!?]\s*/, m => isTagList(m) ? '' : m);
    return out.replace(/\s+([.,;!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  };

  const strip = stripTagEcho;

  it('strips every form the model has actually produced', () => {
    // verbatim from the designer's save, and from two re-flesh runs
    expect(strip('He arrived with a chipped shortbow and a habit for shooting by feel (Tags: human, male, ranged (low), instinctive).'))
      .toBe('He arrived with a chipped shortbow and a habit for shooting by feel.');
    expect(strip('TAGS NOTATION: male, human, criminal (low), melee (low), endowed (low), serious. He turned up at the gate after a downpour.'))
      .toBe('He turned up at the gate after a downpour.');
    expect(strip('She kept the grove. [Tags: elf, female, priest (low)] Nothing else.'))
      .toBe('She kept the grove. Nothing else.');
    // round two: banning the label just moved it to the head of the who-line, unlabelled
    expect(strip('(human. Male. Ranged (low). Instinctive) A front-line bowman. He trusts fast senses.'))
      .toBe('A front-line bowman. He trusts fast senses.');
    expect(strip('(wolfman. Male. Intimidation (low). Generous) A lone tracker from the high passes.'))
      .toBe('A lone tracker from the high passes.');
  });

  it('leaves innocent prose alone — real parentheticals, and the word "tags" in the world', () => {
    const keep = [
      'He walked in (bleeding) and said nothing.',
      'She cut the tags from the bolt of cloth and sold it whole.',
      'He kept two things from the old life (a knife and a debt) and spoke of neither.',
      'A quiet man. He answers questions with questions.',
    ];
    for (const k2 of keep) expect(strip(k2)).toBe(k2);
  });
});

// The rarity marker (2026-08-27, designer: "so players can at a glance see how rare they would be").
// `value` is the MARK — the budget spent — and reads identically for a jackpot and a dud, so the
// marker reads SUBSTANCE instead, against a level baseline.
describe('the rarity marker', () => {
  const mk = (tags: { concept: string; tier?: number }[], value: number, level?: number) =>
    ({ tags, value, character: level ? { level } : null } as never);

  it('separates two cards with the SAME mark but different substance', () => {
    const dud = mk([{ concept: 'character' }, { concept: 'melee', tier: 1 }], 100, 5);
    const jack = mk([{ concept: 'character' }, { concept: 'melee', tier: 9 }, { concept: 'lore', tier: 6 }], 100, 5);
    expect(unitWorth(dud)).toBeLessThan(unitWorth(jack));
    expect(unitStars(dud)).toBeLessThan(unitStars(jack));
    // the mark, which the board used to show, cannot tell them apart at all
    expect((dud as { value: number }).value).toBe((jack as { value: number }).value);
  });

  it('never rates someone by a NEGATIVE or cosmetic trait', () => {
    // a first pass ranked by raw tier and proudly starred a "legendary ugly"
    const ugly = mk([{ concept: 'character' }, { concept: 'ugly', tier: 18 }], 100, 5);
    expect(unitPeak(ugly)).toBeNull();
    const tall = mk([{ concept: 'character' }, { concept: 'tall', tier: 5 }], 100, 5);
    expect(unitPeak(tall)).toBeNull();
    const real = mk([{ concept: 'character' }, { concept: 'ugly', tier: 18 }, { concept: 'melee', tier: 4 }], 100, 5);
    expect(unitPeak(real)?.concept).toBe('melee');
  });

  it('is level-relative — the same tags mean less on a higher-level person', () => {
    const tags = [{ concept: 'character' }, { concept: 'melee', tier: 5 }];
    expect(unitStars(mk(tags, 100, 3))).toBeGreaterThan(unitStars(mk(tags, 100, 20)));
  });

  it('rates a card with no level at all, from its mark', () => {
    const relic = mk([{ concept: 'relic' }, { concept: 'melee', tier: 6 }], 120);
    expect(unitStars(relic)).toBeGreaterThanOrEqual(0);
    expect(unitWorth(relic)).toBeGreaterThan(0);
  });
});
