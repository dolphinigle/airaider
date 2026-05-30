import type { GameState, ResolutionRecord } from '../types';

const BAND_COLOR: Record<ResolutionRecord['band'], string> = {
  'catastrophic-favorable': 'var(--legendary)',
  'favorable': 'var(--good)',
  'unfavorable': 'var(--rare)',
  'catastrophic': 'var(--danger)',
};
const BAND_LABEL: Record<ResolutionRecord['band'], string> = {
  'catastrophic-favorable': 'CRITICAL SUCCESS',
  'favorable': 'success',
  'unfavorable': 'partial / setback',
  'catastrophic': 'CATASTROPHE',
};

function ResolutionCard({ r }: { r: ResolutionRecord }) {
  return (
    <div data-testid={`resolution-${r.questId}`} style={{ padding: 12, marginBottom: 12, background: 'var(--panel-2)', borderRadius: 4, borderLeft: `4px solid ${BAND_COLOR[r.band]}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ color: BAND_COLOR[r.band] }}>{r.scenarioTitle}</strong>
        <span style={{ flex: 1 }} />
        <strong style={{ color: BAND_COLOR[r.band], textTransform: 'uppercase', fontSize: 11 }}>{BAND_LABEL[r.band]}</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
        roll: {r.rollFaces.join(' ')} → heads {r.heads}/{r.heads + r.tails} ({r.bandReason}) · coins {r.coinsActual}
      </div>
      <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45 }}>{r.outcomeNarrative}</p>
      {r.contributions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {r.contributions.map((c, i) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>
              <strong>{c.mercName}:</strong> <span style={{ color: 'var(--muted)' }}>{c.line}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 10, fontSize: 11 }}>
        <span style={{ color: r.goldAwarded > 0 ? 'var(--good)' : 'var(--muted)' }}>
          {r.goldAwarded > 0 ? `+${r.goldAwarded}g` : 'no payout'}
        </span>
        {r.casualties.length > 0 && (
          <span style={{ color: 'var(--danger)' }}>
            wounded: {r.casualties.map((c) => `${c.mercName} (-${c.damage}hp)`).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResolutionModal({ state, onClose }: { state: GameState; onClose: () => void }) {
  if (state.lastResolutions.length === 0) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
      }}
      data-testid="resolution-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)', padding: 20, borderRadius: 4, maxWidth: 720, width: '90%', maxHeight: '85vh', overflow: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 12px', color: 'var(--accent)' }}>
          DAY {state.dayCount} — RESOLUTIONS ({state.lastResolutions.length})
        </h3>
        {state.lastResolutions.map((r) => <ResolutionCard key={r.questId} r={r} />)}
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button data-testid="resolution-close" onClick={onClose} style={{ padding: '6px 16px' }}>continue to Day {state.dayCount}</button>
        </div>
      </div>
    </div>
  );
}
