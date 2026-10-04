// A CARD, OPENED — soldier, captive, relic, debt, tavern hire, holding, or a quest's held cast.
// Every button is an engine action. "Send them to" reads Game.placementsFor (the CLI's `fit <merc>`);
// "Set them in" reads Game.roomPlacementsFor (the CLI's `fit <captive|relic>` + `setin`). Prices,
// refusals and fixes are the engine's quotes/blocks — nothing here re-derives a rule.
import { sfx } from './sfx';
import React, { useEffect, useRef } from 'react';
import { type S, Tags, Silhouette, Glyph, RoomIcon, FixButton, cardStatus, formOf, cap1, FORM_ONE, shortTitle, useKeyScroll } from './ui';
import { strengthCls, STRENGTH_WORD } from './band';
import { ConfirmButton } from './fx';

const ATTRS: [string, string][] = [['str', 'STR'], ['dex', 'DEX'], ['int', 'INT'], ['cha', 'CHA'], ['con', 'CON']];

function Attrs({ ch }: { ch: any }) {
  if (!ch?.attrs) return null;
  return <div className="blk"><span className="lbl">Attributes — what they roll</span>
    <div className="attrs">{ATTRS.map(([k, l]) => (
      <div className="at" key={k}><span className="k">{l}</span><span className="v">{Math.round(ch.attrs[k])}</span>
        <span className="bar"><i style={{ width: `${Math.min(100, ch.attrs[k] / 25 * 100)}%` }} /></span></div>))}</div>
  </div>;
}

