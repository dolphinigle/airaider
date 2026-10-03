// THE MAP — home. Quests are markers on a woven map (hover = the gist, click = open it); a soldier
// dragged over it shows their fit on every quest and drops into their best place (Game.sendTo).
// The board on the right lists the same quests, plus the leads (designer: leads stay a separate
// list, not map markers). Every verdict shown here is the engine's (q.odds.band, fits[].strength,
// leads[].blocked/onBoard); this file only lays them out.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type S, Glyph, glyphOf, activeSlots, gateOf, cap1, clip, shortTitle, questKind } from './ui';
import { BAND_WORD, bandCls, strengthCls, coinBadge, STRENGTH_MARK, type Band } from './band';

// x, y, w, h in % of the map. The forests start right of the home marker (the forest wash is
// drawn wider); a zone is where a region's quests sit and where its veil/label goes.
const ZONES: Record<string, [number, number, number, number]> = {
  forests: [12, 7, 38, 86], city: [54, 6, 24, 40], highlands: [81, 6, 16, 44], coast: [62, 54, 35, 40], underdeep: [51, 58, 10, 36],
};
const HOME: [number, number] = [6, 50];
const hash = (t: string) => [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// ── the chip + tokens: what a marker (and a board row) says at a glance ──────────────────────
type Tone = 'green' | 'amber' | 'orange' | 'red' | 'teal' | 'dark' | 'dim';
// a pooled band → the chip colour (R6). The band itself is the engine's (q.odds.band).
const BAND_TONE: Record<string, Tone> = { good: 'green', even: 'amber', part: 'orange', bad: 'red' };
const bandTone = (b: Band | null | undefined): Tone => BAND_TONE[bandCls(b)] ?? 'dark';
const finaleOpen = (q: any) => !!q.approaches && !q.chosenApproach;
// every place of the chosen approach filled — the engine's own verdict (Game.isReady)
const manned = (q: any): boolean => !!q.ready;
const lapseIn = (s: S, q: any) => Math.max(0, q.lapsesAtCycle - s.cycle);

/** the marker chip: [text, tone, shows the clock]. Red only for a REAL loss (the engine's
 *  lapseUrgent); a standing post renews every cycle, so it is a neutral '↻ daily'. */
function chipOf(s: S, q: any): [string, Tone, boolean] {
  if (finaleOpen(q)) return ['choose an ending', 'amber', false];
  if (manned(q)) { const b = q.odds?.band as Band | null; return [b ? `ready · ${BAND_WORD[b]}` : 'ready', bandTone(b), false] }
  if (q.faucet) return ['↻ daily', 'teal', false];
  const left = lapseIn(s, q);
  return [`${left}`, q.lapseUrgent ? 'red' : 'dark', true];
}
/** the board row's status words (same verdicts as the chip, longer words) */
function statusOf(s: S, q: any): [string, Tone | ''] {
  if (finaleOpen(q)) return ['finale · pick how it ends', 'amber'];
  if (manned(q)) { const b = q.odds?.band as Band | null; return [b ? `ready · ${BAND_WORD[b]}` : 'ready', bandTone(b)] }
  if (q.faucet) return ['renews each cycle', 'dim'];
  const left = lapseIn(s, q);
  return [q.lapseStalled ? `set aside in ${left} — half-manned` : `lapses in ${left}`, q.lapseUrgent ? 'red' : ''];
}
const STRENGTH_TONE: Record<string, Tone> = { good: 'green', part: 'amber', bad: 'red' };

const REWARD: Record<string, [string, string]> = {   // kind → [glyph, words]
  captive: ['chain', 'a captive'], recruit: ['person', 'a recruit'], relic: ['chest', 'a relic'], lead: ['scroll', 'a lead'], gold: ['', 'gold'],
};
function RewardIcon({ k }: { k: string }) {
  if (k === 'gold') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /></svg>;
  return <Glyph name={REWARD[k]?.[0] ?? 'scroll'} size={12} />;
}
const Clock = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/** the token row: [chip] one attribute token per place (solid + strength-coloured once filled)
 *  then what the quest brings (engine rewardKinds). Used under a marker banner and in a board row. */
function Toks({ s, q, chip = true, pops }: { s: S; q: any; chip?: boolean; pops: Set<string> }) {
  const [text, tone, clock] = chipOf(s, q);
  const act = activeSlots(q);
  const kinds: string[] = q.rewardKinds ?? [];
  return (
    <span className="toks">
      {chip && <span className={'chip ' + tone}>{clock && <Clock />}{text}</span>}
      {finaleOpen(q)
        ? <span className="tok">{q.approaches.length} endings</span>
        : act.map((x: any) => {
          const st = x.filledBy ? STRENGTH_TONE[strengthCls(x.filledStrength)] ?? 'dark' : '';
          // a filled token says its strength by SHAPE as well as colour (▲ strong · ● fair · ▼ weak)
          return <span key={x.idx} className={'tok' + (x.filledBy ? ' on st-' + st : '') + (pops.has(`${q.id}:${x.idx}`) ? ' pop' : '')}
            title={x.filledBy ? `${x.attr} — ${x.filledBy} (${x.filledStrength})` : `${x.attr} — open`}>{x.attr}{x.filledBy && STRENGTH_MARK[x.filledStrength as 'strong'] ? ` ${STRENGTH_MARK[x.filledStrength as 'strong']}` : ''}</span>;
        })}
      {kinds.length > 0 && <span className="rws">{kinds.map(k => {
        // the icon the engine's warning is ABOUT lights up ('brings a recruit · no Tavern' → the recruit)
        const warned = !!q.rewardWarn && String(q.rewardWarn).startsWith(`brings a ${k}`);
        return <span key={k} className={'rw' + (warned ? ' warn' : '')}
          title={warned ? q.rewardWarn : `brings ${REWARD[k]?.[1] ?? k}`}><RewardIcon k={k} /></span>;
      })}</span>}
    </span>
  );
}

// ── layout: rows from the zone's PIXEL height, no marker over another, a label or a plaque ──
type Box = [number, number, number, number];   // x0 y0 x1 y1 (px)
// a marker is two rects: the coin (±21) and its text (banner −13 · token row to +34)
const ROW = 56, ROW_DENSE = 48, LABEL = 34, EDGE = 20;   // EDGE: inside the map's brass frame
// a banner holds the whole title where the map has the room (a wide map), else it is capped (the tip has it)
let BAN_MAX = 190;
const banMaxFor = (W: number) => W >= 1000 ? 270 : W >= 800 ? 220 : 190;
const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const banW = (q: any) => Math.min(BAN_MAX, 30 + q.title.length * 7.3);
function tokW(s: S, q: any) {
  const [text, , clock] = chipOf(s, q);
  let w = 14 + text.length * 6.7 + (clock ? 15 : 0);
  if (finaleOpen(q)) w += 90;
  else for (const x of activeSlots(q)) w += 16 + x.attr.length * 6.5 + (x.filledBy ? 13 : 0);   // a filled token's ▲●▼
  return w + (q.rewardKinds?.length ?? 0) * 17 + 8;
}
const rectsAt = (cx: number, cy: number, wide: number, left: boolean): Box[] =>
  [[cx - 22, cy - 22, cx + 22, cy + 22], left ? [cx - 25 - wide, cy - 14, cx - 23, cy + 35] : [cx + 23, cy - 14, cx + 25 + wide, cy + 35]];
type Spot = { x: number; y: number; left: boolean; wide: number };

/** Where each quest sits (px). One quest per row of its region, rows from the zone's height
 *  (denser rows once a region holds more quests than fit), x jittered by id. Every spot is checked
 *  against the home marker, region labels, plaques and the quests already placed; one that finds
 *  no clean row takes the nearest clean spot. Deterministic: a quest keeps its spot while the set
 *  holds. */
function place(s: S, quests: any[], W: number, H: number, obstacles: Box[]): Record<string, Spot> {
  const at: Record<string, Spot> = {};
  const placed: Box[] = [...obstacles];
  const byRegion: Record<string, any[]> = {};
  for (const q of quests) (byRegion[q.regionId] ??= []).push(q);
  // the busiest region picks first (most markers keep their natural rows), then the wider zone;
  // a narrow region beside a busy one takes the nearest clean spot
  const zoneW = (r: string) => (ZONES[r] ?? ZONES.forests!)[2];
  const order = Object.keys(byRegion).sort((a, b) => byRegion[b]!.length - byRegion[a]!.length || zoneW(b) - zoneW(a) || a.localeCompare(b));
  for (const region of order) {
    const qs = byRegion[region]!.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const [zx, zy, zw, zh] = (ZONES[region] ?? ZONES.forests!).map((v, i) => v / 100 * (i % 2 ? H : W)) as [number, number, number, number];
    const top = zy + LABEL, usable = Math.max(ROW, zh - LABEL - 8);
    // spread the region's quests evenly over the rows that fit (at least 4 rows, so one quest
    // does not float mid-zone); denser rows once they do not fit. Markers glide (css) on a reshuffle.
    const fit = Math.max(1, Math.floor(usable / ROW)), n = qs.length, dense = n > fit;
    const rows = dense ? Math.max(1, Math.floor(usable / ROW_DENSE)) : Math.max(n, Math.min(4, fit));
    const pitch = usable / rows;
    const taken = new Set<string>();
    for (const [k, q] of qs.entries()) {
      const wide = Math.max(banW(q), tokW(s, q));
      const r0 = Math.min(rows - 1, Math.floor((k + 0.5) * rows / n));
      const jitter = dense ? 0 : (hash(q.id + 'x') % 100) / 100;
      const slack = Math.max(0, zw - 60 - 250);   // from the zone only, so a quest does not shift as its chip changes
      const leftOf = (x: number) => x + 27 + wide > W - 18;
      const clean = (x: number, y: number, left: boolean) => {
        const rs = rectsAt(x, y, wide, left);
        const inMap = rs.every(b => b[0] >= EDGE && b[2] <= W - EDGE && b[1] >= EDGE && b[3] <= H - EDGE);
        return inMap && !rs.some(b => placed.some(p => hit(p, b))) ? rs : null;
      };
      let got: { x: number; y: number; rs: Box[]; left: boolean; key: string } | null = null;
      for (let k = 0; k < rows && !got; k++) {
        const r = (r0 + k) % rows, key = `row:${r}`;
        if (taken.has(key)) continue;
        const y = top + pitch * (r + 0.5);
        for (const x of [zx + 30 + jitter * slack, zx + 30]) {
          const left = leftOf(x), rs = clean(x, y, left);
          if (rs) { got = { x, y, rs, left, key }; break }
        }
      }
      if (!got) {
        // the region's own rows are full (a narrow zone beside a busy one): the nearest clean spot
        // anywhere, either banner side — a marker a little off its zone beats one on top of another.
        // A map too full for that (many regions at a small window) takes the least-covered spot.
        const [ox, oy] = [zx + Math.min(zw / 2, 60), zy + zh / 2];
        // covering a label or plaque costs less than covering another quest
        const cover = (rs: Box[]) => rs.reduce((n, b) => n + placed.reduce((m, p, i) => m + (hit(p, b)
          ? (Math.min(p[2], b[2]) - Math.max(p[0], b[0])) * (Math.min(p[3], b[3]) - Math.max(p[1], b[1])) * (i < obstacles.length ? 1 : 4) : 0), 0), 0);
        let least: { x: number; y: number; rs: Box[]; left: boolean; key: string; score: number } | null = null;
        for (let x = 40; x < W - 30; x += 20) for (let y = 36; y < H - 36; y += 14) for (const left of [false, true]) {
          const rs = rectsAt(x, y, wide, left);
          if (!rs.every(b => b[0] >= EDGE && b[2] <= W - EDGE && b[1] >= EDGE && b[3] <= H - EDGE)) continue;
          const score = cover(rs) * 4 + Math.sqrt((x - ox) ** 2 + ((y - oy) * 1.4) ** 2);
          if (!least || score < least.score) least = { x, y, rs, left, key: `far:${x}:${y}`, score };
        }
        if (least) got = least;
      }
      if (!got) {   // (a map smaller than one marker)
        const x = zx + 30, y = top + pitch * (r0 + 0.5), left = leftOf(x);
        got = { x, y, left, rs: rectsAt(x, y, wide, left), key: `row:${r0}` };
      }
      taken.add(got.key); placed.push(...got.rs);
      at[q.id] = { x: got.x, y: got.y, left: got.left, wide };
    }
  }
  return at;
}
const TREES: [number, number][] = [[6, 18], [14, 12], [30, 10], [40, 44], [46, 30], [8, 80], [20, 74], [36, 62], [44, 84], [26, 50], [16, 28], [42, 18]];

export const leadLabel = (l: any) => l.title ?? (l.archetype === 'lead-hunt' ? 'Word in the taverns' : l.archetype === 'hire' ? 'Someone worth hiring' : cap1(l.archetype.replace(/-/g, ' ')));

// ── arrivals: what this viewer has not seen yet (per browser; a convenience, never game state) ──
const SEEN_KEY = 'airaider.map.seen.v1';
let SEEN: { q: Set<string>; l: Set<string> } | null = null;   // survives remounts even without storage
function seenStore(s: S) {
  if (SEEN) return SEEN;
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) { const o = JSON.parse(raw); SEEN = { q: new Set(o.q ?? []), l: new Set(o.l ?? []) } }
  } catch { /* private window / blocked storage: fall through */ }
  // first visit: what is already on the table is not news
  if (!SEEN) { SEEN = { q: new Set(s.quests.map((q: any) => q.id)), l: new Set(s.leads.map((l: any) => l.id)) }; saveSeen(s) }
  return SEEN;
}
function saveSeen(s: S) {
  if (!SEEN) return;
  // keep only what is still on the table, so the set never grows
  const q = [...SEEN.q].filter(id => s.quests.some((x: any) => x.id === id));
  const l = [...SEEN.l].filter(id => s.leads.some((x: any) => x.id === id));
  try { localStorage.setItem(SEEN_KEY, JSON.stringify({ q, l })) } catch { /* ignore */ }
}

