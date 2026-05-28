import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadDay, resolveDay } from '../src/day.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('day loop (M2)', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
  const dayPath = join(ROOT, 'fixtures', 'day-01.json');
  const day = loadDay(dayPath);

  async function run() {
    return resolveDay({ day, dayPath, mercs, llm: new MockScenarioLLM() });
  }

  it('accumulates fatigue across scenarios', async () => {
    const r = await run();
    // day-01: raid-01 (marek+roselle) → raid-03 (marek+veska) → raid-04 (veska+marek)
    expect(r.finalFatigue).toEqual({ marek: 3, roselle: 1, veska: 2 });
  });

  it('applies fatigue penalty when merc starts a scenario at fatigue ≥ 2', async () => {
    const r = await run();
    // Scenario 3 is raid-04: marek is at fatigue 2 going in (used in s1, s2).
    const s3 = r.scenarios[2]!;
    const marekContrib = s3.slotContributions.find((c) => c.mercId === 'marek')!;
    expect(marekContrib.fatigue).toBe(2);
    expect(marekContrib.fatiguePenalty).toBe(1);
    // raid-04 oversee slot: 1 base + 1 (W=4≥4) + 1 (temp:brave) = 3, minus 1 = 2.
    expect(marekContrib.coinsContributed).toBe(2);
  });

  it('no fatigue penalty for fresh mercs in earlier scenarios', async () => {
    const r = await run();
    const s1 = r.scenarios[0]!;
    for (const c of s1.slotContributions) {
      expect(c.fatigue).toBe(0);
      expect(c.fatiguePenalty).toBe(0);
    }
  });

  it('is deterministic across runs', async () => {
    const a = await run();
    const b = await run();
    expect(a).toEqual(b);
  });

  it('matches the committed day-mock golden if present', async () => {
    const goldenPath = join(ROOT, 'fixtures', 'day-01.day-mock.json');
    if (!existsSync(goldenPath)) {
      // Allow test to no-op if golden not generated yet (e.g. fresh checkout).
      return;
    }
    const actual = await run();
    const expected = JSON.parse(readFileSync(goldenPath, 'utf8'));
    expect(actual).toEqual(expected);
  });
});