export function CardSheet({ s, id, cast, doAct, quick, close, openQuest, openRoom }: {
  s: S; id: string; cast?: any; doAct: any; quick: any; close: () => void; openQuest: (id: string) => void;
  openRoom?: (id: string | null) => void; say?: (msg: string, tone?: 'ok' | 'warn' | 'bad') => void;
}) {
  useEffect(() => { sfx('open'); return () => sfx('close') }, []);
  const lists: [string, any[]][] = [['roster', s.roster], ['captive', s.captives], ['relic', s.relics], ['debt', s.liabilities], ['tavern', s.tavern], ['holding', s.holding]];
  let kind = 'cast', c: any = cast;
  if (!cast) for (const [k, l] of lists) { const f = l.find((x: any) => x.id === id); if (f) { kind = k; c = f; break } }
  // A DIALOG: it takes the focus when it opens, keeps Tab inside, and hands the focus back to
  // whatever opened it when it closes (Tab used to walk the page hidden under the scrim)
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);
  // the sheet ITSELF scrolls (the focused dialog), so the page keys and the wheel work anywhere on it
  useKeyScroll(ref);
  useEffect(() => {
    opener.current = document.activeElement;
    ref.current?.focus();
    return () => { const o = opener.current as HTMLElement | null; if (o?.isConnected) o.focus() };
  }, []);
  // the card is gone (sold, ransomed, left): close rather than leave an invisible sheet up
  useEffect(() => { if (!c) close() }, [!c]);
  if (!c) return null;
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])')];
    if (!f.length) return;
    const first = f[0]!, last = f[f.length - 1]!;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  };
  const ch = c.character;
  const doThen = async (type: string, ...a: any[]) => { await doAct(type, ...a); if (['hire', 'ransom', 'sell', 'settle', 'accept'].includes(type)) close() };
  // a screen fix ('open the Kitchen', 'build one') leaves the sheet for the fort
  const go = (screen: string, rid: string | null) => { if (!openRoom) return close(); openRoom(screen === 'fort' ? rid : null) };
  const fix = (f: any, solid?: boolean, lead?: string) => <FixButton s={s} fix={f} quick={quick} go={go} solid={solid} lead={lead} />;

  // a painted bust gets its picture column; with none, a small emblem beside the name (a tall grey
  // silhouette column took 240px from the facts and said nothing)
  const caption = c.portrait ? 'Painted when they joined the company.'
    : c.painting ? 'The portrait is being painted…'
    : kind === 'roster' ? (s.portraitsOn ? 'No portrait yet.' : s.aiName === 'mock' ? 'Portraits are painted with the real AI on.' : 'Portraits are off this session.')
    : kind === 'cast' ? 'Held to this matter — you can read them, not move them.' : '';
  const emblem = kind === 'relic' || kind === 'debt' ? <Glyph name={kind === 'debt' ? 'scales' : 'chest'} size={34} /> : <Silhouette size={30} />;
  return (
    <div className="scrim" onClick={close}>
      <section className={'sheet ' + kind + (c.portrait ? ' has-pic' : '')} role="dialog" aria-modal="true" aria-label={c.name} tabIndex={-1} ref={ref as any}
        onKeyDown={trap} onClick={e => e.stopPropagation()}>
        {c.portrait && <div className="pic">
          <img src={c.portrait} alt={`Portrait of ${c.name}`} />
          <div className="cap">{caption}</div>
        </div>}
        <div className="info">
          <div className="head">
            {!c.portrait && <span className="emblem" aria-hidden="true">{emblem}</span>}
            <div className="hname">
              <h1>{c.name}</h1>
              {kind !== 'cast' && (ch?.who || c.who) && <p className="who">{ch?.who ?? c.who}</p>}
              {!c.portrait && caption && <p className="dimp small capline0">{caption}</p>}
            </div>
            <button className="x" onClick={close} aria-label="Close">✕</button>
          </div>

          {kind === 'roster' && <RosterTop s={s} c={c} doAct={doAct} go={go} />}
          {(kind === 'captive' || kind === 'relic') && <SetTop s={s} c={c} kind={kind} quick={quick} fix={fix} />}

          {(kind === 'roster' || kind === 'tavern' || kind === 'holding') && <Attrs ch={ch} />}

          {c.tags && <div className="blk"><span className="lbl">{kind === 'relic' || kind === 'captive' ? 'Tags — what rooms look for' : 'Tags — what quests look for'}</span><Tags tags={c.tags} /></div>}

          {kind === 'roster' && <>
            <div className="blk">
              <span className="lbl">Send them to — their best free place on each quest</span>
              {(c.placements ?? []).length === 0 && <p className="p dimp">No open place for them right now.</p>}
              {(c.placements ?? []).map((p: any) => {
                const here = p.here ?? (c.location?.kind === 'quest' && c.location.questId === p.questId);
                return (
                  <div className="sq" key={p.questId}>
                    <button className="q" onClick={() => openQuest(p.questId)}>{p.title} <span>· {p.attr} place</span></button>
                    {/* coins flipped vs heads needed are different units ("9 / 7" read as a pass): show the engine's word */}
                    <span className={'c ' + strengthCls(p.strength)} title={`${Math.round(p.coins)} coins to flip here · ${p.bar.toFixed(1)} heads needed`}>{Math.round(p.coins)}c · {STRENGTH_WORD[p.strength as 'strong'] ?? '?'}</span>
                    {here ? <span className="here">sent</span>
                      : <button className="btn sm" onClick={() => quick('send', p.questId, c.id)} title={p.from ? `leaves ${p.from.title}` : undefined}>{p.from ? `Move · leaves ${shortTitle(p.from.title)}` : 'Send'}</button>}
                  </div>);
              })}
            </div>
            <div className="two">
              <div className="blk">
                <span className="lbl">Their story</span>
                {ch.backstory && <p className="p">{ch.backstory}</p>}
                {ch.quirks?.length > 0 && <p className="p quirk">{ch.quirks.join(' · ')}</p>}
                {/* a memory of their own (a saga they came through) — the CLI's dossier prints the same lines */}
                {ownMemories(c.dossier).map((t, i) => <p className="p" key={'m' + i}>{t}</p>)}
              </div>
              <div className="blk">
                <span className="lbl">Bonds</span>
                {bonds(c.dossier, c.name).length === 0 && <p className="p dimp">No history yet.</p>}
                {bonds(c.dossier, c.name).map((b, i) => <div className="bond" key={i}><b>{b.name}</b> <span className="r">{b.rel}</span><br />{b.text}</div>)}
              </div>
            </div>
          </>}

          {(kind === 'captive' || kind === 'relic') && <SetList s={s} c={c} quick={quick} fix={fix} />}

          {/* ONE rule with the CLI: a card on a rack or on show says what cashing it out throws away, and asks twice */}
          {kind === 'captive' && <div className="acts">
            <Cash label={`Ransom · ~${c.ransomEst}g`} loss={c.rackLoss ?? c.cashLoss} onGo={() => doThen('ransom', c.id)} />
            <Cash label={`Sell · ~${c.sellEst}g`} loss={c.rackLoss ?? c.cashLoss} onGo={() => doThen('sell', c.id)} />
            {!c.interrogated && s.can?.interrogate && <button className="btn" onClick={() => doAct('interrogate', c.id)}>Interrogate → a lead</button>}
          </div>}
          {kind === 'relic' && <div className="acts"><Cash label={`Sell · ~${c.sellEst}g`} loss={c.cashLoss} onGo={() => doThen('sell', c.id)} /></div>}

          {kind === 'holding' && <>
            <p className="p">Taken on a job — {c.deadline ?? 'waiting'}{c.lapseQuote != null ? ` at the quick price (~${c.lapseQuote}g)` : ''} unless you decide first.</p>
            <div className="acts">
              <button className="btn solid" disabled={!!c.acceptBlock} onClick={() => doThen('accept', c.id)} title={c.acceptBlock?.reason}>To the cells</button>
              <button className="btn" onClick={() => doThen('ransom', c.id)}>Ransom now{c.ransomEst != null ? ` · ~${c.ransomEst}g` : ''}</button>
              {c.sellEst != null && <button className="btn ghost" onClick={() => doThen('sell', c.id)}>Sell · ~{c.sellEst}g</button>}
            </div>
            {c.acceptBlock && <div className="blocked"><span className="why">{c.acceptBlock.reason}</span>{fix(c.acceptBlock.fix)}</div>}
          </>}
          {kind === 'tavern' && <>
            {ch?.backstory && <p className="p">{ch.backstory}</p>}
            <p className="p dimp">Level {ch.level} · {c.deadline ?? 'waits here — already paid for'} · roster {s.roster.length}/{s.rosterCap}</p>
            <div className="acts"><button className="btn solid" disabled={!!c.hireBlock} title={c.hireBlock?.reason} onClick={() => doThen('hire', c.id)}>Hire · {c.hireCost}g</button></div>
            {c.hireBlock && <div className="blocked"><span className="why">{c.hireBlock.reason}</span>{fix(c.hireBlock.fix)}</div>}
          </>}
          {kind === 'debt' && <>
            <p className="p">A debt. Unpaid debts draw collectors — a hostile lead appears.</p>
            <div className="acts"><button className="btn solid" onClick={() => doThen('settle', c.id)}>Settle · {c.settleCost}g</button></div>
          </>}
          {kind === 'cast' && <p className="p">{c.label}{ch ? ` · L${ch.level}` : ''}{c.stars > 0 ? ` · ${Math.min(5, c.stars)}★` : ''}</p>}
        </div>
      </section>
    </div>
  );
}

