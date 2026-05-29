import { useState } from 'react';
import { useGameState, useDispatch } from './api';
import { StatusBar } from './components/StatusBar';
import { FortGrid } from './components/FortGrid';
import { LeadBoard } from './components/LeadBoard';
import { CaptivePanel } from './components/CaptivePanel';
import { MercPanel } from './components/MercPanel';
import { LogPanel } from './components/LogPanel';
import { BuildModal } from './components/BuildModal';
import { CaptiveActionModal } from './components/CaptiveActionModal';

export function App() {
  const { data: state, isLoading, error } = useGameState();
  const dispatch = useDispatch();
  const [buildCell, setBuildCell] = useState<number | null>(null);
  const [captiveActionId, setCaptiveActionId] = useState<string | null>(null);

  if (isLoading) return <div style={{ padding: 24 }}>loading…</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>error: {String(error)}</div>;
  if (!state) return null;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }} data-testid="app-root">
      <StatusBar state={state} onAdvanceDay={() => dispatch.mutate({ kind: 'advance-day' })} onExcavate={() => dispatch.mutate({ kind: 'excavate' })} busy={dispatch.isPending} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, padding: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, overflow: 'hidden' }}>
          <FortGrid
            state={state}
            onCellClick={(cellIdx) => setBuildCell(cellIdx)}
            onCaptiveDropToCell={(captiveId, cellIdx) => dispatch.mutate({ kind: 'place-captive', captiveId, cellIdx })}
            onCaptiveDropToOverflow={(captiveId) => dispatch.mutate({ kind: 'place-captive', captiveId, cellIdx: null })}
          />
          <LogPanel state={state} />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, overflow: 'hidden' }}>
          <LeadBoard state={state} />
          <CaptivePanel state={state} onAction={(captiveId) => setCaptiveActionId(captiveId)} />
        </div>
        <MercPanel state={state} />
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
    </div>
  );
}
