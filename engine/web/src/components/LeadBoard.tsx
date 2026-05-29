import type { GameState } from '../types';

const RARITY_GLYPH: Record<string, string> = { legendary: '✨', rare: '★', uncommon: '✦', common: '·' };
const RARITY_COLOR: Record<string, string> = {
  legendary: 'var(--legendary)', rare: 'var(--rare)', uncommon: 'var(--uncommon)', common: 'var(--common)',
};

export function LeadBoard({ state, onPursue }: { state: GameState; onPursue: (leadId: string) => void }) {
  return (
    <section data-testid="lead-board" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>LEAD BOARD (day {state.dayCount})</h3>
      {state.leadBoard.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>build a Scouting Post + advance a day to see leads</div>}
      {state.leadBoard.map((lead) => {
        const days = Math.max(0, lead.expiryDay - state.dayCount);
        const canAfford = state.gold >= lead.pursueCost;
        return (
          <div key={lead.id} data-testid={`lead-${lead.id}`} style={{
            padding: 6, marginBottom: 6, background: 'var(--panel-2)', borderRadius: 3,
            borderLeft: `3px solid ${RARITY_COLOR[lead.rarity]}`,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ color: RARITY_COLOR[lead.rarity], fontSize: 14 }}>{RARITY_GLYPH[lead.rarity]}</span>
              <strong style={{ color: RARITY_COLOR[lead.rarity], textTransform: lead.rarity === 'legendary' ? 'uppercase' : 'none' }}>{lead.rarity}</strong>
              <span>{lead.archetype} — {lead.region}</span>
              <span style={{ flex: 1 }} />
              <span>DC{lead.dc}</span>
              <span>+{lead.rewardGold}g</span>
              <span>cost {lead.pursueCost}g</span>
              <span style={{ color: days <= 1 ? 'var(--danger)' : 'var(--muted)' }}>{days}d</span>
              <button
                data-testid={`pursue-${lead.id}`}
                disabled={!canAfford || state.mercs.length === 0}
                onClick={() => onPursue(lead.id)}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                pursue
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>"{lead.blurb}"</div>
          </div>
        );
      })}
    </section>
  );
}

