import { useEffect, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useGameState, useDispatch } from './api';
import { StatusBar } from './components/StatusBar';
import { FortGrid } from './components/FortGrid';
import { LeadBoard } from './components/LeadBoard';
import { CaptivePanel } from './components/CaptivePanel';
import { MercPanel } from './components/MercPanel';
import { LogPanel } from './components/LogPanel';
import { BuildModal } from './components/BuildModal';
import { CaptiveActionModal } from './components/CaptiveActionModal';
import { QuestPanel } from './components/QuestPanel';
import { ResolutionModal } from './components/ResolutionModal';
import { MercDetailDrawer } from './components/MercDetailDrawer';

export function App() {
  const { data: state, isLoading, error } = useGameState();
  const dispatch = useDispatch();
  const [buildCell, setBuildCell] = useState<number | null>(null);
  const [captiveActionId, setCaptiveActionId] = useState<string | null>(null);
  const [mercDetailId, setMercDetailId] = useState<string | null>(null);
  const [showResolutions, setShowResolutions] = useState(false);

  // Auto-pop the resolution modal whenever a new batch arrives.
  useEffect(() => {
    if (state?.lastResolutions && state.lastResolutions.length > 0) {
      setShowResolutions(true);
    }
  }, [state?.lastResolutions]);

  if (isLoading) return <div style={{ padding: 24 }}>loading…</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>error: {String(error)}</div>;
  if (!state) return null;

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const activeId = String(e.active.id);
    const overId = String(e.over.id);
    if (activeId.startsWith('merc:') && overId.startsWith('slot:')) {
      const mercId = activeId.slice('merc:'.length);
      const [, questId, slotId] = overId.split(':');
      dispatch.mutate({ kind: 'assign-slot', questId: questId!, slotId: slotId!, mercId });
      return;
    }
    if (activeId.startsWith('captive:')) {
      const captiveId = activeId.slice('captive:'.length);
      if (overId === 'overflow') {
        dispatch.mutate({ kind: 'place-captive', captiveId, cellIdx: null });
      } else if (overId.startsWith('cell:')) {
        const cellIdx = Number(overId.slice('cell:'.length));
        dispatch.mutate({ kind: 'place-captive', captiveId, cellIdx });
      }
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }} data-testid="app-root">
        <StatusBar
          state={state}
          onEndDay={() => dispatch.mutate({ kind: 'end-day' })}
          onExcavate={() => dispatch.mutate({ kind: 'excavate' })}
          onShowResolutions={() => setShowResolutions(true)}
          busy={dispatch.isPending}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 12, padding: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, overflow: 'hidden' }}>
            <FortGrid
              state={state}
              onCellClick={(cellIdx) => setBuildCell(cellIdx)}
              onExcavate={(floor, side) => dispatch.mutate({ kind: 'excavate', floor, side })}
              onOpenFloor={(direction) => dispatch.mutate({ kind: 'open-floor', direction })}
              onCaptiveDropToCell={() => {}}
              onCaptiveDropToOverflow={() => {}}
            />
            <LogPanel state={state} />
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, overflow: 'hidden' }}>
            <LeadBoard
              state={state}
              onPursue={(leadId) => dispatch.mutate({ kind: 'pursue-lead', leadId })}
            />
            <CaptivePanel state={state} onAction={(captiveId) => setCaptiveActionId(captiveId)} />
          </div>
          <QuestPanel
            state={state}
            onAbandon={(questId) => dispatch.mutate({ kind: 'abandon-quest', questId })}
            onUnassign={(questId, slotId) => dispatch.mutate({ kind: 'assign-slot', questId, slotId, mercId: null })}
          />
          <MercPanel state={state} onSelectMerc={(mercId) => setMercDetailId(mercId)} />
        </div>

        {buildCell !== null && (
          <BuildModal
            state={state}
            cellIdx={buildCell}
            onClose={() => setBuildCell(null)}
            onBuild={(roomId) => {
              dispatch.mutate({ kind: 'build-room', roomId, cellIdx: buildCell });
              setBuildCell(null);
            }}
          />
        )}
        {captiveActionId !== null && (
          <CaptiveActionModal
            state={state}
            captiveId={captiveActionId}
            onClose={() => setCaptiveActionId(null)}
            onAction={(action) => {
              dispatch.mutate({ kind: 'captive-action', captiveId: captiveActionId, action });
              setCaptiveActionId(null);
            }}
          />
        )}
        {mercDetailId !== null && (
          <MercDetailDrawer
            state={state}
            mercId={mercDetailId}
            onClose={() => setMercDetailId(null)}
          />
        )}
        {showResolutions && state.lastResolutions.length > 0 && (
          <ResolutionModal
            state={state}
            onClose={() => {
              setShowResolutions(false);
              dispatch.mutate({ kind: 'clear-resolutions' });
            }}
          />
        )}
      </div>
    </DndContext>
  );
}
