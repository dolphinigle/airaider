// THE HAND — every card you own, always along the bottom, in four bags. Overflow squeezes into
// slivers (hover to peek); "All cards" (B) opens the drawer with search, filters and relic folders.
// On an open quest the hand re-sorts for the armed place and badges each soldier's coins there.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type S, type Ribbon, CardFace, FixButton, gateOf, shortTitle, formOf, FORM_LABEL, activeSlots, scrollBehavior } from './ui';
import { strengthCls, coinBadge } from './band';

type Bag = 'soldiers' | 'captives' | 'relics' | 'stores';

// the Captives bag holds the ones in HOLDING too (not yours yet — decide: to the cells, ransom, sell):
// without a Holding cell room they had no other way into view
const isHolding = (s: S, c: any) => (s.holding ?? []).some((h: any) => h.id === c.id);
function bagCards(s: S, bag: Bag): any[] {
  if (bag === 'soldiers') return s.roster;
  if (bag === 'captives') return [...s.captives, ...(s.holding ?? [])];
  if (bag === 'relics') return s.relics;
  return s.liabilities;
}
function bagLock(s: S, bag: Bag): string | null {
  const g = bag === 'captives' ? gateOf(s, 'captives') : bag === 'relics' || bag === 'stores' ? gateOf(s, 'items') : null;
  // only a gate the engine ENFORCES says "build X first" (a relic drops and sells with no Storage)
  return g && !g.open && g.locks !== false && !bagCards(s, bag).length ? g.need : null;
}
/** '−2.1 prestige' → '−2.1 ✦' (display only) */
const star = (t: string) => t.replace(/(\d) prestige\b/g, '$1 ✦');
const where = (s: S, m: any) => m.location?.kind === 'quest' ? s.quests.find((q: any) => q.id === m.location.questId) : null;
const isSetCard = (c: any) => c.type === 'relic' || c.character?.role === 'captive';
// sliver + stack-button widths (css: .sliver 13px − 4px overlap + 8px gap; .stack 78px + gap)
const CARD_W = 114, SLIVER_W = 17, MAX_SLIVERS = 12, STACK_W = 90;

/** the one-cycle ribbons from the last reckoning's tally (engine-owned): who grew, who got hurt, what's new */
function ribbonsOf(s: S): Record<string, Ribbon> {
  const sum = s.lastSummary, r: Record<string, Ribbon> = {};
  if (!sum) return r;
  for (const x of sum.relicsGained ?? []) r[x.id] = { text: 'NEW', tone: 'teal' };
  for (const x of sum.tamed ?? []) r[x.id] = { text: 'TAMED', tone: 'teal' };
  for (const x of sum.wounds ?? []) r[x.id] = { text: 'WOUNDED', tone: 'red' };
  for (const x of sum.levelUps ?? []) r[x.id] = { text: '+1 LV', tone: 'gold' };
  return r;
}

/** the bag a selected room fills: a rack takes raw captives; a show room whichever bag it can take;
 *  a prisoner room (the view's room.bag) shows the captives */
function bagForRoom(s: S, room: any): Bag | null {
  if (room?.bag === 'captives') return 'captives';
  if (!room?.kind) return null;
  if (room.kind === 'rack') return 'captives';
  const okIn = (cards: any[]) => cards.some((c: any) => c.roomPlacements?.some((p: any) => p.roomId === room.id && p.ok));
  return okIn(s.relics) ? 'relics' : okIn(s.captives) ? 'captives' : 'relics';
}

function roomHint(room: any): string {
  if (room.bag === 'captives') return `The prisoners — click a captive to read them and decide; raw ones go on a rack, tamed ones on show`;
  if (!room.kind) return `${room.name} takes no cards — pick a room with places to set relics or captives in it`;
  const places = room.slots?.length ?? 0;
  if (!places) return `The ${room.name} has no places yet — add one to set cards here`;
  if (room.kind === 'rack') return `Raw captives go on the rack — they come off tamed${room.breakCycles ? ` in ${room.breakCycles} cycles` : ''}. Click one to rack them.`;
  return `The ${room.name}${room.effect ? ` (${room.effect})` : ''} takes relics & tamed captives — click one to set it here`;
}

