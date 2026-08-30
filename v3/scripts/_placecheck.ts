import { THINGS, OCCASIONS, PEOPLE, UNCANNY, MOODS, BOND, TIE, QUALITIES } from '../src/ai/keywords.js';
const WANT = ['tavern','city','town','village','market','inn','fair','road','crossroads','ford','bridge',
  'well','mill','church','chapel','shrine','harbour','harbor','dock','camp','farm','barn','forge','smithy',
  'gate','wall','square','street','alley','hall','yard','stable','granary','pasture','wood','river'];
const pools: [string,string[]][] = [['THINGS',THINGS],['OCCASIONS',OCCASIONS],['PEOPLE',PEOPLE],
  ['UNCANNY',UNCANNY],['MOODS',MOODS],['BOND',BOND],['TIE',TIE],['QUALITIES',QUALITIES]];
const found: Record<string,string[]> = {};
for (const w of WANT) for (const [n,p] of pools) if (p.includes(w)) (found[w] ??= []).push(n);
console.log('PLACE words present:', Object.entries(found).map(([w,ps])=>`${w}(${ps.join('/')})`).join(' ') || 'NONE');
console.log('\nPLACE words MISSING:', WANT.filter(w=>!found[w]).join(' '));
