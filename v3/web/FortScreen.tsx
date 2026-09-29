// THE FORT — the hold in cross-section (FORT.md §1), each room drawn with its icon; the right panel
// is the build list (what every room does), or the room you clicked (its places, upgrades), the
// prisoner hub (Dungeon), the tavern or holding. Every number and verdict on this screen is the
// engine's (fort.rooms[].effect, roomPlacements, quotes, blocks, fixes) — this file only shows them.
// Every placement is ONE engine call: quick('setin', roomId, cardId, idx?) = Game.setInRoom (CLI `setin`).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type S, RoomIcon, CardFace, Tags, FixButton as SharedFix, HOLDING_SEL, scrollBehavior } from './ui';
import { ConfirmButton, useDeltaFloater, useFloaters } from './fx';

// the cross-section grid: tiles are sized from the section's width (fit at 1280), never below CW_MIN
const CH = 120, GX = 12, GY = 16, X0 = 16, Y0 = 70, CW_MAX = 158, CW_MIN = 120, SUB_MIN = 136;
const CATS: [string, string][] = [['all', 'All'], ['unlocks', 'Unlocks'], ['living', 'Living'], ['prestige', 'Prestige'], ['regions', 'Regions']];

// the rooms a Great Hall raise just opened — "NEW" on their build rows until built or clicked.
// Browser storage is a per-viewer convenience only; the page works without it.
const NEW_KEY = 'airaider.fort.newRooms';
let newRooms: string[] = (() => { try { return JSON.parse(localStorage.getItem(NEW_KEY) ?? '[]') } catch { return [] } })();
const saveNew = (v: string[]) => { newRooms = v; try { localStorage.setItem(NEW_KEY, JSON.stringify(v)) } catch { /* private window */ } };

/** the engine's refusal, first clause only ('tamed captives only — break them first' → 'tamed captives only') */
const shortReason = (r: string | null | undefined) => (r ?? '').split(' — ')[0]!;
/** '+2.7 prestige' → '+2.7 ✦' (display only) */
const star = (t: string) => t.replace(/(\d) prestige\b/g, '$1 ✦');
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const cardOf = (s: S, id: string | null) => id ? (s.captives ?? []).find((c: any) => c.id === id) ?? (s.relics ?? []).find((c: any) => c.id === id) ?? null : null;
const isHub = (r: any) => r.type === 'dungeon' || r.type === 'dungeon-cell';
const dragId = (e: React.DragEvent) => e.dataTransfer.getData('text/plain');

/** a tile's / header's one line: the engine's room effect, or what waits in a gate room */
function roomLine(s: S, r: any): string {
  if (r.type === 'great-hall') {
    const g = s.gh;
    if (!g?.next) return `Tier ${s.ghTier} · at its peak`;
    return `T${g.next}: ${Number(g.have).toFixed(1)}/${g.need} ✦`;
  }
  if (r.type === 'tavern') return s.tavern.length ? `${s.tavern.length} looking for work` : 'nobody looking';
  if (r.type === 'holding-cell') return s.holding.length ? `${s.holding.length} held — decide` : 'empty';
  if (isHub(r)) return `${s.captives.length}/${s.captiveCap} captives`;
  if (r.effect) return star(r.effect) + (r.owner ? ` · ${r.owner === 'you' ? 'yours' : r.owner.split(' ')[0] + '’s'}` : '');
  return r.desc.replace(/\.$/, '').split(/[,:—]/)[0]!.toLowerCase();
}

/** the shared FixButton (ui.tsx) with the fort's own navigation: a screen fix selects that room
 *  (or the build list) here */
function FixButton({ setSel, ...p }: { s: S; fix: any; quick: any; setSel?: (id: string | null) => void; solid?: boolean; lead?: string }) {
  return <SharedFix {...p} go={setSel ? (screen, id) => setSel(screen === 'fort' ? id : null) : undefined} />;
}

/** a rack's countdown: 'tamed by c28 · 4 left' and a pip bar. `total` = THIS captive's breaking
 *  (the engine's breakTotal, fixed when they went on — never the room's current duration) */
function RackClock({ s, doneAt, total }: { s: S; doneAt: number | null; total?: number | null }) {
  if (doneAt == null) return null;
  const left = Math.max(0, doneAt - s.cycle);
  const n = Math.max(total ?? left, left, 1);
  return <span className="rclock">
    <span className="ct">{left > 0 ? <><b>tamed by c{doneAt}</b> <span>{left} left</span></> : <b>tamed this reckoning</b>}</span>
    <span className="rpips">{Array.from({ length: n }, (_, i) => <i key={i} className={i < n - left ? 'on' : ''} />)}</span>
  </span>;
}

