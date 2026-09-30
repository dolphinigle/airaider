// The player's campaign direction (Settings): free text → trait preferences the ENGINE applies to its
// identity rolls (designer 2026-09-30: "'Generate males for npcs' … preferences for traits not just sex").
import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { MockProvider } from '../src/ai/mock.js';
import { generateCard, prefPick } from '../src/engine/economy.js';
import { Rng } from '../src/engine/rng.js';

const has = (c: any, t: string) => c.tags.some((x: any) => x.concept === t);

describe('campaign direction', () => {
  it('reads trait wishes (mock reader) and keeps only known ids', async () => {
    const g = new Game(new MockProvider(5), 5);
    const r = await g.setDirection('Dark fantasy. Make the NPCs men, mostly elves. No lizardfolk. Also dragons.');
    expect(r.ok).toBe(true);
    const d = g.direction()!;
    expect(d.npc.prefer).toEqual(expect.arrayContaining(['male', 'elf']));
    expect(d.npc.avoid).toContain('lizardman');
    expect(d.npc.prefer).not.toContain('dragon');
  });

  it('the engine rolls strangers the way the player asked: one preferred sex/race always, avoided never', async () => {
    const g = new Game(new MockProvider(5), 5);
    await g.setDirection('NPCs are men and elves. No lizardfolk.');
    for (let i = 0; i < 30; i++) {
      const c = (g as any).freshCharacter('npc', 3, 50, 'forests');
      expect(has(c, 'male')).toBe(true);
      expect(has(c, 'elf')).toBe(true);
      expect(has(c, 'lizardman')).toBe(false);
    }
  });

  it('generateCard: avoided tags never roll; preferred ones roll far more often', () => {
    const rng = new Rng(9);
    let pref = 0, base = 0;
    for (let i = 0; i < 200; i++) {
      const a = generateCard(rng, { domain: 'character', targetV: 80, contentLevel: 4, role: 'npc', prefs: { prefer: ['beautiful'], avoid: ['ugly', 'female'] } });
      expect(has(a, 'ugly')).toBe(false);
      expect(has(a, 'female')).toBe(false);
      if (has(a, 'beautiful')) pref++;
      const b = generateCard(rng, { domain: 'character', targetV: 80, contentLevel: 4, role: 'npc' });
      if (has(b, 'beautiful')) base++;
    }
    expect(pref).toBeGreaterThan(base * 2);
  });

  it('prefPick falls back when everything is avoided', () => {
    expect(prefPick(new Rng(1), ['male', 'female'], { prefer: [], avoid: ['male', 'female'] })).toMatch(/male/);
  });

  it('survives save/load and clears', async () => {
    const g = new Game(new MockProvider(5), 5);
    await g.setDirection('Lighthearted. More playful recruits.');
    const g2 = Game.load(new MockProvider(5), g.save());
    expect(g2.direction()?.recruit.prefer).toContain('playful');
    expect((await g2.setDirection('')).ok).toBe(true);
    expect(g2.direction()).toBeNull();
  });
});
