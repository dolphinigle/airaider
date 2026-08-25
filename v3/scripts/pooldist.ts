// throwaway: head-noun / main-verb distribution + near-duplicate scan over MOTIVES2 tells
import { MOTIVES2 } from './motives2.js';
const DET = new Set(['the','a','an','his','her','its','their','every','both','no','one','two','three','there','that','this','what','which','more','nothing','somebody','someone','everyone','all','half','none','it','they','he','she']);
const STOP = new Set([...DET,'is','are','was','were','has','have','had','been','be','of','in','on','at','to','and','but','from','with','by','for','not','already','still','only','out','up','down','over','off','so','than','as','while','when','before','after','into','through','without','about','round','across','past','under','near','same','own','new','old','clean','well','very','just','too','yet','then','there','you','your','him','them','himself','herself','itself']);
const VERBS = /^(is|are|was|were|has|have|had|comes?|come|goes?|go|runs?|run|stands?|stand|sits?|sit|knows?|know|asks?|ask|says?|say|tells?|tell|wants?|want|brings?|bring|gives?|give|takes?|take|puts?|put|keeps?|keep|holds?|hold|carries|carry|hands?|hand|shows?|show|names?|name|describes?|describe|counts?|count|walks?|walk|watches|watch|waits?|wait|points?|point|steps?|step|opens?|open|sends?|send|marks?|mark|pays?|pay|leaves?|leave|starts?|start|balks?|sounds?|sound|rings?|ring|wears?|wear|smells?|smell|eats?|eat|lifts?|lift|does|do|can|cannot|will|loads?|load|pushes?|push|swaps?|swap|reaches?|reach|hangs?|hang|stops?|stop|fell|fall[s]?)$/;
type Row = { head: string; verb: string; tell: string };
const rows: Row[] = MOTIVES2.map(m => {
  const w = m.tell.toLowerCase().replace(/[^a-z\s']/g,' ').split(/\s+/).filter(Boolean);
  const head = w.find(x => !DET.has(x)) ?? w[0]!;
  const hi = w.indexOf(head);
  const verb = w.slice(hi+1).find(x => VERBS.test(x)) ?? w.slice(hi+1).find(x => !STOP.has(x)) ?? '-';
  return { head, verb, tell: m.tell };
});
const heads = new Map<string,number>(); const verbs = new Map<string,number>(); const pairs = new Map<string,Row[]>();
for (const r of rows) { heads.set(r.head,(heads.get(r.head)??0)+1); verbs.set(r.verb,(verbs.get(r.verb)??0)+1);
  const k = r.head+'|'+r.verb; (pairs.get(k) ?? pairs.set(k,[]).get(k)!).push(r); }
console.log(`tells=${rows.length}  distinct head nouns=${heads.size}  distinct main verbs=${verbs.size}`);
console.log('top heads:', [...heads].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([h,n])=>`${h}x${n}`).join(' '));
console.log('top verbs:', [...verbs].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([h,n])=>`${h}x${n}`).join(' '));
const near = [...pairs.values()].filter(v => v.length > 1);
console.log(`\nNEAR-DUP (same head noun + same main verb): ${near.length} groups, ${near.reduce((a,b)=>a+b.length,0)} tells`);
for (const g of near) console.log('  * ' + g.map(r=>`${r.head}/${r.verb}: ${r.tell}`).join('\n    '));
// opener-formula census
const op = (re: RegExp) => MOTIVES2.filter(m => re.test(m.tell)).length;
console.log(`\nformula census: "he/she asks"=${op(/\b(he|she) asks\b/)}  "does not"=${op(/\bdoes not\b/)}  "already"=${op(/\balready\b/)}  starts "he "=${op(/^he\b/)}  starts "the "=${op(/^the\b/)}`);