export function FortScreen(props: {
  s: S; doAct: any; quick: any; openCard: (id: string) => void;
  sel?: string | null; setSel?: (id: string | null) => void;
  drag?: string | null; setDrag?: (id: string | null) => void; say?: (msg: string, tone?: 'ok' | 'warn' | 'bad') => void;
  /** a room type to find in the build list (a next step's "build X" target): scrolled to and flashed */
  buildHi?: { type: string; n: number } | null;
  openHolding?: (cardId?: string) => void;
}) {
  const { s, doAct, quick, openCard } = props;
  // selection + drag live in App (the hand acts on the selected room); local fallback keeps this
  // screen usable standalone
  const [selL, setSelL] = useState<string | null>(null);
  const [dragL, setDragL] = useState<string | null>(null);
  const sel = props.setSel ? props.sel ?? null : selL;
  const setSel = props.setSel ?? setSelL;
  const drag = props.setDrag ? props.drag ?? null : dragL;
  const setDrag = props.setDrag ?? setDragL;
  const [cat, setCat] = useState('all');
  const [over, setOver] = useState<string | null>(null);
  const rooms: any[] = s.fort.rooms;
  const room = sel ? rooms.find(r => r.id === sel) : null;
  const floors = Math.max(...s.fort.cells.map((c: any) => c.floor)) + 1;
  const cols = Math.max(...s.fort.cells.map((c: any) => c.col)) + 1;

  // tile width from the section's width, so every column fits at 1280
  const xsRef = useRef<HTMLElement>(null);
  const [xsW, setXsW] = useState(0);
  useLayoutEffect(() => {
    const el = xsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setXsW(el.clientWidth));
    ro.observe(el); setXsW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const CW = xsW ? Math.max(CW_MIN, Math.min(CW_MAX, Math.floor((xsW - X0 - 14 - (cols - 1) * GX) / cols))) : CW_MAX;
  const at = (f: number, c: number) => ({ left: X0 + c * (CW + GX), top: Y0 + f * (CH + GY), width: CW });

  // a new or changed room flashes; a new one scrolls into view
  const sigOf = (r: any) => `${r.slots.map((x: any) => x?.id ?? '-').join(',')}|${r.comfort ?? ''}|${r.style ?? ''}`;
  const roomsSig = rooms.map(r => `${r.id}:${sigOf(r)}`).join(';');
  const prevSig = useRef<Record<string, string> | null>(null);
  const [fresh, setFresh] = useState<Record<string, number>>({});
  useEffect(() => {
    const sig = Object.fromEntries(rooms.map(r => [r.id, sigOf(r)]));
    const prev = prevSig.current; prevSig.current = sig;
    if (!prev) return;
    const changed = rooms.filter(r => prev[r.id] !== sig[r.id]).map(r => r.id);
    if (!changed.length) return;
    const nonce = Date.now();
    setFresh(f => { const n = { ...f }; for (const id of changed) n[id] = nonce; return n });
    const born = rooms.find(r => !(r.id in prev));
    if (born) {
      requestAnimationFrame(() => document.querySelector(`[data-room="${born.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: scrollBehavior() }));
      // a new room with places to fill opens at once: its ghost slot ("Add a place") is the next step
      if (born.kind) setSel(born.id);
    }
    // (not cleared on the next change: each change's own timer un-flashes its own rooms)
    setTimeout(() => setFresh(f => { const n = { ...f }; for (const id of changed) if (n[id] === nonce) delete n[id]; return n }), 1300);
  }, [roomsSig]);

  // THE GREAT HALL MOMENT: the tier went up (from any button) → a banner with what it opened
  const prevGh = useRef<{ tier: number; types: string[]; names: string[] }>({ tier: s.ghTier, types: s.ghUnlockTypes ?? [], names: s.ghUnlocks ?? [] });
  const [banner, setBanner] = useState<{ tier: number; types: string[]; names: string[] } | null>(null);
  useEffect(() => {
    const p = prevGh.current;
    if (s.ghTier > p.tier) {
      setBanner({ tier: s.ghTier, types: p.types, names: p.names });
      saveNew([...new Set([...newRooms, ...p.types])]);
    }
    prevGh.current = { tier: s.ghTier, types: s.ghUnlockTypes ?? [], names: s.ghUnlocks ?? [] };
  }, [s.ghTier, (s.ghUnlockTypes ?? []).join()]);

  // the card being dragged (a captive or relic, from the hand or a room) and where it can go
  const dragCard = cardOf(s, drag);
  useEffect(() => { if (!drag) setOver(null) }, [drag]);
  const placeFor = (roomId: string) => dragCard ? (dragCard.roomPlacements ?? []).find((p: any) => p.roomId === roomId) ?? null : null;
  const dropOn = (roomId: string, idx?: number) => (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const id = dragId(e) || drag;
    setOver(null); setDrag(null);
    if (id) idx === undefined ? quick('setin', roomId, id) : quick('setin', roomId, id, idx);
  };

  return (
    <div className="fortscreen">
      <section className={'xs' + (dragCard ? ' dragging' : '')} ref={xsRef} aria-label="The hold, in cross-section">
        <div className="xsin" style={{ width: X0 + cols * (CW + GX) + 2, height: Y0 + (floors + 1) * (CH + GY) + 20 }}>
          <div className="sky" /><div className="ground" />
          {Array.from({ length: floors + 1 }, (_, f) => <span key={f} className="flabel" style={{ top: Y0 + f * (CH + GY) - 14 }}>{f === 0 ? 'SURFACE' : `DEPTH ${f}`}</span>)}
          {s.fort.cells.map((cell: any) => {
            const r = rooms.find(x => x.cell.floor === cell.floor && x.cell.col === cell.col);
            const pos = at(cell.floor, cell.col);
            if (!r) return <div key={`${cell.floor}:${cell.col}`} className="cell free" style={pos}><span>Free cell</span></div>;
            return <RoomTile key={r.id} s={s} r={r} pos={pos} narrow={CW < SUB_MIN} sel={sel === r.id} fresh={!!fresh[r.id]}
              onSel={() => setSel(sel === r.id ? null : r.id)} quick={quick}
              dragging={!!dragCard} place={placeFor(r.id)} over={over === r.id}
              onOver={(v: boolean) => setOver(o => v ? r.id : o === r.id ? null : o)} onDrop={dropOn(r.id)} />;
          })}
          <button className="cell dig" style={at(floors, 0)} disabled={!!s.excavateBlock} onClick={() => quick('excavate')}
            title={s.excavateBlock ?? 'dig one more cell to build in'}>
            <span className="ic"><RoomIcon type="excavate" size={34} /></span><span className="n">Excavate a cell</span>
            <span className="d">{s.excavateCost}g{s.excavateBlock ? ` · ${s.excavateBlock}` : ''}</span>
          </button>
        </div>
      </section>

      <aside className="panel">
        {room ? <RoomPanel key={room.id} s={s} room={room} doAct={doAct} quick={quick} openCard={openCard} setSel={setSel}
          drag={drag} setDrag={setDrag} dragCard={dragCard} place={placeFor(room.id)} back={() => setSel(null)} />
          : sel === HOLDING_SEL ? <div className="rd">
              {/* holding, with no Holding cell room: the same decisions, the engine never needs the room */}
              <button className="btn sm" onClick={() => setSel(null)}>← Build list</button>
              <div className="t"><span className="ic big"><RoomIcon type="holding-cell" size={48} /></span>
                <div><h2>Holding</h2><div className="k">{s.holding.length} taken on jobs — decide before the clock runs out</div></div></div>
              <Holding s={s} quick={quick} openCard={openCard} setSel={setSel} />
            </div>
          : <BuildPanel s={s} cat={cat} setCat={setCat} doAct={doAct} quick={quick} hi={props.buildHi ?? null} />}
      </aside>

      {banner && <button className="ghbanner fx-drop-in" onClick={() => setBanner(null)} aria-label="dismiss">
        <span className="gt">THE GREAT HALL RISES — TIER {banner.tier}</span>
        {banner.types.length > 0 && <span className="gs">Now open to build</span>}
        <span className="gi">{banner.types.map((t, i) => <span key={t} className="gu"><RoomIcon type={t} size={34} /><span>{banner.names[i] ?? t}</span></span>)}</span>
        <span className="gd">click to close</span>
      </button>}
    </div>
  );
}

/** one room in the cross-section: its icon, its effect, its places — and, while a captive or relic
 *  is dragged, a DROP TARGET that says what the card would do here (or why not) */
function RoomTile({ s, r, pos, narrow, sel, fresh, onSel, quick, dragging, place, over, onOver, onDrop }: any) {
  const gh = r.type === 'great-hall';
  const ready = gh && s.ghReady;
  // juice: the room's prestige floats its change; a rack floats the new captive's due cycle
  const src = (s.prestigeSources ?? []).find((p: any) => p.roomId === r.id);
  const floatP = useDeltaFloater(r.kind === 'prestige' ? (src?.prestige ?? 0) : null,
    d => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} ✦`, { place: 'above', eps: 0.05 });
  const rackF = useFloaters('above');
  const occ = r.kind === 'rack' ? r.slots.map((x: any) => x?.id ?? '').join(',') : '';
  const prevOcc = useRef(occ);
  useEffect(() => {
    const was = prevOcc.current.split(','); prevOcc.current = occ;
    const nu = r.slots.find((x: any) => x && !was.includes(x.id));
    if (nu && nu.doneAtCycle != null) rackF.push(`⛓ tamed by c${nu.doneAtCycle}`, 'good');
  }, [occ]);

  const drop = dragging && place;   // a comfort room answering for the dragged card
  const cls = ['cell', gh && 'gh', sel && 'sel', ready && 'ready', fresh && 'fx-flash',
    drop && (place.ok ? 'can' : place.here ? 'here' : 'no'), dragging && !place && 'na', over && 'over'].filter(Boolean).join(' ');
  const hubPips = isHub(r) && s.captiveCap > 0;
  return (
    <div className={cls} style={pos} data-room={r.id} role="button" tabIndex={0} aria-pressed={sel}
      onClick={onSel} onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel() } }}
      onDragEnter={place ? e => { e.preventDefault(); onOver(true) } : undefined}
      onDragOver={place ? e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!over) onOver(true) } : undefined}
      onDragLeave={place ? e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) onOver(false) } : undefined}
      onDrop={place ? onDrop : undefined}>
      <span className="ic"><RoomIcon type={r.type} size={narrow ? 30 : 34} /></span>
      <span className="n">{r.name.replace(/ \(.*\)$/, '')}</span>
      {!(narrow && drop) && <span className="d">{roomLine(s, r)}</span>}
      {r.slots.length > 0 && <span className="sl">{r.slots.map((x: any, i: number) => <i key={i} className={x ? 'on' : ''} />)}</span>}
      {r.kind && r.slots.length === 0 && !drop && <span className="sl"><i className="ghost" title="no places yet" /></span>}
      {hubPips && <span className="sl">{Array.from({ length: s.captiveCap }, (_, i) => <i key={i} className={i < s.captives.length ? 'on cap' : ''} />)}</span>}
      {drop && <span className={'dz ' + (place.ok ? 'ok' : 'no')} title={place.label}>{place.ok
        ? place.swapWith ? `⇄ ${star(place.label).split(' · ').slice(1).join(' · ')}` : star(place.label)
        : place.here ? 'here now' : shortReason(place.reason)}</span>}
      {ready && !dragging && <button className="raise fx-pulse" onClick={e => { e.stopPropagation(); quick('gh') }}
        title={`raise the Great Hall to T${s.gh?.next} — opens ${(s.ghUnlocks ?? []).join(', ')}`}>RAISE ▸ {s.gh?.cost}g</button>}
      {floatP}{rackF.node}
    </div>
  );
}

