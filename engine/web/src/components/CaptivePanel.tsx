import type { GameState } from '../types';

export function CaptivePanel({ state, onAction }: { state: GameState; onAction: (id: string) => void }) {
  return (
    <section data-testid="captive-panel" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>CAPTIVES ({state.captives.length}/{state.dungeonCapacity})</h3>
      {state.captives.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>no captives. pursue a captive-archetype lead to take one.</div>}
      {state.captives.map((c) => {
        const cellLabel = c.cellIdx === undefined ? 'OVERFLOW' : `cell ${c.cellIdx} (${c.cellEffects.roomName ?? '?'})`;
        return (
          <div key={c.id} data-testid={`captive-${c.id}`} style={{ padding: 6, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <strong>{c.name}</strong>
              <span style={{ color: 'var(--muted)' }}>{c.archetype}</span>
              <span>not.{c.notoriety}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: c.cellIdx === undefined ? 'var(--danger)' : 'var(--good)' }}>{cellLabel}</span>
              <button onClick={() => onAction(c.id)} style={{ fontSize: 11, padding: '2px 8px' }}>dispose</button>
            </div>
            {c.backstory && (
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>{c.backstory}</div>
            )}
            {c.tags.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {c.tags.map((t) => (
                  <span key={t.id} style={{ fontSize: 10, padding: '1px 5px', background: 'var(--panel)', border: '1px solid var(--border, #444)', borderRadius: 2, color: 'var(--accent)' }}>{t.label}</span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 2, display: 'flex', gap: 6, fontSize: 11 }}>
              {c.cellEffects.chapelAdjacent && <span style={{ color: 'var(--good)' }}>⛪ chapel-adj → free recruit</span>}
              {c.cellEffects.smithyAdjacent && <span style={{ color: 'var(--accent)' }}>⚒ smithy-adj → +5g ransom</span>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