export function Hand({ s, q, armed, pick, drag, setDrag, openDrawer, drawer, modal, fortMode, room, quick }: any) {
  const [bag, setBag] = useState<Bag>(fortMode ? 'relics' : 'soldiers');
  const [filter, setFilter] = useState<'all' | 'free' | 'wounded' | 'placed'>('all');
  useEffect(() => { setBag(fortMode ? 'relics' : 'soldiers') }, [fortMode]);
  useEffect(() => { if (q) setBag('soldiers') }, [q?.id]);
  // a selected fort room ARMS the hand: open the bag that fills it
  useEffect(() => { const b = room ? bagForRoom(s, room) : null; if (b) setBag(b) }, [room?.id]);
  // 1–4 pick a bag — never while a modal (the card sheet) or the drawer is up: the drawer's digits
  // are its own, and a sheet's page must not change behind it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || modal || drawer) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const b = (['soldiers', 'captives', 'relics', 'stores'] as Bag[])[Number(e.key) - 1];
      if (b) setBag(b);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [modal, drawer]);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1100);
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(e => setW(e[0]!.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  // a bag's counter pulses when it grows
  const counts: Record<Bag, number> = { soldiers: s.roster.length, captives: s.captives.length + (s.holding ?? []).length, relics: s.relics.length, stores: s.liabilities.length };
  const prevCounts = useRef<Record<Bag, number> | null>(null);
  const [grew, setGrew] = useState<Partial<Record<Bag, number>>>({});
  const sig = Object.values(counts).join(',');
  useEffect(() => {
    const p = prevCounts.current;
    if (p) for (const b of Object.keys(counts) as Bag[]) if (counts[b] > p[b]) setGrew(g => ({ ...g, [b]: Date.now() + Math.random() }));
    prevCounts.current = counts;
  }, [sig]);

  const ribbons = ribbonsOf(s);
  // the armed place, looked up among the places IN PLAY only (a stale index never reads "another approach")
  const slot = q && armed != null ? activeSlots(q).find((x: any) => x.idx === armed && !x.filledBy) ?? null : null;
  const roomArmed = !!(room && room.kind && (bag === 'captives' || bag === 'relics'));
  const roomRow = (c: any) => roomArmed ? c.roomPlacements?.find((p: any) => p.roomId === room.id) ?? null : null;

  // one verdict per card for whatever the hand is armed by (all engine fields — no client rules)
  type V = { badge?: string; badgeCls?: string; note?: string; why?: any; block?: string | null; here?: boolean; dim?: boolean; rank: number };
  const verdict = (c: any): V => {
    const soldier = c.character?.role === 'merc';
    if (isHolding(s, c)) return { note: `in holding · ${c.deadline ?? ''}`, rank: -500 };
    const on = soldier ? where(s, c) : null;
    const away = on ? `→ ${shortTitle(on.title)}` : undefined;
    if (soldier && slot) {
      const f = slot.fits.find((x: any) => x.id === c.id);
      if (!f) return { here: true, note: 'here', rank: -2000 };                       // the one in this place
      if (f.from?.questId === q.id) return { here: true, note: `here · ${q.slots[f.from.idx]?.attr ?? 'another'} place`, rank: -1500 };
      if (f.blocked) return { block: f.blocked, rank: -1000 + f.coins };
      return { badge: coinBadge(f.coins, f.strength), badgeCls: strengthCls(f.strength), why: f.why,
        note: f.from ? `moves from ${shortTitle(f.from.title)}` : undefined, rank: f.coins };
    }
    if (soldier && q) {
      const p = c.placements?.find((x: any) => x.questId === q.id);
      if (p?.here || on?.id === q.id) return { here: true, note: 'here', rank: -2000 };
      if (!p) {
        // no free place for them: say the engine's reason when it has one ('pick an approach first')
        // (the chosen approach's places only — the other endings' places always say "another approach")
        const pool = q.approaches && q.chosenApproach ? activeSlots(q) : q.slots;
        const bl = pool.map((sl: any) => sl.fits?.find((f: any) => f.id === c.id)?.blocked).find(Boolean);
        return bl ? { block: bl, rank: -1000 } : { dim: true, note: away ?? 'no free place here', rank: -1000 };
      }
      return { badge: coinBadge(p.coins, p.strength, p.attr), badgeCls: strengthCls(p.strength), note: away, rank: p.coins };
    }
    if (roomArmed && isSetCard(c)) {
      if (c.whereId === room.id) return { here: true, note: 'here', rank: -2000 };
      const p = roomRow(c);
      if (!p) return { dim: true, rank: -1000 };
      if (!p.ok) return { dim: true, note: p.reason ?? p.label, rank: -1000 };
      // the engine's own short, signed badge and its tone — a losing move is never a green "+2.7"
      return { badge: star(p.badge ?? p.label), badgeCls: p.tone === 'good' ? 'good' : p.tone === 'bad' ? 'bad' : 'neutral',
        note: p.swapWithName ? `swap for ${p.swapWithName}` : undefined, rank: p.gain + 1 };
    }
    return { note: away, rank: 0 };
  };

  let cards = bagCards(s, bag);
  if (bag === 'soldiers') {
    cards = cards.filter((m: any) => filter === 'all' || (filter === 'free' && m.location.kind === 'held')
      || (filter === 'wounded' && m.character.injury > 0) || (filter === 'placed' && m.location.kind === 'quest'));
  }
  const vs = new Map(cards.map((c: any) => [c.id, verdict(c)]));
  const armedAny = !!q || roomArmed;
  cards = [...cards].sort((a, b) => armedAny ? (vs.get(b.id)!.rank - vs.get(a.id)!.rank) || b.character?.level - a.character?.level || 0
    : bag === 'soldiers' ? b.character.level - a.character.level
    // relics & captives: not yet placed first, then the most valuable
    : bag === 'captives' || bag === 'relics' ? (Number(a.location?.kind === 'room') - Number(b.location?.kind === 'room')) || (b.stars ?? 0) - (a.stars ?? 0)
    : 0);
  const lock = bagLock(s, bag);
  const fitAll = cards.length * CARD_W <= w;
  const nFull = fitAll ? cards.length : Math.max(1, Math.floor((w - MAX_SLIVERS * SLIVER_W - STACK_W) / CARD_W));
  const full = cards.slice(0, nFull), rest = cards.slice(nFull);
  const slivers = rest.slice(0, MAX_SLIVERS), hidden = rest.length - slivers.length;

  const face = (c: any) => {
    const v = vs.get(c.id)!;
    const draggable = c.character?.role === 'merc' || (fortMode && isSetCard(c) && !isHolding(s, c));
    return <CardFace key={c.id} c={c} badge={v.badge} badgeCls={v.badgeCls} note={v.note} dim={v.dim} why={v.why} block={v.block} here={v.here}
      ribbon={ribbons[c.id] ?? (isHolding(s, c) ? { text: 'HOLDING', tone: 'red' } : undefined)} onClick={() => pick(c)}
      onDragStart={draggable ? (e => { e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; setDrag(c.id) }) : undefined}
      onDragEnd={() => setDrag(null)} />;
  };

  const labels: [Bag, string][] = [['soldiers', 'Soldiers'], ['captives', 'Captives'], ['relics', 'Relics'], ['stores', 'Stores']];
  const hint = slot ? `Sorted for the ${slot.test.attributes.join('+').toUpperCase()} place — best first. Click a card to place it.`
    : q && q.approaches && !q.chosenApproach ? 'Pick how it ends first — then the hand sorts itself for it.'
    : q ? 'Best for this quest first. Click a card to send them to their best place here.'
    : room && fortMode && (bag === 'captives' || bag === 'relics') ? roomHint(room)
    : bag === 'soldiers' ? 'Drag a soldier onto a quest on the map · click a card to read it'
    : fortMode && bag === 'captives' ? 'Raw captives go on a rack, tamed ones on show — click a room to arm the hand, or drag onto one'
    : fortMode && bag === 'relics' ? 'Relics on show raise prestige — click a room to arm the hand, or drag onto one'
    : bag === 'captives' || bag === 'relics' ? 'Click a card to read it and set it in a room' : '';
  return (
    <div className={'hand' + (roomArmed ? ' armed' : '')}>
      <div className="bags" role="tablist" aria-label="Card bags">
        {labels.map(([b, label], i) => (
          <button key={b} role="tab" className={'bag' + (bag === b ? ' on' : '')} onClick={() => setBag(b)} title={`key ${i + 1}`}>
            {label}<span key={grew[b] ?? 0} className={'c' + (grew[b] ? ' fx-pulse-once grew' : '')}>{counts[b]}</span></button>))}
        <button className={'allc' + (drawer ? ' on' : '')} onClick={openDrawer}>All cards {drawer ? '▾' : '▴'} <span>B</span></button>
      </div>
      <div className="handbar">
        {bag === 'soldiers' && (['all', 'free', 'wounded', 'placed'] as const).map(f =>
          <button key={f} className={'fc' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>{f}</button>)}
        {roomArmed && <span className="armchip">{room.name}</span>}
        {roomArmed && !room.slots?.length && room.addPlace && quick && <FixButton s={s} fix={room.addPlace} quick={quick} solid />}
        <span className="hint" title={hint}>{hint}</span>
      </div>
      <div className="cards" ref={box}>
        {lock ? <span className="empty">Build a {lock} first.</span>
          : !cards.length ? <span className="empty">{bag === 'soldiers' ? 'Nobody here.' : bag === 'captives' ? 'No captives — capture quests bring them.' : bag === 'relics' ? 'No relics yet — loot comes from quests.' : 'Nothing owed.'}</span>
          : <>
            {full.map(face)}
            {slivers.map((c: any) => <button key={c.id} className={'sliver ' + (c.type === 'relic' ? 'relic' : c.character?.role === 'captive' ? 'captive' : '')}
              onClick={() => pick(c)} aria-label={c.name}><span className="sname">{c.name}</span></button>)}
            {rest.length > 0 && <button className="stack" onClick={openDrawer} aria-label={`${rest.length} more — open all cards`}>
              <span className="n">+{hidden > 0 ? hidden : rest.length}</span><span className="l">{hidden > 0 ? 'more' : 'in slivers'}</span><span className="l2">all cards</span></button>}
          </>}
      </div>
    </div>
  );
}

/** EVERY CARD — the drawer for a big collection: search, filters, and relics filed by kind */
export function Inventory({ s, close, pick, modal }: { s: S; close: () => void; pick: (c: any) => void; modal?: boolean }) {
  const [bag, setBag] = useState<'all' | Bag>('all');
  const [text, setText] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const subRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) subRef.current?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() }) }, [open]);
  // the drawer's OWN bag keys: 0 = all, 1–4 = a bag — from anywhere in the drawer, the search box
  // included while it is empty (a digit typed after a word stays a search)
  const BAGS: ('all' | Bag)[] = ['all', 'soldiers', 'captives', 'relics', 'stores'];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || e.ctrlKey || e.metaKey || e.altKey || !/^[0-4]$/.test(e.key)) return;
      const inSearch = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (inSearch && (e.target as HTMLInputElement).value) return;
      e.preventDefault();
      setBag(BAGS[Number(e.key)]!);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [modal]);
  const t = text.trim().toLowerCase();
  const hit = (c: any) => !t || c.name.toLowerCase().includes(t) || (c.tags ?? '').toLowerCase().includes(t);
  const sec = (b: Bag) => bag === 'all' || bag === b;
  const allCaptives = [...s.captives, ...(s.holding ?? [])];
  const roster = s.roster.filter(hit), captives = allCaptives.filter(hit), relics = s.relics.filter(hit), debts = s.liabilities.filter(hit);
  const forms: Record<string, any[]> = {};
  for (const r of relics) (forms[formOf(r.tags)] ??= []).push(r);
  const grid = (cards: any[]) => <div className="grid">{cards.map(c =>
    <CardFace key={c.id} c={c} small onClick={() => pick(c)} note={c.location?.kind === 'quest' ? '→ ' + shortTitle(where(s, c)?.title ?? '')
      : isHolding(s, c) ? `in holding · ${c.deadline ?? ''}` : undefined} />)}</div>;
  const total = s.roster.length + allCaptives.length + s.relics.length + s.liabilities.length;
  const shown = (b: Bag, n: number, all: number) => sec(b) && (t ? n > 0 : all > 0);
  const nothing = t && !roster.length && !captives.length && !relics.length && !debts.length;
  return (
    <section className="drawer" aria-label="Every card">
      <div className="dnav">
        <div className="h">EVERY CARD</div>
        {([['all', 'All', total], ['soldiers', 'Soldiers', s.roster.length], ['captives', 'Captives', allCaptives.length],
          ['relics', 'Relics', s.relics.length], ['stores', 'Stores', s.liabilities.length]] as const).map(([b, l, n]) =>
          <button key={b} className={'bag' + (bag === b ? ' on' : '')} onClick={() => setBag(b as any)}>{l}<span className="c">{n}</span></button>)}
        <p className="keys">0 all · 1–4 bags · Esc closes</p>
      </div>
      <div className="dmain">
        <div className="dbar">
          <input className="search" type="search" autoFocus placeholder="Search names and tags…" aria-label="Search cards" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); (e.target as HTMLInputElement).blur(); close() } }} />
          <button className="btn" onClick={close}>Close ▾</button>
        </div>
        <div className="dscroll">
          {nothing && <p className="empty">Nothing matches “{text}”.</p>}
          {shown('soldiers', roster.length, s.roster.length) && <><div className="dsec">Soldiers <span>{t ? `${roster.length} of ${s.roster.length}` : roster.length}</span></div>{grid(roster)}</>}
          {shown('captives', captives.length, allCaptives.length) && <><div className="dsec">Captives <span>{t ? `${captives.length} of ${allCaptives.length}` : captives.length}</span></div>{grid(captives)}</>}
          {shown('relics', relics.length, s.relics.length) && <>
            <div className="dsec">Relics <span>{relics.length}{t ? ` of ${s.relics.length}` : ''} in {Object.keys(forms).length} folder{Object.keys(forms).length === 1 ? '' : 's'}</span></div>
            <div className="grid">{Object.entries(forms).map(([f, rs]) => (
              <button key={f} className={'folder' + (open === f ? ' open' : '')} onClick={() => setOpen(open === f ? null : f)} aria-expanded={open === f}>
                <span className="l l1" /><span className="l l2" />
                <span className="l l3"><span className="fn">{FORM_LABEL[f]}</span><span className="fq">{rs.length}</span><span className="fh">{open === f ? 'open' : 'fan out'}</span></span>
              </button>))}
            </div>
            {open && forms[open] && <div className="sub" ref={subRef}>{grid(forms[open]!)}</div>}
          </>}
          {shown('stores', debts.length, s.liabilities.length) && <><div className="dsec">Stores <span>debts & stacks</span></div>{grid(debts)}</>}
        </div>
      </div>
    </section>
  );
}
