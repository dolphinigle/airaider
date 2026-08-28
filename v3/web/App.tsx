// Airaider v3 web GUI — tabs over the /api view-model. The human-facing board.
import React, { useEffect, useState, useCallback, useRef } from 'react';

type S = any; // the /api/state view-model (prototype: untyped client)

async function act(type: string, ...args: (string | number)[]) {
  const r = await fetch('/api/action', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, args }),
  });
  return r.json() as Promise<{ ok: boolean; msg: string }>;
}

const RARITY_COLOR: Record<string, string> = { common: '#9aa', uncommon: '#6c6', rare: '#c8f' };

/** the rarity marker — what a card is actually worth from its tags, and how that compares to a
 *  typical one of its level. `value` is the mark (the budget spent) and can never show this. */
function Worth({ c }: { c: any }) {
  if (c.worth == null) return null;
  const t = `worth ${c.worth}g from its tags${c.peak ? ` · best: ${c.peak}` : ''}\nmark ${c.value}g — what was spent making it`;
  return <span className={`worth s${c.stars}`} title={t}>{'★'.repeat(c.stars) || '·'} {c.worth}g</span>;
}

// tab → menu-gate key (server `menus`, from game.menuGates()); unmapped tabs are always open
const TAB_GATE: Record<string, string> = {
  leads: 'leads', quests: 'quests', captives: 'captives', items: 'items', lore: 'lore',
};
function gateOf(s: S, key: string) { return (s.menus ?? []).find((m: any) => m.key === key); }
/** room name needed to unlock this tab, or null if open */
function tabLock(s: S, t: string): string | null {
  if (t === 'people') { // people = tavern (recruits) + holding (staging); locked only if both are
    const rec = gateOf(s, 'recruits'), stg = gateOf(s, 'staging');
    return rec && stg && !rec.open && !stg.open ? rec.need : null;
  }
  const g = gateOf(s, TAB_GATE[t] ?? '');
  return g && !g.open ? g.need : null;
}

