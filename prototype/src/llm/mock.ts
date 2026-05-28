import type { ScenarioLLM, ScenarioLLMRequest, ScenarioLLMNarration } from './interface.js';
import type { OutcomeBand } from '../types.js';

/**
 * Deterministic mock — produces canned narration based on inputs.
 * Used for snapshot tests; NEVER calls the network. Output is a function of
 * the request alone so identical fixtures yield identical transcripts.
 */
export class MockScenarioLLM implements ScenarioLLM {
  readonly name = 'mock';

  async narrate(req: ScenarioLLMRequest): Promise<ScenarioLLMNarration> {
    const contributions = req.party.map(({ merc, assignedSlotId }) => {
      const slot = req.slots.find((s) => s.id === assignedSlotId);
      const tag = merc.tags[0]?.label ?? 'plain';
      const desc = slot?.description ?? assignedSlotId;
      return {
        mercId: merc.id,
        line: `[mock] ${merc.name} (${tag}) takes on "${desc}".`,
      };
    });
    return {
      contributions,
      outcomeNarrative: mockOutcome(req.band, req.scenarioTarget),
    };
  }
}

function mockOutcome(band: OutcomeBand, target: string): string {
  switch (band) {
    case 'catastrophic':
      return `[mock] The attempt collapses. ${target} — not today, and there is a cost.`;
    case 'unfavorable':
      return `[mock] A bruised partial; ${target} slips half-grasped, but no one is broken.`;
    case 'favorable':
      return `[mock] The party brings it off cleanly: ${target}.`;
    case 'catastrophic-favorable':
      return `[mock] A god-touched day — ${target}, and then some. The fort will hear of this.`;
  }
}
