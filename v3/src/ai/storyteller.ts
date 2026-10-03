// THE SAGA STORYTELLER v4 — text side (docs/STORYTELLER.md §2.5, §2.7–§2.9; Phase 2 build plan Step 2). What each call
// receives (plan · outline · card · report), the plan's repairs and defects, who the player knows (Knowing), the quest log
// the ENGINE renders, the road ahead, and the floor (the deterministic writer that stands in when a call fails, and the
// mock's reply). Ported line for line from the saga lab at tag `storyteller-build-src` (= R5, scripts/sagalab/v4lab.ts):
// the shipped text is the measured text, and test/sagagolden.test.ts holds it to the lab's bytes. Only the built arm is
// here (`ARM`, engine/saga.ts): the lab's S/H/full/named branches were pruned once the golden diff passed.
//
// Pure, apart from the typed call wrappers at the end (they go through the provider). Imports from the engine only.

import { z } from 'zod';
import { Rng } from '../engine/rng.js';
import type { Card } from '../engine/cards.js';
import type { Outcome } from '../engine/roll.js';
import { RACE_WORD, an, manWoman, soldierIs } from '../engine/plainwords.js';
import {
  TYPES, JOB_TYPES, WAY_ENDING, WAY_ATTR, NUMBER_WORD, helped, wayMeans, wayWord, wayOf, partOf, waysOf, hashStr, seedOf, seedText,
  type JobType, type Way, type SagaPerson, type Trouble, type Episode, type CastEntry, type SagaPlan, type SagaState,
  type SagaWorld, type Hurt, type Cost, type LogRow, type SagaRecord, keepPicked,
} from '../engine/saga.js';
import { renderSaga, wordCount, type SagaTemplate } from './prompts/saga/render.js';
import { PICKS, CASTS, KIT_DEAL } from '../engine/seedkit.js';
import type { AiProvider } from './provider.js';

// ─── the plan call's payload (§2.9.1) ───────────────────────────────────────────────────────────

/** avoid: recent sagas as title + question (titles alone gave the model nothing to steer away from) */
export interface PlanCtx { w: SagaWorld; avoid?: { title: string; question: string }[]; direction?: string }
const focalOf = (w: SagaWorld) => w.cast.find(p => p.focal)!;

/** the built arm (ARM: structure L, names labels, cast lean): the plan picks each job's type from the list; only the
 *  known are named; no shape, no stake dealt (the lean cast's measured payload) */
export function planPayload(ctx: PlanCtx): { payload: Record<string, unknown>; flags: string[] } {
  const { w } = ctx;
  const flags: string[] = ['types'];
  if (w.personal) flags.push('personal');
  if (w.cast.some(p => p.memory)) flags.push('memory');
  if (w.cast.some(p => !p.trade)) flags.push('notrade');
  if (ctx.direction) flags.push('direction');
  if (ctx.avoid?.length) flags.push('avoid');
  // a kit seed arm (North Star 7): the situation and its keywords, or a premise; a supporting cast dealt with no part
  const seed = seedOf(w);
  if (seed.keywords) flags.push('keywords');
  if (seed.premise) flags.push('premise');
  if (w.cast.some(p => p.part === '')) flags.push('support');
  const payload: Record<string, unknown> = { seed: seed.text };
  if (seed.keywords) payload.keywords = seed.keywords;
  payload.jobs = NUMBER_WORD[w.N - 1];
  payload.types = JOB_TYPES.map(t => ({ type: t, do: TYPES[t].do, kind: TYPES[t].kind }));
  // (R4 verify) everyone's race reaches the plan: the lean asker had none, and the label rule "what a stranger sees" made
  // the writer coin one off the seed ("pale elf grove singer" for a human). (R5 verify 2) On its own key, as the trade is:
  // the label is race and trade, and a race dealt only inside `traits` ("human, slow-witted, thin") took the traits into
  // the label with it
  payload.cast = w.cast.map(p => {
    const part = partOf(p);
    return {
      id: p.id, sex: manWoman(p.sex), race: RACE_WORD[p.race] ?? p.race, ...(part ? { part } : {}),
      ...(p.trade ? { trade: p.trade } : {}), ...(p.traits ? { traits: p.traits } : {}),
      ...(p.known ? { name: p.name } : {}),
      ...(p.memory ? { memory: p.memory, where: p.where } : {}),
    };
  });
  const ways = waysOf(w), isHelped = helped(focalOf(w));
  payload.ending = w.personal ? { about: w.focalId, likely: wayWord(ways[0]!), ways: ways.map(wayWord) }
    : { about: w.focalId, likely: ways[0], ways: ways.map(v => ({ way: v, means: wayMeans(v, isHelped) })) };
  payload.land = w.land;
  payload.places = w.places;
  payload.tone = w.tone;
  if (ctx.avoid?.length) payload.avoid = ctx.avoid;
  if (ctx.direction) payload.direction = ctx.direction;
  return { payload, flags };
}

// ─── the plan: schema, repairs, defects (§2.7) ──────────────────────────────────────────────────

const zs = z.union([z.string(), z.number()]).transform(String).optional().catch(undefined);
export const zTrouble = z.object({ who: zs, carry: zs, will: zs }).partial().optional().catch(undefined);
/** an edge as written: a plain line (in job order), or an object naming its job ({"job": 2, "helps": "…"}) */
export const zEdge = z.union([z.string(), z.object({ job: z.any().optional(), n: z.any().optional(), helps: zs, edge: zs, how: zs }).passthrough()]);
export const zEp = z.object({
  n: z.any().optional(), type: zs, title: zs, job: zs, people: z.array(z.string()).optional().catch(undefined),
  trouble: zTrouble, win: zs, gain: zs, learn: zs, why: zs, settles: zs, lose: zs,
  edge: z.array(zEdge).optional().catch(undefined),
}).passthrough();
export const zPlanOut = z.object({
  title: zs, question: zs, answer: zs,
  cast: z.array(z.object({ id: zs, label: zs, want: zs, past: zs }).passthrough()).optional().catch(undefined),
  /** the one the company acts for, in an object of their own: `asker` (want), or on a personal saga
   *  `soldier` (want, past) */
  asker: z.object({ want: zs }).partial().passthrough().optional().catch(undefined),
  soldier: z.object({ want: zs, past: zs }).partial().passthrough().optional().catch(undefined),
  episodes: z.array(zEp).optional().catch(undefined),
  showdown: zEp.optional().catch(undefined),
  options: z.array(z.object({ way: zs, label: zs }).passthrough()).optional().catch(undefined),
}).passthrough();

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// a name part is a capitalised word: a coined name's particles ("of", "the") are not, or the unmet-name
// repair turned every "the" in a plan into a label
const nameParts = (p: SagaPerson) => p.name.split(/\s+/).filter(x => x.length > 2 && /^\p{Lu}/u.test(x));

/** §2.7: the repairs are mechanical and silent; a hard defect earns one plain re-draw.
 *  `ownJobs`: the middle jobs whose people, AS THE PLAN WROTE THEM, include a personal saga's soldier — the jobs that
 *  stage the soldier's own matter in person. Only these pin the soldier to a place (the pre-v4 rule); the repair that
 *  adds the soldier to every job's people feeds the prose payloads, never the pin */
