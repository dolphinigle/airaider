// SOUND EFFECTS — synthesised live with Web Audio, no files (the ../mahjong make_sounds.py approach:
// a few lines of arithmetic, no licence, retuned by editing numbers). Designer 2026-09-30: "add sound
// effects? it feels jarring without one". Volume + mute are a per-viewer convenience (localStorage).
//
// Every sound is built from two primitives: a TONE (an oscillator with a percussive envelope, optional
// pitch glide) and a NOISE burst (filtered white noise — paper, gravel, the scrape in a thud). Struck
// things = a fast attack + exponential decay; soft UI things stay quiet and short.

type Name = 'tick' | 'dead' | 'pick' | 'drop' | 'place' | 'refuse' | 'warn' | 'coin' | 'build' | 'dig' | 'raise' | 'end'
  | 'stampOk' | 'stampPartial' | 'stampFail' | 'levelup' | 'notify' | 'open' | 'close' | 'quill' | 'heal';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
const last: Partial<Record<Name, number>> = {};

const store = {
  get vol() { try { const v = Number(localStorage.getItem('sfx.vol')); return Number.isFinite(v) && localStorage.getItem('sfx.vol') !== null ? v : 0.55 } catch { return 0.55 } },
  set vol(v: number) { try { localStorage.setItem('sfx.vol', String(v)) } catch { /* private mode */ } },
  get muted() { try { return localStorage.getItem('sfx.muted') === '1' } catch { return false } },
  set muted(m: boolean) { try { localStorage.setItem('sfx.muted', m ? '1' : '0') } catch { /* private mode */ } },
};
export const sfxSettings = {
  get volume() { return store.vol }, set volume(v: number) { store.vol = Math.max(0, Math.min(1, v)); apply() },
  get muted() { return store.muted }, set muted(m: boolean) { store.muted = m; apply() },
};
function apply() { if (master && ctx) master.gain.setTargetAtTime(store.muted ? 0 : store.vol, ctx.currentTime, 0.02) }

function ac(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain(); master.gain.value = store.muted ? 0 : store.vol;
    // a gentle compressor so stacked sounds never clip
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** a struck/sounded tone: `f` Hz (glides to `to`), level `g`, attack `a`s, decay time-constant `d`s */
type ToneOpts = { g?: number; a?: number; d?: number; len?: number; type?: OscillatorType; to?: number };
function tone(c: AudioContext, t: number, f: number, opt: ToneOpts = {}) {
  const { g = 0.2, a = 0.004, d = 0.12, type = 'sine', to = 0 } = opt; const len = opt.len ?? d * 5;
  const o = c.createOscillator(), e = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + Math.min(len, d * 2));
  e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.setTargetAtTime(0.0001, t + a, d);
  o.connect(e); e.connect(master!); o.start(t); o.stop(t + a + len);
}
/** a filtered noise burst: `type` filter at `f` Hz (sweeps to `to`), level `g`, length `len`s */
function noise(c: AudioContext, t: number, { f = 1500, to = 0, q = 1, type = 'bandpass' as BiquadFilterType, g = 0.15, a = 0.003, len = 0.08 } = {}) {
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), e = c.createGain();
  s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + len);
  e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(fl); fl.connect(e); e.connect(master!); s.start(t, Math.random() * 0.5); s.stop(t + len + 0.02);
}
const thud = (c: AudioContext, t: number, g = 0.35) => { tone(c, t, 150, { g, d: 0.05, to: 85 }); noise(c, t, { type: 'lowpass', f: 700, g: g * 0.5, len: 0.06 }) };
const notes = (c: AudioContext, t: number, fs: number[], step: number, o: ToneOpts = {}) => fs.forEach((f, i) => tone(c, t + i * step, f, o));

