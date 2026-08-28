// PLAYTEST THE QUEST SCREEN IN A REAL BROWSER — clicks, drags, keyboard, and the DOM read back.
// Not a simulation of the UI (docs/DOGFOODING.md forbids that): this drives the actual page in
// actual Chrome against the actual server.
//
// Usage: npx tsx scripts/uiplay.ts [webPort] [shotDir]
import puppeteer, { type Page } from 'puppeteer-core';
import * as fs from 'node:fs';

const PORT = process.argv[2] ?? '5273';
const SHOTS = process.argv[3] ?? '/home/irvan/.claude/jobs/80974e3b/tmp/shots/play';
fs.mkdirSync(SHOTS, { recursive: true });

const fails: string[] = [];
const notes: string[] = [];
function check(ok: boolean, what: string, detail = '') {
  (ok ? notes : fails).push(`${ok ? '✓' : '✗'} ${what}${detail ? ` — ${detail}` : ''}`);
}
const shot = (p: Page, n: string) => p.screenshot({ path: `${SHOTS}/${n}.png` });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** a REAL browser drag (CDP Input.dispatchDragEvent), not synthetic mouse events —
 *  those do not drive HTML5 drag-and-drop at all. */
async function drag(page: Page, from: string, to: string) {
  await page.setDragInterception(true);
  const src = (await page.$(from))!, dst = (await page.$(to))!;
  await src.dragAndDrop(dst, { delay: 120 });
  await sleep(800);
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) });
page.on('requestfailed', r => errors.push(`REQ FAIL ${r.url()} ${r.failure()?.errorText}`));
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`) });

try {
// ── 1 · THE BOARD ─────────────────────────────────────────────────────────────────────────
await page.goto(`http://localhost:${PORT}/?tab=quests`, { waitUntil: 'networkidle2' });
await sleep(800);
await shot(page, '01-board');
const rows = await page.$$('.qrow');
check(rows.length > 0, 'the board lists quests', `${rows.length} rows`);
check(!!(await page.$('.qhand')), 'the hand is on the board too');

// start from a clean board so this measures the BUTTON, not leftover state
await page.evaluate(async () => {
  const st = await (await fetch('/api/state')).json();
  for (const q of st.quests) for (const [i, sl] of q.slots.entries())
    if (sl.filledBy) await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'unassign', args: [q.id, i] }) });
});
await page.reload({ waitUntil: 'networkidle2' }); await sleep(700);
// Auto on a single row, without opening the quest (G4)
const before = await page.$$eval('.pip.on', els => els.length);
await page.waitForSelector('.qrow .act.auto', { timeout: 8000 });
await page.click('.qrow .act.auto');
await sleep(900);
const after = await page.$$eval('.pip.on', els => els.length);
check(after > before, 'Auto mans a quest from the row, without opening it (G4)', `${before} → ${after} pips`);
await shot(page, '02-board-auto');

