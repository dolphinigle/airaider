import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { newRoster } from '../src/roster.js';
import {
  loadQuests,
  findStirrableQuests,
  stirQuest,
  advanceQuestsForScenario,
  carrierOf,
  findEnemyFactionStirrableQuests,
} from '../src/quests.js';
import type { Merc } from '../src/types.js';

const TAGS_PATH = fileURLToPath(new URL('../data/tags.json', import.meta.url));
const MERCS_PATH = fileURLToPath(new URL('../data/mercs.json', import.meta.url));
const QUESTS_PATH = fileURLToPath(new URL('../data/quests.json', import.meta.url));

describe('M5.2 quest arcs', () => {
  const tags = loadTags(TAGS_PATH);
  const mercs = loadMercs(MERCS_PATH, tags);
  const catalog = loadQuests(QUESTS_PATH);

  function mireMerc(): Merc {
    const base = mercs.get('roselle')!;
    return { ...base, id: 'roselle-mire', tags: [...base.tags, tags.get('pers:touched-by-the-mire')!] };
  }

  it('loads the Echoes of the Mire catalog', () => {
    const q = catalog.get('echoes-of-the-mire')!;
    expect(q).toBeDefined();
    expect(q.stages.length).toBe(3);
    expect(q.seededByTag).toBe('pers:touched-by-the-mire');
  });

  it('findStirrableQuests returns mire quest only when tag is carried', () => {
    const empty = newRoster([mercs.get('marek')!]);
    expect(findStirrableQuests(empty, catalog).length).toBe(0);
    const carrier = newRoster([mireMerc()]);
    const stirrable = findStirrableQuests(carrier, catalog);
    expect(stirrable.map((q) => q.id)).toContain('echoes-of-the-mire');
  });

  it('stirQuest activates at stage 0 and is idempotent', () => {
    const r = newRoster([mireMerc()]);
    const q = catalog.get('echoes-of-the-mire')!;
    stirQuest(r, q, carrierOf(r, q.seededByTag!));
    stirQuest(r, q, carrierOf(r, q.seededByTag!));
    expect(r.activeQuests.length).toBe(1);
    expect(r.activeQuests[0]!.stageIndex).toBe(0);
    expect(r.activeQuests[0]!.seededByMercId).toBe('roselle-mire');
  });

  it('advanceQuestsForScenario advances and completes', () => {
    const r = newRoster([mireMerc()]);
    const q = catalog.get('echoes-of-the-mire')!;
    stirQuest(r, q, 'roselle-mire');

    // Stage 0 scenario id = 'raid-06-mire'
    const a1 = advanceQuestsForScenario(r, 'raid-06-mire', catalog);
    expect(a1.advanced.length).toBe(1);
    expect(a1.advanced[0]!.toStage).toBe(1);

    // Unrelated scenario should NOT advance
    const a2 = advanceQuestsForScenario(r, 'raid-01', catalog);
    expect(a2.advanced.length).toBe(0);

    // Stage 1 scenario
    const a3 = advanceQuestsForScenario(r, 'raid-09-mire-shrine', catalog);
    expect(a3.advanced[0]!.toStage).toBe(2);

    // Final stage completes
    const a4 = advanceQuestsForScenario(r, 'raid-10-mire-confrontation', catalog);
    expect(a4.completed.length).toBe(1);
    expect(r.activeQuests.length).toBe(0);
    expect(r.completedQuests.length).toBe(1);
    expect(r.gold).toBe(q.rewardOnComplete.goldDelta);
    expect(r.reputation[q.rewardOnComplete.reputationGain]).toBe(1);
  });

  it('does not re-stir a completed quest', () => {
    const r = newRoster([mireMerc()]);
    const q = catalog.get('echoes-of-the-mire')!;
    stirQuest(r, q, 'roselle-mire');
    advanceQuestsForScenario(r, 'raid-06-mire', catalog);
    advanceQuestsForScenario(r, 'raid-09-mire-shrine', catalog);
    advanceQuestsForScenario(r, 'raid-10-mire-confrontation', catalog);
    expect(findStirrableQuests(r, catalog).length).toBe(0);
  });
});

describe('M13.1 enemy-faction quest auto-stir', () => {
  const tags = loadTags(TAGS_PATH);
  const mercs = loadMercs(MERCS_PATH, tags);
  const catalog = loadQuests(QUESTS_PATH);

  it('loads lowmark-bounty quest with seededByEnemyFaction', () => {
    const q = catalog.get('lowmark-bounty')!;
    expect(q).toBeDefined();
    expect(q.seededByEnemyFaction).toBe('lowmark-guild');
  });

  it('returns lowmark-bounty when lowmark-guild is in enemy list', () => {
    const r = newRoster([mercs.get('marek')!]);
    const stirrable = findEnemyFactionStirrableQuests(r, catalog, ['lowmark-guild']);
    expect(stirrable.map((q) => q.id)).toContain('lowmark-bounty');
  });

  it('returns nothing when no enemy factions are passed', () => {
    const r = newRoster([mercs.get('marek')!]);
    expect(findEnemyFactionStirrableQuests(r, catalog, []).length).toBe(0);
  });

  it('skips quests already active or completed', () => {
    const r = newRoster([mercs.get('marek')!]);
    const q = catalog.get('lowmark-bounty')!;
    stirQuest(r, q, undefined);
    expect(findEnemyFactionStirrableQuests(r, catalog, ['lowmark-guild']).length).toBe(0);
  });

  it('ignores tag-only quests even if their tag isn\'t carried', () => {
    const r = newRoster([mercs.get('marek')!]);
    const stirrable = findEnemyFactionStirrableQuests(r, catalog, ['lowmark-guild']);
    // echoes-of-the-mire has only seededByTag, not seededByEnemyFaction
    expect(stirrable.map((q) => q.id)).not.toContain('echoes-of-the-mire');
  });
});
