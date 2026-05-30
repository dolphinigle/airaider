import type { GameState } from '../types';

const RARITY_GLYPH: Record<string, string> = { legendary: '✨', rare: '★', uncommon: '✦', common: '·' };
const RARITY_COLOR: Record<string, string> = {
  legendary: 'var(--legendary)', rare: 'var(--rare)', uncommon: 'var(--uncommon)', common: 'var(--common)',
};

export function LeadBoard({ state, onPursue, onRefresh }: { state: GameState; onPursue: (leadId: string) => void; onRefresh: () => void }) {
  const hasScoutingPost = state.fort.placedRooms.some((p) => p.roomId === 'scouting-post');
  return (
    <section data-testid="lead-board" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px' }}>
        <h3 style={{ margin: 0, fontSize: 13, color: 'var(--accent)', flex: 1 }}>LEAD BOARD (day {state.dayCount})</h3>
        <button
          data-testid="refresh-leads"
          disabled={!hasScoutingPost}
          onClick={onRefresh}
          title={hasScoutingPost ? 'refresh the lead board (1 AI call per new lead)' : 'build a Scouting Post first'}
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          refresh leads
        </button>
      </div>
      {state.leadBoard.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>build a Scouting Post and tap "refresh leads" to see fresh leads</div>}
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
                disabled={!canAfford}
                onClick={() => onPursue(lead.id)}
                title={!canAfford ? `need ${lead.pursueCost}g` : 'pursue — generates a quest for the Quest Board'}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                pursue
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
              {lead.chainStepRef && (
                <span style={{ color: '#d6a85a', fontStyle: 'normal', marginRight: 4 }}>
                  ⛓ [{lead.chainStepRef.chainTitle}]
                </span>
              )}
              "{lead.blurb}"
            </div>
          </div>
        );
      })}
    </section>
  );
}

