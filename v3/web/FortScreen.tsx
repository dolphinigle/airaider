// THE FORT — the hold in cross-section (FORT.md §1), each room drawn with its icon; the right panel
// is the build list (what every room does), or the room you clicked (its places, upgrades), or the
// tavern / holding when you click those.
import React, { useState } from 'react';
import { type S, RoomIcon, CardFace, Tags } from './ui';

const CW = 158, CH = 124, GX = 12, GY = 16, X0 = 64, Y0 = 96;
const CATS: [string, string][] = [['all', 'All'], ['unlocks', 'Unlocks'], ['living', 'Living'], ['prestige', 'Prestige'], ['regions', 'Regions']];

function roomLine(s: S, r: any): string {
  if (r.type === 'great-hall') return s.ghNeed ? `Tier ${s.ghTier} · T${s.ghTier + 1} at ${s.ghNeed} prestige` : `Tier ${s.ghTier}`;
  if (r.type === 'tavern') return s.tavern.length ? `${s.tavern.length} looking for work` : 'nobody looking';
  if (r.type === 'holding-cell') return s.holding.length ? `${s.holding.length} held — decide` : 'empty';
  if (r.comfort != null) return `☼ ${r.comfort.toFixed(1)}${r.owner ? ` · ${r.owner === 'you' ? 'yours' : r.owner.split(' ')[0] + '’s'}` : ''}`;
  return r.desc.replace(/\.$/, '').split(/[,:—]/)[0]!.toLowerCase();
}

