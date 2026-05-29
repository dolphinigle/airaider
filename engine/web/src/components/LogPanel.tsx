import type { GameState } from '../types';

export function LogPanel({ state }: { state: GameState }) {
  return (
    <section data-testid="log-panel" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>FORT LOG</h3>
      {state.fortLog.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>nothing recorded yet.</div>}
      <pre style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
        {state.fortLog.slice().reverse().map((e) => `d${e.day}  ${e.message}`).join('\n')}
      </pre>
    </section>
  );
}
