// Airaider v3 web GUI — tabs over the /api view-model. The human-facing board.
import React, { useEffect, useState, useCallback } from 'react';

type S = any; // the /api/state view-model (prototype: untyped client)

async function act(type: string, ...args: (string | number)[]) {
  const r = await fetch('/api/action', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, args }),
  });
  return r.json() as Promise<{ ok: boolean; msg: string }>;
}

const RARITY_COLOR: Record<string, string> = { common: '#9aa', uncommon: '#6c6', rare: '#c8f' };

export function App() {
  const [s, setS] = useState<S | null>(null);
  const [tab, setTab] = useState('fort');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setS(await (await fetch('/api/state')).json());
  }, []);
  useEffect(() => { refresh() }, [refresh]);

  const doAct = async (type: string, ...args: (string | number)[]) => {
    setBusy(true);
    const r = await act(type, ...args);
    setToast(r.msg);
    await refresh();
    setBusy(false);
    setTimeout(() => setToast(''), 4000);
  };

  if (!s) return <div className="app">loading…</div>;

  return (
    <div className="app">
      <header>
        <b>AIRAIDER</b>
        <span>cycle {s.cycle}</span>
        <span className="gold">{s.gold}g</span>
        <span className="prestige">P {s.prestige.toFixed(1)}{s.ghNeed ? `/${s.ghNeed}` : ''}</span>
        <span>GH T{s.ghTier}</span>
        <span>mercs {s.roster.length}/{s.rosterCap}</span>
        <span>captives {s.captives.length}/{s.captiveCap}</span>
        <span className="ai">AI: {s.aiName} ({s.ai.calls} calls{s.aiName === 'openai' ? `, ~$${s.ai.costUsd.toFixed(2)}` : ''})</span>
        <button className="end" disabled={busy} onClick={() => doAct('end')}>{busy ? '…' : 'END CYCLE ▶'}</button>
      </header>
      {toast && <div className="toast">{toast}</div>}
      <nav>
        {['fort', 'build', 'leads', 'quests', 'roster', 'captives', 'items', 'chains', 'people', 'lore', 'log', 'ai'].map(t =>
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </nav>
      <main>
        {tab === 'fort' && <Fort s={s} doAct={doAct} setDetail={setDetail} />}
        {tab === 'build' && <Build s={s} doAct={doAct} />}
        {tab === 'leads' && <Leads s={s} doAct={doAct} />}
        {tab === 'quests' && <Quests s={s} doAct={doAct} />}
        {tab === 'roster' && <Roster s={s} doAct={doAct} />}
        {tab === 'captives' && <Captives s={s} doAct={doAct} />}
        {tab === 'items' && <Items s={s} doAct={doAct} />}
        {tab === 'chains' && <Chains s={s} />}
        {tab === 'people' && <People s={s} doAct={doAct} />}
        {tab === 'lore' && <Lore s={s} />}
        {tab === 'log' && <Log s={s} />}
        {tab === 'ai' && <AiLog s={s} />}
      </main>
      {s.lastReport?.length > 0 && tab === 'fort' && (
        <section className="report">
          <h3>Last reckoning</h3>
          {s.lastReport.map((l: string, i: number) => <p key={i}>{l}</p>)}
        </section>
      )}
      {detail && <RoomDetail s={s} roomId={detail} doAct={doAct} close={() => setDetail(null)} />}
    </div>
  );
}

function Fort({ s, doAct, setDetail }: { s: S; doAct: any; setDetail: (id: string) => void }) {
  const floors: Record<number, any[]> = {};
  for (const c of s.fort.cells) (floors[c.floor] ??= []).push(c);
  return (
    <div>
      <div className="fortgrid">
        {Object.entries(floors).map(([f, cells]) => (
          <div className="floor" key={f}>
            {(cells as any[]).sort((a, b) => a.col - b.col).map(cell => {
              const room = s.fort.rooms.find((r: any) => r.cell.floor === cell.floor && r.cell.col === cell.col);
              return (
                <div key={cell.col} className={`cell ${room ? room.species : 'empty'}`}
                  onClick={() => room && setDetail(room.id)}>
                  {room ? <>
                    <b>{room.name}</b>
                    {room.comfort !== null && <span className="comfort">☼ {room.comfort.toFixed(1)}</span>}
                    {room.owner && <span className="owner">{room.owner}</span>}
                    {room.slots.length > 0 && <span className="slots">{room.slots.map((x: any) => x ? '◉' : '○').join('')}</span>}
                  </> : <i>empty</i>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="row">
        <button onClick={() => doAct('excavate')}>Excavate +1 cell ({s.excavateCost}g)</button>
        {s.ghNeed && <button onClick={() => doAct('gh')}>Raise Great Hall → T{s.ghTier + 1} (needs P{s.ghNeed}, {s.ghCost}g)</button>}
      </div>
    </div>
  );
}

function RoomDetail({ s, roomId, doAct, close }: any) {
  const room = s.fort.rooms.find((r: any) => r.id === roomId);
  if (!room) return null;
  const fits = s.roomFits[roomId] ?? [];
  return (
    <div className="modal" onClick={close}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h3>{room.name} {room.style ? `(${room.style})` : ''} <button className="x" onClick={close}>×</button></h3>
        {room.comfort !== null && <p>comfort <b>{room.comfort.toFixed(1)}</b> · wants: {room.wants.join(', ') || '—'}</p>}
        {room.slots.map((slot: any, i: number) => (
          <div key={i} className="slotrow">
            <span>slot {i}: {slot ? `${slot.name} (fit ${slot.fit}) [${slot.tags}]` : '(empty)'}</span>
            {slot && <button onClick={() => doAct('unslot', room.id, i)}>free</button>}
            {!slot && fits.length > 0 && (
              <select defaultValue="" onChange={e => e.target.value && doAct('slot', room.id, i, e.target.value)}>
                <option value="">— fill (best fit first) —</option>
                {fits.map((f: any) => <option key={f.id} value={f.id}>{f.name} (fit {f.fit})</option>)}
              </select>
            )}
          </div>
        ))}
        <div className="row">
          {room.upgradeCost && <button onClick={() => doAct('upgrade', room.id)}>Upgrade +1 slot ({room.upgradeCost}g)</button>}
          {room.renovateCost && ['human', 'elven', 'wolfkin', 'lizardkin', 'ancient', 'exotic'].map(st =>
            <button key={st} onClick={() => doAct('renovate', room.id, st)}>{st} ({room.renovateCost}g)</button>)}
        </div>
      </div>
    </div>
  );
}

function Build({ s, doAct }: any) {
  return (
    <table><tbody>
      {s.buildable.map((b: any) => (
        <tr key={b.type} className={b.reason ? 'dim' : ''}>
          <td>{b.name}</td><td>{b.cost}g</td>
          <td>{b.reason ?? <button onClick={() => doAct('build', b.type)}>build</button>}</td>
        </tr>
      ))}
    </tbody></table>
  );
}

function Leads({ s, doAct }: any) {
  if (!s.leads.length) return <p>The board is empty — leads are earned: run hunts, finish quests.</p>;
  return (
    <table><tbody>
      {s.leads.map((l: any) => (
        <tr key={l.id}>
          <td style={{ color: RARITY_COLOR[l.rarity] }}>{l.rarity}</td>
          <td>L{l.level}</td><td>{l.region}</td><td>{l.archetype}</td>
          <td>{l.chain === 'starts-new' ? '✦ story' : l.chain === 'continues' ? '⛓ continues' : ''}</td>
          <td>{l.title ?? ''}</td>
          <td>{l.expires === null ? 'standing' : `expires c${l.expires}`}</td>
          <td><button onClick={() => doAct('pursue', l.id)}>pursue</button></td>
        </tr>
      ))}
    </tbody></table>
  );
}

function Quests({ s, doAct }: any) {
  if (!s.quests.length) return <p>No open quests. Pursue a lead.</p>;
  return (
    <div>
      {s.quests.map((q: any) => (
        <div className="quest" key={q.id}>
          <h3>{q.title} <small>L{q.level} · <span style={{ color: RARITY_COLOR[q.rarity] }}>{q.rarity}</span> · {q.region} · lapses c{q.lapsesAtCycle}{q.isFinale ? ' · 🎬 FINALE' : q.chainId ? ` · beat ${q.beat}` : ''}</small></h3>
          <p>{q.situation}</p>
          <p><b>JOB:</b> {q.job} · <b>REWARD:</b> {q.rewardEnvelope}</p>
          {q.approaches && (
            <div className="approaches">
              <b>APPROACH (each branch rolls its own test):</b>
              {q.approaches.map((a: any) => {
                const sl = q.slots.find((x: any) => x.groupId === a.id);
                return (
                  <div key={a.id} className="slotrow">
                    <button className={q.chosenApproach === a.id ? 'on' : ''}
                      onClick={() => doAct('approach', q.id, a.id)}>{a.label} → {a.rewardKind}</button>
                    {sl && <span>tests <b>{sl.test.attributes.join('+').toUpperCase()}</b> ({sl.test.difficulty}, bar {sl.test.bar.toFixed(1)})
                      {sl.test.favored.length > 0 && <> · favors <i>{sl.test.favored.join(', ')}</i></>}
                      {sl.fits?.[0] && <> · best: {sl.fits[0].name} {sl.fits[0].coins}c</>}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {q.slots.filter((sl: any) => !q.approaches || sl.groupId === q.chosenApproach).map((sl: any) => (
            <div key={sl.idx} className="slotrow">
              <span>
                tests <b>{sl.test.attributes.join('+').toUpperCase()}</b> ({sl.test.difficulty}, bar {sl.test.bar.toFixed(1)})
                {sl.test.favored.length > 0 && <> · favors <i>{sl.test.favored.join(', ')}</i></>}
                {sl.test.clashing.length > 0 && <> · clashes <i>{sl.test.clashing.join(', ')}</i></>}
              </span>
              {sl.filledBy
                ? <span title={sl.filledExplain ?? ''}><b>{sl.filledBy}</b> <small>({sl.filledExplain})</small> <button onClick={() => doAct('unassign', q.id, sl.idx)}>×</button></span>
                : <select defaultValue="" onChange={e => e.target.value && doAct('assign', q.id, sl.idx, e.target.value)}>
                    <option value="">— assign (best coins first) —</option>
                    {sl.fits.map((f: any) => <option key={f.id} value={f.id} title={f.explain}>{f.name} ({f.coins}c · {f.explain})</option>)}
                  </select>}
            </div>
          ))}
          <p className="odds">
            ODDS: {q.odds.coins} coins vs bar {q.odds.bar.toFixed(1)}
            {q.odds.success !== null && <> → success <b>{Math.round(q.odds.success * 100)}%</b> · partial+ {Math.round(q.odds.partial * 100)}%{q.odds.precision === 1 ? ' (coarse)' : ''}</>}
            {q.odds.success === null && ' (build an Oracle for %)'}
            <button className="danger" onClick={() => doAct('abandon', q.id)}>abandon</button>
          </p>
        </div>
      ))}
    </div>
  );
}

function Roster({ s, doAct }: any) {
  return (
    <div>
      {s.roster.map((m: any) => (
        <div className="cardrow" key={m.id}>
          <h3>{m.name} <small>L{m.character.level}/{m.cap}{m.character.level >= m.cap ? ' ⛔CAP' : ''} · xp {m.character.xp}/{m.xpNeeded} · {m.character.injury > 0 ? `🩸${m.character.injury} (~${m.healEta?.cycles}c to heal)` : 'healthy'} · {m.location.kind === 'quest' ? '⚔ committed' : 'free'}</small></h3>
          <p className="tags">{m.tags}</p>
          <p>STR {m.character.attrs.str.toFixed(1)} · DEX {m.character.attrs.dex.toFixed(1)} · INT {m.character.attrs.int.toFixed(1)} · CHA {m.character.attrs.cha.toFixed(1)} · CON {m.character.attrs.con.toFixed(1)}</p>
          {m.character.who && <p><i>{m.character.who}</i></p>}
          {m.character.quirks?.length > 0 && <p className="quirks">✦ {m.character.quirks.join(' · ')}</p>}
          <details><summary>story · dossier · focus</summary>
            {m.character.backstory && <p>{m.character.backstory}</p>}
            <pre>{m.dossier}</pre>
            <p>focus: {JSON.stringify(m.character.focus)}
              {['str', 'dex', 'int', 'cha', 'con'].map(a =>
                <button key={a} onClick={() => doAct('focus', m.id, 'single', a)}>{a}</button>)}
              <button onClick={() => doAct('focus', m.id, 'none')}>none</button>
            </p>
            {m.character.injury > 0 && <button onClick={() => doAct('heal', m.id)}>pay-heal (Hospital)</button>}
          </details>
        </div>
      ))}
    </div>
  );
}

function Captives({ s, doAct }: any) {
  if (!s.captives.length) return <p>No captives. Capture quests need a Dungeon.</p>;
  return (
    <div>
      {s.captives.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <small>mark {c.value}g · ransom ~{c.ransomEst}g · {c.character.obedient ? 'obedient' : c.breaking ? `breaking (done c${c.breaking})` : 'raw'}{c.location.kind === 'room' ? ` · stationed` : ''}</small></h3>
          <p className="tags">{c.tags}</p>
          <div className="row">
            <button onClick={() => doAct('ransom', c.id)}>ransom</button>
            {!c.interrogated && <button onClick={() => doAct('interrogate', c.id)}>interrogate (→ lead)</button>}
          </div>
        </div>
      ))}
      <p className="hint">Break raw captives on the Torture chamber racks (fort → room → fill), then station the obedient in rooms.</p>
    </div>
  );
}

function Items({ s, doAct }: any) {
  return (
    <div>
      {s.liabilities.map((c: any) => (
        <div className="cardrow liability" key={c.id}>
          <h3>⚠ {c.name} ×{c.qty} <small>settle it or it bites</small></h3>
          <button onClick={() => doAct('settle', c.id)}>settle ({Math.abs(c.value) * c.qty}g)</button>
        </div>
      ))}
      {s.relics.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <small>mark {c.value}g · sell ~{c.sellEst}g{c.location.kind === 'room' ? ' · displayed' : ''}</small></h3>
          <p className="tags">{c.tags}</p>
          {c.location.kind !== 'room' && <button onClick={() => doAct('sell', c.id)}>sell (~{c.sellEst}g)</button>}
        </div>
      ))}
      {!s.relics.length && !s.liabilities.length && <p>Nothing yet — loot comes from quests.</p>}
    </div>
  );
}

function Chains({ s }: any) {
  if (!s.chains.length) return <p>No stories yet — pursue a ✦ story lead.</p>;
  return (
    <div>
      {s.chains.slice().reverse().map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.title} <small>{c.state} · beat {c.beat}/{c.expectedBeats} · focal <b>{c.focal}</b>{c.personal ? ' (personal)' : ''}</small></h3>
          <p>bank {c.bank}g of ~{c.payoff}g · effort {c.effort}/{c.effortTarget} · failures {c.failures}/{c.failureBudget}</p>
          <p><i>{c.situation}</i></p>
          {c.known.length > 0 && <p>known: {c.known.join(' · ')}</p>}
          <details><summary>cast & goal</summary>
            <p>{c.goal}</p>
            <ul>{c.cast.map((p: any, i: number) => <li key={i}><b>{p.name}</b> ({p.role}): {p.who} — wants {p.want}</li>)}</ul>
          </details>
        </div>
      ))}
    </div>
  );
}

function People({ s, doAct }: any) {
  return (
    <div>
      <h3>🍺 Tavern</h3>
      {s.tavern.length === 0 && <p>Nobody drinking today.</p>}
      {s.tavern.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <small>L{c.character.level} · leaves c{c.expires}</small></h3>
          {c.character.who && <p><i>{c.character.who}</i></p>}
          <p className="tags">{c.tags}</p>
          {c.character.backstory && <p>{c.character.backstory}</p>}
          <button onClick={() => doAct('hire', c.id)}>hire ({c.hireCost}g)</button>
        </div>
      ))}
      <h3>⛓ Holding</h3>
      {s.holding.length === 0 && <p>Holding is empty.</p>}
      {s.holding.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <small>mark {c.value}g · decide by c{c.expires}</small></h3>
          {c.character.who && <p><i>{c.character.who}</i></p>}
          <p className="tags">{c.tags}</p>
          <div className="row">
            <button onClick={() => doAct('accept', c.id)}>to the cells</button>
            <button onClick={() => doAct('ransom', c.id)}>ransom now</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Lore({ s }: any) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      {s.lore.map((n: any) => (
        <div className="cardrow" key={n.id}>
          <h3 onClick={() => setOpen(open === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
            {n.active ? '' : '☽ '}{n.name} <small>{n.kind}</small>
          </h3>
          <p>{n.blurb}</p>
          {open === n.id && <>
            <pre>{n.dossier}</pre>
            {n.chronicle.length > 0 && <details open><summary>chronicle (full history)</summary>
              <ul>{n.chronicle.map((e: any, i: number) =>
                <li key={i} className={e.active ? '' : 'dim'}>{e.core ? '📌 ' : ''}{e.type}: {e.blurb}</li>)}</ul>
            </details>}
          </>}
        </div>
      ))}
    </div>
  );
}

function Log({ s }: any) {
  return <pre>{s.log.map((l: any) => `c${l.cycle} [${l.kind}] ${l.text}`).join('\n')}</pre>;
}

function AiLog({ s }: any) {
  const u = s.ai;
  if (!s.aiLog?.length) return <p>No AI calls yet{s.aiName === 'mock' ? ' (mock provider — no per-call log)' : ''}. Totals: {u.calls} calls · ~${u.costUsd.toFixed(3)}</p>;
  return (
    <div>
      <p><b>totals:</b> {u.calls} calls · {u.inputTokens} in / {u.outputTokens} out tokens · ~${u.costUsd.toFixed(3)}</p>
      <table><tbody>
        <tr><td>#</td><td>purpose</td><td>model</td><td>ms</td><td>in</td><td>cached</td><td>out</td><td>$</td><td>ok</td></tr>
        {s.aiLog.map((r: any) => (
          <React.Fragment key={r.n}>
            <tr className={r.ok ? '' : 'dim'}>
              <td>{r.n}</td><td>{r.purpose}</td><td>{r.model}</td><td>{r.durationMs}</td>
              <td>{r.inputTokens}</td><td>{r.cachedTokens}</td><td>{r.outputTokens}</td>
              <td>{r.costUsd.toFixed(4)}</td><td>{r.ok ? '✓' : `✗ ${r.error ?? ''}`}</td>
            </tr>
            <tr><td colSpan={9}>
              <details><summary>prompt</summary>
                <pre>SYSTEM (start): {r.systemPreview}\n\nUSER: {r.userPrompt}</pre>
              </details>
            </td></tr>
          </React.Fragment>
        ))}
      </tbody></table>
    </div>
  );
}
