import type { GameState } from '../types';

export function StatusBar({ state, onAdvanceDay, onExcavate, busy }: { state: GameState; onAdvanceDay: () => void; onExcavate: () => void; busy: boolean }) {
  const p = state.prestige;
  return (
    <header data-testid="status-bar" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
      <strong style={{ color: 'var(--accent)' }}>airaider</strong>
      <span data-testid="day">Day {state.dayCount}</span>
      <span data-testid="gold">{state.gold}g</span>
      <span>fort L{state.fort.level}</span>
      <span>rooms {state.fort.placedRooms.length}/{state.fort.cells.length}</span>
      <span>mercs {state.mercs.length}</span>
      <span>captives {state.captives.length}/{state.dungeonCapacity}</span>
      <span data-testid="prestige" style={{ color: p.tier === 'unknown' ? 'var(--muted)' : 'var(--accent)' }}>
        prestige {p.score} ({p.tierLabel})
      </span>
      <span style={{ flex: 1 }} />
      <button onClick={onExcavate} disabled={busy}>excavate</button>
      <button onClick={onAdvanceDay} disabled={busy} data-testid="advance-day" style={{ background: 'var(--accent)', color: '#1a1815', borderColor: 'var(--accent)' }}>
        advance day »
      </button>
    </header>
  );
}
