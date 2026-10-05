// Shared bits for every screen: the action call, drawn icons, card faces, tag chips.
import React, { useEffect } from 'react';

export type S = any; // the /api/state view-model (prototype: untyped client)
export type Act = (type: string, ...args: (string | number)[]) => Promise<void>;

export async function act(type: string, ...args: (string | number)[]) {
  const r = await fetch('/api/action', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, args }),
  });
  return r.json() as Promise<{ ok: boolean; msg: string }>;
}

export const clip = (t: string, n: number) => !t || t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)) + '…';
export const activeSlots = (q: any) => q.approaches ? q.slots.filter((x: any) => x.groupId === q.chosenApproach) : q.slots;
export const gateOf = (s: S, key: string) => (s.menus ?? []).find((m: any) => m.key === key);
export const shortTitle = (t: string) => clip(t.replace(/^(the|a|an) /i, ''), 22);
export const cap1 = (t: string) => t ? t[0]!.toUpperCase() + t.slice(1) : t;
/** the fort panel's pseudo-selection for the holding list — reachable with no Holding cell room */
export const HOLDING_SEL = '@holding';
/** reduced motion: scroll without the glide (an explicit 'smooth' in a call beats the CSS guard) */
export const scrollBehavior = (): ScrollBehavior =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/* ── the page keys ─────────────────────────────────────────────────────────────────────
   The document never scrolls (body is overflow:hidden), so PageUp/PageDown/Home/End/the arrows — and
   Space, when the focus is not on something Space presses — had nowhere to go until the player clicked
   inside a panel. Each reading surface registers its scroll region; the topmost one takes those keys
   whenever the focus is not already inside something that scrolls (or types). */
const keyScrollers: React.RefObject<HTMLElement | null>[] = [];
let keyScrollOn = false;
function scrollsItself(el: Element | null): boolean {
  for (let e = el as HTMLElement | null; e && e !== document.body; e = e.parentElement) {
    const oy = getComputedStyle(e).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 1) return true;
  }
  return false;
}
function onPageKey(e: KeyboardEvent) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  const el = [...keyScrollers].reverse().map(r => r.current).find(x => x?.isConnected);
  if (!el) return;
  const t = e.target as HTMLElement | null;
  if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (t && t !== document.body && scrollsItself(t)) return;            // it already scrolls where the focus is
  const page = Math.max(40, el.clientHeight * 0.85);
  const presses = !!t?.closest?.('button, a, summary, [role="button"], [role="tab"]');
  const by: Record<string, number> = { PageDown: page, PageUp: -page, ArrowDown: 40, ArrowUp: -40, Home: -1e9, End: 1e9 };
  const d = e.key === ' ' ? (presses ? undefined : e.shiftKey ? -page : page) : by[e.key];
  if (d == null) return;
  // a region already at that end lets the key through (the reckoning's Space proceeds at the end)
  if (d > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 2 : el.scrollTop <= 0) return;
  e.preventDefault();
  el.scrollBy({ top: d, behavior: Math.abs(d) > 1e8 ? 'auto' : scrollBehavior() });
}
export function useKeyScroll(ref: React.RefObject<HTMLElement | null>, on = true) {
  useEffect(() => {
    if (!on) return;
    keyScrollers.push(ref);
    if (!keyScrollOn) { addEventListener('keydown', onPageKey); keyScrollOn = true }
    return () => { const i = keyScrollers.lastIndexOf(ref); if (i >= 0) keyScrollers.splice(i, 1) };
  }, [on]);
}

