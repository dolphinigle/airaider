import type { GameState } from '../types';

const ATTR_LABEL: Record<string, string> = {
  physical: 'Physical', agility: 'Agility', intelligence: 'Intelligence', charisma: 'Charisma', willpower: 'Willpower',
};
const SCORE_WORD = ['', 'Poor', 'Below Avg', 'Average', 'Above Avg', 'Strong', 'Exceptional', 'Peerless'];

export function MercDetailDrawer({ state, mercId, onClose }: { state: GameState; mercId: string; onClose: () => void }) {
  const merc = state.mercs.find((m) => m.id === mercId);
  if (!merc) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 20,
      }}
      data-testid="merc-detail-drawer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360, background: 'var(--panel)', borderLeft: '1px solid var(--border)', padding: 16, overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>{merc.name}</h3>
          <span style={{ color: 'var(--muted)' }}>{merc.archetype}</span>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ fontSize: 11 }}>×</button>
        </div>
        {merc.gender && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{merc.gender}</div>}

        <h4 style={{ margin: '12px 0 4px', color: 'var(--accent)', fontSize: 11 }}>ATTRIBUTES</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 4, fontSize: 12 }}>
          {Object.entries(merc.attrs).map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <span>{ATTR_LABEL[k] ?? k}</span>
              <span style={{ textAlign: 'right', fontWeight: 'bold' }}>{v}</span>
              <span style={{ textAlign: 'right', color: 'var(--muted)' }}>{SCORE_WORD[v as number] ?? ''}</span>
            </div>
          ))}
        </div>

        <h4 style={{ margin: '12px 0 4px', color: 'var(--accent)', fontSize: 11 }}>CONDITION</h4>
        <div style={{ fontSize: 12 }}>
          hp {merc.hp - merc.hpDamage}/{merc.hp} · fatigue {merc.fatigue} · {merc.tier} · {merc.wage}g/wk
        </div>

        {merc.tags.length > 0 && (
          <>
            <h4 style={{ margin: '12px 0 4px', color: 'var(--accent)', fontSize: 11 }}>TAGS</h4>
            {merc.tags.map((t) => (
              <div key={t.id} style={{ padding: 4, marginBottom: 3, background: 'var(--panel-2)', borderRadius: 3, fontSize: 12 }}>
                <strong style={{ color: `var(--${t.rarity})` }}>{t.label}</strong>
                <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 10 }}>
                  {t.category} · {t.rarity} · T{t.tier}
                </span>
              </div>
            ))}
          </>
        )}

        {merc.backstory && (
          <>
            <h4 style={{ margin: '12px 0 4px', color: 'var(--accent)', fontSize: 11 }}>BACKSTORY</h4>
            <div style={{ fontSize: 12, lineHeight: 1.45, fontStyle: 'italic', color: 'var(--muted)' }}>
              {merc.backstory}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
