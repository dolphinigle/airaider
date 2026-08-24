// QUALITY REVIEWER — the readability lint. Log-only telemetry (single-shot ruling), but it is the
// thing that decides which defects I chase, so it must catch what actually makes a card unreadable.
//
// Designer 2026-08-24: "mark these weird things, because they make texts unreadable. it's like
// reading a textbook with jargon but the jargon isn't explained."
// The four causes traced for that batch (see PULL_LAB_LOG "jargon round"):
//   1. proper nouns dealt by the engine and stuffed in without introduction (locationLine hands the
//      writer a landmark AND a "Known ground:" token, and the prompt says "use its named places")
//   2. invented durations, because a rule demanded "how long it has stood so" and the payload
//      carries no duration field at all
//   3. coined compound trade names ("stone-warden", "ruin-keeper"), because no names are dealt and
//      "everyone goes by their trade" is the only vocabulary instruction
//   4. my own rule wording coming back as a template ("is left carrying it")
import type { QuestWriteInput } from '../src/ai/provider.js';

/** CALIBRATED on the 1,426 shipped official-English rite intros. Thresholds are set at the corpus
 *  p90/p95 so that gold-standard text PASSES — an early version used p75 and flagged the official
 *  "Boundless Sands" as too long, which would have driven our prompt shorter and flatter than the
 *  goal. Distribution: words p50 24 / p75 37 / p90 58 / p95 73 · sentences p50 2 / p90 4 / p95 5 ·
 *  w/sent p50 12.4 / p90 21.5 / p95 26 · proper nouns per intro p50 1 / p75 3 / p90 4 / max 9. */
export const TARGET = { words: 24, wordsP75: 37, sentences: 2, wordsPerSentence: 12 };

/** TWO FORMS, TWO DISTRIBUTIONS — judging both with one threshold failed the designer's own
 *  endorsed texts (65% pass). RITES are the assign-characters quests (our analogue): median 24w.
 *  EVENTS are the end-of-day choice cards the designer endorsed: median 46w, tail to 137w.
 *  Our generated cards are rites; the gold standard contains both. */
const CAPS = {
  // rite caps sit slightly above corpus p90 so the designer's own endorsed quests pass:
  // "Project Investment" is 59w at 29.5 w/sent. Official p95 is 73w / 26 w-per-sentence.
  rite:  { words: 62,  sentences: 4, wordsPerSentence: 30, properNouns: 5, places: 2 },
  event: { words: 140, sentences: 8, wordsPerSentence: 36, properNouns: 7, places: 3 },
};
export type CardForm = keyof typeof CAPS;

const DURATION = /\b(since|for|after)\s+(the\s+)?(last\s+)?(market|moon|dawn|dusk|nightfall|thaw|season|harvest|sabbath|(two|three|four|five|several|many)\s+(days?|nights?|dawns?|mornings?|weeks?|moons?|seasons?))\b/i;
const RULE_ECHO = [
  'is left carrying', 'left carrying it', 'bears the trouble', 'bears it', 'carries that trouble',
  'carries it', 'wants it put right', 'wants it fixed', 'set right', 'does not fit',
  'a trace of', 'while it lasts', 'no one can say', 'nobody can say',
];
/** trades that read as real jobs — a coinage outside this set is flagged, not banned */
const PLAIN_TRADES = new Set(['foreman','shepherd','ferryman','beekeeper','miller','smith','carter','drover','warden','guide','archer','sage','warrior','scout','hunter','trapper','oarsman','tinker','farmer','tenant','steward','reeve','herdsman','miner','logger','cutter','fisher','cook','maid','sergeant','captain','merchant','physician','scribe','priest','monk','widow','apprentice','boy','girl','woman','man']);

export interface Flag { code: string; detail: string }