/* ── drawn icons (stroke, currentColor) ─────────────────────────────────────────────── */
const P: Record<string, string> = {
  'great-hall': 'M3 12L16 5l13 7M6 12h20M8 12v12M13 12v12M19 12v12M24 12v12M4 26h24',
  bedroom: 'M4 25V9M4 19h24v6M28 25v-6M4 16h7M13 19v-3a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v1M8 13a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
  bunkroom: 'M6 4v24M26 4v24M6 12h20M6 22h20M9 9h7M9 19h7',
  'map-room': 'M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3zM11 5v19M21 8v19M14 13l4 4M18 13l-4 4',
  tavern: 'M8 10h12v15a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM20 13h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3M8 10c-1-3 2-5 4-4 1-2 5-2 6 0 2-1 4 1 2 4M12 15v8M16 15v8',
  garden: 'M16 28V14M16 16c-6 0-9-4-9-9 5 0 9 3 9 9zM16 20c5 0 8-3 8-8-5 0-8 3-8 8zM9 28h14',
  scouting: 'M4 20l16-8 2.5 4.5-16 8zM20 12l4-2 2.5 4.5-4 2M11 23l-3 6M13 22l3 7',
  'lead-room': 'M12 9h8l2 3v11l-2 3h-8l-2-3V12zM13 5h6v4h-6zM16 2v3M16 21c-2-1-2-3.5 0-6 2 2.5 2 5 0 6z',
  'dining-hall': 'M4 15h24a12 8 0 0 1-24 0zM12 28h8M16 23v5M21 3l-4 10',
  recruiting: 'M8 30V3M8 5h17l-4 5 4 5H8',
  dungeon: 'M5 28V15a11 11 0 0 1 22 0v13zM11 8v20M16 5v23M21 8v20M5 18h22',
  'mess-hall': 'M6 13h20v3a10 9 0 0 1-20 0zM3 13h26M10 28l2-3M22 28l-2-3M12 9c0-2 2-2 2-4M18 9c0-2 2-2 2-4',
  storage: 'M5 10h22v17H5zM5 10l3-5h16l3 5M5 10l22 17M27 10L5 27',
  'holding-cell': 'M10 16a5 5 0 1 0 0 10a5 5 0 1 0 0-10M22 16a5 5 0 1 0 0 10a5 5 0 1 0 0-10M10 16v-5h12v5M16 11V5',
  'dungeon-cell': 'M5 5h22v22H5zM10 5v22M16 5v22M22 5v22M19 15h6v6h-6z',
  infirmary: 'M13 5h6v8h8v6h-8v8h-6v-8H5v-6h8z',
  hospital: 'M16 3a13 13 0 1 0 0 26a13 13 0 1 0 0-26M14 9h4v5h5v4h-5v5h-4v-5H9v-4h5z',
  'torture-chamber': 'M7 5l11 13M25 5L14 18M18 18l5 10M14 18l-5 10',
  kitchen: 'M4 8h15v11H9l-5-4zM19 13h9',
  gallery: 'M4 6h24v20H4zM8 10h16v12H8zM8 22l5-6 3 3 3-4 5 7',
  'trophy-room': 'M16 15v11M11 19a5 5 0 0 0 10 0M13 13c-5 0-8-3-8-9M9 9l-4 1M19 13c5 0 8-3 8-9M23 9l4 1M13 13c0 3 6 3 6 0',
  library: 'M16 9c-3-3-8-3-12-2v17c4-1 9-1 12 2 3-3 8-3 12-2V7c-4-1-9-1-12 2zM16 9v17',
  chronicle: 'M8 4h14a3 3 0 0 1 3 3v21H11a3 3 0 0 1-3-3zM8 25a3 3 0 0 1 3-3h14M13 9h8M13 13h8',
  market: 'M16 4v22M9 28h14M5 9h22M5 9l-3 8a3.5 3 0 0 0 6 0zM27 9l-3 8a3.5 3 0 0 0 6 0z',
  oracle: 'M16 3l13 24H3zM8 19s3-4 8-4 8 4 8 4-3 4-8 4-8-4-8-4z',
  smithy: 'M3 10h17c0 3 3 4 9 4v2h-10l-2 4h4v5H9v-5h4l-2-4H8c-3 0-5-3-5-6z',
  shrine: 'M12 15h8v13h-8zM16 15v-3M16 12c-2-1-2-4 0-7 2 3 2 6 0 7zM7 28h18',
  'ransom-office': 'M11 9h10l-2-4h-6zM11 9c-5 4-7 9-5 14 2 5 18 5 20 0 2-5 0-10-5-14M13 18h6M16 15v7',
  interrogation: 'M12 12a4 4 0 1 1 6 3.5c-1 .6-2 1.5-2 3M16 23v.5M6 4h20v24H6z',
  'hall-of-arms': 'M6 6l20 20M26 6L6 26M16 9l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8v-6z',
  'music-hall': 'M9 26c-4 0-4-6 0-6s4 6 0 6M9 23V6l14-3v17M23 23c-4 0-4-6 0-6s4 6 0 6',
  menagerie: 'M16 26c-5 0-8-2-8-5s4-5 8-5 8 2 8 5-3 5-8 5M8 12a2.5 3 0 1 0 0 .1M13 8a2.5 3 0 1 0 0 .1M19 8a2.5 3 0 1 0 0 .1M24 12a2.5 3 0 1 0 0 .1',
  'treasure-vault': 'M4 13h24v14H4zM4 13c0-5 4-8 12-8s12 3 12 8M4 18h24M14 16h4v5h-4z',
  'curiosity-cabinet': 'M7 4h18v24H7zM7 12h18M7 20h18M13 8h6M13 16h6M13 24h6',
  crypt: 'M9 28V12a7 7 0 0 1 14 0v16M5 28h22M16 14v8M13 17h6',
  'gambling-den': 'M5 9l9-4 9 4-9 4zM5 9v11l9 5V13M23 9v11l-9 5M9 13v.5M19 17v.5M9 19v.5',
  bathhouse: 'M4 16h24v4a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zM8 16V7a3 3 0 0 1 6 0M4 29c2-1 4-1 6 0s4 1 6 0',
  brewery: 'M9 5h14l2 11-2 11H9L7 16zM8 10h16M8 22h16',
  stables: 'M9 27V14a7 7 0 0 1 14 0v13M9 27h4M19 27h4M12 12v1M20 12v1',
  'feast-hall': 'M4 15h24a12 8 0 0 1-24 0zM10 11c0-2 2-3 2-5M16 11c0-2 2-3 2-5M22 11c0-2 2-3 2-5',
  endgame: 'M10 16a6 6 0 1 0 0 .1M16 16h13M24 16v5M28 16v4',
  excavate: 'M6 27L20 13M13 6c6-1 12 1 14 6-5-2-9-2-14-6z',
};
const iconKey = (type: string) => type.startsWith('scouting-') ? 'scouting' : type.startsWith('recruiting-') ? 'recruiting'
  : type.startsWith('endgame-') ? 'endgame' : P[type] ? type : 'great-hall';
