// docs/STORYTELLER.md §2.8.7: every variant of every storyteller template renders cleanly and stays
// within its word budget (skeleton included, every conditional line on that the variant allows).
// A rule cannot land without cutting another.
import { describe, it, expect } from 'vitest';
import { render, wordCount, WORD_BUDGET } from '../src/ai/prompts/render.js';

const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => acc.concat(acc.map(a => [...a, x])), [[]]);

/** the structure arms (§D.1): S deals episodes, H deals the shape but free job types, L deals neither */
const STRUCTURE: Record<string, string[]> = { S: ['shape', 'episodes'], H: ['shape', 'types'], L: ['types'] };

const variants: Record<'plan' | 'card' | 'report', { flags: string[]; vars: Record<string, number> }[]> = {
  // the cast arms (R1, C5): full deals a stake; lean deals none and may leave the one who asks without a trade
  plan: Object.values(STRUCTURE).flatMap(arm => [['stake'], ['notrade'], []].flatMap(cast =>
    subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: [...arm, ...cast, ...extra], vars: {} })))),
  // R5 (P5): card 1 always carries its premise (who needs you, their want, what nobody knows); `personal` makes it a
  // soldier's old wrong. `retry` re-poses a later job (a finale is never re-posed); every other later card has `latest`.
  // R4: on later cards what is known, held and still open, and whom the company acts for, are the engine's quest log,
  // never the card's, and whose fate the finale settles is the buttons' (R4 verify); `lose` comes only at a last
  // chance. R3 verify 2: `intro` / `part` only when some entry in names carries one
  // R5 verify: `returning` puts a returning asker's past with you in card 1's premise (no personal saga has one)
  // R5 verify 2: `why` the job's hope, from its one owner (job 1: the plan's why; a later job: its road line), never on the
  // finale (the showdown's why was the For line's want); `will` the trouble's deed, on a later card or finale with neither a
  // retry (the stopper was that deed) nor `lose` (the deed restated the loss)
  // R6 (F3): card 1's trouble has its `will` again (the foe's one reason, N18), under an 80-word cap. (F5) A later card may
  // have neither `latest` nor `retry`: after a win that restated its gain, the log's Held line says it. (F1) `why` is the
  // plan's own why for the job, wherever the engine did not keep it off the screen
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', 'will', ...(pos === 'first' ? ['personal', 'returning'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['latest', 'retry'] : []), ...(pos !== 'finale' ? ['why'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && !(pos === 'finale' && s.includes('retry')) && s.includes('lastchance') === s.includes('lose') && !(s.includes('personal') && s.includes('returning')))
    .filter(s => !(s.includes('will') && (s.includes('retry') || s.includes('lose'))))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : pos === 'first' ? 80 : 70 } }))),
  // hurtprice: a partial whose price is the wound, so it comes with hurt and never with cost;
  // personal: the soldier whose past the story is went, and the summary may name them.
  // R2: a won middle job deals `clue` (its learn) and `brought` (its gain), never with the finale's `answer` /
  // `option` / `edge`; `known` (what earlier wins found) comes with `have` (one win banks both), middle or
  // finale; at the finale `have` always carries its `edge`, and `edge` is the finale's alone;
  // a failed job has no `decides`, `result`, `clue` or `brought`. R3 verify 2: `intro` / `part` only with `people`
  // R6 (F1): `hope` (what the card promised) on a won middle job only: it has a result and is no finale
  // R6 verify 2: `away` (someone met whom a dealt field names, not at the job: name and sex, so no pronoun is guessed) rides in
  // people, as intro and part do
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'hope', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part', 'away'])
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part' || f === 'away'))
    .filter(s => !s.includes('hope') || (s.includes('result') && !s.some(f => ['answer', 'option', 'edge'].includes(f))))
    .filter(s => !s.includes('hurtprice') || (s.includes('hurt') && !s.includes('cost')))
    .filter(s => !(s.some(f => ['clue', 'brought'].includes(f)) && s.some(f => ['answer', 'option', 'edge'].includes(f))))
    .filter(s => !s.includes('known') || s.includes('have'))
    .filter(s => s.includes('answer') ? !s.includes('have') || s.includes('edge') : !s.includes('edge')).flatMap(s =>
    [['moved'], ...(s.some(f => ['decides', 'result', 'clue', 'brought'].includes(f)) ? [] : [['failure', 'stopped']])].map(end => ({ flags: ['saga', ...s, ...end], vars: { B: 60, A: 140 } }))),
};

