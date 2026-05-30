import type { GameState } from '../types';

export function StatusBar({ state, onEndDay, onExcavate, onShowResolutions, busy }: {
  state: GameState;
  onEndDay: () => void;
  onExcavate: () => void;
  onShowResolutions: () => void;
  busy: boolean;
}) {
  const p = state.prestige;
  const readyQuests = state.pursuedQuests.filter((q) => q.slots.every((s) => q.assignments[s.id])).length;
  const totalQuests = state.pursuedQuests.length;
  return (
    <header data-testid="status-bar" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
      <strong style={{ color: 'var(--accent)' }}>airaider</strong>
      <span data-testid="day">Day {state.dayCount}</span>
      <span data-testid="gold">{state.gold}g</span>
      <span>fort L{state.fort.level}</span>
      <span>rooms {state.fort.placedRooms.length}/{state.fort.cells.length}</span>
      <span>mercs {state.mercs.length}</span>
      <span>captives {state.captives.length}/{state.dungeonCapacity}</span>
      <span data-testid="quests">quests {readyQuests}/{totalQuests} ready</span>
      <span data-testid="prestige" style={{ color: p.tier === 'unknown' ? 'var(--muted)' : 'var(--accent)' }}>
        prestige {p.score} ({p.tierLabel})
      </span>
      <span style={{ flex: 1 }} />
      {state.lastResolutions.length > 0 && (
        <button onClick={onShowResolutions} style={{ background: 'var(--rare)', color: '#1a1815' }}>
          📜 {state.lastResolutions.length} resolution{state.lastResolutions.length === 1 ? '' : 's'}
        </button>
      )}
      <button onClick={onExcavate} disabled={busy}>excavate</button>
      <button
        onClick={onEndDay}
        disabled={busy}
        data-testid="end-day"
        style={{ background: 'var(--accent)', color: '#1a1815', borderColor: 'var(--accent)', fontWeight: 'bold' }}
        title={busy ? 'resolving…' : totalQuests > 0 ? `${readyQuests} of ${totalQuests} quests ready to resolve` : 'no quests assigned'}
      >
        {busy ? 'RESOLVING…' : 'END DAY »'}
      </button>
    </header>
  );
}
