// docs/STORYTELLER.md §2.8.7: every variant of every storyteller template renders cleanly and stays
// within its word budget (skeleton included, every conditional line on that the variant allows).
// A rule cannot land without cutting another.
import { describe, it, expect } from 'vitest';
import { render, wordCount, WORD_BUDGET } from '../src/ai/prompts/render.js';

const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => acc.concat(acc.map(a => [...a, x])), [[]]);

/** the structure arms (§D.1): S deals episodes, H deals the shape but free job types, L deals neither */
const STRUCTURE: Record<string, string[]> = { S: ['shape', 'episodes'], H: ['shape', 'types'], L: ['types'] };

const variants: Record<'plan' | 'card' | 'report' | 'outline', { flags: string[]; vars: Record<string, number> }[]> = {
  // the cast arms (R1, C5): full deals a stake; lean deals none and may leave the one who asks without a trade
  plan: Object.values(STRUCTURE).flatMap(arm => [['stake'], ['notrade'], []].flatMap(cast =>
    subsets(['personal', 'memory', 'direction', 'avoid']).map(extra => ({ flags: [...arm, ...cast, ...extra], vars: {} })))),
  // premise: card 1 carries what it alone adds, `loses` (the loss; a want that already says it gets none) and/or
  // `personal` (a soldier's old wrong), and none without either. `retry` re-poses a later job (a finale is never
  // re-posed); every other later card has `latest`. R4: what is known, held and still open, and whom the company acts
  // for, are the engine's quest log, never the card's, and whose fate the finale settles is the buttons' (R4 verify);
  // `lose` comes only at a last chance. R3 verify 2: `intro` / `part` only when some entry in names carries one
  card: ['first', 'later', 'finale'].flatMap(pos => subsets(['memory', 'direction', 'intro', 'part', ...(pos === 'first' ? ['premise', 'loses', 'personal'] : []), ...(pos === 'finale' ? ['lastchance', 'lose'] : []),
    ...(pos !== 'first' ? ['latest', 'retry'] : [])])
    .filter(s => !(s.includes('latest') && s.includes('retry')) && !(pos === 'finale' && s.includes('retry')) && s.includes('lastchance') === s.includes('lose'))
    .filter(s => s.includes('premise') === (s.includes('loses') || s.includes('personal')))
    .map(extra => ({ flags: [pos, ...extra], vars: { MAX: pos === 'finale' ? 90 : 70 } }))),
  // R4 (Q3): the road ahead, one variant
  outline: [{ flags: [], vars: {} }],
  // hurtprice: a partial whose price is the wound, so it comes with hurt and never with cost;
  // personal: the soldier whose past the story is went, and the summary may name them.
  // R2: a won middle job deals `clue` (its learn) and `brought` (its gain), never with the finale's `answer` /
  // `option` / `edge`; `known` (what earlier wins found) comes with `have` (one win banks both), middle or
  // finale; at the finale `have` always carries its `edge`, and `edge` is the finale's alone;
  // a failed job has no `decides`, `result`, `clue` or `brought`. R3 verify 2: `intro` / `part` only with `people`
  report: subsets(['people', 'personal', 'decides', 'result', 'option', 'hurt', 'cost', 'hurtprice', 'brought', 'clue', 'known', 'have', 'edge', 'answer', 'direction', 'intro', 'part'])
    .filter(s => s.includes('people') || !s.some(f => f === 'intro' || f === 'part'))
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
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).toContain('"truth"');
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toContain('truth');
    // a personal plan asks the soldier for want and past in an object of its own, never past on every cast entry
    expect(render('plan', ['types', 'personal'])).toContain('"soldier": {"want"');
    expect(render('plan', ['types'])).not.toContain('"past"');
    // a rule about absent data never reaches the model (R1 verify 2): no loss line without a loss
    expect(render('card', ['first', 'premise', 'loses'], { MAX: 70 })).toContain('loses:');
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
    // R4 (Q1, Q2): no card carries the bookkeeping the quest log prints (whom the company acts for and their want,
    // what is known, what is held, the open question): each labelled field came back as its own stock sentence
    for (const v of variants.card) expect(render('card', v.flags, v.vars), v.flags.join(',')).not.toMatch(/helping|mystery|have:|unknown|wants|learned|question/);
    expect(render('report', ['saga', 'moved', 'clue', 'brought'], { B: 60, A: 140 })).toMatch(/clue:[\s\S]*brought:|brought:[\s\S]*clue:/);
    expect(render('report', ['saga', 'moved'], { B: 60, A: 140 })).not.toMatch(/clue|known|brought|have:/);
    // R2 verify: what is known and held has a stated role (never new; the held thing used in after at the finale,
    // else only where it helps the job: "only if the card does" was always true, as every card carries have); the
    // truth ties to what is known only when something is
    expect(render('report', ['saga', 'moved', 'known', 'have'], { B: 60, A: 140 })).toMatch(/known:.*never shown as new[\s\S]*have:.*only where it helps this job/);
    // R4 verify 2: each held thing shown used where it happens (most uses are approach or intel, before the deciding
    // moment: pinned to after, they forced flashbacks)
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).toContain('helps: its use; show each used.');
    expect(render('report', ['saga', 'moved', 'answer', 'have', 'edge'], { B: 60, A: 140 })).not.toContain('used in after');
    expect(render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 })).not.toMatch(/known|learn/);
    expect(render('report', ['saga', 'moved', 'answer', 'known', 'have', 'edge'], { B: 60, A: 140 })).toMatch(/- after:.*built from known/);
    // R3 (W5): the secret comes out inside after, in time order; truth is one plain sentence for the chronicle. The
    // report speaks in the third person (the card above it says "you"); the card never guesses past what is known
    const fr = render('report', ['saga', 'moved', 'answer'], { B: 60, A: 140 });
    expect(fr).toMatch(/- after:.*The secret comes out within it, in time order/);
    expect(fr).toMatch(/- truth: the secret in one plain sentence/);
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
    expect(plan).toMatch(/why: what the one who asked can then do toward their want with only what the job names: an action, never seeing, knowing, learning, showing or proving/);
    expect(plan).not.toMatch(/thing or person is/);
    expect(plan).toMatch(/learn: a plain fact the win brings out, clear on its own, that narrows the answer, never naming what the question asks for/);
    expect(plan).toMatch(/fit every way in ending, even after failed jobs\./);
    // R4 verify: each field is written after what it must fit. The question comes before the episodes, so each learn is
    // written toward it (written last, every learn came before the question it narrows); the answer stays last
    // (Q5), fitting the learns as well as the fixed ending
    expect(plan).toMatch(/- question:[^\n]*\n- episodes,/);
    expect(plan).toMatch(/- options:[^\n]*\n- answer: [^\n]*fitting the learns, every way in ending and settles\./);
    expect(plan.indexOf('"question"')).toBeLessThan(plan.indexOf('"episodes"'));
    expect(plan.indexOf('"answer"')).toBeGreaterThan(plan.indexOf('"options"'));
    // R4 verify: titles, job and why are on screen before their job is played (the road ahead prints every job and why
    // on card 1), so none carries a learn or the answer. R4 verify 2: the trouble too (every card prints it), the
    // showdown's included, on a line of its own (at the tail of the longest bullet it reached the showdown only "as above")
    expect(plan).toMatch(/\n\nTitles, jobs, whys and troubles, the showdown's too, are shown before play: never a learn or the answer\.\n\n/);
    // R4 verify 2: people are those there in person (the asker and the opponent were listed at every job); the showdown's
    // job names the person in ending (the PLANS buttons decide them, and a person in no fact had a place offered); the
    // few-words fields the cards restate carry a number (trouble ran long in all four real runs; a personal past
    // "retold" was the seed pasted)
    expect(plan).toContain('people: ids of those there in person;');
    expect(plan).toContain('why as above; its job names the person in ending.');
    expect(render('plan', ['types', 'personal'])).not.toContain('person in ending');
    expect(plan).toContain('"trouble": {"who": "≤6 words", "carry": "≤6 words", "will": "≤6 words"}');
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
    expect(render('card', ['first', 'premise', 'loses'], { MAX: 70 })).toMatch(/- premise\. who: the one it is about\. loses:[\s\S]*in this order: premise, job, why, trouble\./);
    expect(render('card', ['first', 'premise', 'loses'], { MAX: 70 })).not.toContain('new to the player. who');
    expect(render('card', ['first'], { MAX: 70 })).not.toMatch(/premise|needs you/);
    expect(render('card', ['first'], { MAX: 70 })).toMatch(/in this order: job, why, trouble\./);
    expect(render('card', ['finale', 'latest'], { MAX: 90 })).toMatch(/in this order: latest, job, why, trouble\./);
    expect(render('card', ['finale', 'latest', 'lastchance', 'lose'], { MAX: 90 })).toMatch(/in this order: latest, job, why, trouble, lose\./);
    expect(render('card', ['later', 'retry'], { MAX: 70 })).toMatch(/in this order: retry, job, why, trouble\./);
    for (const t of [render('card', ['first', 'loses'], { MAX: 70 }), render('card', ['later', 'latest'], { MAX: 70 }), render('card', ['finale', 'latest', 'lastchance', 'lose'], { MAX: 90 })])
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
    expect(plan).toMatch(/a label: at most one of their traits, then their trade; no name\./);
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
    expect(render('card', ['first', 'premise', 'personal'], { MAX: 70 })).not.toContain('nobody hires');   // printed as "Nobody hires you this time."
    expect(render('card', ['later', 'latest', 'intro', 'part'], { MAX: 70 })).toMatch(/intro: new to the player[\s\S]*part: their side, shown, not stated/);
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
    // R4 (Q3): the road ahead reads card-1-safe input only (the one the jobs are for and their want, each earlier job's
    // text and why); no key for a learn, gain, edge, the answer, a title or the finale job. R4 verify: it writes only
    // what each job lets the asker do (the engine prints "<job>, so <asker> can <that>": written whole, the job pasted
    // as told left the purpose no room under the cap, and a bare "so" took verb-first clauses ungrammatically), and no line for the end (it could only restate the log's For line)
    const ol = render('outline', []);
    expect(ol).toMatch(/- asker: who the jobs are for\. wants: what they want\.\n- jobs: the jobs before the last, in order\. job: the task, and where\. why: what it lets the asker do\./);
    // R4 verify 2: no knowing verbs in the outline either ("Read the slaver's claims ... and find the debt's true amount"
    // guessed at the clue)
    expect(ol).toContain('an action, verb first, never reading, finding, learning, seeing or proving; at most 12 words. Each is printed after its job: "<job>, so <asker> can <your words>".');
    expect(ol).toContain('{"so": ["at most 12 words"]}');
    expect(ol).not.toMatch(/\blearn\b|gain|edge|answer|title|showdown|finale|the end/);
  });
});
