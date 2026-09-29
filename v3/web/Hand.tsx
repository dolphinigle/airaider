// THE HAND — every card you own, always along the bottom, in four bags. Overflow squeezes into
// slivers (hover to peek); "All cards" (B) opens the drawer with search, filters and relic folders.
// On an open quest the hand re-sorts for the armed place and badges each soldier's coins there.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type S, CardFace, fitCls, gateOf, shortTitle, formOf, FORM_LABEL } from './ui';

type Bag = 'soldiers' | 'captives' | 'relics' | 'stores';

function bagCards(s: S, bag: Bag): any[] {
  if (bag === 'soldiers') return s.roster;
  if (bag === 'captives') return s.captives;
  if (bag === 'relics') return s.relics;
  return s.liabilities;
}
function bagLock(s: S, bag: Bag): string | null {
  const g = bag === 'captives' ? gateOf(s, 'captives') : bag === 'relics' || bag === 'stores' ? gateOf(s, 'items') : null;
  return g && !g.open && !bagCards(s, bag).length ? g.need : null;
}
const where = (s: S, m: any) => m.location?.kind === 'quest' ? s.quests.find((q: any) => q.id === m.location.questId) : null;

/** what one soldier would bring to a slot, in words: matched helps, clashes, wounds */
function why(m: any, slot: any): string {
  const tags = (m.tags ?? '').toLowerCase();
  const plus = slot.test.favored.filter((t: string) => tags.includes(t.toLowerCase()));
  const minus = slot.test.clashing.filter((t: string) => tags.includes(t.toLowerCase()));
  return [plus.length ? '+ ' + plus.join(', ') : '', minus.length ? '− ' + minus.join(', ') : '', m.character.injury ? `wound −${m.character.injury * 2}` : ''].filter(Boolean).join(' · ');
}