describe('storyteller prompt budget', () => {
  for (const [name, vs] of Object.entries(variants) as [keyof typeof variants, typeof variants.plan][]) {
    it(`${name}: every variant renders and stays ≤ ${WORD_BUDGET[name]} words`, () => {
      let max = 0, worst = '';
      for (const v of vs) {
        const n = wordCount(render(name, v.flags, v.vars));   // throws on an unrendered tag
        if (n > max) { max = n; worst = v.flags.join(',') }
      }
      expect(max, `${name} worst variant: ${worst}`).toBeLessThanOrEqual(WORD_BUDGET[name]);
    });
  }

  it('drops a conditional line and a conditional span when its flag is off', () => {
    const on = render('card', ['later', 'memory'], { MAX: 70 });
    const off = render('card', ['later'], { MAX: 70 });
    expect(on).toContain('memory:');
    expect(off).not.toContain('memory');
    expect(off).not.toContain('premise');
    // card 1 is its own call (R1, C3): the plan has no pitch; every job carries a why (C1)
    expect(render('plan', ['types', 'stake'])).not.toContain('pitch');
    expect(render('plan', ['types', 'stake'])).toContain('"why"');
    expect(render('plan', ['types'])).not.toContain('stake:');
    // R5 verify: no `truth` reply (asked for the secret in one sentence with the secret dealt as one, the writer pasted
    // it back, a blind copy field); the chronicle prints the plan's answer
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toContain('truth');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('truth');
    // a personal plan asks the soldier for want and past in an object of its own, never past on every cast entry
    expect(render('plan', ['types', 'personal'])).toContain('"soldier": {"want"');
    expect(render('plan', ['types'])).not.toContain('"past"');
    // a rule about absent data never reaches the model (R1 verify 2): no loss line without a loss (R5: card 1 deals none)
    expect(render('card', ['first'], { MAX: 70 })).not.toContain('lose');
    expect(render('report', ['saga', 'moved', 'personal'], { B: 60, A: 140 })).toContain('whose past this story is');
    // R2: the plan writes gain and learn per job and an edge per gain; the finale card names whose fate it
    // decides and never carries the ways; a re-posed job says so; learned clues and holdings reach later texts
    const plan = render('plan', ['types']);
    for (const k of ['"gain"', '"learn"', '"edge"']) expect(plan).toContain(k);
    const fin = render('card', ['finale', 'latest'], { MAX: 90 });
    // R4 verify: no `fate` on the finale (a bare name under its gloss came back as the gloss, "X's fate is settled
    // here", on every finale; the buttons say whose end it is); never the ways
    expect(fin).not.toMatch(/option|ways|fate/);
    expect(render('card', ['later', 'retry'], { MAX: 70 })).toContain('retry:');
    expect(render('card', ['later'], { MAX: 70 })).not.toMatch(/retry|mystery|have:|latest/);
    expect(render('card', ['later', 'latest'], { MAX: 70 })).toMatch(/latest: what happened last[\s\S]*in this order: latest, job/);
    // R4 (Q1, Q2): no later card carries the bookkeeping the quest log prints (whom the company acts for and their want,
    // what is known, what is held, the open question): each labelled field came back as its own stock sentence.
    // R5 (P5): card 1 tells its premise in prose again (who needs you, their want, what nobody knows): R4's card 1 lost
    // the want and the mystery to the log (ease and want-to-send fell); its log drops the Open question line instead
    for (const v of variants.card) expect(render('card', v.flags, v.vars), v.flags.join(',')).not.toMatch(v.flags.includes('first') ? /helping|mystery|have:|learned|question/ : /helping|mystery|have:|unknown|wants|learned|question/);
    expect(render('card', ['first', 'why'], { MAX: 70 })).toMatch(/- premise\. who: the one who needs you\. wants: what they want\. unknown: what nobody knows yet\.\n[\s\S]*in this order: premise, job, why, trouble\./);
    // R5 (P5): card 1's trouble carried no `will` (with the premise back it broke the cap). R6 (F3): it does again, the foe's
    // one reason (N18), under an 80-word cap; with no will dealt, no gloss for one
    expect(render('card', ['first', 'why', 'will'], { MAX: 80 })).toContain('trouble: the foe, with what, what they will do.');
    // R5 verify 2: the trouble gloss names the keys in the third person, never the card's voice ("who opposes you, with
    // what" came back as "A thin hunter opposes you with bow and snare-lines", J2 engine-speak and a gloss-echo lint hit)
    expect(render('card', ['first', 'why'], { MAX: 70 })).toContain('trouble: the foe, with what.');
    expect(render('card', ['later', 'latest', 'why', 'will'], { MAX: 70 })).toContain('trouble: the foe, with what, what they will do.');
    for (const v of variants.card) expect(render('card', v.flags, v.vars), v.flags.join(',')).not.toMatch(/opposes you/);
    expect(render('card', ['first', 'personal'], { MAX: 70 })).toMatch(/- premise\. who: one of your own soldiers\. wants: what they want\. past: their old wrong\. unknown: what nobody knows yet\./);
    // R5 verify: a returning asker's past with you is in the premise, which the order line places (under names it had no
    // slot, and the floor dropped it); a memory gloss in names is for someone else
    expect(render('card', ['first', 'returning', 'why'], { MAX: 70 })).toMatch(/- premise\. who: the one who needs you\. wants: what they want\. memory: your past with them\. unknown: what nobody knows yet\.\n[\s\S]*in this order: premise, job, why, trouble\./);
    expect(render('card', ['first', 'returning'], { MAX: 70 })).not.toContain('told on first appearance');
    // R5 verify: a retry's trouble has no `will` (what stopped the last try is most often that deed: said twice)
    expect(render('card', ['later', 'retry', 'why'], { MAX: 70 })).toContain('trouble: the foe, with what.');
    // R5 verify 2: the finale has no why (the showdown's "what it gets them toward their want" was the want itself, printed
    // two rows under the log's For line in 3 of 3 real runs) and keeps the trouble's deed unless a last chance deals `lose`
    expect(render('card', ['finale', 'latest', 'will'], { MAX: 90 })).toMatch(/- job: the task, and where\. trouble: the foe, with what, what they will do\./);
    expect(render('card', ['finale', 'latest', 'will'], { MAX: 90 })).toMatch(/in this order: latest, job, trouble\./);
    // R5 (P2): a why may be a hope ("hopes …"), dealt as the plan wrote it; the card gets no gloss about hopes ("a hope
    // stays a hope" came back as its own sentence, "That is only a hope.", R3 W3's class)
    expect(render('card', ['later', 'latest', 'why'], { MAX: 70 })).toContain('why: why it matters.');
    expect(render('card', ['later', 'latest'], { MAX: 70 })).not.toContain('why');
    expect(render('card', ['finale', 'latest'], { MAX: 90 })).not.toContain('hope');
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:[\s\S]*brought:|brought:[\s\S]*clue:/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/clue|known|brought|have:/);
    // R2 verify: what is known and held has a stated role (never new; the held thing used in after at the finale,
    // else only where it helps the job: "only if the card does" was always true, as every card carries have); the
    // truth ties to what is known only when something is
    // R6 verify 2: "this job" cut (the have line is the job's own; three words for `away`)
    expect(render('report', ['saga', 'moved', 'known', 'have'], { B: 60, A: 140 })).toMatch(/known:.*never shown as new[\s\S]*have:.*use it only where it helps\./);
    // R4 verify 2: each held thing shown used where it happens (most uses are approach or intel, before the deciding
    // moment: pinned to after, they forced flashbacks)
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).toContain('helps: its use; show each used.');
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).not.toContain('used in after');
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toMatch(/known|learn/);
    expect(render('report', ['saga', 'moved', 'answer', 'known', 'have', 'edge'], { B: 60, A: 140 })).toMatch(/- after:.*tied to known/);
    // R6 verify 2: at the finale known is pointed to, never retold ("tied to known" read as "retell the knowns": a finale after
    // re-narrated all three Known lines before a 64-word answer, 183/160), so its "never shown as new" gives way to the after's
    // rule; and the secret is said only by someone in people (a soldier on no earlier job announced a fact nobody had found)
    const fk = render('report', ['saga', 'moved', 'people', 'answer', 'known', 'have', 'edge'], { B: 60, A: 140 });
    expect(fk).toContain('never as one line: said by one in people, seen or found, tied to known, never retold.');
    expect(fk).toContain('- known: what earlier jobs found.\n');
    expect(render('report', ['saga', 'moved', 'known', 'have'], { B: 60, A: 140 })).toContain('- known: what earlier jobs found; never shown as new.');
    // R6 verify 2: someone a dealt field names who is not at the job (most often the one the company acts for, whom the hope,
    // the result and the secret name) comes in people as `away`, name and sex: no pronoun guessed, nobody placed there
    expect(render('report', ['saga', 'moved', 'people', 'away'], { B: 60, A: 140 })).toContain('people: who else is there, by name. away: not at the job.');
    expect(render('report', ['saga', 'moved', 'people'], { B: 60, A: 140 })).not.toContain('away');
    // R3 (W5): the secret comes out inside after, in time order; truth is one plain sentence for the chronicle. The
    // report speaks in the third person (the card above it says "you"); the card never guesses past what is known
    // R6 (F4): in pieces across the deciding moment, in the writer's own words, never as one line (the secret dealt as one
    // finished sentence was pasted as one line of confession: J2 "flat/told" 6, verifier #8)
    const fr = render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 });
    expect(fr).toMatch(/- after:.*The secret comes out in pieces across the deciding moment, in your own words, never as one line: said, seen or found\./);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).toContain('third person');
    // R3 (W3): glosses say what to cover; no state words a card or report would print ("not met yet", "you try this
    // same job again", "whose fate this job decides", "what you hold"), and no "any name" on an entry with none
    for (const t of [render('card', ['later', 'retry'], { MAX: 70 }), render('card', ['finale', 'latest'], { MAX: 90 }), render('report', ['saga', 'moved', 'people', 'have'], { B: 60, A: 140 })])
      expect(t).not.toMatch(/not met|try this same job again|fate this job|what you hold|any name/);
    // R3 (W2): a learn is a plain fact that never names what the question asks for (a who-question's who, a
    // what-question's what) and leaves the showdown the last piece. R4 (Q4): why names an ACTION the one who asked can
    // then take toward their want, never a knowing verb (R3: "lets X see who fakes his mark", a record's use told as
    // its contents). R4 (Q5): the answer is written LAST, after the showdown and options, so it can fit the fixed
    // ending (R3's twists the ending could not react to): one merged line, and question and answer close the reply
    // R4 verify 2: why uses only what the job names ("what the job's thing or person is" asked for what the job yields:
    // the gain, often the learn, printed before play)
    // R5 (P2): why is what the asker HOPES the job gets them: a thing or person, what they can then do; word or proof,
    // only as a hope. R4's action-only why ("never seeing, knowing…") made the plan invent uses the story never needed
    // (N12); R3's "what it lets X do" kept the link but stated contents (spoilers). Written right after the job, before
    // the after-play fields (win, gain, learn), so it cannot carry them (verifier r3 #3)
    // R5 verify 2: a step short of the want (job 1's why, the only one printed, restated card 1's premise want); the
    // showdown writes no why (it was the want itself, and the finale card printed it under the For line)
    // R6 verify: one shape, written after "<name> hopes" (the engine prints the name and the hope word, `hopeOf`): "for a thing
    // or person …; word or proof only as a hope" packed two shapes into one clause, and the proof branch drew the proof object,
    // most often the gain or the learn (5 of 17 whys kept off the screen)
    expect(plan).toMatch(/why: what the one who asked hopes for from this job, printed after "<name> hopes": a step short of their want, with only what the job names; for a thing or person, what they can then do\./);
    expect(plan).not.toContain('word or proof');
    expect(plan).toContain('- showdown: job, people, trouble as above;');
    expect(plan).toMatch(/"showdown": \{"title": "few words", "job": "text", "people"/);
    expect(plan).not.toMatch(/thing or person is|never seeing, knowing/);
    expect(plan).toMatch(/- episodes, in order\. job: [^\n]*?\. why: /);
    expect(plan.indexOf('"why"')).toBeLessThan(plan.indexOf('"win"'));
    expect(plan.indexOf('"why"')).toBeLessThan(plan.indexOf('"learn"'));
    expect(plan).not.toContain('follows the last win');
    // R5 (P4): the want is a clause the engine prints after "wants to" (For: <who>, <label>, who wants to …): R4's
    // noun-phrase want after a dash was misread
    expect(plan).toContain('asker: want, printed after "wants to": verb first, naming who or what; never what becomes of the person in ending.');
    expect(plan).toContain('"want": "verb first, few words"');
    // R6 verify: over the whole set, as the player reads them together in Known ("dog-like tracks" + "meat for her old guard"
    // named the hound before the finale, each learn clean alone)
    // R6 verify 2: a rule on the answer's structure, not a word ban: learns show what was done or how, never why ("never name"
    // was met by leaving one word out, and the learns were the answer cut into its clauses, all in Known before the finale)
    expect(plan).toMatch(/learn: a plain fact the win brings out, clear on its own, that narrows the answer: what was done or how, never why; only the showdown tells why\./);
    expect(plan).not.toContain('all the learns together');
    // R6 verify 2: the win is the change on the ground only, never a fact found (prompted as "a fact the win brings out", the
    // learn went into the win too, which prints as the report's result, the next card's latest and the chronicle)
    expect(plan).toContain('win: what success changes on the ground, naming who or what; never a learn.');
    // R6 verify 2: the dealt cast's sex and trade win over the seed's words (a seed's "he" beside a dealt woman, its "debt-master"
    // beside a dealt landlord, came back as two people); traits are shown in deeds (stacked as adjectives, they were pasted)
    expect(plan).toContain("Use them all as the seed's people, their sex and trade over the seed's;");
    expect(plan).toContain('traits: what they are like, shown in what they do.');
    expect(plan).toMatch(/fit every way in ending, even after failed jobs\./);
    // R5 (P1): the answer is written FIRST again, right after the question and before the episodes, so every learn is
    // written toward a known answer. R4's answer written last was fitted to learns written without one (N11: J1
    // "answered" 79% → 42%). R4's merged line stays: the answer fits every way in ending and settles
    // R6 (F2): the answer no longer has to fit every way in ending: with the gold way "the company takes that person's
    // treasure", fitting it made the answer a buried hoard (R3 4 → R4 7 → R5 10, N20). The fit rule stays on settles
    // R6 verify: never a who-question: the player meets everyone in cast early (the one in ending in job 1, the foe in its
    // trouble), so "who moves the border stone" had one suspect from card 1; the answer is what and why
    // R6 verify 2: the answer capped in the schema (35-64 words, pasted whole into a finale after past its cap). The question
    // asks why, the one thing no learn tells (learn: "what was done or how, never why"): a what- or how-question was answered
    // by the learns before the finale (Sonnet: "what truly bought her way out" told by learn 1, "how the dragon burned the
    // guildhall" 71% told), and a why-question has no who to give away, so "never who …" goes with it
    expect(plan).toMatch(/- question: one sentence starting "Nobody knows why": the hidden thing the player most wants to know, not the ending\. answer: what and why: surprising, not in the seed, no new person\.\n- episodes,/);
    expect(plan).not.toContain('never who');
    expect(plan).toContain('"answer": "≤30 words"');
    expect(plan).toContain('All these fit every way in ending, even after failed jobs.');
    expect(plan.indexOf('"question"')).toBeLessThan(plan.indexOf('"answer"'));
    expect(plan.indexOf('"answer"')).toBeLessThan(plan.indexOf('"episodes"'));
    // R4 verify: titles, job and why are on screen before their job is played (the road ahead prints every job and why
    // on card 1), so none carries a learn or the answer. R4 verify 2: the trouble too (every card prints it), the
    // showdown's included, on a line of its own (at the tail of the longest bullet it reached the showdown only "as above")
    // R6 verify 2: wins and gains print before the finale too (latest, result, Held)
    expect(plan).toMatch(/\n\nTitles, jobs, whys and troubles, the showdown's too, are shown before play, wins and gains before the finale: never a learn or the answer\.\n\n/);
    // R4 verify 2: people are those there in person (the asker and the opponent were listed at every job); the showdown's
    // job names the person in ending (the PLANS buttons decide them, and a person in no fact had a place offered); the
    // few-words fields the cards restate carry a number (trouble ran long in all four real runs; a personal past
    // "retold" was the seed pasted)
    // R6 verify 2: every cast member is met in person by the middle job (one first met in the finale report is someone who
    // matters met last; a personal plan left the one in the way and the wronged brother for the showdown). Not the asker, whom
    // card 1's premise brings in: asked for everyone, the plans sent the asker along on nearly every job (6 of 7)
    expect(plan).toContain("people: ids of those there in person; every cast id but the asker's appears by the middle job, episode 1 including the person in ending; ids nowhere else.");
    expect(render('plan', ['types', 'personal'])).toContain('people: ids of those there in person; every cast id appears by the middle job; ids nowhere else.');
    // R5 verify: the person in ending stays free until the showdown decides them ("episode 1 includes the person in ending"
    // beside "gain: a … captive" made them job 1's captive, and the plans then decided someone the company held)
    // R6 (F6): the gain is of the kind the engine dealt (a sneak job always took a record: paperwork 34%)
    expect(plan).toContain('gain: what the company then holds, of the kind dealt, never the person in ending.');
    expect(render('plan', ['types', 'personal'])).toContain('gain: what the company then holds, of the kind dealt.');
    expect(plan).toContain("gains: the kind of each job's gain, in order.");
    expect(render('plan', ['shape', 'episodes'])).toContain('episodes: the jobs before the showdown, in order: what the soldiers do, the kind of win, the kind of gain.');
    // R6 (F2): the ENGINE writes the ending buttons (templates per way, the decided person by label), so no option can name
    // the secret (option spoilers 8 in R5, 7 of them gold, N19); the plan writes none
    for (const v of variants.plan) expect(render('plan', v.flags, v.vars), v.flags.join(',')).not.toMatch(/options|"label": "at most/);
    // R6 (F1): every job's why prints on the road, its card and its report (unless the engine keeps it off the screen): capped
    expect(plan).toContain('"why": "≤12 words"');
    expect(plan).toContain('trouble as above; its job names the person in ending.');
    expect(render('plan', ['types', 'personal'])).not.toContain('person in ending');
    // R6 verify: the trouble's middle slot is `with`, the same key and meaning in both prompts: "with what" in the plan under the
    // key `carry` was filled with things nobody carries ("a sling and false trails", "barred gates and a watch-bell"), and the
    // card, told "what they carry", printed them so ("He carries a sling and false trails."); asking the plan "what they carry"
    // did not stop it ("fear of losing his farms"), so the card is told what the plan writes
    expect(plan).toContain('"trouble": {"who": "≤6 words", "with": "≤6 words", "will": "≤6 words"}');
    expect(plan).toContain('trouble: who stands in the way (by label if in cast; armed people or a beast), with what, what they will do.');
    expect(render('card', ['later', 'latest', 'will'], { MAX: 70 })).toContain('trouble: the foe, with what, what they will do.');
    for (const v of [...variants.plan, ...variants.card]) expect(render(v.flags.includes('first') || v.flags.includes('later') || v.flags.includes('finale') ? 'card' : 'plan', v.flags, v.vars)).not.toMatch(/carry/);
    expect(render('plan', ['types', 'personal'])).toMatch(/past: the old wrong, naming who was wronged\.[\s\S]*"past": "≤8 words"/);
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:.*nothing past it/);
    // R4 (Q2): the finale's loss only at a last chance (what failed is why it is the last)
    expect(render('card', ['finale', 'lose', 'lastchance'], { MAX: 90 })).toContain('lose: who loses what for good if this last chance fails');
    expect(render('card', ['finale'], { MAX: 90 })).not.toContain('lose');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('past');
    // R4 (Q2): the card is a scene, in order: what happened last, the job and why it matters, who is in the way. The
    // order line names data keys, never a sentence a card could print ("the question, and what you know"); no gloss in
    // the card's voice ("their loss if nobody acts"). Card 1's premise is who needs you (their want is the log's)
    // R4 verify: card 1's premise is only what card 1 alone adds (the loss, a personal past): who needs you is the log's
    // For line, and dealt here too it came back as a second introduction under it; with neither, no premise at all
    // R4 verify 2: not "new to the player" (who is the log's For line, already on screen)
    expect(render('card', ['first'], { MAX: 70 })).not.toContain('new to the player. who');
    expect(render('card', ['finale', 'latest'], { MAX: 90 })).toMatch(/in this order: latest, job, trouble\./);
    expect(render('card', ['finale', 'latest', 'lastchance', 'lose'], { MAX: 90 })).toMatch(/in this order: latest, job, trouble, lose\./);
    expect(render('card', ['later', 'retry', 'why'], { MAX: 70 })).toMatch(/in this order: retry, job, why, trouble\./);
    for (const t of [render('card', ['first'], { MAX: 70 }), render('card', ['later', 'latest'], { MAX: 70 }), render('card', ['finale', 'latest', 'lastchance', 'lose'], { MAX: 90 })])
      expect(t).not.toMatch(/nobody acts|what you know|who wants what/);
    // the summary says what was done and its result, never the clue (it travels as clue, known and learned); the
    // report's people are those present; the deciding soldier and the plan in deeds, never choice words
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/- summary:.*the result, not the clue/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/what is different|clue/);
    expect(render('report', ['saga', 'moved', 'people'], { B: 60, A: 140 })).toContain('people: who else is there');
    const fo = render('report', ['saga', 'moved', 'decides', 'option', 'answer'], { B: 60, A: 140 });
    expect(fo).toMatch(/decides: whose deed wins it[\s\S]*plan: what the soldiers do, shown in after/);
    expect(fo).not.toMatch(/settles it|chosen|choice/);
    // R4 verify: a label is built from the data alone, their trade and at most one trait word ("what a stranger sees" made
    // the writer coin looks and a race the engine never dealt: "pale elf grove singer" for a human), never a name
    // R5 verify: race and trade only; a trait word in the label became a fixed epithet in every job, trouble and card
    // ("the clumsy scholar" four times in one plan); traits show in prose
    expect(plan).toMatch(/a label: their race and trade; no name\./);
    expect(plan).not.toMatch(/one of their traits/);
    expect(plan).not.toMatch(/stranger sees/);
    // R3 verify 2: every dealt key has a stated use (traits: what the person is like; the label never carries them)
    expect(plan).toContain('traits: what they are like');
    // the card's "you" is the company (the data says "the company"); each fact once (a retry that holds the job, a
    // want restated by why and lose); names are who the card may mention, not who is there; a gloss for intro and
    // part only when an entry carries one; the question already put to the player stays open, never re-posed whole
    const c = render('card', ['later', 'retry'], { MAX: 70 });
    expect(c).toContain('Speak to the company as "you"');
    expect(c).toMatch(/Say each fact once, in your own words, in this order: retry,/);
    expect(c).toContain('retry: what stopped the last try at this same job');
    expect(c).toContain('names: people the card may mention: name, else label.');
    expect(c).not.toMatch(/people here|any part|intro:|part:/);
    expect(render('card', ['first', 'personal'], { MAX: 70 })).not.toContain('nobody hires');   // printed as "Nobody hires you this time."
    // R5 verify 2: on a card, a part is their side, said (a 70-90-word scene under "Use only the data" cannot stage it; the
    // report, with room, shows it)
    expect(render('card', ['later', 'latest', 'intro', 'part'], { MAX: 70 })).toMatch(/intro: new to the player[\s\S]*part: their side\./);
    expect(render('card', ['later', 'latest', 'part'], { MAX: 70 })).not.toContain('shown');
    // the report: no rule the data itself breaks (people named in result, clue or known are not in people); a part
    // shown, never pasted as a description; result in the writer's own words (it is dealt in the present); the plan
    // carried out in after
    const r = render('report', ['saga', 'moved', 'people', 'decides', 'result', 'option', 'answer'], { B: 60, A: 140 });
    expect(r).toContain('Invent no names.');
    expect(r).not.toMatch(/Name only|exactly|intro:|part:/);
    expect(r).toMatch(/result: what came of it[\s\S]*- after:.*The deciding moment, then what result says came of it, in your own words/);
    // R4 verify 2: intro says how a new person is named wherever they are mentioned ("bring them in" assumed they were
    // there to meet; an absent one was name-dropped, label never given)
    expect(render('report', ['saga', 'moved', 'people', 'intro', 'part'], { B: 60, A: 140 })).toMatch(/people: who else is there, by name\. intro: new to the player; first mention gives label and name\. part: their side, shown, not stated\./);
    expect(render('card', ['later', 'latest', 'intro'], { MAX: 70 })).toContain('intro: new to the player; first mention gives label and name.');
    // R4 verify 2: before stops short of the job's goal (for a find or catch job, arriving IS the goal: before did the
    // job, then the failure contradicted it)
    expect(render('report', ['saga', 'failure', 'stopped'], { B: 60, A: 140 })).toContain('- before: at most 60 words. The soldiers meet what stands in their way, short of the goal, never repeating the card.');
    // R5 verify: a failed job's summary is only what stopped the company: the retry card is dealt it as `retry`, and "what
    // the company tried and what stopped it" put the job on the card twice (the chronicle puts the job in front)
    // R5 verify 2: "no wound" says why (the wound is printed beside the summary): a partial whose price is the wound took its
    // summary to owe that price ("though a soldier was hurt", 28/25)
    // R6 (F7): with what stopped the company as its subject: the chronicle prints it after "The company tried to <job>, but",
    // and "…, but the company was driven back" said the company twice (verifier #7; the engine also drops that subject)
    expect(render('report', ['saga', 'failure', 'stopped'], { B: 60, A: 140 })).toContain('- summary: one sentence, at most 25 words, whose subject is what stopped the company; no wound (shown beside it).');
    // R6 (F1): a won middle job's report is dealt the hope its card printed, so the story keeps it or shows why not
    // R6 verify: within reach, never done: the hope is a step short of the want, and "show it kept" acted that step out ahead of
    // the plan ("Lariane walked up the Stonegill road to the grove" before the finale opens the grove's gate)
    expect(render('report', ['saga', 'moved', 'decides', 'result', 'hope'], { B: 60, A: 140 })).toContain('- hope: what the card promised; show it within reach, not done, or why not.');
    expect(render('report', ['saga', 'moved', 'decides', 'result'], { B: 60, A: 140 })).not.toContain('hope');
    expect(render('report', ['saga', 'moved', 'hurt', 'hurtprice'], { B: 60, A: 140 })).toContain('the result; no wound (shown beside it).');
    // R6 (F1): no outline template: R5's road-ahead call wrote each later job's hope blind to the story and guessed purposes
    // it never pursued (N21); every job's hope is the plan's own why, which the engine prints or keeps off the screen
    expect(() => render('outline' as never, [])).toThrow();
  });
});
