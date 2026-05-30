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
            <div style={{ marginTop: 2, display: 'flex', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
              {c.cellEffects.captiveDailyEffect === 'interrogate' && (
                <span style={{ color: 'var(--danger)' }}>
                  🩸 interrogating ({c.daysInRoom ?? 0}d, not. cap {(c.baseNotoriety ?? c.notoriety) * 2})
                </span>
              )}
              {c.cellEffects.captiveDailyEffect === 'display' && (
                <span style={{ color: 'var(--accent)' }}>
                  💀 on pikes ({c.daysInRoom ?? 0}d / {Math.max(0, c.notoriety - (c.daysInRoom ?? 0))}d left)
                </span>
              )}
              {c.cellEffects.chapelAdjacent && <span style={{ color: 'var(--good)' }}>⛪ chapel-adj → free recruit</span>}
              {c.cellEffects.smithyAdjacent && <span style={{ color: 'var(--accent)' }}>⚒ smithy-adj → +5g ransom</span>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
