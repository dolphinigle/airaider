// A QUEST, OPENED (docs/QUEST_SCREEN.md G1–G3). Left: the saga's own people held in brass
// clasps, and the places to fill as niches. Right: the written quest. Every placement is an engine
// call (assign / unassign / auto / send) — the same ones the CLI makes.
import React from 'react';
import { type S, activeSlots, Silhouette, fitCls, CardFace } from './ui';

export function QuestPage({ s, q, doAct, quick, armed, setArmed, back, readCast, setDrag }: any) {
  const act = activeSlots(q), filled = act.filter((x: any) => x.filledBy).length;
  const choose = q.approaches && !q.chosenApproach;
  const ready = !choose && filled === act.length && act.length > 0;
  const coins = act.reduce((n: number, x: any) => n + (x.filledCoins ?? 0), 0);
  const bar = act.reduce((n: number, x: any) => n + x.test.bar, 0);
  const line = choose ? 'Pick how it ends first — each way tests something different.'
    : !ready ? (filled === 0 ? 'Nobody is placed yet.' : `${act.length - filled} still to place.`)
    : q.odds.success === null ? (coins >= bar ? 'On the coins they bring, they should clear the bar.' : coins >= bar * 0.6 ? 'Enough for a partial — not a clean win.' : 'Short of the bar. Expect it to go wrong.')
    : q.odds.success > .8 ? 'They should manage this between them.'
    : q.odds.success > .55 ? 'It could go either way, but the odds lean your way.'
    : q.odds.success > .3 ? 'Thin. Someone will likely come home hurt.'
    : 'You are sending them to fail.';
  const max = Math.max(bar * 1.4, coins, 1);
  const lapse = q.faucet ? 'goes cold this cycle' : `lapses in ${Math.max(0, q.lapsesAtCycle - s.cycle)}`;

  return (
    <div className="questpage">
      <section className="scene" aria-label="Who goes">
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

        {q.approaches && (
          <div className="approaches">
            <span className="lbl">How it ends</span>
            <div className="apps">{q.approaches.map((a: any) => (
              <button key={a.id} className={'appr' + (q.chosenApproach === a.id ? ' on' : '')} onClick={() => doAct('approach', q.id, a.id)}>
                <span className="al">{a.label}</span>{a.outcome && <span className="ao">→ {a.outcome}</span>}
              </button>))}</div>
          </div>
        )}

        {!choose && <>
          <div className="lbl center">Who you send — click a place, then a card · or drag a card onto it</div>
          <div className="niches">{act.map((sl: any) => {
            const m = sl.filledId ? s.roster.find((r: any) => r.id === sl.filledId) : null;
            const req = !!sl.requirement;
            return (
              <div className="niche" key={sl.idx}>
                <div className={'arch' + (armed === sl.idx ? ' armed' : '') + (req ? ' req' : '')}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setDrag(null); const id = e.dataTransfer.getData('text/plain'); if (id) quick('assign', q.id, sl.idx, id) }}>
                  {m
                    ? <CardFace c={m} small badge={`${Math.round(sl.filledCoins)}c`} badgeCls={fitCls(sl.filledCoins, sl.test.bar)}
                        title={`${sl.filledExplain ?? ''}\nclick to take them off`} onClick={() => quick('unassign', q.id, sl.idx)} />
                    : <button className="empty" onClick={() => setArmed(armed === sl.idx ? null : sl.idx)} aria-label={`Place ${sl.idx + 1}: ${sl.test.attributes.join('+').toUpperCase()}`}>
                        <Silhouette size={56} /></button>}
                </div>
                <div className="test"><b>{sl.test.attributes.join(' + ').toUpperCase()}</b><span>bar {sl.test.bar.toFixed(1)}</span></div>
                {sl.test.favored.length > 0 && <div className="helps">helps: {sl.test.favored.join(' · ')}</div>}
                {sl.test.clashing.length > 0 && <div className="hurts">hurts: {sl.test.clashing.join(' · ')}</div>}
                {req && <div className="reqline">⚑ {sl.requirement}</div>}
              </div>);
          })}</div>
        </>}

        {!choose && <div className="gauge">
          <div className="gl"><span>The roll — coins you bring vs the bar</span><b>{line}</b></div>
          <div className="track">
            <div className={'fill ' + (ready ? fitCls(coins, bar) : '')} style={{ width: `${Math.min(100, coins / max * 100)}%` }} />
            <div className="tick p" style={{ left: `${bar * 0.6 / max * 100}%` }} title="partial" />
            <div className="tick" style={{ left: `${bar / max * 100}%` }} title="success" />
          </div>
          <div className="gl"><span>{Math.round(coins)} coins{q.odds.success != null && ready ? ` · about ${Math.round(q.odds.success * 100)}%` : ''}</span><span>partial at {(bar * 0.6).toFixed(0)} · success at {bar.toFixed(0)}</span></div>
        </div>}
      </section>

      <article className="writ">
        <div className="wh">
          <button className="back" onClick={back}>← Map <span>Esc</span></button>
          <span className="kind">{q.isFinale ? 'Saga finale' : q.chainId ? `Saga · beat ${q.beat}` : 'One-off job'} · {q.region}</span>
          <div className="titlerow">
            <h1>{q.title}</h1>
            <span className={'clock' + (q.faucet ? ' hot' : '')}>{lapse}</span>
          </div>
          <span className="meta">{q.rarity} · level {q.level} · {act.length} to send</span>
        </div>
        <div className="body">
          <p className="sit">{q.situation}</p>
          <div className="hr" />
          <div className="lineh"><span className="lk">The errand</span><span className="lv">{q.job}</span></div>
          <div className="lineh"><span className="lk">The pay</span><span className="lv">{q.rewardEnvelope}</span></div>
        </div>
        <div className="btns">
          <button className="btn" onClick={() => doAct('auto', q.id)} disabled={choose}>Auto-assign</button>
          <button className="btn ghost" onClick={async () => { for (const x of act) if (x.filledBy) await quick('unassign', q.id, x.idx) }}>Clear</button>
          <button className="btn ghost"
            title={q.canReroll ? 'The lead goes back to the board and can be taken up again — once a cycle'
              : q.chainId ? 'A saga step has no lead to return to' : 'Already taken a lead back up this cycle'}
            onClick={() => { if (confirm(q.canReroll ? 'Set this aside? The lead goes back to the board — once a cycle.'
              : 'Abandon this? The lead does NOT come back.')) { doAct('abandon', q.id); back() } }}>
            {q.canReroll ? 'Set aside ↺' : 'Abandon'}</button>
          <span className={'ok' + (ready ? '' : ' off')}>{ready ? '✓ Ready — marches when the cycle ends' : choose ? 'Pick how it ends' : `Place ${act.length - filled} more`}</span>
        </div>
      </article>
    </div>
  );
}