export function Hand({ s, q, armed, pick, drag, setDrag, openDrawer, drawer, fortMode }: any) {
  const [bag, setBag] = useState<Bag>(fortMode ? 'relics' : 'soldiers');
  const [filter, setFilter] = useState<'all' | 'free' | 'wounded' | 'placed'>('all');
  useEffect(() => { setBag(fortMode ? 'relics' : 'soldiers') }, [fortMode]);
  useEffect(() => { if (q) setBag('soldiers') }, [q?.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const b = (['soldiers', 'captives', 'relics', 'stores'] as Bag[])[Number(e.key) - 1];
      if (b) setBag(b);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1100);
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(e => setW(e[0]!.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const slot = q && armed != null ? q.slots.find((x: any) => x.idx === armed) : null;
  let cards = bagCards(s, bag);
  if (bag === 'soldiers') {
    cards = cards.filter((m: any) => filter === 'all' || (filter === 'free' && m.location.kind === 'held')
      || (filter === 'wounded' && m.character.injury > 0) || (filter === 'placed' && m.location.kind === 'quest'));
    const fitOf = (m: any) => slot ? slot.fits.find((f: any) => f.id === m.id)?.coins ?? -99
      : q ? m.placements?.find((p: any) => p.questId === q.id)?.coins ?? -99 : 0;
    cards = [...cards].sort((a, b) => (q ? fitOf(b) - fitOf(a) : 0) || b.character.level - a.character.level);
  }
  const lock = bagLock(s, bag);
  const nFull = Math.max(1, Math.floor((w - 110) / 114));
  const full = cards.slice(0, nFull), rest = cards.slice(nFull);
  const slivers = rest.slice(0, 12), hidden = rest.length - slivers.length;

  const face = (c: any) => {
    const soldier = c.character?.role === 'merc';
    let badge: string | undefined, badgeCls: string | undefined, note: string | undefined, dim = false;
    const on = soldier ? where(s, c) : null;
    if (soldier && q) {
      if (slot) {
        const f = slot.fits.find((x: any) => x.id === c.id);
        if (f) { badge = `${Math.round(f.coins)}c`; badgeCls = fitCls(f.coins, slot.test.bar); note = why(c, slot) || undefined }
        else dim = true;
      } else {
        const p = c.placements?.find((x: any) => x.questId === q.id);
        if (p && !(on && on.id === q.id)) { badge = `${p.attr} ${Math.round(p.coins)}`; badgeCls = fitCls(p.coins, p.bar) }
      }
    }
    if (on) { note = `→ ${shortTitle(on.title)}`; if (q && on.id !== q.id && slot) dim = true }
    const draggable = soldier || (fortMode && (c.type === 'relic' || c.character?.role === 'captive'));
    return <CardFace key={c.id} c={c} badge={badge} badgeCls={badgeCls} note={note} dim={dim} onClick={() => pick(c)}
      onDragStart={draggable ? (e => { e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; setDrag(c.id) }) : undefined}
      onDragEnd={() => setDrag(null)} />;
  };

  const counts: [Bag, string][] = [['soldiers', 'Soldiers'], ['captives', 'Captives'], ['relics', 'Relics'], ['stores', 'Stores']];
  return (
    <div className="hand">
      <div className="bags" role="tablist" aria-label="Card bags">
        {counts.map(([b, label], i) => (
          <button key={b} role="tab" className={'bag' + (bag === b ? ' on' : '')} onClick={() => setBag(b)} title={`key ${i + 1}`}>
            {label}<span className="c">{bagCards(s, b).length}</span></button>))}
        <button className={'allc' + (drawer ? ' on' : '')} onClick={openDrawer}>All cards {drawer ? '▾' : '▴'} <span>B</span></button>
      </div>
      <div className="handbar">
        {bag === 'soldiers' && (['all', 'free', 'wounded', 'placed'] as const).map(f =>
          <button key={f} className={'fc' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>{f}</button>)}
        <span className="hint">{slot ? `Sorted for the ${slot.test.attributes.join('+').toUpperCase()} place — best first. Click a card to place it.`
          : q ? 'Best for this quest first. Click a card to send them to their best place here.'
          : bag === 'soldiers' ? 'Drag a soldier onto a quest on the map · click a card to read it'
          : fortMode ? 'Drag a relic or a tamed captive onto a room to set it there' : ''}</span>
      </div>
      <div className="cards" ref={box}>
        {lock ? <span className="empty">Build a {lock} first.</span>
          : !cards.length ? <span className="empty">{bag === 'soldiers' ? 'Nobody here.' : bag === 'captives' ? 'No captives.' : bag === 'relics' ? 'No relics yet — loot comes from quests.' : 'Nothing owed.'}</span>
          : <>
            {full.map(face)}
            {slivers.map((c: any) => <button key={c.id} className={'sliver ' + (c.type === 'relic' ? 'relic' : c.character?.role === 'captive' ? 'captive' : '')}
              title={c.name} onClick={() => pick(c)} aria-label={c.name} />)}
            {rest.length > 0 && <button className="more" onClick={openDrawer}>{hidden > 0 ? `+${hidden} more · ` : ''}All cards</button>}
          </>}
      </div>
    </div>
  );
}

/** EVERY CARD — the drawer for a big collection: search, filters, and relics filed by kind */
export function Inventory({ s, close, pick }: { s: S; close: () => void; pick: (c: any) => void }) {
  const [bag, setBag] = useState<'all' | Bag>('all');
  const [text, setText] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const t = text.toLowerCase();
  const hit = (c: any) => !t || c.name.toLowerCase().includes(t) || (c.tags ?? '').toLowerCase().includes(t);
  const sec = (b: Bag) => bag === 'all' || bag === b;
  const forms: Record<string, any[]> = {};
  for (const r of s.relics.filter(hit)) (forms[formOf(r.tags)] ??= []).push(r);
  const grid = (cards: any[]) => <div className="grid">{cards.map(c =>
    <CardFace key={c.id} c={c} small onClick={() => pick(c)} note={c.location?.kind === 'quest' ? '→ ' + shortTitle(where(s, c)?.title ?? '') : undefined} />)}</div>;
  const total = s.roster.length + s.captives.length + s.relics.length + s.liabilities.length;
  return (
    <section className="drawer" aria-label="Every card">
      <div className="dnav">
        <div className="h">EVERY CARD</div>
        {([['all', 'All', total], ['soldiers', 'Soldiers', s.roster.length], ['captives', 'Captives', s.captives.length],
          ['relics', 'Relics', s.relics.length], ['stores', 'Stores', s.liabilities.length]] as const).map(([b, l, n]) =>
          <button key={b} className={'bag' + (bag === b ? ' on' : '')} onClick={() => setBag(b as any)}>{l}<span className="c">{n}</span></button>)}
        <p className="keys">1–4 bags · B opens this · Esc closes</p>
      </div>
      <div className="dmain">
        <div className="dbar">
          <input className="search" type="search" autoFocus placeholder="Search names and tags…" aria-label="Search cards" value={text} onChange={e => setText(e.target.value)} />
          <button className="btn" onClick={close}>Close ▾</button>
        </div>
        <div className="dscroll">
          {sec('soldiers') && <><div className="dsec">Soldiers <span>{s.roster.filter(hit).length}</span></div>{grid(s.roster.filter(hit))}</>}
          {sec('captives') && s.captives.length > 0 && <><div className="dsec">Captives <span>{s.captives.filter(hit).length}</span></div>{grid(s.captives.filter(hit))}</>}
          {sec('relics') && s.relics.length > 0 && <>
            <div className="dsec">Relics <span>{s.relics.length} in {Object.keys(forms).length} folders</span></div>
            <div className="grid">{Object.entries(forms).map(([f, rs]) => (
              <button key={f} className={'folder' + (open === f ? ' open' : '')} onClick={() => setOpen(open === f ? null : f)} aria-expanded={open === f}>
                <span className="l l1" /><span className="l l2" />
                <span className="l l3"><span className="fn">{FORM_LABEL[f]}</span><span className="fq">{rs.length}</span><span className="fh">{open === f ? 'open' : 'fan out'}</span></span>
              </button>))}
            </div>
            {open && forms[open] && <div className="sub">{grid(forms[open]!)}</div>}
          </>}
          {sec('stores') && s.liabilities.length > 0 && <><div className="dsec">Stores <span>stacks</span></div>{grid(s.liabilities)}</>}
        </div>
      </div>
    </section>
  );
}
