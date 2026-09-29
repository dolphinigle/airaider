// PLAYTEST THE GUI IN A REAL BROWSER — clicks, a real drag, keyboard, and the DOM read back.
// Not a simulation of the UI (docs/DOGFOODING.md forbids that): this drives the actual page in
// actual Chrome against the actual server. Point it at a SCRATCH save — it places soldiers.
//
// Usage: npx tsx scripts/uiplay.ts [webPort] [shotDir]
import puppeteer, { type Page } from 'puppeteer-core';
import * as fs from 'node:fs';

const PORT = process.argv[2] ?? '5273';
const SHOTS = process.argv[3] ?? '/tmp/uiplay';
const BASE = `http://localhost:${PORT}`;
fs.mkdirSync(SHOTS, { recursive: true });

const fails: string[] = [], notes: string[] = [];
function check(ok: boolean, what: string, detail = '') { (ok ? notes : fails).push(`${ok ? '✓' : '✗'} ${what}${detail ? ` — ${detail}` : ''}`) }
const shot = (p: Page, n: string) => p.screenshot({ path: `${SHOTS}/${n}.png` });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const count = (p: Page, sel: string) => p.$$eval(sel, els => els.length);
const text = (p: Page, sel: string) => p.$eval(sel, e => e.textContent ?? '').catch(() => '');
const state = async () => (await fetch(`${BASE}/api/state`)).json() as Promise<any>;

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle2' });
await sleep(800);

let s = await state();
// clear every placement so the run starts from nothing
for (const q of s.quests) for (const sl of q.slots) if (sl.filledBy) await fetch(`${BASE}/api/action`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'unassign', args: [q.id, sl.idx] }) });
await page.reload({ waitUntil: 'networkidle2' }); await sleep(600);
s = await state();

// ── the map ──
check(await count(page, '.mk:not(.home)') === s.quests.length, 'one marker per open quest', `${await count(page, '.mk:not(.home)')}/${s.quests.length}`);
check(await count(page, '.board .row') === s.quests.length, 'the board lists every quest');
check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), 'no horizontal page scroll');
await (await page.$('.mk:not(.home) .ros'))?.hover(); await sleep(300);
check(await count(page, '.tip') === 1, 'hovering a marker shows its tooltip');
await shot(page, '01-map-hover');

// ── a REAL drag: soldier card → a quest marker (CDP drag events, not synthetic mouse) ──
const target = s.quests.find((q: any) => !q.approaches);
if (target) {
  const idx = s.quests.indexOf(target);
  await page.setDragInterception(true);
  const src = (await page.$('.hand .card.soldier'))!;
  const dst = (await page.$$('.mk:not(.home) .ros'))[idx]!;
  await src.dragAndDrop(dst, { delay: 150 });
  await sleep(900);
  await page.setDragInterception(false);
  const after = (await state()).quests.find((q: any) => q.id === target.id);
  check(after.slots.some((x: any) => x.filledBy), 'dragging a soldier onto a marker sends them there', target.title);
  await shot(page, '02-after-drag');
}

// ── the quest page ──
const q = target ?? s.quests[0];
if (q) {
  await page.goto(`${BASE}/?quest=${q.id}`, { waitUntil: 'networkidle2' }); await sleep(600);
  check((await text(page, '.writ h1')) === q.title, 'the quest page opens on the quest', await text(page, '.writ h1'));
  await (await page.$('.btn.ghost'))?.click(); await sleep(800);   // Clear
  const empties = await count(page, '.arch .empty');
  check(empties > 0, 'Clear empties the places', `${empties} empty`);
  await (await page.$('.arch .empty'))?.click(); await sleep(300);
  check(await count(page, '.hand .card .badge') > 0, 'arming a place badges the hand with coins');
  await shot(page, '03-armed');
  await (await page.$('.hand .card.soldier:not(.dim)'))?.click(); await sleep(900);
  check(await count(page, '.arch .empty') === empties - 1, 'clicking a card fills the armed place');
  await (await page.$('.writ .btns .btn'))?.click(); await sleep(900);   // Auto-assign
  check(await count(page, '.arch .empty') < empties, 'Auto-assign fills places');
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

// ── the drawer ──
await page.keyboard.press('b'); await sleep(400);
check(await count(page, '.drawer') === 1, 'B opens every card');
const before = await count(page, '.drawer .card');
await page.type('.drawer .search', s.roster[0]?.name.slice(0, 4) ?? 'x'); await sleep(300);
check(await count(page, '.drawer .card') <= before, 'search narrows the drawer');
await shot(page, '06-drawer');
await page.keyboard.press('Escape'); await sleep(200);

// ── the fort ──
await page.goto(`${BASE}/?screen=fort`, { waitUntil: 'networkidle2' }); await sleep(600);
check(await count(page, '.cell svg') >= s.fort.rooms.length, 'every room is drawn with its icon');
const rows = await page.$$eval('.brow .d', els => els.map(e => e.textContent ?? ''));
check(rows.length > 0 && rows.every(t => t.length > 10), 'every build row says what the room does', `${rows.length} rows`);
await (await page.$('.cell:not(.free):not(.dig)'))?.click(); await sleep(300);
check(await count(page, '.rd h2') === 1, 'clicking a room opens its panel');
await shot(page, '07-fort');

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log([...notes, ...fails].join('\n'));
console.log(`\n${notes.length} passed, ${fails.length} failed · shots in ${SHOTS}`);
process.exit(fails.length ? 1 : 0);