const SOUNDS: Record<Name, (c: AudioContext, t: number) => void> = {
  // the UI click: a crisp wooden tap — a pitched blip that drops, over a short bright noise transient
  tick: (c, t) => { tone(c, t, 1500, { g: 0.2, a: 0.002, d: 0.018, to: 900, type: 'triangle' }); noise(c, t, { f: 4200, q: 2, g: 0.14, a: 0.001, len: 0.03 }) },
  // a disabled control: a dull, low tap (it heard you; it can't)
  dead: (c, t) => { tone(c, t, 260, { g: 0.14, a: 0.002, d: 0.03, to: 200 }); noise(c, t, { type: 'lowpass', f: 900, g: 0.08, len: 0.04 }) },
  pick: (c, t) => noise(c, t, { type: 'highpass', f: 900, to: 3400, g: 0.1, a: 0.02, len: 0.11 }),                  // a card lifted: paper swish
  drop: (c, t) => thud(c, t, 0.28),                                                                                     // a card set down
  place: (c, t) => { thud(c, t, 0.3); tone(c, t + 0.05, 659, { g: 0.07, d: 0.12, type: 'triangle' }) },                 // it went where you meant
  refuse: (c, t) => { tone(c, t, 196, { g: 0.12, d: 0.05, type: 'square', len: 0.09 }); tone(c, t + 0.11, 165, { g: 0.12, d: 0.06, type: 'square', len: 0.1 }) },
  warn: (c, t) => tone(c, t, 349, { g: 0.1, d: 0.1, type: 'triangle' }),
  coin: (c, t) => { for (const [dt, f] of [[0, 2093], [0.07, 2637]] as const) { tone(c, t + dt, f, { g: 0.08, d: 0.09 }); tone(c, t + dt, f * 1.51, { g: 0.03, d: 0.05 }) } },
  build: (c, t) => [0, 0.15, 0.3].forEach(dt => { tone(c, t + dt, 190, { g: 0.22, d: 0.04, to: 140 }); noise(c, t + dt, { f: 1300, q: 2, g: 0.12, len: 0.05 }) }),
  dig: (c, t) => { noise(c, t, { type: 'lowpass', f: 450, to: 220, g: 0.3, a: 0.02, len: 0.4 }); [0.08, 0.26].forEach(dt => noise(c, t + dt, { f: 900, q: 1.5, g: 0.14, len: 0.06 })) },
  raise: (c, t) => { for (const [f, g] of [[392, 0.14], [784, 0.07], [1176, 0.04], [1568, 0.025]] as const) tone(c, t, f, { g, a: 0.006, d: 0.7, len: 2.2 }); tone(c, t, 196, { g: 0.1, d: 0.9, len: 2.4 }) },
  end: (c, t) => { noise(c, t, { type: 'lowpass', f: 500, g: 0.2, len: 0.12 }); for (const [f, g] of [[98, 0.22], [147, 0.1], [196, 0.07], [262, 0.03]] as const) tone(c, t, f, { g, a: 0.01, d: 0.8, len: 2.6 }) },
  stampOk: (c, t) => { thud(c, t, 0.4); notes(c, t + 0.08, [523, 659, 784], 0.07, { g: 0.08, d: 0.18, type: 'triangle' }) },
  stampPartial: (c, t) => { thud(c, t, 0.4); notes(c, t + 0.08, [392, 440], 0.09, { g: 0.07, d: 0.16, type: 'triangle' }) },
  stampFail: (c, t) => { thud(c, t, 0.45); notes(c, t + 0.1, [330, 262], 0.14, { g: 0.08, d: 0.22, type: 'triangle' }) },
  levelup: (c, t) => notes(c, t, [523, 659, 784, 1047], 0.075, { g: 0.08, d: 0.2, type: 'triangle' }),
  notify: (c, t) => { tone(c, t, 880, { g: 0.07, d: 0.18 }); tone(c, t + 0.09, 1319, { g: 0.05, d: 0.2 }) },
  open: (c, t) => noise(c, t, { f: 420, to: 1600, q: 0.8, g: 0.09, a: 0.03, len: 0.14 }),                              // a page unfolds
  close: (c, t) => noise(c, t, { f: 1500, to: 420, q: 0.8, g: 0.07, a: 0.01, len: 0.1 }),
  quill: (c, t) => [0, 0.06, 0.13].forEach((dt, i) => noise(c, t + dt, { f: 2600 + i * 500, q: 4, g: 0.05, len: 0.05 })),   // a lead taken up: pen scratches
  heal: (c, t) => notes(c, t, [659, 988], 0.1, { g: 0.07, d: 0.25 }),
};

/** play one sound; safe to call anywhere (no-ops without audio, throttles repeats within 40ms) */
export function sfx(name: Name) {
  try {
    const c = ac(); if (!c || !master || store.muted || store.vol <= 0) return;
    const now = c.currentTime;
    if ((last[name] ?? -1) > now - 0.04) return;
    last[name] = now;
    SOUNDS[name](c, now + 0.005);
  } catch { /* sound must never break play */ }
}

/** EVERY click gets an instant sound (designer 2026-09-30: "sound effects are still missing on the critical ones
 *  like CLICKING BUTTONS"): one capture-phase listener on the document — buttons, links, tabs, cards, checkboxes,
 *  selects, role=button. A disabled control gets the dull 'dead' tap. The action's own result sound (place,
 *  build, coin…) follows when the engine answers. Opt out per element with data-sfx="off". */
export function installClickSounds() {
  const SEL = 'button, a[href], [role="button"], [role="tab"], select, input[type="checkbox"], input[type="radio"], summary, .card, .sliver';
  const on = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const el = (e.target as HTMLElement | null)?.closest?.(SEL) as HTMLElement | null;
    if (!el || el.closest('[data-sfx="off"]')) return;
    const off = (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
    sfx(off ? 'dead' : 'tick');
  };
  document.addEventListener('pointerdown', on, true);
  return () => document.removeEventListener('pointerdown', on, true);
}

/** the sound an engine action makes when it succeeds (App's action wrapper plays it) */
export function sfxForAction(type: string, ok: boolean, warn?: boolean) {
  if (!ok) return sfx('refuse');
  if (warn) return sfx('warn');
  const map: Record<string, Name> = {
    assign: 'place', send: 'place', setin: 'place', slot: 'place', auto: 'place', autoall: 'place',
    unassign: 'drop', unslot: 'drop', clear: 'drop',
    build: 'build', upgrade: 'build', renovate: 'build', excavate: 'dig', gh: 'raise',
    ransom: 'coin', sell: 'coin', settle: 'coin', hire: 'coin', accept: 'drop',
    pursue: 'quill', pursueall: 'quill', interrogate: 'quill', heal: 'heal',
    abandon: 'drop', cancel: 'drop',   // focus, approach, inflight: the click's own tick is the sound
  };
  const n = map[type]; if (n) sfx(n);
}
