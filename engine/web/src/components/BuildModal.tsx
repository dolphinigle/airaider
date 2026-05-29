import { useRoomCatalog } from '../api';
import type { GameState } from '../types';

export function BuildModal({ state, cellIdx, onClose, onBuild }: { state: GameState; cellIdx: number; onClose: () => void; onBuild: (roomId: string) => void }) {
  const { data: rooms } = useRoomCatalog();
  const occupied = state.fort.placedRooms.find((p) => p.cellIdx === cellIdx);
  const uniqueIds = new Set(['scouting-post', 'tavern', 'chapel', 'watch-tower', 'granary']);
  const alreadyBuilt = new Set(state.fort.placedRooms.map((p) => p.roomId));

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
    }} data-testid="build-modal">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--panel)', padding: 20, borderRadius: 4, maxWidth: 600, maxHeight: '80vh', overflow: 'auto',
      }}>
        <h3 style={{ margin: '0 0 12px', color: 'var(--accent)' }}>build in cell {cellIdx}</h3>
        {occupied && (
          <div style={{ color: 'var(--danger)', marginBottom: 12 }}>cell {cellIdx} is already occupied by {occupied.roomId}.</div>
        )}
        {!rooms && <div>loading rooms…</div>}
        {rooms?.map((r) => {
          const cantBuild = !!occupied
            || state.gold < r.cost
            || (uniqueIds.has(r.id) && alreadyBuilt.has(r.id));
          return (
            <div key={r.id} style={{ padding: 8, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <strong>{r.name}</strong>
                <span style={{ color: 'var(--muted)' }}>{r.category}</span>
                <span style={{ flex: 1 }} />
                <span>{r.cost}g</span>
                <button data-testid={`build-${r.id}`} onClick={() => onBuild(r.id)} disabled={cantBuild}>
                  build
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.description}</div>
            </div>
          );
        })}
        <button onClick={onClose} style={{ marginTop: 8 }}>cancel</button>
      </div>
    </div>
  );
}
