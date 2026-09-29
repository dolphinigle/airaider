// THE MAP — home. Quests are markers on a woven map (hover = the gist, click = open it); a soldier
// dragged over it shows their fit on every quest and drops into their best place (Game.sendTo).
// The board on the right lists the same quests, plus the leads (designer: leads stay a separate
// list, not map markers).
import React, { useState } from 'react';
import { type S, Glyph, glyphOf, activeSlots, fitCls, gateOf, cap1, clip } from './ui';

const ZONES: Record<string, [number, number, number, number]> = {   // x, y, w, h in % of the map
  forests: [3, 8, 47, 84], city: [54, 6, 24, 40], highlands: [81, 6, 16, 44], coast: [62, 54, 35, 40], underdeep: [51, 58, 10, 36],
};
const hash = (t: string) => [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
/** Where each quest sits: one quest per row of its region first (a banner is ~220px wide, so two
 *  in a row collide), x jittered by id; only a crowded region doubles up, on the far side.
 *  Deterministic, so a quest keeps its spot for its whole life. */
function place(quests: any[]): Record<string, [number, number]> {
  const at: Record<string, [number, number]> = {};
  const byRegion: Record<string, any[]> = {};
  for (const q of quests) (byRegion[q.regionId] ??= []).push(q);
  for (const [region, qs] of Object.entries(byRegion)) {
    const [x, y, w, h] = ZONES[region] ?? ZONES.forests!;
    const rows = h > 60 ? 6 : 3;
    const taken = new Set<number>();
    qs.sort((a, b) => a.id.localeCompare(b.id)).forEach((q, n) => {
      const lap = Math.floor(n / rows);
      let r = hash(q.id) % rows;
      while (taken.has(lap * rows + r)) r = (r + 1) % rows;
      taken.add(lap * rows + r);
      const jitter = (hash(q.id + 'x') % 100) / 100;
      at[q.id] = [x + w * (lap ? 0.6 + 0.1 * jitter : 0.2 + 0.3 * jitter), y + h * (r + 0.5) / rows];
    });
  }
  return at;
}
const TREES: [number, number][] = [[6, 18], [14, 12], [30, 10], [40, 44], [46, 30], [8, 80], [20, 74], [36, 62], [44, 84], [26, 50], [16, 28], [42, 18]];

export const leadLabel = (l: any) => l.title ?? (l.archetype === 'lead-hunt' ? 'Word in the taverns' : l.archetype === 'hire' ? 'Someone worth hiring' : cap1(l.archetype.replace(/-/g, ' ')));

function chipOf(s: S, q: any): [string, string] {
  if (q.approaches && !q.chosenApproach) return ['choose', 'amber'];
  const act = activeSlots(q);
  if (act.every((x: any) => x.filledBy)) return ['ready', 'green'];
  if (q.faucet) return ['today', 'red'];
  const left = Math.max(0, q.lapsesAtCycle - s.cycle);
  return [`${left}`, left <= 2 ? 'red' : 'dark'];
}

export function MapScreen({ s, doAct, quick, queueAct, openQuest, drag, setDrag, goFort }: any) {
  const [hover, setHover] = useState<string | null>(null);
  const [tab, setTab] = useState<'quests' | 'leads'>('quests');
  const questsOpen = gateOf(s, 'quests')?.open;
  const at = place(s.quests);
  const dragFits: Record<string, any> = {};
  const dragger = drag ? s.roster.find((m: any) => m.id === drag) : null;
  for (const p of dragger?.placements ?? []) dragFits[p.questId] = p;

  return (
    <div className="mapscreen">
      <div className="map" onDragOver={e => e.preventDefault()}>
        <div className="forestwash" />
        {TREES.map(([x, y], i) => <svg key={i} className="tree" style={{ left: `${x}%`, top: `${y}%` }} width="22" height="26" viewBox="0 0 22 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M11 2L4 13h4l-5 7h16l-5-7h4zM11 20v5" /></svg>)}
        {(s.regions ?? []).map((r: any) => {
          const [x, y, w, h] = ZONES[r.id] ?? [0, 0, 0, 0];
          return r.unlocked
            ? <div key={r.id} className="rlabel" style={{ left: `${x + w / 2}%`, top: `${y + 2}%` }}>{r.name.toUpperCase()}</div>
            : <div key={r.id} className="veil" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
                <div className="plaque"><span className="n">{r.name.replace(/^The /, '').toUpperCase()}</span><span className="w">{r.ghTier <= s.ghTier ? "build its Scouting lodge" : `opens at Great Hall T${r.ghTier}`}</span></div>
              </div>;
        })}
        <div className="mk home" style={{ left: '6%', top: '50%' }}>
          <button className="ros" onClick={goFort} aria-label="Your hold — open the fort"><Glyph name="shield" size={22} /></button>
          <span className="ban">Your hold</span>
        </div>
        {s.quests.map((q: any) => {
          const [x, y] = at[q.id]!;
          const act = activeSlots(q);
          const [chip, chipCls] = chipOf(s, q);
          const fit = drag ? dragFits[q.id] : null;
          const cast = (q.cast ?? []).map((c: any) => c.name);
          const coins = act.reduce((n: number, x: any) => n + (x.filledCoins ?? 0), 0);
          const bar = act.reduce((n: number, x: any) => n + x.test.bar, 0);
          const filled = act.filter((x: any) => x.filledBy).length;
          const left = x > 55, up = y > 52;
          return (
            <div key={q.id} className={'mk' + (hover === q.id ? ' hot' : '') + (q.chainId ? ' saga' : '') + (drag && !fit ? ' dim' : '')}
              style={{ left: `${x}%`, top: `${y}%` }}
              onDragOver={e => { e.preventDefault(); if (hover !== q.id) setHover(q.id) }}
              onDragLeave={() => setHover(h => h === q.id ? null : h)}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setDrag(null); setHover(null); if (id) quick('send', q.id, id) }}>
              {drag && hover === q.id && fit && <span className="dropring" />}
              <span className={'chip ' + chipCls}>{chip === 'ready' || chip === 'choose' || chip === 'today' ? chip : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{chip}</>}</span>
              <button className="ros" onClick={() => openQuest(q.id)} onMouseEnter={() => setHover(q.id)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(q.id)} onBlur={() => setHover(null)} aria-label={`Open ${q.title}`}>
                <Glyph name={glyphOf(q.archetype, q.isFinale)} size={20} />
              </button>
              <span className={'ban' + (left ? ' left' : '')}>{q.title}
                <span className="pips">{act.map((x: any, i: number) => <i key={i} className={x.filledBy ? 'on' : ''} />)}</span></span>
              {fit && <span className={'fitb ' + fitCls(fit.coins, fit.bar)}>{fit.attr} {Math.round(fit.coins)} / {Math.round(fit.bar)}</span>}
              {hover === q.id && !drag && (
                <div className={'tip' + (left ? ' left' : '') + (up ? ' up' : '')}>
                  <div className="k">{q.isFinale ? 'Saga finale' : q.chainId ? `Saga · beat ${q.beat}` : 'One-off job'} · {q.rarity} · level {q.level}</div>
                  <div className="t">{q.title}</div>
                  <div className="j">{clip(q.job, 220)}</div>
                  <div className="rows">
                    <span>Manned</span><b>{filled}/{act.length}{filled ? ' — ' + act.filter((x: any) => x.filledBy).map((x: any) => x.filledBy.split(' ')[0]).join(', ') : ''}</b>
                    <span>Odds</span><b>{q.approaches && !q.chosenApproach ? 'pick how it ends first' : filled < act.length ? 'not fully manned' : `${Math.round(coins)} coins vs ${bar.toFixed(0)}${q.odds.success != null ? ` · ${Math.round(q.odds.success * 100)}%` : coins >= bar ? ' — likely' : coins >= bar * 0.6 ? ' — a partial at best' : ' — long odds'}`}</b>
                    <span>Pay</span><b>{q.rewardEnvelope}</b>
                    <span>Lapses</span><b>{q.faucet ? 'goes cold this cycle' : `in ${Math.max(0, q.lapsesAtCycle - s.cycle)} cycles`}</b>
                    {cast.length > 0 && <><span>On it</span><b>{cast.join(', ')}</b></>}
                  </div>
                  <div className="foot">{q.approaches && !q.chosenApproach ? 'A finale: open it and pick how it ends.' : 'Click to open · drop a soldier here to send them'}</div>
                </div>
              )}
            </div>
          );
        })}
        {!questsOpen && <div className="mapveil"><div className="plaque big"><span className="n">NO MAP ROOM YET</span>
          <span className="w">Build a Map room in the fort to take on quests.</span>
          <button className="btn solid" onClick={goFort}>Go to the fort</button></div></div>}
        {questsOpen && s.quests.length === 0 && <div className="mapempty">No quests out. Pursue a lead from the board →</div>}
      </div>

      <aside className="board" aria-label="The board">
        <div className="boardtabs" role="tablist">
          <button role="tab" className={tab === 'quests' ? 'on' : ''} onClick={() => setTab('quests')}>Quests <span>{s.quests.length}</span></button>
          <button role="tab" className={tab === 'leads' ? 'on' : ''} onClick={() => setTab('leads')}>Leads <span>{s.leads.length}</span></button>
        </div>
        {tab === 'quests' ? <QuestList s={s} doAct={doAct} openQuest={openQuest} hover={hover} setHover={setHover} />
          : <LeadList s={s} queueAct={queueAct} />}
      </aside>
    </div>
  );
}

