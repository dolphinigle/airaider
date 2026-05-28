import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

import { loadTags } from '../src/tags.js';
import { loadMercs } from '../src/mercs.js';
import { loadScenario } from '../src/scenarios.js';
import { resolveScenario, type Assignment } from '../src/resolver.js';
import { rngFromString } from '../src/rng.js';
import { MockScenarioLLM } from '../src/llm/mock.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Golden-file snapshot test. The committed transcript-mock.json is the
 * source of truth; if it changes, the test will fail and you must intentionally
 * regenerate by running `npm run scenario fixtures/raid-01.json`.
 */
describe('fixture: raid-01 (mock)', () => {
  it('matches the committed mock transcript exactly', async () => {
    const tags = loadTags(join(ROOT, 'data', 'tags.json'));
    const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);
    const fixture = loadScenario(join(ROOT, 'fixtures', 'raid-01.json'));

    const assignments: Assignment[] = fixture.assignments!.map((a) => ({
      slotId: a.slotId,
      merc: mercs.get(a.mercId)!,
    }));

    const actual = await resolveScenario({
      scenario: fixture,
      assignments,
      llm: new MockScenarioLLM(),
      rng: rngFromString(fixture.seed!),
    });

    const goldenPath = join(ROOT, 'fixtures', 'raid-01.transcript-mock.json');
    if (!existsSync(goldenPath)) {
      throw new Error(
        `Golden transcript missing at ${goldenPath}. Generate with: npm run scenario fixtures/raid-01.json`,
      );
    }
    const expected = JSON.parse(readFileSync(goldenPath, 'utf8'));
    expect(actual).toEqual(expected);
  });
});