// ── 2 · INTO A QUEST ──────────────────────────────────────────────────────────────────────
// pick the quest with the most slots, free EVERY soldier, and deep-link straight to it. With a
// two-man company the checks below would otherwise be measuring the size of the bench rather
// than the behaviour of the screen — and a reload on the board would lose the open quest.
let bench = 0;
const targets = await page.evaluate(async () => {
  const st = await (await fetch('/api/state')).json();
  for (const q of st.quests) for (const [i, sl] of q.slots.entries())
    if (sl.filledBy) await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'unassign', args: [q.id, i] }) });
  const withCast = [...st.quests].filter((q: any) => q.cast?.length)
    .sort((a: any, b: any) => b.slots.length - a.slots.length)[0]?.id;
  const widest = [...st.quests].sort((a: any, b: any) => b.slots.length - a.slots.length)[0]?.id;
  return [...new Set([withCast, widest].filter(Boolean))] as string[];
});
for (const target of targets) {
await page.goto(`http://localhost:${PORT}/?quest=${target}`, { waitUntil: 'networkidle2' });
await sleep(900);
check(!!(await page.$('.questpage')), `a quest opens as its own page (G1) · ${target}`, '');
check(!!(await page.$('.writ h1')), `the writ is there · ${target}`);
await shot(page, `03-quest-${target}`);
bench = await page.$$eval('.qhand .qcard', els => els.length);
notes.push(`· ${target}: ${bench} free, ${(await page.$$('.slotwrap')).length} slot(s), ${(await page.$$('.qcard.held')).length} held`);
const emptySlots = await page.$$('.slot');
check(emptySlots.length > 0, `its slots start empty · ${target}`, `${emptySlots.length} empty`);

// ── 3 · CLICK-TO-PLACE (the drag must never be the only way — G2) ─────────────────────────
await page.waitForSelector('.slot', { timeout: 8000 });
await page.click('.slot');
await sleep(400);
const activeSlot = await page.$('.dropzone.active');
check(!!activeSlot, `clicking a slot arms it · ${target}`);
const fitsShown = await page.$$eval('.qhand .fit', els => els.length);
check(fitsShown > 0, `the hand shows a fit number once armed · ${target}`, `${fitsShown} badges`);
// and the best fit is first
const order = await page.$$eval('.qhand .fit', els => els.map(e => parseInt(e.textContent || '0', 10)));
check(order.every((v, i) => i === 0 || order[i - 1]! >= v), `the hand is sorted best-first · ${target}`, order.join(','));
await shot(page, `04-armed-${target}`);

await page.click('.qhand .qcard');
await sleep(900);
const filledNow = await page.$$('.slotwrap .qcard.picked');
check(filledNow.length > 0, `click-to-place fills the armed slot (G2) · ${target}`);
await shot(page, `05-placed-${target}`);

// ── 4 · DRAG ──────────────────────────────────────────────────────────────────────────────
const stillEmpty = await page.$('.slot');
if (stillEmpty && await page.$('.qhand .qcard')) {
  const filledBefore = (await page.$$('.slotwrap .qcard.picked')).length;
  await drag(page, '.qhand .qcard', '.dropzone:has(.slot)');
  const filledAfter = (await page.$$('.slotwrap .qcard.picked')).length;
  check(filledAfter > filledBefore, `drag-to-place fills a slot (G2) · ${target}`, `${filledBefore} → ${filledAfter}`);
  await shot(page, `06-dragged-${target}`);
} else {
  notes.push(`· ${target} has no second slot free — drag covered by the other quest`);
}

// ── 5 · READING A HELD CARD (G3) ──────────────────────────────────────────────────────────
const held = await page.$('.qcard.held');
if (held) {
  await held.click();
  await sleep(500);
  check(!!(await page.$('.reader')), `a held card opens its sheet (G3) · ${target}`);
  const movable = await page.$eval('.qcard.held', e => (e as HTMLElement).draggable);
  check(!movable, `a held card is NOT draggable (G3) · ${target}`);
  await shot(page, `07-reader-${target}`);
  await page.keyboard.press('Escape');
  await sleep(400);
  check(!(await page.$('.reader')), `Escape closes the sheet · ${target}`);
} else {
  notes.push(`· ${target} has no met cast — held cards covered by the saga`);
}

// ── 6 · TAKING SOMEONE BACK OFF ───────────────────────────────────────────────────────────
const pickedBefore = (await page.$$('.slotwrap .qcard.picked')).length;
if (pickedBefore) {
  await page.click('.slotwrap .qcard.picked');
  await sleep(900);
  const pickedAfter = (await page.$$('.slotwrap .qcard.picked')).length;
  check(pickedAfter < pickedBefore, `clicking a placed soldier frees them · ${target}`, `${pickedBefore} → ${pickedAfter}`);
}

}   // ← every check above runs once per target quest

// ── 7 · AUTO ON THE PAGE, THEN BACK ───────────────────────────────────────────────────────
await page.$$eval('.acts .act', els =>
  (els.find(e => e.textContent?.trim().toLowerCase().startsWith('auto')) as HTMLButtonElement)?.click());
await sleep(1000);
const ready = await page.$eval('.act.go', e => !(e as HTMLButtonElement).disabled).catch(() => false);
const slotCount = await page.$$eval('.slotwrap', els => els.length);
if (bench >= slotCount) check(ready, 'after Auto the quest is ready to send');
else notes.push(`· ${bench} free for ${slotCount} slots — Auto cannot finish it, and says so`);
await shot(page, '08-auto-on-page');

await page.waitForSelector('.back', { timeout: 8000 });
await page.click('.back');
await sleep(1200);
check(!!(await page.$('.board-list')), 'the back link returns to the board');
// the other way in: clicking a row
await page.waitForSelector('.qrow .open', { timeout: 8000 });
await page.click('.qrow .open');
await sleep(900);
check(!!(await page.$('.questpage')), 'clicking a row on the board opens that quest');
await page.click('.back'); await sleep(700);

// ── 8 · FILL EVERYTHING ───────────────────────────────────────────────────────────────────
await page.$$eval('.listhead .act', els => (els[0] as HTMLButtonElement)?.click());
await sleep(1400);
const unmanned = await page.$$eval('.rowstate', els => els.filter(e => /not manned/.test(e.textContent || '')).length);
notes.push(`· after Auto-fill every quest: ${unmanned} row(s) still unmanned (expected when the bench runs out)`);
await shot(page, '09-all-filled');

const otherHttp = errors.some(e => /^HTTP \d+ /.test(e) && !/favicon/.test(e));
const real = errors.filter(e => !/favicon|ERR_ABORTED/.test(e)
  && !(!otherHttp && /Failed to load resource.*404/.test(e)));
check(real.length === 0, 'no console errors or page exceptions', real.slice(0, 3).join(' | '));
} catch (e) {
  await page.screenshot({ path: `${SHOTS}/CRASH.png` });
  fs.writeFileSync(`${SHOTS}/CRASH.html`, await page.content());
  fails.push(`✗ CRASHED — ${(e as Error).message.split('\n')[0]} (see CRASH.png)`);
}

await browser.close();
console.log('\n──────── QUEST SCREEN · REAL BROWSER PLAYTEST ────────');
for (const n of notes) console.log('  ' + n);
if (fails.length) { console.log('\n  FAILURES:'); for (const f of fails) console.log('  ' + f) }
console.log(`\n  ${notes.filter(n => n.startsWith('✓')).length} passed · ${fails.length} failed`);
console.log(`  shots: ${SHOTS}`);
process.exit(fails.length ? 1 : 0);
