import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { GameState } from '../types';

function CaptiveChip({ captive }: { captive: GameState['captives'][number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `captive:${captive.id}` });
  return (
    <div
      ref={setNodeRef}
      data-testid={`captive-chip-${captive.id}`}
      {...attributes}
      {...listeners}
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        margin: '2px',
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 3,
        fontSize: 11,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
      }}
      title={`notoriety ${captive.notoriety}`}
    >
      ⛓ {captive.name.slice(0, 12)}
    </div>
  );
}

function CellSlot({ cellIdx, state, onCellClick }: { cellIdx: number; state: GameState; onCellClick: (idx: number) => void }) {
  const placed = state.fort.placedRooms.find((r) => r.cellIdx === cellIdx);
  const captivesHere = state.captives.filter((c) => c.cellIdx === cellIdx);
  const { isOver, setNodeRef } = useDroppable({ id: `cell:${cellIdx}`, disabled: !placed });
  const isDungeon = placed && (placed.roomId === 'storeroom' || placed.roomId === 'extra-storeroom');
  const bg = isOver && isDungeon ? 'rgba(199, 155, 92, 0.25)' : 'var(--panel-2)';
  return (
    <div
      ref={setNodeRef}
      data-testid={`cell-${cellIdx}`}
      onClick={() => onCellClick(cellIdx)}
      style={{
        background: bg,
        border: '1px solid var(--border)',
        padding: 8,
        minHeight: 100,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      title={placed ? `cell ${cellIdx}: ${placed.roomId}` : `cell ${cellIdx}: empty (click to build)`}
    >
      <div style={{ fontSize: 10, color: 'var(--muted)' }}>cell {cellIdx}</div>
      {placed ? (
        <>
          <strong style={{ fontSize: 13 }}>{placed.roomId}</strong>
          <div style={{ flex: 1, marginTop: 4 }}>
            {captivesHere.map((c) => <CaptiveChip key={c.id} captive={c} />)}
          </div>
        </>
      ) : (
        <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>+ build room</span>
      )}
    </div>
  );
}

function OverflowZone({ state }: { state: GameState }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'overflow' });
  const overflowCaptives = state.captives.filter((c) => c.cellIdx === undefined);
  return (
    <div
      ref={setNodeRef}
      data-testid="overflow-zone"
      style={{
        marginTop: 12,
        padding: 8,
        border: '1px dashed var(--danger)',
        background: isOver ? 'rgba(224, 122, 95, 0.15)' : 'var(--panel-2)',
        borderRadius: 3,
        minHeight: 50,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--danger)' }}>⚠ OVERFLOW CORNER (+15% escape risk)</div>
      <div style={{ marginTop: 4 }}>
        {overflowCaptives.length === 0
          ? <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}>no captives in overflow</span>
          : overflowCaptives.map((c) => <CaptiveChip key={c.id} captive={c} />)}
      </div>
    </div>
  );
}

export function FortGrid({
  state, onCellClick,
}: {
  state: GameState;
  onCellClick: (idx: number) => void;
  /** Kept for API compat — drag handling moved to App's DndContext. */
  onCaptiveDropToCell?: (captiveId: string, cellIdx: number) => void;
  onCaptiveDropToOverflow?: (captiveId: string) => void;
}) {
  return (
    <section data-testid="fort-grid" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>FORT LAYOUT</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${state.fort.cells.length}, 1fr)`, gap: 6 }}>
        {state.fort.cells.map((c) => (
          <CellSlot key={c.idx} cellIdx={c.idx} state={state} onCellClick={onCellClick} />
        ))}
      </div>
      <OverflowZone state={state} />
      {state.adjacencyBonuses.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, background: 'var(--panel-2)', borderRadius: 3 }}>
          <div style={{ fontSize: 11, color: 'var(--good)' }}>active adjacencies:</div>
          {state.adjacencyBonuses.map((b) => (
            <div key={b} style={{ fontSize: 11 }}>⤬ {b}</div>
          ))}
        </div>
      )}
    </section>
  );
}
