// A QUEST, OPENED (docs/QUEST_SCREEN.md G1–G3, docs/UI.md §4). Left: the saga's own people held in
// brass clasps, the ways a finale can end, and the places to fill as niches over the roll. Right: the
// written quest. Every placement is ONE engine call the CLI also makes: a niche drop or a card click
// is `send <q> <merc> [slot]` (moves a committed soldier, swaps an occupied niche), plus unassign /
// auto / approach / abandon. Every verdict shown here is the engine's: the POOLED quest band
// (odds.band) for the roll, a strong/fair/weak colour for one soldier at one place (R2).
import React, { useEffect, useRef, useState } from 'react';
import { activeSlots, Silhouette, CardFace, shortTitle } from './ui';
import { BAND_WORD, BAND_ORDER, bandCls, strengthCls, STRENGTH_WORD, coinBadge, type Band } from './band';
import { ConfirmButton } from './fx';

// an approach and its niches share one outline colour
const AP_HUE = ['#6fc3d6', '#e0a15e', '#b89cf0', '#9fd28f'];
const first = (name: string) => name.split(/\s+/)[0] ?? name;
const attrOf = (sl: any) => sl.attr ?? sl.test.attributes.join('+').toUpperCase();

/** re-key a one-shot effect when `v` changes on the same quest (never on first sight of a quest) */
function useChangeKey<T>(qid: string, v: T, when: (prev: T, next: T) => boolean = (a, b) => a !== b) {
  const prev = useRef<{ q: string; v: T } | null>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const p = prev.current;
    prev.current = { q: qid, v };
    if (p && p.q === qid && when(p.v, v)) setK(n => n + 1);
  }, [qid, v]);
  return k;
}