export function RoomIcon({ type, size = 36 }: { type: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[iconKey(type)]} /></svg>;
}

// quest glyphs — what kind of work, at a glance on the map
const G: Record<string, string> = {
  search: 'M10.5 4.5a6 6 0 1 0 0 12a6 6 0 1 0 0-12M15 15l5 5',
  swords: 'M5 5l14 14M19 5L5 19M8 14l2 2M14 16l2-2',
  crown: 'M4 18l1-10 4 4 3-7 3 7 4-4 1 10z',
  bow: 'M6 3c8 3 12 9 12 18M6 3v18h12M6 12h14M17 10l3 2-3 2',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  chest: 'M3 10h18v10H3zM3 10c0-3 3-5 9-5s9 2 9 5M3 14h18M10 13h4v3h-4z',
  compass: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M15 9l-2 5-4 1 2-5z',
  book: 'M12 6c-2-2-6-2-9-1v14c3-1 7-1 9 1 2-2 6-2 9-1V5c-3-1-7-1-9 1zM12 6v14',
  eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  person: 'M9 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6M3 20c0-4 3-6 6-6s6 2 6 6M18 8v6M15 11h6',
  chain: 'M10 14a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1M14 10a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1',
  dagger: 'M14 3l4 4-9 9-4-4zM5 15l-2 6 6-2M16 12l3 3',
  scroll: 'M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 8h7M9 11h7M9 14h5',
  flame: 'M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 4 5 4 7 1-1 2-2 2-4 2 2 2 5 2 8 0 3-2 6-6 6z',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3M12 15v2',
  mountain: 'M3 20l6-10 4 6 3-4 5 8z',
  target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 11.5v1',
  sprout: 'M12 21V11M12 13c-5 0-7-3-7-7 4 0 7 2 7 7zM12 16c4 0 6-2 6-6-4 0-6 2-6 6z',
  scales: 'M12 3v17M7 21h10M4 7h16M4 7l-2 6a2.5 2 0 0 0 5 0zM20 7l-2 6a2.5 2 0 0 0 5 0z',
  candle: 'M9 11h6v10H9zM12 11V8M12 8c-1.5-1-1.5-3 0-5 1.5 2 1.5 4 0 5z',
  speech: 'M4 5h16v10H10l-4 4v-4H4z',
  hourglass: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9',
};
const ARCH_GLYPH: Record<string, string> = {
  raid: 'flame', capture: 'lock', rescue: 'chain', escort: 'shield', investigate: 'search', hunt: 'bow', contract: 'scroll',
  'lead-hunt': 'eye', guard: 'shield', recover: 'chest', explore: 'compass', trade: 'scales', assassinate: 'dagger',
  occult: 'eye', ritual: 'candle', negotiate: 'speech', fight: 'swords', research: 'book', heist: 'lock',
  adventure: 'mountain', 'bounty-hunt': 'target', gather: 'sprout', hire: 'person',
};
export const glyphOf = (archetype: string, isFinale = false) => isFinale ? 'crown' : ARCH_GLYPH[archetype] ?? 'scroll';
export function Glyph({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={G[name] ?? G.scroll} /></svg>;
}
export const Silhouette = ({ size = 40 }: { size?: number }) =>
  <svg width={size} height={size * 1.25} viewBox="0 0 24 30" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="5" /><path d="M2 29c0-7 4.5-12 10-12s10 5 10 12z" /></svg>;

/* ── tags as chips: "craft (low)" → a chip with a band-coloured border ───────────────── */
export function Tags({ tags }: { tags: string }) {
  if (!tags) return null;
  return <div className="tags">{tags.split('; ').map((t, i) => {
    const m = t.match(/^(.*) \((low|mid|high|legendary)\)$/);
    return <span key={i} className={'tg ' + (m ? m[2] : '')}>{m ? m[1] : t}{m && <span className="band">{m[2]}</span>}</span>;
  })}</div>;
}

/** the relic's broad kind, for the folders — the first form tag it carries */
const FORMS = ['melee-weapon', 'ranged-weapon', 'armor', 'clothes', 'accessory', 'document', 'curio', 'decoration', 'furniture'];
export const formOf = (tags: string) => FORMS.find(f => tags.includes(f)) ?? 'curio';
export const FORM_ONE: Record<string, string> = {
  'melee-weapon': 'blade', 'ranged-weapon': 'bow', armor: 'armor', clothes: 'clothing', accessory: 'accessory',
  document: 'writing', curio: 'curio', decoration: 'decoration', furniture: 'furniture',
};
export const FORM_LABEL: Record<string, string> = {
  'melee-weapon': 'Blades', 'ranged-weapon': 'Bows', armor: 'Armor', clothes: 'Clothes', accessory: 'Accessories',
  document: 'Writings', curio: 'Curios', decoration: 'Decorations', furniture: 'Furniture',
};

/* ── the card face ──────────────────────────────────────────────────────────────────── */
/** a captive's / relic's status in one chip, from the engine's state + where it sits */
/** (`short`: the card face's form — the green chip already says "on show"; the sheet says it whole) */
export function cardStatus(c: any): { text: string; cls: string; short?: string } | null {
  if (c.character?.role === 'captive') {
    // taken on a job, not yet yours (holding): not in the cells, so not "raw" — held, on a clock
    if (c.location?.kind === 'held' && c.location?.state === 'staged') return { text: 'HOLDING', cls: 'hold' };
    switch (c.state) {
      case 'raw': return { text: 'RAW', cls: 'raw' };
      case 'breaking': return { text: c.doneAt != null ? `RACK · c${c.doneAt}` : 'ON THE RACK', cls: 'rack' };
      case 'tamed': return { text: 'TAMED', cls: 'tamed' };
      case 'onShow': return { text: `ON SHOW${c.whereName ? ' · ' + c.whereName : ''}`, cls: 'show', short: c.whereName ? `in ${c.whereName}` : undefined };
    }
    return null;
  }
  if (c.type === 'relic' && c.location?.kind === 'room') return { text: `ON SHOW${c.whereName ? ' · ' + c.whereName : ''}`, cls: 'show', short: c.whereName ? `in ${c.whereName}` : undefined };
  return null;
}
export type Ribbon = { text: string; tone: 'gold' | 'red' | 'teal' };
/** the engine's reasons for one soldier's coins at one place: +roguery · −playful · wound −9 */
const whyList = (why?: { plus?: string[]; minus?: string[]; wound?: number } | null): [string, string][] => !why ? [] :
  [...(why.plus ?? []).map(t => ['p', '+' + t] as [string, string]), ...(why.minus ?? []).map(t => ['m', '−' + t] as [string, string]),
    ...(why.wound ? [['w', `wound −${Math.round(why.wound)}`] as [string, string]] : [])];
export function WhyChips({ why }: { why?: { plus?: string[]; minus?: string[]; wound?: number } | null }) {
  const chips = whyList(why);
  if (!chips.length) return null;
  return <span className="why">{chips.map(([k, t], i) => <i key={i} className={k}>{t}</i>)}</span>;
}

/** THE CARD FACE — a column, top to bottom: the NAME (in flow: nothing ever covers it) · the PICTURE
 *  (it gives way: whatever else the card says makes it smaller, never covers it — a bust is cropped
 *  face-first, so a small picture is still the face) · one status chip · ONE reason (a refusal, else
 *  the note, else the why-chips, else the wound — two lines at most) · the xp line · the FOOT row
 *  (level or kind, and a ribbon tag). When the hand is armed the verdict badge takes the whole foot
 *  row. Everything the face had to leave out (the full reason, the why, the wound) is in its tooltip. */
export function CardFace({ c, badge, badgeCls, note, more, dim, onClick, onDragStart, onDragEnd, small, title, ribbon, why, block, here }: {
  c: any; badge?: string; badgeCls?: string; note?: string; dim?: boolean; small?: boolean; title?: string;
  onClick?: () => void; onDragStart?: (e: React.DragEvent) => void; onDragEnd?: () => void;
  /** optional additions (all additive): a one-cycle ribbon ('+1 LV'), the engine's why-chips, a
   *  refusal reason (greyed, not clickable), 'here' (already placed where the hand is armed), and
   *  `more` — the reason in full, for the tooltip, when the face shows a short form */
  ribbon?: Ribbon | null; why?: { plus?: string[]; minus?: string[]; wound?: number } | null; block?: string | null; here?: boolean; more?: string;
}) {
  const ch = c.character;
  const kind = c.liability ? 'liab' : c.type === 'relic' ? 'relic' : ch?.role === 'captive' ? 'captive' : ch ? 'soldier' : 'stack';
  const drag = !!onDragStart;
  const st = cardStatus(c);
  const stars = c.stars > 0 && (kind === 'relic' || kind === 'captive') ? `${Math.min(5, c.stars)}★` : '';
  const capped = kind === 'soldier' && c.cap != null && ch.level >= c.cap;
  const xpPct = kind === 'soldier' && c.xpNeeded ? Math.min(100, ch.xp / Math.max(1, c.xpNeeded) * 100) : null;
  const wound = ch && ch.injury > 0 ? `wound ${ch.injury}${c.woundPenalty ? ` · −${Math.round(c.woundPenalty)}` : ''}` : '';
  const whys = whyList(why);
  // the ONE reason line: a refusal, else the note, else the why-chips, else the wound
  const reason = block ? <span className="bk">{block}</span>
    : note ? <span className="note">{note}</span>
    : whys.length ? <WhyChips why={why} />
    : wound && !badge ? <span className="wnd">{wound}</span> : null;
  const tip = title ?? [c.name + (kind === 'captive' ? ` — captive, L${ch.level}` : kind === 'soldier' ? ` — L${ch.level}` : ''),
    st && (st.short ? `on show ${st.short}` : st.text.toLowerCase()), badge, more ?? block ?? note, whys.map(w => w[1]).join(' '), wound, ribbon?.text].filter(Boolean).join(' — ');
  const cls = ['card', kind, dim && 'dim', small && 'small', block && 'blocked', here && 'here'].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={block ? undefined : onClick} title={tip}
      aria-disabled={block ? true : undefined} draggable={drag} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <span className="nm"><span className="nmt">{c.name}</span></span>
      <span className="pic">
        {kind === 'soldier' && (c.portrait
          ? <img src={c.portrait} alt="" draggable={false} />
          : <span className="paint"><Silhouette size={30} />{c.painting ? <em>being painted…</em> : null}</span>)}
        {kind === 'captive' && <span className="paint cap"><Silhouette size={30} /></span>}
        {kind === 'relic' && <span className="art"><Glyph name={formOf(c.tags) === 'document' ? 'scroll' : formOf(c.tags).includes('weapon') ? 'dagger' : formOf(c.tags) === 'armor' ? 'shield' : 'chest'} size={40} /></span>}
        {(kind === 'liab' || kind === 'stack') && <span className="art"><Glyph name="scales" size={40} /></span>}
        {c.qty > 1 && <span className="qty">{c.qty}</span>}
      </span>
      {st && <span className={'stc ' + st.cls}>{st.short ?? st.text}</span>}
      {reason}
      {xpPct != null && <span className={'xpl' + (capped ? ' capd' : xpPct >= 100 ? ' full' : '')} title={`${ch.xp} / ${c.xpNeeded} xp`}><i style={{ width: `${xpPct}%` }} /></span>}
      {badge
        ? <span className={'ft verdict badge ' + (badgeCls ?? '')}>{badge}</span>
        : <span className="ft">
          {ch ? <span>L{ch.level}</span> : c.liability ? <span>liability</span> : <span>{FORM_ONE[formOf(c.tags)]}</span>}
          {ribbon ? <span className={'rib ' + ribbon.tone}>{ribbon.text}</span>
            : capped ? <span className="cap" title={`held at level ${c.cap} — experience is going to waste`}>⛔ CAP</span>
            : stars ? <span className="st">{stars}</span> : null}
        </span>}
    </button>
  );
}

