// Screenshot every GUI screen at 1440×900 (and a few interactions) so the layout is JUDGED from
// pixels, not assumed (docs/DOGFOODING.md). Usage: npx tsx scripts/_uishots.ts <outDir> [baseUrl]
import puppeteer from 'puppeteer-core';
import * as fs from 'node:fs';
const out = process.argv[2] ?? '/tmp/uishots';
const base = process.argv[3] ?? 'http://localhost:5375';
fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'], defaultViewport: { width: Number(process.env.W ?? 1440), height: Number(process.env.H ?? 900) } });
const p = await b.newPage();
const errs: string[] = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
p.on('pageerror', e => errs.push(String(e)));
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
async function shot(name: string, url: string, act?: () => Promise<void>) {
  await p.goto(base + url, { waitUntil: 'networkidle2' });
  await wait(700);
  if (act) { await act(); await wait(500) }
  await p.screenshot({ path: `${out}/${name}.png` });
  const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(name, over ? 'H-OVERFLOW' : 'ok');
}
const st = await (await fetch(base + '/api/state')).json() as any;
const q = (st.quests.find((x: any) => !x.approaches) ?? st.quests[0])?.id, merc = st.roster[0]?.id;
await shot('01-map', '/');
await shot('02-map-hover', '/', async () => { const el = await p.$('.mk:not(.home) .ros'); await el?.hover() });
await shot('03-leads', '/', async () => { const t = await p.$$('.boardtabs button'); await t[1]?.click() });
if (q) {
  await shot('04-quest', `/?quest=${q}`);
  await shot('05-quest-armed', `/?quest=${q}`, async () => { await (await p.$('.arch .empty'))?.click() });
  await shot('06-quest-placed', `/?quest=${q}`, async () => { await (await p.$('.arch .empty'))?.click(); await wait(200); await (await p.$('.hand .card'))?.click(); await wait(600) });
}
const finale = st.quests.find((x: any) => x.approaches)?.id;
if (finale) await shot('07-finale', `/?quest=${finale}`);
await shot('08-fort', '/?screen=fort');
await shot('09-fort-room', '/?screen=fort', async () => { const cells = await p.$$('.cell:not(.free):not(.dig)'); await cells[cells.length > 5 ? 5 : 0]?.click() });
await shot('10-chronicle', '/?screen=chronicle');
await shot('11-drawer', '/?drawer=1');
if (merc) await shot('12-sheet', `/?card=${merc}`);
await shot('13-relics', '/', async () => { const bags = await p.$$('.bag'); await bags[2]?.click() });
console.log('errors:', errs.length ? errs.slice(0, 8).join('\n') : 'none');
await b.close();