export function QuestPage({ s, q, doAct, quick, armed, setArmed, back, readCast, drag, setDrag, openCard }: any) {
  const act = activeSlots(q);
  const filled = act.filter((x: any) => x.filledBy).length;
  const choose = !!q.approaches && !q.chosenApproach;
  const ready = !choose && act.length > 0 && filled === act.length;
  const o = q.odds ?? {};
  const band: Band | null = ready ? (o.band ?? null) : null;
  const pct = o.success != null && band ? ` · ~${Math.round(o.success * 100)}%` : '';
  // a standing post renews every cycle — not a loss, never red (the map says the same); a quest set
  // aside by the stall rule says so; the red threshold is the engine's (lapseUrgent)
  const left = Math.max(0, q.lapsesAtCycle - s.cycle);
  const lapse = q.faucet ? '↻ renews each cycle' : q.lapseStalled ? `set aside in ${left} unless it marches` : `lapses in ${left}`;
  const chain = q.chainId ? (s.chains ?? []).find((c: any) => c.id === q.chainId) : null;
  const [over, setOver] = useState<number | null>(null);
  const [arming, setArming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const flashK = useChangeKey(q.id, band);
  const sealK = useChangeKey(q.id, ready, (a, b) => !a && b);
  const [sealOn, setSealOn] = useState(false);
  useEffect(() => {
    if (!sealK) return;
    setSealOn(true);
    const t = setTimeout(() => setSealOn(false), 1900);
    return () => clearTimeout(t);
  }, [sealK]);
  useEffect(() => { if (!ready) setSealOn(false) }, [ready]);
  useEffect(() => { setOver(null); setArming(false) }, [q.id]);

  // ── a soldier in flight over the page: their coins at each niche, and the best one ──
  const dragging = !!drag && (s.roster ?? []).some((m: any) => m.id === drag);
  const fitAt = (sl: any) => dragging ? (sl.fits ?? []).find((f: any) => f.id === drag) ?? null : null;
  let bestIdx: number | null = null;
  if (dragging) {
    let top = -Infinity;
    for (const sl of act) { const f = fitAt(sl); if (f && !f.blocked && f.coins > top) { top = f.coins; bestIdx = sl.idx } }
  }
  const drop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || drag;
    setDrag(null); setOver(null); setArmed?.(null);
    if (id) quick('send', q.id, id, idx);
  };

  // the pay as loot chips: rewardEnvelope is 'a relic + a lead + a month's pay · and the saga still owes'
  const [payNow, ...payTail] = String(q.rewardEnvelope ?? '').split(' · ');
  const loot = (payNow ?? '').split(' + ').filter(Boolean);

  const verdict = choose ? 'Pick how it ends first — each way tests something different.'
    : filled === 0 ? 'Nobody is placed yet.'
    : !ready ? `${act.length - filled} still to place — the verdict comes when every place is filled.`
    : 'Every place is filled.';

  return (
    <div className="questpage">
      <section className={'scene' + (choose ? ' choosing' : '') + (dragging ? ' dragging' : '')} aria-label="Who goes">
        {q.approaches && (
          <div className="approaches">
            <span className="lbl">How it ends{choose ? ' — pick one' : ''}</span>
            <div className="apps" style={{ gridTemplateColumns: `repeat(${q.approaches.length}, minmax(0, 1fr))` }}>{q.approaches.map((a: any, ai: number) => {
              const slots = q.slots.filter((sl: any) => sl.groupId === a.id);
              const on = q.chosenApproach === a.id;
              const body = <>
                <span className="al">{a.label}</span>
                {a.outcome && <span className="ao">→ {a.outcome}</span>}
                {a.warn && <span className="aw">⚠ {a.warn}</span>}
                {slots.map((sl: any) => {
                  // who the card names — the engine's pick (Game.approachBest, the CLI prints the same)
                  const best = sl.best;
                  const busy = best?.from ? best.from.title : null;
                  return (
                    <span className="af" key={sl.idx}>
                      <span><b>{attrOf(sl)}</b> · bar {sl.test.bar.toFixed(1)}{sl.test.favored.length > 0 && <> · helps {sl.test.favored.join(', ')}</>}</span>
                      {best ? <span className={'best ' + strengthCls(best.strength)} title={`${best.name}: ${STRENGTH_WORD[best.strength as 'strong'] ?? ''} at this place${busy ? ` — now on ${busy}; sending moves them` : ''}`}>
                          {best.holder ? 'sent' : 'best'}: {first(best.name)} {coinBadge(best.coins, best.strength)}{busy ? ' (busy)' : ''}</span>
                        : <span className="best none">nobody can take it</span>}
                    </span>);
                })}
              </>;
              const style = { ['--ap' as any]: AP_HUE[ai % AP_HUE.length] };
              // switching away from a MANNED plan sends its party back: it asks twice, and says who
              return a.switchLoss
                ? <ConfirmButton key={a.id} className="appr" style={style} aria-pressed={false} ms={4000}
                    label={body} armedLabel={<><span className="al">Switch plans?</span><span className="aw">{a.switchLoss} — click again</span></>}
                    onConfirm={() => quick('approach', q.id, a.id)} />
                : <button key={a.id} className={'appr' + (on ? ' on' : '')} style={style}
                    onClick={() => { if (!on) quick('approach', q.id, a.id) }} aria-pressed={on}>{body}</button>;
            })}</div>
          </div>
        )}

        <div className="stagerow">
          {q.cast?.length > 0 && (
            <div className="held">
              <span className="lbl">On this matter</span>
              <div className="heldrow">{q.cast.map((c: any, i: number) => {
                const own = s.roster.find((m: any) => m.name === c.name);
                return own ? <div className="heldone" key={i}><CardFace c={own} small title={`${own.name} — one of yours, held to this matter`} /><span className="hwho">one of yours · {c.role}</span></div> : (
                <div className="heldone" key={i}>
                  <button className="hc" onClick={() => readCast(c)} aria-label={`${c.name} — read their card`}>
                    <span className="clasp l" /><span className="clasp r" />
                    <span className="nm">{c.name}</span>
                    <span className="mono">{c.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('')}</span>
                    <span className="rl">{c.role}</span>
                  </button>
                  <span className="hwho">{c.trade || ''}</span>
                </div>)})}
              </div>
            </div>
          )}

          {!choose && <div className="sendblock">
            <div className="lbl center sendlbl">Who you send — click a place, then a card · or drag a card onto a place (a taken place swaps)</div>
            <div className="niches">{act.map((sl: any) => {
              const m = sl.filledId ? s.roster.find((r: any) => r.id === sl.filledId) : null;
              const req = !!sl.requirement;
              const f = fitAt(sl);
              const here = dragging && sl.filledId === drag;
              const hue = q.approaches ? AP_HUE[q.approaches.findIndex((a: any) => a.id === sl.groupId) % AP_HUE.length] : undefined;
              const why = f?.why ?? sl.filledWhy;
              const hit = (t: string, list?: string[]) => (list ?? []).includes(t);
              const cls = ['arch', armed === sl.idx && 'armed', req && 'req', dragging && (f && !f.blocked || here ? 'target' : 'nogo'),
                bestIdx === sl.idx && 'best', over === sl.idx && 'over', hue && 'hued'].filter(Boolean).join(' ');
              return (
                <div className="niche" key={sl.idx} style={hue ? { ['--ap' as any]: hue } : undefined}>
                  {dragging && (here ? <span className="dchip here">already here</span>
                    : f ? <span className={'dchip ' + (f.blocked ? 'no' : strengthCls(f.strength))}>
                        {f.blocked ? f.blocked : <>{first(f.name)} {Math.round(f.coins)}c</>}
                        {!f.blocked && (m ? <em>swaps with {first(m.name)}</em> : f.from && f.from.questId !== q.id ? <em>leaves {shortTitle(f.from.title)}</em> : null)}
                      </span> : null)}
                  <div className={cls}
                    onDragEnter={e => { e.preventDefault(); setOver(sl.idx) }}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(o => o === sl.idx ? null : o) }}
                    onDrop={e => drop(e, sl.idx)}>
                    {m
                      ? <div className="seat" key={sl.filledId}>
                          <CardFace c={m} small badge={coinBadge(sl.filledCoins, sl.filledStrength)} badgeCls={strengthCls(sl.filledStrength)} why={sl.filledWhy}
                            title={`${m.name} — ${STRENGTH_WORD[sl.filledStrength as 'strong'] ?? ''} here (${sl.filledExplain ?? ''})\n${openCard ? 'click to read their card · ' : ''}drag to another place to swap · ✕ sends them back`}
                            onClick={() => openCard ? openCard(m.id) : quick('unassign', q.id, sl.idx)}
                            onDragStart={e => { e.dataTransfer.setData('text/plain', m.id); e.dataTransfer.effectAllowed = 'move'; setDrag(m.id) }}
                            onDragEnd={() => { setDrag(null); setOver(null) }} />
                          <button className="sendback" onClick={() => quick('unassign', q.id, sl.idx)} aria-label={`Send ${m.name} back to the hand`} title="send back to the hand">✕</button>
                        </div>
                      : <button className="empty" onClick={() => setArmed(armed === sl.idx ? null : sl.idx)} aria-label={`Place ${sl.idx + 1}: ${attrOf(sl)}`}>
                          <Silhouette size={56} /></button>}
                  </div>
                  <div className="test"><b>{attrOf(sl)}</b><span>bar {sl.test.bar.toFixed(1)}</span></div>
                  {sl.test.favored.length > 0 && <div className="helps">helps: {sl.test.favored.map((t: string, i: number) =>
                    <React.Fragment key={t}>{i > 0 && ' · '}<span className={hit(t, why?.plus) ? 'hit' : ''}>{t}</span></React.Fragment>)}</div>}
                  {sl.test.clashing.length > 0 && <div className="hurts">hurts: {sl.test.clashing.map((t: string, i: number) =>
                    <React.Fragment key={t}>{i > 0 && ' · '}<span className={hit(t, why?.minus) ? 'hit' : ''}>{t}</span></React.Fragment>)}</div>}
                  {req && <div className="reqline">⚑ {sl.requirement}</div>}
                </div>);
            })}</div>
          </div>}
        </div>

        {!choose && <div className="gauge" aria-live="polite">
          <div className="verdict">
            <span className="gk">The roll</span>
            {band
              ? <b key={flashK} className={'vw' + (flashK ? ' fx-flash' : '')} data-c={bandCls(band)}>{BAND_WORD[band]}{pct}</b>
              : <span className="vw wait">{verdict}</span>}
          </div>
          <div className={'meter' + (band ? ' lit' : '')} role="img" aria-label={band ? `the party: ${BAND_WORD[band]}` : 'no verdict until every place is filled'}>
            {BAND_ORDER.map(b => <span key={b} className={'seg' + (b === band ? ' on' : '')} data-c={bandCls(b)}><i /><em>{BAND_WORD[b]}</em></span>)}
          </div>
          <div className="gl">
            <span>{Math.round(o.coins ?? 0)} coins · {o.filled ?? filled}/{o.of ?? act.length} placed</span>
            <span title="the roll flips every coin; each head counts toward the bar">heads needed {(o.bar ?? 0).toFixed(1)} (partial {(o.partialAt ?? 0).toFixed(1)})
              {o.precision > 0 ? (band && o.partial != null ? ` · partial or better ~${Math.round(o.partial * 100)}%` : '') + (o.precision === 1 ? ' · the Oracle reads coarse' : '') : ' · an Oracle gives the %'}</span>
          </div>
        </div>}
      </section>

      <article className="writ">
        {sealOn && <div className="sealed" aria-hidden="true"><span>SEALED</span></div>}
        <div className="wh">
          <button className="back" onClick={back}>← Map <span>Esc</span></button>
          <span className="kind">{q.isFinale ? 'Saga finale' : q.chainId ? `Saga · beat ${q.beat}` : q.faucet ? 'Standing post' : 'One-off job'} · {q.region}</span>
          <div className="titlerow">
            <h1>{q.title}</h1>
          </div>
          <div className="chips">
            <span className={'clock' + (q.faucet ? ' renew' : q.lapseUrgent ? ' hot' : '')}>{lapse}</span>
            {loot.map((t, i) => <span className="loot" key={i}>{t}</span>)}
            {payTail.length > 0 && <span className="owed">{payTail.join(' · ')}</span>}
            {q.rewardWarn && <span className="rwarn" title="what the quest brings versus what the fort can hold">⚠ {q.rewardWarn}</span>}
          </div>
          {chain && <SagaStrip c={chain} q={q} />}
          <span className="meta">{q.rarity} · level {q.level} · {act.length || '—'} to send</span>
        </div>
        <div className="body">
          <p className="sit">{q.situation}</p>
          <div className="hr" />
          <div className="lineh"><span className="lk">The errand</span><span className="lv">{q.job}</span></div>
        </div>
        <div className={'btns' + (arming ? ' arming' : '')}>
          {arming && <div className="consequence" role="alert">{q.abandonText}</div>}
          <button className="btn" onClick={() => quick('auto', q.id)} disabled={choose}>Auto-assign</button>
          <button className="btn ghost" disabled={filled === 0 || clearing}
            onClick={async () => { setClearing(true); try { await quick('clear', q.id) } finally { setClearing(false) } }}>Clear</button>
          <ConfirmButton className="btn ghost" title={q.abandonText}
            label={q.canReroll ? 'Set aside ↺' : 'Abandon'} armedLabel={q.canReroll ? 'Set aside? Click again' : 'Abandon? Click again'}
            onArm={setArming} onConfirm={() => { doAct('abandon', q.id); back() }} />
          <span className={'ok ' + (ready ? bandCls(band) || 'lit' : 'off')} title={ready ? 'marches when the cycle ends' : undefined}>
            {ready ? (band === 'hopeless' ? 'Marches to fail' : band ? `Marches · ${BAND_WORD[band]}` : 'Marches') : choose ? 'Pick how it ends' : `Place ${act.length - filled} more`}
          </span>
        </div>
      </article>
    </div>
  );
}

