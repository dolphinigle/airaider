// Screenshot every GUI screen (and the main interactions) so the layout is JUDGED from pixels, not
// assumed (docs/DOGFOODING.md). Viewport from W/H (default 1440×900). The LAST shots press END, so
// point it at a scratch save. Usage: W=1280 H=800 npx tsx scripts/_uishots.ts <outDir> [baseUrl]
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
  const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(name, over ? 'H-OVERFLOW' : 'ok');
}
const st = await (await fetch(base + '/api/state')).json() as any;
const q = (st.quests.find((x: any) => !x.approaches && x.slots.length > 1) ?? st.quests.find((x: any) => !x.approaches) ?? st.quests[0])?.id, merc = st.roster[0]?.id;
const roomOf = (type: string) => st.fort.rooms.find((r: any) => r.type === type)?.id;
const room = (id: string | undefined) => async () => { if (id) await (await p.$(`.cell[data-room="${id}"]`))?.click() };
await shot('01-map', '/');
await shot('02-map-hover', '/', async () => { const el = await p.$('.mk:not(.home) .ros'); await el?.hover() });
await shot('03-leads', '/', async () => { const t = await p.$$('.boardtabs button'); await t[1]?.click() });
await shot('03b-steps-more', '/', async () => { await (await p.$('.nextsteps .more'))?.click() });
if (q) {
  await shot('04-quest', `/?quest=${q}`);
  await shot('05-quest-armed', `/?quest=${q}`, async () => { await (await p.$('.arch .empty'))?.click() });
  await shot('06-quest-placed', `/?quest=${q}`, async () => { await (await p.$('.arch .empty'))?.click(); await wait(200); await (await p.$('.hand .card.soldier:not(.blocked):not(.here)'))?.click(); await wait(600) });
}
const finale = st.quests.find((x: any) => x.approaches)?.id;
if (finale) await shot('07-finale', `/?quest=${finale}`);
await shot('08-fort', '/?screen=fort');
await shot('09-fort-rack', '/?screen=fort', room(st.fort.rooms.find((r: any) => r.kind === 'rack')?.id));
await shot('09b-fort-show', '/?screen=fort', room(st.fort.rooms.find((r: any) => r.kind === 'prestige' && r.slots.length)?.id));
await shot('09c-fort-dungeon', '/?screen=fort', room(roomOf('dungeon')));
await shot('09d-fort-holding', '/?screen=fort', room(roomOf('holding-cell')));
await shot('09e-fort-gh', '/?screen=fort', room(roomOf('great-hall')));
await shot('09f-fort-bare', '/?screen=fort', room(st.fort.rooms.find((r: any) => r.kind && !r.slots.length)?.id));
await shot('08b-fort-build-scrolled', '/?screen=fort', async () => {
  const el = await p.$('.panel .pbody'); const bx = await el?.boundingBox();
  if (bx) { await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height - 40); await p.mouse.wheel({ deltaY: 400 }) }
});
await shot('10-chronicle', '/?screen=chronicle');
// the hand folded to a strip (then unfolded again, so the later shots see the whole hand)
await shot('10b-chronicle-hand-folded', '/?screen=chronicle', async () => { await (await p.$('.hand .fold'))?.click() });
await (await p.$('.hand .fold'))?.click(); await wait(300);
await shot('11-drawer', '/?drawer=1');
if (merc) await shot('12-sheet', `/?card=${merc}`);
const cap = st.captives.find((c: any) => c.state === 'breaking') ?? st.captives[0];
if (cap) await shot('12b-sheet-captive', `/?screen=fort&card=${cap.id}`);
const rel = st.relics.find((c: any) => c.location?.kind !== 'room') ?? st.relics[0];
if (rel) await shot('12c-sheet-relic', `/?screen=fort&card=${rel.id}`);
await shot('13-relics', '/', async () => { const bags = await p.$$('.bag'); await bags[2]?.click() });
await shot('14-seal-armed', '/', async () => { await (await p.$('button.seal'))?.click() });
// LAST: END (twice when warned) → the reckoning, then back at the table
await shot('15-reckoning', '/', async () => {
  await (await p.$('button.seal'))?.click(); await wait(300);
  if (await p.$('button.seal.is-armed')) await (await p.$('button.seal'))?.click();
  for (let i = 0; i < 100 && await p.$eval('.proceed', e => (e as HTMLButtonElement).disabled).catch(() => true); i++) await wait(200);
  await wait(1500);
});
await p.keyboard.press('Enter'); await wait(800);
await p.screenshot({ path: `${out}/16-after-end.png` });
console.log('errors:', errs.length ? errs.slice(0, 8).join('\n') : 'none');
await b.close();