export function MapScreen({ s, doAct, quick, queueAct, openQuest, drag, setDrag, goFort, boardTab, setBoardTab }: any) {
  const [hover, setHover] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<string | null>(null);
  const [tabLocal, setTabLocal] = useState<'quests' | 'leads'>('quests');
  const tab: 'quests' | 'leads' = boardTab ?? tabLocal;
  const setTab: (t: 'quests' | 'leads') => void = setBoardTab ?? setTabLocal;
  const questsOpen = gateOf(s, 'quests')?.open;

  // the map's pixel size drives the rows (ResizeObserver) and clamps the tip
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = mapRef.current; if (!el) return;
    const read = () => setSize(o => o.w === el.clientWidth && o.h === el.clientHeight ? o : { w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = size.w || 1000, H = size.h || 600;
  BAN_MAX = banMaxFor(W);

  // arrivals
  const seen = seenStore(s);
  const [, bump] = useState(0);
  const markSeen = (kind: 'q' | 'l', ids: string[]) => {
    const set = seen[kind]; let changed = false;
    for (const id of ids) if (!set.has(id)) { set.add(id); changed = true }
    if (changed) { saveSeen(s); bump(n => n + 1) }
  };
  // a standing post's quest is re-written every cycle: that is not news (it would cry NEW daily)
  const isNew = (q: any) => !q.faucet && !seen.q.has(q.id);
  useEffect(() => { if (hover) markSeen('q', [hover]) }, [hover]);
  const open = (id: string) => { markSeen('q', [id]); openQuest(id) };
  const unseenLeads = s.leads.filter((l: any) => !seen.l.has(l.id)).length;
  // leads first seen on this visit to the tab wear 'new' until the tab is left
  const [freshLeads, setFreshLeads] = useState<Set<string>>(new Set());
  const leadSig = s.leads.map((l: any) => l.id).join(',');
  useEffect(() => {
    if (tab !== 'leads') { if (freshLeads.size) setFreshLeads(new Set()); return }
    const fresh = s.leads.filter((l: any) => !seen.l.has(l.id)).map((l: any) => l.id);
    if (fresh.length) { setFreshLeads(f => new Set([...f, ...fresh])); markSeen('l', fresh) }
  }, [tab, leadSig]);

  // a place that just filled pops (the drop landed)
  const prevFill = useRef<Record<string, boolean> | null>(null);
  const [pops, setPops] = useState<Set<string>>(new Set());
  const fillSig = s.quests.map((q: any) => q.slots.map((x: any) => x.filledBy ? 1 : 0).join('')).join('|');
  useEffect(() => {
    const now: Record<string, boolean> = {};
    for (const q of s.quests) for (const x of q.slots) now[`${q.id}:${x.idx}`] = !!x.filledBy;
    const was = prevFill.current; prevFill.current = now;
    if (!was) return;
    const fresh = Object.keys(now).filter(k => now[k] && was[k] === false);
    if (!fresh.length) return;
    setPops(new Set(fresh));
    const t = setTimeout(() => setPops(new Set()), 700);
    return () => clearTimeout(t);
  }, [fillSig]);

  // drag: every marker shows the dragged soldier's best place there (engine placements)
  const dragFits: Record<string, any> = {};
  const dragger = drag ? s.roster.find((m: any) => m.id === drag) : null;
  for (const p of dragger?.placements ?? []) dragFits[p.questId] = p;
  useEffect(() => { if (!drag) setDropOn(null) }, [drag]);
  // dragleave fires on every crossing between a marker's own parts (and relatedTarget can be
  // null): clear the target a beat later unless a dragover re-claims it
  const leaveT = useRef<number | undefined>(undefined);
  const claim = (id: string) => { clearTimeout(leaveT.current); if (dropOn !== id) setDropOn(id) };
  const release = (e: React.DragEvent, id: string) => {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => setDropOn(d => d === id ? null : d), 60);
  };
  useEffect(() => () => clearTimeout(leaveT.current), []);

  // obstacles the quest markers must not cover: the home marker, labels of open regions, plaques.
  // Labels and plaques are MEASURED after they render (their text wraps); a guess stands in first.
  const regions = (s.regions ?? []).map((r: any) => ({ ...r, open: r.unlocked || s.quests.some((q: any) => q.regionId === r.id) }));
  const [measured, setMeasured] = useState<{ key: string; boxes: Box[] } | null>(null);
  const deco = `${W}x${H}:${questsOpen ? 1 : 0}:` + regions.map((r: any) => r.id + (r.open ? '+' : '-')).join(',');
  useLayoutEffect(() => {
    const el = mapRef.current; if (!el) return;
    const m = el.getBoundingClientRect();
    const boxes: Box[] = [...el.querySelectorAll('.plaque, .rlabel')].map(e => {
      const r = e.getBoundingClientRect();
      return [r.left - m.left - 4, r.top - m.top - 4, r.right - m.left + 4, r.bottom - m.top + 4];
    });
    if (measured?.key !== deco) setMeasured({ key: deco, boxes });
  });
  const [hx, hy] = [HOME[0] / 100 * W, HOME[1] / 100 * H];
  const obstacles: Box[] = [[hx - 50, hy - 28, hx + 50, hy + 56]];
  if (measured?.key === deco) obstacles.push(...measured.boxes);
  else for (const r of regions) {
    const [x, y, w, h] = (ZONES[r.id] ?? [0, 0, 0, 0]).map((v, i) => v / 100 * (i % 2 ? H : W));
    if (r.open) { const lw = r.name.length * 12 + 10, cx = x! + w! / 2, ly = y! + 0.02 * H; obstacles.push([cx - lw / 2, ly - 2, cx + lw / 2, ly + 24]) }
    else if (questsOpen) { const cx = x! + w! / 2, cy = y! + h! / 2; obstacles.push([cx - 95, cy - 40, cx + 95, cy + 40]) }
  }
  // the layout only changes when what it measures changes (not on every hover or poll)
  const layoutKey = deco + '|' + obstacles.map(b => b.map(Math.round).join(',')).join(';') + '|'
    + s.quests.map((q: any) => `${q.id}:${q.regionId}:${Math.round(banW(q))}:${Math.round(tokW(s, q))}`).join(',');
  const at = useMemo(() => place(s, s.quests, W, H, obstacles), [layoutKey]);

  // the tip: positioned from its marker, measured, and clamped inside the map (never clipped)
  const tipRef = useRef<HTMLDivElement>(null);
  const tipQ = hover && !drag ? s.quests.find((q: any) => q.id === hover) : null;
  useLayoutEffect(() => {
    const el = tipRef.current, sp = tipQ ? at[tipQ.id] : null;
    if (!el || !sp) return;
    const w = el.offsetWidth, h = el.offsetHeight, M = EDGE;
    const clampX = (v: number) => Math.max(M, Math.min(W - w - M, v));
    let L = clampX(sp.left ? sp.x + 23 - w : sp.x - 23), T = sp.y + 40;   // below the token row
    if (T + h > H - M) T = sp.y - 28 - h;                                  // else above the coin
    if (T < M) {                                                            // else beside the marker
      T = Math.max(M, Math.min(H - h - M, sp.y - h / 2));
      const right = sp.left ? sp.x + 30 : sp.x + 34 + sp.wide;
      const leftSide = sp.left ? sp.x - 34 - sp.wide - w : sp.x - 30 - w;
      L = right + w <= W - M ? right : leftSide >= M ? leftSide : clampX(right);
    }
    el.style.left = `${L}px`; el.style.top = `${T}px`;
  });

  return (
    <div className="mapscreen">
      <div ref={mapRef} className={'map' + (drag ? ' dragging' : '')} onDragOver={e => e.preventDefault()}>
        <div className="forestwash" />
        {TREES.map(([x, y], i) => <svg key={i} className="tree" style={{ left: `${x}%`, top: `${y}%` }} width="22" height="26" viewBox="0 0 22 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M11 2L4 13h4l-5 7h16l-5-7h4zM11 20v5" /></svg>)}
        {regions.map((r: any) => {
          const [x, y, w, h] = ZONES[r.id] ?? [0, 0, 0, 0];
          return r.open
            ? <div key={r.id} className="rlabel" style={{ left: `${x + w / 2}%`, top: `${y + 2}%` }}>{r.name.toUpperCase()}</div>
            : <div key={r.id} className="veil" style={{ left: `${x + w * 0.06}%`, top: `${y + h * 0.06}%`, width: `${w * 0.88}%`, height: `${h * 0.88}%` }}>
                {questsOpen && <div className="plaque"><span className="n">{r.name.replace(/^The /, '').toUpperCase()}</span><span className="w">{r.ghTier <= s.ghTier ? 'build its Scouting lodge' : `opens at Great Hall T${r.ghTier}`}</span></div>}
              </div>;
        })}
        <div className="mk home" style={{ left: `${HOME[0]}%`, top: `${HOME[1]}%` }}>
          <button className="ros" onClick={goFort} aria-label="Your hold — open the fort"><Glyph name="shield" size={22} /></button>
          <span className="ban">Your hold</span>
        </div>
        {s.quests.map((q: any) => {
          const sp = at[q.id]!;
          const fit = drag ? dragFits[q.id] : null;
          const target = !!drag && dropOn === q.id;
          const fresh = isNew(q);
          return (
            <div key={q.id} className={'mk' + (hover === q.id && !drag ? ' hot' : '') + (target ? ' drop' : '') + (q.chainId ? ' is-saga' : '')
              + (drag && !fit ? ' dim' : '') + (fresh ? ' arrive' : '')}
              style={{ left: sp.x, top: sp.y }} data-q={q.id}
              onMouseEnter={() => setHover(q.id)} onMouseLeave={() => setHover(h => h === q.id ? null : h)}
              onDragOver={e => { e.preventDefault(); claim(q.id) }}
              onDragLeave={e => release(e, q.id)}
              onDrop={e => { e.preventDefault(); clearTimeout(leaveT.current); const id = e.dataTransfer.getData('text/plain'); setDrag(null); setDropOn(null); if (id) quick('send', q.id, id) }}>
              {target && fit && <span className="dropring" />}
              {fresh && <span className="arrivering" />}
              <button className="ros" onClick={() => open(q.id)} onFocus={() => setHover(q.id)} onBlur={() => setHover(h => h === q.id ? null : h)} aria-label={`Open ${q.title}`}>
                <Glyph name={glyphOf(q.archetype, q.isFinale)} size={20} />
              </button>
              <span className={'ban' + (sp.left ? ' left' : '')} style={{ maxWidth: BAN_MAX }} title={q.title} onClick={() => open(q.id)}>
                <span className="bt">{q.title}</span>
                {fresh && <span className="newrib">NEW</span>}
              </span>
              {fit
                ? <span className={'fitb ' + (fit.here ? 'here' : strengthCls(fit.strength)) + (sp.left ? ' left' : '')}>
                    {fit.here ? 'here now' : coinBadge(fit.coins, fit.strength, fit.attr)}
                    {!fit.here && fit.from && <em>leaves {shortTitle(fit.from.title)}</em>}</span>
                : !drag && <span className={'mtoks' + (sp.left ? ' left' : '')} onClick={() => open(q.id)}><Toks s={s} q={q} pops={pops} /></span>}
            </div>
          );
        })}
        {tipQ && at[tipQ.id] && <Tip s={s} q={tipQ} tipRef={tipRef} />}
        {!questsOpen && <div className="mapveil"><div className="plaque big"><span className="n">NO MAP ROOM YET</span>
          <span className="w">Build a Map room in the fort to take on quests.</span>
          <button className="btn solid" onClick={goFort}>Go to the fort</button></div></div>}
      </div>

      <aside className="board" aria-label="The board">
        <div className="boardtabs" role="tablist">
          <button role="tab" className={tab === 'quests' ? 'on' : ''} onClick={() => setTab('quests')}>Quests <span>{s.quests.length}</span></button>
          <button role="tab" className={tab === 'leads' ? 'on' : ''} onClick={() => setTab('leads')}>Leads <span>{s.leads.length}</span>
            {tab !== 'leads' && unseenLeads > 0 && <b className="unseen" title={`${unseenLeads} new since you last looked`}>{unseenLeads}</b>}</button>
        </div>
        {tab === 'quests'
          ? <QuestList s={s} doAct={doAct} open={open} hover={hover} setHover={setHover} isNew={isNew} pops={pops} goFort={goFort} toLeads={() => setTab('leads')} />
          : <LeadList s={s} queueAct={queueAct} openQuest={open} fresh={freshLeads} />}
      </aside>
    </div>
  );
}

/** the hover gist: kind, the errand, each place (who is there, or who would do best), the pooled
 *  verdict, pay, lapse, cast. Positioned + clamped by MapScreen's layout effect. */
function Tip({ s, q, tipRef }: { s: S; q: any; tipRef: React.RefObject<HTMLDivElement> }) {
  const act = activeSlots(q);
  const choose = finaleOpen(q);
  const filled = act.filter((x: any) => x.filledBy).length;
  const b = q.odds?.band as Band | null;
  const cast = (q.cast ?? []).map((c: any) => c.name);
  // who would do best in each open place — a different soldier per place (one body, one place)
  const named = new Set<string>(act.map((x: any) => x.filledId).filter(Boolean));
  const best = (x: any) => {
    const f = (x.fits ?? []).find((f: any) => !f.blocked && !named.has(f.id)) ?? (x.fits ?? []).find((f: any) => !f.blocked);
    if (f) named.add(f.id);
    if (!f) return <span className="tone-red">nobody can — {x.fits?.[0]?.blocked ?? 'no soldiers'}</span>;
    return <>open — <span className={'tone-' + (STRENGTH_TONE[strengthCls(f.strength)] ?? 'dark')}>{f.name.split(' ')[0]} {Math.round(f.coins)}c · {f.strength}</span>
      {f.from ? <span className="dimp"> (on {clip(f.from.title, 22)})</span> : null}</>;
  };
  return (
    <div className="tip" ref={tipRef}>
      <div className="k">{questKind(q)} · {q.rarity} · level {q.level} · {q.region}</div>
      <div className="t">{q.title}</div>
      <div className="j">{clip(q.job, 220)}</div>
      <div className="rows">
        {choose && <><span>Endings</span><b>{q.approaches.length} — open it and pick one</b></>}
        {act.map((x: any) => <React.Fragment key={x.idx}>
          <span>{x.attr}</span>
          <b>{x.filledBy
            ? <span className={'tone-' + (STRENGTH_TONE[strengthCls(x.filledStrength)] ?? 'dark')}>{x.filledBy.split(' ')[0]} · {x.filledStrength}</span>
            : best(x)}</b>
        </React.Fragment>)}
        <span>Odds</span>
        <b>{choose ? 'pick how it ends first'
          : b ? <span className={'tone-' + bandTone(b)}>{BAND_WORD[b]}{q.odds.success != null ? ` · ${Math.round(q.odds.success * 100)}%` : ''}</span>
          : `${act.length - filled} place${act.length - filled === 1 ? '' : 's'} open`}</b>
        <span>Pay</span><b>{q.rewardEnvelope}</b>
        {q.rewardWarn && <><span /><b className="tone-red">{q.rewardWarn}</b></>}
        <span>Lapses</span><b>{q.faucet ? 'renews each cycle' : `in ${lapseIn(s, q)} cycle${lapseIn(s, q) === 1 ? '' : 's'}`}</b>
        {cast.length > 0 && <><span>On it</span><b>{cast.join(', ')}</b></>}
      </div>
      <div className="foot">{choose ? 'A finale: open it and pick how it ends.'
        : filled < act.length ? 'Drag a soldier here, or open it and Auto · click to open'
        : 'Manned — it marches at END · click to open'}</div>
    </div>
  );
}

function QuestList({ s, doAct, open, hover, setHover, isNew, pops, goFort, toLeads }: any) {
  const gate = gateOf(s, 'quests');
  if (gate && !gate.open) return <div className="list"><p className="empty">Build a <b>{gate.need}</b> in the fort to take on quests.</p>
    <div className="boardhead"><button className="btn solid" onClick={goFort}>Go to the fort</button></div></div>;
  if (!s.quests.length) return <div className="list"><p className="empty">No quests out. A lead becomes a quest once you pursue it.</p>
    {s.leads.length > 0 && <div className="boardhead"><button className="btn solid" onClick={toLeads}>To the leads ({s.leads.length}) →</button></div>}</div>;
  const sagas = s.quests.filter((q: any) => q.chainId), jobs = s.quests.filter((q: any) => !q.chainId);
  const row = (q: any) => {
    const choose = finaleOpen(q), ready = !choose && manned(q);
    const [text, tone] = statusOf(s, q);
    return (
      <div key={q.id} data-q={q.id} className={'row' + (hover === q.id ? ' hot' : '')} onMouseEnter={() => setHover(q.id)} onMouseLeave={() => setHover((h: string | null) => h === q.id ? null : h)}>
        <span className={'g' + (q.chainId ? ' is-saga' : '')}><Glyph name={glyphOf(q.archetype, q.isFinale)} size={15} /></span>
        <button className="open" onClick={() => open(q.id)}>
          <span className="tt">{q.title}{isNew(q) && <span className="newmark">new</span>}</span>
          <span className="ss">
            <span className={tone ? 'tone-' + tone : ''}>{text}</span>
            <Toks s={s} q={q} chip={false} pops={pops} />
          </span>
        </button>
        {choose ? <button className="btn" onClick={() => open(q.id)}>Choose</button>
          : !ready && <button className="btn" onClick={() => doAct('auto', q.id)}>Auto</button>}
      </div>
    );
  };
  return (
    <>
      <div className="boardhead"><button className="btn solid" onClick={() => doAct('autoall')}>Auto-fill every quest</button></div>
      <div className="list">
        {sagas.length > 0 && <div className="sec">Sagas</div>}
        {sagas.map(row)}
        {jobs.length > 0 && <div className="sec">Jobs</div>}
        {jobs.map(row)}
      </div>
    </>
  );
}

const RARITY: Record<string, string> = { common: '#aab4b8', uncommon: '#8fc285', rare: '#c9a2f0' };

/** the leads, in the engine's order (leadBoard): no dead buttons — a lead already on the map
 *  says so and opens it, a refused one shows why instead of offering Pursue. */
function LeadList({ s, queueAct, openQuest, fresh }: any) {
  const gate = gateOf(s, 'leads');
  const jobs: any[] = s.jobs ?? [];
  const failed = jobs.filter(j => j.state === 'failed');
  if (gate && !gate.open) return <div className="list"><p className="empty">Build a <b>{gate.need}</b> to read leads.</p></div>;
  const n = s.pursuable ?? s.leads.filter((l: any) => !l.blocked && !l.onBoard && !l.working).length;
  return (
    <>
      {s.leads.length > 0 && <div className="boardhead"><button className="btn solid" disabled={!n} onClick={() => queueAct('pursueall')}>
        {n ? `Pursue all (${n})` : 'Nothing left to pursue'}</button></div>}
      <div className="list">
        {failed.map(j => <div key={j.id} className="failrow">✗ {j.title} — {j.error ?? 'the writing failed'}. Pursue it again.</div>)}
        {s.leads.length === 0 && <p className="empty">No leads. They are earned: run scouting jobs, finish quests.</p>}
        {s.leads.map((l: any) => {
          const job = jobs.find(j => j.leadId === l.id && (j.state === 'queued' || j.state === 'running'));
          const working = job?.state ?? l.working;
          const cold = l.expires == null ? null : l.expires - s.cycle;
          const saga = l.chain === 'starts-new' || l.chain === 'continues';
          return (
            <div key={l.id} data-lead={l.id} className={'row lead' + (fresh.has(l.id) ? ' fresh' : '')}>
              <span className={'g lead' + (saga ? ' is-saga' : '')}><Glyph name={glyphOf(l.archetype)} size={14} /></span>
              <div>
                <div className="tt">{leadLabel(l)}{l.chain === 'starts-new' ? <span className="badge2">new saga</span> : l.chain === 'continues' ? <span className="badge2">continues</span> : null}
                  {fresh.has(l.id) && <span className="newmark">new</span>}</div>
                <div className="ss">
                  <span style={{ color: RARITY[l.rarity] }}>{l.rarity}</span><span>L{l.level}</span><span>{l.region}</span>
                  {l.pay?.band ? <span className="payb">{l.pay.stars} {l.pay.label}</span> : null}
                  <span className={cold != null && cold <= 3 ? 'tone-red' : ''}>{cold == null ? 'no deadline' : `cold in ${cold}`}</span>
                </div>
                {!working && !l.onBoard && l.blocked && <div className="why">{l.blocked}</div>}
              </div>
              {working ? <span className="writing">{working === 'queued' ? '⋯ queued' : <><span className="spin" /> writing</>}
                  {working === 'queued' && job && <button className="qx" onClick={() => queueAct('cancel', job.id)} aria-label="drop from the queue">×</button>}</span>
                : l.onBoard ? <button className="btn ghost" onClick={() => openQuest(l.onBoard)}>on the map →</button>
                : l.blocked ? null
                : <button className="btn" onClick={() => queueAct('pursue', l.id)}>Pursue</button>}
            </div>
          );
        })}
        {s.leadsWaiting > 0 && <p className="empty">+{s.leadsWaiting} more lead{s.leadsWaiting === 1 ? '' : 's'} earned — they wait on a <b>Lead room</b> to be read.</p>}
      </div>
    </>
  );
}
