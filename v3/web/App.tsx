// Airaider v3 web GUI — the Sultan-style table: a map (home), the fort, the chronicle, and the
// hand of cards always along the bottom. Design: docs/UI.md. Every action goes through /api/action
// → the same Game methods the CLI calls (docs/DOGFOODING.md).
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { act, type S } from './ui';
import { MapScreen } from './MapScreen';
import { QuestPage } from './QuestPage';
import { Hand, Inventory } from './Hand';
import { CardSheet } from './Sheets';
import { FortScreen } from './FortScreen';
import { Chronicle, Reckoning } from './Chronicle';

type Screen = 'map' | 'fort' | 'chronicle';
const NAV: [Screen, string, string][] = [
  ['map', 'Map', 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'],
  ['fort', 'Fort', 'M4 21V9l2 1V6h2v2h2V6h4v2h2V6h2v4l2-1v12zM10 21v-5h4v5'],
  ['chronicle', 'Chronicle', 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11'],
];

export function App() {
  const q0 = new URLSearchParams(location.search);
  const [s, setS] = useState<S | null>(null);
  // ?screen= / ?quest= / ?card= deep-link a screen (and are how a headless browser reaches one)
  const [screen, setScreen] = useState<Screen>((q0.get('screen') as Screen) || (q0.get('quest') ? 'map' : 'map'));
  const [quest, setQuest] = useState<string | null>(q0.get('quest'));
  const [sheet, setSheet] = useState<{ id: string; cast?: any } | null>(q0.get('card') ? { id: q0.get('card')! } : null);
  const [drawer, setDrawer] = useState(q0.get('drawer') === '1');
  const [drag, setDrag] = useState<string | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  // the reckoning is its own PAGE: it opens the instant END is clicked and closes on PROCEED
  const [reckoning, setReckoning] = useState(false);
  const [reckAt, setReckAt] = useState<number | null>(null);

  const refresh = useCallback(async () => { setS(await (await fetch('/api/state')).json()) }, []);
  useEffect(() => { refresh() }, [refresh]);
  const say = (m: string, ms = 4000) => { setToast(m); setTimeout(() => setToast(t => t === m ? '' : t), ms) };

  // actions that can hit the AI (renovate, end) poll the state while they run
  const doAct = async (type: string, ...args: (string | number)[]) => {
    setBusy(true); setPending(type);
    const poll = setInterval(() => { refresh().catch(() => {}) }, 1200);
    try { const r = await act(type, ...args); say(r.msg) }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`) }
    finally { clearInterval(poll); setPending(null); setBusy(false); await refresh().catch(() => {}) }
  };
  // TEMPO P1: queued actions (pursue, cancel, inflight) never touch `busy`
  const queueAct = async (type: string, ...args: (string | number)[]) => {
    try { const r = await act(type, ...args); say(r.msg) }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`) }
    finally { await refresh().catch(() => {}) }
  };
  // quick placements: no pending banner, just the result
  const quick = async (type: string, ...args: (string | number)[]) => {
    const r = await act(type, ...args); if (!r.ok || type === 'send') say(r.msg); await refresh();
  };

  const jobs: any[] = s?.jobs ?? [];
  const live = jobs.filter(j => j.state === 'queued' || j.state === 'running');
  const jobSig = jobs.map(j => `${j.id}:${j.state}`).join(',');
  const reckLive = reckoning && (busy || !!s?.reckoningWriting);
  useEffect(() => {
    if (!reckLive) return;
    const t = setInterval(() => { refresh().catch(() => {}) }, 500);
    return () => clearInterval(t);
  }, [reckLive, refresh]);
  // jobs and portraits finish outside any action — a heartbeat, quick while something is out
  const painting = (s?.roster ?? []).some((m: any) => m.painting);
  useEffect(() => {
    if (reckLive) return;
    const t = setInterval(() => { refresh().catch(() => {}) }, live.length || painting ? 1000 : 5000);
    return () => clearInterval(t);
  }, [reckLive, live.length, painting, refresh]);
  // TEMPO P6: arrival is announced, never staged
  const seenJobs = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const j of jobs) {
      const was = seenJobs.current[j.id];
      seenJobs.current[j.id] = j.state;
      if (!was || was === j.state || (j.state !== 'done' && j.state !== 'failed')) continue;
      say(j.state === 'done' ? `✦ ${j.title} — it is on the map` : `✗ ${j.title} — the writing failed; the lead is still there`, 5000);
    }
  }, [jobSig]);

  const q = quest && s ? s.quests.find((x: any) => x.id === quest) : null;
  useEffect(() => { if (s && quest && !q) setQuest(null) }, [s, quest, q]);
  useEffect(() => { setArmed(null) }, [quest]);
  // Escape backs out one layer at a time: sheet, drawer, armed slot, quest
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        if (sheet) return setSheet(null);
        if (drawer) return setDrawer(false);
        if (armed != null) return setArmed(null);
        if (quest) return setQuest(null);
      }
      if (e.key === 'b' || e.key === 'B') setDrawer(d => !d);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [sheet, drawer, armed, quest]);

  if (!s) return <div className="app loading">loading…</div>;
  if (reckoning) return <Reckoning s={s} busy={busy} reckAt={reckAt} jobs={jobs} onProceed={() => setReckoning(false)} />;

  const go = (sc: Screen) => { setScreen(sc); setQuest(null); setDrawer(false) };
  const openQuest = (id: string) => { setScreen('map'); setQuest(id); setDrawer(false) };
  // a card clicked in the hand: on an open quest it goes in (the armed place, else its best place)
  const pickCard = (c: any) => {
    if (q && c.character?.role === 'merc') {
      if (armed != null) { setArmed(null); return quick('assign', q.id, armed, c.id) }
      return quick('send', q.id, c.id);
    }
    setSheet({ id: c.id });
  };
  const unmanned = s.quests.filter((x: any) => (x.approaches ? x.slots.filter((y: any) => y.groupId === x.chosenApproach) : x.slots).some((y: any) => !y.filledBy) || (x.approaches && !x.chosenApproach)).length;
  const gh = s.ghNeed ? Math.min(1, s.prestige / s.ghNeed) : 1;

  return (
    <div className="app">
      <header className="top">
        <span className="crest">AIRAIDER</span>
        <nav className="nav" aria-label="Screens">
          {NAV.map(([k, label, d]) => (
            <button key={k} className={screen === k ? 'on' : ''} onClick={() => go(k)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={d} /></svg>
              {label}
              {k === 'map' && s.quests.length > 0 && <span className="dot">{s.quests.length}</span>}
              {k === 'fort' && s.holding.length + s.tavern.length > 0 && <span className="dot" title="someone waiting at the tavern or in holding">{s.holding.length + s.tavern.length}</span>}
            </button>
          ))}
        </nav>
        <div className="res">
          <span>Cycle <b>{s.cycle}</b></span>
          <span className="gold"><b>{s.gold}g</b></span>
          <span className="gh" title={s.ghNeed ? `raise the Great Hall to T${s.ghTier + 1} at ${s.ghNeed} prestige and ${s.ghCost}g` : 'the Great Hall is at its peak'}>
            <span>Prestige <b>{s.prestige.toFixed(1)}</b>{s.ghNeed ? ` / ${s.ghNeed}` : ''} · Great Hall T{s.ghTier}</span>
            <span className="bar"><i style={{ width: `${gh * 100}%` }} /></span>
          </span>
          <span>Soldiers <b>{s.roster.length}</b>/{s.rosterCap}</span>
          {s.captiveCap > 0 && <span>Captives <b>{s.captives.length}</b>/{s.captiveCap}</span>}
          <span className="ai" title="AI calls and cost this session">{s.aiName === 'openai' ? `AI ~$${s.ai.costUsd.toFixed(2)}` : 'AI: mock'}{live.length ? ` · ✎ ${live.length} writing` : ''}</span>
          {s.maxInFlight > 0 && <span className="capctl" title="how many quests may be written at once">
            <button disabled={s.maxInFlight <= 1} onClick={() => queueAct('inflight', s.maxInFlight - 1)} aria-label="fewer at once">−</button>
            ✎{s.maxInFlight}
            <button disabled={s.maxInFlight >= 6} onClick={() => queueAct('inflight', s.maxInFlight + 1)} aria-label="more at once">+</button>
          </span>}
          {s.lastReport?.length > 0 && <button className="link" onClick={() => { setReckAt(null); setReckoning(true) }}>Last reckoning</button>}
        </div>
      </header>

      <main className="stage">
        {screen === 'map' && (q
          ? <QuestPage s={s} q={q} doAct={doAct} quick={quick} armed={armed} setArmed={setArmed} back={() => setQuest(null)}
              readCast={(c: any) => setSheet({ id: '', cast: c })} drag={drag} setDrag={setDrag} />
          : <MapScreen s={s} doAct={doAct} quick={quick} queueAct={queueAct} openQuest={openQuest} drag={drag} setDrag={setDrag} goFort={() => go('fort')} />)}
        {screen === 'fort' && <FortScreen s={s} doAct={doAct} quick={quick} openCard={(id: string) => setSheet({ id })} />}
        {screen === 'chronicle' && <Chronicle s={s} />}
        {drawer && <Inventory s={s} close={() => setDrawer(false)} pick={pickCard} />}
        {pending && <div className="pending"><span className="spin" /> working: <b>{pending}</b>…</div>}
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>

      <Hand s={s} q={screen === 'map' ? q : null} armed={armed} pick={pickCard} drag={drag} setDrag={setDrag}
        openDrawer={() => setDrawer(d => !d)} drawer={drawer} fortMode={screen === 'fort'} />
      <button className="seal" disabled={busy} onClick={() => { setReckAt(s.cycle); setReckoning(true); doAct('end') }}
        aria-label="End the cycle">
        <span className="a">END</span><span className="a">CYCLE</span>
        <span className="b">{busy ? '…' : live.length ? `${live.length} writing` : '▸'}</span>
      </button>
      <div className="sealwarn">{unmanned ? `${unmanned} quest${unmanned > 1 ? 's' : ''} not manned` : s.quests.length ? 'every quest manned' : ''}</div>

      {sheet && <CardSheet s={s} id={sheet.id} cast={sheet.cast} doAct={doAct} quick={quick} close={() => setSheet(null)} openQuest={(id: string) => { setSheet(null); openQuest(id) }} />}
    </div>
  );
}
