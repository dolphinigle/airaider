// A CARD, OPENED — soldier, captive, relic, debt, tavern hire, holding, or a quest's held cast.
// Every button is an engine action; "Send to" reads Game.placementsFor (the CLI's `fit`).
import React from 'react';
import { type S, Tags, Silhouette, fitCls, Glyph, formOf, FORM_ONE } from './ui';

const ATTRS: [string, string][] = [['str', 'STR'], ['dex', 'DEX'], ['int', 'INT'], ['cha', 'CHA'], ['con', 'CON']];

export function CardSheet({ s, id, cast, doAct, quick, close, openQuest }: { s: S; id: string; cast?: any; doAct: any; quick: any; close: () => void; openQuest: (id: string) => void }) {
  const lists: [string, any[]][] = [['roster', s.roster], ['captive', s.captives], ['relic', s.relics], ['debt', s.liabilities], ['tavern', s.tavern], ['holding', s.holding]];
  let kind = 'cast', c: any = cast;
  if (!cast) for (const [k, l] of lists) { const f = l.find((x: any) => x.id === id); if (f) { kind = k; c = f; break } }
  if (!c) return null;
  const ch = c.character;
  const doThen = async (type: string, ...a: any[]) => { await doAct(type, ...a); if (['hire', 'ransom', 'sell', 'settle', 'accept'].includes(type)) close() };

  return (
    <div className="scrim" onClick={close}>
      <section className={'sheet ' + kind} role="dialog" aria-label={c.name} onClick={e => e.stopPropagation()}>
        <div className="pic">
          {c.portrait ? <img src={c.portrait} alt={`Portrait of ${c.name}`} />
            : kind === 'relic' || kind === 'debt' ? <span className="bigart"><Glyph name={kind === 'debt' ? 'scales' : 'chest'} size={120} /></span>
            : <span className="bigart"><Silhouette size={150} /></span>}
          <div className="cap">{c.portrait ? 'Painted when they joined the company.'
            : c.painting ? 'The portrait is being painted…'
            : kind === 'roster' ? (s.aiName === 'openai' ? 'No portrait yet.' : 'Portraits are painted with the real AI on.')
            : kind === 'cast' ? 'Held to this matter — you can read them, not move them.' : ''}</div>
        </div>
        <div className="info">
          <div className="head">
            <div>
              <h1>{c.name}</h1>
              {(ch?.who || c.who) && <p className="who">{ch?.who ?? c.who}</p>}
            </div>
            <button className="x" onClick={close} aria-label="Close">✕</button>
          </div>

          {kind === 'roster' && <>
            <div className="lvl">
              <span>Level <b>{ch.level}</b></span>
              <span className="xpb"><i style={{ width: `${Math.min(100, ch.xp / Math.max(1, c.xpNeeded) * 100)}%` }} /></span>
              <span>{ch.xp} / {c.xpNeeded} xp</span>
              {ch.level >= c.cap && <span className="capwarn">⛔ held at {c.cap} — a better bedroom raises it</span>}
              {ch.injury > 0 && <span className="woundline">wound {ch.injury}{c.healEta ? ` · heals in ~${c.healEta.cycles}` : ''}
                {s.can?.heal && <button className="btn sm" onClick={() => doAct('heal', c.id)}>Pay to heal</button>}</span>}
            </div>
            <div className="blk"><span className="lbl">Attributes — what they roll</span>
              <div className="attrs">{ATTRS.map(([k, l]) => (
                <div className="at" key={k}><span className="k">{l}</span><span className="v">{Math.round(ch.attrs[k])}</span>
                  <span className="bar"><i style={{ width: `${Math.min(100, ch.attrs[k] / 25 * 100)}%` }} /></span></div>))}</div>
            </div>
          </>}

          {c.tags && <div className="blk"><span className="lbl">{kind === 'relic' ? 'What it is' : 'Tags — what quests look for'}</span><Tags tags={c.tags} /></div>}

          {kind === 'roster' && <>
            <div className="two">
              <div className="blk">
                <span className="lbl">Their story</span>
                {ch.backstory && <p className="p">{ch.backstory}</p>}
                {ch.quirks?.length > 0 && <p className="p quirk">{ch.quirks.join(' · ')}</p>}
              </div>
              <div className="blk">
                <span className="lbl">Bonds</span>
                {bonds(c.dossier, c.name).length === 0 && <p className="p dimp">No history yet.</p>}
                {bonds(c.dossier, c.name).map((b, i) => <div className="bond" key={i}><b>{b.name}</b> <span className="r">{b.rel}</span><br />{b.text}</div>)}
              </div>
            </div>
            <div className="blk">
              <span className="lbl">Send them to — their best free place on each quest</span>
              {(c.placements ?? []).length === 0 && <p className="p dimp">No open place for them right now.</p>}
              {(c.placements ?? []).map((p: any) => {
                const here = c.location?.kind === 'quest' && c.location.questId === p.questId;
                return (
                  <div className="sq" key={p.questId}>
                    <button className="q" onClick={() => openQuest(p.questId)}>{p.title} <span>· {p.attr} place</span></button>
                    <span className={'c ' + fitCls(p.coins, p.bar)}>{Math.round(p.coins)} / {Math.round(p.bar)}</span>
                    {here ? <span className="here">sent</span> : <button className="btn sm" onClick={() => quick('send', p.questId, c.id)}>Send</button>}
                  </div>);
              })}
            </div>
            <div className="acts">
              <span className="lbl">Focus</span>
              <button className={'btn sm' + (ch.focus?.kind === 'none' ? ' on' : '')} onClick={() => doAct('focus', c.id, 'none')}>Generalist</button>
              {ATTRS.map(([k, l]) => <button key={k} className={'btn sm' + (ch.focus?.kind === 'single' && ch.focus.attr === k ? ' on' : '')} onClick={() => doAct('focus', c.id, 'single', k)}>{l}</button>)}
              <span className="dimp">future levels: {ch.focus?.kind === 'single' ? 'one great stat' : ch.focus?.kind === 'dual' ? 'two good stats' : 'grow evenly'}</span>
            </div>
          </>}

          {kind === 'captive' && <>
            <p className="p">{ch.obedient ? 'Tamed — can be set in a room for prestige.' : c.breaking ? `Being broken — tamed by cycle ${c.breaking}.` : 'Raw. Break them in a Torture chamber, or cash them in.'}{c.location?.kind === 'room' ? ' Set in a room.' : ''}</p>
            <div className="acts">
              <button className="btn" onClick={() => doThen('ransom', c.id)}>Ransom · ~{c.ransomEst}g</button>
              <button className="btn" onClick={() => doThen('sell', c.id)}>Sell · ~{c.sellEst}g</button>
              {!c.interrogated && s.can?.interrogate && <button className="btn" onClick={() => doAct('interrogate', c.id)}>Interrogate → a lead</button>}
            </div>
          </>}
          {kind === 'holding' && <>
            <p className="p">Taken on a job. Decide by cycle {c.expires}, or they are let go.</p>
            <div className="acts"><button className="btn" onClick={() => doThen('accept', c.id)}>To the cells</button><button className="btn" onClick={() => doThen('ransom', c.id)}>Ransom now</button></div>
          </>}
          {kind === 'tavern' && <>
            {ch?.backstory && <p className="p">{ch.backstory}</p>}
            <p className="p dimp">Level {ch.level} · leaves the tavern at cycle {c.expires}</p>
            <div className="acts"><button className="btn solid" onClick={() => doThen('hire', c.id)}>Hire · {c.hireCost}g</button></div>
          </>}
          {kind === 'relic' && <>
            <p className="p">{FORM_ONE[formOf(c.tags)]} · {c.location?.kind === 'room' ? 'on show in a room' : 'in the stores'}. Worth about {c.worth}g from what it is.</p>
            {c.location?.kind !== 'room' && <div className="acts"><button className="btn" onClick={() => doThen('sell', c.id)}>Sell · ~{c.sellEst}g</button></div>}
          </>}
          {kind === 'debt' && <>
            <p className="p">A liability: left unpaid, it comes back to bite.</p>
            <div className="acts"><button className="btn solid" onClick={() => doThen('settle', c.id)}>Settle · {Math.abs(c.value) * c.qty}g</button></div>
          </>}
          {kind === 'cast' && <p className="p dimp">{c.trade ? `${c.trade} · ` : ''}{c.role}</p>}
        </div>
      </section>
    </div>
  );
}

/** the dossier's relationship lines → bonds */
function bonds(dossier: string, self: string): { name: string; rel: string; text: string }[] {
  return (dossier ?? '').split('\n').map(l => l.match(/^- (.+?) \(([^)]+)\) — (.*)$/)).filter(Boolean)
    .map(m => ({ name: m![1]!, rel: m![2]!.replace(/-/g, ' '), text: m![3]!.replace(/ \(defining memory\)$/, '') })).filter(b => b.name !== self).slice(0, 5);
}
