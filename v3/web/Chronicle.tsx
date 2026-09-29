// THE CHRONICLE — sagas, people & places, the log, the AI ledger; and the reckoning page.
import React, { useState } from 'react';
import { type S, gateOf } from './ui';

export function Chronicle({ s }: { s: S }) {
  const [tab, setTab] = useState<'sagas' | 'lore' | 'log' | 'ai'>('sagas');
  const lore = gateOf(s, 'lore');
  return (
    <div className="chronicle">
      <div className="ctabs" role="tablist">
        {([['sagas', 'Sagas'], ['lore', 'People & places'], ['log', 'Log'], ['ai', 'AI ledger']] as const).map(([k, l]) =>
          <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="cbody">
        {tab === 'sagas' && <Chains s={s} />}
        {tab === 'lore' && (lore && !lore.open ? <p className="empty">Build a <b>{lore.need}</b> to keep the lore.</p> : <Lore s={s} />)}
        {tab === 'log' && <pre className="log">{s.log.map((l: any) => `c${l.cycle} [${l.kind}] ${l.text}`).join('\n')}</pre>}
        {tab === 'ai' && <AiLog s={s} />}
      </div>
    </div>
  );
}

function Chains({ s }: { s: S }) {
  if (!s.chains.length) return <p className="empty">No sagas yet — pursue a lead marked “new saga”.</p>;
  return <div className="sagas">{s.chains.slice().reverse().map((c: any) => (
    <article className={'sagacard ' + c.state} key={c.id}>
      <h3>{c.title} <small>{c.state === 'done' ? 'finished' : c.state === 'slipped' ? 'slipped away' : c.state === 'finale-pending' ? 'at its finale' : `beat ${c.beat} of ~${c.expectedBeats}`}{c.personal ? ' · personal' : ''}</small></h3>
      <p className="goal">{c.goal}</p>
      <p className="p">{c.situation}</p>
      <div className="meta"><span>likely end: {c.fate}</span><span>set aside: {c.bank || '—'}</span><span>progress {Math.round(c.effort)} / ~{Math.round(c.effortTarget)}</span><span>setbacks {c.failures} / {c.failureBudget}</span></div>
      {c.known.length > 0 && <p className="p dimp">known: {c.known.join(' · ')}</p>}
      {c.met.length > 0 && <ul className="met">{c.met.map((p: any) => <li key={p.name}><b>{p.name}</b> — {p.who}</li>)}</ul>}
    </article>))}</div>;
}

function Lore({ s }: { s: S }) {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="lore">{s.lore.map((n: any) => (
    <div className="loreone" key={n.id}>
      <button className="lh" onClick={() => setOpen(open === n.id ? null : n.id)}>{n.active ? '' : '☽ '}{n.name} <small>{n.kind}</small></button>
      <p className="p">{n.blurb}</p>
      {open === n.id && <>
        <pre>{n.dossier}</pre>
        {n.chronicle.length > 0 && <ul>{n.chronicle.map((e: any, i: number) => <li key={i} className={e.active ? '' : 'dimp'}>{e.core ? '📌 ' : ''}{e.type}: {e.blurb}</li>)}</ul>}
      </>}
    </div>))}</div>;
}

function AiLog({ s }: { s: S }) {
  const u = s.ai;
  const pretty = (t?: string | null) => !t ? '(not recorded)' : (() => { try { return JSON.stringify(JSON.parse(t), null, 2) } catch { return t } })();
  if (!s.aiLog?.length) return <p className="empty">No AI calls yet{s.aiName === 'mock' ? ' (mock provider)' : ''}. Totals: {u.calls} calls · ~${u.costUsd.toFixed(3)}</p>;
  return <div className="ailog">
    <p><b>totals:</b> {u.calls} calls · {u.inputTokens} in / {u.outputTokens} out · ~${u.costUsd.toFixed(3)}</p>
    <table><tbody>
      <tr><td>#</td><td>purpose</td><td>model</td><td>ms</td><td>in</td><td>out</td><td>$</td><td>ok</td></tr>
      {s.aiLog.map((r: any) => {
        const inflight = !r.ok && !r.error && r.durationMs === 0;
        return <React.Fragment key={r.n}>
          <tr className={r.ok ? '' : inflight ? 'inflight' : 'dimp'}><td>{r.n}</td><td>{r.purpose}</td><td>{r.model}</td><td>{inflight ? '…' : r.durationMs}</td>
            <td>{r.inputTokens}</td><td>{r.outputTokens}</td><td>{r.costUsd.toFixed(4)}</td><td>{r.ok ? '✓' : inflight ? 'running' : `✗ ${r.error ?? ''}`}</td></tr>
          <tr><td colSpan={8}><details><summary>prompt + output</summary>
            <pre>SYSTEM:{'\n'}{r.systemPreview}{'\n\n'}USER:{'\n'}{pretty(r.userPrompt)}{'\n\n'}OUTPUT:{'\n'}{inflight ? '(running)' : pretty(r.output)}</pre></details></td></tr>
        </React.Fragment>;
      })}
    </tbody></table>
  </div>;
}

/** one report line → a class, so the page reads as a sequence of beats */
function lineClass(l: string): string {
  if (l.startsWith('— ')) return 'r-title';
  if (l.startsWith('「')) return 'r-card';
  if (l.startsWith('⚄')) return 'r-roll';
  if (l.startsWith('   ')) return 'r-coins';
  if (l.startsWith('▸')) return 'r-turn';
  if (l.startsWith('✎')) return 'r-pending';
  if (/^(\p{Extended_Pictographic}|[✦⚑†])/u.test(l)) return 'r-news';
  return 'r-prose';
}

/** THE RECKONING — its own page (TEMPO P10): opens on END, lines land as they are written */
export function Reckoning({ s, busy, reckAt, jobs, onProceed }: { s: S; busy: boolean; reckAt: number | null; jobs: any[]; onProceed: () => void }) {
  const kept: number[] = s.reckoningCycles ?? [];
  const [past, setPast] = useState<{ cycle: number; lines: string[] } | null>(null);
  const openPast = async (cycle: number) => {
    const r = await (await fetch(`/api/reckoning?cycle=${cycle}`)).json();
    setPast(r?.lines?.length ? r : null);
  };
  const fresh = reckAt === null || s.cycle > reckAt;
  const lines: string[] = past ? past.lines : fresh ? (s.lastReport ?? []) : [];
  const held = busy && (!fresh || !!s.reckoningWriting);
  const out = jobs.filter(j => j.state === 'queued' || j.state === 'running');
  return (
    <div className="reckpage">
      <header className="reckhead">
        <span className="crest">THE RECKONING</span>
        <span>cycle {past ? past.cycle : s.cycle}{past ? ' — looking back' : ''}</span>
        {kept.length > 1 && <span className="reckback">
          {kept.map(c => <button key={c} className={'rbtn' + ((past ? past.cycle === c : c === kept[kept.length - 1]) ? ' on' : '')}
            onClick={() => (past && past.cycle === c ? setPast(null) : openPast(c))}>{c}</button>)}
          {past && <button className="rbtn" onClick={() => setPast(null)}>now</button>}
        </span>}
      </header>
      {out.length > 0 && <div className="reckqueue">✎ still writing: {out.map(j => j.title).join(' · ')}</div>}
      <main className="reckbody">
        {lines.map((l, i) => <p key={i} className={lineClass(l)}>{l}</p>)}
        {held && <p className="working"><span className="spin" /> the company is still out — the report is being written…</p>}
        {!held && lines.length === 0 && <p className="empty">Nothing to report.</p>}
      </main>
      <footer className="reckfoot"><button className="proceed" disabled={held} onClick={onProceed}>{held ? 'resolving…' : 'PROCEED ▶'}</button></footer>
    </div>
  );
}