export function App() {
  const [s, setS] = useState<S | null>(null);
  // ?quest=<id> deep-links straight to a quest page (and is how a headless browser gets there)
  // ?tab=<name> and ?quest=<id> deep-link into the app (and are how a headless browser reaches
  // a screen that normally needs clicks)
  const [tab, setTab] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get('quest') ? 'quests' : p.get('tab') || 'fort';
  });
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  // the reckoning is its own PAGE, not a panel on the fort tab: it opens the instant END is
  // clicked (so the screen exists before the first word of narration does) and closes on PROCEED
  const [reckoning, setReckoning] = useState(false);
  // s.cycle at the moment END was clicked, or null when reopening a finished report. The engine
  // bumps the cycle on the FIRST line of endCycle(), so `s.cycle > reckAt` is the exact, race-free
  // test for "these lines belong to the new reckoning, not the stale previous one".
  const [reckAt, setReckAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setS(await (await fetch('/api/state')).json());
  }, []);
  useEffect(() => { refresh() }, [refresh]);

  // Every action gets immediate feedback: a pending banner the moment it's clicked, cleared
  // on resolve. Actions that hit the AI (pursue/story genesis, renovate, end cycle) can take
  // 60s+; while one is in-flight we live-poll /api/state (a plain GET, NOT serialized behind
  // the action) so the in-progress AI-log row and running totals surface instead of a dead click.
  const doAct = async (type: string, ...args: (string | number)[]) => {
    setBusy(true);
    setPending(type);
    const poll = setInterval(() => { refresh().catch(() => {}); }, 1200);
    try {
      const r = await act(type, ...args);
      setToast(r.msg);
    } catch (e) {
      setToast(`request failed: ${(e as Error).message ?? e}`);
    } finally {
      clearInterval(poll);
      setPending(null);
      setBusy(false);
      await refresh().catch(() => {});
      setTimeout(() => setToast(''), 4000);
    }
  };

  // TEMPO P1: a QUEUED action (pursue, and the queue's own controls) must never touch `busy`.
  // `busy` is one flag and the first completion clears it — with several pursuits out that flag
  // would describe the wrong job and then lie that nothing is running. These POSTs return in
  // milliseconds; what is actually in flight is read from `s.jobs`.
  const queueAct = async (type: string, ...args: (string | number)[]) => {
    try {
      const r = await act(type, ...args);
      setToast(r.msg);
    } catch (e) {
      setToast(`request failed: ${(e as Error).message ?? e}`);
    } finally {
      await refresh().catch(() => {});
      setTimeout(() => setToast(''), 4000);
    }
  };

  const jobs: any[] = s?.jobs ?? [];
  const live = jobs.filter(j => j.state === 'queued' || j.state === 'running');
  // identity, not the array: /api/state hands back a fresh array every poll
  const jobSig = jobs.map(j => `${j.id}:${j.state}`).join(',');

  // TEMPO P11: each quest's block must show up when it lands, and the 1.2s doAct poll is too coarse
  // to read as "as it arrives". Faster ONLY while the reckoning page is actually open and working.
  const reckLive = reckoning && (busy || !!s?.reckoningWriting);
  useEffect(() => {
    if (!reckLive) return;
    const t = setInterval(() => { refresh().catch(() => {}) }, 500);
    return () => clearInterval(t);
  }, [reckLive, refresh]);

  // TEMPO P1/P6: a job finishes OUTSIDE any action, so nothing else would ever tell the board about
  // it. Same shape as the reckoning poll above: quick while work is out, a slow heartbeat otherwise
  // (a finished job still has to leave the strip). Skipped while the reckoning already polls faster.
  useEffect(() => {
    if (reckLive) return;
    const t = setInterval(() => { refresh().catch(() => {}) }, live.length ? 1000 : 5000);
    return () => clearInterval(t);
  }, [reckLive, live.length, refresh]);

  // TEMPO P6: arrival is ANNOUNCED, never staged — a line under the header, no modal, no view jump.
  // The board itself has already updated by the time this fires; the toast only says where to look.
  const seenJobs = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const j of jobs) {
      const was = seenJobs.current[j.id];
      seenJobs.current[j.id] = j.state;
      if (!was || was === j.state || (j.state !== 'done' && j.state !== 'failed')) continue;
      setToast(j.state === 'done' ? `✦ ${j.title} — the card is on the quests board`
        : `✗ ${j.title} — the writing failed; the lead is still on the board`);
      setTimeout(() => setToast(''), 5000);
    }
  }, [jobSig]);

  if (!s) return <div className="app">loading…</div>;
  if (reckoning) return <Reckoning s={s} busy={busy} reckAt={reckAt} jobs={jobs} onProceed={() => setReckoning(false)} />;

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
        <span className="ai">AI: {s.aiName} ({s.ai.calls} calls{s.aiName === 'openai' ? `, ~$${s.ai.costUsd.toFixed(2)}` : ''}{live.length ? `, ${live.length} out` : ''})</span>
        {/* TEMPO P8: the cap is adjustable and lives next to the cost meter, because the cost is
            what it governs. Guarded so a state without a queue simply shows nothing. */}
        {s.maxInFlight > 0 && <span className="cap" title="how many cards may be written at once">
          <button disabled={s.maxInFlight <= 1} onClick={() => queueAct('inflight', s.maxInFlight - 1)}>−</button>
          ✎{s.maxInFlight}
          <button disabled={s.maxInFlight >= 6} onClick={() => queueAct('inflight', s.maxInFlight + 1)}>+</button>
        </span>}
        {s.lastReport?.length > 0 &&
          <button className="reopen" onClick={() => { setReckAt(null); setReckoning(true) }}>⚄ last reckoning</button>}
        {/* TEMPO P9: END waits for the queue — the engine drains it. The button says what it waits on
            rather than going dead, because the wait is not a refusal. */}
        <button className="end" disabled={busy} onClick={() => { setReckAt(s.cycle); setReckoning(true); doAct('end') }}>
          {busy ? '…' : live.length ? `END CYCLE ▶ (${live.length} still writing)` : 'END CYCLE ▶'}</button>
      </header>
      {/* P1 says a click stays visible until the work is DONE — so a finished job leaves the strip
          (its arrival is the toast, and its card is on the quests board). A FAILED one stays: it is
          the only place P4's plain-words failure lives, and the engine keeps it for a dozen jobs. */}
      <Queue jobs={jobs.filter((j: any) => j.state !== 'done')} queueAct={queueAct} />
      {pending && <div className="pending"><span className="spin" /> working: <b>{pending}</b>… <i>story generation can take a minute — watch the AI tab</i></div>}
      {toast && <div className="toast">{toast}</div>}
      <nav>
        {['fort', 'build', 'leads', 'quests', 'roster', 'captives', 'items', 'chains', 'people', 'lore', 'log', 'ai'].map(t => {
          const need = tabLock(s, t);
          return <button key={t} className={(tab === t ? 'on' : '') + (need ? ' locked' : '')}
            title={need ? `build a ${need} first` : undefined}
            onClick={() => setTab(t)}>{need ? `🔒 ${t}` : t}</button>;
        })}
      </nav>
      <main>
        {tabLock(s, tab) ? <p className="lockmsg">🔒 Locked — build a <b>{tabLock(s, tab)}</b> first.</p> : <>
          {tab === 'fort' && <Fort s={s} doAct={doAct} setDetail={setDetail} />}
          {tab === 'build' && <Build s={s} doAct={doAct} />}
          {tab === 'leads' && <Leads s={s} queueAct={queueAct} />}
          {tab === 'quests' && <Quests s={s} doAct={doAct} />}
          {tab === 'roster' && <Roster s={s} doAct={doAct} />}
          {tab === 'captives' && <Captives s={s} doAct={doAct} />}
          {tab === 'items' && <Items s={s} doAct={doAct} />}
          {tab === 'chains' && <Chains s={s} />}
          {tab === 'people' && <People s={s} doAct={doAct} />}
          {tab === 'lore' && <Lore s={s} />}
          {tab === 'log' && <Log s={s} />}
          {tab === 'ai' && <AiLog s={s} />}
        </>}
      </main>
      {detail && <RoomDetail s={s} roomId={detail} doAct={doAct} close={() => setDetail(null)} />}
    </div>
  );
}