/** level, xp, focus (short — it sits up top), and the specific cap and wound lines */
function RosterTop({ s, c, doAct, go }: { s: S; c: any; doAct: any; go: (screen: string, id: string | null) => void }) {
  const ch = c.character;
  const capped = ch.level >= c.cap;
  return <>
    <div className="lvl">
      <span>Level <b>{ch.level}</b></span>
      <span className="xpb"><i className={capped ? 'capd' : ''} style={{ width: `${Math.min(100, ch.xp / Math.max(1, c.xpNeeded) * 100)}%` }} /></span>
      <span>{ch.xp} / {c.xpNeeded} xp</span>
      <span className="dimp">· cap {c.cap}</span>
    </div>
    <div className="focus">
      <span className="lbl">Focus</span>
      <button className={'btn sm' + (ch.focus?.kind === 'none' ? ' on' : '')} onClick={() => doAct('focus', c.id, 'none')}>Generalist</button>
      {ATTRS.map(([k, l]) => <button key={k} className={'btn sm' + (ch.focus?.kind === 'single' && ch.focus.attr === k ? ' on' : '')} onClick={() => doAct('focus', c.id, 'single', k)}>{l}</button>)}
      <span className="dimp">future levels: {ch.focus?.kind === 'single' ? 'one great stat' : ch.focus?.kind === 'dual' ? 'two good stats' : 'grow evenly'}</span>
    </div>
    {capped && <div className="capline">
      <span className="capwarn">⛔ {c.bedroom ? `Capped at ${c.cap} — Bedroom ${c.bedroom.effect}: fill it to raise the cap` : `No bedroom of their own — capped at ${c.cap}`}</span>
      {c.bedroom ? <button className="btn sm ghost" onClick={() => go('fort', c.bedroom.roomId)}>Open their bedroom →</button>
        : <button className="btn sm ghost" onClick={() => go('build', null)}>Build one in the Fort →</button>}
    </div>}
    {ch.injury > 0 && <div className="woundline">
      <span>wound {ch.injury}{c.woundPenalty ? ` · −${Math.round(c.woundPenalty)} on every roll` : ''}{c.healEta ? ` · heals in ~${c.healEta.cycles} cycle${c.healEta.cycles === 1 ? '' : 's'} ${c.healEta.viaInfirmary ? 'in the Infirmary' : 'resting'}` : ''}</span>
      {s.can?.heal && <button className="btn sm" onClick={() => doAct('heal', c.id)}>Pay to heal</button>}
    </div>}
  </>;
}

