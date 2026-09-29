// Airaider v3 web GUI — the Sultan-style table: a map (home), the fort, the chronicle, and the
// hand of cards always along the bottom. Design: docs/UI.md. Every action goes through /api/action
// → the same Game methods the CLI calls (docs/DOGFOODING.md).
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { act, type S, HOLDING_SEL } from './ui';
import { MapScreen } from './MapScreen';
import { QuestPage } from './QuestPage';
import { Hand, Inventory } from './Hand';
import { CardSheet } from './Sheets';
import { FortScreen } from './FortScreen';
import { Chronicle, Reckoning } from './Chronicle';
import { ConfirmButton, useDeltaFloater, useBump } from './fx';

type Tone = 'ok' | 'warn' | 'bad';
// an engine result's tone: refused = red, done-with-a-caveat (r.warn) = amber, done = green
const toneOf = (r: { ok: boolean; warn?: unknown }): Tone => !r.ok ? 'bad' : r.warn ? 'warn' : 'ok';
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Screen = 'map' | 'fort' | 'chronicle';
const NAV: [Screen, string, string][] = [
  ['map', 'Map', 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'],
  ['fort', 'Fort', 'M4 21V9l2 1V6h2v2h2V6h4v2h2V6h2v4l2-1v12zM10 21v-5h4v5'],
  ['chronicle', 'Chronicle', 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11'],
];
/** a next step's target.screen values that live on the fort screen (the Fort nav dot counts them) */
const FORT_TARGETS = new Set(['fort', 'room', 'build', 'holding', 'tavern']);
const STEP_GLYPH: Record<string, string> = {
  build: '⚒', approach: '♛', man: '⚔', pursue: '✎', holding: '⛓', hire: '✚', gh: '▲', setin: '✦', rack: '⛓', addplace: '+', end: '▸',
};

type Toast = { id: number; msg: string; tone: Tone; open?: { label: string; run: () => void } };

export function App() {
  const q0 = new URLSearchParams(location.search);
  const [s, setS] = useState<S | null>(null);
  // ?screen= / ?quest= / ?card= deep-link a screen (and are how a headless browser reaches one)
  const [screen, setScreen] = useState<Screen>((q0.get('screen') as Screen) || 'map');
  const [quest, setQuest] = useState<string | null>(q0.get('quest'));
  const [sheet, setSheet] = useState<{ id: string; cast?: any } | null>(q0.get('card') ? { id: q0.get('card')! } : null);
  const [drawer, setDrawer] = useState(q0.get('drawer') === '1');
  const [drag, setDrag] = useState<string | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  // the reckoning is its own PAGE: it opens the instant END is clicked and closes on PROCEED
  const [reckoning, setReckoning] = useState(false);
  const [reckAt, setReckAt] = useState<number | null>(null);
  // the fort's selected room lives here so the hand (and the next-steps scroll) can act on it;
  // the board tab likewise, so anything can open the Leads tab
  const [fortSel, setFortSel] = useState<string | null>(q0.get('room'));   // ?room= deep-links a fort selection
  const [boardTab, setBoardTab] = useState<'quests' | 'leads'>('quests');
  const [sealArmed, setSealArmed] = useState(false);
  const [sealHover, setSealHover] = useState(false);
  const [ghOpen, setGhOpen] = useState(false);
  const [moreSteps, setMoreSteps] = useState(false);
  // a next step / fix that names a room type to build: the build list scrolls to it and flashes it
  const [buildHi, setBuildHi] = useState<{ type: string; n: number } | null>(null);

  const refresh = useCallback(async () => { setS(await (await fetch('/api/state')).json()) }, []);
  // the card sheet is a modal: while it is up, the page's own keys (1–4 bags, B, E) stand down
  const modal = !!sheet;
  useEffect(() => { refresh() }, [refresh]);
  // every action result is a toast — top centre, click-through (bar its Open button), replaced by the next one
  const say = (msg: string, tone: Tone = 'ok', ms = 4000, open?: Toast['open']) => {
    if (!msg) return;
    const id = Date.now() + Math.random();
    setToast({ id, msg, tone, open });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(t => t?.id === id ? null : t), ms);
  };

  // actions that can hit the AI (renovate) poll the state while they run
  const doAct = async (type: string, ...args: (string | number)[]) => {
    setBusy(true); setPending(type);
    const poll = setInterval(() => { refresh().catch(() => {}) }, 1200);
    try { const r = await act(type, ...args); say(r.msg, toneOf(r)) }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`, 'bad') }
    finally { clearInterval(poll); setPending(null); setBusy(false); await refresh().catch(() => {}) }
  };
  // TEMPO P1: queued actions (pursue, cancel, inflight) never touch `busy`
  const queueAct = async (type: string, ...args: (string | number)[]) => {
    try { const r = await act(type, ...args); say(r.msg, toneOf(r)) }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`, 'bad') }
    finally { await refresh().catch(() => {}) }
  };
  // quick placements: no pending banner, just the result
  const quick = async (type: string, ...args: (string | number)[]) => {
    try { const r = await act(type, ...args); say(r.msg, toneOf(r)) }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`, 'bad') }
    await refresh().catch(() => {});
  };
  // END: the reckoning page opens at once; its "cycle N resolved" is not news — PROCEED toasts the tally
  const endCycle = async () => {
    if (!s || busy) return;
    setReckAt(s.cycle); setReckoning(true);
    setBusy(true); setPending('end');
    const poll = setInterval(() => { refresh().catch(() => {}) }, 1200);
    try { const r = await act('end'); if (!r.ok) say(r.msg, 'bad') }
    catch (e) { say(`request failed: ${(e as Error).message ?? e}`, 'bad') }
    finally { clearInterval(poll); setPending(null); setBusy(false); await refresh().catch(() => {}) }
  };

  const jobs: any[] = s?.jobs ?? [];
  const live = jobs.filter(j => j.state === 'queued' || j.state === 'running');
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

  // TEMPO P6: arrival is announced, never staged — by settle number (Game.arrivals, the CLI's rule):
  // everything settled before the first load is old news; every later seq is toasted once
  const seenSeq = useRef<number | null>(null);
  const seenBoot = useRef<string | null>(null);
  useEffect(() => {
    if (!s) return;
    // a restarted server numbers its settles from 1 again: re-baseline, as on the first load
    if (seenSeq.current === null || s.bootId !== seenBoot.current) { seenSeq.current = s.arrivalSeq ?? 0; seenBoot.current = s.bootId ?? null; return }
    const fresh = jobs.filter(j => (j.seq ?? 0) > seenSeq.current!);
    if (!fresh.length) return;
    seenSeq.current = Math.max(seenSeq.current, ...fresh.map(j => j.seq ?? 0));
    const done = fresh.filter(j => j.state === 'done'), failed = fresh.filter(j => j.state === 'failed');
    const failTxt = failed.length ? ` · ✗ ${failed.map(j => j.title).join(', ')} — the writing failed; the lead is still there` : '';
    if (done.length === 1 && done[0].questId) {
      const j = done[0];
      say(`✦ ${j.questTitle ?? j.title} is on the map${failTxt}`, 'ok', 7000, { label: 'Open', run: () => openQuest(j.questId) });
    } else if (done.length > 1) {
      say(`✦ ${done.length} new quests are on the map: ${done.map(j => j.questTitle ?? j.title).join(' · ')}${failTxt}`, 'ok', 7000,
        { label: 'Open', run: () => { setBoardTab('quests'); go('map') } });
    } else if (failed.length) {
      say(failTxt.slice(3), 'bad', 7000);
    }
  }, [s]);

  // the header's numbers float their change (+253g / −120g). Frozen while the reckoning page is up,
  // so the cycle's whole gain floats the moment the player is back at the table.
  const shown = useRef<{ gold: number; prestige: number } | null>(null);
  if (s && !reckoning) shown.current = { gold: s.gold, prestige: s.prestige };
  // 'side': the chip floats beside the number, inside the header — below it, it sat on the next-steps row
  const goldFloat = useDeltaFloater(shown.current?.gold, d => `${d > 0 ? '+' : '−'}${Math.abs(d)}g`, { place: 'side' });
  // the delta between the two numbers the header SHOWS (4.1 → 5.1 floats +1.0, never +1.1)
  const presFloat = useDeltaFloater(shown.current ? Math.round(shown.current.prestige * 10) / 10 : undefined,
    d => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} ✦`, { eps: 0.05, place: 'side' });
  const goldBump = useBump(shown.current?.gold);
  const presBump = useBump(shown.current ? Math.round(shown.current.prestige * 10) : null);

  const q = quest && s ? s.quests.find((x: any) => x.id === quest) : null;
  useEffect(() => { if (s && quest && !q) setQuest(null) }, [s, quest, q]);
  useEffect(() => { setArmed(null) }, [quest]);
  // the armed place is only ever an EMPTY place of the approach in play: an approach switch, Auto,
  // a fill from anywhere (another tab, the CLI) — whatever changed it, a stale arm is dropped
  useEffect(() => {
    if (armed == null) return;
    const act = q ? (q.approaches ? q.slots.filter((x: any) => x.groupId === q.chosenApproach) : q.slots) : [];
    if (!act.some((x: any) => x.idx === armed && !x.filledBy)) setArmed(null);
  }, [q, armed]);
  const fortRoom = fortSel && s ? (s.fort?.rooms ?? []).find((r: any) => r.id === fortSel) ?? null : null;
  // HOLDING_SEL: the holding list itself — reachable with or without a Holding cell room
  useEffect(() => { if (s && fortSel && !fortRoom && !(fortSel === HOLDING_SEL && (s.holding ?? []).length)) setFortSel(null) }, [s, fortSel, fortRoom]);
  // the seal's hover state dies with the shell when the reckoning page replaces it (no mouseleave
  // ever fires) — start clean every time the page opens
  useEffect(() => { if (reckoning) { setSealHover(false); setMoreSteps(false) } }, [reckoning]);
  // the "+N" popover closes on a click outside it
  useEffect(() => {
    if (!moreSteps) return;
    const off = (e: PointerEvent) => { if (!(e.target as HTMLElement)?.closest?.('.nextsteps')) setMoreSteps(false) };
    addEventListener('pointerdown', off);
    return () => removeEventListener('pointerdown', off);
  }, [moreSteps]);
  // keys: Escape backs out one layer at a time (sheet, drawer, armed slot, quest); B the drawer;
  // E presses the seal (through the same END guard as a click)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape' && drawer) setDrawer(false);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (reckoning) return;   // the reckoning page has its own keys (Enter / Space = PROCEED)
      if (e.key === 'Escape') {
        if (moreSteps) return setMoreSteps(false);
        if (sheet) return setSheet(null);
        if (drawer) return setDrawer(false);
        if (armed != null) return setArmed(null);
        if (quest) return setQuest(null);
        if (screen === 'fort' && fortSel) return setFortSel(null);
      }
      // preventDefault: the keystroke must not land in the drawer's search box as it opens
      if (sheet) return;   // a modal is up: its own keys only (Esc above)
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setDrawer(d => !d) }
      if ((e.key === 'e' || e.key === 'E') && !drawer) { e.preventDefault(); document.querySelector<HTMLButtonElement>('button.seal')?.click() }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [sheet, drawer, armed, quest, reckoning, screen, fortSel, moreSteps]);

  if (!s) return <div className="app loading">loading…</div>;
  // leaving the fort forgets its selected room (as it did when the fort owned it)
  const go = (sc: Screen) => { if (sc !== screen) setFortSel(null); setScreen(sc); setQuest(null); setDrawer(false); setMoreSteps(false) };
  const openQuest = (id: string) => { setScreen('map'); setQuest(id); setDrawer(false); setMoreSteps(false) };
  const openRoom = (id: string | null) => { setScreen('fort'); setQuest(null); setDrawer(false); setMoreSteps(false); setFortSel(id) };
  // a card that is no longer anywhere (sold, ransomed, gone) opens nothing — and leaves no
  // invisible sheet behind to swallow Esc and the E key
  const cardExists = (id: string) => [s.roster, s.captives, s.relics, s.liabilities, s.tavern, s.holding]
    .some((l: any[] | undefined) => (l ?? []).some((c: any) => c.id === id));
  const openCard = (id: string) => { if (cardExists(id)) setSheet({ id }) };
  const openLeads = () => { setBoardTab('leads'); go('map') };
  const roomOfType = (type: string) => (s.fort?.rooms ?? []).find((r: any) => r.type === type)?.id ?? null;
  // holding decisions are reachable whether or not a Holding cell stands (the engine never needs one)
  const openHolding = (cardId?: string) => { openRoom(roomOfType('holding-cell') ?? HOLDING_SEL); if (cardId) openCard(cardId) };

  // leaving the reckoning (PROCEED, or a tally chip that goes somewhere): the cycle's spoils as one
  // toast line, and an empty board with leads waiting opens on the Leads tab
  const leaveReckoning = () => {
    setReckoning(false);
    if (reckAt === null) return;          // it was a look back, not a fresh END
    setReckAt(null);
    // only THIS cycle's tally (a stale one from before an END that broke off must never toast)
    if (s.lastTally && s.lastSummary?.cycle === s.cycle) say(`Cycle ${s.cycle} · ${s.lastTally}`, 'ok', 6000);
    if (!s.quests.length && (s.leads ?? []).length) setBoardTab('leads');
  };
  const viaReck = <A extends unknown[]>(f: (...a: A) => void) => (...a: A) => { leaveReckoning(); f(...a) };
  if (reckoning) return <Reckoning s={s} busy={busy} reckAt={reckAt} jobs={jobs} onProceed={leaveReckoning}
    openQuest={viaReck(openQuest)} openRoom={viaReck(openRoom)} openCard={viaReck(openCard)} openLeads={viaReck(openLeads)}
    openHolding={viaReck(openHolding)} cardExists={cardExists} roomOfType={roomOfType} />;

  // where a next step (or anything else carrying an engine target) leads
  const goTarget = (t: any) => {
    switch (t?.screen) {
      case 'quest': return t.questId ? openQuest(t.questId) : go('map');
      case 'leads': return openLeads();
      case 'map': setBoardTab('quests'); return go('map');
      case 'room': return openRoom(t.roomId ?? null);
      case 'holding': return openHolding(t.cardId);
      case 'tavern': openRoom(roomOfType('tavern')); if (t.cardId) openCard(t.cardId); return;
      case 'build': if (t.type) setBuildHi({ type: t.type, n: Date.now() }); return openRoom(null);
      case 'fort': return openRoom(t.roomId ?? null);
    }
  };

  // a card clicked in the hand: on an open quest it goes in (the armed place — swapping whoever holds
  // it — else its best place); in the fort with a room selected, a relic or captive is set in that room
  const pickCard = (c: any) => {
    if ((s.holding ?? []).some((h: any) => h.id === c.id)) return setSheet({ id: c.id });   // a holding captive: decide first
    if (q && c.character?.role === 'merc') {
      if (armed != null) { const idx = armed; setArmed(null); return quick('send', q.id, c.id, idx) }
      return quick('send', q.id, c.id);
    }
    if (screen === 'fort' && fortRoom?.kind && c.whereId !== fortRoom.id && (c.type === 'relic' || c.character?.role === 'captive')) return quick('setin', fortRoom.id, c.id);
    setSheet({ id: c.id });
  };

  const steps: any[] = s.nextSteps ?? [];
  const fortSteps = steps.filter(x => FORT_TARGETS.has(x.target?.screen) && x.kind !== 'end');
  const warns: any[] = s.endWarnings ?? [];
  const nCold = warns.filter(w => w.lapsesNow && (w.why === 'lapses' || w.why === 'lead-lapses' || w.why === 'needs-approach')).length;
  const nShort = warns.filter(w => w.why === 'short').length;
  const nEnding = warns.filter(w => w.why === 'needs-approach').length;
  const nHand = warns.filter(w => w.why === 'handoff').length;
  const nLeave = warns.filter(w => w.why === 'leaves').length;
  const warnSum = [nCold && `${nCold} go${nCold === 1 ? 'es' : ''} cold`, nShort && `${nShort} won't march`,
    nEnding && `${nEnding} need${nEnding === 1 ? 's' : ''} an ending`, nHand && `${nHand} handed off`, nLeave && `${nLeave} leave${nLeave === 1 ? 's' : ''} the tavern`].filter(Boolean).join(' · ');
  const marching: number = s.marching ?? 0;
  const sealReady = !busy && !warns.length && marching > 0;

  // THE GREAT HALL GOAL — always in the header: the next tier, prestige toward it, what it opens
  const gh = s.gh ?? { tier: s.ghTier, next: s.ghNeed ? s.ghTier + 1 : null, need: s.ghNeed, have: s.prestige, cost: s.ghCost, ready: false, block: null, unlocks: [] };
  const ghNames: string[] = s.ghUnlocks ?? (gh.unlocks ?? []).map((u: any) => u.name);
  const opens = ghNames.length ? `\u00a0· opens ${ghNames.join(', ')}` : '';
  const ghFill = gh.need ? Math.min(1, s.prestige / gh.need) : 1;
  const hallId = roomOfType('great-hall');

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
              {k === 'fort' && fortSteps.length > 0 && <span className="dot" title={fortSteps.map(x => x.text).join('\n')}>{fortSteps.length}</span>}
            </button>
          ))}
        </nav>
        <div className="res">
          <span>Cycle <b>{s.cycle}</b></span>
          <span className="gold val"><b key={goldBump} className={goldBump ? 'fx-flash' : ''}>{s.gold}g</b>{goldFloat}</span>
          <span className="ghwrap val" onMouseLeave={() => setGhOpen(false)}>
            {gh.ready
              ? <button className="gh ready fx-glow" onClick={() => quick('gh')} title={`raise it now — opens ${ghNames.join(', ')}`}>
                  <span className="l1">▲ Raise Great Hall · {gh.cost}g</span>
                  <span className="l2"><span className="op">T{gh.next}{opens}</span></span>
                </button>
              : <button className="gh" onClick={() => setGhOpen(o => !o)} aria-expanded={ghOpen}
                  title={gh.need ? (s.ghBlock ?? `raise the Great Hall to T${gh.next} at ${gh.need} prestige and ${gh.cost}g`) : 'the Great Hall is at its peak'}>
                  <span className="l1">{gh.need
                    ? <><span className="k">Great Hall T{gh.next}: <b key={presBump} className={presBump ? 'fx-flash' : ''}>{s.prestige.toFixed(1)}</b>/{gh.need} ✦</span><span className="op">{opens}</span></>
                    : <span className="k">Great Hall T{gh.tier} · <b>{s.prestige.toFixed(1)}</b> ✦ · at its peak</span>}</span>
                  <span className="bar"><i style={{ width: `${ghFill * 100}%` }} /></span>
                </button>}
            {presFloat}
            {ghOpen && !gh.ready && <div className="ghpop" role="dialog" aria-label="Prestige">
              {s.ghBlock && <p className="why">{s.ghBlock}</p>}
              <span className="lbl">Prestige comes from</span>
              {(s.prestigeSources ?? []).length === 0 && <p className="p dimp">No room gives prestige yet — set relics or tamed captives in a Garden, Dining hall…</p>}
              {(s.prestigeSources ?? []).map((p: any) => (
                <button key={p.roomId} className="src" onClick={() => { setGhOpen(false); openRoom(p.roomId) }}>
                  <span>{p.name}</span><span className={p.prestige > 0 ? 'on' : 'dimp'}>{p.effect}</span>
                </button>))}
            </div>}
          </span>
          <span>Soldiers <b>{s.roster.length}</b>/{s.rosterCap}</span>
          {s.captiveCap > 0 && <span title="counts captives in the cells, on the rack or on show — holding does not count until you take them">Captives <b>{s.captives.length}</b>/{s.captiveCap}</span>}
          <span className="ai" title="AI calls and cost this session">{s.aiName === 'openai' ? `AI ~$${s.ai.costUsd.toFixed(2)}` : 'AI: mock'}{live.length ? ` · ✎ ${live.length} writing` : ''}</span>
          {s.maxInFlight > 0 && <span className="capctl" title="how many quests may be written at once">
            <button disabled={s.maxInFlight <= 1} onClick={() => queueAct('inflight', s.maxInFlight - 1)} aria-label="fewer at once">−</button>
            ✎{s.maxInFlight}
            <button disabled={s.maxInFlight >= 6} onClick={() => queueAct('inflight', s.maxInFlight + 1)} aria-label="more at once">+</button>
          </span>}
        </div>
      </header>

      <NextSteps steps={steps} more={moreSteps} setMore={setMoreSteps} goTarget={goTarget} quick={quick} />

      <main className="stage">
        {screen === 'map' && (q
          ? <QuestPage s={s} q={q} doAct={doAct} quick={quick} armed={armed} setArmed={setArmed} back={() => setQuest(null)}
              readCast={(c: any) => setSheet({ id: '', cast: c })} drag={drag} setDrag={setDrag} openCard={openCard} say={say} />
          : <MapScreen s={s} doAct={doAct} quick={quick} queueAct={queueAct} openQuest={openQuest} drag={drag} setDrag={setDrag} goFort={() => go('fort')}
              boardTab={boardTab} setBoardTab={setBoardTab} openRoom={openRoom} say={say} />)}
        {screen === 'fort' && <FortScreen s={s} doAct={doAct} quick={quick} openCard={openCard}
          sel={fortSel} setSel={setFortSel} drag={drag} setDrag={setDrag} say={say} buildHi={buildHi} openHolding={openHolding} />}
        {screen === 'chronicle' && <Chronicle s={s} openQuest={openQuest} openLeads={openLeads} />}
        {drawer && <Inventory s={s} close={() => setDrawer(false)} pick={pickCard} modal={modal} />}
        {pending && <div className="pending"><span className="spin" /> working: <b>{pending}</b>…</div>}
        {toast && <div key={toast.id} className="toast fx-drop-in" data-tone={toast.tone} role="status">
          <span>{toast.msg}</span>
          {toast.open && <button className="btn sm" onClick={() => { const o = toast.open!; setToast(null); o.run() }}>{toast.open.label} →</button>}
        </div>}
      </main>

      <Hand s={s} q={screen === 'map' ? q : null} armed={armed} pick={pickCard} drag={drag} setDrag={setDrag}
        openDrawer={() => setDrawer(d => !d)} drawer={drawer} modal={modal} fortMode={screen === 'fort'} room={screen === 'fort' ? fortRoom : null} quick={quick} />

      {/* THE SEAL — END CYCLE. With warnings (R5) the first click arms it and says what END would
          leave behind; the second ends the cycle. Nothing at risk: one click. */}
      <div className={'sealbox' + (sealArmed ? ' armed' : '')} onMouseEnter={() => setSealHover(true)} onMouseLeave={() => setSealHover(false)}>
        {warns.length > 0 && (sealArmed || sealHover) && <div className="sealwarns" role="status">
          <span className="lbl">{sealArmed ? 'Click again to END anyway — this leaves behind:' : 'END would leave behind:'}</span>
          {warns.map(w => (
            <button key={w.key ?? w.questId} onClick={() => goTarget(w.target ?? { screen: 'quest', questId: w.questId })}>
              <b>{w.title}</b><span className={w.lapsesNow ? 'cold' : ''}>{w.text}</span>
            </button>))}
        </div>}
        {(s.reckoningCycles ?? []).length > 0 && <button className="lastrep" onClick={() => { setSealHover(false); setReckAt(null); setReckoning(true) }}>📜 last report</button>}
        <ConfirmButton className={'seal' + (sealReady ? ' ready' : '')} disabled={busy} needsConfirm={warns.length > 0} ms={4000}
          onArm={setSealArmed} onConfirm={endCycle}
          aria-label={warns.length ? `End the cycle — ${warnSum}` : 'End the cycle'}
          label={<>
            <span className="a">END</span><span className="a">CYCLE</span>
            <span className="b">{busy ? '…' : live.length ? `${live.length} writing` : marching ? `${plural(marching, 'party marches', 'parties march')}` : 'nobody marches'}</span>
            <kbd className="key">E</kbd>
          </>}
          armedLabel={<>
            <span className="a">END</span><span className="a sm">ANYWAY?</span>
            <span className="b">{warnSum}</span>
          </>} />
        <div className={'sealwarn' + (warns.length ? ' sw-warn' : sealReady ? ' sw-ok' : '')}>
          {warns.length ? `⚑ ${warnSum}` : sealReady ? 'all set' : ''}
        </div>
      </div>

      {sheet && <CardSheet s={s} id={sheet.id} cast={sheet.cast} doAct={doAct} quick={quick} close={() => setSheet(null)} openQuest={(id: string) => { setSheet(null); openQuest(id) }}
        openRoom={(id: string | null) => { setSheet(null); openRoom(id) }} say={say} />}
    </div>
  );
}