let hiDone = 0;
function BuildPanel({ s, cat, setCat, quick, hi }: any) {
  const [owner, setOwner] = useState('');
  const [, bump] = useState(0);
  const [openTier, setOpenTier] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // a next step pointed here to build one type: show every category, open its tier group, find it
  useEffect(() => {
    if (!hi || hi.n <= hiDone) return;   // once per request, not on every return to the list
    hiDone = hi.n;
    setCat('all');
    const b = s.buildable.find((x: any) => x.type === hi.type);
    if (b?.blocker === 'tier') setOpenTier(b.ghTier);
    setFlash(hi.type);
    requestAnimationFrame(() => document.querySelector(`[data-btype="${hi.type}"]`)?.scrollIntoView({ block: 'center', behavior: scrollBehavior() }));
    const tm = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(tm);
  }, [hi?.n]);
  // who a bedroom can be built for — the engine's list (Game.bedOwners, build()'s own rule); what is
  // SENT is always what the select SHOWS (a stale 'you' was sent while the select read a soldier)
  const owners: { id: string; name: string }[] = s.buildable.find((b: any) => b.type === 'bedroom')?.owners ?? [];
  const ownerSel = owners.some(o => o.id === owner) ? owner : owners[0]?.id ?? '';
  const inCat = (b: any) => cat === 'all' || b.category === cat;
  // a "NEW" chip lasts until the room is built or its row is clicked
  const built = new Set(s.buildable.filter((b: any) => b.blocker === 'built').map((b: any) => b.type));
  if (newRooms.some(t => built.has(t))) saveNew(newRooms.filter(t => !built.has(t)));
  const seen = (t: string) => { if (newRooms.includes(t)) { saveNew(newRooms.filter(x => x !== t)); bump(n => n + 1) } };
  // build now → needs a cell → short of gold → a region first → collapsed "opens at T{n}" groups
  const ORDER: Record<string, number> = { null: 0, cell: 1, gold: 2, region: 3 };
  const live = s.buildable.filter((b: any) => inCat(b) && b.blocker !== 'built' && b.blocker !== 'tier')
    .sort((a: any, b: any) => (ORDER[String(a.blocker)] ?? 4) - (ORDER[String(b.blocker)] ?? 4)
      || Number(newRooms.includes(b.type)) - Number(newRooms.includes(a.type)) || a.cost - b.cost);
  const tiers = new Map<number, any[]>();
  for (const b of s.buildable.filter((b: any) => inCat(b) && b.blocker === 'tier')) tiers.set(b.ghTier, [...(tiers.get(b.ghTier) ?? []), b]);
  const builtRows = s.buildable.filter((b: any) => b.blocker === 'built' && inCat(b));

  const row = (b: any) => {
    const isNew = newRooms.includes(b.type);
    const why = b.blocker === 'gold' ? (b.reason?.match(/short \d+g/)?.[0] ?? b.reason) : b.blocker === 'cell' ? 'needs a free cell' : b.reason;
    return (
      <div key={b.type} data-btype={b.type} className={'brow' + (b.blocker ? ' dim' : '') + (b.blocker === 'tier' ? ' locked' : '') + (flash === b.type ? ' hi fx-flash' : '')} onClick={() => seen(b.type)}>
        <span className="ic"><RoomIcon type={b.type} size={34} /></span>
        <div>
          <div className="n">{b.name}{isNew && <span className="newchip">NEW</span>}</div>
          <div className="d">{b.desc}</div>
          {(b.wants?.length > 0 || b.firstPlaceCost) && <div className="w">
            {b.wants?.length > 0 && <>wants: {b.wants.join(' · ')}</>}
            {b.firstPlaceCost ? <span className="fp">{b.wants?.length ? ' · ' : ''}first place +{b.firstPlaceCost}g</span> : null}</div>}
          {!b.blocker && b.type === 'bedroom' && <label className="bed">whose bedroom
            <select value={ownerSel} onChange={e => setOwner(e.target.value)}>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
        </div>
        <div className="right">
          <span className="c">{b.cost}g</span>
          {b.blocker ? <span className="why">{why}</span>
            : <button className="btn sm solid" onClick={e => { e.stopPropagation(); seen(b.type); b.type === 'bedroom' ? quick('build', b.type, ownerSel) : quick('build', b.type) }}>Build</button>}
        </div>
      </div>);
  };

  return (<>
    <div className="ph">
      <div className="h">BUILD <span>{s.gold}g · {plural(s.freeCells, 'free cell')}</span></div>
      {s.freeCells === 0 && <button className="btn solid dig1" disabled={!!s.excavateBlock} onClick={() => quick('excavate')}>
        Excavate a cell · {s.excavateCost}g{s.excavateBlock ? ` — ${s.excavateBlock}` : ''}</button>}
      <p className="phsub">Rooms that show relics and tamed captives earn prestige; prestige raises the Great Hall, which opens more rooms and regions.</p>
      <div className="cats">{CATS.map(([k, l]) => <button key={k} className={'fc' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}>{l}</button>)}</div>
    </div>
    <div className="blist">
      {live.map(row)}
      {[...tiers.entries()].sort((a, b) => a[0] - b[0]).map(([t, bs]) => (
        <div key={t} className="tiergrp">
          <button className="tierh" onClick={() => setOpenTier(openTier === t ? null : t)} aria-expanded={openTier === t}>
            <span>{openTier === t ? '▾' : '▸'} Opens at Great Hall T{t} ({bs.length})</span>
            <span className="tic">{bs.slice(0, 7).map((b: any) => <RoomIcon key={b.type} type={b.type} size={20} />)}</span>
          </button>
          {openTier === t && bs.map(row)}
        </div>))}
      {builtRows.length > 0 && <div className="builtline">Built: {builtRows.map((b: any) => b.name).join(' · ')}</div>}
    </div>
  </>);
}

function RoomPanel({ s, room, doAct, quick, openCard, setSel, drag, setDrag, dragCard, place, back }: any) {
  const [overSlot, setOverSlot] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { if (!drag) setOverSlot(null) }, [drag]);
  // the room's candidates, ranked by the engine (roomFits = card ids); each row is that card's own
  // roomPlacements row for this room
  const byId = new Map([...(s.captives ?? []), ...(s.relics ?? [])].map((c: any) => [c.id, c]));
  const fits: any[] = (s.roomFits?.[room.id] ?? []).map((id: string) => {
    const c: any = byId.get(id);
    const p = c?.roomPlacements?.find((x: any) => x.roomId === room.id);
    return p ? { ...p, id, name: c.name } : null;
  }).filter(Boolean);
  // a card dragged over THIS room: what a drop on each place does (Game.roomSlotPlans — an occupied
  // place swaps; its price is said before the drop, never after)
  const [slotPlans, setSlotPlans] = useState<{ card: string; plans: any[] } | null>(null);
  useEffect(() => {
    if (!dragCard || !room.slots.some(Boolean)) { setSlotPlans(null); return }
    let live = true;
    fetch(`/api/slotplans?room=${encodeURIComponent(room.id)}&card=${encodeURIComponent(dragCard.id)}`).then(r => r.json())
      .then(plans => { if (live) setSlotPlans({ card: dragCard.id, plans }) }).catch(() => {});
    return () => { live = false };
  }, [dragCard?.id, room.id, room.slots.map((x: any) => x?.id ?? '').join()]);
  const planAt = (i: number) => slotPlans && dragCard && slotPlans.card === dragCard.id ? slotPlans.plans[i] ?? null : null;
  const okFits = fits.filter(f => f.ok);
  // (a 0-place room's "no places yet" is said by its ghost slot, not repeated here)
  const refused = fits.filter(f => !f.ok && !(room.slots.length === 0 && /^no (places|racks) yet/.test(f.reason ?? '')));
  const refusedWhy = [...refused.reduce((m, f) => m.set(shortReason(f.reason), (m.get(shortReason(f.reason)) ?? 0) + 1), new Map<string, number>())];
  const rack = room.kind === 'rack';
  const dropSlot = (i: number) => (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const id = dragId(e) || drag;
    setOverSlot(null); setDrag(null);
    if (id) quick('setin', room.id, id, i);
  };
  const slotDrag = (i: number) => ({
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); setOverSlot(i) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (overSlot !== i) setOverSlot(i) },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverSlot(o => o === i ? null : o) },
    onDrop: dropSlot(i),
  });
  const g = s.gh;

  return (
    <div className="rd">
      <button className="btn sm" onClick={back}>← Build list</button>
      <div className="t"><span className="ic big"><RoomIcon type={room.type} size={48} /></span>
        <div><h2>{room.name}{room.style ? ` · ${room.style}` : ''}</h2><div className="k">{roomLine(s, room)}</div></div></div>
      <p className="p">{room.desc}</p>

      {room.type === 'great-hall' && (g?.next ? <div className="blk ghp">
        <span className="lbl">Raise to Tier {g.next}</span>
        <div className="check">
          <span className={g.prestigeOk ? 'gok' : 'gmiss'}>{g.prestigeOk ? '✓' : '✗'} Prestige {Number(g.have).toFixed(1)}/{g.need}</span>
          <span className={g.goldOk ? 'gok' : 'gmiss'}>{g.goldOk ? '✓' : '✗'} Gold {g.gold}/{g.cost}</span>
        </div>
        <button className={'btn' + (s.ghReady ? ' solid fx-pulse' : '')} disabled={!s.ghReady} onClick={() => quick('gh')}>
          {s.ghReady ? `RAISE THE GREAT HALL ▸ ${g.cost}g` : `Raise to Tier ${g.next} · ${g.cost}g`}</button>
        {s.ghBlock && <span className="why">{s.ghBlock}</span>}
        {!s.ghReady && g.fix && <FixButton s={s} fix={g.fix} quick={quick} setSel={setSel} />}
        {(s.prestigeSources ?? []).length > 0 && <div className="srcs"><span className="lbl">Prestige comes from</span>
          {s.prestigeSources.map((p: any) => <button key={p.roomId} className="src" onClick={() => setSel(p.roomId)}>
            <RoomIcon type={(s.fort.rooms.find((r: any) => r.id === p.roomId) ?? {}).type ?? 'garden'} size={18} />
            <span>{p.name}</span>{p.prestige > 0.05 ? <b>+{Number(p.prestige).toFixed(1)} ✦</b> : <b className="none">nothing yet</b>}</button>)}</div>}
        {(s.ghUnlockTypes ?? []).length > 0 && <div className="opens"><span className="lbl">Opens at T{g.next}</span>
          <div className="gi">{s.ghUnlockTypes.map((t: string, i: number) => <span key={t} className="gu"><RoomIcon type={t} size={28} /><span>{s.ghUnlocks[i] ?? t}</span></span>)}</div></div>}
      </div> : <p className="p dimp">At its peak.</p>)}

      {room.type === 'tavern' && <div className="blk"><span className="lbl">Looking for work</span>
        {s.tavern.length === 0 && <p className="p dimp">Nobody today. Recruitment jobs bring people in.</p>}
        <div className="grid">{s.tavern.map((c: any) => <div key={c.id} className="hire">
          <CardFace c={c} small onClick={() => openCard(c.id)} />
          <button className="btn sm solid" disabled={!!c.hireBlock} title={c.hireBlock?.reason} onClick={() => quick('hire', c.id)}>Hire · {c.hireCost}g</button>
          {c.hireBlock && <span className="why">{c.hireBlock.reason}</span>}
          {c.hireBlock?.fix && <FixButton s={s} fix={c.hireBlock.fix} quick={quick} setSel={setSel} />}
        </div>)}</div></div>}

      {room.type === 'holding-cell' && <Holding s={s} quick={quick} openCard={openCard} setSel={setSel} />}
      {isHub(room) && <PrisonerHub s={s} quick={quick} doAct={doAct} openCard={openCard} setSel={setSel} />}

      {room.kind && <div className="blk">
        <span className="lbl">{rack ? 'Racks — raw captives come off tamed' : `Places — ${room.accepts ?? 'relics & tamed captives'}`}</span>
        <div className="rslots">
          {room.slots.map((x: any, i: number) => {
            const o = overSlot === i && !!dragCard;
            const can = !!dragCard && !!place?.ok && !x;
            const pl = x ? planAt(i) : null;   // an occupied place: the engine's plan for a drop right here
            const cls = ['rslot', x && 'full', can && 'can', o && (x ? (rack || (pl && !pl.ok) ? 'over no' : pl?.tone === 'bad' ? 'over swap loses' : 'over swap') : place?.ok ? 'over' : 'over no')].filter(Boolean).join(' ');
            return (
              <div key={i} className={cls} {...slotDrag(i)}>
                {x ? <>
                  <CardFace c={x} small title={`${x.name} — click to read`}
                    badge={rack ? undefined : x.prestigeShare > 0 ? `+${x.prestigeShare} ✦` : room.kind === 'prestige' ? 'no match' : undefined}
                    badgeCls={x.prestigeShare > 0 ? 'good' : 'nomatch'}
                    onClick={() => openCard(x.id)}
                    onDragStart={e => { e.dataTransfer.setData('text/plain', x.id); e.dataTransfer.effectAllowed = 'move'; setDrag(x.id) }}
                    onDragEnd={() => setDrag(null)} />
                  {rack && <RackClock s={s} doneAt={x.doneAtCycle} total={x.breakTotal} />}
                  {!rack && x.shareEffect && room.kind === 'function' && <span className="rclock"><span className="ct">without: {x.shareEffect}</span></span>}
                  <ConfirmButton className={'rx' + (rack ? ' rackx' : '')} needsConfirm={rack}
                    title={rack ? `Take off the rack — ${x.rackLoss ?? 'breaking lost'}` : `Take out${x.prestigeShare > 0 ? ` (−${x.prestigeShare} prestige)` : ''}`}
                    label={<><span className="xx">✕</span><span className="xl">{rack ? 'Take off the rack' : `Take out${x.prestigeShare > 0 ? ` −${x.prestigeShare} ✦` : ''}`}</span></>}
                    armedLabel={<span className="xa">Take off the rack?<br /><b>{x.rackLoss ?? 'breaking lost'}</b><br />click again</span>}
                    onConfirm={() => quick('unslot', room.id, i)} />
                  {o && <span className="ov">{rack ? 'racks never swap' : pl ? (pl.ok ? `⇄ ${star(pl.badge ?? pl.label)}` : shortReason(pl.reason)) : 'swap'}</span>}
                </> : <>
                  <span className="em">{o ? (place?.ok ? 'drop here' : shortReason(place?.reason)) : can ? star(place.label) : 'empty'}</span>
                  {!dragCard && okFits[0] && <button className="btn sm ghost best" onClick={() => quick('setin', room.id, okFits[0].id, i)}
                    title={`${okFits[0].name}: ${okFits[0].label}`}><b>{okFits[0].name.split(' ')[0]}</b>{star(okFits[0].label).replace(/^swap for .*? · /, '')}</button>}
                </>}
              </div>);
          })}
          {room.addPlace && <div className="rslot ghostslot">
            <button className="add" disabled={!!room.addPlace.block} onClick={() => room.addPlace.action === 'upgrade' ? quick('upgrade', room.id) : quick('gh')}
              title={room.addPlace.block ?? room.addPlace.label}>
              <span className="plus">+</span>
              {/* at the tier's depth: the tier the ENGINE says adds places (fix.tier), never "the next one" */}
              <span>{room.addPlace.action === 'gh' ? `More ${rack ? 'racks' : 'places'} at GH T${room.addPlace.tier}` : room.addPlace.label.split(' · ')[0]}</span>
              <b>{room.addPlace.cost}g</b>
              {room.addPlace.block && <em>{room.addPlace.block}</em>}
            </button>
          </div>}
        </div>
      </div>}

      {room.kind && okFits.length > 0 && <div className="blk cands"><span className="lbl">Could go here — best first</span>
        {(showAll ? okFits : okFits.slice(0, 5)).map(f => <div key={f.id} className={'cand' + (f.tone === 'bad' ? ' loses' : '')}>
          <button className="cn" onClick={() => openCard(f.id)}>{f.name}</button>
          <span className="cl">{star(f.label)}</span>
          <button className="btn sm solid" onClick={() => quick('setin', room.id, f.id)}>Set</button>
        </div>)}
        {okFits.length > 5 && <button className="link" onClick={() => setShowAll(v => !v)}>{showAll ? 'fewer' : `all ${okFits.length}`}</button>}
      </div>}
      {room.kind && refusedWhy.length > 0 && <p className="refused">Can’t go here: {refusedWhy.map(([w, n]) => `${w} (${n})`).join(' · ')}</p>}
      {room.wants.length > 0 && <div className="blk"><span className="lbl">It wants</span><Tags tags={room.wants.join('; ')} /></div>}

      {room.renovateCost && <div className="acts"><span className="restyle">Restyle ({room.renovateCost}g{room.renovateBlock ? ` — ${room.renovateBlock}` : ''}):
        {['human', 'elven', 'wolfkin', 'lizardkin', 'ancient', 'exotic'].map(st => <button key={st} className="btn sm ghost" disabled={!!room.renovateBlock}
          onClick={() => doAct('renovate', room.id, st)}>{st}</button>)}</span></div>}
    </div>
  );
}