/** one report line → a class, so the page reads as a sequence of beats instead of a paragraph wall */
function lineClass(l: string): string {
  if (l.startsWith('— ')) return 'r-title';
  if (l.startsWith('「')) return 'r-card';
  if (l.startsWith('⚄')) return 'r-roll';
  if (l.startsWith('   ')) return 'r-coins';
  if (l.startsWith('▸')) return 'r-turn';
  // a quest whose narration hasn't landed yet — must read as a held place, not as prose.
  // ✎ not ⏳: ⏳ is already the engine's "this quest lapsed" marker, which means the opposite.
  if (l.startsWith('✎')) return 'r-pending';
  // any line opening on a symbol is engine news or a consequence, never narration
  if (/^(\p{Extended_Pictographic}|[✦⚑†])/u.test(l)) return 'r-news';
  return 'r-prose';
}

function Reckoning({ s, busy, reckAt, jobs, onProceed }: { s: S; busy: boolean; reckAt: number | null; jobs: any[]; onProceed: () => void }) {
  // CYCLE guard, not a busy guard: the previous cycle's report is stale until the engine bumps the
  // cycle, and from that instant every line on the wire belongs to THIS reckoning — so they render
  // one by one as they land instead of waiting for the POST to return.
  const fresh = reckAt === null || s.cycle > reckAt;
  const lines: string[] = fresh ? (s.lastReport ?? []) : [];
  // the flesh tail (12-16s) keeps the POST open long after the last report line is in — the player
  // must not be held for it, so the door opens on `reckoningWriting`, not on `busy`
  // Gate on `busy` FIRST: `s` only advances when a poll succeeds, and every poll failure is
  // swallowed — so a dead server would freeze reckoningWriting=true and trap the player on a page
  // whose only button is disabled. Once the POST has settled (or failed), the door always opens.
  const held = busy && (!fresh || !!s.reckoningWriting);
  return (
    <div className="app reckpage">
      <header className="reckhead">
        <b>THE RECKONING</b>
        <span>cycle {s.cycle}</span>
        <span className="ai">AI: {s.aiName} ({s.ai.calls} calls{s.aiName === 'openai' ? `, ~$${s.ai.costUsd.toFixed(2)}` : ''})</span>
      </header>
      {/* TEMPO P9: END waits for the queue and the engine drains it HERE — so the strip has to be on
          this page too, or the player watches an unexplained wait. Read-only: cancelling a job the
          reckoning is already draining is not a thing to offer. */}
      {jobs.some(j => j.state === 'queued' || j.state === 'running') &&
        <Queue jobs={jobs.filter(j => j.state === 'queued' || j.state === 'running')} queueAct={null} />}
      <main className="reckbody">
        {lines.map((l, i) => <p key={i} className={lineClass(l)}>{l}</p>)}
        {/* below the lines, not above: at the top it would yank the whole report up a line the
            moment writing ends — the one place this page is allowed to move is its end */}
        {held && <p className="working"><span className="spin" /> the company is still out — the report is being written…</p>}
        {!held && lines.length === 0 && <p className="hint">Nothing to report.</p>}
      </main>
      <footer className="reckfoot">
        <button className="proceed" disabled={held} onClick={onProceed}>{held ? 'resolving…' : 'PROCEED ▶'}</button>
      </footer>
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

function Leads({ s, queueAct }: any) {
  if (!s.leads.length) return <p>The board is empty — leads are earned: run hunts, finish quests.</p>;
  const jobs: any[] = s.jobs ?? [];
  return (
    <table><tbody>
      {s.leads.map((l: any) => {
        // TEMPO P2: a lead being worked reads as being worked WHERE IT STANDS. The queue strip is
        // not enough — this row is where the player is about to click again.
        const job = jobs.find((j: any) => j.leadId === l.id && (j.state === 'queued' || j.state === 'running'));
        return (
        <tr key={l.id} className={job ? 'leadworking' : ''}>
          <td style={{ color: RARITY_COLOR[l.rarity] }}>{l.rarity}</td>
          <td>L{l.level}</td><td>{l.region}</td><td>{l.archetype}</td>
          <td>{l.chain === 'starts-new' ? '✦ story' : l.chain === 'continues' ? '⛓ continues' : ''}</td>
          <td className="leadpay" title={l.pay?.band ? `carries a bonus onto the quest it opens` : ''}>
            {l.pay?.band ? <><span className="stars">{l.pay.stars}</span> {l.pay.label}</> : ''}</td>
          <td>{l.title ?? ''}</td>
          <td>{l.expires === null ? 'standing' : `expires c${l.expires}`}</td>
          <td>{job
            ? <button disabled>{job.state === 'queued' ? '⋯ queued' : '✎ writing…'}</button>
            : <button onClick={() => queueAct('pursue', l.id)}>pursue</button>}</td>
        </tr>
        );
      })}
    </tbody></table>
  );
}

/** TEMPO P1/P4/P5: everything out for writing, in one quiet strip that is on screen from any tab. */
function Queue({ jobs, queueAct }: { jobs: any[]; queueAct: any }) {
  if (!jobs.length) return null;
  return (
    <div className="queue">
      {jobs.map((j: any) => (
        <span key={j.id} className={`qjob q-${j.state}`}>
          {j.state === 'running' ? <span className="spin" /> : null}
          <span className="qmark">{j.state === 'queued' ? '⋯' : j.state === 'done' ? '✓' : j.state === 'failed' ? '✗' : ''}</span>
          {j.title}
          {/* P4: plain words on the job's OWN item, and the lead is still on the board — so the
              retry is just pursuing it again, with no separate retry machinery to explain. */}
          {j.state === 'failed' && <i> — {j.error ?? 'the writing failed'}. Pursue the lead again.</i>}
          {/* P5: only a job that has not started can be dropped (and only where dropping is offered) */}
          {j.state === 'queued' && queueAct && <button className="qx" title="drop from the queue"
            onClick={() => queueAct('cancel', j.id)}>×</button>}
        </span>
      ))}
    </div>
  );
}

/* ═══ THE QUEST SURFACE ══════════════════════════════════════════════════════════════════
   Two screens, per docs/QUEST_SCREEN.md. THE BOARD is a list you can man without opening
   anything (G4). THE QUEST is its own page: the writ on paper, the saga's own people held in
   brackets beside it, the slots, and the odds (G1-G3). Every placement goes through the engine
   (G5) — assign / auto / autoall are the same calls the CLI's `auto` makes. */
function Quests({ s, doAct }: any) {
  // ?quest=<id> opens a quest straight away — a real deep link, and the only way to put the
  // quest page in front of a headless browser for a screenshot
  const [open, setOpen] = useState<string | null>(new URLSearchParams(location.search).get('quest'));
  const [active, setActive] = useState<number | null>(null);   // the slot being filled
  const [read, setRead] = useState<any>(null);                 // a held card being read
  const q = open ? s.quests.find((x: any) => x.id === open) : null;
  useEffect(() => { if (open && !q) setOpen(null) }, [open, q]);   // it lapsed or marched
  useEffect(() => { setActive(null) }, [open]);
  // Escape backs out one layer at a time: the sheet, then the armed slot, then the quest. A modal
  // with no keyboard exit traps the player (found by driving the real page, scripts/uiplay.ts).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (read) return setRead(null);
      if (active != null) return setActive(null);
      if (open) setOpen(null);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [read, active, open]);
  if (!s.quests.length) return <p>No open quests. Pursue a lead.</p>;
  const slots = q ? activeSlots(q) : [];
  const free = s.roster.filter((m: any) => m.location?.kind === 'held');
  const place = (idx: number, id: string) => { setActive(null); doAct('assign', q.id, idx, id) };
  return (<>
    {q
      ? <QuestPage s={s} q={q} doAct={doAct} active={active} setActive={setActive}
          back={() => setOpen(null)} read={read} setRead={setRead} />
      : <Board s={s} doAct={doAct} setOpen={setOpen} />}
    <Hand free={free} slots={slots} active={active} onPick={(id: string) => {
      if (!q) return;
      if (active != null) return place(active, id);
      const first = slots.find((x: any) => !x.filledBy); if (first) place(first.idx, id);
    }} note={!q ? `${free.length} of ${s.roster.length} unspoken for.`
      : active == null ? 'Click a slot to see who fits.' : 'Best first.'} />
  </>);
}

const activeSlots = (q: any) => q.approaches ? q.slots.filter((x: any) => x.groupId === q.chosenApproach) : q.slots;
const clip = (t: string, n: number) => t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)) + '…';

