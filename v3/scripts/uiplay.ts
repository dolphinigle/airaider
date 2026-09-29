// PLAYTEST THE GUI IN A REAL BROWSER — clicks, real drags, keyboard, and the DOM read back.
// Not a simulation of the UI (docs/DOGFOODING.md forbids that): this drives the actual page in
// actual Chrome against the actual server. Point it at a SCRATCH save (a copy of saves/_fixture.json
// is what it is tuned on) — it places soldiers, racks captives, adds places and ENDS a cycle.
// Every check finds its subject from /api/state, so a check whose subject is missing is SKIPPED
// (listed), never silently passed.
//
// Usage: npx tsx scripts/uiplay.ts [webPort] [shotDir]
import puppeteer, { type Page, type ElementHandle } from 'puppeteer-core';
import * as fs from 'node:fs';

const PORT = process.argv[2] ?? '5273';
const SHOTS = process.argv[3] ?? '/tmp/uiplay';
const BASE = `http://localhost:${PORT}`;
fs.mkdirSync(SHOTS, { recursive: true });

const fails: string[] = [], notes: string[] = [], skips: string[] = [];
function check(ok: boolean, what: string, detail = '') { (ok ? notes : fails).push(`${ok ? '✓' : '✗'} ${what}${detail ? ` — ${detail}` : ''}`) }
const skip = (what: string, why: string) => skips.push(`– ${what} — skipped: ${why}`);
const shot = (p: Page, n: string) => p.screenshot({ path: `${SHOTS}/${n}.png` });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const count = (p: Page, sel: string) => p.$$eval(sel, els => els.length);
const text = (p: Page, sel: string) => p.$eval(sel, e => e.textContent ?? '').catch(() => '');
const state = async () => (await fetch(`${BASE}/api/state`)).json() as Promise<any>;
const post = async (type: string, ...args: (string | number)[]) => (await fetch(`${BASE}/api/action`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, args }) })).json() as Promise<any>;
/** poll until `fn` holds (or time runs out) — the page re-renders on its own heartbeat */
async function until(fn: () => Promise<boolean>, ms = 5000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return true; await sleep(120) }
  return false;
}
/** the first element under `sel` whose text matches */
async function byText(p: Page, sel: string, re: RegExp): Promise<ElementHandle<Element> | null> {
  for (const el of await p.$$(sel)) if (re.test(await el.evaluate(n => n.textContent ?? ''))) return el;
  return null;
}
/** a REAL HTML5 drag — the browser's own drag from a held mouse (no interception, which also left
 *  later held drags unable to press the button) */
async function drag(p: Page, src: ElementHandle<Element>, dst: ElementHandle<Element>) {
  await src.drag(dst);
  await sleep(150);
  await dst.drop(src);
  await sleep(900);
}
/** end a held drag over a point that takes no drop (puppeteer only clears its drag flag in drop()) */
async function release(p: Page, x: number, y: number) {
  await p.mouse.move(x, y);
  await p.mouse.up().catch(() => {});
  (p as unknown as { _isDragging: boolean })._isDragging = false;
}
const hscroll = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const cardIn = (s: any, id: string) => [...s.captives, ...s.relics].find((c: any) => c.id === id);
const BAND_RE = /ready · (likely|coin-flip|a partial at best|long shot|hopeless)/;

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', e => errors.push(String(e)));
const goto = async (path: string) => { await page.goto(BASE + path, { waitUntil: 'networkidle2' }); await sleep(600) };

let s = await state();
// clear every placement so the run starts from nothing
const clearAll = async () => { const x = await state(); for (const q of x.quests) for (const sl of q.slots) if (sl.filledBy) await post('unassign', q.id, sl.idx) };
await clearAll();
await goto('/');
s = await state();

// ════ THE 2026-09-30 AUDIT FIXES — one check per GUI fix, on the fixture's own state ════
const toastNow = () => page.$eval('.toast', e => ({ text: e.textContent ?? '', tone: (e as HTMLElement).dataset.tone ?? '' })).catch(() => ({ text: '', tone: '' }));
const clickRoom = async (id: string) => { await (await page.$(`.cell[data-room="${id}"]`))?.click(); await sleep(450) };
const bagOn = () => text(page, '.hand .bag.on');
const firstName = (n: string) => n.split(/\s+/)[0]!;
const allCards = (x: any) => [...x.captives, ...x.relics];
const lum = (hex: string) => { const c = hex.replace('#', '').match(/../g)!.map(v => parseInt(v, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]! };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x! + 0.05) / (y! + 0.05) };

