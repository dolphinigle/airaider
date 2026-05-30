import { useDraggable } from '@dnd-kit/core';
import type { GameState, Merc } from '../types';
import { useDispatch } from '../api';

function MercCard({
  merc, assignedToSlot, onSelect,
}: {
  merc: Merc;
  assignedToSlot: string | null;
  onSelect: (mercId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `merc:${merc.id}` });
  const best = Math.max(...Object.values(merc.attrs));
  const bestAttr = (Object.keys(merc.attrs) as Array<keyof typeof merc.attrs>).find((k) => merc.attrs[k] === best);
  return (
    <div
      ref={setNodeRef}
      data-testid={`merc-${merc.id}`}
      style={{
        padding: 6,
        marginBottom: 6,
        background: 'var(--panel-2)',
        border: assignedToSlot ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 3,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : assignedToSlot ? 0.55 : 1,
        userSelect: 'none',
      }}
    >
      <div {...attributes} {...listeners} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <strong>⚔ {merc.name}</strong>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>{merc.archetype}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--accent)' }} title={`peak ${bestAttr}`}>peak{best}</span>
        {merc.fatigue > 0 && <span style={{ fontSize: 11, color: 'var(--danger)' }} title="fatigue">fat{merc.fatigue}</span>}
        {merc.hpDamage > 0 && <span style={{ fontSize: 11, color: 'var(--danger)' }} title="wounds">hp-{merc.hpDamage}</span>}
        {merc.tier !== 'rookie' && (
          <span style={{ fontSize: 11, color: 'var(--rare)' }} title="veterancy">★{merc.tier}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          {Object.entries(merc.attrs).map(([k, v]) => `${k.slice(0, 3)}${v}`).join(' ')}
        </span>
        <span style={{ flex: 1 }} />
        <button
          data-testid={`merc-detail-${merc.id}`}
          onClick={() => onSelect(merc.id)}
          style={{ fontSize: 10, padding: '1px 6px' }}
        >
          details
        </button>
      </div>
      {assignedToSlot && (
        <div style={{ marginTop: 2, fontSize: 10, color: 'var(--accent)' }}>
          ↳ assigned to {assignedToSlot}
        </div>
      )}
    </div>
  );
}

export function MercPanel({
  state, onSelectMerc,
}: {
  state: GameState;
  onSelectMerc: (mercId: string) => void;
}) {
  const dispatch = useDispatch();
  // Compute slot-assignment map so cards can show "↳ assigned to ...".
  const assignedMap = new Map<string, string>();
  for (const q of state.pursuedQuests) {
    for (const [slotId, mercId] of Object.entries(q.assignments)) {
      if (mercId) assignedMap.set(mercId, `${q.title} / ${slotId}`);
    }
  }
  return (
    <section data-testid="merc-panel" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>ROSTER ({state.mercs.length})</h3>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
        drag a merc onto a quest slot to assign
      </div>
      {state.mercs.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>no mercs. build a Tavern → END DAY → hire from bench.</div>}
      {state.mercs.map((m) => (
        <MercCard
          key={m.id}
          merc={m}
          assignedToSlot={assignedMap.get(m.id) ?? null}
          onSelect={onSelectMerc}
        />
      ))}

      {state.hirePool.length > 0 && (
        <>
          <h3 style={{ margin: '12px 0 8px', fontSize: 13, color: 'var(--accent)' }}>TAVERN BENCH ({state.hirePool.length})</h3>
          {state.hirePool.map((h) => (
            <div key={h.merc.id} data-testid={`bench-${h.merc.id}`} style={{ padding: 6, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <strong>{h.merc.name}</strong>
                <span style={{ color: 'var(--muted)' }}>{h.merc.archetype}</span>
                {h.startingTier && h.startingTier !== 'rookie' && (
                  <span style={{ color: 'var(--rare)' }}>★{h.startingTier}</span>
                )}
                <span style={{ flex: 1 }} />
                <span>{h.price}g</span>
                <button
                  data-testid={`hire-${h.merc.id}`}
                  disabled={state.gold < h.price || dispatch.isPending}
                  onClick={() => dispatch.mutate({ kind: 'hire-merc', mercId: h.merc.id })}
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  hire
                </button>
              </div>
              {h.merc.tags.length > 0 && (
                <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)' }}>
                  {h.merc.tags.map((t) => t.label).join(', ')}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