function Hand({ free, slots, active, onPick, note }: any) {
  const fitOf = (id: string) => active == null ? null
    : slots.find((x: any) => x.idx === active)?.fits.find((f: any) => f.id === id)?.coins ?? null;
  const shown = active == null ? free : [...free].sort((a: any, b: any) => (fitOf(b.id) ?? 0) - (fitOf(a.id) ?? 0));
  return (
    <div className="qhand">
      <div className="handlabel">The company</div>
      <div className="handscroll">
        {shown.length === 0 && <span className="handnote">Everyone is spoken for.</span>}
        {shown.map((m: any) => {
          const fit = fitOf(m.id);
          return (
            <button className={'qcard' + (m.character.injury > 0 ? ' injured' : '')} key={m.id} draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', m.id)}
              onClick={() => onPick(m.id)}>
              {fit != null && <span className={'fit' + (fit >= 8 ? ' good' : fit <= 3 ? ' bad' : '')}>{fit}c</span>}
              <span className="nm">{m.name}</span>
              <span className="sub">lvl {m.character.level} · {'★'.repeat(m.stars)}{'☆'.repeat(4 - m.stars)}</span>
              <span className="tags">{m.tags}</span>
            </button>);
        })}
      </div>
      <div className="handnote">{note}</div>
    </div>
  );
}

