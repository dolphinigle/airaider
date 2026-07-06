// FAVORED/CLASHING END-TO-END PROOF — real AI. Proves every link of the chain:
//   (a) the AI writes non-empty favored/clashing arrays (raw call output shown)
//   (b) the stored words are canonical engine vocabulary (CONCEPT / group ids)
//   (c) a favored tag measurably raises coins/odds and a clashing tag lowers them,
//       measured through the REAL game path (assign → questOdds → unassign)
//   (d) the actual server (/api/state) serializes test.favored/clashing + per-merc
//       coins so the web UI can render them (verified against a live server process)
// Usage: set -a; source /home/irvan/airaider/.env; set +a; npx tsx scripts/surfacecheck.ts [seed]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { Game } from '../src/game/game.js';
import { makeOpenAiProvider } from '../src/ai/openai.js';
import { CONCEPT, GROUPS, renderTags, T, type TagInstance } from '../src/engine/tags.js';
import { coins, explainCoins, slotThreshold, odds, U } from '../src/engine/roll.js';
import { hasFavored, hasClash } from '../src/engine/overlap.js';

const seed = Number(process.argv[2] ?? 77001);
const g = new Game(makeOpenAiProvider(), seed);
const P = (s = '') => console.log(s);

function pct(x: number | null): string { return x === null ? '—' : `${(x * 100).toFixed(1)}%` }

