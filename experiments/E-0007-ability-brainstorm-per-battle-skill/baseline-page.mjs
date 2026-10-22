// Renders baseline.mjs as one self-contained HTML review page (the Artifact).
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const span = r => { const m = String(r).match(/(\d)(?:–(\d))?/); if (!m) return []; const a = +m[1], b = +(m[2] || m[1]); return Array.from({ length: b - a + 1 }, (_, i) => a + i); };

// which foe ranks a target reaches, and whether it hits all of them at once
function reach(t) {
  if (/ally|allies|self/.test(t)) return { foe: [], each: false, ally: !/^self$/.test(t) };
  if (/^all foes/.test(t)) return { foe: [1, 2, 3, 4], each: true };
  if (/^any foe|the last foe|^a foe|two foes/.test(t)) return { foe: [1, 2, 3, 4], each: /next to it|then the next|two foes/.test(t) };
  const list = t.match(/foe ([\d, and]+)$/);
  if (list && /and|,/.test(list[1])) return { foe: list[1].match(/\d/g).map(Number), each: true };
  return { foe: span(t.replace(/^.*foe /, '')), each: false };
}

function pips(a) {
  const from = span(a.from), r = reach(a.target), self = a.target === 'self';
  const ally = [4, 3, 2, 1].map(n => `<i class="p ${from.includes(n) ? 'on' : ''}${self && from.includes(n) ? ' self' : ''}"></i>`).join('');
  const foe = [1, 2, 3, 4].map(n => `<i class="p ${r.foe.includes(n) ? (r.each ? 'hit' : 'tgt') : ''}"></i>`).join('');
  const mid = r.ally ? '<b class="arr ally">↺</b>' : self ? '<b class="arr">·</b>' : '<b class="arr">→</b>';
  return `<span class="pips" aria-hidden="true"><span class="side">${ally}</span>${mid}<span class="side foe${r.each ? ' each' : ''}">${foe}</span></span>`;
}

const stars = n => '<span class="stars" title="' + n + '★ rarity">' + '★'.repeat(n) + '<span class="dim">' + '★'.repeat(5 - n) + '</span></span>';
const FLAG = { reviewed: 'reviewed', kept: 'earlier draft', new: 'new' };
const STATE = { reviewed: 'designer-reviewed, a few added', redone: 'redone to the new identity', new: 'new' };
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-');

function row(a) {
  const tag = a.flags.find(f => FLAG[f]);
  return `<tr data-from="${span(a.from).join('')}" data-text="${esc((a.name + ' ' + a.effect + ' ' + a.target + ' ' + a.cost).toLowerCase())}">
  <td class="st">${stars(a.star)}</td>
  <td class="nm"><span class="name">${esc(a.name)}</span>${a.flags.includes('default') ? '<span class="chip def">default attack</span>' : ''}</td>
  <td class="rk">${pips(a)}<span class="rtxt">${esc(a.from)} → ${esc(a.target)}</span></td>
  <td class="pw">${esc(a.power) || '<span class="dim">—</span>'}</td>
  <td class="ef">${esc(a.effect) || '<span class="dim">—</span>'}</td>
  <td class="cs ${/^0 cd/.test(a.cost) ? 'free' : /use/.test(a.cost) ? 'uses' : 'cd'}">${esc(a.cost)}</td>
  <td class="fl"><span class="flag ${tag}">${FLAG[tag] || ''}</span></td>
</tr>`;
}

function section(k) {
  return `<section class="skill" id="${slug(k.name)}">
<header>
  <h2>${esc(k.name)}</h2>
  <dl class="meta"><div><dt>ranks</dt><dd>${esc(k.ranks)}</dd></div><div><dt>attribute</dt><dd>${esc(k.attr)}</dd></div><div><dt>role</dt><dd>${esc(k.role)}</dd></div></dl>
  <span class="state ${k.state}">${STATE[k.state]}</span>
</header>
<p class="ident">${esc(k.id)}</p>
<p class="sw"><span><b>Strong</b> ${esc(k.strong)}</span>${k.weak ? `<span><b>Weak</b> ${esc(k.weak)}</span>` : ''}</p>
<div class="tbl"><table>
<thead><tr><th>rarity</th><th>ability</th><th>ranks: you → target</th><th>power</th><th>effect</th><th>cost</th><th></th></tr></thead>
<tbody>${k.abilities.map(row).join('')}</tbody></table></div>
</section>`;
}

