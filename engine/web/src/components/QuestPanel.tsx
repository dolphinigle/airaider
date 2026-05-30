// PROTO-GUI v0.5: Active Quests panel. One card per pursued quest with
// a drop-target per slot. The whole panel + MercPanel live under a single
// shared DndContext (mounted in App.tsx) so mercs can be dragged from the
// roster into any slot, or between slots, in one continuous gesture.

import { useDroppable } from '@dnd-kit/core';
import type { GameState, PursuedQuest, QuestSlot } from '../types';

const RARITY_COLOR: Record<string, string> = {
  legendary: 'var(--legendary)', rare: 'var(--rare)', uncommon: 'var(--uncommon)', common: 'var(--common)',
};

function SlotDropzone({
  questId, slot, mercId, state, onUnassign,
}: {
  questId: string;
  slot: QuestSlot;
  mercId: string | null;
  state: GameState;
  onUnassign: (questId: string, slotId: string) => void;
}) {
  const dropId = `slot:${questId}:${slot.id}`;
  const { isOver, setNodeRef } = useDroppable({ id: dropId });
  const merc = mercId ? state.mercs.find((m) => m.id === mercId) : null;
  const attrLabel = slot.preferredAttr ? slot.preferredAttr.slice(0, 3) : '';
  const fits = merc && slot.preferredAttr && (merc.attrs[slot.preferredAttr] ?? 0) >= 4;
  return (
    <div
      ref={setNodeRef}
      data-testid={dropId}
      style={{
        padding: 6,
        margin: '4px 0',
        background: isOver ? 'rgba(155, 199, 92, 0.18)' : 'var(--panel-2)',
        border: merc ? '1px solid var(--accent)' : '1px dashed var(--border)',
        borderRadius: 3,
        fontSize: 12,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--muted)' }}>
        slot &laquo;{slot.id}&raquo; {attrLabel && <span>· prefers {attrLabel}</span>}
      </div>
      <div style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: 11 }}>{slot.description}</div>
      {merc ? (
        <div
          style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <strong style={{ color: fits ? 'var(--good)' : 'inherit' }}>⚔ {merc.name}</strong>
          {slot.preferredAttr && (
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
              ({slot.preferredAttr}: {merc.attrs[slot.preferredAttr]})
            </span>
          )}
          {merc.fatigue > 0 && <span style={{ fontSize: 10, color: 'var(--danger)' }}>fat{merc.fatigue}</span>}
          <span style={{ flex: 1 }} />
          <button
            data-testid={`unassign-${questId}-${slot.id}`}
            onClick={() => onUnassign(questId, slot.id)}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>↳ drag merc here</div>
      )}
    </div>
  );
}

function QuestCard({
  quest, state, onAbandon, onUnassign,
}: {
  quest: PursuedQuest;
  state: GameState;
  onAbandon: (questId: string) => void;
  onUnassign: (questId: string, slotId: string) => void;
}) {
  const filled = quest.slots.filter((s) => quest.assignments[s.id]).length;
  const ready = filled === quest.slots.length;
  return (
    <div
      data-testid={`quest-${quest.questId}`}
      style={{
        padding: 8,
        marginBottom: 8,
        background: 'var(--panel)',
        border: `2px solid ${ready ? 'var(--good)' : 'var(--border)'}`,
        borderRadius: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ color: RARITY_COLOR[quest.lead.rarity] }}>{quest.title}</strong>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>DC{quest.lead.dc} · +{quest.lead.rewardGold}g</span>
        <span style={{ flex: 1 }} />
        <span
          style={{ fontSize: 11, color: quest.daysLeft <= 1 ? 'var(--danger)' : 'var(--muted)' }}
          title="days until quest expires"
        >
          {quest.daysLeft}d
        </span>
        <button
          data-testid={`abandon-${quest.questId}`}
          onClick={() => onAbandon(quest.questId)}
          style={{ fontSize: 10, padding: '1px 6px' }}
        >
          abandon
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
        "{quest.lead.blurb}"
      </div>
      <div style={{ marginTop: 4 }}>
        {quest.slots.map((s) => (
          <SlotDropzone
            key={s.id}
            questId={quest.questId}
            slot={s}
            mercId={quest.assignments[s.id] ?? null}
            state={state}
            onUnassign={onUnassign}
          />
        ))}
      </div>
      <div style={{ fontSize: 10, color: ready ? 'var(--good)' : 'var(--muted)', textAlign: 'right' }}>
        {ready ? '✓ ready — will resolve on END DAY' : `${filled}/${quest.slots.length} slots filled`}
      </div>
    </div>
  );
}

export function QuestPanel({
  state, onAbandon, onUnassign,
}: {
  state: GameState;
  onAbandon: (questId: string) => void;
  onUnassign: (questId: string, slotId: string) => void;
}) {
  return (
    <section
      data-testid="quest-panel"
      style={{ background: 'var(--bg)', padding: 12, borderRadius: 3, overflow: 'auto' }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>
        ACTIVE QUESTS ({state.pursuedQuests.length})
      </h3>
      {state.pursuedQuests.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          no pursued quests. click "pursue" on a lead, then drag mercs into the slots that appear here.
        </div>
      )}
      {state.pursuedQuests.map((q) => (
        <QuestCard
          key={q.questId}
          quest={q}
          state={state}
          onAbandon={onAbandon}
          onUnassign={onUnassign}
        />
      ))}
    </section>
  );
}
