import type { GameState } from '../types';

type Action = 'ransom' | 'sell' | 'display' | 'recruit' | 'execute';

export function CaptiveActionModal({ state, captiveId, onClose, onAction }: {
  state: GameState;
  captiveId: string;
  onClose: () => void;
  onAction: (action: Action) => void;
}) {
  const onAct = onAction;
  const captive = state.captives.find((c) => c.id === captiveId);
  if (!captive) return null;

  const chapel = captive.cellEffects.chapelAdjacent;
  const smithy = captive.cellEffects.smithyAdjacent;
  const ransomGold = 5 + (smithy ? 5 : 0);
  const recruitCost = chapel ? 0 : 10;

  const actions: { kind: Action; label: string; detail: string }[] = [
    { kind: 'ransom', label: 'ransom', detail: `~${ransomGold}g over 5 days${smithy ? ' (smithy-adj +5g)' : ''}` },
    { kind: 'sell', label: 'sell', detail: '~3g now (slaver)' },
    { kind: 'display', label: 'display on pikes', detail: '+1 prestige (notoriety burn)' },
    { kind: 'recruit', label: 'recruit', detail: `costs ${recruitCost}g${chapel ? ' (chapel-adj free!)' : ''}` },
    { kind: 'execute', label: 'execute', detail: 'free slot, no payout' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
    }} data-testid="captive-action-modal">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--panel)', padding: 20, borderRadius: 4, maxWidth: 500,
      }}>
        <h3 style={{ margin: '0 0 12px', color: 'var(--accent)' }}>{captive.name} ({captive.archetype})</h3>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          notoriety {captive.notoriety}. {captive.cellIdx === undefined ? 'in overflow corner.' : `in cell ${captive.cellIdx}.`}
        </div>
        {actions.map((a) => (
          <div key={a.kind} style={{ padding: 6, marginBottom: 4, background: 'var(--panel-2)', borderRadius: 3, display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <strong style={{ minWidth: 130 }}>{a.label}</strong>
            <span style={{ flex: 1, fontSize: 11, color: 'var(--muted)' }}>{a.detail}</span>
            <button data-testid={`act-${a.kind}`} onClick={() => onAct(a.kind)}>do it</button>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 8 }}>cancel</button>
      </div>
    </div>
  );
}
