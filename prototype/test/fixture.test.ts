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

const FIXTURES = [
  'raid-01.json',
  'raid-02-recruit.json',
  'raid-03-captive.json',
  'raid-04-build.json',
  'raid-05-tavern.json',
  'raid-06-mire.json',
  'raid-07-plague.json',
  'raid-08-tax-riot.json',
];

/**
 * Golden-file snapshot test. The committed transcript-mock.json files are the
 * source of truth; if a snapshot changes, the test will fail and you must
 * intentionally regenerate via:
 *   npm run scenario -- fixtures/<name>.json
 */
describe('fixture snapshots (mock)', () => {
  const tags = loadTags(join(ROOT, 'data', 'tags.json'));
  const mercs = loadMercs(join(ROOT, 'data', 'mercs.json'), tags);

  for (const fname of FIXTURES) {
    it(`${fname} matches its committed mock transcript`, async () => {
      const fixture = loadScenario(join(ROOT, 'fixtures', fname));
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

      const goldenPath = join(
        ROOT,
        'fixtures',
        fname.replace(/\.json$/, '.transcript-mock.json'),
      );
      if (!existsSync(goldenPath)) {
        throw new Error(
          `Golden transcript missing at ${goldenPath}. Generate with: npm run scenario -- fixtures/${fname}`,
        );
      }
      const expected = JSON.parse(readFileSync(goldenPath, 'utf8'));
      expect(actual).toEqual(expected);
    });
  }
});
