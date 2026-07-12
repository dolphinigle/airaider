// One-shot importer: filters Fort of Chains name corpora into src/engine/names_data.ts.
// FoC (GPL-3) compiled these from public sources (UESP Elder Scrolls lore name lists,
// Kroket93 fantasy-name-generator, LukeMS lua-namegen). Whole curated names beat syllable
// mad-libs — every output is a word a human already vetted (the 2026-07-12 names ruling).
// Deterministic: filter → dedupe → even-stride sample, so re-runs emit identical files.
// Usage: npx tsx scripts/_importnames.ts [focNamesDir]

import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = process.argv[2] ?? '/home/irvan/Pictures/fort-of-chains-master/src/scripts/names';

function load(file: string): string[] {
  const txt = fs.readFileSync(path.join(DIR, file), 'utf8');
  const names: string[] = [];
  for (const m of txt.matchAll(/["']([A-Za-z' -]{2,24})["'],?\s*$/gm)) names.push(m[1]!.trim());
  return names;
}

function stride<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * arr.length) / n)]!);
  return out;
}

// modern-recognizable names read as immersion breaks ('Bob', 'Olivia' in a low-medieval fort)
const MODERN = new Set(`bob bill tom jack james john robert michael david william richard joseph
charles thomas daniel matthew anthony mark steven paul andrew joshua kevin brian george edward
ronald timothy jason jeffrey ryan gary nicholas eric jacob jonathan larry justin scott brandon
benjamin samuel frank gregory raymond alexander patrick dennis jerry tyler aaron henry adam peter
nathan zachary walter kyle harold carl jeremy keith roger arthur terry sean austin ethan jesse
christian albert bryan bruce ralph roy eugene louis wayne alan juan hugh oliver oscar leo max
felix victor martin simon marc michel andre anders aron barrett bertie christoph armando alain
mary patricia jennifer linda elizabeth barbara susan jessica sarah sara karen nancy lisa betty
margaret sandra ashley kimberly emily donna michelle dorothy carol amanda melissa deborah
stephanie rebecca sharon laura cynthia kathleen amy angela shirley anna brenda pamela emma nicole
helen samantha katherine christine debra rachel carolyn janet catherine maria heather diane ruth
julie olivia joyce virginia victoria kelly lauren christina joan evelyn judith megan andrea
cheryl hannah jacqueline martha gloria teresa ann madison frances kathryn janice jean abigail
alice julia judy sophia grace denise amber doris marilyn danielle beverly isabella theresa diana
natalie brittany charlotte rose alexis kayla adele adrienne nadine lucille muriel mona gemma
rochelle melodie melody chloe zoe mia ava lily ella nora hazel violet stella lucy claire audrey
ivy fiona vera vittoria allen alcock
agamemnon achilles hector priam odysseus ajax cassandra helen menelaus orestes electra oedipus
perseus theseus heracles hercules apollo zeus hera athena aphrodite artemis hermes poseidon hades
lancelot gawain merlin guinevere roland caesar brutus cicero nero augustus cleopatra
balgruuf ulfric tullius delphine esbern alduin ralof hadvar lydia aela farkas vilkas kodlak
astrid cicero serana isran maven brynjolf mercer karliah madanach elisif torygg rikke galmar
vivec almalexia dagoth caius fargoth sheogorath jyggalag haskill martin uriel mankar lucien
nazeem ysgramor olaf tiber talos akatosh dibella kynareth stendarr arkay julianos zenithar
azura boethiah hircine malacath mehrunes meridia molag namira nocturnal peryite sanguine
vaermina hermaeus
sulla marius crassus pompey cato scipio hannibal leonidas pericles themistocles alcibiades
lysander xerxes darius cyrus euryleon achates aeneas romulus remus spartacus plato socrates
aristotle homer virgil ovid seneca plutarch herodotus`.split(/\s+/));

const seenAll = new Set<string>();
function build(file: string, n: number, opts: { maxLen?: number; hyphen?: boolean; genderEnd?: 'm' | 'f' } = {}): string[] {
  const maxLen = opts.maxLen ?? 9;
  const re = opts.hyphen ? /^[A-Z][a-z]+(-[A-Z][a-z]+)?$/ : /^[A-Z][a-z]+$/;
  const seen = new Set<string>();
  const ok = load(file).filter(x =>
    re.test(x) && x.length >= 4 && x.length <= maxLen &&
    !/(.)\1\1/.test(x) &&                       // no letter pile-ups
    !/^[^aeiouAEIOUy]{3}/.test(x) &&            // 3+ leading consonants is unpronounceable ('Wlveva')
    !MODERN.has(x.toLowerCase()) &&
    // human lists mix in Latin family names and surnames — the ENDING carries perceived gender
    // for an English eye regardless of the corpus's intent (the elf-suffix lesson, applied at
    // import): female names must WEAR a feminine ending; males must not.
    (opts.genderEnd !== 'f' || /([aeiy]|wen|yn|nn|id|eth|il)$/.test(x)) &&
    (opts.genderEnd !== 'm' || !/(a|ette|elle|ine|enne)$/.test(x)) &&
    !/cock/i.test(x) &&
    // consonant clusters alien to an English eye read as typos in HUMAN names ('Martxot')
    (opts.genderEnd === undefined || !/tx|tz|zk|xh|q(?!u)/i.test(x)) &&
    // embedded English words derail the eye ('Celelruin' reads as ruin; worse exists)
    !/ruin|rape|anus|arse|shit|piss|fart|dick|slut|butt|crap/i.test(x) &&
    !seen.has(x) && !seenAll.has(x) &&          // unique within pool AND across races
    (seen.add(x), true));
  const picked = stride(ok, n);
  for (const p of picked) seenAll.add(p);
  console.log(`${file}: ${ok.length} pass filter → ${picked.length} sampled`);
  return picked;
}

const pools = {
  HUMAN_M: build('_fantasy_male_first_name.js', 700, { genderEnd: 'm' }),
  HUMAN_F: build('_fantasy_female_first_name.js', 700, { genderEnd: 'f' }),
  ELF_M: build('_elf_male_first_name.js', 500, { maxLen: 11 }),
  ELF_F: build('_elf_female_first_name.js', 500, { maxLen: 11 }),
  WOLF_M: build('_werewolf_male_first_name copy.js', 400, { maxLen: 10 }),
  WOLF_F: build('_werewolf_female_first_name.js', 350, { maxLen: 10 }),
  LIZARD_M: build('_lizardkin_male_first_name.js', 300, { maxLen: 12, hyphen: true }),
  LIZARD_F: build('_lizardkin_female_first_name.js', 300, { maxLen: 12, hyphen: true }),
};

const header = `// GENERATED by scripts/_importnames.ts — do not hand-edit (re-run the script instead).
// Whole curated first names per race+gender (the 2026-07-12 names ruling: no syllable mad-libs).
// Filtered from Fort of Chains (GPL-3) name corpora, themselves compiled from public sources:
// UESP Elder Scrolls lore name lists, Kroket93 fantasy-name-generator, LukeMS lua-namegen.
`;
const body = Object.entries(pools).map(([k, v]) =>
  `export const ${k}: string[] = [\n${chunk(v).map(line => `  ${line}`).join('\n')}\n];`).join('\n\n');
function chunk(names: string[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < names.length; i += 10)
    lines.push(names.slice(i, i + 10).map(x => `'${x}'`).join(', ') + ',');
  return lines;
}
fs.writeFileSync('src/engine/names_data.ts', header + '\n' + body + '\n');
console.log('→ src/engine/names_data.ts written');