/** where a captive/relic sits + the ONE next step (the best room the engine found, or the fix) */
function SetTop({ s, c, kind, quick, fix }: { s: S; c: any; kind: string; quick: any; fix: (f: any, solid?: boolean, lead?: string) => React.ReactNode }) {
  const st = cardStatus(c);
  const rows: any[] = c.roomPlacements ?? [];
  const best = rows.find(p => p.ok && !p.here && p.roomId);
  const onShow = c.location?.kind === 'room';
  const text = kind === 'captive'
    ? c.state === 'breaking' ? `On the rack in the ${c.whereName ?? 'Torture chamber'} — tamed by cycle ${c.doneAt ?? c.breaking}${(c.doneAt ?? c.breaking) != null ? ` (${Math.max(0, (c.doneAt ?? c.breaking) - s.cycle)} to go)` : ''}.`
      : c.state === 'onShow' ? `On show in the ${c.whereName}.`
      : c.state === 'tamed' ? 'Tamed — ready to go on show in a room.'
      : 'Raw — held in the cells. Put them on a rack to tame them, or cash them in.'
    // one price the player can act on — the engine's sell quote (a tag-worth "about Ng" sat next to it
    // and matched no action)
    : onShow ? `On show in the ${c.whereName}. ${cap1(FORM_ONE[formOf(c.tags)]!)} — sells for ~${c.sellEst}g.`
    : `In the stores — not on show. ${cap1(FORM_ONE[formOf(c.tags)]!)} — sells for ~${c.sellEst}g.`;
  // nowhere to go (every row refused): the cheapest real fix, preferring a room that shows it off
  const wants = !best && c.state !== 'breaking' && !onShow;
  const fixRow = wants ? [...rows].filter(p => !p.ok && p.fix && !p.fix.block).sort((a, b) => Number(b.kind === 'prestige') - Number(a.kind === 'prestige') || (a.fix.cost ?? 0) - (b.fix.cost ?? 0))[0]
    ?? rows.find(p => !p.ok && p.fix) : null;
  return <div className="settop">
    <p className="p">{st && <span className={'stc ' + st.cls}>{st.text}</span>} {text}</p>
    {kind === 'captive' && s.captiveCap > 0 && <p className="dimp small">Cells {s.captives.length}/{s.captiveCap} — counts captives in the cells, on the rack or on show; holding does not count until you take them.</p>}
    {best && (!onShow || best.gain > 0.05) && <div className="nextstep">
      <button className="btn solid big" onClick={() => quick('setin', best.roomId, c.id, best.idx ?? undefined)}>
        <RoomIcon type={best.roomType} size={20} />{best.kind === 'rack' ? 'Put on the rack' : `${onShow ? 'Move to' : 'Set in'} the ${best.roomName}`} · {best.label}</button>
    </div>}
    {wants && !best && <div className="nextstep nowhere">
      <span className="why">Nowhere to set them yet — every room that takes them is full or has no places.</span>
      {fixRow && fix(fixRow.fix, true, `${fixRow.roomName}:`)}
    </div>}
  </div>;
}

/** every room it could go, the engine's rows: ok rows get [Set]; refused rows are greyed with the
 *  reason and, when there is one, the fix; refusals with no fix and the same reason share one line */