function QuestList({ s, doAct, openQuest, hover, setHover }: any) {
  const sagas = s.quests.filter((q: any) => q.chainId), jobs = s.quests.filter((q: any) => !q.chainId);
  const row = (q: any) => {
    const act = activeSlots(q), choose = q.approaches && !q.chosenApproach;
    const ready = !choose && act.every((x: any) => x.filledBy);
    return (
      <div key={q.id} className={'row' + (hover === q.id ? ' hot' : '')} onMouseEnter={() => setHover(q.id)} onMouseLeave={() => setHover(null)}>
        <span className={'g' + (q.chainId ? ' saga' : '')}><Glyph name={glyphOf(q.archetype, q.isFinale)} size={15} /></span>
        <button className="open" onClick={() => openQuest(q.id)}>
          <span className="tt">{q.title}</span>
          <span className="ss">
            <span className="pips">{act.map((x: any, i: number) => <i key={i} className={x.filledBy ? 'on' : ''} />)}</span>
            <span className={choose ? 'amber' : ready ? 'green' : q.faucet ? 'red' : ''}>
              {choose ? 'finale · pick how it ends' : ready ? 'ready to march' : q.faucet ? 'goes cold this cycle' : `lapses in ${Math.max(0, q.lapsesAtCycle - s.cycle)}`}</span>
          </span>
        </button>
        {choose ? <button className="btn" onClick={() => openQuest(q.id)}>Choose</button>
          : !ready && <button className="btn" onClick={() => doAct('auto', q.id)}>Auto</button>}
      </div>
    );
  };
  if (!s.quests.length) return <div className="list"><p className="empty">No quests yet. Pursue a lead to have one written up.</p></div>;
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

function LeadList({ s, queueAct }: any) {
  const gate = gateOf(s, 'leads');
  const jobs: any[] = s.jobs ?? [];
  const failed = jobs.filter(j => j.state === 'failed');
  if (gate && !gate.open) return <div className="list"><p className="empty">Build a <b>{gate.need}</b> to read leads.</p></div>;
  return (
    <div className="list">
      {failed.map(j => <div key={j.id} className="failrow">✗ {j.title} — {j.error ?? 'the writing failed'}. Pursue it again.</div>)}
      {s.leads.length === 0 && <p className="empty">No leads. They are earned: run scouting jobs, finish quests.</p>}
      {s.leads.map((l: any) => {
        const job = jobs.find(j => j.leadId === l.id && (j.state === 'queued' || j.state === 'running'));
        const cold = l.expires == null ? null : l.expires - s.cycle;
        return (
          <div key={l.id} className="row lead">
            <span className="g lead"><Glyph name={glyphOf(l.archetype)} size={14} /></span>
            <div>
              <div className="tt">{leadLabel(l)}{l.chain === 'starts-new' ? <span className="badge2">new saga</span> : l.chain === 'continues' ? <span className="badge2">continues</span> : null}</div>
              <div className="ss">
                <span style={{ color: RARITY[l.rarity] }}>{l.rarity}</span><span>L{l.level}</span><span>{l.region}</span>
                {l.pay?.band ? <span className="payb">{l.pay.stars} {l.pay.label}</span> : null}
                <span className={cold != null && cold <= 3 ? 'red' : ''}>{cold == null ? 'no deadline' : `cold in ${cold}`}</span>
              </div>
            </div>
            {job ? <span className="writing">{job.state === 'queued' ? '⋯ queued' : <><span className="spin" /> writing</>}{job.state === 'queued' && <button className="qx" onClick={() => queueAct('cancel', job.id)} aria-label="drop from the queue">×</button>}</span>
              : <button className="btn" onClick={() => queueAct('pursue', l.id)}>Pursue</button>}
          </div>
        );
      })}
      {s.leadsWaiting > 0 && <p className="empty">+{s.leadsWaiting} more lead{s.leadsWaiting === 1 ? '' : 's'} earned — they wait on a <b>Lead room</b> to be read.</p>}
    </div>
  );
}