async function main() {
  P(`══════ PART 1 · FAVORED/CLASHING END-TO-END (seed ${seed}, REAL AI) ══════`);

  // -- opening board ------------------------------------------------------------
  const b = g.build('map-room');
  P(`build map-room → ${b.msg} (gold now ${g.gold()})`);
  const leads = g.visibleLeads();
  P(`starter leads: ${leads.map(l => `${l.archetype}(L${l.level} ${l.rarity}${l.chainInfo.kind === 'starts-new' ? ' ✦story' : ''})`).join(', ')}`);

  // pursue 4 one-off leads of different archetypes (skip the story hook — genesis is
  // multi-call; one-offs isolate the writeQuest→slots link cleanly)
  const picks: string[] = [];
  for (const arch of ['contract', 'raid', 'rescue', 'investigate', 'hunt']) {
    const l = leads.find(x => x.archetype === arch && x.chainInfo.kind === 'none' && !picks.includes(x.id));
    if (l) picks.push(l.id);
    if (picks.length >= 4) break;
  }
  for (const id of picks) {
    const r = await g.pursue(id);
    P(`pursue → ${r.msg}`);
  }

  // -- (a) what the AI actually wrote (raw call output) ---------------------------
  P(`\n──── LINK (a): raw AI writeQuest outputs — the ask[] favored/clashing as WRITTEN ────`);
  for (const rec of g.ai.callLog().filter(r => r.purpose.includes('quest') || r.purpose.includes('write'))) {
    P(`\n[AI call #${rec.n} · ${rec.purpose} · ${rec.model} · ok=${rec.ok}]`);
    try {
      const j = JSON.parse(rec.output ?? '');
      P(`  title: ${j.title}`);
      for (const [i, a] of (j.ask ?? []).entries())
        P(`  ask[${i}]: attribute=${JSON.stringify(a.attribute)}${a.extraAttribute ? ` extra=${JSON.stringify(a.extraAttribute)}` : ''} favored=${JSON.stringify(a.favored)} clashing=${JSON.stringify(a.clashing)}${a.requiredTag ? ` requiredTag=${JSON.stringify(a.requiredTag)}` : ''}`);
    } catch { P(`  (unparseable output: ${(rec.output ?? '').slice(0, 200)})`) }
  }

  // -- (b) stored slots + vocabulary check ---------------------------------------
  P(`\n──── LINK (b): slots AS STORED in game state + canonical-vocabulary check ────`);
  const vocabOk = (w: string) => !!CONCEPT[w] || !!GROUPS[w];
  let totalWords = 0, badWords: string[] = [], emptyFavoredSlots = 0, totalSlots = 0;
  for (const q of g.state.quests) {
    P(`\n■ [${q.rarity} ${q.archetype} L${q.level}] ${q.title}`);
    P(`  situation: ${q.situation}`);
    P(`  JOB: ${q.job}`);
    q.slots.forEach((s, i) => {
      totalSlots++;
      const t = s.test;
      if (!t.favored.length) emptyFavoredSlots++;
      const words = [...t.favored, ...t.clashing];
      totalWords += words.length;
      const bad = words.filter(w => !vocabOk(w));
      badWords.push(...bad);
      P(`  slot ${i}: attrs=${JSON.stringify(t.attributes)} difficulty=${t.difficulty} bar=${slotThreshold(t).toFixed(1)}`);
      P(`          favored=${JSON.stringify(t.favored)} clashing=${JSON.stringify(t.clashing)} requirement=${JSON.stringify(s.requirement)}`);
      P(`          vocab: ${words.map(w => `${w}:${vocabOk(w) ? 'OK(' + (CONCEPT[w] ? 'concept/' + CONCEPT[w]!.group : 'group') + ')' : 'UNKNOWN'}`).join(' ')}`);
    });
  }
  P(`\n  VOCAB SUMMARY: ${totalWords} favored/clashing words across ${totalSlots} slots · unknown: ${badWords.length ? badWords.join(', ') : 'NONE'} · slots with empty favored: ${emptyFavoredSlots}/${totalSlots}`);

  // -- roster + per-slot coins for every merc -------------------------------------
  P(`\n──── roster vs every slot (the same coins()/explainCoins() the server sends the web UI) ────`);
  for (const m of g.roster()) {
    P(`\n● ${m.name} L${m.character!.level} attrs=${JSON.stringify(m.character!.attrs)}`);
    P(`  tags: ${renderTags(m.tags)}   [raw: ${m.tags.map(t => t.concept + (t.tier ? ':' + t.tier : '')).join(', ')}]`);
    for (const q of g.state.quests) q.slots.forEach((s, i) => {
      const fav = hasFavored(m.tags, s.test.favored), cl = hasClash(m.tags, s.test.favored, s.test.clashing);
      P(`  vs "${q.title}" slot ${i}: ${explainCoins(m, s.test)}  (hasFavored=${fav} hasClash=${cl})`);
    });
  }

  // -- (c) measurable effect through the REAL game path ---------------------------
  P(`\n──── LINK (c): assign → questOdds() through the Game facade — favored vs neutral vs clashing ────`);
  // pick the quest+slot with a non-empty favored list and a 1-slot view for clean math
  const q = g.state.quests.find(x => x.slots.some(s => s.test.favored.length > 0))!;
  const si = q.slots.findIndex(s => s.test.favored.length > 0);
  const slot = q.slots[si]!;
  const merc = g.roster()[0]!;
  const u = U(merc.character!.level);
  P(`quest "${q.title}" slot ${si}: favored=${JSON.stringify(slot.test.favored)} clashing=${JSON.stringify(slot.test.clashing)} (0.5·U at L${merc.character!.level} = ±${(0.5 * u).toFixed(1)} coins)`);
  P(`guinea pig: ${merc.name} — base tags [${merc.tags.map(t => t.concept).join(', ')}]`);

  const fav = slot.test.favored.find(w => CONCEPT[w]) ?? slot.test.favored[0]!;
  const clashWord = slot.test.clashing.find(w => CONCEPT[w]) ?? CONCEPT[fav]?.opposite;

  function measure(label: string, mutate: (tags: TagInstance[]) => TagInstance[]): void {
    const saved = merc.tags;
    merc.tags = mutate([...saved.map(t => ({ ...t }))]);
    const a = g.assign(q.id, si, merc.id);
    const o = g.questOdds(q.id);
    // isolate THIS slot (questOdds pools all slots; others are empty so coins = this slot's)
    const sc = coins(merc, slot.test);
    const so = odds(sc, slotThreshold(slot.test));
    P(`  ${label.padEnd(46)} assign=${a.ok} → slot coins=${sc} vs bar ${slotThreshold(slot.test).toFixed(1)} · P(success)=${pct(so.success)} P(partial+)=${pct(so.partialOrBetter)} · questOdds total: ${o.coins}c/${o.bar.toFixed(1)}bar`);
    g.unassign(q.id, si);
    merc.tags = saved;
  }

  measure(`NEUTRAL (favored+clashing tags stripped)`, tags =>
    tags.filter(t => !hasFavored([t], slot.test.favored) && !hasClash([t], slot.test.favored, slot.test.clashing)));
  measure(`FAVORED (+ ${fav} tag, tier 1 — dice are tier-blind)`, tags => {
    const base = tags.filter(t => !hasFavored([t], slot.test.favored) && !hasClash([t], slot.test.favored, slot.test.clashing));
    base.push(T(fav, 1)); return base;
  });
  if (clashWord) measure(`CLASHING (+ ${clashWord} tag)`, tags => {
    const base = tags.filter(t => !hasFavored([t], slot.test.favored) && !hasClash([t], slot.test.favored, slot.test.clashing));
    base.push(T(clashWord!, 1)); return base;
  });
  else P(`  (no clashing word resolvable for this slot — skipped)`);

  // also: the two REAL mercs as-is, head to head on this slot
  P(`  — real roster head-to-head on this slot —`);
  for (const m of g.roster()) {
    const sc = coins(m, slot.test); const so = odds(sc, slotThreshold(slot.test));
    P(`  ${m.name.padEnd(24)} [${m.tags.map(t => t.concept).join(',')}] → ${sc} coins · P(success)=${pct(so.success)} · ${explainCoins(m, slot.test)}`);
  }

  // -- (d) live server serialization ----------------------------------------------
  P(`\n──── LINK (d): the LIVE server /api/state — does the web UI receive favored/clashing? ────`);
  const tmp = '/tmp/surfacecheck-srv';
  fs.mkdirSync(path.join(tmp, 'saves'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'saves', 'web.json'), g.save());
  const srv = spawn('/home/irvan/airaider/v3/node_modules/.bin/tsx', ['/home/irvan/airaider/v3/server/main.ts'], {
    cwd: tmp, env: { ...process.env, PORT: '3277', AIRAIDER_AI: '' }, stdio: 'pipe',
  });
  try {
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      await new Promise(r => setTimeout(r, 500));
      try { await fetch('http://127.0.0.1:3277/api/state'); up = true } catch { /* retry */ }
    }
    if (!up) { P('  SERVER NEVER CAME UP — link (d) unproven'); }
    else {
      const st = await (await fetch('http://127.0.0.1:3277/api/state')).json() as {
        quests: { title: string; slots: { test: { favored: string[]; clashing: string[]; attributes: string[]; bar: number; difficulty: string }; requirement: string | null; fits: { name: string; coins: number; explain: string }[] }[]; odds: unknown }[];
      };
      P(`  server sees ${st.quests.length} open quests. Verbatim slot payloads:`);
      for (const sq of st.quests) for (const [i, sl] of sq.slots.entries()) {
        P(`  "${sq.title}" slot ${i}: test=${JSON.stringify({ attributes: sl.test.attributes, favored: sl.test.favored, clashing: sl.test.clashing, difficulty: sl.test.difficulty, bar: Number(sl.test.bar.toFixed(1)) })} req=${JSON.stringify(sl.requirement)}`);
        P(`      fits(dropdown): ${sl.fits.map(f => `${f.name} (${f.coins}c · ${f.explain})`).join(' | ')}`);
      }
      const withFav = st.quests.flatMap(x => x.slots).filter(sl => sl.test.favored?.length).length;
      const all = st.quests.flatMap(x => x.slots).length;
      P(`  → ${withFav}/${all} served slots carry non-empty favored[]; web App.tsx renders "favors <i>{...}</i>" from exactly this field (web/App.tsx:228-229)`);
    }
  } finally { srv.kill() }

  const uu = g.ai.usage();
  P(`\n════ AI: ${uu.calls} calls · $${uu.costUsd.toFixed(3)} ════`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) });
