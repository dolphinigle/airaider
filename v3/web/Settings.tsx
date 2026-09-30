// SETTINGS — the player's campaign direction for the AI storyteller (free text → guidance + trait
// preferences, Game.setDirection; CLI 'direction'), and sound. Designer 2026-09-30: "a SETTINGS in the
// game … a free text that they can tell the AI for the story theme … 'Dark fantasy' or 'Generate males
// for npcs'" — "it should be a preferences for traits not just sex".
import React, { useEffect, useRef, useState } from 'react';
import { type S } from './ui';
import { sfx, sfxSettings } from './sfx';

export function Settings({ s, doAct, close }: { s: S; doAct: (type: string, ...a: any[]) => Promise<void>; close: () => void }) {
  const d = s.direction as null | { text: string; guidance: string; npc: { prefer: string[]; avoid: string[] }; recruit: { prefer: string[]; avoid: string[] }; avoid: string[] };
  const [text, setText] = useState(d?.text ?? '');
  const [saving, setSaving] = useState(false);
  const [vol, setVol] = useState(sfxSettings.volume);
  const [muted, setMuted] = useState(sfxSettings.muted);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { sfx('open'); box.current?.focus(); return () => sfx('close') }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close() } };
    addEventListener('keydown', k, true);
    return () => removeEventListener('keydown', k, true);
  }, []);
  const save = async (t: string) => { setSaving(true); await doAct('direction', t); setSaving(false) };
  const chips = (label: string, ids: string[], cls: string) => ids.length > 0 && <div className="dline"><span className="dl">{label}</span>{ids.map(x => <span key={x} className={'tg ' + cls}>{x}</span>)}</div>;
  const dirty = (d?.text ?? '') !== text.trim();

  return (
    <div className="bscrim" onClick={close}>
      <section className="settings" role="dialog" aria-label="Settings" onClick={e => e.stopPropagation()}>
        <header className="sth"><h2>SETTINGS</h2><button className="btn sm ghost" onClick={close} aria-label="Close" title="Esc">✕</button></header>
        <div className="stbody">
          <section className="stsec">
            <h3>Story direction</h3>
            <p className="p">Tell the storyteller what kind of game you want — a tone, a setting, and what the people you meet
              or recruit are like. It shapes every quest, report and person from now on.</p>
            <textarea ref={box} rows={4} maxLength={500} value={text} onChange={e => setText(e.target.value)}
              placeholder={'e.g.  Dark fantasy, grim and bloody. Make the NPCs men, mostly elves.\n       Lighthearted adventure. More beautiful, playful recruits. No lizardfolk.'} />
            <div className="stacts">
              <button className="btn solid" disabled={saving || !text.trim() || !dirty} onClick={() => save(text)}>{saving ? 'Reading it…' : 'Set direction'}</button>
              {d && <button className="btn ghost" disabled={saving} onClick={() => { setText(''); save('') }}>Clear</button>}
              <span className="dimp">{text.length}/500</span>
            </div>
            {d && <div className="dread">
              <span className="lbl">What the storyteller took from it</span>
              <p className="p dg">{d.guidance}</p>
              {chips('Strangers — more', d.npc.prefer, 'pre')}
              {chips('Strangers — never', d.npc.avoid, 'avo')}
              {chips('Recruits — more', d.recruit.prefer, 'pre')}
              {chips('Recruits — never', d.recruit.avoid, 'avo')}
              {d.avoid.length > 0 && <div className="dline"><span className="dl">Keep out</span><span className="p">{d.avoid.join(' · ')}</span></div>}
              <p className="dimp note">Traits steer who the game rolls from now on (a single preferred race or sex is always used).
                People already in your world stay as they are.</p>
            </div>}
          </section>
          <section className="stsec">
            <h3>Sound</h3>
            <div className="sndrow">
              <label className="chk"><input type="checkbox" checked={!muted} onChange={e => { sfxSettings.muted = !e.target.checked; setMuted(!e.target.checked); if (e.target.checked) sfx('place') }} /> Sound effects</label>
              <label className="vol">Volume
                <input type="range" min={0} max={1} step={0.05} value={vol} disabled={muted}
                  onChange={e => { const v = Number(e.target.value); sfxSettings.volume = v; setVol(v) }}
                  onPointerUp={() => sfx('coin')} onKeyUp={() => sfx('coin')} /></label>
              <button className="btn sm ghost" disabled={muted} onClick={() => { sfx('stampOk') }}>Test</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
