// Shared game-feel primitives for every screen — presentation only, never game logic (the engine
// owns every number and verdict; these just show them). Styles: styles.css (fx.tsx primitives).
import React, { useCallback, useEffect, useRef, useState } from 'react';

type BtnAttrs = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

/** A destructive button that asks twice. First click ARMS it for `ms` (shows `armedLabel`, which
 *  should say what is lost); a second click inside that window commits. With `needsConfirm` false
 *  a single click commits (e.g. the END seal when nothing would be lost). Clicking elsewhere or
 *  waiting disarms. Click events stop here, so it is safe inside a clickable card or row. */
export function ConfirmButton({ label, armedLabel, onConfirm, className = '', disabled, needsConfirm = true, ms = 3000, onArm, onBlur, ...rest }: BtnAttrs & {
  label: React.ReactNode; armedLabel: React.ReactNode; onConfirm: () => void;
  needsConfirm?: boolean; ms?: number; onArm?: (armed: boolean) => void;
}) {
  const [armed, setArmedState] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const setArmed = (v: boolean) => { setArmedState(v); onArm?.(v) };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (armed && (disabled || !needsConfirm)) setArmed(false) }, [disabled, needsConfirm]);
  const click = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimeout(timer.current);
    if (!needsConfirm || armed) { if (armed) setArmed(false); onConfirm(); return }
    setArmed(true);
    timer.current = window.setTimeout(() => setArmed(false), ms);
  };
  return (
    <button type="button" {...rest} className={`${className}${armed ? ' is-armed' : ''}`.trim()} disabled={disabled}
      onClick={click} onBlur={e => { if (armed) { clearTimeout(timer.current); setArmed(false) } onBlur?.(e) }}>
      {armed ? armedLabel : label}
    </button>
  );
}

export type Tone = 'good' | 'bad' | 'info';
/** above (floats up) · below (drifts down) · side (beside the value, inside its bar — a header's
 *  numbers: below them is the next-steps row, above them the window's edge) */
export type Place = 'above' | 'below' | 'side';

/** A short-lived chip ("+253g", "−1 wound") that floats and fades, then unmounts itself. Put it
 *  inside a positioned parent; `place` = above (floats up), below (drifts down) or side (beside a
 *  header value). Re-key it (or use useFloaters) to show a new one. */
export function Floater({ text, tone = 'info', place = 'above', ms = 1800, onDone }: {
  text: React.ReactNode; tone?: Tone; place?: Place; ms?: number; onDone?: () => void;
}) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setOn(false); onDone?.() }, ms); return () => clearTimeout(t) }, []);
  return on ? <span className={`floater ${place}`} data-tone={tone} aria-hidden="true">{text}</span> : null;
}

/** One floater slot for an anchor: push(text, tone) shows a new chip, replacing the last one
 *  (stacked chips at one spot are unreadable). Render `node` inside the positioned anchor. */
export function useFloaters(place: Place = 'above') {
  const [cur, setCur] = useState<{ id: number; text: React.ReactNode; tone: Tone } | null>(null);
  const n = useRef(0);
  const push = useCallback((text: React.ReactNode, tone: Tone = 'info') => setCur({ id: ++n.current, text, tone }), []);
  const node = cur ? <Floater key={cur.id} text={cur.text} tone={cur.tone} place={place} onDone={() => setCur(c => c?.id === cur.id ? null : c)} /> : null;
  return { push, node };
}

/** A counter that goes up each time `value` changes (never on first render). Re-key an element
 *  with it to replay a one-shot animation: `<b key={n} className={n ? 'fx-flash' : ''}>`. */
export function useBump(value: unknown): number {
  const prev = useRef(value);
  const [n, setN] = useState(0);
  useEffect(() => { if (!Object.is(prev.current, value)) { prev.current = value; setN(x => x + 1) } }, [value]);
  return n;
}

/** Float the change whenever a displayed number changes (not on first render). `fmt` renders the
 *  delta ("+253g"); `toneOf` picks the colour (default: up = good, down = bad). Returns the node to
 *  render inside the value's positioned wrapper. */
export function useDeltaFloater(value: number | null | undefined, fmt: (d: number) => React.ReactNode,
  opts: { place?: Place; eps?: number; toneOf?: (d: number) => Tone } = {}) {
  const prev = useRef(value);
  const f = useFloaters(opts.place ?? 'below');
  useEffect(() => {
    const p = prev.current; prev.current = value;
    if (p == null || value == null) return;
    const d = value - p;
    if (Math.abs(d) > (opts.eps ?? 1e-9)) f.push(fmt(d), opts.toneOf ? opts.toneOf(d) : d > 0 ? 'good' : 'bad');
  }, [value]);
  return f.node;
}