/** the saga's stakes in one strip (Game.chainViews): beat pips, progress, setbacks, what is set aside */
function SagaStrip({ c, q }: { c: any; q: any }) {
  const now = Math.max(1, q.beat ?? c.beat + 1);           // this quest's step, 1-based
  const total = Math.max(c.expectedBeats ?? now, now);
  const budget = Math.max(0, c.failureBudget ?? 0);
  const prog = c.effortTarget ? Math.min(1, (c.effort ?? 0) / c.effortTarget) : 0;
  return (
    <div className="saga" aria-label="The saga">
      <span className="sg-t" title={c.goal ?? ''}>{c.title}</span>
      <span className="sg-i" title={`beat ${now} of about ${c.expectedBeats}`}>
        <span className="pips">{Array.from({ length: total }, (_, i) =>
          <i key={i} className={i < now - 1 ? 'done' : i === now - 1 ? (q.isFinale ? 'now fin' : 'now') : ''} />)}</span>
        {q.isFinale ? 'the finale' : `beat ${now} of ~${c.expectedBeats}`}
      </span>
      <span className="sg-i" title={`progress ${Math.round(c.effort ?? 0)} of ~${Math.round(c.effortTarget ?? 0)} (soldier-cycles spent on it)`}>
        <span className="eff"><i style={{ width: `${prog * 100}%` }} /></span>progress
      </span>
      {budget > 0 && <span className={'sg-i' + (c.failures >= budget - 1 && c.failures > 0 ? ' hot' : '')}
        title={`${budget} setbacks and the saga is forced to its last chance`}>
        <span className="pips sb">{Array.from({ length: budget }, (_, i) =>
          <i key={i} className={(i < c.failures ? 'hit' : '') + (i === budget - 1 ? ' last' : '')} />)}</span>
        setbacks {c.failures} of {budget}
      </span>}
      <span className="sg-i">set aside so far: <b>{c.bank || 'nothing yet'}</b></span>
    </div>
  );
}
