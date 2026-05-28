import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { newRoster, loadRoster, saveRoster } from '../src/roster.js';
import {
  BOND_THRESHOLD, bondedPairsOf, pairKey, recordCoDeployment,
} from '../src/bonds.js';
import { computePartySynergy, resolveScenario, type Assignment } from '../src/resolver.js';
import { rngFromString } from '../src/rng.js';
import { MockScenarioLLM } from '../src/llm/mock.js';
import { loadDay, resolveDay } from '../src/day.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'fixtures', '.tmp-bonds-roster.json');

describe('M6.2 co-deployment bonds', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

  it('pairKey is symmetric', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'));
    expect(pairKey('b', 'a')).toBe('a|b');
  });

  it('records co-deployment counters on both sides', () => {
    const roster = newRoster([...mercs.values()]);
    const r = recordCoDeployment(roster, ['marek', 'imogen']);
    expect(r).toEqual([]); // 1 < 3
    expect(roster.states.get('marek')!.coDeployments['imogen']).toBe(1);
    expect(roster.states.get('imogen')!.coDeployments['marek']).toBe(1);
  });

  it('emits exactly one bond-formation when both sides cross the threshold', () => {
    const roster = newRoster([...mercs.values()]);
    // First two deployments: no bonds.
    expect(recordCoDeployment(roster, ['marek', 'imogen'])).toEqual([]);
    expect(recordCoDeployment(roster, ['marek', 'imogen'])).toEqual([]);
    // Third crosses threshold → one bond formed.
    const formed = recordCoDeployment(roster, ['marek', 'imogen']);
    expect(formed).toHaveLength(1);
    expect(formed[0]).toMatchObject({ mercA: 'imogen', mercB: 'marek' }); // alpha-sorted
    // Fourth co-deployment must NOT re-emit a bond.
    expect(recordCoDeployment(roster, ['marek', 'imogen'])).toEqual([]);
  });

  it('bondedPairsOf reports exactly the bonded pairs', () => {
    const roster = newRoster([...mercs.values()]);
    for (let i = 0; i < BOND_THRESHOLD; i++) recordCoDeployment(roster, ['marek', 'dren']);
    const b = bondedPairsOf(roster);
    expect(b.has(pairKey('marek', 'dren'))).toBe(true);
    expect(b.has(pairKey('marek', 'imogen'))).toBe(false);
  });

  it('resolver synergy counts a bonded pair as +1 even without shared pers:/temp:', async () => {
    // imogen + roselle share neither pers:/temp:; verify baseline = 0 synergy, then injected bond = +1.
    const a: Assignment[] = [
      { slotId: 's1', merc: mercs.get('imogen')! },
      { slotId: 's2', merc: mercs.get('roselle')! },
    ];
    const baseline = computePartySynergy(a);
    expect(baseline.bonusCoins).toBe(0);
    const bonded = new Set([pairKey('imogen', 'roselle')]);
    const withBond = computePartySynergy(a, bonded);
    expect(withBond.bonusCoins).toBe(1);
    expect(withBond.pairs[0]!.sharedTagId).toBe('bond:trusts');
  });

  it('day loop surfaces bondsFormed and threads bonded pairs into synergy on later days', async () => {
    const roster = newRoster([...mercs.values()]);
    // Pre-seed marek+roselle co-deployments to BOND_THRESHOLD-1 so day-01 (scenario 1: marek+roselle) forms the bond.
    roster.states.get('marek')!.coDeployments['roselle'] = BOND_THRESHOLD - 1;
    roster.states.get('roselle')!.coDeployments['marek'] = BOND_THRESHOLD - 1;
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(), roster,
    });
    expect(r.bondsFormed.length).toBeGreaterThanOrEqual(1);
    const found = r.bondsFormed.find(
      (b) => pairKey(b.mercA, b.mercB) === pairKey('marek', 'roselle'),
    );
    expect(found).toBeDefined();
  });

  it('roster JSON v5 → v6 migration defaults coDeployments to empty', () => {
    const v5Roster = {
      schemaVersion: 5,
      dayCount: 0, gold: 0, reputation: {},
      rosterMercIds: ['marek'], generatedMercs: [],
      mercStates: [{ id: 'marek', fatigue: 0, hpDamage: 0, veterancyGain: 0, xp: 4, tier: 'rookie' }],
      captives: [], deceased: [], activeQuests: [], completedQuests: [], pendingErrands: [],
    };
    writeFileSync(TMP, JSON.stringify(v5Roster), 'utf8');
    try {
      const loaded = loadRoster(TMP, mercs, tags);
      expect(loaded.states.get('marek')!.coDeployments).toEqual({});
      saveRoster(TMP, loaded, mercs);
      const onDisk = JSON.parse(readFileSync(TMP, 'utf8'));
      expect(onDisk.schemaVersion).toBe(6);
      expect(onDisk.mercStates[0].coDeployments).toEqual({});
    } finally {
      if (existsSync(TMP)) rmSync(TMP);
    }
  });

  it('roster-less day loop emits empty bondsFormed', async () => {
    const day = loadDay(join(ROOT, 'fixtures', 'day-01.json'));
    const r = await resolveDay({
      day, dayPath: join(ROOT, 'fixtures', 'day-01.json'),
      mercs, llm: new MockScenarioLLM(),
    });
    expect(r.bondsFormed).toEqual([]);
  });
});
