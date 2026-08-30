// The context-free verifier gate, for the archetype×method design. Emits the FULL rendered system
// prompt for both one-off registers, plus every archetype×method combination the engine can deal,
// so a zero-context reader can judge whether these produce varied, sensible quests.
import * as fs from 'node:fs';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { ARCHETYPE_NAMES, glossOf, methodsOf, ruleOf } from '../src/engine/archetypes.js';
import type { Lead } from '../src/engine/quests.js';

async function render(archetype: string, rarity: 'common' | 'rare') {
  const g = new Game(makeOpenAiProvider(), 7);
  g.build('map-room');
  let cap: { system: string; user: string } | null = null;
  const orig: any = (g as any).ai;
  (g as any).ai = new Proxy(orig, { get(t: any, p: any) {
    if (p === 'writeQuest') return async (...a: any[]) => { const out = await t[p](...a);
      const rec = g.ai.callLog().at(-1); if (rec) cap = { system: rec.systemPreview, user: rec.userPrompt }; return out };
    if (p === 'callLog' || p === 'usage') return t[p].bind(t);
    return t[p];
  }});
  const lead: Lead = { id: 'x', rarity, level: 2, region: 'forests', archetype: archetype as never,
    chainInfo: { kind: 'none' }, expiresAtCycle: null, source: 'reward' };
  g.state.leads.push(lead);
  await g.pursue('x');
  return cap;
}

const out: string[] = ['# One-off quest prompts — the archetype × method design', ''];
for (const [label, rarity] of [['LIGHT (a small, everyday job — most cards)', 'common'], ['HEAVY (a serious matter / grave affair)', 'rare']] as const) {
  const c = await render('lead-hunt', rarity);
  out.push(`## THE ${label} SYSTEM PROMPT, verbatim as sent`, '```', c?.system ?? '(none)', '```', '',
    `## its USER payload, verbatim`, '```json', c?.user ?? '(none)', '```', '');
}
out.push('## Every kind of work, and every way it can be done', '',
  'The engine deals ONE method per card. The gloss says what KIND of work it is; the method is what',
  'makes two cards of the same kind different. A separate KEYWORDS field supplies concrete nouns',
  '(tavern, ford, mill, granary, brooch…) which the writer is meant to combine with the method.', '');
for (const a of ARCHETYPE_NAMES) {
  out.push(`### ${a}`, `intent : ${glossOf(a)}`,
    ruleOf(a) ? `rule   : ${ruleOf(a)}` : '',
    `methods: ${(methodsOf(a) ?? []).join(' · ') || '(none)'}`, '');
}
fs.writeFileSync(process.env.OUT ?? '/home/irvan/.claude/jobs/80974e3b/tmp/PROMPT_MATRIX.md', out.filter(l => l !== '').join('\n'));
console.log('written ·', ARCHETYPE_NAMES.length, 'archetypes');