export function validatePlan(raw: unknown, ctx: PlanCtx): { plan: SagaPlan | null; repairs: string[]; defects: string[]; ownJobs: number[] } {
  const { w } = ctx;
  const repairs: string[] = [], defects: string[] = [], ownJobs: number[] = [];
  const parsed = zPlanOut.safeParse(raw);
  if (!parsed.success) return { plan: null, repairs, defects: ['not a plan object'], ownJobs };
  const o = parsed.data;
  const ids = new Set(w.cast.map(p => p.id));
  const need = (v: string | undefined, what: string) => { if (!v?.trim()) defects.push(`missing ${what}`); return v?.trim() ?? '' };
  // labels; a name inside a label is stripped (a label is what a stranger sees)
  const cast: CastEntry[] = w.cast.map(p => {
    const got = o.cast?.find(c => c.id === p.id);
    let label = got?.label?.trim() ?? '';
    for (const q of w.cast) for (const part of nameParts(q)) if (new RegExp(`\\b${esc(part)}\\b`).test(label)) {
      label = label.replace(new RegExp(`\\s*\\b${esc(part)}\\b,?`, 'g'), '').replace(/\s{2,}/g, ' ').trim();
      repairs.push(`name stripped from ${p.id}'s label`);
    }
    // the company's own soldier is asked for no label (cards and reports call them "one of your
    // soldiers"); theirs only feeds the mention match, so it is the engine's, silently
    if (!label && p.seat === 'soldier') label = an(`${RACE_WORD[p.race] ?? p.race} soldier`);
    // (R5 verify) a label is race and trade: a trait word the engine dealt goes (it came back as a fixed epithet in every
    // job, trouble and card, "the clumsy scholar"), and with it the comma list it led ("thin, slow-witted human hunter"
    // was cut at its comma to "thin")
    const traitWords = (p.traits ?? '').split(/,\s*/).filter(Boolean);
    if (label && traitWords.length) {
      const kept = traitWords.reduce((t, x) => t.replace(new RegExp(`\\b${esc(x)}\\b,?\\s*`, 'gi'), ''), label).replace(/^[\s,]+|[\s,]+$/g, '').replace(/\s{2,}/g, ' ');
      if (kept !== label.trim() && kept.replace(/^(?:an?|the)\s+/i, '')) { label = kept; repairs.push(`trait stripped from ${p.id}'s label`) }
    }
    if (!label) { label = engineLabel(p); repairs.push(`canned label for ${p.id}`) }
    // (R5 verify 2) race and trade dealt as two keys can come back comma-joined ("elf, grove-warden"): the race leads the
    // trade, never a list the comma cut below would leave at "elf"
    const race = RACE_WORD[p.race] ?? p.race;
    const joined = label.replace(new RegExp(`^((?:an?|the)\\s+)?(${esc(race)}),\\s*`, 'i'), '$1$2 ');
    if (joined !== label) { label = joined; repairs.push(`race joined to ${p.id}'s label`) }
    const short = shortLabel(label);
    // (R5 verify 2) a cut that leaves one word other than a dealt trade ("scrawny, slow human hunter" → "scrawny") is the
    // engine's race and trade instead: a lone trait word was printed as the person ("Rautio — thin") and dealt to cards.
    // With no trade dealt (a lean asker's is the plan's to coin) the cut stands: the engine has no trade to put back
    const lone = short.replace(/^(?:an?|the)\s+/i, '').split(/\s+/);
    if (short !== label) { label = p.trade && lone.length < 2 && lone[0]!.toLowerCase() !== p.trade.toLowerCase() ? engineLabel(p) : short; repairs.push(`long label cut for ${p.id}`) }
    // (R4 verify) a label is a common noun phrase that stands mid-sentence: a capital that opens no place name goes
    // ("Short hot-headed sailor" printed as "the Short hot-headed sailor"); a place-led label keeps it
    const head = label.replace(/^(?:an?|the)\s+/i, '');
    if (/^\p{Lu}/u.test(head) && !w.places.some(pl => head.startsWith(pl)) && !w.land.includes(head.split(/\s+/)[0]!)) {
      label = label.slice(0, label.length - head.length) + lc1(head); repairs.push(`label lowercased for ${p.id}`);
    }
    // only the one the company acts for has a want: it reaches every card (premise, helping). The plan no
    // longer writes one for anyone else: no writer read it, and dealt to cards (R1 verify) an opponent's
    // want named the hidden answer on card 1 and came out as flat "X wants Y" lines
    const actFor = p.seat === 'client' || p.seat === 'soldier';
    const mine = p.seat === 'soldier' ? o.soldier : p.seat === 'client' ? o.asker : undefined;
    const past = p.seat === 'soldier' ? o.soldier?.past?.trim() || got?.past?.trim() || undefined : undefined;
    let want = actFor ? mine?.want?.trim() || got?.want?.trim() : undefined;
    // a want that restates its own subject ("Indure wants the merchant stopped") printed as "wants: Indure
    // wants…": the subject goes when it is this person (name, label or pronoun)
    const subj = want?.match(/^(?:((?:[\w'-]+\s+){0,3}?[\w'-]+)\s+)?wants?\s+(\S.*)$/i);
    if (subj && (!subj[1] || saysName(subj[1], p) || /^(?:he|she|they)$/i.test(subj[1]) || new RegExp(`\\b${esc(headNoun(label))}\\b`, 'i').test(subj[1]))) {
      want = subj[2]!; repairs.push(`subject cut from ${p.id}'s want`);
    }
    // (R5, P4) the want is printed after "wants to" (the For line, card 1's premise): a "to" it brings goes
    if (want && /^to\s+/i.test(want)) want = want.replace(/^to\s+/i, '');
    // ...and mid-sentence: a capital that opens no name or place goes ("Free her brother" → "wants to free her brother")
    if (want && !w.cast.some(q => nameParts(q).includes(want!.split(/\s+/)[0]!)) && !w.places.some(pl => want!.startsWith(pl))) want = lc1(want);
    // no canned stand-in says the want or the past honestly ("to save a life" — whose?), so a missing one is
    // a hard defect (one plain re-draw), as the pitch was when the plan wrote card 1
    if (actFor && !want) defects.push(`missing want for ${p.id}`);
    if (p.seat === 'soldier' && !past) defects.push('missing soldier past');
    return { ...p, label, want: actFor ? want || cannedWant(p, w.stake) : '', ...(past ? { past } : {}) };
  });
  // a personal saga's soldier is in every job's people, for the prose (the lab's pickParty sent them on every job); the
  // game pins them to a place only on the jobs the plan itself put them in (`ownJobs`)
  const soldier = w.cast.find(p => p.seat === 'soldier');
  const people = (xs: string[] | undefined, where: string, job?: number) => {
    const kept = (xs ?? []).filter(x => ids.has(x));
    if ((xs ?? []).length !== kept.length) repairs.push(`unknown ids dropped from ${where}`);
    if (soldier && kept.includes(soldier.id) && job !== undefined) ownJobs.push(job);
    if (soldier && !kept.includes(soldier.id)) { kept.unshift(soldier.id); repairs.push(`soldier added to ${where}`) }
    return [...new Set(kept)];
  };
  const trouble = (t: z.infer<typeof zTrouble>, where: string): Trouble => {
    if (!t?.who?.trim()) defects.push(`missing trouble in ${where}`);
    return { who: t?.who?.trim() ?? '', carry: t?.carry?.trim() ?? '', will: t?.will?.trim() ?? '' };
  };
  const want = w.N - 1;
  const eps = (o.episodes ?? []);
  if (eps.length > want) repairs.push(`${eps.length - want} extra episode(s) cut`);
  if (eps.length < want) defects.push(`${eps.length} episodes, need ${want}`);
  const used: JobType[] = [];
  const episodes: Episode[] = eps.slice(0, want).map((e, i) => {
    let type: JobType;
    const t = (e.type ?? '').trim().toLowerCase() as JobType;
    if (JOB_TYPES.includes(t)) type = t;
    else { type = JOB_TYPES.find(x => !used.includes(x)) ?? 'find'; repairs.push(`episode ${i + 1}: type "${e.type ?? ''}" → ${type}`) }
    used.push(type);
    return {
      n: i + 1, type, title: need(e.title, `episode ${i + 1} title`), job: need(e.job, `episode ${i + 1} job`),
      people: people(e.people, `episode ${i + 1}`, i + 1), trouble: trouble(e.trouble, `episode ${i + 1}`),
      win: need(e.win, `episode ${i + 1} win`), gain: need(e.gain, `episode ${i + 1} gain`), learn: need(e.learn, `episode ${i + 1} learn`),
      why: need(e.why, `episode ${i + 1} why`),
    };
  });
  const sd = o.showdown;
  if (!sd) defects.push('missing showdown');
  const showdown: Episode = {
    n: want + 1, type: 'showdown', title: need(sd?.title, 'showdown title'), job: need(sd?.job, 'showdown job'),
    // (R5 verify 2) no why: the showdown's "what it gets them toward their want" was the want itself, and the finale card
    // printed it two rows under the log's For line (3 of 3 real runs); `settles` says how the want is met
    people: people(sd?.people, 'showdown'), trouble: trouble(sd?.trouble, 'showdown'), why: '',
    settles: need(sd?.settles, 'settles'), lose: need(sd?.lose, 'lose'), edge: edgesOf(sd?.edge, want, repairs, defects),
  };
  // a bare stake word as the loss ("a livelihood": whose? what?) was printed as is on card 1 and the last
  // chance; it becomes the stake's own concrete form for the one the company acts for ("his livelihood")
  const bare = Object.keys(STAKE_WANT).find(st => new RegExp(`^(?:(?:an?|the)\\s+)?${esc(st.replace(/^an?\s+/, ''))}\\.?$`, 'i').test(showdown.lose ?? ''));
  const actsFor = cast.find(p => p.seat === 'client' || p.seat === 'soldier');
  if (bare && actsFor) { showdown.lose = stakeLine(bare)[2](PRONOUN[actsFor.sex]); repairs.push('bare stake word in lose') }
  const ways = waysOf(w);
  // a way written into `label` and the line into `way` is swapped back; a way-like word stuck before
  // the line ("Enlist: the craftsman accepts…", "Bind — seize her…") goes, as the button shows the ending
  const opts = (o.options ?? []).map(x => {
    const wy = wayOf(x.way?.trim().toLowerCase().replace(/^by /, '') ?? '');
    let lb = x.label?.trim() ?? '';
    const lead = lb.match(/^[A-Z][a-z]+(?: [a-z]+)?\s*(?::|—|–| - )\s*(.+)$/);
    if (lead && lead[1]!.split(/\s+/).length >= 3) { lb = cap(lead[1]!); repairs.push('lead word cut from an option') }
    if (ways.includes(wy as Way)) return { way: wy, label: lb };
    const hit = ways.find(v => new RegExp(`\\b(?:${v}|${wayWord(v)})\\b`, 'i').test(lb));
    if (hit && lb.split(/\s+/).length <= 3 && x.way) { repairs.push(`option way and label swapped (${hit})`); return { way: hit, label: x.way.trim() } }
    return { way: wy, label: lb };
  });
  const options = ways.map(way => {
    const got = opts.find(x => x.way === way)?.label;
    if (!got) repairs.push(`canned option label for ${way}`);
    return { way, label: got || cannedOption(way, cast) };
  });
  const plan: SagaPlan = {
    title: need(o.title, 'title'), question: need(o.question, 'question'), answer: need(o.answer, 'answer'),
    cast, episodes, showdown, options,
  };
  // a cast id in prose ("c12 prowls the slope", "p1's home") becomes the person: their name once known, else
  // "the <label>"; "a hunter named c12" loses the id outright (§2.7 repairs)
  const ref = (p: CastEntry) => refOf(p);
  const deId = (s: string, where: string, sentence = true) => {
    let t = s, hit = false;
    for (const p of cast) {
      if (!new RegExp(`\\b${esc(p.id)}\\b`, 'i').test(t)) continue;
      hit = true;
      repairs.push(`id ${p.id} in ${where}`);
      // the id and any words beside it that already name the same person ("reeve p1", "the forest
      // reeve p1", "p1, the reeve", "p1 the forest reeve") become ONE reference: swapping the id alone
      // left "reeve the forest reeve". "(c48)" after its own label goes: it read "the elf wanderer (the
      // elf wanderer)"; "a hunter named c12" loses the id outright
      const own = [...new Set([...p.label.split(/[\s,]+/), ...(p.trade ?? '').split(/\s+/), ...nameParts(p)]
        .filter(x => x.length > 2 && !STOP.has(x.toLowerCase())))].map(esc).join('|');
      const before = own ? `(?:\\b(?:the|an?)\\s+)?(?:\\b(?:${own})\\s+)*` : '';
      const after = own ? `(?:,?\\s+(?:(?:the|an?)\\s+)?(?:(?:${own})\\s+)*(?:${own})\\b)?` : '';
      t = t.replace(new RegExp(`\\s*\\(\\s*${esc(p.id)}\\s*\\)`, 'gi'), '')
        .replace(new RegExp(`,?\\s+(?:named|called)\\s+${esc(p.id)}\\b`, 'gi'), '')
        .replace(new RegExp(`${before}\\b${esc(p.id)}\\b${after}`, 'gi'), ref(p));
    }
    // "p2, the goatherd" → "the goatherd, the goatherd" → once; "p2 the miller" → "the Yarlea miller the miller" → once
    if (hit) t = t.replace(/\b((?:[Tt]he|[Aa]n?) ([^,.;]+?)),?\s+the \2\b/g, '$1').replace(/\b((?:the|The) [^,.;]*?\b([A-Za-z-]+)),?\s+the \2\b/g, '$1');
    return hit && sentence ? t.replace(/(^|[.!?]\s+)the /g, (_m, a: string) => `${a}The `) : t;
  };
  plan.title = deId(plan.title, 'title'); plan.question = deId(plan.question, 'question'); plan.answer = deId(plan.answer, 'answer');
  for (const c of plan.cast) { if (c.want) c.want = deId(c.want, `${c.id} want`); if (c.past) c.past = deId(c.past, `${c.id} past`, false) }
  for (const e of [...plan.episodes, plan.showdown]) {
    const at = `episode ${e.n}`;
    e.title = deId(e.title, at); e.job = deId(e.job, at);
    e.trouble = { who: deId(e.trouble.who, at, false), carry: deId(e.trouble.carry, at, false), will: deId(e.trouble.will, at, false) };
    for (const k of ['win', 'gain', 'learn', 'why', 'settles', 'lose'] as const) if (e[k]) e[k] = deId(e[k]!, at, k !== 'gain');
    if (e.edge) e.edge = e.edge.map(x => deId(x, at, false));
  }
  for (const o of plan.options) o.label = deId(o.label, 'options');
  // the prompt's own word for the one the company acts for ("the asker", "the one who asked"; on a personal
  // saga "the soldier") written into plan text that a card prints becomes that person, as a cast id does
  const actFor = cast.find(p => p.seat === 'client' || p.seat === 'soldier');
  if (actFor) {
    const ROLE = actFor.seat === 'soldier' ? /\bthe soldier\b(?!s)/i : /\b(?:the asker|the one who asked)\b/i;
    const unRole = (t: string, where: string) => ROLE.test(t) ? (repairs.push(`role word in ${where}`), t.replace(new RegExp(ROLE.source, 'gi'), ref(actFor)).replace(/(^|[.!?]\s+)the /g, (_m, x: string) => `${x}The `)) : t;
    plan.question = unRole(plan.question, 'question'); plan.answer = unRole(plan.answer, 'answer');
    for (const e of [...plan.episodes, plan.showdown]) {
      e.job = unRole(e.job, `episode ${e.n}`);
      for (const k of ['win', 'gain', 'learn', 'why', 'settles', 'lose'] as const) if (e[k]) e[k] = unRole(e[k]!, `episode ${e.n}`);
      if (e.edge) e.edge = e.edge.map(x => unRole(x, `episode ${e.n}`));
    }
    for (const o of plan.options) o.label = unRole(o.label, 'options');
  }
  for (const c of plan.cast) c.label = c.label.trim();
  // an unmet name the model somehow wrote goes back to its label (it saw no such name)
  {
    const fix = (s: string) => { let t = s; for (const p of cast) if (!p.known) for (const part of nameParts(p)) t = t.replace(new RegExp(`\\b${esc(part)}\\b`, 'g'), () => { repairs.push(`unmet name ${part} → label`); return p.label }); return t };
    // why reaches every card, so an unmet name there would print before anyone met them
    // gain, learn and edge reach later cards (have, mystery) and the finale card, so they are fixed too
    for (const e of [...plan.episodes, plan.showdown]) {
      e.job = fix(e.job); e.title = fix(e.title); e.trouble = { who: fix(e.trouble.who), carry: fix(e.trouble.carry), will: fix(e.trouble.will) }; e.why = fix(e.why);
      for (const k of ['win', 'gain', 'learn'] as const) if (e[k]) e[k] = fix(e[k]!);
      if (e.edge) e.edge = e.edge.map(fix);
    }
    for (const c of plan.cast) { if (c.past) c.past = fix(c.past); if (c.want) c.want = fix(c.want) }
    if (plan.showdown.lose) plan.showdown.lose = fix(plan.showdown.lose);
    // the question is card 1's (what nobody knows yet)
    plan.question = fix(plan.question);
  }
  return { plan, repairs, defects, ownJobs };
}

/** the showdown's edges, one per middle job in job order (R2, S2). A line that names its job ("job": 2)
 *  goes to that job; plain lines fill the rest in order; extras are cut. A job with no edge is a hard
 *  defect, as a missing win is: no canned line says honestly how a held thing helps */
function edgesOf(raw: z.infer<typeof zEdge>[] | undefined, want: number, repairs: string[], defects: string[]): string[] {
  const out: (string | undefined)[] = Array.from({ length: want }, () => undefined);
  const loose: string[] = [];
  for (const x of raw ?? []) {
    const text = (typeof x === 'string' ? x : x.helps ?? x.edge ?? x.how ?? '').trim();
    if (!text) continue;
    const at = typeof x === 'string' ? NaN : Number(x.job ?? x.n);
    if (at >= 1 && at <= want && !out[at - 1]) out[at - 1] = text; else loose.push(text);
  }
  for (let i = 0; i < want && loose.length; i++) if (!out[i]) out[i] = loose.shift();
  if (loose.length) repairs.push(`${loose.length} extra edge(s) cut`);
  out.forEach((x, i) => { if (!x) defects.push(`missing edge for episode ${i + 1}`) });
  return out.map(x => x ?? '');
}

/** a label is what a stranger sees in two or three words, a noun phrase that can stand in a sentence.
 *  A clause after it ("miller who keeps every account in a battered book") was repeated whole at every
 *  mention, and a "trade, look" list ("miller, flour-dusted keeper") was pasted as a prefix: anything after a comma
 *  goes, and a clause goes from a label past three words */
const LABEL_CLAUSE = /\s+(?:who|whose|that|with|from|in|at|on|wearing|carrying|holding)\s+/i;
export function shortLabel(label: string): string {
  // the sex is dealt beside every label, so a label that leads with it ("woman baker") drops it
  const head = (label.split(/[,;(]/)[0]!.trim() || label.trim()).replace(/^((?:an?|the)\s+)?(?:wo)?man\s+(?=\S)/i, '$1');
  if (head.replace(/^(?:an?|the)\s+/i, '').split(/\s+/).length <= 3) return head;
  return head.split(LABEL_CLAUSE)[0]!.trim() || head;
}
/** the engine's own label, race and trade as the plan's should be ("a human hunter"; no trade: "an elf woman") */
const engineLabel = (p: SagaPerson) => an(`${RACE_WORD[p.race] ?? p.race} ${p.trade ?? manWoman(p.sex)}`);
/** "the <label>" from a label written any way ("a thin hunter", "thin hunter, slow-eyed") */
export const theLabel = (label: string) => `the ${label.split(',')[0]!.replace(/^(?:an?|the)\s+/i, '').trim()}`;
/** a person in engine-written text: their name once known, else "the <label>" */
const refOf = (p: SagaPerson & { label: string }) => p.known ? p.name : theLabel(p.label);
export const PRONOUN = { male: { sub: 'he', obj: 'him', pos: 'his' }, female: { sub: 'she', obj: 'her', pos: 'her' } } as const;
export function cannedOption(way: Way, cast: CastEntry[]): string {
  const f = cast.find(p => p.focal)!, opp = cast.find(p => p.seat === 'opponent')!;
  const who = refOf(f), o = refOf(opp);
  return {
    recruit: `Offer ${who} a place in the company`, captive: `Take ${who} to the fort in chains`,
    gold: helped(f) ? `Take a share of ${who}'s treasure and let ${PRONOUN[f.sex].obj} go ${PRONOUN[f.sex].pos} way` : `Take what ${who} hoards and let ${PRONOUN[f.sex].obj} go`, talk: `Talk it out with ${o}`, fight: `Fight it out with ${o}`,
    sneak: `Slip past ${o}'s guards and settle it unseen`,
  }[way];
}
/** what the one who asked wants, and what is settled for them, from the dealt stake: the floor's
 *  (and a missing want's) stand-in, concrete per saga instead of one canned line for every saga */
type StakeLine = (who: string, pos: string) => string;
type Pro = (typeof PRONOUN)['male' | 'female'];
/** [want, settles, lose]; lose in a few words, as the plan writes it (the engine makes the sentence) */
const STAKE_WANT: Record<string, [(pos: string) => string, StakeLine, (he: Pro) => string]> = {
  'a home': [pos => `to keep ${pos} home`, (who, pos) => `${who} keeps ${pos} home.`, he => `${he.pos} home`],
  'a livelihood': [pos => `to save ${pos} livelihood`, (who, pos) => `${who} keeps ${pos} livelihood.`, he => `${he.pos} livelihood`],
  // (lose: "the life she feared for" ran into the engine's "for good": "loses the life she feared for for good")
  'a life': [() => 'to save a life', who => `The life ${who} feared for is saved.`, he => `a life dear to ${he.obj}`],
  freedom: [() => 'to see the one held set free', who => `The one held goes free, as ${who} wanted.`, he => `the one ${he.sub} wanted freed`],
  'someone loved': [() => 'to get someone dear back safe', who => `${who} gets someone dear back safe.`, he => `someone ${he.sub} holds dear`],
  'a good name': [pos => `to clear ${pos} name`, (who, pos) => `${who}'s name is cleared.`, he => `${he.pos} good name`],
  'a promise': [pos => `to keep ${pos} promise`, (who, pos) => `${who} keeps ${pos} promise.`, he => `the promise ${he.sub} made`],
};
const stakeLine = (stake: string) => STAKE_WANT[stake] ?? STAKE_WANT['a promise']!;
/** the stakes the floor's loss can say someone takes ("her home, taken by the reeve") */
const TAKEN = new Set(['a home', 'a livelihood', 'a good name', 'someone loved']);
/** the want of the one the company acts for (the only person with a want), from the stake: the floor's */
const cannedWant = (p: SagaPerson, stake: string): string => stakeLine(stake)[0](PRONOUN[p.sex].pos);

const STOP = new Set('the a an of to in and that was is who his her their it for with on at by from as has had have been be not but this they them he she its only than so what when where which will would'.split(' '));
const stem = (x: string) => x.slice(0, 5);
const contentWords = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x));