/** a Fix (the engine's "what would clear this": Game Fix) as one button. `go` handles the screen
 *  fixes ({screen:'fort'|'build', id}); a build that itself needs a cell shows the build row's own
 *  fix (excavate) first — never a dead end. Blocked fixes render disabled with the reason. */
export function FixButton({ s, fix, quick, go, solid, lead }: {
  s: S; fix: any; quick: (type: string, ...a: any[]) => any; go?: (screen: string, id: string | null) => void; solid?: boolean; lead?: string;
}) {
  if (!fix) return null;
  let f = fix, then: string | null = null;
  const first = f.action === 'build' && f.block ? (s.buildable ?? []).find((b: any) => b.type === f.type)?.fix : null;
  if (first) { then = f.label; f = first }
  if ('screen' in f) {
    if (go && (f.screen === 'fort' || f.screen === 'build')) return <button className="btn sm ghost" onClick={() => go(f.screen, f.id ?? null)}>{lead ? lead + ' ' : ''}{f.label} →</button>;
    return <span className="fixnote">{f.label}</span>;
  }
  const run = () => f.action === 'upgrade' ? quick('upgrade', f.roomId) : f.action === 'build' ? quick('build', f.type)
    : f.action === 'excavate' ? quick('excavate') : quick('gh');
  return <>
    <button className={'btn sm' + (solid && !f.block ? ' solid' : '')} disabled={!!f.block} onClick={run} title={f.block ?? f.label}>
      {lead ? lead + ' ' : ''}{f.label}{f.block ? <em className="blk-why"> · {f.block}</em> : null}</button>
    {then && <span className="fixnote">then {then}</span>}
  </>;
}