// state-level verdicts the GUI reads
{
  const fin = s.quests.find((q: any) => q.approaches && !q.chosenApproach);
  if (fin) check(fin.ready === false, 'an unchosen finale is never "ready" (ready-true-empty-finale)', fin.title);
  else skip('unchosen finale not ready', 'no unchosen finale');
  check(Object.values(s.roomFits ?? {}).every((v: any) => Array.isArray(v) && v.every((x: any) => typeof x === 'string')),
    'roomFits carries ranked card ids only — no second copy of every row (state-payload-scaling)');
  check(!!s.bootId, 'the state carries a boot id, so an open tab re-baselines arrivals after a restart (arrival-seq-restart)', s.bootId);
  const faint = (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--text-faint'))).trim();
  check(contrast(faint, '#13171a') >= 4.5 && contrast(faint, '#1a1f23') >= 4.5, '--text-faint reads ≥ 4.5:1 on the board and a hovered row (text-faint-contrast)',
    `${faint}: ${contrast(faint, '#13171a').toFixed(2)}:1`);
}

// the map: a reward icon lights up for the kind its warning is about (rescue-no-tavern-warn)
{
  // none on the table? a full roster makes a recruit quest warn: hire the tavern's guest
  if (!s.quests.some((q: any) => q.rewardWarn) && s.quests.some((q: any) => (q.rewardKinds ?? []).includes('recruit'))) {
    const guest = s.tavern.find((t: any) => !t.hireBlock);
    if (guest && s.roster.length + 1 >= s.rosterCap) { await post('hire', guest.id); await goto('/'); s = await state() }
  }
  const warned = s.quests.filter((q: any) => q.rewardWarn && /^brings a (\w+)/.test(q.rewardWarn));
  for (const q of warned.slice(0, 2)) {
    const titles = await page.$$eval(`.mk[data-q="${q.id}"] .rw.warn`, els => els.map(e => e.getAttribute('title')));
    check(titles.length === 1 && titles[0] === q.rewardWarn, 'the reward icon the warning names is the one lit, with the warning as its tip (rescue-no-tavern-warn)', `${q.title}: ${q.rewardWarn}`);
  }
  if (!warned.length) skip('reward warning icon', 'no quest carries a reward warning');
}

// the fort — the tier depth, the prisoners, holding, your bedroom, gate rooms, the rack clock
await goto('/?screen=fort');
s = await state();
{
  const deep = s.fort.rooms.find((r: any) => r.kind && r.slots.length >= s.maxSlots && r.addPlace?.action === 'gh');
  if (deep) {
    await clickRoom(deep.id);
    const t = await text(page, '.rslot.ghostslot .add');
    const dis = await page.$eval('.rslot.ghostslot .add', b => (b as HTMLButtonElement).disabled).catch(() => null);
    const honest = deep.addPlace.tier === s.ghTier + 1 ? !deep.addPlace.block || dis === true : dis === true && /adds no/.test(deep.addPlace.block ?? '');
    check(t.includes(`GH T${deep.addPlace.tier}`) && honest, 'at the tier depth the ghost slot names the tier that ADDS places — disabled when the next raise adds none (gh-fix-false-promise)', `${deep.name}: ${t}`);
  } else skip('ghost slot at tier depth', 'no room at the tier depth');

  const hub = s.fort.rooms.find((r: any) => r.type === 'dungeon');
  if (hub) {
    await clickRoom(hub.id);
    check((await bagOn()).startsWith('Captives'), 'selecting the Dungeon opens the hand on Captives (dungeon-hub-hand-and-copy)', await bagOn());
    check(/holding does not count/.test(await text(page, '.rd .lbl')), 'the prisoner count says holding is not counted (dungeon-hub-hand-and-copy)');
    const stuck = s.captives.find((c: any) => c.state === 'tamed' && c.placeFix);
    if (stuck) {
      const btn = await page.evaluate((name: string) => [...document.querySelectorAll('.caprow')].find(r => r.querySelector('b')?.textContent === name)
        ?.querySelector('.hacts .btn')?.textContent ?? '', stuck.name);
      check(btn.startsWith(`${stuck.placeFix.roomName}:`), "the hub's fix for a captive nothing takes is the engine's pick, with its room named (hub-fix-rederived-client)", `${stuck.name}: ${btn}`);
    } else skip('hub place fix', 'no tamed captive without a place');
    const pipe = await page.evaluate(() => [...document.querySelectorAll('.pipe .step')].find(b => /holding/i.test(b.textContent ?? '')) as HTMLButtonElement | undefined);
    const hs = await page.$$eval('.pipe .step', els => els.filter(b => /holding/i.test(b.textContent ?? '')).map(b => (b as HTMLButtonElement).disabled));
    if (s.holding.length) {
      check(hs[0] === false, 'the hub\'s Holding step opens whenever someone is in holding (holding-unreachable-no-cell)');
      await page.evaluate(() => ([...document.querySelectorAll('.pipe .step')].find(b => /holding/i.test(b.textContent ?? '')) as HTMLButtonElement)?.click());
      await sleep(400);
      check(await count(page, '.holdrow') === s.holding.length, 'the Holding step lists every captive in holding', `${await count(page, '.holdrow')}/${s.holding.length}`);
    }
    void pipe;
  } else skip('prisoner hub', 'no Dungeon');

  if (s.holding.length) {
    // the holding list itself, with no room selected — how it opens when no Holding cell stands
    await goto('/?screen=fort&room=@holding');
    check((await text(page, '.rd h2')) === 'Holding' && await count(page, '.holdrow') === s.holding.length && (await text(page, '.holdrow .hacts')).includes('Sell'),
      'the holding list opens with no room behind it — every decision there (holding-unreachable-no-cell)');
    const h = s.holding[0];
    check((await text(page, '.holdrow .lapse')).startsWith(h.deadline), 'the holding row prints the engine\'s deadline words (holding-deadline-wording)', await text(page, '.holdrow .lapse'));
    await (await byText(page, '.hand .bag', /Captives/))?.click(); await sleep(300);
    const holdCards = await page.$$eval('.hand .card .rib', els => els.filter(e => e.textContent === 'HOLDING').length);
    check(holdCards === s.holding.length, 'the hand\'s Captives bag shows the ones in holding (holding-unreachable-no-cell)', `${holdCards}/${s.holding.length}`);
    await goto(`/?card=${h.id}`);
    const sheetTxt = await text(page, '.sheet');
    check(sheetTxt.includes(h.deadline) && !/Decide by cycle/.test(sheetTxt) && !!(await byText(page, '.sheet .acts .btn', /^Sell/)),
      'the holding sheet says the engine\'s deadline and offers Sell too (holding-deadline-wording)', h.deadline);
    await page.keyboard.press('Escape'); await sleep(200);
  } else skip('holding reachability', 'nobody in holding');

  await goto('/?screen=fort');
  const mine = s.fort.rooms.find((r: any) => r.owner === 'you');
  if (mine) {
    const d = await text(page, `.cell[data-room="${mine.id}"] .d`);
    await clickRoom(mine.id);
    check(/no effect yet/.test(d) && await count(page, '.rslot.ghostslot') === 0, 'your own bedroom says it has no effect and offers no places to buy (own-bedroom-no-effect-ranked)', d);
  }
  for (const [type, re, what] of [['storage', /^No effect yet/, 'Storage'], ['mess-hall', /^No effect yet/, 'Mess hall']] as const) {
    const r = s.fort.rooms.find((x: any) => x.type === type);
    if (!r) { skip(`${what} description`, 'not built'); continue }
    await clickRoom(r.id);
    check(re.test(await text(page, '.rd .p')), `the ${what} says plainly it has no effect yet (room-gates-not-enforced)`, await text(page, '.rd .p'));
  }
  const lodge = s.fort.rooms.find((x: any) => x.type.startsWith('scouting-') && s.activeRegions.includes(x.type.slice(9)));
  if (lodge) { await clickRoom(lodge.id); check(/^Scouts /.test(await text(page, '.rd .p')), 'a lodge whose region is on the map says what it adds there, not "opens" it (region-open-contradiction)', await text(page, '.rd .p')) }
  const racked = s.fort.rooms.find((r: any) => r.kind === 'rack' && r.slots.some((x: any) => x?.breakTotal));
  if (racked) {
    await clickRoom(racked.id);
    const x = racked.slots.find((y: any) => y?.breakTotal);
    const pips = await page.$$eval('.rslot.full .rpips', els => els.map(e => e.querySelectorAll('i').length));
    check(pips.includes(Math.max(x.breakTotal, x.doneAtCycle - s.cycle)), "the rack's pip bar is THIS captive's breaking (client-derived-math)", `${pips} vs ${x.breakTotal}`);
    check((await text(page, '.rclock .ct')).includes('tamed by c'), 'the rack clock says "tamed by cycle", not "tamed cN" (dungeon-hub-hand-and-copy)', await text(page, '.rclock .ct'));
  }
  const hall = s.fort.rooms.find((r: any) => r.type === 'great-hall');
  if (hall && s.gh?.next) {
    await clickRoom(hall.id);
    const cls = await page.$$eval('.ghp .check span', els => els.map(e => e.className));
    check(cls[0] === (s.gh.prestigeOk ? 'gok' : 'gmiss') && cls[1] === (s.gh.goldOk ? 'gok' : 'gmiss'), "the Great Hall's ✓/✗ are the engine's checks (client-derived-math)", cls.join(','));
  }
}

// a standing post is a standing post (standing-post-as-oneoff)
{
  const post_ = s.quests.find((q: any) => q.faucet);
  if (post_) {
    await goto(`/?quest=${post_.id}`);
    const clock = await page.$eval('.writ .clock', e => ({ cls: e.className, t: e.textContent ?? '' })).catch(() => ({ cls: '', t: '' }));
    check((await text(page, '.writ .kind')).startsWith('Standing post') && !/\bhot\b/.test(clock.cls) && /renews/.test(clock.t),
      'a standing post reads "Standing post", its clock neutral "renews each cycle" (standing-post-as-oneoff)', `${await text(page, '.writ .kind')} · ${clock.t}`);
  } else skip('standing post quest page', 'no standing-post quest');
}

// the finale page: each ending's own warning, the engine's best, a stale arm, a two-step plan switch
{
  const fin = s.quests.find((q: any) => q.approaches && !q.chosenApproach);
  if (fin) {
    await goto(`/?quest=${fin.id}`);
    const nWarn = fin.approaches.filter((a: any) => a.warn).length;
    check(await count(page, '.appr .aw') === nWarn, "an ending's reward warning sits on its own approach card (finale-warn-union)", `${nWarn} warned endings`);
    const bests = await page.$$eval('.appr', els => els.map(e => e.querySelector('.best')?.textContent ?? ''));
    const want = fin.approaches.map((a: any) => fin.slots.find((sl: any) => sl.groupId === a.id)?.best?.name ?? null);
    check(want.every((n: string | null, i: number) => n === null ? /nobody/.test(bests[i] ?? '') : (bests[i] ?? '').includes(firstName(n))),
      "each approach card names the engine's best soldier — the one the CLI names (best-soldier-parity)", bests.join(' | '));
    check(bests.every(b => !b || /\dc · (strong|fair|weak)/.test(b) || /nobody/.test(b)), 'an approach card\'s coins carry the unit and the strength word (badge-unit-and-word)', bests[0]);
    const cards = await page.$$('.appr');
    if (cards.length >= 2) {
      await cards[1]!.click(); await sleep(700);
      await (await page.$('.arch .empty'))?.click(); await sleep(300);
      const armedBefore = await count(page, '.arch.armed');
      await (await page.$$('.appr'))[0]!.click(); await sleep(800);
      const hint = await text(page, '.hand .hint');
      const blocked = await page.$$eval('.hand .card.blocked', els => els.filter(e => /another approach/.test(e.getAttribute('title') ?? '')).length);
      check(armedBefore === 1 && await count(page, '.arch.armed') === 0 && !/^Sorted for/.test(hint) && blocked === 0,
        'switching the approach drops a stale armed place — the hand never goes dead (armed-place-stale)', hint.slice(0, 60));
      await (await byText(page, '.writ .btns .btn', /Auto-assign/))?.click(); await sleep(900);
      const q1 = (await state()).quests.find((q: any) => q.id === fin.id);
      if (q1.slots.some((x: any) => x.filledBy)) {
        await (await page.$$('.appr'))[1]!.click(); await sleep(400);
        const armed = await count(page, '.appr.is-armed');
        const q2 = (await state()).quests.find((q: any) => q.id === fin.id);
        check(armed === 1 && q2.chosenApproach === q1.chosenApproach && q2.slots.some((x: any) => x.filledBy),
          'switching away from a manned plan asks twice and says who goes back (approach-switch-no-confirm)', await text(page, '.appr.is-armed'));
        await sleep(4300);   // let the confirm disarm
      } else skip('approach switch confirm', 'Auto placed nobody on the finale');
      await post('clear', fin.id);
    }
  } else skip('finale page checks', 'no unchosen finale');
}

// a multi-place quest: coin badges carry the unit and the word; Clear is one action
{
  const mq = (await state()).quests.find((q: any) => !q.approaches && q.slots.length >= 2 && !q.faucet)
    ?? (await state()).quests.find((q: any) => !q.approaches && q.slots.length >= 2);
  if (mq) {
    await goto(`/?quest=${mq.id}`);
    const unarmed = await page.$$eval('.hand .card.soldier .badge', els => els.map(e => e.textContent ?? ''));
    check(unarmed.length > 0 && unarmed.every(b => /^[A-Z+]+ \d+c · (strong|fair|weak)$/.test(b)), 'unarmed hand badges say the place, the coins WITH the unit, and the word (badge-unit-and-word)', unarmed[0]);
    await (await page.$('.arch .empty'))?.click(); await sleep(300);
    const armed = await page.$$eval('.hand .card.soldier .badge', els => els.map(e => e.textContent ?? ''));
    check(armed.length > 0 && armed.every(b => /^\d+c · (strong|fair|weak)$/.test(b)), 'armed hand badges carry the unit and the strength word', armed[0]);
    await page.keyboard.press('Escape'); await sleep(150);
    await (await byText(page, '.writ .btns .btn', /Auto-assign/))?.click(); await sleep(900);
    const seated = await page.$$eval('.arch .seat .badge', els => els.map(e => e.textContent ?? ''));
    check(seated.length > 0 && seated.every(b => /^\d+c · (strong|fair|weak)$/.test(b)), 'a seated soldier\'s badge carries the unit and the strength word', seated[0]);
    // the abandon confirm is the engine's own consequence line
    const ab = await byText(page, '.writ .btns .btn', /Abandon|Set aside/);
    if (ab) {
      await ab.click(); await sleep(250);
      const said = await text(page, '.writ .consequence');
      check(said === (await state()).quests.find((q: any) => q.id === mq.id).abandonText, 'the abandon confirm says the engine\'s consequence (abandon-confirm-lies)', said.slice(0, 70));
      await page.keyboard.press('Tab'); await sleep(200);   // blur disarms
    }
    const clear = await byText(page, '.writ .btns .btn', /^Clear$/);
    if (clear) {
      await clear.click({ count: 2 }); await sleep(900);
      const t = await toastNow();
      check(t.tone !== 'bad' && (await state()).quests.find((q: any) => q.id === mq.id).slots.every((x: any) => !x.filledBy),
        'a double-clicked Clear is ONE action — no false red "nothing to unassign" (clear-client-loop)', `${t.tone}: ${t.text.slice(0, 60)}`);
    }
  } else skip('multi-place quest checks', 'no multi-place quest');
}

// END warnings and countdowns: a part-filled standing post goes cold; a part-filled quest is set aside
{
  s = await state();
  const free = () => s.roster.filter((m: any) => m.location.kind === 'held');
  const fq = s.quests.find((q: any) => q.faucet && q.slots.length >= 2);
  const m = free().find((x: any) => fq && fq.slots[0].fits.some((f: any) => f.id === x.id && !f.blocked));
  if (fq && m) {
    await post('send', fq.id, m.id, 0);
    await goto('/');
    await (await page.$('.sealbox'))?.hover(); await sleep(300);
    const line = await page.evaluate((title: string) => [...document.querySelectorAll('.sealwarns button')].find(b => b.querySelector('b')?.textContent === title)?.querySelector('span')?.textContent ?? '', fq.title);
    check(/goes cold this END/.test(line), 'a part-filled standing post is warned as going cold, not "won\'t march" (faucet-short-warn-wrong)', line);
    await page.mouse.move(300, 400);
    await post('clear', fq.id);
  } else skip('part-filled standing post warning', 'no two-place standing post or free soldier');
  s = await state();
  const sq = s.quests.find((q: any) => !q.faucet && !q.approaches && q.slots.length >= 2 && q.lapsesAtCycle - s.cycle > 3);
  const m2 = sq ? free().find((x: any) => sq.slots[0].fits.some((f: any) => f.id === x.id && !f.blocked)) : null;
  if (sq && m2) {
    await post('send', sq.id, m2.id, 0);
    const q = (await state()).quests.find((x: any) => x.id === sq.id);
    await goto('/');
    const row = await text(page, `.board .row[data-q="${sq.id}"] .ss`);
    check(q.lapseStalled && q.lapsesAtCycle === s.cycle + 3 && row.includes(`set aside in 3`), 'a part-filled quest\'s countdown is the stall rule\'s, on the board too (lapse-ignores-stall-rule)', row.slice(0, 50));
    await post('clear', sq.id);
  } else skip('stall countdown', 'no long-lived multi-place quest');
}

// moving a placed soldier to another quest says what it leaves behind (send-breaks-old-party-silently)
{
  s = await state();
  const a = s.quests.find((q: any) => !q.approaches && q.slots.length >= 2);
  if (a && (await post('auto', a.id)).ok && (await state()).quests.find((q: any) => q.id === a.id).ready) {
    s = await state();
    const onA = s.quests.find((q: any) => q.id === a.id).slots.map((x: any) => x.filledId);
    const b = s.quests.find((q: any) => q.id !== a.id && !(q.approaches && !q.chosenApproach)
      && q.slots.some((x: any) => !x.filledBy && x.fits.some((f: any) => onA.includes(f.id) && !f.blocked)));
    if (b) {
      await goto(`/?quest=${b.id}`);
      const mover = s.roster.find((m: any) => onA.includes(m.id) && b.slots.some((x: any) => !x.filledBy && x.fits.some((f: any) => f.id === m.id && !f.blocked)));
      await (await byText(page, '.hand .card.soldier', new RegExp(firstName(mover.name))))?.click(); await sleep(900);
      const t = await toastNow();
      check(t.text.includes(`leaves ${a.title}`) && t.tone === 'warn', 'the move\'s result names the quest it breaks, in the warning tone', t.text.slice(-70));
    } else skip('send leaves toast', 'no second quest takes them');
  } else skip('send leaves toast', 'no quest Auto can fully man');
  await clearAll();
}

// Auto on a quest the idle soldiers can't fully man: nothing parked, a red refusal, no dead step (auto-short-quest)
{
  s = await state();
  const t = s.quests.find((q: any) => !q.approaches && q.slots.length >= 2);
  const idle = s.roster.filter((m: any) => m.location.kind === 'held');
  if (t && idle.length >= 2) {
    // park all but one soldier on OTHER quests' free places
    for (const m of idle.slice(1)) {
      const x = await state();
      const o = x.quests.find((q: any) => q.id !== t.id && !(q.approaches && !q.chosenApproach) && q.slots.some((sl: any) => !sl.filledBy && sl.fits.some((f: any) => f.id === m.id && !f.blocked)));
      if (o) await post('send', o.id, m.id);
    }
    const x = await state();
    const left = x.roster.filter((m: any) => m.location.kind === 'held').length;
    if (left < t.slots.length) {
      const dead = (x.nextSteps ?? []).some((st: any) => st.act && ((st.act.type === 'auto' && st.act.args[0] === t.id) || st.act.type === 'autoall')
        && !x.quests.some((q: any) => (st.act.type === 'autoall' || q.id === st.act.args[0]) && q.id !== t.id));
      await goto('/');
      await (await page.$(`.board .row[data-q="${t.id}"] .btn`))?.click(); await sleep(900);
      const toast = await toastNow();
      const after = (await state()).quests.find((q: any) => q.id === t.id);
      check(toast.tone === 'bad' && after.slots.every((sl: any) => !sl.filledBy) && !dead,
        "Auto on a quest the idle can't fully man parks nobody and says so in red; no dead Auto-fill step (auto-short-quest)", toast.text.slice(0, 70));
    } else skip('auto short quest', 'could not leave the quest short-handed');
  } else skip('auto short quest', 'no multi-place quest');
  await clearAll();
}

// the card sheet is a real dialog; the drawer's digits are its own; the +N popover closes (keyboard)
{
  await goto('/');
  await page.focus('.hand .card.soldier');
  await page.keyboard.press('Enter'); await sleep(400);
  const inSheet = () => page.evaluate(() => !!document.activeElement?.closest('.sheet'));
  const took = await inSheet();
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const stays = await inSheet();
  const bag0 = await bagOn();
  await page.keyboard.press('2'); await sleep(150);
  const bagSame = (await bagOn()) === bag0;
  await page.keyboard.press('Escape'); await sleep(300);
  const back = await page.evaluate(() => document.activeElement?.classList.contains('card') ?? false);
  check(took && stays && bagSame && back, 'the card sheet takes focus, keeps Tab inside, ignores the hand keys, and gives focus back (sheet-dialog-focus)',
    `took ${took} · stays ${stays} · bag ${bagSame} · back ${back}`);

  await page.keyboard.press('b'); await sleep(400);
  const handBag = await bagOn();
  await page.keyboard.press('3'); await sleep(200);
  const dBag = await text(page, '.drawer .bag.on');
  const searchVal = await page.$eval('.drawer .search', e => (e as HTMLInputElement).value).catch(() => 'x');
  check(dBag.startsWith('Relics') && searchVal === '' && (await bagOn()) === handBag, "the drawer's 1–4 choose ITS bag — not the search box, not the hidden hand (drawer-bag-keys)", dBag);
  await page.keyboard.press('Escape'); await sleep(250);

  if (await page.$('.nextsteps .more')) {
    await (await page.$('.nextsteps .more'))!.click(); await sleep(200);
    const opened = await count(page, '.morepop');
    await page.keyboard.press('Escape'); await sleep(200);
    const escClosed = await count(page, '.morepop') === 0;
    await (await page.$('.nextsteps .more'))!.click(); await sleep(200);
    await page.mouse.click(300, 450); await sleep(250);
    check(opened === 1 && escClosed && await count(page, '.morepop') === 0, 'the "+N" steps popover closes on Esc and on a click outside (more-popover-no-dismiss)');
  } else skip('+N popover', 'no extra steps');

  // a card deep link to nothing leaves no invisible sheet behind (the hand keys still work)
  await goto('/?card=nosuchcard');
  await page.keyboard.press('2'); await sleep(200);
  check(await count(page, '.sheet') === 0 && (await bagOn()).startsWith('Captives'), 'a sheet for a card that is gone opens nothing and blocks nothing (stale-tally-chip)', await bagOn());
}

// relic sheet: one price you can act on; Sell offered on show too (relic-worth-mismatch, cashout)
{
  s = await state();
  const stored = s.relics.find((r: any) => r.location?.kind !== 'room');
  if (stored) {
    await goto(`/?card=${stored.id}`);
    const t = await text(page, '.sheet .settop');
    check(!/worth about/.test(t) && t.includes(`~${stored.sellEst}g`), 'the relic sheet shows the one price an action pays — the sell quote (relic-worth-mismatch)', t.slice(0, 80));
    await page.keyboard.press('Escape'); await sleep(200);
  }
  const shown = s.relics.find((r: any) => r.location?.kind === 'room' && r.cashLoss);
  if (shown) {
    await goto(`/?card=${shown.id}`);
    const sell = await byText(page, '.sheet .acts .btn', /^Sell/);
    await sell?.click(); await sleep(300);
    const armedTxt = await text(page, '.sheet .acts .is-armed');
    check(!!sell && armedTxt.includes(shown.cashLoss) && !!allCards(await state()).find((c: any) => c.id === shown.id),
      'a relic on show can be sold — after a second click that says the prestige it takes (cashout-on-show-hides-prestige)', armedTxt.slice(0, 80));
    await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await sleep(200);
  } else skip('on-show relic sell confirm', 'no relic on show earning prestige');
}

// the header pill and the tile's RAISE both RAISE — checked by the request they send (aborted, so the hall stays)
if (s.ghReady) {
  const sent: string[] = [];
  const onReq = (r: any) => {
    if (r.method() === 'POST' && r.url().includes('/api/action')) { sent.push(JSON.parse(r.postData() ?? '{}').type); r.abort() }
    else r.continue();
  };
  await goto('/');
  await page.setRequestInterception(true); page.on('request', onReq);
  await (await page.$('.res .gh.ready'))?.click(); await sleep(400);
  check(sent[0] === 'gh', 'the header "Raise Great Hall" pill raises it — the same engine call as the tile (header-raise-pill-navigates)', sent.join(','));
  page.off('request', onReq); await page.setRequestInterception(false);
  await goto('/?screen=fort');
  await page.setRequestInterception(true); page.on('request', onReq);
  await page.focus('.cell.gh .raise'); await page.keyboard.press('Enter'); await sleep(400);
  const pressed = await page.$eval('.cell.gh', e => e.getAttribute('aria-pressed')).catch(() => null);
  check(sent[1] === 'gh' && pressed === 'false', 'Enter on the tile\'s RAISE raises — it does not toggle the tile (raise-button-keyboard)', `${sent.join(',')} · pressed ${pressed}`);
  page.off('request', onReq); await page.setRequestInterception(false);
} else skip('raise buttons', 'the Great Hall is not ready');

// a dragged soldier's chip on the map: coloured by strength, and says what they leave (map-chip-colour-lost)
{
  s = await state();
  const a = s.quests.find((q: any) => !(q.approaches && !q.chosenApproach) && q.slots.some((sl: any) => !sl.filledBy && sl.fits.some((f: any) => !f.blocked)));
  const m = a ? s.roster.find((x: any) => a.slots.some((sl: any) => !sl.filledBy && sl.fits.some((f: any) => f.id === x.id && !f.blocked))) : null;
  if (a && m) {
    await post('send', a.id, m.id);
    const x = await state();
    const other = x.roster.find((y: any) => y.id === m.id).placements.find((p: any) => p.questId !== a.id);
    await goto('/');
    const src = await byText(page, '.hand .card.soldier', new RegExp(firstName(m.name)));
    const dst = other ? await page.$(`.mk[data-q="${other.questId}"] .ros`) : null;
    if (src && dst) {
      await src.drag(dst); await sleep(500);
      const chip = await page.$eval(`.mk[data-q="${other.questId}"] .fitb`, e => ({ cls: e.className, bg: getComputedStyle(e).backgroundColor, t: e.textContent ?? '' })).catch(() => null);
      const b = (await (await page.$('.map'))!.boundingBox())!;
      await release(page, b.x + 30, b.y + b.height - 30); await sleep(400);
      check(!!chip && chip.bg !== 'rgb(207, 198, 178)' && /\dc · (strong|fair|weak)/.test(chip.t) && chip.t.includes('leaves'),
        'a dragged soldier\'s map chip is strength-coloured and says the quest they leave (map-chip-colour-lost, send-breaks-old-party)', chip ? `${chip.bg} ${chip.t}` : 'no chip');
    } else skip('map drag chip', 'no second quest marker for them');
    await clearAll();
  } else skip('map drag chip', 'no free place');
}

// the fort hand: a room-armed badge is the engine's signed change, never a green room total (hand-badge-room-total-as-gain)
{
  s = await state();
  const kitchen = s.fort.rooms.find((r: any) => r.kind === 'prestige' && r.slots.length === 0 && r.addPlace?.action === 'upgrade' && !r.addPlace.block);
  const mover = s.relics.find((r: any) => r.location?.kind === 'room' && s.fort.rooms.find((x: any) => x.id === r.whereId)?.kind === 'prestige');
  if (kitchen && mover) {
    const home = mover.whereId;
    await post('upgrade', kitchen.id);
    await post('setin', kitchen.id, mover.id);
    const x = await state();
    const row = allCards(x).find((c: any) => c.id === mover.id).roomPlacements.find((p: any) => p.roomId === home);
    await goto('/?screen=fort');
    await clickRoom(home);
    await (await byText(page, '.hand .bag', /Relics/))?.click(); await sleep(300);
    const badge = await page.evaluate((name: string) => { const c = [...document.querySelectorAll('.hand .card')].find(e => e.querySelector('.nm')?.textContent === name);
      const b = c?.querySelector('.badge'); return b ? { t: b.textContent ?? '', cls: b.className } : null }, mover.name);
    const want = row?.ok ? String(row.badge).replace(/(\d) prestige\b/, '$1 ✦') : null;
    check(!!badge && !!want && badge.t === want && (row.tone === 'bad' ? /\bbad\b/.test(badge.cls) : !/\bgood\b/.test(badge.cls) || row.tone === 'good'),
      'a room-armed hand badge is the engine\'s signed change, coloured by what it does (hand-badge-room-total-as-gain)', badge ? `${badge.t} (${badge.cls})` : 'no badge');
    // cashing out a tamed captive on show asks twice and says the prestige it takes
    const tamed = x.captives.find((c: any) => c.state === 'tamed');
    if (tamed) {
      await post('upgrade', kitchen.id);
      await post('setin', kitchen.id, tamed.id);
      const t2 = (await state()).captives.find((c: any) => c.id === tamed.id);
      if (t2?.cashLoss) {
        await goto(`/?card=${tamed.id}`);
        await (await byText(page, '.sheet .acts .btn', /^Ransom/))?.click(); await sleep(300);
        const armedTxt = await text(page, '.sheet .acts .is-armed');
        check(armedTxt.includes(t2.cashLoss) && !!(await state()).captives.find((c: any) => c.id === tamed.id),
          'ransoming a captive on show asks twice, saying the prestige it takes (cashout-on-show-hides-prestige)', armedTxt.slice(0, 80));
        await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await sleep(200);
      } else skip('cash-out confirm', 'the captive earns nothing on show');
    }
  } else skip('room-armed hand badge', 'no empty prestige room + relic on show');
}

// a bedroom is built for the owner the select SHOWS; under reduced motion the new room does not glide (bed-owner-select-mismatch, rm-smooth-scroll)
{
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await goto('/?screen=fort');
  await page.evaluate(() => { (window as any).__scrolls = []; const o = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (a?: any) { (window as any).__scrolls.push(a?.behavior ?? null); return o.call(this, a) } });
  if (!(await state()).freeCells) { await (await page.$('.btn.dig1'))?.click(); await sleep(700) }
  const row = await page.$('.brow[data-btype="bedroom"]');
  if (row && await row.$('select')) {
    const shown = await row.$eval('select', e => { const s = e as HTMLSelectElement; return { v: s.value, t: s.options[s.selectedIndex]?.text ?? '' } });
    const before = (await state()).fort.rooms.filter((r: any) => r.benefit === 'cap').length;
    await (await row.$('.btn.solid'))!.click(); await sleep(900);
    const beds = (await state()).fort.rooms.filter((r: any) => r.benefit === 'cap');
    check(beds.length === before + 1 && beds.some((r: any) => r.owner === shown.t), 'the bedroom is built for the owner the select shows (bed-owner-select-mismatch)', shown.t);
    const scrolls: (string | null)[] = await page.evaluate(() => (window as any).__scrolls);
    check(scrolls.length > 0 && scrolls.every(b => b !== 'smooth'), 'under reduced motion a new room scrolls into view without the glide (rm-smooth-scroll)', scrolls.join(','));
  } else skip('bedroom owner select', 'no bedroom to build');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
}

await clearAll();
await goto('/');
s = await state();

// ── the map ──
check(await count(page, '.mk:not(.home)') === s.quests.length, 'one marker per open quest', `${await count(page, '.mk:not(.home)')}/${s.quests.length}`);
check(await count(page, '.board .row') === s.quests.length, 'the board lists every quest');
check(!(await hscroll(page)), 'no horizontal page scroll');
await (await page.$('.mk:not(.home) .ros'))?.hover(); await sleep(300);
check(await count(page, '.tip') === 1, 'hovering a marker shows its tooltip');
await shot(page, '01-map-hover');
check(await count(page, '.nextsteps .step') > 0, 'the next-steps scroll shows the engine\'s steps', await text(page, '.nextsteps .step .t'));

// ── a REAL drag: soldier card → a quest marker; a one-place quest fills and its chip says the BAND (R6) ──
const one = s.quests.find((q: any) => !q.approaches && q.slots.length === 1) ?? s.quests.find((q: any) => !q.approaches);
if (one) {
  const src = (await page.$('.hand .card.soldier'))!;
  const dst = (await page.$(`.mk[data-q="${one.id}"] .ros`))!;
  await drag(page, src, dst);
  const after = (await state()).quests.find((q: any) => q.id === one.id);
  check(after.slots.some((x: any) => x.filledBy), 'dragging a soldier onto a marker sends them there', one.title);
  if (after.ready) {
    await until(async () => BAND_RE.test(await text(page, `.mk[data-q="${one.id}"] .chip`)));
    const chip = await text(page, `.mk[data-q="${one.id}"] .chip`);
    check(BAND_RE.test(chip), 'a manned marker\'s chip names the pooled band', chip);
  } else skip('manned marker band chip', `${one.title} needs more than one soldier`);
  await shot(page, '02-after-drag');
} else skip('drag onto a marker', 'no plain quest on the table');

// ── the quest page ──
const q = s.quests.find((x: any) => !x.approaches && x.slots.length > 1) ?? one ?? s.quests[0];
if (q) {
  await goto(`/?quest=${q.id}`);
  check((await text(page, '.writ h1')) === q.title, 'the quest page opens on the quest', await text(page, '.writ h1'));
  await (await byText(page, '.writ .btns .btn', /^Clear$/))?.click(); await sleep(800);
  const empties = await count(page, '.arch .empty');
  check(empties > 0, 'Clear empties the places', `${empties} empty`);
  await (await page.$('.arch .empty'))?.click(); await sleep(300);
  check(await count(page, '.hand .card .badge') > 0, 'arming a place badges the hand with coins');
  await shot(page, '03-armed');
  await (await page.$('.hand .card.soldier:not(.dim):not(.blocked):not(.here)'))?.click(); await sleep(900);
  check(await count(page, '.arch .empty') === empties - 1, 'clicking a card fills the armed place');
  await (await byText(page, '.writ .btns .btn', /Auto-assign/))?.click(); await sleep(900);
  check(await count(page, '.arch .empty') < empties, 'Auto-assign fills places');
  check(/^(Marches|Place|Pick)/.test(await text(page, '.writ .btns .ok')), 'the quest pill says whether it marches', await text(page, '.writ .btns .ok'));
  await shot(page, '04-quest');
  await page.keyboard.press('Escape'); await sleep(400);
  check(await count(page, '.map') === 1, 'Esc goes back to the map');
}

// ── the sheet ──
await (await page.$('.hand .card.soldier'))?.click(); await sleep(500);
check(await count(page, '.sheet .attrs .at') === 5, 'clicking a card opens their sheet with 5 attributes');
check(await count(page, '.sheet .sq') >= 0, 'the sheet lists where they could go');
await shot(page, '05-sheet');
await page.keyboard.press('Escape'); await sleep(300);
check(await count(page, '.sheet') === 0, 'Esc closes the sheet');

// ── leads ──
await (await page.$$('.boardtabs button'))[1]?.click(); await sleep(300);
check(await count(page, '.board .row.lead') === s.leads.length, 'the leads tab lists every lead', `${await count(page, '.board .row.lead')}/${s.leads.length}`);
const pa = await byText(page, '.board button', /Pursue all/);
check(!!pa, 'the Leads tab has a Pursue all button (R3)', pa ? await pa.evaluate(n => n.textContent ?? '') : 'missing');

// ── the drawer ──
await page.keyboard.press('b'); await sleep(400);
check(await count(page, '.drawer') === 1, 'B opens every card');
check((await page.$eval('.drawer .search', e => (e as HTMLInputElement).value).catch(() => 'x')) === '', 'the B keystroke does not land in the search box');
const before = await count(page, '.drawer .card');
await page.type('.drawer .search', s.roster[0]?.name.slice(0, 4) ?? 'x'); await sleep(300);
check(await count(page, '.drawer .card') <= before, 'search narrows the drawer');
await shot(page, '06-drawer');
await page.keyboard.press('Escape'); await sleep(200);

// ── the fort ──
await goto('/?screen=fort');
s = await state();
check(await count(page, '.cell svg') >= s.fort.rooms.length, 'every room is drawn with its icon');
const rows = await page.$$eval('.brow .d', els => els.map(e => e.textContent ?? ''));
check(rows.length > 0 && rows.every(t => t.length > 10), 'every build row says what the room does', `${rows.length} rows`);
await (await page.$('.cell:not(.free):not(.dig)'))?.click(); await sleep(300);
check(await count(page, '.rd h2') === 1, 'clicking a room opens its panel');
await page.keyboard.press('Escape'); await sleep(300);
check(await count(page, '.rd h2') === 0, 'Esc deselects the fort room');
await shot(page, '07-fort');

// a captive DRAGGED onto a room TILE is set there (Game.setInRoom)
const raw = s.captives.find((c: any) => c.state === 'raw' && (c.roomPlacements ?? []).some((p: any) => p.ok && p.kind === 'rack' && p.roomId));
if (raw) {
  const rackId = raw.roomPlacements.find((p: any) => p.ok && p.kind === 'rack' && p.roomId).roomId;
  await (await byText(page, '.hand .bag', /Captives/))?.click(); await sleep(300);
  const src = await byText(page, '.hand .card.captive', new RegExp(raw.name.split(' ')[0]));
  const dst = await page.$(`.cell[data-room="${rackId}"]`);
  if (src && dst) {
    await drag(page, src, dst);
    const c = cardIn(await state(), raw.id);
    check(c?.location?.kind === 'room' && c.location.roomId === rackId, 'a captive dropped on a room tile goes on its rack', `${raw.name} → ${c?.whereName ?? c?.location?.kind}`);
  } else check(false, 'a captive dropped on a room tile goes on its rack', `no ${src ? 'tile' : 'hand card'}`);
  await shot(page, '08-fort-drop');
} else skip('captive dropped on a room tile', 'no raw captive with a free rack');

// the rack's panel: clicking a placed card opens its sheet (never unslots); ✕ takes TWO clicks (R1)
s = await state();
const rack = s.fort.rooms.find((r: any) => r.kind === 'rack' && r.slots.some(Boolean));
if (rack) {
  const at = rack.slots.findIndex(Boolean), who = rack.slots[at];
  await (await page.$(`.cell[data-room="${rack.id}"]`))?.click(); await sleep(400);
  await (await page.$('.rslot.full .card'))?.click(); await sleep(400);
  const still = cardIn(await state(), who.id);
  check(await count(page, '.sheet') === 1 && still?.location?.kind === 'room', 'clicking a card in a room slot opens its sheet (it stays put)', who.name);
  await page.keyboard.press('Escape'); await sleep(300);
  await (await page.$('.rslot.full .rx'))?.click(); await sleep(300);
  const armed = await count(page, '.rslot .rx.is-armed');
  const s1 = cardIn(await state(), who.id);
  check(armed === 1 && s1?.location?.kind === 'room', 'the rack ✕ first ARMS (says what is lost), nothing changes', await text(page, '.rslot .rx.is-armed'));
  await (await page.$('.rslot .rx.is-armed'))?.click(); await sleep(700);
  const s2 = cardIn(await state(), who.id);
  check(s2?.location?.kind !== 'room', 'the second ✕ click takes them off the rack', `${who.name}: ${s2?.state}`);
  await shot(page, '09-fort-rack');
} else skip('rack slot click / two-step ✕', 'no occupied rack');

// the captive / relic sheet: "Set them in" puts it in a room
s = await state();
const settable = [...s.captives, ...s.relics].find((c: any) => c.location?.kind !== 'room' && (c.roomPlacements ?? []).some((p: any) => p.ok && p.roomId));
if (settable) {
  await goto(`/?screen=fort&card=${settable.id}`);
  const btn = await page.$('.sheet .setin .sr.is-ok .btn');
  await btn?.click(); await sleep(800);
  const c = cardIn(await state(), settable.id);
  check(!!btn && c?.location?.kind === 'room', 'the sheet\'s "Set them in" puts it in a room', `${settable.name} → ${c?.whereName ?? 'nowhere'}`);
  await shot(page, '10-sheet-setin');
  await page.keyboard.press('Escape'); await sleep(300);
} else skip('sheet Set them in', 'no card with a room that takes it');

// R8: a room with no places shows a ghost "Add a place" slot that works in one click
s = await state();
const bare = s.fort.rooms.find((r: any) => r.kind && r.slots.length === 0 && r.addPlace && !r.addPlace.block);
if (bare) {
  await (await page.$(`.cell[data-room="${bare.id}"]`))?.click(); await sleep(400);
  const add = await page.$('.rslot.ghostslot .add');
  await add?.click(); await sleep(700);
  const r = (await state()).fort.rooms.find((x: any) => x.id === bare.id);
  check(!!add && r.slots.length === 1, 'the ghost slot "Add a place" adds one', `${bare.name}: ${r.slots.length} place(s)`);
  await page.keyboard.press('Escape'); await sleep(300);
} else skip('ghost Add a place slot', 'no affordable room with 0 places');

// a function room's candidates say the prestige a move throws away (move-preview-hides-prestige-loss)
{
  s = await state();
  const fr = s.fort.rooms.find((r: any) => r.kind === 'function' && r.slots.length > 0 && (s.roomFits?.[r.id] ?? []).length);
  if (fr) {
    const rows = (s.roomFits[fr.id] as string[]).map(id => allCards(s).find((c: any) => c.id === id)?.roomPlacements?.find((p: any) => p.roomId === fr.id)).filter((p: any) => p?.ok);
    const losing = rows.slice(0, 5).filter((p: any) => p.tone === 'bad');   // the panel lists the first five
    await goto('/?screen=fort'); await clickRoom(fr.id);
    const shownLosing = await page.$$eval('.cands .cand.loses .cl', els => els.map(e => e.textContent ?? ''));
    check(losing.length ? shownLosing.length === losing.length && shownLosing.every(t => /−[\d.]+ ✦/.test(t)) : shownLosing.length === 0,
      "a function room's candidates say the prestige each move throws away, in the warning colour (move-preview-hides-prestige-loss)", shownLosing[0] ?? `${losing.length} losing`);
  } else skip('function room candidates', 'no function room with a place and candidates');
}

// dropping on an OCCUPIED place: its own number before the drop (occupied-slot-no-preview)
{
  s = await state();
  const pr = s.fort.rooms.find((r: any) => r.kind === 'prestige' && r.slots.some(Boolean));
  const stored = s.relics.find((r: any) => r.location?.kind !== 'room');
  if (pr && stored) {
    await goto('/?screen=fort'); await clickRoom(pr.id);
    await (await byText(page, '.hand .bag', /Relics/))?.click(); await sleep(300);
    const src = await byText(page, '.hand .card', new RegExp(stored.name.split(' ')[0]!));
    const dst = await page.$('.rslot.full');
    if (src && dst) {
      await src.drag(dst); await sleep(900);
      const ov = await text(page, '.rslot .ov');
      const b = (await (await page.$('.panel'))!.boundingBox())!;
      await release(page, b.x + 20, b.y + 20); await sleep(400);
      check(/^⇄ [+−][\d.]+ ✦/.test(ov) || /^⇄ /.test(ov), 'an occupied place shows the engine\'s own swap number before the drop (occupied-slot-no-preview)', ov);
    } else skip('occupied place preview', 'no stored relic card / full place on screen');
  } else skip('occupied place preview', 'no prestige room with a card + stored relic');
}

// ── THE END GUARD (R5): with warnings the first press arms the seal, the second ends the cycle ──
await goto('/');
s = await state();
// no warning on the table? make one: a manned multi-place quest with one soldier sent back won't march
if (!(s.endWarnings ?? []).length) {
  const mq = s.quests.find((q: any) => q.ready && !q.faucet && (q.approaches ? q.slots.filter((x: any) => x.groupId === q.chosenApproach) : q.slots).length >= 2);
  const sl = mq?.slots.find((x: any) => x.filledBy);
  if (mq && sl) await post('unassign', mq.id, sl.idx);
  else {
    const eq = s.quests.find((q: any) => !(q.approaches && !q.chosenApproach) && !q.faucet && q.slots.filter((x: any) => !x.filledBy).length >= 2);
    const m = eq ? s.roster.find((x: any) => x.location.kind === 'held' && eq.slots.some((y: any) => !y.filledBy && y.fits.some((f: any) => f.id === x.id && !f.blocked))) : null;
    if (eq && m) await post('send', eq.id, m.id);
  }
  await goto('/');
  s = await state();
}
const c0 = s.cycle;
if ((s.endWarnings ?? []).length) {
  await (await page.$('button.seal'))?.click(); await sleep(400);
  const armedSeal = await count(page, 'button.seal.is-armed'), warnList = await count(page, '.sealwarns button');
  check(armedSeal === 1 && warnList === s.endWarnings.length && (await state()).cycle === c0,
    'with END warnings the first click arms the seal and lists them (nothing ends)', await text(page, 'button.seal'));
  // the armed seal's text sits on a dark base (it was near-white on a pale pink, ~2.1:1)
  const ink = await page.$eval('button.seal.is-armed', e => ({ c: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundImage })).catch(() => null);
  const rgb = (t: string) => '#' + (t.match(/\d+/g) ?? []).slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('');
  check(!!ink && ink.bg.includes('rgb(143, 42, 33)') && contrast(rgb(ink.c), '#8f2a21') >= 4.5, 'the armed seal\'s text holds ≥ 4.5:1 on its base (seal-armed-contrast)',
    ink ? `${contrast(rgb(ink.c), '#8f2a21').toFixed(1)}:1` : 'not armed');
  await shot(page, '11-seal-armed');
  await (await page.$('button.seal'))?.click();
} else {
  skip('END guard', 'no END warnings on this save');
  await (await page.$('button.seal'))?.click();
}
check(await until(async () => (await count(page, '.reckpage')) === 1, 3000), 'the second click opens the reckoning');
await until(async () => { const x = await state(); return x.cycle > c0 && !x.reckoningWriting }, 60000);
await until(async () => (await page.$$eval('.proceed', b => b.some(x => !(x as HTMLButtonElement).disabled))), 20000);
s = await state();
const nMeta = (s.lastMeta ?? []).length;
const blocks = await count(page, '.rblock.success, .rblock.partial, .rblock.failure');
const stamps = await count(page, '.rblock .stamp');
check(nMeta > 0 && blocks === nMeta && stamps >= nMeta, 'the reckoning shows one verdict block + stamp per marching quest', `${blocks} blocks, ${stamps} stamps, ${nMeta} verdicts`);
const tally = await text(page, '.reckfoot .tally');
const gold = /^([+−-]\d+g)/.exec(s.lastTally ?? '')?.[1];
check(await count(page, '.tally .tchip') > 0 && (!gold || tally.includes(gold)), 'the reckoning footer tallies the spoils', tally.slice(0, 90));
await shot(page, '12-reckoning');
check(s.lastSummary?.cycle === s.cycle, 'the tally is this cycle\'s the moment the report is in (proceed-before-tally)', `summary c${s.lastSummary?.cycle} · now c${s.cycle}`);
await page.keyboard.press('Enter'); await sleep(700);
check(await count(page, '.reckpage') === 0, 'Enter proceeds out of the reckoning');
const toast = await text(page, '.toast');
check(!!s.lastTally && toast.includes(s.lastTally), 'PROCEED toasts the cycle\'s tally', toast.slice(0, 90));
await shot(page, '13-after-end');
// the mouse is elsewhere: the "END would leave behind" popup is not left stuck open (sealwarns-sticky)
await page.mouse.move(400, 400); await sleep(300);
check(await count(page, '.sealwarns') === 0, 'after an END the seal\'s warning popup is not stuck open over the board (sealwarns-sticky)');

// ── Pursue all (R3): the map table takes every lead; an arrival toasts with an Open button ──
s = await state();
if (s.pursuable > 0 && s.quests.length + s.pursuable <= 14) {
  await (await page.$$('.boardtabs button'))[1]?.click(); await sleep(300);
  await (await byText(page, '.board button', /Pursue all/))?.click();
  const arrived = await until(async () => /on the map/.test(await text(page, '.toast')), 30000);
  check(arrived, 'Pursue all → an arrival toast says it is on the map', (await text(page, '.toast')).slice(0, 90));
  const open = await page.$('.toast .btn');
  if (open) { await open.click(); await sleep(600); check((await count(page, '.questpage')) + (await count(page, '.map')) === 1, 'the arrival toast\'s Open goes there') }
} else skip('Pursue all', `${s.pursuable} pursuable`);

// ── a captive's last cycle in holding: the scroll, the seal and the tally all say it (end-guard-misses-go-cold,
//    urgent-step-truncated, tally-missing-losses) ──
{
  const drainJobs = async () => until(async () => !(await state()).jobs.some((j: any) => j.state === 'queued' || j.state === 'running'), 60000);
  await drainJobs();
  s = await state();
  let guard = 0;
  while (s.holding.length && s.holding.every((h: any) => h.expires - s.cycle > 1) && guard++ < 4) {
    await post('end'); await until(async () => !(await state()).reckoningWriting, 30000); s = await state();
  }
  const h = s.holding.find((x: any) => x.expires - s.cycle <= 1);
  if (h) {
    await goto('/');
    const step = await page.evaluate((name: string) => { const st = [...document.querySelectorAll('.nextsteps .step.urgent')].find(e => (e.getAttribute('title') ?? '').includes(name));
      const t = st?.querySelector('.t') as HTMLElement | undefined; return st ? { title: st.getAttribute('title') ?? '', w: t?.clientWidth ?? 0 } : null }, h.name);
    check(!!step && step.title.includes('handed off at this END') && step.w >= 80, 'the urgent holding step keeps its words — name and deadline, never "Varis…" (urgent-step-truncated)',
      step ? `${step.w}px · ${step.title.slice(0, 60)}` : 'no urgent step');
    await (await page.$('.sealbox'))?.hover(); await sleep(300);
    const lines = await page.$$eval('.sealwarns button', els => els.map(e => e.textContent ?? ''));
    check(lines.some(l => l.includes(h.name) && /handed off at this END/.test(l)), 'the seal lists the captive handed off at this END (end-guard-misses-go-cold)', lines.find(l => l.includes(h.name))?.slice(0, 70) ?? '');
    const c1 = s.cycle;
    await (await page.$('button.seal'))?.click(); await sleep(300);
    const armed = await count(page, 'button.seal.is-armed');
    check(armed === 1 && (await state()).cycle === c1, 'with a hand-off due, END takes two clicks (end-guard-misses-go-cold)');
    await (await page.$('button.seal'))?.click();
    await until(async () => { const x = await state(); return x.cycle > c1 && !x.reckoningWriting }, 60000);
    await until(async () => (await page.$$eval('.proceed', b => b.some(x => !(x as HTMLButtonElement).disabled))), 20000);
    await sleep(500);
    const chips = await page.$$eval('.tally .tchip', els => els.map(e => e.textContent ?? ''));
    check(chips.some(c => /handed off/.test(c)), 'the tally shows the captive handed off — not only its gold (tally-missing-losses)', chips.join(' | ').slice(0, 90));
    await page.keyboard.press('Enter'); await sleep(600);
    await page.mouse.move(400, 400);
  } else skip('holding hand-off turn', 'nobody left in holding');
}

// the header's number floats its change beside itself, inside the bar — never over the next-steps row
{
  s = await state();
  const r = s.relics.find((x: any) => x.sellEst > 0 && !x.cashLoss);
  if (r) {
    await goto('/'); await sleep(300);
    await post('sell', r.id);
    const got = await until(async () => (await count(page, '.top .floater')) > 0, 8000);
    const box = got ? await page.evaluate(() => { const f = document.querySelector('.top .floater')!.getBoundingClientRect(), t = document.querySelector('.top')!.getBoundingClientRect();
      return { fb: f.bottom, tb: t.bottom, ft: f.top, tt: t.top } }) : null;
    check(!!box && box.fb <= box.tb + 1 && box.ft >= box.tt - 1, 'a header floater stays inside the header bar (floater-over-nextsteps)', box ? `${Math.round(box.ft)}–${Math.round(box.fb)} in ${Math.round(box.tt)}–${Math.round(box.tb)}` : 'no floater seen');
  } else skip('header floater', 'no relic to sell');
}

// ── 1280×800: no horizontal scroll on any screen ──
await page.setViewport({ width: 1280, height: 800 });
s = await state();
for (const [name, path] of [['map', '/'], ['fort', '/?screen=fort'], ['chronicle', '/?screen=chronicle'], ['quest', `/?quest=${s.quests[0]?.id ?? ''}`]] as const) {
  await goto(path);
  check(!(await hscroll(page)), `no horizontal scroll at 1280×800 — ${name}`);
}

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log([...notes, ...skips, ...fails].join('\n'));
console.log(`\n${notes.length} passed, ${fails.length} failed, ${skips.length} skipped · shots in ${SHOTS}`);
process.exit(fails.length ? 1 : 0);