export function lintCard(situation: string, input: QuestWriteInput, form: CardForm = 'rite'): Flag[] {
  const CAP = CAPS[form];
  const f: Flag[] = [];
  const s = situation.trim();
  const words = s.split(/\s+/).filter(Boolean);
  const sents = s.split(/(?<=[.!?…])\s+/).filter(x => x.trim());

  // ── LENGTH, against the official rite band (not against my own earlier guesses)
  if (words.length > CAP.words) f.push({ code: 'long', detail: `${words.length}w (official p90 ${CAP.words}, median ${TARGET.words})` });
  if (sents.length > CAP.sentences) f.push({ code: 'sentences', detail: `${sents.length} (official p90 ${CAP.sentences}, median ${TARGET.sentences})` });
  const wps = words.length / Math.max(1, sents.length);
  if (wps > CAP.wordsPerSentence) f.push({ code: 'long-sentences', detail: `${wps.toFixed(1)} w/sent (official p95 ${CAP.wordsPerSentence})` });

  // ── THE JARGON CLASS — unexplained proper nouns. This is the readability killer.
  const proper = [...new Set((s.match(/\b[A-Z][a-z]{2,}\b/g) ?? [])
    .filter(w => !/^(The|A|An|At|In|On|By|For|From|With|When|While|Their|They|You|Your|His|Her|It|Its|But|And|So|Now|One|Two|Three|No|Not|Nobody|Someone|Since|After|Before|Every|Each)$/.test(w))
    .filter(w => !new RegExp(`^${w}\\b`).test(s)))];   // sentence-initial words are not necessarily names
  // NOT a raw count — official intros carry a median of 1 and up to 9 proper nouns, so density
  // alone is not the defect. Flag only past the corpus p95.
  if (proper.length > CAP.properNouns) f.push({ code: 'jargon-density', detail: `${proper.length} proper nouns in ${words.length}w: ${proper.join(', ')}` });

  // THE ACTUAL ENGINE-INPUT DEFECT: locationLine hands the writer a landmark AND a separate
  // "Known ground:" token, and both get stuffed into one short card, so the reader is asked to hold
  // two unrelated places at once. Count how many DEALT places the card names.
  // Group tokens by the PHRASE the engine dealt them in: locationLine says "the ruin of
  // Thornhollow", so a card naming both "the ruin" and "Thornhollow" has named ONE place, not two.
  // Only distinct dealt PHRASES count.
  const phrases: string[][] = [
    ...(String(input.location ?? '').match(/(?:ruin of|Known ground:)\s*([^.;]+)/g) ?? [])
      .map(x => x.replace(/^(the ruin of|Known ground:)\s*/i, '')),
    ...(input.placeNameSuggestions ?? []).map(String),
  ].map(ph => ph.split(/\s+/).filter(w => /^[A-Za-z-]{4,}$/.test(w) && !/^(the|and|on|of|at|in|their|its)$/i.test(w)));
  const named = phrases
    .map(toks => toks.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(s)))
    .filter(hit => hit.length > 0)
    .map(hit => hit.join('/'));
  if (named.length >= CAP.places) f.push({ code: 'two-places', detail: named.join(' + ') });

  // ── NEAR-DUPLICATE COINAGE — "stone-warden" beside "warden-stones" in one card: the reader
  // meets the same invented stem twice in two different senses. Worst of the jargon class.
  // narrowed: only fires when a HYPHENATED coinage shares a stem with another word in the card
  // ("stone-warden" beside "warden-stones"). Any-word-overlap fired on 7.3% of official text.
  const hyph = (s.toLowerCase().match(/\b[a-z]{4,}-[a-z]{4,}\b/g) ?? [])
    .filter(h => /-(warden|keeper|master|hand|wright|monger|herd|cutter|burner|maker|stone|gate)s?$/.test(h) || /^(stone|ruin|copse|ridge|peat|bog|moor)-/.test(h));
  const coll: string[] = [];
  for (const h of hyph) for (const part of h.split('-'))
    if (part.length >= 5 && new RegExp(`\\b${part}s?\\b`, 'i').test(s.replace(h, ''))) coll.push(`${h} ~ ${part}`);
  if (coll.length) f.push({ code: 'stem-collision', detail: [...new Set(coll)].join(' / ') });

  // ── COINED COMPOUND TRADES — "stone-warden", "ruin-keeper". ZERO occurrences in 1,426 official
  // intros, so this is genuinely alien to the register, not a stylistic preference of mine.
  const compounds = [...new Set((s.match(/\b[a-z]{3,}-[a-z]{3,}\b/g) ?? []))]
    .filter(c => !PLAIN_TRADES.has(c.split('-')[1]!) || !PLAIN_TRADES.has(c.split('-')[0]!));
  const coinedTrade = compounds.filter(c => /-(warden|keeper|master|hand|man|wright|smith|monger|herd|cutter|burner|maker)$/.test(c));
  if (coinedTrade.length) f.push({ code: 'coined-trade', detail: coinedTrade.join(', ') });

  // ── INVENTED DURATION — the payload has no duration field, so any of these is fabricated
  const dm = s.match(DURATION);
  if (dm) f.push({ code: 'invented-duration', detail: dm[0] });

  // ── MY OWN RULE WORDING COMING BACK
  for (const p of RULE_ECHO) if (s.toLowerCase().includes(p)) { f.push({ code: 'rule-echo', detail: p }); break }

  // ── carried over from the old lint, still real
  // speech inside quotes is a CHARACTER talking, not the narrator — strip it before the check
  const unquoted = s.replace(/["\u201C\u201D][^"\u201C\u201D]{0,400}["\u201C\u201D]/g, ' ')
                    .replace(/\u2018[^\u2019]{0,400}\u2019/g, ' ');
  if (/\b(I|my|we|our)\b/.test(unquoted)) f.push({ code: 'first-person', detail: '' });
  // 'no-pronouns' REMOVED: 51% of official intros have none. It was measuring my assumption.
  if (/\b(is|are|was|were) (suspected|thought|believed|rumou?red) to\b/i.test(s)) f.push({ code: 'hedge', detail: '' });
  if (/\b(ledger|tally|registry|record-book)\b/i.test(s)) f.push({ code: 'account-book', detail: '' });
  if (/^(word|news|a messenger|a rider|a runner)/i.test(s)) f.push({ code: 'weak-open', detail: '' });
  for (const piece of String(input.rewardEnvelope ?? '').split(' + '))
    if (piece.length > 6 && s.toLowerCase().includes(piece.toLowerCase())) { f.push({ code: 'envelope-echo', detail: piece }); break }
  if (input.intake && s.toLowerCase().includes(input.intake.toLowerCase().slice(0, 18))) f.push({ code: 'intake-echo', detail: '' });

  return f;
}