/** a quest's kind in words — one rule for the quest page, the map's hover and anywhere else that names it:
 *  a saga card is "Saga · part n of N" (again) or "Saga finale" (· the last chance), from the engine's q.saga */
export function questKind(q: any): string {
  const sg = q.saga;
  if (q.isFinale) return `Saga finale${sg?.lastchance ? ' · the last chance' : ''}`;
  if (q.chainId) return sg ? `Saga · part ${sg.part} of ${sg.of}${sg.again ? ' (again)' : ''}` : 'Saga';
  return q.faucet ? 'Standing post' : 'One-off job';
}

/** the road marks: each one's class (every class in the ql- namespace — a bare one collided with map.css's global .mk,
 *  002725a) and its words for a screen reader (the glyph is what the eye reads) */
const ROAD_MARK: Record<string, [string, string]> = { '✓': ['ql-won', 'done'], '✗': ['ql-lost', 'lost'], '▶': ['ql-now', 'this job'], '·': ['ql-ahead', 'ahead'] };
/** So far's marks: a part played and won (a partial is a win), or a try that failed */
const PAST_MARK: Record<string, [string, string]> = { '✓': ['ql-won', 'done'], '✗': ['ql-lost', 'failed'] };
/** THE QUEST LOG (the v4 storyteller): the rows the ENGINE rendered for a saga card or the chronicle. On a saga card of the
 *  game's pipes, So far — one row per part played before the last (the prose opens on that one), in order: its mark, its
 *  title, the line its report left (none on cards 1–2); the game's pipes give the chronicle no rows (its own So far list
 *  stands). A saga on an older pipe: the forward log — who the company acts for, the road ahead, what is known and held,
 *  the open question. The CLI prints the very same rows in the same order (cli/format.ts, logLines).
 *  Plain rows, part of the card: a bold lead word, then the text; the marks in a fixed gutter (✓ won · ✗ lost · ▶ this job ·
 *  · ahead). Horizontal text only (docs/UI.md G6) */