/** the answer's key words: its content words minus the seed, labels, names, places and the question's own words
 *  (card 1 prints the question, and an answer shares its subject). Shared by the plan lint (leaks before the finale) and
 *  the report lint (the reveal in `after`) */
export function answerKeys(plan: SagaPlan, w: SagaWorld, seed = seedText(w)): { answerWords: string[]; plainStems: Set<string> } {
  const plainSet = new Set([...seed.toLowerCase().split(/\W+/), ...plan.cast.flatMap(p => [...p.label.toLowerCase().split(/\W+/), ...nameParts(p).map(x => x.toLowerCase())]),
    ...w.places.map(x => x.toLowerCase()), ...plan.question.toLowerCase().split(/\W+/)]);
  const plainStems = new Set([...plainSet].map(stem));
  return { answerWords: (plan.answer.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x) && !plainStems.has(stem(x))), plainStems };
}
/** (R3, W5) log-only: the finale's `after` should carry the reveal; a share of the answer's key words below the bar says
 *  it was left out. Nothing re-rolls on it */
export function revealLint(plan: SagaPlan, w: SagaWorld, after: string, seed = seedText(w)): string | null {
  const keys = [...new Set(answerKeys(plan, w, seed).answerWords.map(stem))];
  if (keys.length < 2) return null;
  const said = new Set((after.toLowerCase().match(/[a-z]{4,}/g) ?? []).map(stem));
  const got = keys.filter(x => said.has(x)).length;
  return got / keys.length < 0.34 ? `finale after lacks the answer (${got}/${keys.length} key words)` : null;
}

