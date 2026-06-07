// HEAD-TO-HEAD: does seeding genesis with 3-4 random KEYWORDS beat a concrete PREMISE?
// Same focal per row, three seed styles. Read the situations and judge variety / coherence / "canned-ness".
import { readFileSync } from 'node:fs';
import { GameEngine } from './core/game.js';
import { generateCharacter } from './core/economy.js';
import { tagLabels } from './core/ai.js';
import { rngFrom } from './core/rng.js';
import { PREMISES, pickPlace } from './core/seeds.js';
const key = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/OPENAI_API_KEY=(.+)/)![1].trim();
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

// keyword pools by register (so a structured draw gives coherent fuel: one bond + one tie + one flavour)
const BOND = ['love', 'jealousy', 'grief', 'betrayal', 'loyalty', 'revenge', 'forgiveness', 'shame', 'devotion', 'obsession', 'estrangement', 'reunion', 'rivalry', 'guilt', 'mercy', 'longing', 'pride', 'spite'];
const TIE  = ['debt', 'bondage', 'exile', 'heresy', 'oath', 'blackmail', 'smuggling', 'desertion', 'impersonation', 'pilgrimage', 'sacrifice', 'inheritance', 'feud', 'theft', 'ransom', 'escape', 'rebellion', 'secret-marriage', 'kidnapping', 'succession'];
const FLAV = ['werewolf', 'a curse', 'a ghost', 'a witch', 'a relic', 'a miracle', 'an omen', 'plague', 'famine', 'the drowned dead', 'a fae bargain', 'a prophecy', 'a haunting', 'a bog-body', "a saint's bones", 'a changeling', 'a twin', 'a bastard heir', 'a hidden letter', 'leprosy', 'madness', 'fire'];
const FLAT = [...BOND, ...TIE, ...FLAV];
const pick = (a: string[], r: () => number) => a[Math.floor(r() * a.length)];
const pick3 = (a: string[], r: () => number) => { const o = new Set<string>(); while (o.size < 3) o.add(pick(a, r)); return [...o]; };

const eng = await GameEngine.create({ provider: 'openai', apiKey: key, seed: 'kw' });
const N = Number(process.argv[2] || 5);
const rows = await Promise.all(Array.from({ length: N }, (_, i) => i).map(async (i) => {
  const r = rngFrom(`kw-${i}`);
  const gen = generateCharacter(r, { targetValue: 90, level: 2 });
  const focalTags = [tagLabels(gen.tags)];
  const place = pickPlace(r);
  const premise = PREMISES[Math.floor(r() * PREMISES.length)];
  const flatKw = pick3(FLAT, r);
  const structKw = [pick(BOND, r), pick(TIE, r), pick(FLAV, r)];
  const seeds = {
    A_premise: `PREMISE (build the saga around this; adapt to the core person): "${premise}"`,
    B_kw_flat: `THEMES — invent an ORIGINAL premise that fuses these into the core person's life (adapt freely): ${flatKw.join(', ')}`,
    C_kw_struct: `THEMES — invent an ORIGINAL premise that fuses these into the core person's life (adapt freely): ${structKw.join(', ')}`,
  };
  const gens = await Promise.all(Object.entries(seeds).map(async ([label, seed]) => {
    const g: any = await eng.ai.genesis({ focalTags, region: 'the Ashmoor hills', rarity: 'uncommon', seed, place });
    return { label, seed, title: g.title, blurb: strip(g.leadBlurb || ''), situation: strip(g.situation || '') };
  }));
  return { i, tags: focalTags[0].join(', '), place, premise, flatKw, structKw, gens };
}));
for (const row of rows) {
  console.log(`\n\n========== FOCAL ${row.i}  [${row.tags}]  @ ${row.place} ==========`);
  for (const g of row.gens) {
    console.log(`\n--- ${g.label} ---`);
    console.log(`seed: ${g.seed.replace(/^[A-Z ]+\([^)]*\): /, '').replace(/^THEMES — [^:]*: /, 'kw → ')}`);
    console.log(`title: ${g.title}`);
    console.log(`blurb: ${g.blurb}`);
    console.log(`situation: ${g.situation.slice(0, 300)}`);
  }
}