export function FortScreen({ s, doAct, quick, openCard }: { s: S; doAct: any; quick: any; openCard: (id: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [cat, setCat] = useState('all');
  const rooms: any[] = s.fort.rooms;
  const room = sel ? rooms.find(r => r.id === sel) : null;
  const floors = Math.max(...s.fort.cells.map((c: any) => c.floor)) + 1;
  const cols = Math.max(...s.fort.cells.map((c: any) => c.col)) + 1;
  const at = (f: number, c: number) => ({ left: X0 + c * (CW + GX), top: Y0 + f * (CH + GY) });

  return (
    <div className="fortscreen">
      <section className="xs" aria-label="The hold, in cross-section">
        <div className="xsin" style={{ width: X0 + cols * (CW + GX) + 40, height: Y0 + (floors + 1) * (CH + GY) + 20 }}>
          <div className="sky" /><div className="ground" />
          {Array.from({ length: floors + 1 }, (_, f) => <span key={f} className="flabel" style={{ top: Y0 + f * (CH + GY) - 14 }}>{f === 0 ? 'SURFACE' : `DEPTH ${f}`}</span>)}
          {s.fort.cells.map((cell: any) => {
            const r = rooms.find(x => x.cell.floor === cell.floor && x.cell.col === cell.col);
            const pos = at(cell.floor, cell.col);
            if (!r) return <div key={`${cell.floor}:${cell.col}`} className="cell free" style={pos}><span>Free cell</span></div>;
            return (
              <button key={r.id} className={'cell' + (r.type === 'great-hall' ? ' gh' : '') + (sel === r.id ? ' sel' : '')} style={pos} onClick={() => setSel(sel === r.id ? null : r.id)}>
                <span className="ic"><RoomIcon type={r.type} size={38} /></span>
                <span className="n">{r.name.replace(/ \(.*\)$/, '')}</span>
                <span className="d">{roomLine(s, r)}</span>
                {r.slots.length > 0 && <span className="sl">{r.slots.map((x: any, i: number) => <i key={i} className={x ? 'on' : ''} />)}</span>}
              </button>);
          })}
          <button className="cell dig" style={at(floors, 0)} onClick={() => doAct('excavate')}>
            <span className="ic"><RoomIcon type="excavate" size={34} /></span><span className="n">Excavate a cell</span><span className="d">{s.excavateCost}g</span>
          </button>
        </div>
      </section>

      <aside className="panel">
        {room ? <RoomPanel s={s} room={room} doAct={doAct} quick={quick} openCard={openCard} back={() => setSel(null)} />
          : <BuildPanel s={s} cat={cat} setCat={setCat} doAct={doAct} />}
      </aside>
    </div>
  );
}

function BuildPanel({ s, cat, setCat, doAct }: any) {
  const [owner, setOwner] = useState('you');
  const hasBed = (id: string) => s.fort.rooms.some((r: any) => r.benefit === 'cap' && (r.owner === id || (id !== 'you' && r.owner === s.roster.find((m: any) => m.id === id)?.name)));
  const owners = [{ id: 'you', name: 'you' }, ...s.roster.map((m: any) => ({ id: m.id, name: m.name }))].filter(o => !hasBed(o.id));
  const rows = s.buildable.filter((b: any) => (cat === 'all' || b.category === cat) && b.reason !== 'already built');
  const built = s.buildable.filter((b: any) => b.reason === 'already built' && (cat === 'all' || b.category === cat));
  return (<>
    <div className="ph">
      <div className="h">BUILD <span>{s.gold}g · {s.freeCells} free cell{s.freeCells === 1 ? '' : 's'}</span></div>
      <p className="phsub">Prestige from rooms raises the Great Hall, which opens more rooms and regions.</p>
      <div className="cats">{CATS.map(([k, l]) => <button key={k} className={'fc' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}>{l}</button>)}</div>
    </div>
    <div className="blist">
      {rows.map((b: any) => (
        <div key={b.type} className={'brow' + (b.reason ? ' dim' : '')}>
          <span className="ic"><RoomIcon type={b.type} size={34} /></span>
          <div>
            <div className="n">{b.name}</div>
            <div className="d">{b.desc}</div>
            {b.wants?.length > 0 && <div className="w">wants: {b.wants.join(' · ')}</div>}
          </div>
          <div className="right">
            <span className="c">{b.cost}g</span>
            {b.reason ? <span className="why">{b.reason.startsWith('costs') ? `short ${b.cost - s.gold}g` : b.reason}</span>
              : b.type === 'bedroom'
                ? <span className="bed"><select value={owner} onChange={e => setOwner(e.target.value)} aria-label="whose bedroom">
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                    <button className="btn sm solid" onClick={() => doAct('build', b.type, owner)}>Build</button></span>
                : <button className="btn sm solid" onClick={() => doAct('build', b.type)}>Build</button>}
          </div>
        </div>))}
      {built.length > 0 && <div className="builtline">Built: {built.map((b: any) => b.name).join(' · ')}</div>}
    </div>
  </>);
}

function RoomPanel({ s, room, doAct, quick, openCard, back }: any) {
  const fits = s.roomFits?.[room.id] ?? [];
  const drop = (i: number) => (e: React.DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) quick('slot', room.id, i, id) };
  return (
    <div className="rd">
      <button className="btn sm" onClick={back}>← Build list</button>
      <div className="t"><span className="ic big"><RoomIcon type={room.type} size={48} /></span>
        <div><h2>{room.name}{room.style ? ` · ${room.style}` : ''}</h2><div className="k">{roomLine(s, room)}</div></div></div>
      <p className="p">{room.desc}</p>

      {room.type === 'great-hall' && (s.ghNeed
        ? <button className="btn solid" onClick={() => doAct('gh')}>Raise to Tier {s.ghTier + 1} · needs {s.ghNeed} prestige, {s.ghCost}g</button>
        : <p className="p dimp">At its peak.</p>)}

      {room.type === 'tavern' && <div className="blk"><span className="lbl">Looking for work</span>
        {s.tavern.length === 0 && <p className="p dimp">Nobody today. Recruitment jobs bring people in.</p>}
        <div className="grid">{s.tavern.map((c: any) => <div key={c.id} className="hire">
          <CardFace c={c} small onClick={() => openCard(c.id)} />
          <button className="btn sm solid" onClick={() => doAct('hire', c.id)}>Hire · {c.hireCost}g</button></div>)}</div></div>}

      {room.type === 'holding-cell' && <div className="blk"><span className="lbl">Held — decide</span>
        {s.holding.length === 0 && <p className="p dimp">Empty.</p>}
        {s.holding.map((c: any) => <div key={c.id} className="holdrow">
          <CardFace c={c} small onClick={() => openCard(c.id)} />
          <div><b>{c.name}</b><p className="p dimp">decide by cycle {c.expires}</p>
            <button className="btn sm" onClick={() => doAct('accept', c.id)}>To the cells</button> <button className="btn sm" onClick={() => doAct('ransom', c.id)}>Ransom now</button></div></div>)}</div>}

      {room.slots.length > 0 && <div className="blk">
        <span className="lbl">Set in this room — drag a {room.benefit === 'break' ? 'raw captive' : room.species === 'capacity' ? 'captive' : 'relic or tamed captive'} from the hand</span>
        <div className="rslots">{room.slots.map((x: any, i: number) => (
          <div key={i} className="rslot" onDragOver={e => e.preventDefault()} onDrop={drop(i)}>
            {x ? <CardFace c={x} small badge={`+${x.fit}`} badgeCls="good" title="click to take it out" onClick={() => quick('unslot', room.id, i)} />
              : <>
                <span>empty</span>
                {fits.length > 0 && <select defaultValue="" onChange={e => e.target.value && quick('slot', room.id, i, e.target.value)} aria-label="fill this place">
                  <option value="">best fit…</option>
                  {fits.map((f: any) => <option key={f.id} value={f.id}>{f.name} (+{f.fit})</option>)}</select>}
              </>}
          </div>))}</div>
      </div>}
      {room.wants.length > 0 && <div className="blk"><span className="lbl">It wants</span><Tags tags={room.wants.join('; ')} /></div>}

      <div className="acts">
        {room.upgradeCost && <button className="btn" onClick={() => doAct('upgrade', room.id)}>Add a place · {room.upgradeCost}g</button>}
        {room.renovateCost && <span className="restyle">Restyle ({room.renovateCost}g):
          {['human', 'elven', 'wolfkin', 'lizardkin', 'ancient', 'exotic'].map(st => <button key={st} className="btn sm ghost" onClick={() => doAct('renovate', room.id, st)}>{st}</button>)}</span>}
      </div>
    </div>
  );
}