/** §2.7 log-only telemetry: nothing here re-rolls anything */
export function planLint(plan: SagaPlan, w: SagaWorld, seed = seedText(w)): string[] {
  const out: string[] = [];
  // (a person the seed names may appear, so the seed's own words are no stray either)
  const known = new Set([...w.cast.flatMap(p => nameParts(p)), ...w.places, ...w.land.split(/\W+/), ...seed.split(/\W+/)]);
  const skip = new Set(plan.cast.flatMap(p => [p.trade ?? '', p.traits ?? '', p.label].join(' ').split(/\W+/)));
  // the answer, learns, gains and edges too (R2): an answer naming someone not in cast printed or was dropped
  const fields = [plan.question, plan.answer, ...plan.episodes.flatMap(e => [e.job, e.trouble.who, e.trouble.carry, e.trouble.will, e.win ?? '', e.gain ?? '', e.learn ?? '', e.why]),
    plan.showdown.job, plan.showdown.settles ?? '', plan.showdown.lose ?? '', ...(plan.showdown.edge ?? [])];
  // a capital that does not open a sentence and names nobody and nowhere the engine dealt
  const stray = [...new Set(fields.flatMap(f => f.split(/[.!?:;"]\s*/).flatMap(s => s.trim().split(/\s+/).slice(1)))
    .map(t => t.replace(/[^A-Za-z'-]/g, '').replace(/'s$/, '')).filter(t => /^[A-Z][a-z]{2,}/.test(t) && !known.has(t) && !skip.has(t)))];
  if (stray.length) out.push(`stray capitalised: ${stray.join(', ')}`);
  const { answerWords, plainStems } = answerKeys(plan, w, seed);
  // lose, every printed why and the want of the one the company acts for reach a card before any learn, so all count as
  // early. (R2) A word an earlier job's learn already brought to light is no leak where it prints after that win
  const learnt = (upTo: number) => new Set(plan.episodes.slice(0, upTo).flatMap(e => (e.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? []).map(stem));
  const leakIn = (text: string, known: Set<string>) => answerWords.filter(x => !known.has(stem(x)) && new RegExp(`\\b${x}\\b`).test(text.toLowerCase()));
  // (R4 verify) a saga with a road ahead prints every job's text on card 1 (questLog), so no learn excuses it. (R5 verify)
  // Not its why: the road's line is the outline's. (R5 verify 2) Only job 1's why prints at all (`jobWhy`)
  const road = plan.episodes.length >= 2;
  const printedWhy = plan.episodes.slice(0, 1);
  const leak = [...new Set([
    ...leakIn([plan.showdown.lose ?? '', ...plan.cast.map(p => p.want), ...printedWhy.map(e => e.why)].join(' '), new Set()),
    ...plan.episodes.flatMap((e, i) => [...leakIn(e.title, learnt(i)), ...leakIn(e.job, road ? new Set() : learnt(i)), ...leakIn(e.win ?? '', learnt(i + 1))]),
    ...leakIn((plan.showdown.edge ?? []).join(' '), learnt(plan.episodes.length)),
  ])];
  if (leak.length) out.push(`answer words before the finale: ${leak.join(', ')}`);
  // (R2, S1/S6) a learn is hidden until its own win: its words in its own card's why spoil it; a learn that holds most of
  // the answer is the whole answer told mid-saga
  plan.episodes.forEach(e => {
    const named = `${e.title} ${e.job}`.toLowerCase(), why = printedWhy.includes(e) ? e.why.toLowerCase() : '';
    const lw = [...new Set((e.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(x => !STOP.has(x) && !plainStems.has(stem(x)));
    const spoil = lw.filter(x => new RegExp(`\\b${x}\\b`).test(why) && !new RegExp(`\\b${x}\\b`).test(named));
    if (spoil.length >= 2) out.push(`episode ${e.n} why tells its learn: ${spoil.join(', ')}`);
    const lstems = new Set(lw.map(stem));
    if (answerWords.length >= 3 && answerWords.filter(x => lstems.has(stem(x))).length >= 0.75 * answerWords.length) out.push(`episode ${e.n} learn tells the whole answer`);
  });
  // (R4 verify) ...and a later job whose text carries an earlier learn tells it on card 1, before it is found
  if (road) plan.episodes.forEach((e, i) => {
    const shown = new Set(plan.episodes.slice(0, i).flatMap(x => `${x.title} ${x.job}`.toLowerCase().match(/[a-z]{4,}/g) ?? []).map(stem));
    const said = e.job.toLowerCase();
    const prior = [...new Set(plan.episodes.slice(0, i).flatMap(x => (x.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? []))]
      .filter(x => !STOP.has(x) && !plainStems.has(stem(x)) && !shown.has(stem(x)) && new RegExp(`\\b${x}\\b`).test(said));
    if (prior.length >= 2) out.push(`episode ${e.n} job carries an earlier learn: ${prior.join(', ')}`);
  });
  // (R3, W2) a who-question's who named by a learn spends the answer mid-saga: the person the answer names first
  if (/^nobody knows[:,]?\s+who\b/i.test(plan.question.trim())) {
    const who = plan.cast.filter(p => mentions(plan.answer, p)).sort((a, b) => firstAt(plan.answer, a) - firstAt(plan.answer, b))[0];
    if (who) plan.episodes.forEach(e => { if (e.learn && mentions(e.learn, who)) out.push(`episode ${e.n} learn names the who the question asks for`) });
  }
  // ...and together: the learns of every job leave the showdown nothing to bring out
  const allLearnt = learnt(plan.episodes.length);
  const share = answerWords.length >= 4 ? answerWords.filter(x => allLearnt.has(stem(x))).length / answerWords.length : 0;
  if (share >= 0.4) out.push(`the learns share ${Math.round(share * 100)}% of the answer's words before the showdown`);
  // (R5, P2) why says what the asker hopes the job gets them: word or proof as a hope, never as fact
  for (const e of printedWhy) { const m = assertsKnowing(e.why); if (m) out.push(`episode ${e.n} why asserts what it shows (${m})`) }
  // (R4 verify 2) why uses only what the job names: a why that names the job's gain beyond it tells what the job yields
  printedWhy.forEach(e => {
    const named = new Set(`${e.title} ${e.job}`.toLowerCase().match(/[a-z]{4,}/g)?.map(stem) ?? []);
    const g = [...new Set((e.gain ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(x => !STOP.has(x) && !plainStems.has(stem(x)) && !named.has(stem(x)) && new RegExp(`\\b${x}\\b`).test(e.why.toLowerCase()));
    if (g.length) out.push(`episode ${e.n} why names its gain beyond the job: ${g.join(', ')}`);
  });
  // ...and the finale's PLANS buttons decide someone the showdown's job should name
  if (!w.personal && !mentions(plan.showdown.job, choiceTarget(plan))) out.push('showdown job does not name the person in ending');
  if (plan.episodes[0] && !plan.episodes[0].people.includes(w.focalId)) out.push('the person in ending is not among job 1\'s people');
  // fields the plan is asked to keep to a few words: a finished clause here was pasted whole into cards
  const long = (v: string | undefined, max: number) => (v ?? '').split(/\s+/).filter(Boolean).length > max;
  for (const e of [...plan.episodes, plan.showdown]) for (const f of ['who', 'carry', 'will'] as const) if (long(e.trouble[f], 6)) out.push(`episode ${e.n} trouble.${f} past 6 words`);
  if (long(plan.showdown.lose, 8) || /\b(?:loses?|lost)\b|^if\b/i.test(plan.showdown.lose ?? '')) out.push('lose past a few words');
  for (const c of plan.cast) if (long(c.past, 8)) out.push(`${c.id} past past a few words`);
  // (R2, S2) a gain is a few words; a gain that is the person the ending decides is held before the showdown
  const target = choiceTarget(plan);
  for (const e of plan.episodes) {
    if (long(e.gain, 8)) out.push(`episode ${e.n} gain past a few words`);
    const own = [...nameParts(target), headNoun(target.label)].filter(x => x.length > 2).map(esc).join('|');
    if (e.gain && own && new RegExp(`\\b(?:${own})\\b(?!['’]s)`, 'i').test(e.gain)) out.push(`episode ${e.n} gain is the person in ending`);
  }
  (plan.showdown.edge ?? []).forEach((x, i) => { if (long(x, 14)) out.push(`edge ${i + 1} past a few words`) });
  if (/\bif\b/i.test(plan.showdown.settles ?? '')) out.push('settles says "if"');
  // the showdown's trouble should be someone in cast, by label
  if (!plan.cast.some(p => p.seat !== 'soldier' && mentions(plan.showdown.trouble.who, p))) out.push('showdown trouble names nobody in cast');
  const PART_WORDS = /\b(the (?:client|ally|obstacle|quarry|rival|opponent|focal|target))\b/i;
  for (const p of plan.cast) if (PART_WORDS.test(p.label)) out.push(`part-word label: ${p.label}`);
  return out;
}

// ─── who is named where (§2.5) ──────────────────────────────────────────────────────────────────

/** what the player knows of each person so far:
 *   met   — may be named (R5): the client, the personal soldier, a returning face, then anyone a delivered report named.
 *   named — the player has READ this person's name. Until then a name travels with its label.
 *   seen  — the person has appeared at all, by name or by label (memory is dealt before this). */
export interface Knowing { met: Set<string>; named: Set<string>; seen: Set<string> }
/** a person as a card or report receives them: name, label, sex, and `intro` / `memory` / `part` */
type Entry = Record<string, string | boolean>;
/** named from the start: the company's own soldier and a returning face. (R5 verify) Not the one the company acts for:
 *  card 1 brings them in by name and label (`intro`); from card 2 the For line does (`forLineShown`) */
export const newKnowing = (cast: SagaPerson[]): Knowing => ({ met: new Set(cast.filter(p => p.known).map(p => p.id)), named: new Set(cast.filter(p => p.seat === 'soldier' || p.memory).map(p => p.id)), seen: new Set() });
/** (R5 verify) a card whose log prints the For line has introduced the one the company acts for by name and label */
export const forLineShown = (plan: SagaPlan, k: Knowing) => { k.named.add(clientOf(plan).id); k.seen.add(clientOf(plan).id) };
const PERSON_NOUNS = new Set(['woman', 'man', 'girl', 'boy', 'lad', 'lass', 'person', 'fellow', 'folk', 'one', 'stranger', 'figure']);
/** the head noun of a label: "the lord of Ashworth Hold" → lord, "a hill-farm widow" → widow; a bare
 *  "man"/"woman" says nothing ("woodcutter woman" → woodcutter), or every woman would match */
export function headNoun(label: string): string {
  const core = label.toLowerCase().replace(/^(an?|the)\s+/, '').split(/\s+(?:of|who|with|from|in|at|on|whose|that)\s+|,/)[0]!;
  const words = core.trim().split(/\s+/).map(x => x.replace(/['’]s$/, ''));
  while (words.length > 1 && PERSON_NOUNS.has(words[words.length - 1]!)) words.pop();
  return words[words.length - 1]!;
}
const saysName = (text: string, p: SagaPerson) => nameParts(p).some(n => new RegExp(`\\b${esc(n)}\\b`).test(text));
const saysLabel = (text: string, p: CastEntry) => { const noun = headNoun(p.label); return noun.length > 2 && new RegExp(`\\b${esc(noun)}s?\\b`).test(text.toLowerCase()) };
export const mentions = (text: string, p: CastEntry) => saysName(text, p) || saysLabel(text, p);
/** (R3 verify) a mention that places the person in the scene: by name or label's head noun, never only as an owner */
const placesThere = (text: string, p: CastEntry) => {
  const noun = headNoun(p.label);
  const direct = (x: string, flags: string) => new RegExp(`\\b${esc(x)}s?\\b(?!['’]s\\b)`, flags).test(flags.includes('i') ? text.toLowerCase() : text);
  return nameParts(p).some(n => direct(n, '')) || (noun.length > 2 && direct(noun, 'i'));
};
/** where a text first refers to a person (name or label's head noun), for ordering; Infinity when it never does */
const firstAt = (text: string, p: CastEntry): number => {
  const at = [...nameParts(p).map(n => text.search(new RegExp(`\\b${esc(n)}\\b`))), text.toLowerCase().search(new RegExp(`\\b${esc(headNoun(p.label))}s?\\b`))].filter(i => i >= 0);
  return at.length ? Math.min(...at) : Infinity;
};
const mayName = (p: CastEntry, k: Knowing) => k.met.has(p.id);
/** someone already in the story, as a field names them: their name once it may be said, else "the <label>" */
const callName = (p: CastEntry, k: Knowing) => mayName(p, k) ? p.name : theLabel(p.label);

/** An entry carries the sex and `intro` for the one the player meets here. The label goes only where it does work
 *  (R4 verify): on an `intro`; on a name the dealt text calls by its label; and on the company's own soldier */
const labelOf = (p: CastEntry, view: 'card' | 'report') => p.seat !== 'soldier' ? p.label : view === 'card' ? 'one of your soldiers' : "one of the company's soldiers";
const entry = (p: CastEntry, k: Knowing, view: 'card' | 'report', dealt: string): Entry => {
  const intro = !k.named.has(p.id);
  // a met person's label ties a role word to the name, so it is that role word alone ("a merchant")
  const label = intro || p.seat === 'soldier' ? labelOf(p, view) : saysLabel(dealt, p) ? an(headNoun(p.label)) : undefined;
  return { name: p.name, ...(label ? { label } : {}), sex: manWoman(p.sex), ...(intro ? { intro: true } : {}) };
};
/** one person as a card receives them: the unnamed keep only their label (§2.5). (R3) A label-only entry carries no
 *  `intro` */
const cardEntry = (p: CastEntry, k: Knowing, dealt: string): Entry =>
  mayName(p, k) ? entry(p, k, 'card', dealt) : { label: labelOf(p, 'card'), sex: manWoman(p.sex) };
/** a report names whoever is there (reports are where strangers are met, §2.5) */
const reportEntry = (p: CastEntry, k: Knowing, dealt: string) => entry(p, k, 'report', dealt);
export const displayName = (p: CastEntry, k: Knowing) => mayName(p, k) ? p.name : p.label;
/** ON THIS MATTER (§4.3): the people this card calls by name — name — label */
export const onThisMatter = (plan: SagaPlan, text: string) =>
  plan.cast.filter(p => saysName(text, p)).map(p => ({ id: p.id, name: p.name, label: p.label.replace(/^an? /, '') }));
/** the lab's ON THIS MATTER line, from the structured matter */
export const matterLine = (matter: { name: string; label: string }[]) => matter.length ? `ON THIS MATTER: ${matter.map(m => `${m.name} — ${m.label}`).join(' · ')}` : '';

/** after a text is delivered: who appeared, whose name was read, and who a report named (met). A name counts as read only
 *  in a text that also carries the label's head noun, so the player could tie the name to the role */
export function noteDelivered(text: string, plan: SagaPlan, k: Knowing, isReport: boolean): void {
  for (const p of plan.cast) {
    if (mentions(text, p)) k.seen.add(p.id);
    if (saysName(text, p)) { if (saysLabel(text, p)) k.named.add(p.id); if (isReport) k.met.add(p.id) }
  }
}

// ─── card and report payloads (§2.5, §2.9.2, §2.9.3) ────────────────────────────────────────────

export interface CardCall { payload: Record<string, unknown>; flags: string[]; vars: Record<string, number> }

export const newState = (): SagaState => ({ learned: [], held: [] });
/** after a job's report: a won middle job's learn and gain enter the record */
export function bank(state: SagaState, e: Episode, outcome: Outcome): void {
  if (e.type === 'showdown' || outcome === 'failure' || state.held.includes(e.n)) return;
  state.held.push(e.n);
  if (e.learn) state.learned.push(e.learn);
}
/** what the company holds, as a later text receives it: the gains of won jobs; in the FINALE REPORT each with the
 *  showdown's edge for it. (R3, W4) Cards get the held things by name only */
export function haveOf(plan: SagaPlan, state: SagaState, finale: boolean): string[] | { holds: string; helps: string }[] {
  const held = state.held.map(n => plan.episodes[n - 1]).filter((e): e is Episode => !!e?.gain);
  return finale ? held.map(e => ({ holds: e.gain!, helps: plan.showdown.edge?.[e.n - 1] ?? '' })).filter(x => x.helps) : held.map(e => e.gain!);
}
/** a person's part reaches a text only when they are in THIS job (R2, S4) */
const inJob = (plan: SagaPlan, e: Episode, finale: boolean): string[] => [...e.people, ...(finale ? [choiceTarget(plan).id] : [])];
/** the one the company acts for: the client, or on a personal saga its own soldier */
export const clientOf = (plan: SagaPlan) => plan.cast.find(p => p.seat === 'client' || p.seat === 'soldier')!;
/** whom the finale's choice is about: the focal, or, when the focal is the company's own soldier, the one in their way */
export const choiceTarget = (plan: SagaPlan) => plan.cast.find(p => p.focal && p.seat !== 'soldier') ?? plan.cast.find(p => p.seat === 'opponent')!;

/** (R3 verify 2) a names/people gloss only for a key some entry carries (§2.8.2) */
const entryFlags = (xs: Entry[]) => [...(xs.some(n => n.intro) ? ['intro'] : []), ...(xs.some(n => n.part) ? ['part'] : [])];
/** (R3 verify 2) the saga's question as a later card receives it: the open question bare, never card 1's finished
 *  "Nobody knows …" sentence */
export const openQuestion = (q: string) => {
  const m = q.trim().match(/^(?:nobody|no one|no-one)\s+knows[:,]?\s+(.+?)[.?!]*$/i);
  return m ? m[1]! : q.trim();
};

export function firstCardPayload(plan: SagaPlan, w: SagaWorld, k: Knowing, direction?: string): CardCall {
  const e = plan.episodes[0] ?? plan.showdown;
  const client = clientOf(plan);
  // (R5, P5) card 1 tells its premise in prose: who needs you and what they want, what nobody knows (the open question,
  // bare), on a personal saga the soldier's old wrong. (R5 verify) One owner per fact: card 1's log prints neither the
  // For line nor the Open question. The loss is not dealt here
  const past = w.personal && client.past ? client.past : undefined;
  const planText = `${e.job} ${e.why} ${JSON.stringify(e.trouble)} ${plan.question}`;
  const names = namesFor(plan, [client.id, ...e.people], planText, k, [client.id], e.trouble.who, inJob(plan, e, false), [client.id]);
  // (R5 verify) a returning asker's past with the company is part of the premise, and it leaves their names entry
  const mine = names.find(n => n.name === client.name);
  const memory = mine?.memory ? String(mine.memory) : undefined;
  if (mine) delete mine.memory;
  const premise = { who: displayName(client, k), wants: wantPhrase(client.want), ...(past ? { past } : {}), ...(memory ? { memory } : {}), unknown: openQuestion(plan.question) };
  // (R5, P5) the trouble without `will`, as on the finale (R3, W4)
  const trouble = { who: e.trouble.who, carry: e.trouble.carry };
  const flags = ['first'];
  if (e.why) flags.push('why');
  if (past) flags.push('personal');
  if (memory) flags.push('returning');
  if (names.some(n => n.memory)) flags.push('memory');
  flags.push(...entryFlags(names));
  if (direction) flags.push('direction');
  return { payload: { premise, job: e.job, ...(e.why ? { why: e.why } : {}), trouble, names, ...(direction ? { direction } : {}) }, flags, vars: { MAX: 70 } };
}

/** (R4, Q2) a later card is a scene: what happened last, the job and why it matters, who is in the way. The bookkeeping
 *  is the quest log's (`questLog`). Kept: latest or retry, job, why, trouble, names; `lose` only at a last chance */
export function laterCardPayload(plan: SagaPlan, e: Episode, latest: string, k: Knowing, o: { finale: boolean; lastchance: boolean; retry?: boolean; direction?: string; why?: string }): CardCall {
  const client = clientOf(plan), target = choiceTarget(plan);
  // (R5 verify 2) the job's hope from its one owner (`jobWhy`); the finale none
  const why = o.finale ? undefined : o.why?.trim() || undefined;
  const always = o.finale ? [target.id] : [];
  const lose = o.finale && o.lastchance && e.lose ? { who: callName(client, k), loses: e.lose } : undefined;
  const planText = `${e.job} ${why ?? ''} ${JSON.stringify(e.trouble)}`;
  // (R4 verify) the finale's PLANS buttons name people too, so a named entry they call by label keeps it
  const shown = o.finale ? plan.options.map(x => x.label).join(' ') : '';
  const names = namesFor(plan, [...always, ...e.people], `${latest} ${planText}`, k, always, e.trouble.who, inJob(plan, e, o.finale), [client.id], shown);
  const flags = [o.finale ? 'finale' : 'later'];
  if (names.some(n => n.memory)) flags.push('memory');
  flags.push(...entryFlags(names));
  if (o.finale && o.lastchance) flags.push('lastchance');
  flags.push(o.retry ? 'retry' : 'latest');
  if (lose) flags.push('lose');
  if (o.direction) flags.push('direction');
  // (R5 verify) a retry deals only what stopped the last try (the job is under `job`)
  const payload: Record<string, unknown> = { ...(o.retry ? { retry: latest } : { latest }), job: e.job, ...(why ? { why } : {}) };
  if (why) flags.push('why');
  // (R3, W4; R5 verify, verify 2) the trouble's `will` on a later card or finale with neither a retry nor `lose`
  const will = !lose && !o.retry ? e.trouble.will : '';
  payload.trouble = will ? { who: e.trouble.who, carry: e.trouble.carry, will } : { who: e.trouble.who, carry: e.trouble.carry };
  if (will) flags.push('will');
  // `lose` carries its owner: a bare "his livelihood" read as the one the plans decide about, flipping the stakes
  if (lose) payload.lose = lose;
  payload.names = names;
  if (o.direction) payload.direction = o.direction;
  return { payload, flags, vars: { MAX: o.finale ? 90 : 70 } };
}

// ─── the quest log (R4, Q1) ─────────────────────────────────────────────────────────────────────

/** what the engine knows of the road when a card is shown (or the chronicle is written) */
export interface RoadState {
  /** the road's lines (`roadLines`): one per job before the finale; null on a saga with fewer than two jobs before it */
  lines: (string | undefined | null)[] | null;
  /** settled jobs: won (a partial is a win), or lost (the setbacks ran out on it) */
  done: Map<number, 'won' | 'lost'>;
  /** the job this card poses: its number, or the finale's (episodes + 1); unset in the chronicle */
  at?: number;
  retry?: boolean;
  /** the chronicle only: how the finale went */
  finale?: 'won' | 'lost';
}
/** "a window glazier" from a label written any way ("Window glazier", "the glazier") */
const aLabel = (label: string) => { const l = label.replace(/^(?:an?|the)\s+/i, '').trim(); return an(l ? l[0]!.toLowerCase() + l.slice(1) : l) };

/** (R5, P4) a want as it follows "wants": verb first takes "to"; one written as a thing keeps no "to" */
export const wantPhrase = (want: string) => {
  const t = want.trim().replace(/[.!]+$/, '').replace(/^to\s+/i, '');
  return /^(?:the|a|an|his|her|their|its|my|our|your|this|that|these|those|some|no|every)\b/i.test(t) || /^\p{Lu}/u.test(t) ? t : `to ${t}`;   // a name first is a thing too
};

/** (R4, Q1) the quest log: rows the ENGINE renders from data, on every saga card and in the chronicle; the AI never
 *  writes it. Rows, each left out when empty: For · Road ahead (2+ jobs before the finale) · Known · Held · Open question.
 *  `show.forLine` / `show.open` are off on card 1, whose prose tells the premise. Road marks: ✓ won and ✗ lost (title
 *  only), ▶ this job (title only), · ahead (its road line); a job the setbacks skipped is left out. The finale row is a
 *  bare "Finale" until it is played, then its title */
export function questLog(plan: SagaPlan, k: Knowing, state: SagaState, road: RoadState, show: { forLine: boolean; open: boolean }, places: readonly string[] = []): LogRow[] {
  const client = clientOf(plan);
  const out: LogRow[] = show.forLine ? [{ kind: 'for', text: `${displayName(client, k)}, ${client.seat === 'soldier' ? labelOf(client, 'card') : aLabel(client.label)}, who wants ${wantPhrase(client.want)}.` }] : [];
  const N = plan.episodes.length + 1;
  if (road.lines && N - 1 >= 2) {
    out.push({ kind: 'road', text: 'Road ahead' });
    const over = road.at === N || road.finale !== undefined;   // the finale is here: a job not settled was skipped
    plan.episodes.forEach((e, i) => {
      const n = i + 1, st = road.done.get(n);
      if (road.at === n) out.push({ kind: 'roadrow', mark: '▶', text: `${e.title}${road.retry ? ' (again)' : ''}` });
      else if (st === 'won') out.push({ kind: 'roadrow', mark: '✓', text: e.title });
      else if (st === 'lost') out.push({ kind: 'roadrow', mark: '✗', text: e.title });
      else if (!over) out.push({ kind: 'roadrow', mark: '·', text: road.lines![i] ?? e.title });
    });
    out.push(road.at === N ? { kind: 'roadrow', mark: '▶', text: `Finale: ${plan.showdown.title}` }
      : road.finale ? { kind: 'roadrow', mark: road.finale === 'won' ? '✓' : '✗', text: `Finale: ${plan.showdown.title}` }
      : { kind: 'roadrow', mark: '·', text: 'Finale' });
  }
  if (state.learned.length) out.push({ kind: 'known', text: 'Known' }, ...state.learned.map(l => ({ kind: 'knownrow' as const, text: l })));
  // each gain stands mid-list, so it reads as the plan's common noun ("the cart and its crates, a marked map"), never with
  // the capital the plan wrote it with ("The cart and its crates, A marked map"); a name or a place keeps its own
  const held = (haveOf(plan, state, false) as string[]).map(h => leadsWithName(h, plan, places) ? h.trim() : lc1(h.trim()));
  // comma-separated, unless a gain holds a comma of its own ("the runner, caught near Stonegill")
  if (held.length) out.push({ kind: 'held', text: held.join(held.some(h => h.includes(',')) ? '; ' : ', ') });
  if (show.open) out.push({ kind: 'open', text: openQuestion(plan.question) });
  return out;
}
/** whether a text opens on a proper name: someone in the cast, or a place the engine dealt */
const leadsWithName = (t: string, plan: SagaPlan, places: readonly string[]) => {
  const w0 = (t.trim().split(/\s+/)[0] ?? '').replace(/['’]s$/, '').replace(/[^\p{L}'-]/gu, '');
  return plan.cast.some(p => nameParts(p).includes(w0)) || places.some(pl => pl.split(/\s+/)[0] === w0);
};
/** the quest log as the lab printed it (the CLI's text; byte-identical to scripts/sagalab at storyteller-build-src) */
export function logLines(rows: LogRow[]): string[] {
  return rows.map(r => {
    switch (r.kind) {
      case 'for': return `For: ${r.text}`;
      case 'road': return 'Road ahead:';
      case 'roadrow': return `  ${r.mark ?? '·'} ${r.text}`;
      case 'known': return 'Known:';
      case 'knownrow': return `  ${r.text}`;
      case 'held': return `Held: ${r.text}`;
      case 'open': return `Open question: ${r.text}`;
    }
  });
}

// ─── the outline call (R4, Q3; R5) ──────────────────────────────────────────────────────────────

/** (R4, Q3) the road ahead: one small call per saga at its start, beside card 1. Its input is CARD-1-SAFE ONLY: the one
 *  the jobs are for, their want, and the text of each job after the first — never a learn, gain, edge, the answer, the
 *  finale job, a title, the plan's why (written knowing the answer) or what nobody knows (the Open question owns it) */
export function outlinePayload(plan: SagaPlan, k: Knowing): { payload: Record<string, unknown>; flags: string[] } {
  const client = clientOf(plan);
  const who = client.seat === 'soldier' ? `${client.name}, ${labelOf(client, 'card')}` : `${displayName(client, k)}, ${aLabel(client.label)}`;
  return { payload: { asker: who, wants: wantPhrase(client.want), jobs: plan.episodes.slice(1).map(e => bare(e.job)) }, flags: [] };
}
/** each job's hope, from "hopes" or "can"; the ENGINE prints "<job>. <asker> <that>.". Line i is job i + 2's */
export const zOutlineOut = z.object({ lines: z.array(z.string()) }).passthrough();
const bare = (s: string) => s.trim().replace(/[,;:.!]+$/, '');
/** (R5, P2) a job's hope as the player reads it: the asker and the outline's line, as a sentence. The engine owns the
 *  subject: one the line brings goes, and a bare verb takes "can". The road row prints it after its job, and the job's
 *  own card is dealt it as `why` (`jobWhy`) */
export const roadHope = (job: string, line: string, plan: SagaPlan, who: string) => {
  const client = clientOf(plan);
  const subj = [...nameParts(client), 'he', 'she', 'they'].map(esc).join('|');
  // a line written with what the engine prints before it, the job or the asker, keeps what follows its first "hopes" /
  // "can". Only where every word before it is the job's or the asker's
  const opens = new RegExp(`^(?:(?:${subj})\\s+)?(?:hopes|can)\\b`, 'i');
  let c = bare(line);
  const at = c.search(/\b(?:hopes|can)\b/i);
  if (!opens.test(c) && at > 0) {
    const mine = new Set([...contentWords(job), ...contentWords(`${client.name} ${client.label}`)].map(stem));
    const before = (c.slice(0, at).toLowerCase().match(/[a-z]+/g) ?? []).filter(x => !STOP.has(x) && x.length > 2);
    if (before.length && before.every(x => mine.has(stem(x)) || x.length < 4)) c = c.slice(at);
  }
  c = bare(c).replace(/^(?:so|and|then)\s+/i, '').replace(new RegExp(`^(?:(?:${subj})[,]?\\s+)+`, 'i'), '');
  const w0 = c.split(/\s+/)[0]!.replace(/[^A-Za-z'-]/g, '');
  if (/^hope$/i.test(w0)) c = c.replace(/^hope\b/i, 'hopes');
  // a third-person verb ("hopes", "wants", "has") or a modal keeps its place; a bare verb ("call", "press") takes "can"
  else if (!/^(?:can|could|may|might|will|would|must|is|has)$/i.test(w0) && !/[^s]s$/i.test(w0)) c = `can ${c}`;
  const proper = plan.cast.some(p => nameParts(p).includes(w0));
  return `${who} ${proper ? c : lc1(c)}.`;
};
/** (R5, P2) a road line: the job as the plan wrote it, as a sentence, then its hope (`roadHope`) as a second sentence */
export const roadLine = (job: string, line: string, plan: SagaPlan, who: string) => `${sentence(bare(job))} ${roadHope(job, line, plan, who)}`;
/** the outline's line for each job, in job order: none for job 1 (line i is job i + 2's) */
const linesByJob = (plan: SagaPlan, lines: string[]): (string | undefined)[] => plan.episodes.map((_e, i) => i === 0 ? undefined : lines[i - 1]?.trim() || undefined);
/** the road, one line per job before the finale; a job with no line keeps its title */
export const roadLines = (plan: SagaPlan, lines: string[], k: Knowing): (string | undefined)[] => {
  const who = displayName(clientOf(plan), k);
  return linesByJob(plan, lines).map((l, i) => l ? roadLine(plan.episodes[i]!.job, l, plan, who) : undefined);
};
/** (R5 verify 2) each job's hope as its card is dealt it (`jobWhy`), the same words as its road row */
export const roadHopes = (plan: SagaPlan, lines: string[], k: Knowing): (string | undefined)[] => {
  const who = displayName(clientOf(plan), k);
  return linesByJob(plan, lines).map((l, i) => l ? roadHope(plan.episodes[i]!.job, l, plan, who) : undefined);
};
/** (R5 verify 2) ONE owner per job's hope, dealt to that job's card as `why`: job 1's is the plan's why; a later job's is
 *  its outline line (`roadHopes`); the finale none */
export const jobWhy = (plan: SagaPlan, n: number, hopes: readonly (string | undefined | null)[] | null): string | undefined =>
  n === 1 ? plan.episodes[0]?.why || undefined : n <= plan.episodes.length ? hopes?.[n - 1] ?? undefined : undefined;
/** the floor's lines, from the card-1-safe input alone: one plain line that fits any job and promises nothing */
export function mockOutline(payload: Record<string, unknown>): { lines: string[] } {
  return { lines: (payload.jobs as string[]).map(() => 'hopes it clears the way ahead') };
}
/** (R4, Q3; R5) log-only telemetry on the outline's lines, nothing re-rolls */
export function outlineLint(lines: string[] | null, payload: Record<string, unknown>, plan?: SagaPlan): string[] {
  const out: string[] = [];
  const jobs = payload.jobs as string[];
  if (!lines) return ['outline: no lines'];
  if (lines.length !== jobs.length) out.push(`outline: ${lines.length} lines for ${jobs.length} jobs`);
  const given = JSON.stringify(payload);
  const givenStems = new Set((given.toLowerCase().match(/[a-z]{4,}/g) ?? []).map(stem));
  lines.forEach((l, i) => {
    const at = `outline ${i + 2}`;
    const n = l.split(/\s+/).filter(Boolean).length;
    if (n > 12) out.push(`${at}: ${n} words`);
    if (EMPTY_PURPOSE.test(l)) out.push(`${at}: empty purpose`);
    const kn = assertsKnowing(l);
    if (kn) out.push(`${at}: asserts what it shows (${kn})`);
    if (!/^(?:\S+\s+){0,2}(?:hopes|can)\b/i.test(l.trim())) out.push(`${at}: opens on neither hopes nor can`);
    if (jobs[i] && l.toLowerCase().includes(jobs[i]!.toLowerCase().split(/\s+/).slice(0, 5).join(' '))) out.push(`${at}: writes its job`);
    const stray = l.split(/\s+/).slice(1).map(t => t.replace(/[^A-Za-z'-]/g, '').replace(/'s$/, '')).filter(t => /^[A-Z][a-z]{2,}/.test(t) && !given.includes(t));
    if (stray.length) out.push(`${at}: name not given (${[...new Set(stray)].join(', ')})`);
    if (plan) {
      const lw = new Set((l.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(x => !STOP.has(x)).map(stem));
      plan.episodes.forEach(e => {
        const hit = [...new Set((e.learn ?? '').toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(x => !STOP.has(x) && !givenStems.has(stem(x)) && lw.has(stem(x)));
        if (hit.length >= 2) out.push(`${at}: carries learn ${e.n} (${hit.join(', ')})`);
      });
      const q = [...new Set(openQuestion(plan.question).toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(x => !STOP.has(x) && !givenStems.has(stem(x)) && lw.has(stem(x)));
      if (q.length >= 2) out.push(`${at}: carries the unknown (${q.join(', ')})`);
    }
  });
  return out;
}
const EMPTY_PURPOSE = /\bwhere to (?:look|go|turn) next\b|\bsets? (?:up|the stage for) the (?:final|last|next)\b|\b(?:final|last) (?:confrontation|showdown|battle|reckoning)\b|\bfor the (?:next|final|last) (?:job|step)\b|\bleads? (?:on )?to the (?:next|final|last)\b|\bthe next step\b/i;
/** (R5, P2) a why may say what the job is hoped to bring out, never state it as fact. Returns the verb, or null */
const ASSERT_KNOW = /\b(?:will|would|must|should|can|could|to)\s+(?:show|prove|reveal|expose|uncover|confirm|tell|name)\b|\b(?:shows|proves|proved|reveals|revealed|exposes|uncovers|confirms|proof)\b/i;
const HOPE_WORD = /\b(?:hopes?|hoping|hoped|whether|if|wonders?|might|may|perhaps)\b/i;
export function assertsKnowing(text: string): string | null {
  for (const sent of text.split(/[.;!?]+/)) {
    const m = sent.match(ASSERT_KNOW);
    if (m && !HOPE_WORD.test(sent.slice(0, m.index))) return m[0];
  }
  return null;
}

/** a part as a card or report receives it: one that points at the company's soldier names them */
const partIn = (p: CastEntry, plan: SagaPlan) => {
  const soldier = plan.cast.find(c => c.seat === 'soldier');
  return soldier ? partOf(p).replace(/\bthe soldier\b/g, soldier.name) : partOf(p);
};

/** §2.5 names filter: only the people the dealt text refers to, plus the ones the card must carry (the one it acts for,
 *  the choice on the finale). `shown`: what the player sees beside the card that the writer does not (the finale's
 *  buttons), read only for whose label a named entry still needs */
function namesFor(plan: SagaPlan, ids: string[], dealt: string, k: Knowing, always: string[], troubleWho: string, here: string[], roleGiven = always, shown = ''): Entry[] {
  const out: Entry[] = [];
  const placed = (p: CastEntry) => roleGiven.includes(p.id) || mentions(troubleWho, p);
  for (const id of [...new Set([...ids, ...plan.cast.map(p => p.id)])]) {
    const p = plan.cast.find(c => c.id === id);
    if (!p || (!always.includes(id) && !mentions(dealt, p))) continue;
    const entry = cardEntry(p, k, `${dealt} ${shown}`);
    // the part of anyone no other field places, only for someone in this job (R2, S4)
    if (!placed(p) && here.includes(p.id) && partIn(p, plan)) entry.part = partIn(p, plan);
    if (p.memory && !k.seen.has(p.id)) entry.memory = toYou(p.memory);
    out.push(entry);
  }
  return out;
}

/** (R5 verify) a memory as a card receives it, from the company's side */
export const toYou = (s: string) => s
  .replace(/\b(the) company's\b/gi, (_m, t: string) => t[0] === 'T' ? 'Your' : 'your')
  .replace(/\b(the) company\b/gi, (_m, t: string) => t[0] === 'T' ? 'You' : 'you');

/** the finale's loss as a sentence: the plan writes `lose` in a few words, the engine says whose it is */
export function lossSentence(plan: SagaPlan): string {
  const lose = (plan.showdown.lose ?? '').trim().replace(/[.!]+$/, '').replace(/\s+for good$/i, '');
  if (!lose) return '';
  if (/\b(?:loses?|lost)\b|^if\b/i.test(lose)) return sentence(lose);
  return `${clientOf(plan).name} loses ${lose} for good.`;
}
export interface ReportCall { payload: Record<string, unknown>; flags: string[]; vars: Record<string, number> }
export function reportPayload(a: {
  plan: SagaPlan; e: Episode; card: string; party: Card[]; decides: string; outcome: Outcome; finale: boolean;
  hurt: Hurt[]; cost?: Cost; option?: { way: Way; label: string }; fate?: string; k: Knowing; gravity: string; direction?: string;
  /** the saga's record BEFORE this job (R2): what was learned and what is held */
  state: SagaState;
}): ReportCall {
  const { plan, e, k } = a;
  const failedJob = a.outcome === 'failure' && !a.finale;
  const result = failedJob ? undefined : a.finale ? `${a.fate} ${a.outcome === 'failure' ? lossSentence(plan) : e.settles}` : e.win;
  // a won middle job brings its gain home and its learn to light (R2, S1/S2); a failed one neither
  const won = !a.finale && !failedJob;
  // people: those PRESENT in this job, never a soldier sent. (R3 verify) Presence is the plan's own list, the one the
  // finale decides about, and whoever the job, the trouble's side or the gain names as there (an owner's mention is not)
  const sent = new Set(a.party.map(s => s.name));
  const there = `${e.job} ${e.trouble.who}${won ? ` ${e.gain ?? ''}` : ''}`;
  const ids = [...new Set([...e.people, ...(a.finale ? [choiceTarget(plan).id] : []), ...plan.cast.filter(p => placesThere(there, p)).map(p => p.id)])];
  const flags = ['saga'];
  // a personal saga's own soldier is marked in the words the summary rule uses, so the summary may name them
  const own = plan.cast.find(p => p.seat === 'soldier');
  const ownSent = !!own && a.party.some(s => s.id === own.id);
  if (ownSent) flags.push('personal');
  const payload: Record<string, unknown> = { card: a.card, job: e.job, soldiers: a.party.map(s => ({ name: s.name, is: `${soldierIs(s)}${ownSent && s.id === own!.id ? ', whose past this story is' : ''}` })) };
  if (a.outcome !== 'failure') { payload.decides = a.decides; flags.push('decides') }
  const here = inJob(plan, e, a.finale), client = clientOf(plan);
  // (R4 verify) the text this report is dealt, for whose label a named entry still needs
  const dealt = [a.card, e.job, JSON.stringify(e.trouble), result ?? '', a.option?.label ?? '', won ? `${e.gain ?? ''} ${e.learn ?? ''}` : '', ...a.state.learned,
    JSON.stringify(haveOf(plan, a.state, a.finale)), a.finale ? `${plan.question} ${plan.answer}` : ''].join(' ');
  const people = ids.map(id => plan.cast.find(p => p.id === id)).filter((p): p is CastEntry => !!p && !sent.has(p.name))
    .map(p => ({ ...reportEntry(p, k, dealt), ...(here.includes(p.id) && p.id !== client.id && partIn(p, plan) ? { part: partIn(p, plan) } : {}) }));
  // a job fought against nameless thugs has nobody else in it: no list, and no line explaining one
  if (people.length) { payload.people = people; flags.push('people', ...entryFlags(people)) }
  if (!failedJob) payload.outcome = a.outcome;
  if (result !== undefined) { payload.result = result; flags.push('result') }
  if (a.option) { payload.plan = a.option.label; flags.push('option') }
  if (a.hurt.length) { payload.hurt = a.hurt; flags.push('hurt') }
  // a partial is "done, at a price": with no cost dealt the wound IS the price, said so
  if (a.outcome === 'partial' && !a.cost && a.hurt.length) flags.push('hurtprice');
  if (a.cost) { payload.cost = a.cost; flags.push('cost') }
  if (won && e.gain) { payload.brought = [e.gain]; flags.push('brought') }
  if (won && e.learn) { payload.clue = e.learn; flags.push('clue') }
  if (a.state.learned.length) { payload.known = a.state.learned; flags.push('known') }
  const have = haveOf(plan, a.state, a.finale);
  if (have.length) { payload.have = have; flags.push('have', ...(a.finale ? ['edge'] : [])) }
  // the answer travels with the question it answers; it comes out inside `after`, in time order
  if (a.finale) { payload.answer = { question: plan.question, secret: plan.answer }; flags.push('answer') }
  if (a.direction) { payload.direction = a.direction; flags.push('direction') }
  flags.push(...(failedJob ? ['failure', 'stopped'] : ['moved']));
  // `after`'s room grows with what it must show beyond the deciding moment
  const shows = a.hurt.length + (a.cost ? 1 : 0) + (payload.brought ? 1 : 0) + (payload.clue ? 1 : 0);
  const finaleShows = a.hurt.length + (a.cost ? 1 : 0) + have.length;
  const [B, A0] = a.finale || a.gravity.startsWith('a grave') ? [60, 140] : a.gravity.startsWith('a serious') ? [40, 90] : [30, 45];
  return { payload, flags, vars: { B, A: a.finale ? A0 + 10 * Math.max(0, finaleShows - 2) : Math.min(140, A0 + 15 * shows) } };
}

/** the lab's fate fact for the finale's `result` and the button ending (§2.6); the game's Outcome line merges it with
 *  every branch settleFinale can take (sagaflow.ts sagaFate) */
export function fateSentence(way: Way, outcome: Outcome, focal: CastEntry, target?: CastEntry): string {
  const t = target?.name ?? 'the one in the way';
  if (outcome === 'failure') return focal.seat === 'soldier' ? `${t} still stands in ${focal.name}'s way.` : `${focal.name} slips out of the company's reach, for now.`;
  return {
    recruit: `${focal.name} joins the company.`, captive: `${focal.name} is taken to the fort's cells.`,
    gold: helped(focal) ? `${focal.name} shares ${PRONOUN[focal.sex].pos} treasure with the company and goes ${PRONOUN[focal.sex].pos} way.` : `The company takes ${focal.name}'s treasure, and ${PRONOUN[focal.sex].sub} goes free.`,
    talk: `${t} is talked round.`, fight: `${t} is beaten in a fight.`, sneak: `The company slips past ${t} unseen.`,
  }[way];
}
/** the lab's PLANS button line ("[g0] Offer the miller a place → joins the company · CHA") */
export const buttonLine = (o: { way: Way; label: string }, i: number, chosen: boolean, helpedFocal = false) =>
  `${chosen ? '▶' : ' '} [g${i}] ${o.label} → ${o.way === 'gold' && helpedFocal ? 'coin; goes their way' : WAY_ENDING[o.way]} · ${WAY_ATTR[o.way]}`;

// ─── the floor (§4.4): the mock's reply and every failed call's stand-in ────────────────────────
// Deterministic templates with every contract honoured.

type JobText = (place: string, opp: string) => string;
const TYPE_JOB: Record<JobType, JobText> = {
  fight: (p, o) => `Drive ${o}'s men out of ${p}.`, guard: (p, o) => `Hold ${p} against ${o}'s men.`,
  catch: (p, o) => `Chase down ${o}'s runner, who fled toward ${p}.`, hunt: (p, o) => `Track the beast ${o} keeps near ${p}.`,
  sneak: (p, o) => `Get into ${p} unseen and take ${o}'s ledger.`, free: (p, o) => `Break the prisoner ${o} keeps out of ${p}.`,
  find: (p, o) => `Find ${o}'s hiding place near ${p}.`, talk: p => `Win the folk of ${p} over.`,
  escort: (p, o) => `Bring a guide who knows ${o}'s ground safely through ${p}.`,
};
const TYPE_WIN: Record<JobType, JobText> = {
  fight: (p, o) => `${o}'s men are driven out of ${p}.`, guard: p => `The attack on ${p} is beaten back.`,
  catch: (p, o) => `${o}'s runner is caught before reaching ${p}.`, hunt: p => `The beast near ${p} is trapped.`,
  sneak: (p, o) => `${o}'s ledger is taken from ${p} unseen.`, free: p => `The prisoner is freed from ${p}.`,
  find: (p, o) => `${o}'s hiding place near ${p} is found.`, talk: p => `The folk of ${p} take the company's side.`,
  escort: p => `The guide comes safely through ${p}.`,
};
const TYPE_WILL: Record<JobType, string> = {
  fight: 'fight for every yard', guard: 'attack at dusk', catch: 'cover the escape', hunt: 'turn and charge',
  sneak: 'keep a close watch', free: 'guard the door', find: 'cover their tracks', talk: 'shout the company down',
  escort: 'lie in wait on the road',
};
const TYPE_GAIN: Record<JobType, JobText> = {
  fight: (p, o) => `one of ${o}'s men, taken at ${p}`, guard: p => `the gate of ${p}`,
  catch: (p, o) => `${o}'s runner, caught near ${p}`, hunt: (p, o) => `${o}'s beast, caged at ${p}`,
  sneak: (p, o) => `${o}'s ledger from ${p}`, free: p => `the prisoner freed from ${p}`,
  find: (_p, o) => `a map to ${o}'s hiding place`, talk: p => `the folk of ${p} as allies`,
  escort: p => `the guide brought safe through ${p}`,
};
const TYPE_EDGE: Record<JobType, JobText> = {
  fight: (_p, o) => `the captured man tells how few guards ${o} has left`, guard: () => 'the gate gives the company a safe place to fall back',
  catch: (_p, o) => `the runner tells where ${o} will be waiting`, hunt: (_p, o) => `without the beast, ${o} has nothing to set on the company`,
  sneak: (_p, o) => `the ledger shames ${o} before the hired men`, free: () => 'the freed prisoner knows the way in',
  find: () => 'the map shows every way in and out', talk: (_p, o) => `the folk keep ${o}'s help away`,
  escort: () => 'the guide knows the ground',
};
type AnswerText = (o: string, c: string) => string;
interface MockAnswer { question: AnswerText; answer: AnswerText; pieces: AnswerText[] }
const MOCK_ANSWERS: MockAnswer[] = [
  { question: o => `Nobody knows why ${o} stands in the way.`,
    answer: (o, c) => `${o} is ${c}'s own kin, cut out of an old will, and wants the share the will denied them.`,
    pieces: [(o, c) => `${o} carries a letter in the hand of ${c}'s family.`, () => 'An old will names a child nobody speaks of.', (o, c) => `${o} was born in ${c}'s house.`, (o) => `The will was sealed the year ${o} left.`] },
  { question: (o, c) => `Nobody knows what ${o} wants from ${c}.`,
    answer: (o, c) => `${c}'s family owes ${o} an old debt, and ${o} means ${c}'s ruin to be the payment.`,
    pieces: [(o, c) => `${o} keeps a debt-note sealed with the mark of ${c}'s family.`, (o) => `${o} was never paid what was owed.`, (o, c) => `${o} asks after ${c} by name.`, (_o, c) => `The debt is older than ${c}.`] },
  { question: o => `Nobody knows what ${o} is hiding.`,
    answer: (o, c) => `${o} hides an old crime, and ${c} is the only one who saw it, so ${c} must be silenced.`,
    pieces: [(o) => `${o} keeps asking who still remembers an old fire.`, (o) => `A burned house stands where ${o} once lived.`, (_o, c) => `${c} once spoke at a hearing about that fire.`, () => 'The fire had one witness, never named aloud.'] },
];
const MOCK_PERSONAL: MockAnswer = {
  question: (o, c) => `Nobody knows why ${o} keeps ${c}'s old wrong alive.`,
  answer: (o, c) => `${o} has lived off ${c}'s old wrong for years, and fears losing it all if ${c} sets it right.`,
  pieces: [(o, c) => `${o} knew ${c} long before the company did.`, (o) => `${o} grew rich the year the old wrong was done.`, (o, c) => `${o} has told everyone that ${c} is dead.`, (o) => `${o} still keeps a paper from those days.`],
};
const cap = (s: string) => s ? s[0]!.toUpperCase() + s.slice(1) : s;
const lc1 = (s: string) => s ? s[0]!.toLowerCase() + s.slice(1) : s;
const sentence = (s: string) => s.trim() ? cap(s.trim()).replace(/([^.!?])$/, '$1.') : '';
const firstSentence = (s: string) => s.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s.trim();
const the = theLabel;

/** the floor's plan. `seedKey` seeds its rng (the game: the chain id; the lab: fixture, draw and arm) */
export function mockPlan(ctx: PlanCtx, seedKey: string): Record<string, unknown> {
  const { w } = ctx;
  const rng = new Rng(hashStr(seedKey));
  // the lean arm's asker has no trade: the floor cannot coin one from the seed, so "a local woman"
  const label = (p: SagaPerson) => p.seat === 'soldier' ? an(`${RACE_WORD[p.race] ?? p.race} soldier`) : an(p.trade ?? `local ${manWoman(p.sex)}`);
  const opp = w.cast.find(p => p.seat === 'opponent')!, client = w.cast.find(p => p.seat === 'client' || p.seat === 'soldier')!;
  const focalP = w.cast.find(p => p.focal)!;
  const types: JobType[] = rng.shuffle([...JOB_TYPES]).slice(0, w.N - 1);
  const o = the(label(opp));
  const oHe = PRONOUN[opp.sex];
  const last = w.places[w.places.length - 1]!;
  const cName = client.known ? client.name : cap(the(label(client)));
  const cHe = PRONOUN[client.sex];
  const loss = stakeLine(w.stake)[2](cHe);
  // why (R1, C1): what the job does for the one who asked, from the stake's loss; (R5, P2) what they can then do
  const why = (place: string) => `${cName} can then keep ${loss} safe from ${o} at ${place}.`;
  const oNoun = cap(headNoun(label(opp)));
  const title = rng.pick([`The ${oNoun} of ${w.places[0]}`, `Trouble at ${w.places[0]}`, `${w.places[0]} Under Threat`, `Blood at ${last}`]);
  const ans = w.personal ? MOCK_PERSONAL : rng.pick(MOCK_ANSWERS), cRef = client.known ? client.name : the(label(client));
  const episodes = types.map((ty, i) => {
    const place = w.places[i % w.places.length]!;
    return {
      n: i + 1, type: ty, title: `${cap(ty)} at ${place}`, job: TYPE_JOB[ty](place, o),
      // episode 1 holds the person in ending; the later jobs face that person's men or beast
      people: i === 0 ? [w.personal ? opp.id : w.focalId] : [],
      trouble: ty === 'hunt' ? { who: `the beast ${o} keeps`, carry: 'teeth and claws', will: TYPE_WILL[ty] } : { who: `${o}'s men`, carry: 'clubs and knives', will: TYPE_WILL[ty] },
      win: cap(TYPE_WIN[ty](place, o)), gain: TYPE_GAIN[ty](place, o), learn: cap(ans.pieces[i % ans.pieces.length]!(o, cRef)), why: why(place),
    };
  });
  return {
    title, question: cap(ans.question(o, cRef)), answer: cap(ans.answer(o, cRef)),
    cast: w.cast.filter(p => p.seat !== 'soldier').map(p => ({ id: p.id, label: label(p) })),
    ...(w.personal ? { soldier: { want: cannedWant(client, w.stake), past: 'an old wrong left behind' } } : { asker: { want: cannedWant(client, w.stake) } }),
    episodes,
    showdown: {
      // its job names the person in ending (the PLANS buttons decide them), as the plan's must
      title: `The Reckoning at ${last}`, job: focalP.seat === 'opponent' || w.personal ? `Face ${o} at ${last}.` : `Face ${o} and ${the(label(focalP))} at ${last}.`,
      people: w.cast.filter(p => p.seat !== 'client').map(p => p.id),
      trouble: { who: `${o} and ${oHe.pos} last men`, carry: 'swords', will: 'hold their ground' },
      edge: types.map((ty, i) => TYPE_EDGE[ty](w.places[i % w.places.length]!, o)),
      settles: w.personal ? `${cName} no longer has to run from ${cHe.pos} past.` : stakeLine(w.stake)[1](cName, cHe.pos),
      lose: TAKEN.has(w.stake) && `${loss}, taken by ${o}`.split(/\s+/).length <= 8 ? `${loss}, taken by ${o}` : loss,
    },
    options: waysOf(w).map(way => ({ way, label: cannedOption(way, w.cast.map(p => ({ ...p, label: label(p), want: '' }))) })),
  };
}

/** a person as the mock writes them: a new one by name and label, else their name, else the label */
function mockRef(who: string, names: Entry[]): string {
  const e = names.find(n => n.name === who || n.label === who);
  if (e?.name) return e.intro && e.label ? `${String(e.name)}, ${String(e.label)},` : String(e.name);
  return the(who);
}

export function mockCard(payload: Record<string, unknown>, flags: string[]): { card: string } {
  const t = payload.trouble as Trouble;
  const job = String(payload.job);
  const names = (payload.names ?? []) as Entry[];
  const troubleLine = t.will ? `${cap(t.who)} with ${t.carry} will ${t.will}.` : `Against you: ${t.who}, with ${t.carry}.`;   // card 1, a retry and a last-chance finale: no will
  const why = sentence(String(payload.why ?? ''));
  if (flags.includes('first')) {
    // (R5, P5) card 1 tells its premise: who needs you and what they want, a personal past, what nobody knows
    const p = payload.premise as Record<string, string>;
    const who = cap(mockRef(p.who!, names));
    const sub = names.find(n => n.name === p.who)?.sex === 'woman' ? 'she' : 'he';
    const premise = `${who} needs you, and ${sub} wants ${p.wants}.${p.past ? ` ${cap(sub)} has a past: ${p.past}.` : ''}${p.memory ? ` ${sentence(p.memory)}` : ''} Nobody knows ${p.unknown}.`;
    return { card: [`${premise}${memories(names)}`, job, why, troubleLine].filter(Boolean).join(' ') };
  }
  const opener = payload.retry !== undefined ? `Last time, ${lc1(sentence(toYou(String(payload.retry))))}` : payload.latest !== undefined ? sentence(toYou(String(payload.latest))) : '';
  const last = flags.includes('lastchance') ? ' This is your last chance.' : '';
  const lose = payload.lose as { who: string; loses: string } | undefined;
  const loss = lose ? ` If it fails, ${lose.who} loses ${lose.loses} for good.` : '';
  return { card: [`${opener}${memories(names)}`.trim(), job, why, `${troubleLine}${last}${loss}`].filter(Boolean).join(' ') };
}
/** (R5 verify) a returning face's past with you, told where they first appear */
const memories = (names: Entry[]) => names.filter(n => n.memory).map(n => ` ${sentence(String(n.memory))}`).join('');

export function mockReport(payload: Record<string, unknown>, flags: string[]): { before: string; after: string; summary: string } {
  const soldiers = (payload.soldiers as { name: string }[]).map(s => s.name);
  const who = soldiers.length > 1 ? `${soldiers.slice(0, -1).join(', ')} and ${soldiers[soldiers.length - 1]}` : soldiers[0]!;
  const job = String(payload.job).replace(/\.$/, '');
  const lc = job[0]!.toLowerCase() + job.slice(1);
  const hurt = ((payload.hurt as Hurt[] | undefined) ?? []).map(h => ` ${h.name} was hurt ${h.how}.`).join('');
  const cost = payload.cost ? ` ${sentence(costText(payload.cost as Cost))}` : '';
  const ans = payload.answer as { secret: string } | undefined;
  const known = payload.known as string[] | undefined;
  // the floor honours `intro` as the prompt asks (label and name), so the name counts as read
  const met = ((payload.people ?? []) as Entry[]).filter(p => p.intro && p.name).map(p => ` ${String(p.name)}, ${String(p.label)}, was there.`).join('');
  const before = `${who} set out to ${lc}.${met}`;
  const result = String(payload.result ?? '');
  const brought = ((payload.brought as string[] | undefined) ?? []).map(b => ` They came away with ${b}.`).join('');
  const learn = payload.clue ? ` They found this out: ${sentence(String(payload.clue))}` : '';
  const used = flags.includes('edge') ? ((payload.have as { holds: string; helps: string }[] | undefined) ?? []).map(h => ` ${cap(h.holds)} helped: ${sentence(h.helps)}`).join('') : '';
  const tied = known?.length ? ` What they had found came together: ${sentence(known[known.length - 1]!)}` : '';
  const reveal = ans ? `${tied} Then the truth came out: ${sentence(ans.secret)}` : '';
  const after = flags.includes('failure') ? `They were beaten back, and the job was not done.${hurt}`
    : `${String(payload.decides ?? who)} ${payload.outcome === 'success' ? 'carried it' : payload.outcome === 'partial' ? 'carried it, at a price' : 'could not carry it'}.${used}${reveal} ${sentence(result)}${brought}${learn}${hurt}${cost}`.trim();
  // the summary says what changed, from the result; (R5 verify) a failed job's says only what stopped the company
  const changed = sentence(firstSentence(result));
  const summary = flags.includes('stopped') || !changed ? 'They beat the company back before the job was done.'
    : payload.outcome === 'partial' ? changed.replace(/[.!?]$/, ', but at a price.') : changed;
  return { before, after, summary };
}

/** a summary whose own subject is the company ("the company was stopped…", "your soldiers found…", "we…"): the try's
 *  "The company tried to …" already says who acted, so it never runs on into it after a "but" */
const COMPANY_SUBJECT = /^(?:the company(?:['’]s\s+[a-z]+)?|(?:your|our) (?:soldiers|party|company|band)|we)\b/i;
/** (R5 verify) a failed try as the chronicle and a last-chance finale's `latest` tell it: the job, then what stopped it.
 *  A summary that opens on the company as its subject keeps that subject in a sentence of its own (a "but" join read
 *  "The company tried to …, but the company was stopped when …") */
export function triedLine(job: string, stopper: string, plan: SagaPlan, w: SagaWorld): string {
  const s = bare(stopper);
  const tried = `The company tried to ${lc1(bare(job))}`;
  if (COMPANY_SUBJECT.test(s)) return `${tried}. ${sentence(s)}`;
  const w0 = (s.split(/\s+/)[0] ?? '').replace(/['’]s$/, '');
  const proper = plan.cast.some(p => nameParts(p).includes(w0)) || w.places.some(pl => pl.startsWith(w0));
  return `${tried}, but ${proper ? s : lc1(s)}.`;
}

/** the floor's words for a cost's atoms (the model realises them its own way) */
function costText(c: Cost): string {
  if (c.what === 'goodwill') return `${c.whose ?? 'the locals'} turned against the company`;
  return `${c.whose ? `${c.whose}'s ` : ''}${c.what} ${/s$/.test(c.what) ? 'were' : 'was'} ${c.how}`;
}

export const zCardOut = z.object({ card: z.string().min(1) }).passthrough();
export const zReportOut = z.object({ before: z.string().min(1), after: z.string().min(1), summary: z.string().optional() }).passthrough();

// ─── boundary helpers: the persisted record ↔ the ported functions ─────────────────────────────

export const knowingOf = (rec: SagaRecord): Knowing => ({ met: new Set(rec.knowing.met), named: new Set(rec.knowing.named), seen: new Set(rec.knowing.seen) });
export const keepKnowing = (rec: SagaRecord, k: Knowing): void => { rec.knowing = { met: [...k.met], named: [...k.named], seen: [...k.seen] } };
export const doneOf = (rec: SagaRecord): Map<number, 'won' | 'lost'> => new Map(Object.entries(rec.done).map(([n, s]) => [Number(n), s]));
/** the road as a card at job `at` sees it (the chronicle: no `at`, and how the finale went) */
export const roadOf = (rec: SagaRecord, at?: number, retry?: boolean, finale?: 'won' | 'lost'): RoadState =>
  ({ lines: rec.road, done: doneOf(rec), ...(at !== undefined ? { at } : {}), ...(retry ? { retry } : {}), ...(finale ? { finale } : {}) });
/** undefined → null for the save (JSON keeps arrays positional) */
export const toNullable = (xs: (string | undefined)[] | null): (string | null)[] | null => xs ? xs.map(x => x ?? null) : null;

// ─── a kit seed arm's small steps before the plan (North Star 7–8: deal → pick → premise → plan) ───
// Both are SELECTION / DECOMPOSITION steps, one call each, never a re-roll or a gate (the single-shot ruling): a failed or
// unusable reply leaves the floor's choice in its place and the plan goes on.

/** one person as the pick call sees them: race and trade (or sex), and a part where one was dealt */
const castLine = (p: SagaPerson): string => {
  const part = partOf(p);
  const who = an(`${RACE_WORD[p.race] ?? p.race} ${p.trade ?? manWoman(p.sex)}`);
  return !part ? who : /^one of\b/.test(part) ? `${who}, ${part}` : `${who} who ${part}`;
};
/** kit+pick+cast: the supporting people its pick chooses among (the rest of the cast is always kept) */
const offeredPeople = (w: SagaWorld): SagaPerson[] => CASTS.has(w.kit!.arm) ? w.cast.filter(p => p.seat === 'support') : [];
/** the situation(s) — or a personal saga's past — the tone, the cast in plain words, and every keyword dealt;
 *  kit+pick+cast: the supporting people as `people`, apart from the cast, for the pick to keep the one it needs or none */
export function pickPayload(w: SagaWorld): { payload: Record<string, unknown>; flags: string[] } {
  const k = w.kit!;
  const flags: string[] = [];
  const payload: Record<string, unknown> = {};
  if (!k.situations.length) { flags.push('personal'); payload.past = w.seed.text }
  else if (k.situations.length > 1) { flags.push('situations'); payload.situations = k.situations }
  else payload.situation = k.situations[0];
  payload.tone = w.tone;
  const offered = offeredPeople(w);
  payload.cast = w.cast.filter(p => !offered.includes(p)).map(castLine);
  payload.keywords = k.keywords;
  if (offered.length) { flags.push('people'); payload.people = offered.map(castLine) }
  return { payload, flags };
}
const zStrs = z.union([z.array(z.union([z.string(), z.number()]).transform(String)), z.string().transform(x => x.split(/[,;]/))]).optional().catch(undefined);
/** one person, or the first of a list */
const zOne = z.union([z.string(), z.number(), z.null(), z.array(z.union([z.string(), z.number()]))]).transform(x => x === null ? undefined : String(Array.isArray(x) ? x[0] ?? '' : x)).optional().catch(undefined);
export const zPickOut = z.object({ situation: zs, keywords: zStrs, person: zOne }).passthrough();
/** the floor's choice: the first situation dealt, the first two keywords (the deal's own order is already random), and
 *  nobody from people (a lean cast carries a story) */
export function mockPick(payload: Record<string, unknown>): { situation?: string; keywords: string[]; person?: string } {
  const sits = payload.situations as string[] | undefined;
  return { ...(sits ? { situation: sits[0] } : {}), keywords: (payload.keywords as string[]).slice(0, 2), ...(payload.people ? { person: 'none' } : {}) };
}
const normAtom = (x: string) => x.toLowerCase().replace(/^\s*(?:an?|the)\s+/, '').replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ').trim();
/** the pick as the plan will get it: only what was dealt (matched loosely, kept as dealt), its first keywords up to the
 *  arm's keep (KIT_DEAL), one situation; kit+pick+cast: the one of `people` it named (a line as offered), or none.
 *  Whatever does not match is dropped (a dev line), and nothing usable is the floor's choice */
export function readPick(raw: unknown, k: Pick<NonNullable<SagaWorld['kit']>, 'situations' | 'keywords'> & { arm?: NonNullable<SagaWorld['kit']>['arm'] }, payload: Record<string, unknown>): { situation?: string; keywords: string[]; person?: string; dropped: string[]; floor: boolean } {
  const o = zPickOut.safeParse(raw);
  const dropped: string[] = [];
  const keywords: string[] = [];
  for (const x of (o.success ? o.data.keywords : undefined) ?? []) {
    const hit = k.keywords.find(d => normAtom(d) === normAtom(x));
    if (hit && !keywords.includes(hit)) keywords.push(hit); else if (!hit) dropped.push(x);
  }
  let situation: string | undefined;
  if (k.situations.length > 1) {
    const got = o.success ? o.data.situation : undefined;
    situation = k.situations.find(d => normAtom(d) === normAtom(got ?? ''));
    if (!situation && got) dropped.push(got);
  }
  // a person not offered is dropped, and so is nobody ("none", or no reply): the plan then gets no supporting person
  const people = payload.people as string[] | undefined;
  const said = o.success ? o.data.person?.trim() : undefined;
  const person = people && said ? people.find(d => normAtom(d) === normAtom(said)) : undefined;
  if (people && said && !person && !/^(?:none|no one|nobody)\b/i.test(said)) dropped.push(said);
  const floor = mockPick(payload);
  const useFloor = !keywords.length || (k.situations.length > 1 && !situation);
  const keep = k.arm && CASTS.has(k.arm) ? KIT_DEAL.cast.keep : KIT_DEAL.keep;
  return { ...(k.situations.length > 1 ? { situation: situation ?? floor.situation } : {}), keywords: keywords.length ? keywords.slice(0, keep) : floor.keywords, ...(person ? { person } : {}), dropped, floor: useFloor };
}

/** the picked inputs as the premise call sees them: the situation (or the past), the keywords, the tone, and the cast —
 *  named only where known, the one whose fate the end decides marked (never an id: the premise is prose) */
export function premisePayload(w: SagaWorld): { payload: Record<string, unknown>; flags: string[] } {
  const k = w.kit!;
  const s = seedOf({ seed: w.seed, kit: { ...k, premise: undefined } });
  const flags: string[] = [];
  const payload: Record<string, unknown> = {};
  if (!k.situations.length) { flags.push('personal'); payload.past = w.seed.text } else payload.situation = s.text;
  payload.keywords = s.keywords ?? [];
  payload.tone = w.tone;
  // whose fate the end decides: the focal, or on a personal saga the one in the soldier's way (choiceTarget)
  const ending = w.personal ? w.cast.find(p => p.seat === 'opponent')?.id : w.focalId;
  payload.cast = w.cast.map(p => {
    const part = partOf(p);
    return {
      ...(p.known ? { name: p.name } : {}), sex: manWoman(p.sex), race: RACE_WORD[p.race] ?? p.race,
      ...(p.trade ? { trade: p.trade } : {}), ...(part ? { part } : {}), ...(p.id === ending ? { ending: true } : {}),
    };
  });
  return { payload, flags };
}
export const zPremiseOut = z.object({ premise: zStrs }).passthrough();
/** the floor's premise, from the payload alone: who asks and what for, who stands in the way, a keyword unexplained */
export function mockPremise(payload: Record<string, unknown>): { premise: string[] } {
  const cast = payload.cast as Record<string, string | boolean>[];
  const desc = (p: Record<string, string | boolean>) => p.name ? String(p.name) : `the ${p.race} ${p.trade ?? p.sex}`;
  const asks = cast.find(p => p.part && !p.ending) ?? cast[0]!, end = cast.find(p => p.ending) ?? cast[cast.length - 1]!;
  const kw = (payload.keywords as string[])[0];
  return { premise: [
    payload.past ? `${cap(desc(asks))} wants to set right an old wrong: ${String(payload.past).replace(/[.!]+$/, '')}.` : `${cap(desc(asks))} needs help to ${String(payload.situation)}.`,
    `${cap(desc(end))} stands in the way, for reasons of their own.`,
    kw ? `Nobody yet knows what the ${kw} has to do with it.` : 'Nobody yet knows why.',
  ] };
}

// ─── the typed calls (Step 3): one template-keyed provider call each, the floor on any failure ─

type Log = (kind: string, text: string) => void;
const words = (s: string | undefined) => (s ?? '').split(/\s+/).filter(Boolean).length;

/** the plan: at most 2 calls (a hard defect earns one plain re-draw), then the floor and a `plan-fallback` dev line */
export async function planSaga(ai: AiProvider, ctx: PlanCtx, seedKey: string, log: Log = () => {}): Promise<{ plan: SagaPlan; repairs: string[]; defects: string[]; fallback: boolean; lint: string[]; ownJobs: number[] }> {
  const { payload, flags } = planPayload(ctx);
  const floor = () => mockPlan(ctx, seedKey);
  const defects: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: unknown = null;
    try { raw = await ai.sagaCall({ template: 'plan', flags, vars: {}, payload, tier: 'plan', effort: 'medium', schema: zPlanOut, floor }) }
    catch (e) { defects.push(`draw ${attempt + 1}: the call failed (${(e as Error).message?.slice(0, 120)})`); continue }
    const v = validatePlan(raw, ctx);
    if (v.plan && !v.defects.length) {
      const lint = planLint(v.plan, ctx.w);
      for (const l of lint) log('dev', `saga plan lint (log-only): ${l}`);
      return { plan: v.plan, repairs: v.repairs, defects, fallback: false, lint, ownJobs: v.ownJobs };
    }
    defects.push(...v.defects.map(d => `draw ${attempt + 1}: ${d}`));
  }
  const v = validatePlan(floor(), ctx);
  log('dev', `plan-fallback: the floor's plan stood in (${defects.join('; ')})`);
  return { plan: v.plan!, repairs: v.repairs, defects, fallback: true, lint: planLint(v.plan!, ctx.w), ownJobs: v.ownJobs };
}
/** R5: the road ahead — each later job's hope; null when the writer failed (the floor's lines then stand in) */
export async function writeOutline(ai: AiProvider, plan: SagaPlan, k: Knowing, log: Log = () => {}): Promise<{ lines: string[] | null; payload: Record<string, unknown> }> {
  const { payload, flags } = outlinePayload(plan, k);
  let lines: string[] | null = null;
  try {
    const out = await ai.sagaCall({ template: 'outline', flags, vars: {}, payload, tier: 'writer', effort: 'low', schema: zOutlineOut, floor: () => mockOutline(payload) }) as z.infer<typeof zOutlineOut>;
    lines = out.lines?.map(x => x.trim()) ?? null;
  } catch { lines = null }
  for (const l of outlineLint(lines, payload, plan)) log('dev', `saga outline lint (log-only): ${l}`);
  if (!lines) log('dev', 'outline: the writer failed, the floor stood in');
  return { lines, payload };
}
/** a card: the writer's prose, or the floor's */
export async function writeCard(ai: AiProvider, cc: CardCall, log: Log = () => {}): Promise<string> {
  let card = '';
  try {
    const out = await ai.sagaCall({ template: 'card', flags: cc.flags, vars: cc.vars, payload: cc.payload, tier: 'writer', effort: 'low', schema: zCardOut, floor: () => mockCard(cc.payload, cc.flags) }) as z.infer<typeof zCardOut>;
    card = out.card?.trim() ?? '';
  } catch { card = '' }
  if (!card) { card = mockCard(cc.payload, cc.flags).card; log('dev', 'saga card: the writer failed, the floor stood in') }
  if (words(card) > cc.vars.MAX!) log('dev', `saga card cap (log-only): ${words(card)}/${cc.vars.MAX}`);
  return card;
}
/** a report: the writer's, or the floor's; a missing summary takes the floor's */
export async function writeReport(ai: AiProvider, rp: ReportCall, log: Log = () => {}): Promise<{ before: string; after: string; summary: string }> {
  let rep: { before: string; after: string; summary: string } | null = null;
  try {
    const out = await ai.sagaCall({ template: 'report', flags: rp.flags, vars: rp.vars, payload: rp.payload, tier: 'writer', effort: 'low', schema: zReportOut, floor: () => mockReport(rp.payload, rp.flags) }) as z.infer<typeof zReportOut>;
    rep = { before: out.before.trim(), after: out.after.trim(), summary: (out.summary ?? '').trim() };
  } catch { rep = null }
  if (!rep) { rep = mockReport(rp.payload, rp.flags); log('dev', 'saga report: the writer failed, the floor stood in') }
  if (!rep.summary) { rep.summary = mockReport(rp.payload, rp.flags).summary; log('dev', 'saga report: no summary, the floor\'s stood in') }
  if (words(rep.before) > rp.vars.B!) log('dev', `saga report cap (log-only): before ${words(rep.before)}/${rp.vars.B}`);
  if (words(rep.after) > rp.vars.A!) log('dev', `saga report cap (log-only): after ${words(rep.after)}/${rp.vars.A}`);
  if (words(rep.summary) > 25) log('dev', `saga report cap (log-only): summary ${words(rep.summary)}/25`);
  return rep;
}

/** the pick (kit+pick arms): one writer call at low effort; the floor's choice when it fails */
export async function pickSeed(ai: AiProvider, w: SagaWorld, log: Log = () => {}): Promise<NonNullable<NonNullable<SagaWorld['kit']>['picked']>> {
  const { payload, flags } = pickPayload(w);
  let raw: unknown = null;
  try { raw = await ai.sagaCall({ template: 'pick', flags, vars: {}, payload, tier: 'writer', effort: 'low', schema: zPickOut, floor: () => mockPick(payload) }) }
  catch (e) { log('dev', `saga pick: the call failed (${(e as Error).message?.slice(0, 120)})`) }
  const r = readPick(raw, w.kit!, payload);
  if (r.dropped.length) log('dev', `saga pick (log-only): not dealt, dropped: ${r.dropped.join('; ')}`);
  if (r.floor) log('dev', 'saga pick: nothing usable, the floor\'s choice stood in');
  const person = r.person ? offeredPeople(w).find(p => castLine(p) === r.person)?.id : undefined;
  return { ...(r.situation ? { situation: r.situation } : {}), keywords: r.keywords, ...(person ? { person } : {}), ...(r.floor ? { floor: true } : {}) };
}
/** the premise (kit+pick+premise): one writer call at low effort; the floor's sentences when it fails */
export async function writePremise(ai: AiProvider, w: SagaWorld, log: Log = () => {}): Promise<{ premise: string[]; floor: boolean }> {
  const { payload, flags } = premisePayload(w);
  let lines: string[] = [];
  try {
    const out = await ai.sagaCall({ template: 'premise', flags, vars: {}, payload, tier: 'writer', effort: 'low', schema: zPremiseOut, floor: () => mockPremise(payload) }) as z.infer<typeof zPremiseOut>;
    lines = (out.premise ?? []).map(x => sentence(x)).filter(Boolean);
  } catch (e) { log('dev', `saga premise: the call failed (${(e as Error).message?.slice(0, 120)})`) }
  if (lines.length && lines.length !== 3) log('dev', `saga premise (log-only): ${lines.length} sentences`);
  if (!lines.length) { log('dev', 'saga premise: the writer failed, the floor stood in'); return { premise: mockPremise(payload).premise, floor: true } }
  return { premise: lines, floor: false };
}
/** a kit arm's steps before the plan, each run once (their results stay on the world, so a re-planned saga reuses them) */
export async function seedSteps(ai: AiProvider, w: SagaWorld, log: Log = () => {}): Promise<void> {
  const k = w.kit;
  if (!k) return;
  if (PICKS.has(k.arm) && !k.picked) { k.picked = await pickSeed(ai, w, log); keepPicked(w) }
  if (k.arm === 'kit+pick+premise' && !k.premise) { const r = await writePremise(ai, w, log); k.premise = r.premise; if (r.floor) k.premiseFloor = true }
}

/** the system prompt a saga call sends (the call log and the golden test read it) */
export const sagaSystem = (template: SagaTemplate, flags: string[], vars: Record<string, number> = {}) => renderSaga(template, flags, vars);
export { wordCount };
