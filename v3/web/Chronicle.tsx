// THE CHRONICLE — sagas, people & places, the log, the AI ledger; and the reckoning page.
import { sfx } from './sfx';
import React, { useEffect, useRef, useState } from 'react';
import { type S, gateOf, useKeyScroll, QuestLog } from './ui';

export function Chronicle({ s, openQuest, openLeads }: { s: S; openQuest?: (id: string) => void; openLeads?: () => void }) {
  const [tab, setTab] = useState<'sagas' | 'lore' | 'log' | 'ai'>('sagas');
  const lore = gateOf(s, 'lore');
  const body = useRef<HTMLDivElement>(null);
  useKeyScroll(body);
  useEffect(() => { body.current?.scrollTo({ top: 0 }) }, [tab]);
  return (
    <div className="chronicle">
      <div className="ctabs" role="tablist">
        {([['sagas', 'Sagas'], ['lore', 'People & places'], ['log', 'Log'], ['ai', 'AI ledger']] as const).map(([k, l]) =>
          <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="cbody" ref={body} tabIndex={-1}>
        {tab === 'sagas' && <Chains s={s} openQuest={openQuest} openLeads={openLeads} />}
        {tab === 'lore' && (lore && !lore.open ? <p className="empty">Build a <b>{lore.need}</b> to keep the lore.</p> : <Lore s={s} />)}
        {tab === 'log' && <pre className="log">{s.log.map((l: any) => `c${l.cycle} [${l.kind}] ${l.text}`).join('\n')}</pre>}
        {tab === 'ai' && <AiLog s={s} />}
      </div>
    </div>
  );
}

/** the saga's next move, as the engine names it (chainViews().next — the CLI's `chains` column):
 *  on the map / choose the ending → its quest; a lead to pursue → the Leads tab */
function SagaNext({ c, openQuest, openLeads }: { c: any; openQuest?: (id: string) => void; openLeads?: () => void }) {
  if (!c.next) return null;
  const to = c.questId && openQuest ? () => openQuest(c.questId) : c.leadId && openLeads ? openLeads : null;
  return to
    ? <button className={'sagago' + (c.next === 'choose the ending' ? ' hot' : '')} onClick={to}>→ {c.next}</button>
    : <span className="sagago idle">{c.next}</span>;
}

/** the sagas as the chronicle shows them (Game.chainViews — the CLI's `chain <id>` prints the same, in this order):
 *  the quest log as it stands, card 1, the likely end (how it ended, once over) and the economy, So far (the engine's
 *  rows: the job's number or "finale", the mark, the party, the line, who was hurt), the answer once the finale is
 *  played, the people the player has seen (by name only once their name was read) */
function Chains({ s, openQuest, openLeads }: { s: S; openQuest?: (id: string) => void; openLeads?: () => void }) {
  if (!s.chains.length) return <p className="empty">No sagas yet — pursue a lead marked “new saga”.</p>;
  // live sagas first (newest first within each), as the CLI lists them
  const order = s.chains.slice().reverse().sort((a: any, b: any) => Number(b.live ?? false) - Number(a.live ?? false));
  return <div className="sagas">{order.map((c: any) => (
    <article className={'sagacard ' + c.state} key={c.id}>
      <h3>{c.title} <small>{c.state === 'done' ? 'finished' : c.state === 'slipped' ? 'slipped away' : c.state === 'finale-pending' ? 'at its finale' : `part ${c.part} of ${c.of}`}{c.personal ? ' · personal' : ''}</small></h3>
      {c.live && <SagaNext c={c} openQuest={openQuest} openLeads={openLeads} />}
      <QuestLog rows={c.rows} />
      {c.card1 && <p className="p card1">{c.card1}</p>}
      <div className="meta"><span>{c.endLine}</span><span>set aside: {c.bank || '—'}</span><span>setbacks {c.failures} / {c.failureBudget}</span></div>
      <div className="sofar">
        <span className="sk">So far</span>
        {(c.soFar ?? []).length === 0 ? <p className="p dimp">Nothing played yet.</p>
          : <ol>{c.soFar.map((r: any, i: number) => (
            <li key={i} className={'sf ' + r.outcome}>
              <span className="sfn">{r.n}</span><span className="sfm" role="img" aria-label={r.outcome}>{r.mark}</span>
              <span className="sft"><b>{r.party}</b> — {r.text}{r.hurt && <span className="sfh"> · {r.hurt}</span>}</span>
            </li>))}</ol>}
      </div>
      {c.answer && <p className="p answer"><b>The answer:</b> {c.answer}</p>}
      {(c.people ?? []).length > 0 && <div className="people">
        <span className="sk">People</span>
        <ul className="met">{c.people.map((p: any) => <li key={p.id}>{p.name ? <><b>{p.name}</b> — {p.label}</> : p.label}</li>)}</ul>
      </div>}
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
    <p><b>totals:</b> {u.calls} calls · {u.inputTokens} in / {u.outputTokens} out · ~${u.costUsd.toFixed(3)}{u.listCostUsd !== undefined ? ` billed (Claude subscription; ~$${u.listCostUsd.toFixed(3)} at API list price)` : ''}</p>
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
  // a saga's 📖 line (where the story stands, and what just happened) is the story's own voice, never loot or news
  if (l.startsWith('📖 ')) return 'r-book';
  if (/^(\p{Extended_Pictographic}|[✦⚑†])/u.test(l)) return 'r-news';
  return 'r-prose';
}

type Outcome = 'success' | 'partial' | 'failure';
type Meta = { questId: string; title: string; outcome: Outcome; heads: number; coins: number; bar: number; partialAt: number; party: string[]; isFinale: boolean; from: number; to: number };
type Seg = { kind: 'loose'; at: number; lines: string[] }
  | { kind: 'block'; at: number; lines: string[]; meta: Meta | null; outcome: Outcome | null };
const OUT_WORD: Record<Outcome, string> = { success: 'SUCCESS', partial: 'PARTIAL', failure: 'FAILURE' };

/** the report → loose lines and one block per quest. A block's verdict is the engine's (ReckonMeta,
 *  from/to = its line range); a block with no meta yet (still being written, or an archive older
 *  than the verdicts) is cut at its "— title" line and takes the outcome the roll line printed. */
function segment(lines: string[], meta: Meta[]): Seg[] {
  // a verdict row only frames lines it actually covers (a stale meta beside a broke-off report ate
  // the '⚠ broke off' line into a fake verdict)
  const byFrom = new Map(meta.filter(m => m.to <= lines.length && m.from < m.to).map(m => [m.from, m]));
  const out: Seg[] = [];
  let i = 0;
  while (i < lines.length) {
    const m = byFrom.get(i);
    if (m) { out.push({ kind: 'block', at: i, lines: lines.slice(m.from, m.to), meta: m, outcome: m.outcome }); i = Math.max(m.to, i + 1); continue }
    if (lines[i]!.startsWith('— ')) {
      let j = i + 1;
      while (j < lines.length && !lines[j]!.startsWith('— ') && !byFrom.has(j)) j++;
      const ls = lines.slice(i, j);
      const tag = ls.map(l => /^⚄ \[(SUCCESS|PARTIAL|FAILURE)\]/.exec(l)?.[1]).find(Boolean);
      out.push({ kind: 'block', at: i, lines: ls, meta: null, outcome: tag ? tag.toLowerCase() as Outcome : null });
      i = j; continue;
    }
    const last = out[out.length - 1];
    if (last?.kind === 'loose') last.lines.push(lines[i]!); else out.push({ kind: 'loose', at: i, lines: [lines[i]!] });
    i++;
  }
  return out;
}

// what the page shows of an engine line: no quest ids, no bar maths the coin row already draws
const cleanTitle = (l: string) => l.replace(/^— /, '').replace(/\s*\(q\d+\)\s*$/, '');
const cleanRoll = (l: string) => l.replace(/^⚄ \[(SUCCESS|PARTIAL|FAILURE)\] · /, '⚄ ').replace(/\s*\(partial from [\d.]+\)/, '');

/** THE ROLL, drawn: one pip per coin, heads filled; a tick where a partial starts and one at the bar.
 *  A bar beyond the coins extends the track with hollow pips, so "how far short" is visible. */
function CoinRow({ m }: { m: Meta }) {
  const n = Math.max(m.coins, Math.ceil(m.bar), 1);
  const pitch = Math.max(6, Math.min(16, Math.floor(560 / n)));
  const x = (v: number) => Math.min(v, n) * pitch;
  const edge = (px: number) => px < 32 ? ' start' : px > n * pitch - 32 ? ' end' : '';
  return (
    <div className="coinrow" style={{ width: n * pitch }} role="img" aria-label={`${m.heads} heads of ${m.coins} coins; partial at ${m.partialAt.toFixed(1)}, success at ${m.bar.toFixed(1)}`}>
      {Array.from({ length: n }, (_, i) => <i key={i} className={i < m.heads ? 'h' : i < m.coins ? 't' : 'x'} style={{ width: pitch - 2 }} />)}
      {/* a label near either end of the row hangs INTO the row, never past it */}
      <span className={'tick part' + edge(x(m.partialAt))} style={{ left: x(m.partialAt) }}><em>partial</em></span>
      <span className={'tick bar' + edge(x(m.bar))} style={{ left: x(m.bar) }}><em>success</em></span>
    </div>
  );
}

/** one quest's report: the verdict stamp on the title row, the roll as coins, the coin sums behind "why?" */
function Block({ seg, fresh }: { seg: Extract<Seg, { kind: 'block' }>; fresh: boolean }) {
  const { meta: m, outcome } = seg;
  // the verdict lands with a stamp (once, when this block arrives)
  useEffect(() => { if (fresh && outcome) sfx(outcome === 'success' ? 'stampOk' : outcome === 'partial' ? 'stampPartial' : 'stampFail') }, [fresh, outcome]);
  const title = m?.title ?? cleanTitle(seg.lines[0] ?? '');
  const body = seg.lines.slice(1);
  const pending = !outcome && body.some(l => l.startsWith('✎'));
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < body.length; i++) {
    const l = body[i]!;
    if (l.startsWith('⚄')) {
      parts.push(<div key={i} className="roll">{m && <CoinRow m={m} />}<p className="r-roll">{cleanRoll(l)}</p></div>);
      const why: string[] = [];
      while (i + 1 < body.length && body[i + 1]!.startsWith('   ')) why.push(body[++i]!.trim());
      if (why.length) parts.push(<details key={`w${i}`} className="rwhy"><summary>why?</summary>{why.map((w, k) => <p key={k} className="r-coins">{w}</p>)}</details>);
      continue;
    }
    parts.push(<p key={i} className={lineClass(l)}>{l}</p>);
  }
  return (
    <article className={'rblock ' + (outcome ?? (pending ? 'writing' : 'plain')) + (fresh ? ' landed' : '')}>
      <header className="rb-head">
        <h3>{m?.isFinale ? '♛ ' : ''}{title}</h3>
        {outcome && <span className={'stamp ' + outcome}>{OUT_WORD[outcome]}</span>}
        {pending && <span className="stamp writing">being written</span>}
      </header>
      {m && m.party.length > 0 && <p className="rb-party">sent: {m.party.join(', ')}</p>}
      {parts}
    </article>
  );
}

/** THE SPOILS — the cycle totalled from the engine's CycleSummary (the CLI's TALLY line). A chip that
 *  leads somewhere goes there (and leaves the reckoning). */
function Tally({ sum, openRoom, openCard, openLeads, openHolding, cardExists, roomOfType }: {
  sum: any; openRoom: (id: string | null) => void; openCard: (id: string) => void; openLeads: () => void;
  openHolding: (cardId?: string) => void; cardExists: (id: string) => boolean; roomOfType: (t: string) => string | null;
}) {
  const chips: { k: string; text: string; tone: 'good' | 'bad' | 'info'; go?: () => void; title?: string }[] = [];
  // the spoils ring in: coins for gold won, an arpeggio for a level-up (once per tally)
  useEffect(() => {
    const gold = (sum?.goldAfter ?? 0) - (sum?.goldBefore ?? 0);
    if (gold > 0) setTimeout(() => sfx('coin'), 250);
    if ((sum?.levelUps ?? []).length) setTimeout(() => sfx('levelup'), 600);
  }, [sum?.cycle]);
  const names = (xs: { name: string }[]) => xs.length > 2 ? `${xs.length}` : xs.map(x => x.name).join(', ');
  // a chip for a card that is no longer anywhere (sold, ransomed, gone since) links nowhere
  const card = (id: string) => cardExists(id) ? () => openCard(id) : undefined;
  const gone = (id: string) => cardExists(id) ? '' : ' (gone)';
  const dg = sum.goldAfter - sum.goldBefore, dp = sum.prestigeAfter - sum.prestigeBefore;
  if (dg) chips.push({ k: 'g', text: `${dg > 0 ? '+' : '−'}${Math.abs(dg)}g`, tone: dg > 0 ? 'good' : 'bad' });
  if (Math.abs(dp) >= 0.05) chips.push({ k: 'p', text: `${dp > 0 ? '+' : '−'}${Math.abs(dp).toFixed(1)} ✦`, tone: dp > 0 ? 'good' : 'bad' });
  for (const l of sum.levelUps ?? []) chips.push({ k: 'l' + l.id, text: `⭐ ${l.name} L${l.level}${gone(l.id)}`, tone: 'good', go: card(l.id) });
  for (const w of sum.wounds ?? []) chips.push({ k: 'w' + w.id, text: `🩸 ${w.name} wounded${gone(w.id)}`, tone: 'bad', go: card(w.id) });
  // holding decisions open whether or not a Holding cell stands (one captive: straight to their card)
  const held = (sum.captivesTaken ?? []).filter((c: any) => cardExists(c.id));
  if (sum.captivesTaken?.length) chips.push({ k: 'c', text: `⛓ ${names(sum.captivesTaken)} ${sum.captivesTaken.length > 2 ? 'captives in holding' : 'in holding'}${held.length ? ' →' : ''}`, tone: 'good',
    go: held.length ? () => openHolding(held.length === 1 ? held[0].id : undefined) : undefined });
  if (sum.recruits?.length) chips.push({ k: 'r', text: `🍺 ${names(sum.recruits)} at the tavern →`, tone: 'good', go: () => openRoom(roomOfType('tavern')) });
  // one new relic / one tamed captive opens its own card (its "Set in the X" button is one click away)
  const one = (xs: any[]) => xs.length === 1 && !cardExists(xs[0].id);
  if (sum.relicsGained?.length) chips.push({ k: 'x', text: one(sum.relicsGained) ? `🗝 ${names(sum.relicsGained)} (gone)` : `🗝 ${names(sum.relicsGained)}${sum.relicsGained.length > 2 ? ' relics' : ''} — set in a room →`, tone: 'good',
    go: one(sum.relicsGained) ? undefined : sum.relicsGained.length === 1 ? card(sum.relicsGained[0].id) : () => openRoom(null) });
  if (sum.tamed?.length) chips.push({ k: 't', text: one(sum.tamed) ? `🔗 ${names(sum.tamed)} tamed (gone)` : `🔗 ${names(sum.tamed)} tamed — set in a room →`, tone: 'good',
    go: one(sum.tamed) ? undefined : sum.tamed.length === 1 ? card(sum.tamed[0].id) : () => openRoom(roomOfType('dungeon')) });
  if (sum.newLeads) chips.push({ k: 'n', text: `+${sum.newLeads} lead${sum.newLeads === 1 ? '' : 's'} →`, tone: 'good', go: openLeads });
  if (sum.lapsed?.length) chips.push({ k: 'z', text: `${sum.lapsed.length} went cold`, tone: 'bad', title: sum.lapsed.join(' · ') });
  if (sum.stalled?.length) chips.push({ k: 's', text: `${sum.stalled.length} did not march`, tone: 'bad', title: sum.stalled.join(' · ') });
  if (sum.leadsCold?.length) chips.push({ k: 'q', text: `${sum.leadsCold.length} lead${sum.leadsCold.length === 1 ? '' : 's'} lost`, tone: 'bad', title: sum.leadsCold.join(' · ') });
  // the losses the tally used to fold into gold: captives handed off, debts taken on, saga setbacks
  if (sum.handedOff?.length) chips.push({ k: 'h', text: `⛓ ${names(sum.handedOff)} handed off`, tone: 'bad', title: sum.handedOff.map((h: any) => `${h.name} +${h.gold}g`).join(' · ') });
  // the engine's words (Game.debtText — the CLI tally prints the same); an archive older than them keeps its old chip
  for (const d of sum.debts ?? []) chips.push({ k: 'd' + d.id, text: d.text ?? `⚠ ${d.amount}g debt`, tone: 'bad', go: card(d.id), title: 'unsettled, it draws collectors — settle it from its card' });
  for (const b of sum.setbacks ?? []) chips.push({ k: 'b' + b.chainId, text: `✗ setback ${b.failures}/${b.budget}`, tone: 'bad', title: b.title });
  const o = sum.outcomes ?? {};
  const marched = [o.success && `${o.success} success`, o.partial && `${o.partial} partial`, o.failure && `${o.failure} failed`].filter(Boolean).join(' · ');
  return (
    <div className="tally" aria-label="This cycle's spoils">
      <span className="lbl">Spoils</span>
      {chips.length === 0 && <span className="tchip info">nothing changed hands</span>}
      {chips.map(c => c.go
        ? <button key={c.k} className={'tchip ' + c.tone} onClick={c.go} title={c.title}>{c.text}</button>
        : <span key={c.k} className={'tchip ' + c.tone} title={c.title}>{c.text}</span>)}
      {marched && <span className="marched">{marched}</span>}
    </div>
  );
}

/** THE RECKONING — its own page (TEMPO P10): opens on END, lines land as they are written; each
 *  quest reads as a verdict, and the footer totals the spoils beside PROCEED */
export function Reckoning({ s, busy, reckAt, jobs, onProceed, openQuest: _openQuest, openRoom, openCard, openLeads, openHolding, cardExists, roomOfType }: {
  s: S; busy: boolean; reckAt: number | null; jobs: any[]; onProceed: () => void;
  openQuest: (id: string) => void; openRoom: (id: string | null) => void; openCard: (id: string) => void; openLeads: () => void;
  openHolding: (cardId?: string) => void; cardExists: (id: string) => boolean; roomOfType: (type: string) => string | null;
}) {
  const kept: number[] = s.reckoningCycles ?? [];
  const [past, setPast] = useState<{ cycle: number; lines: string[]; meta: Meta[]; summary: any } | null>(null);
  const openPast = async (cycle: number) => {
    const r = await (await fetch(`/api/reckoning?cycle=${cycle}`)).json();
    setPast(r?.lines?.length ? { cycle: r.cycle, lines: r.lines, meta: r.meta ?? [], summary: r.summary ?? null } : null);
  };
  const fresh = reckAt === null || s.cycle > reckAt;
  // a look back after a restart, before any END: the server's last report can be empty — fetch it
  const [fallback, setFallback] = useState<{ lines: string[]; meta: Meta[]; summary: any } | null>(null);
  useEffect(() => {
    if (reckAt === null && !(s.lastReport ?? []).length && kept.length)
      fetch('/api/reckoning').then(r => r.json()).then(r => r?.lines?.length && setFallback({ lines: r.lines, meta: r.meta ?? [], summary: r.summary ?? null })).catch(() => {});
  }, []);
  const liveLines: string[] = fresh ? (s.lastReport ?? []) : [];
  const lines: string[] = past ? past.lines : liveLines.length ? liveLines : fallback?.lines ?? [];
  const meta: Meta[] = past ? past.meta : liveLines.length ? (fresh ? s.lastMeta ?? [] : []) : fallback?.meta ?? [];
  // the live tally belongs to THIS cycle only (a stale one from before an END that broke off never shows)
  const summary = past ? past.summary : liveLines.length ? (fresh && s.lastSummary?.cycle === s.cycle ? s.lastSummary : null) : fallback?.summary ?? null;
  const held = busy && (!fresh || !!s.reckoningWriting);
  const out = jobs.filter(j => j.state === 'queued' || j.state === 'running');
  const segs = segment(lines, meta);

  // a block glows once when its verdict first lands (paced by arrival — nothing is withheld); the
  // verdicts already there when the page opened (a look back) don't
  const initial = useRef<Set<string> | null>(null);
  if (initial.current === null) initial.current = new Set(meta.map(m => m.questId));

  // the report takes the page keys from the moment it opens (it has the focus; the page keys fall back to it)
  const bodyRef = useRef<HTMLElement>(null);
  useKeyScroll(bodyRef);
  useEffect(() => { bodyRef.current?.focus({ preventScroll: true }) }, []);
  // Enter = PROCEED. Space reads on (a page down) while there is more below, and proceeds only at the
  // end — the browser's page-down key must not skip an unread report. Neither fires on a focused
  // button, link or disclosure (those keep their own keys).
  const proceedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SUMMARY' || tag === 'A' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === ' ') {
        if (e.defaultPrevented) return;                      // the page keys already read on
        const b = bodyRef.current;
        if (b && b.scrollTop + b.clientHeight < b.scrollHeight - 4) { e.preventDefault(); b.scrollBy({ top: Math.max(40, b.clientHeight * 0.85) }); return }
      }
      if (proceedRef.current && !proceedRef.current.disabled) { e.preventDefault(); proceedRef.current.click() }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

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
      <main className="reckbody" ref={bodyRef} tabIndex={-1}>
        {segs.map(sg => sg.kind === 'loose'
          ? <div key={`l${sg.at}`} className="rloose">{sg.lines.map((l, k) => <p key={k} className={lineClass(l)}>{l}</p>)}</div>
          : <Block key={`b${sg.at}-${sg.meta?.questId ?? ''}`} seg={sg} fresh={!past && !!sg.meta && !initial.current!.has(sg.meta.questId)} />)}
        {held && <p className="working"><span className="spin" /> the company is still out — the report is being written…</p>}
        {!held && lines.length === 0 && <p className="empty">Nothing to report.</p>}
      </main>
      <footer className="reckfoot">
        {!held && summary && <Tally sum={summary} openRoom={openRoom} openCard={openCard} openLeads={openLeads} openHolding={openHolding} cardExists={cardExists} roomOfType={roomOfType} />}
        <button ref={proceedRef} className="proceed" disabled={held} onClick={onProceed}>
          {held ? 'resolving…' : <>PROCEED ▶ <kbd className="key">↵</kbd></>}
        </button>
      </footer>
    </div>
  );
}