function SetList({ s, c, quick, fix }: { s: S; c: any; quick: any; fix: (f: any, solid?: boolean, lead?: string) => React.ReactNode }) {
  const rows: any[] = c.roomPlacements ?? [];
  const onShow = c.location?.kind === 'room';
  const room = onShow ? (s.fort?.rooms ?? []).find((r: any) => r.id === c.whereId) : null;
  const idx = room ? room.slots.findIndex((x: any) => x?.id === c.id) : -1;
  const slotItem = idx >= 0 ? room.slots[idx] : null;
  const ok = rows.filter(p => p.ok && !p.here), here = rows.filter(p => p.here);
  const fixed = rows.filter(p => !p.ok && !p.here && p.fix);
  const grouped = new Map<string, string[]>();
  for (const p of rows.filter(p => !p.ok && !p.here && !p.fix)) grouped.set(p.reason ?? p.label, [...(grouped.get(p.reason ?? p.label) ?? []), p.roomName]);
  if (!rows.length && !onShow) return null;
  const share = slotItem?.prestigeShare ? ` · −${slotItem.prestigeShare} ✦` : '';
  return <div className="blk setin">
    <span className="lbl">Set them in — every room that could take them</span>
    {here.map(p => <div className="sr is-here" key={'h' + p.roomId}>
      <span className="ri"><RoomIcon type={p.roomType} size={22} /></span><span className="rn">{p.roomName}</span><span className="rl">here{c.state === 'breaking' && c.doneAt ? ` · tamed by cycle ${c.doneAt}` : ''}</span>
      {room && idx >= 0 && (c.rackLoss
        ? <ConfirmButton className="btn sm" label="Take off the rack" armedLabel={`Take off? ${c.rackLoss}`} onConfirm={() => quick('unslot', room.id, idx)} />
        : <button className="btn sm ghost" onClick={() => quick('unslot', room.id, idx)}>Take out{share}</button>)}
    </div>)}
    {onShow && !here.length && room && idx >= 0 && <div className="sr is-here">
      <span className="ri"><RoomIcon type={room.type} size={22} /></span><span className="rn">{room.name}</span><span className="rl">here</span>
      {c.rackLoss ? <ConfirmButton className="btn sm" label="Take off the rack" armedLabel={`Take off? ${c.rackLoss}`} onConfirm={() => quick('unslot', room.id, idx)} />
        : <button className="btn sm ghost" onClick={() => quick('unslot', room.id, idx)}>Take out{share}</button>}
    </div>}
    {ok.map((p, i) => <div className={'sr is-ok' + (p.tone === 'bad' ? ' loses' : '')} key={'o' + p.roomId}>
      <span className="ri"><RoomIcon type={p.roomType} size={22} /></span><span className="rn">{p.roomName}</span>
      <span className="rl">{p.label}</span>
      <button className={'btn sm' + (i === 0 ? ' solid' : '')} onClick={() => quick('setin', p.roomId, c.id, p.idx ?? undefined)}>Set</button>
    </div>)}
    {fixed.map(p => <div className="sr is-no" key={'f' + (p.roomId ?? p.roomType)}>
      <span className="ri"><RoomIcon type={p.roomType} size={22} /></span><span className="rn">{p.roomName}</span>
      <span className="rl">{p.reason ?? p.label}</span>
      <span className="rf">{fix(p.fix)}</span>
    </div>)}
    {[...grouped].map(([why, names]) => <div className="sr is-no grp" key={'g' + why}>
      <span className="rn">{names.join(', ')}</span><span className="rl">{why}</span>
    </div>)}
  </div>;
}

/** ransom / sell: one click, unless they're on a rack — then it asks twice and says what is lost (R1) */
function Cash({ label, loss, onGo }: { label: string; loss: string | null; onGo: () => void }) {
  if (!loss) return <button className="btn" onClick={onGo}>{label}</button>;
  return <ConfirmButton className="btn" label={label} armedLabel={`${label} — ${loss}?`} onConfirm={onGo} />;
}

/** the dossier's memories of their own (no other party: "- came through …") */
function ownMemories(dossier: string): string[] {
  return (dossier ?? '').split('\n').filter(l => l.startsWith('- ') && !/^- .+? \([^)]+\) — /.test(l)).map(l => l.slice(2).replace(/ \(defining memory\)$/, ''));
}
/** the dossier's relationship lines → bonds */
function bonds(dossier: string, self: string): { name: string; rel: string; text: string }[] {
  return (dossier ?? '').split('\n').map(l => l.match(/^- (.+?) \(([^)]+)\) — (.*)$/)).filter(Boolean)
    .map(m => ({ name: m![1]!, rel: m![2]!.replace(/-/g, ' '), text: m![3]!.replace(/ \(defining memory\)$/, '') })).filter(b => b.name !== self).slice(0, 5);
}
