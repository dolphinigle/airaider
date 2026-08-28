// Screenshot a GUI screen and report how each quest preview actually LAID OUT (chars, rendered
// height, horizontal overflow). The point is that a preview length is a rendering question, not
// a number question — docs/DOGFOODING.md forbids judging a UI you did not render.
// Usage: npx tsx scripts/_shot.ts <out.png> [url]
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'], defaultViewport: { width: 1500, height: 1100 } });
const p = await b.newPage();
await p.goto(`${process.argv[3] ?? 'http://localhost:5274/?tab=quests'}`, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: process.argv[2] });
const rows = await p.$$eval('.qrow .sit', els => els.map(e => ({ len: e.textContent.length, h: e.clientHeight, t: e.textContent })));
console.log(rows.map(r => `${String(r.len).padStart(3)}ch ${String(r.h).padStart(3)}px  ${r.t.slice(0,90)}`).join('\n'));
const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('horizontal overflow:', over);
await b.close();