const GROUPS = [
  ['Weapons', ['Two-handed', 'Polearm', 'Weapon and Shield', 'Dual Wield', 'Single Weapon', 'Unarmed', 'Shooting', 'Throwing']],
  ['Magic', ['Fire', 'Frost', 'Lightning', 'Holy', 'Dark']],
  ['Other battle skills', null],
];

export function render(skills, statuses, questions) {
  const n = skills.reduce((a, k) => a + k.abilities.length, 0);
  const named = new Set(GROUPS.flatMap(g => g[1] || []));
  const groups = GROUPS.map(([title, names]) => [title, skills.filter(k => names ? names.includes(k.name) : !named.has(k.name))]);
  const nav = groups.map(([t, ks]) => `<div class="ng"><p class="nt">${t}</p>${ks.map(k => `<a href="#${slug(k.name)}">${esc(k.name)}<span class="ct">${k.abilities.length}</span></a>`).join('')}</div>`).join('');
  const body = groups.map(([t, ks]) => `<h3 class="group">${t}</h3>` + ks.map(section).join('')).join('');
  return `<title>Baseline Abilities</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Layout: a war-table ledger. A sticky skill index on the left, one ruled table per skill; rank pips read like the battle line (your 4-3-2-1 facing their 1-2-3-4). */
:root{
  --bg:#f2f3ef; --panel:#fbfbf8; --ink:#1c2420; --muted:#5d6862; --rule:#d6dbd4;
  --accent:#255f73; --brass:#9a6d16; --foe:#9b3b2e; --ally:#2f6f4f; --chip:#e4e9e3;
  --display:"Barlow Condensed","Arial Narrow",sans-serif; --body:"IBM Plex Sans",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#141917; --panel:#1b211e; --ink:#e3e8e2; --muted:#9aa59e; --rule:#2e3732;
  --accent:#7cb9cf; --brass:#d9a845; --foe:#e07a68; --ally:#73c196; --chip:#26302b; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#141917; --panel:#1b211e; --ink:#e3e8e2; --muted:#9aa59e; --rule:#2e3732;
  --accent:#7cb9cf; --brass:#d9a845; --foe:#e07a68; --ally:#73c196; --chip:#26302b; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:15px/1.5 var(--body);margin:0}
.wrap{display:grid;grid-template-columns:200px minmax(0,1fr);gap:32px;max-width:1280px;margin:0 auto;padding-block:28px 80px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
nav{position:sticky;top:calc(env(safe-area-inset-top,0px) + 16px);align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13px}
.ng{display:flex;flex-direction:column;gap:1px;margin-bottom:14px}
.nt{font:600 12px var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 4px}
nav a{display:flex;justify-content:space-between;color:var(--ink);text-decoration:none;padding:2px 6px;border-radius:3px}
nav a:hover,nav a:focus-visible{background:var(--chip);outline:none}
.ct{color:var(--muted);font:12px var(--mono)}
main{min-width:0}
h1{font:700 44px/1 var(--display);letter-spacing:.01em;margin:0 0 6px;text-wrap:balance}
.lede{color:var(--muted);max-width:68ch;margin:0 0 20px}
.facts{display:flex;flex-wrap:wrap;gap:8px 22px;font:13px var(--mono);color:var(--muted);margin:0 0 24px;padding:0;list-style:none}
.facts b{color:var(--ink);font-weight:500}
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;margin-bottom:28px}
.box{background:var(--panel);border:1px solid var(--rule);border-radius:4px;padding:16px 18px}
.box h4{font:600 20px var(--display);margin:0 0 8px;letter-spacing:.02em}
.box ol,.box ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px}
.box li::marker{color:var(--muted)}
.box table{border-collapse:collapse;font-size:13.5px;width:100%}
.box td{padding:4px 8px 4px 0;vertical-align:top;border-top:1px solid var(--rule)}
.box td:first-child{font-weight:600;white-space:nowrap}
.box td:last-child{color:var(--muted)}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;font-size:13px;color:var(--muted);margin:0 0 10px}
.legend .pips{vertical-align:middle;margin-right:6px}
.tools{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.tools input{font:14px var(--body);color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:4px;padding:6px 10px;min-width:0;flex:1 1 220px;max-width:340px}
.tools input:focus-visible,.seg button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.seg{display:flex;align-items:center;gap:4px;font-size:13px;color:var(--muted)}
.seg button{font:500 13px var(--mono);color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:3px;padding:4px 9px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--bg)}
.shown{font:12px var(--mono);color:var(--muted);margin-left:auto}
h3.group{font:600 13px var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:40px 0 0;padding-bottom:6px;border-bottom:2px solid var(--accent)}
.skill{padding:26px 0 8px;border-bottom:1px solid var(--rule);scroll-margin-top:60px}
.skill header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px}
h2{font:700 30px/1.1 var(--display);margin:0;letter-spacing:.01em}
.meta{display:flex;flex-wrap:wrap;gap:4px 16px;margin:0;font-size:13px}
.meta div{display:flex;gap:5px}.meta dt{color:var(--muted)}.meta dd{margin:0;font-weight:500}
.state{font:500 12px var(--body);padding:2px 8px;border-radius:10px;background:var(--chip);color:var(--muted)}
.state.reviewed{color:var(--ally)}.state.redone{color:var(--brass)}
.ident{margin:8px 0 4px;max-width:75ch;font-size:15.5px}
.sw{display:flex;flex-wrap:wrap;gap:4px 22px;margin:0 0 12px;font-size:13.5px;color:var(--muted)}
.sw b{color:var(--ink);font-weight:600;margin-right:4px}
.tbl{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:860px;font-size:14px}
th{font:500 11.5px var(--body);letter-spacing:.07em;text-transform:uppercase;color:var(--muted);text-align:left;padding:6px 10px 6px 0;border-bottom:1px solid var(--rule)}
td{padding:8px 10px 8px 0;border-bottom:1px solid var(--rule);vertical-align:top}
tbody tr:last-child td{border-bottom:none}
tr[hidden]{display:none}
.st{white-space:nowrap;width:76px}
.stars{color:var(--brass);font-size:12px;letter-spacing:1px}.stars .dim{color:var(--rule)}
.nm{width:200px}.name{font-weight:600;display:block}
.chip{display:inline-block;font:500 11px var(--body);padding:1px 7px;border-radius:9px;margin-top:3px}
.chip.def{background:var(--chip);color:var(--accent)}
.rk{width:250px}.rtxt{display:block;font-size:12.5px;color:var(--muted);margin-top:3px}
.pw{font:500 13.5px var(--mono);font-variant-numeric:tabular-nums;width:120px}
.ef{min-width:200px}
.cs{font:13px var(--mono);white-space:nowrap;width:130px}.cs.free{color:var(--muted)}.cs.cd{color:var(--ink)}.cs.uses{color:var(--brass)}
.fl{width:90px;text-align:right}
.flag{font-size:11.5px;color:var(--muted);white-space:nowrap}.flag.new{color:var(--accent)}.flag.reviewed{color:var(--ally)}
.dim{color:var(--muted)}
.pips{display:inline-flex;align-items:center;gap:5px}
.side{display:inline-flex;gap:3px;padding:2px 3px;border-radius:2px}
.side.foe.each{background:color-mix(in srgb,var(--foe) 16%,transparent)}
.p{width:9px;height:9px;border-radius:1.5px;border:1.5px solid var(--rule);display:inline-block}
.p.on{background:var(--ally);border-color:var(--ally)}
.p.self{box-shadow:0 0 0 2px color-mix(in srgb,var(--ally) 35%,transparent)}
.p.tgt{border-color:var(--foe)}
.p.hit{background:var(--foe);border-color:var(--foe)}
.arr{font:600 12px var(--mono);color:var(--muted)}.arr.ally{color:var(--ally)}
@media (max-width:860px){
  .wrap{grid-template-columns:minmax(0,1fr);gap:12px}
  nav{position:static;max-height:none;display:flex;gap:6px 14px;overflow-x:auto;padding-bottom:6px;border-bottom:1px solid var(--rule)}
  .ng{flex-direction:row;flex-wrap:nowrap;gap:4px;margin:0;align-items:center}
  .nt{margin:0 4px 0 0;white-space:nowrap}
  nav a{white-space:nowrap;gap:6px}
  h1{font-size:36px}
}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>
<div class="wrap">
<nav aria-label="Skills">${nav}</nav>
<main>
<h1>Baseline abilities</h1>
<p class="lede">A first full set for all 29 battle skills, built from the key identities in E-0007. It is for a rough review: is each skill roughly in shape? Numbers are placeholders until balance. Power is a % of a standard hit, and heals and shields use the same scale. Names are generic, since the AI renames every ability. Debuffs flip coins to land; mods sit on top of all of this.</p>
<ul class="facts"><li><b>${skills.length}</b> skills</li><li><b>${n}</b> abilities</li><li><b>${skills.filter(k => k.state === 'reviewed').length}</b> reviewed skills, a few abilities added</li><li><b>${skills.filter(k => k.state === 'redone').length}</b> drafts redone</li><li><b>${skills.filter(k => k.state === 'new').length}</b> new</li></ul>
<div class="notes">
<div class="box"><h4>Questions for you</h4><ol>${questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol></div>
<div class="box"><h4>Statuses not on the effects list yet</h4><table>${statuses.map(([s, what, who]) => `<tr><td>${esc(s)}</td><td>${esc(what)}</td><td>${esc(who)}</td></tr>`).join('')}</table></div>
</div>
<p class="legend"><span>${pips({ from: '1–2', target: 'foe 1–2' })}one foe at rank 1–2, used from your rank 1–2</span><span>${pips({ from: '1', target: 'foe 1, 2 and 3' })}hits all three</span><span>${pips({ from: '3–4', target: 'any ally' })}targets an ally</span><span>Your ranks run 4-3-2-1, facing the foe's 1-2-3-4.</span></p>
<div class="tools">
  <input id="q" type="search" placeholder="Search abilities, e.g. Stun, Bleed, shield" aria-label="Search abilities">
  <div class="seg" role="group" aria-label="Usable from rank">from rank ${['any', 1, 2, 3, 4].map(r => `<button type="button" data-r="${r}" aria-pressed="${r === 'any'}">${r}</button>`).join('')}</div>
  <span class="shown" id="shown"></span>
</div>
${body}
</main>
</div>
<script>
(() => {
  const q = document.getElementById('q'), shown = document.getElementById('shown'), btns = [...document.querySelectorAll('.seg button')];
  const rows = [...document.querySelectorAll('tbody tr')], skills = [...document.querySelectorAll('.skill')];
  let rank = 'any';
  function apply() {
    const t = q.value.trim().toLowerCase(); let n = 0;
    rows.forEach(r => { const ok = (!t || r.dataset.text.includes(t)) && (rank === 'any' || r.dataset.from.includes(rank)); r.hidden = !ok; if (ok) n++; });
    skills.forEach(s => { s.hidden = !s.querySelector('tbody tr:not([hidden])'); });
    shown.textContent = n + ' of ' + rows.length + ' abilities';
  }
  q.addEventListener('input', apply);
  btns.forEach(b => b.addEventListener('click', () => { rank = b.dataset.r; btns.forEach(x => x.setAttribute('aria-pressed', x === b)); apply(); }));
  apply();
})();
</script>
`;
}