/** holding: every decision with its price, and the full-cells refusal BEFORE the click */
function Holding({ s, quick, openCard, setSel }: any) {
  return <div className="blk"><span className="lbl">Held — decide</span>
    {s.holding.length === 0 && <p className="p dimp">Empty.</p>}
    {s.holding.map((c: any) => {
      const left = c.expires - s.cycle;
      return <div key={c.id} className="holdrow">
        <CardFace c={c} small onClick={() => openCard(c.id)} />
        <div className="hb">
          <b>{c.name}</b>
          <span className={'lapse' + (left <= 1 ? ' hot' : '')}>{c.deadline}{c.lapseQuote != null ? ` at the quick price ~${c.lapseQuote}g` : ''}</span>
          <Tags tags={c.tags} />
          <div className="hacts">
            <button className="btn sm solid" disabled={!!c.acceptBlock} title={c.acceptBlock?.reason} onClick={() => quick('accept', c.id)}>To the cells</button>
            {c.ransomEst != null && <button className="btn sm" onClick={() => quick('ransom', c.id)}>Ransom now · ~{c.ransomEst}g</button>}
            {c.sellEst != null && <button className="btn sm ghost" onClick={() => quick('sell', c.id)}>Sell · ~{c.sellEst}g</button>}
          </div>
          {c.acceptBlock && <div className="hfix"><span className="why">{c.acceptBlock.reason}</span><FixButton s={s} fix={c.acceptBlock.fix} quick={quick} setSel={setSel} /></div>}
        </div>
      </div>;
    })}
  </div>;
}