export function QuestLog({ rows }: { rows?: any[] | null }) {
  if (!rows?.length) return null;
  return <div className="qlog" aria-label="Quest log">{rows.map((r: any, i: number) => {
    switch (r.kind) {
      case 'for': return <p key={i} className="ql-line"><b>For:</b> {r.text}</p>;
      case 'road': return <p key={i} className="ql-head"><b>Road ahead:</b></p>;
      case 'roadrow': {
        const [cls, word] = ROAD_MARK[r.mark ?? '·'] ?? ROAD_MARK['·']!;
        return <p key={i} className={'ql-road ' + cls}><span className="ql-mk" role="img" aria-label={word}>{r.mark ?? '·'}</span><span className="ql-tx">{r.text}</span></p>;
      }
      case 'known': return <p key={i} className="ql-head"><b>Known:</b></p>;
      case 'knownrow': return <p key={i} className="ql-sub">{r.text}</p>;
      case 'held': return <p key={i} className="ql-line"><b>Held:</b> {r.text}</p>;
      case 'open': return <p key={i} className="ql-line ql-open"><b>Open question:</b> {r.text}</p>;
      case 'sofar': return <p key={i} className="ql-head"><b>So far:</b></p>;
      case 'sofarrow': {
        const [cls, word] = PAST_MARK[r.mark ?? '✓'] ?? PAST_MARK['✓']!;
        return <p key={i} className={'ql-road ql-past ' + cls}><span className="ql-mk" role="img" aria-label={word}>{r.mark ?? '✓'}</span><span className="ql-tx">{r.title ? <><span className="ql-ti">{r.title}</span> — </> : null}{r.text}</span></p>;
      }
      default: return null;
    }
  })}</div>;
}
