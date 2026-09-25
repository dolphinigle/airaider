// A soldier who held something at one saga step is not in the next unless sent. The report writer
// got the raw saga record, so "Keesa holds the button" reached a finale whose only soldier was
// Tun-Zeeus, and Keesa walked into the scene (playtest 2026-09-25).
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import type { ResolveQuestInput, ResolveQuestOut } from '../src/ai/provider.js';

class ResolveSpy extends MockProvider {
  inputs: ResolveQuestInput[] = [];
  override resolve(i: ResolveQuestInput[], onEach?: (o: ResolveQuestOut) => void) { this.inputs.push(...i); return super.resolve(i, onEach) }
}

describe('the saga record a report is given', () => {
  it('names only the soldiers actually sent', async () => {
    const ai = new ResolveSpy();
    const g = new Game(ai, 11);
    g.build('map-room'); g.build('lead-room');
    const story = g.visibleLeads().find(l => l.chainInfo.kind === 'starts-new')!;
    const r = await g.pursue(story.id);
    // a third soldier who stays home
    const stayed = structuredClone(g.roster()[1]!);
    stayed.id = 'c-home'; stayed.name = 'Zedric Tallow';
    g.state.cards.push(stayed);
    g.autoAssign(r.questId!);
    const q = g.state.quests.find(x => x.id === r.questId)!;
    expect(q.slots.every(s => s.filledBy && s.filledBy !== stayed.id)).toBe(true);
    g.state.chains.at(-1)!.story.actorStates = { button: `${stayed.name} holds the button` };
    await g.endCycle();
    const inp = ai.inputs.find(x => x.questId === r.questId);
    expect(inp).toBeDefined();
    const text = JSON.stringify((inp as unknown as { chainContext?: { storyState?: unknown } }).chainContext?.storyState ?? {});
    expect(text).not.toContain(stayed.name.split(' ')[0]!);
    expect(text).toContain('the party holds the button');
  });
});