/** THE PRISONER HUB (the Dungeon): holding → cells → rack → tamed → on show, as one picture, each
 *  captive with the one-click next step (or the fix that makes it possible) */
function PrisonerHub({ s, quick, doAct, openCard, setSel }: any) {
  const caps: any[] = s.captives ?? [];
  const by = (st: string) => caps.filter(c => c.state === st);
  const groups: [string, string, any[]][] = [
    ['raw', 'In the cells — raw', by('raw')], ['breaking', 'On the rack', by('breaking')],
    ['tamed', 'Tamed — ready to show', by('tamed')], ['onShow', 'On show', by('onShow')]];
  const holdRoom = s.fort.rooms.find((r: any) => r.type === 'holding-cell');
  // Holding opens whenever someone is IN holding — with or without a Holding cell room
  const steps: [string, number, (() => void) | null][] = [
    ['Holding', s.holding.length, holdRoom ? () => setSel(holdRoom.id) : s.holding.length ? () => setSel(HOLDING_SEL) : null],
    ['Cells', by('raw').length, null], ['Rack', by('breaking').length, null], ['Tamed', by('tamed').length, null], ['On show', by('onShow').length, null]];
  // on a rack (breaking lost) or on show (prestige lost): cashing out asks twice and says what goes
  const sellBtns = (c: any) => (c.rackLoss ?? c.cashLoss)
    ? <>
      {c.ransomEst != null && <ConfirmButton className="btn sm" label={`Ransom · ~${c.ransomEst}g`} armedLabel={`Ransom? ${c.rackLoss ?? c.cashLoss}`} onConfirm={() => quick('ransom', c.id)} />}
      {c.sellEst != null && <ConfirmButton className="btn sm ghost" label={`Sell · ~${c.sellEst}g`} armedLabel={`Sell? ${c.rackLoss ?? c.cashLoss}`} onConfirm={() => quick('sell', c.id)} />}
    </> : <>
      {c.ransomEst != null && <button className="btn sm" onClick={() => quick('ransom', c.id)}>Ransom · ~{c.ransomEst}g</button>}
      {c.sellEst != null && <button className="btn sm ghost" onClick={() => quick('sell', c.id)}>Sell · ~{c.sellEst}g</button>}
    </>;
  const next = (c: any) => {
    const rows: any[] = c.roomPlacements ?? [];
    // nothing takes them: the engine's ONE choice of place to make (c.placeFix — the CLI's Dungeon view
    // and the next-steps scroll name the same), with the room it is for
    const make = (why: string) => c.placeFix
      ? <><span className="why">{why}</span><FixButton s={s} fix={c.placeFix.fix} quick={quick} setSel={setSel} solid lead={`${c.placeFix.roomName}:`} /></>
      : <span className="why">{why}</span>;
    if (c.state === 'raw') {
      const r = rows.find(p => p.kind === 'rack' && p.ok);
      if (r) return <button className="btn sm solid" onClick={() => quick('setin', r.roomId, c.id)}>Rack · {r.label}</button>;
      return make(shortReason(rows.find(p => p.kind === 'rack')?.reason ?? 'no rack'));
    }
    if (c.state === 'breaking') {
      const loc = c.location?.kind === 'room' ? c.location : null;
      return <>
        <RackClock s={s} doneAt={c.doneAt} total={c.breakTotal} />
        {loc && <ConfirmButton className="btn sm ghost" label="Take off" armedLabel={`Take off? ${c.rackLoss ?? 'breaking lost'}`}
          onConfirm={() => quick('unslot', loc.roomId, loc.slot)} />}
      </>;
    }
    if (c.state === 'tamed') {
      const best = rows.find(p => p.ok);
      if (best) return <button className="btn sm solid" onClick={() => quick('setin', best.roomId, c.id)}>Set in {best.roomName} · {star(best.label)}</button>;
      return make('no free place');
    }
    if (c.state === 'onShow') return <button className="btn sm ghost" onClick={() => setSel(c.whereId)}>in the {c.whereName} →</button>;
    return null;
  };
  return <>
    <div className="blk">
      <span className="lbl">The prisoners · {caps.length}/{s.captiveCap} — counts captives in the cells, on the rack or on show; holding does not count until you take them</span>
      <div className="pipe">{steps.map(([l, n, go], i) => <React.Fragment key={l}>
        {i > 0 && <span className="arr">→</span>}
        <button className={'step' + (n ? ' has' : '')} disabled={!go} onClick={go ?? undefined}><b>{n}</b><span>{l}</span></button>
      </React.Fragment>)}</div>
    </div>
    {groups.map(([k, label, cs]) => cs.length > 0 && <div key={k} className="blk">
      <span className="lbl">{label} ({cs.length})</span>
      {cs.map(c => <div key={c.id} className="caprow">
        <CardFace c={c} small onClick={() => openCard(c.id)} />
        <div className="hb">
          <b>{c.name}</b>
          <div className="hacts">{next(c)}</div>
          <div className="hacts">
            {(k === 'raw' || k === 'tamed' || k === 'breaking') && sellBtns(c)}
            {s.can?.interrogate && !c.interrogated && k !== 'onShow' && <button className="btn sm ghost" onClick={() => doAct('interrogate', c.id)}>Interrogate</button>}
          </div>
        </div>
      </div>)}
    </div>)}
    {caps.length === 0 && <p className="p dimp">Nobody in the cells. Capture quests bring prisoners to holding.</p>}
  </>;
}
