import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import type { GameState, Lead } from '../types';

function MercChip({ merc, dim }: { merc: GameState['mercs'][number]; dim?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `merc:${merc.id}` });
  const best = Math.max(...Object.values(merc.attrs));
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`pursue-merc-${merc.id}`}
      style={{
        padding: '4px 8px',
        margin: 2,
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 3,
        fontSize: 12,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : (dim ? 0.4 : 1),
        userSelect: 'none',
      }}
    >
      ⚔ {merc.name} <span style={{ color: 'var(--muted)' }}>({merc.archetype}, peak{best})</span>
    </div>
  );
}

function PartyZone({ assigned, mercs }: { assigned: Set<string>; mercs: GameState['mercs'] }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'party' });
  const partyMercs = mercs.filter((m) => assigned.has(m.id));
  return (
    <div
      ref={setNodeRef}
      data-testid="pursue-party-zone"
      style={{
        minHeight: 80,
        padding: 8,
        background: isOver ? 'rgba(155, 199, 92, 0.15)' : 'var(--panel-2)',
        border: '2px dashed var(--accent)',
        borderRadius: 3,
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>
        PARTY ({partyMercs.length}) — drag mercs here
      </div>
      {partyMercs.length === 0
        ? <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}>empty — drag from below</div>
        : partyMercs.map((m) => <MercChip key={m.id} merc={m} />)}
    </div>
  );
}

function BenchZone({ mercs, assigned }: { mercs: GameState['mercs']; assigned: Set<string> }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'bench' });
  return (
    <div
      ref={setNodeRef}
      data-testid="pursue-bench-zone"
      style={{
        minHeight: 60,
        padding: 8,
        background: isOver ? 'rgba(155, 155, 155, 0.1)' : 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 3,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>ROSTER (unassigned)</div>
      {mercs.filter((m) => !assigned.has(m.id)).map((m) => <MercChip key={m.id} merc={m} />)}
      {mercs.filter((m) => !assigned.has(m.id)).length === 0 && (
        <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}>all mercs assigned</div>
      )}
    </div>
  );
}

export function PursueModal({ state, lead, onClose, onSend }: {
  state: GameState;
  lead: Lead;
  onClose: () => void;
  onSend: (mercIds: string[]) => void;
}) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set());

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const activeId = String(e.active.id);
    const overId = String(e.over.id);
    if (!activeId.startsWith('merc:')) return;
    const mercId = activeId.slice('merc:'.length);
    setAssigned((prev) => {
      const next = new Set(prev);
      if (overId === 'party') next.add(mercId);
      else if (overId === 'bench') next.delete(mercId);
      return next;
    });
  }

  const partySize = assigned.size;
  const canAfford = state.gold >= lead.pursueCost;
  const canSend = partySize >= 1 && partySize <= 4 && canAfford;

  // Predict expected roll for tooltip-ish display.
  const partyMercs = state.mercs.filter((m) => assigned.has(m.id));
  const partyScore = partyMercs.reduce((s, m) => s + Math.max(...Object.values(m.attrs)), 0) + partyMercs.length;
  const target = lead.dc * 2;
  const minRoll = 2 + partyScore;
  const maxRoll = 12 + partyScore;
  const avgRoll = 7 + partyScore;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
    }} data-testid="pursue-modal">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--panel)', padding: 20, borderRadius: 4, maxWidth: 600, width: '100%', maxHeight: '85vh', overflow: 'auto',
      }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--accent)', textTransform: lead.rarity === 'legendary' ? 'uppercase' : 'none' }}>
          [{lead.rarity}] {lead.archetype} — {lead.region}
        </h3>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 8 }}>"{lead.blurb}"</div>
        <div style={{ fontSize: 12, marginBottom: 12 }}>
          DC <strong>{lead.dc}</strong> (target roll ≥{target}) ·
          reward <strong>+{lead.rewardGold}g</strong> ·
          pursue cost <strong>{lead.pursueCost}g</strong>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <PartyZone assigned={assigned} mercs={state.mercs} />
          {partySize > 0 && (
            <div style={{ fontSize: 11, marginBottom: 8, padding: 6, background: 'var(--panel-2)', borderRadius: 3 }}>
              party score: <strong>{partyScore}</strong> →
              roll range <strong>{minRoll}–{maxRoll}</strong> (avg {avgRoll}) vs target {target} ·
              <span style={{ color: avgRoll >= target ? 'var(--good)' : 'var(--danger)' }}>
                {' '}{avgRoll >= target ? 'favorable' : 'risky'}
              </span>
            </div>
          )}
          <BenchZone mercs={state.mercs} assigned={assigned} />
        </DndContext>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            data-testid="pursue-send"
            disabled={!canSend}
            onClick={() => onSend(Array.from(assigned))}
            style={{ padding: '6px 16px' }}
          >
            send party (resolve now)
          </button>
          <button onClick={onClose}>cancel</button>
          {!canAfford && <span style={{ color: 'var(--danger)', fontSize: 11, alignSelf: 'center' }}>need {lead.pursueCost}g</span>}
          {state.mercs.length === 0 && (
            <span style={{ color: 'var(--danger)', fontSize: 11, alignSelf: 'center' }}>no mercs to send — hire from tavern first</span>
          )}
        </div>
      </div>
    </div>
  );
}
