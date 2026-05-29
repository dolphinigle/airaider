import type { GameState } from '../types';

export function MercPanel({ state }: { state: GameState }) {
  return (
    <section data-testid="merc-panel" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>ROSTER ({state.mercs.length})</h3>
      {state.mercs.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>no mercs. build a Tavern → wait → hire from bench.</div>}
      {state.mercs.map((m) => (
        <div key={m.id} data-testid={`merc-${m.id}`} style={{ padding: 6, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <strong>{m.name}</strong>
            <span style={{ color: 'var(--muted)' }}>{m.archetype}</span>
            <span style={{ flex: 1 }} />
            <span>hp {m.hp}</span>
            <span>{m.wage}g/wk</span>
          </div>
          {m.tags.length > 0 && (
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)' }}>
              {m.tags.map((t) => t.label).join(', ')}
            </div>
          )}
        </div>
      ))}

      {state.hirePool.length > 0 && (
        <>
          <h3 style={{ margin: '12px 0 8px', fontSize: 13, color: 'var(--accent)' }}>TAVERN BENCH ({state.hirePool.length})</h3>
          {state.hirePool.map((h) => (
            <div key={h.merc.id} style={{ padding: 6, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3, fontSize: 12 }}>
              {h.merc.name} ({h.merc.archetype}) — {h.price}g
            </div>
          ))}
        </>
      )}
    </section>
  );
}