function Board({ s, doAct, setOpen }: any) {
  return (
    <div className="board-list">
      <div className="listhead">
        <h3>The board</h3>
        <span className="n">{s.quests.length} open · cycle {s.cycle}</span>
        <button className="act auto" onClick={() => doAct('autoall')}>Auto-fill every quest</button>
      </div>
      {s.quests.map((q: any) => {
        const act = activeSlots(q), filled = act.filter((x: any) => x.filledBy).length;
        return (
          <div className="qrow" key={q.id}>
            <button className="open" onClick={() => setOpen(q.id)}>
              <div className="t">{q.title}</div>
              <div className="sit">{clip(q.situation, 300)}</div>
              <div className="tag">
                <span className="pay">{q.rewardEnvelope}</span>
                <span>{q.rarity} · level {q.level}</span>
                {q.isFinale ? <span className="saga">🎬 finale</span>
                  : q.chainId ? <span className="saga">beat {q.beat}</span> : <span>one-off</span>}
                <span>lapses c{q.lapsesAtCycle}</span>
              </div>
            </button>
            <div className="side">
              <div className="pips">{act.map((x: any, i: number) =>
                <span key={i} className={'pip' + (x.filledBy ? ' on' : '')} />)}</div>
              <div className="rowstate">
                <span>{filled}/{act.length} named</span>
                <span>{filled < act.length ? 'not manned'
                  : q.odds.success !== null
                    ? <><b className={q.odds.success < .4 ? 'thin' : ''}>{Math.round(q.odds.success * 100)}%</b> · {q.odds.coins}c vs {q.odds.bar.toFixed(1)}</>
                    : <>{q.odds.coins}c vs {q.odds.bar.toFixed(1)}</>}</span>
              </div>
              <button className="act auto" onClick={() => doAct('auto', q.id)}>Auto</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestPage({ s, q, doAct, active, setActive, back, read, setRead }: any) {
  const act = activeSlots(q), filled = act.filter((x: any) => x.filledBy).length;
  const ready = filled === act.length && act.length > 0;
  const free = s.roster.filter((m: any) => m.location?.kind === 'held');
  const place = (idx: number, id: string) => { setActive(null); doAct('assign', q.id, idx, id) };
  const line = !ready
    ? (filled === 0 ? `${['Nobody','One','Two','Three','Four','Five'][act.length] ?? act.length} must go. Nobody is on the board yet.` : `${act.length - filled} still to name.`)
    : q.odds.success === null ? 'They are named. Build an Oracle to read the odds.'
    : q.odds.success > .8 ? 'They should manage this between them.'
    : q.odds.success > .55 ? 'It could go either way, but the odds lean your way.'
    : q.odds.success > .3 ? 'Thin. Someone will likely come home hurt.'
    : 'You are sending them to fail.';
  const pct = ready && q.odds.success !== null ? q.odds.success : 0;
  return (
    <div className="questpage">
      <div className="qleft">
        <button className="back" onClick={back}>← the board</button>
        <div className="writ">
          <h1>{q.title}</h1>
          <div className="wmeta">
            <span>{q.rarity} · level {q.level}</span>
            {q.isFinale ? <span>finale</span> : q.chainId ? <span>beat {q.beat}</span> : <span>one-off</span>}
            <span>lapses c{q.lapsesAtCycle}</span>
          </div>
          <p>{q.situation}</p>
          <div className="errand"><b>THE ERRAND</b> {q.job}<br /><b>THE PAY</b> {q.rewardEnvelope}</div>
        </div>
        {q.approaches && (
          <div className="instrument">
            <div className="sect">Pick an approach — each rolls its own test</div>
            <div className="acts">{q.approaches.map((a: any) =>
              <button key={a.id} className={'act' + (q.chosenApproach === a.id ? ' go' : '')}
                onClick={() => doAct('approach', q.id, a.id)}>{a.label} → {a.rewardKind}</button>)}</div>
          </div>
        )}
        <div className="instrument">
          <div className="gauge">
            {q.odds.success !== null && <svg width="120" height="78" viewBox="0 0 120 78" aria-hidden="true">
              <path d="M14 66a46 46 0 0 1 92 0" fill="none" stroke="#39414a" strokeWidth="9" strokeLinecap="round" />
              <path d="M14 66a46 46 0 0 1 92 0" fill="none" stroke="#c69440" strokeWidth="9" strokeLinecap="round"
                strokeDasharray="145" strokeDashoffset={145 - 145 * pct} />
              <g style={{ transform: `rotate(${-90 + 180 * pct}deg)`, transformOrigin: '60px 66px', transition: 'transform .45s' }}>
                <line x1="60" y1="66" x2="60" y2="26" stroke="#c69440" strokeWidth="2.5" strokeLinecap="round" /></g>
              <circle cx="60" cy="66" r="4.5" fill="#c69440" />
            </svg>}
            <div className="oddstext">
              <div className="line">{line}</div>
              <div className="nums">{q.odds.coins} coins against a bar of {q.odds.bar.toFixed(1)}
                {ready && q.odds.success !== null ? ` · about ${Math.round(q.odds.success * 100)}%` : ` · ${filled}/${act.length} named`}</div>
            </div>
          </div>
          <div className="acts">
            <button className="act go" disabled={!ready}>Send them</button>
            <button className="act auto" onClick={() => doAct('auto', q.id)}>Auto-assign</button>
            <button className="act" onClick={() => act.forEach((x: any) => x.filledBy && doAct('unassign', q.id, x.idx))}>Clear</button>
            <button className="act" onClick={back}>Leave it</button>
          </div>
        </div>
      </div>

      <div className="qright">
        {q.cast?.length > 0 && (
          <div className="rack">
            <div className="sect">On this matter</div>
            <div className="people">{q.cast.map((c: any, i: number) => (
              <div className="person" key={i}>
                <button className="qcard held" onClick={() => setRead(c)}>
                  <span className="nm">{c.name}</span>
                  {c.trade && <span className="sub">{c.trade}</span>}
                  <span className="tags">{c.role}</span>
                </button>
                <div className="cap">held to this matter</div>
              </div>))}</div>
          </div>
        )}
        <div className="rack">
          <div className="sect">Who you send</div>
          <div className="slots">{act.map((sl: any) => {
            const m = sl.filledBy ? s.roster.find((r: any) => r.id === sl.filledId) : null;
            return (
              <div className="slotwrap" key={sl.idx}>
                <div className={'dropzone' + (active === sl.idx ? ' active' : '')}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over') }}
                  onDragLeave={e => e.currentTarget.classList.remove('over')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over');
                    const id = e.dataTransfer.getData('text/plain'); if (id) place(sl.idx, id) }}>
                  {m
                    ? <button className="qcard picked" onClick={() => doAct('unassign', q.id, sl.idx)} title="click to free">
                        <span className="fit">{sl.filledCoins}c</span>
                        <span className="nm">{m.name}</span>
                        <span className="sub">lvl {m.character.level} · {'★'.repeat(m.stars)}{'☆'.repeat(4 - m.stars)}</span>
                        <span className="tags">{m.tags}</span></button>
                    : <button className="slot required" onClick={() => setActive(active === sl.idx ? null : sl.idx)}>
                        <svg viewBox="0 0 36 46" className="ghost" aria-hidden="true"><path d="M18 4a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 17c8.6 0 15 5.2 15 12.6V46H3V33.6C3 26.2 9.4 21 18 21Z" /></svg>
                        <span className="want">DRAG OR CLICK</span></button>}
                </div>
                <div className="demand">
                  <div>{sl.test.attributes.join('+').toUpperCase()} · bar {sl.test.bar.toFixed(1)}</div>
                  {sl.test.favored.length > 0 && <div className="up">helps: {sl.test.favored.join(', ')}</div>}
                  {sl.test.clashing.length > 0 && <div className="down">hurts: {sl.test.clashing.join(', ')}</div>}
                  {sl.requirement && <div><b>⚑ {sl.requirement}</b></div>}</div>
              </div>);
          })}</div>
        </div>
      </div>

      {read && <div className="reader" onClick={() => setRead(null)}>
        <div className="sheet" onClick={e => e.stopPropagation()}>
          {/* click-outside and Escape both close it, but a mouse user needs something to aim at */}
          <button className="sheetclose" onClick={() => setRead(null)} aria-label="Close">✕</button>
          <h2>{read.name}</h2>
          <div className="role">{read.trade} · {read.role}</div>
          <p>{read.who}</p>
          <div className="tagline">Held to this matter. You can read them; you cannot move them.</div>
        </div></div>}
    </div>
  );
}

function Roster({ s, doAct }: any) {
  return (
    <div>
      {s.roster.map((m: any) => (
        <div className="cardrow" key={m.id}>
          <h3>{m.name} <Worth c={m} /> <small>L{m.character.level}/{m.cap}{m.character.level >= m.cap ? ' ⛔CAP' : ''} · xp {m.character.xp}/{m.xpNeeded} · {m.character.injury > 0 ? `🩸${m.character.injury} (~${m.healEta?.cycles}c to heal)` : 'healthy'} · {m.location.kind === 'quest' ? '⚔ committed' : 'free'}</small></h3>
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
            {m.character.injury > 0 && (s.can?.heal
              ? <button onClick={() => doAct('heal', m.id)}>pay-heal</button>
              : <span className="dim">heals over time — a Hospital would speed it</span>)}
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
          <h3>{c.name} <Worth c={c} /> <small>mark {c.value}g · ransom ~{c.ransomEst}g · sell ~{c.sellEst}g · {c.character.obedient ? 'obedient' : c.breaking ? `breaking (done c${c.breaking})` : 'raw'}{c.location.kind === 'room' ? ` · stationed` : ''}</small></h3>
          <p className="tags">{c.tags}</p>
          <div className="row">
            <button onClick={() => doAct('ransom', c.id)}>ransom</button>
            <button onClick={() => doAct('sell', c.id)}>sell</button>
            {!c.interrogated && s.can?.interrogate && <button onClick={() => doAct('interrogate', c.id)}>interrogate (→ lead)</button>}
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
          <h3>{c.name} <Worth c={c} /> <small>mark {c.value}g · sell ~{c.sellEst}g{c.location.kind === 'room' ? ' · displayed' : ''}</small></h3>
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
  const rec = gateOf(s, 'recruits'), stg = gateOf(s, 'staging');
  if (rec && !rec.open) return (
    <div>
      <h3>🍺 Tavern</h3>
      <p className="lockmsg">🔒 Build a <b>{rec.need}</b> to meet recruits.</p>
      {stg?.open && <PeopleHolding s={s} doAct={doAct} />}
    </div>
  );
  return (
    <div>
      <h3>🍺 Tavern</h3>
      {s.tavern.length === 0 && <p>Nobody drinking today.</p>}
      {s.tavern.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <Worth c={c} /> <small>L{c.character.level} · leaves c{c.expires}</small></h3>
          {c.character.who && <p><i>{c.character.who}</i></p>}
          <p className="tags">{c.tags}</p>
          {c.character.backstory && <p>{c.character.backstory}</p>}
          <button onClick={() => doAct('hire', c.id)}>hire ({c.hireCost}g)</button>
        </div>
      ))}
      {stg && !stg.open
        ? <><h3>⛓ Holding</h3><p className="lockmsg">🔒 Build a <b>{stg.need}</b> to take in new captives.</p></>
        : <PeopleHolding s={s} doAct={doAct} />}
    </div>
  );
}

function PeopleHolding({ s, doAct }: any) {
  return (
    <>
      <h3>⛓ Holding</h3>
      {s.holding.length === 0 && <p>Holding is empty.</p>}
      {s.holding.map((c: any) => (
        <div className="cardrow" key={c.id}>
          <h3>{c.name} <Worth c={c} /> <small>mark {c.value}g · decide by c{c.expires}</small></h3>
          {c.character.who && <p><i>{c.character.who}</i></p>}
          <p className="tags">{c.tags}</p>
          <div className="row">
            <button onClick={() => doAct('accept', c.id)}>to the cells</button>
            <button onClick={() => doAct('ransom', c.id)}>ransom now</button>
          </div>
        </div>
      ))}
    </>
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
  // raw single-line JSON was unreadable in the details view — pretty-print, fall back to raw
  const pretty = (t?: string | null) =>
    !t ? '(not recorded)' : (() => { try { return JSON.stringify(JSON.parse(t), null, 2) } catch { return t } })();
  if (!s.aiLog?.length) return <p>No AI calls yet{s.aiName === 'mock' ? ' (mock provider — no per-call log)' : ''}. Totals: {u.calls} calls · ~${u.costUsd.toFixed(3)}</p>;
  return (
    <div>
      <p><b>totals:</b> {u.calls} calls · {u.inputTokens} in / {u.outputTokens} out tokens · ~${u.costUsd.toFixed(3)}</p>
      <table><tbody>
        <tr><td>#</td><td>purpose</td><td>model</td><td>ms</td><td>in</td><td>cached</td><td>out</td><td>$</td><td>ok</td></tr>
        {s.aiLog.map((r: any) => {
          // a record is pushed at call-start (ok:false, durationMs:0, no error) and rewritten on
          // finish — so an unfinished call is uniquely "in flight", not a failure.
          const inflight = !r.ok && !r.error && r.durationMs === 0;
          return (
          <React.Fragment key={r.n}>
            <tr className={r.ok ? '' : inflight ? 'inflight' : 'dim'}>
              <td>{r.n}</td><td>{r.purpose}</td><td>{r.model}</td><td>{inflight ? <span className="spin" /> : r.durationMs}</td>
              <td>{r.inputTokens}</td><td>{r.cachedTokens}</td><td>{r.outputTokens}</td>
              <td>{r.costUsd.toFixed(4)}</td><td>{r.ok ? '✓' : inflight ? '⏳ running…' : `✗ ${r.error ?? ''}`}</td>
            </tr>
            <tr><td colSpan={9}>
              <details><summary>prompt + output</summary>
                <pre style={{ whiteSpace: 'pre-wrap' }}>SYSTEM (start):{'\n'}{r.systemPreview}{'\n\n'}USER:{'\n'}{pretty(r.userPrompt)}{'\n\n'}OUTPUT:{'\n'}{inflight ? '(still running — no output yet)' : pretty(r.output)}</pre>
              </details>
            </td></tr>
          </React.Fragment>
        );})}
      </tbody></table>
    </div>
  );
}