/** the "end the cycle" step points at the seal: it pulses once (not under reduced motion) */
const pingSeal = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('button.seal')?.animate?.([{ scale: '1' }, { scale: '1.08' }, { scale: '1' }], { duration: 500 });
};

/** THE NEXT-STEPS SCROLL (R4) — the engine's own list (Game.nextSteps), most pressing first. The
 *  step goes where it points; its button (when it has one) does it in one click, the same action
 *  the CLI's `next` names. Always shown, on its own row, so it never covers a screen. */
function NextSteps({ steps, more, setMore, goTarget, quick }: {
  steps: any[]; more: boolean; setMore: (f: (b: boolean) => boolean) => void; goTarget: (t: any) => void; quick: (type: string, ...a: (string | number)[]) => void;
}) {
  const shown = steps.slice(0, 3), rest = steps.slice(3);
  // the step's whole words ride in its tooltip — its text can be clipped, who and why never lost
  const one = (st: any, i: number) => (
    <div key={`${st.kind}-${i}`} className={'step' + (st.urgent ? ' urgent' : '') + (st.kind === 'end' ? ' end' : '')} title={st.detail ? `${st.text} — ${st.detail}` : st.text}>
      <button className="go" onClick={() => { setMore(() => false); st.kind === 'end' ? pingSeal() : goTarget(st.target) }}>
        <span className="g" aria-hidden="true">{STEP_GLYPH[st.kind] ?? '▸'}</span>
        <span className="t">{st.text}</span>
        {st.detail && <span className="d">{st.detail}</span>}
      </button>
      {st.act && <button className="btn sm" disabled={!!st.act.block} title={st.act.block ?? `${st.act.label}${st.act.then ? `, then ${st.act.then}` : ''}`}
        onClick={() => { setMore(() => false); quick(st.act.type, ...st.act.args) }}>{st.act.label}</button>}
    </div>
  );
  return (
    <nav className="nextsteps" aria-label="Next steps">
      <span className="lbl">Next</span>
      <div className="steps">{shown.map(one)}</div>
      {rest.length > 0 && <button className="more" aria-expanded={more} onClick={() => setMore(m => !m)}>+{rest.length}</button>}
      {more && rest.length > 0 && <div className="morepop">{rest.map((st, i) => one(st, i + 3))}</div>}
    </nav>
  );
}
