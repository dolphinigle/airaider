import type { GameState, Merc } from '../types';
import { useDispatch } from '../api';

const RARITY_COLOR: Record<string, string> = {
  legendary: 'var(--legendary)', rare: 'var(--rare)', uncommon: 'var(--uncommon)', common: 'var(--common)',
};

function ApplicantCard({ a }: { a: Merc }) {
  const dispatch = useDispatch();
  const best = Math.max(...Object.values(a.attrs));
  const bestAttr = (Object.keys(a.attrs) as Array<keyof typeof a.attrs>).find((k) => a.attrs[k] === best);
  return (
    <div
      data-testid={`applicant-${a.id}`}
      style={{
        padding: 8,
        marginBottom: 8,
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 3,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
        <strong>⚔ {a.name}</strong>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>{(a as Merc & { archetype?: string }).archetype ?? 'wanderer'}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--accent)' }} title={`peak ${bestAttr}`}>peak {bestAttr}{best}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        {Object.entries(a.attrs).map(([k, v]) => `${k.slice(0, 3)}${v}`).join(' · ')}
        {' · '}wage {a.wage}g/day
      </div>
      {a.tags.length > 0 && (
        <div style={{ marginBottom: 4, fontSize: 11 }}>
          {a.tags.map((t) => (
            <span key={t.id} style={{ color: RARITY_COLOR[t.rarity], marginRight: 6 }}>{t.label}</span>
          ))}
        </div>
      )}
      {a.backstory && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 6 }}>
          "{a.backstory}"
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          data-testid={`accept-${a.id}`}
          disabled={dispatch.isPending}
          onClick={() => dispatch.mutate({ kind: 'accept-applicant', applicantId: a.id })}
          style={{ fontSize: 11, padding: '3px 10px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}
        >
          accept
        </button>
        <button
          data-testid={`dismiss-${a.id}`}
          disabled={dispatch.isPending}
          onClick={() => dispatch.mutate({ kind: 'dismiss-applicant', applicantId: a.id })}
          style={{ fontSize: 11, padding: '3px 10px' }}
        >
          dismiss
        </button>
      </div>
    </div>
  );
}

export function ApplicantsPanel({ state }: { state: GameState }) {
  if (state.applicants.length === 0) return null;
  return (
    <section
      data-testid="applicants-panel"
      style={{
        background: 'var(--panel)',
        padding: 12,
        borderRadius: 3,
        overflow: 'auto',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>
        AT THE GATE ({state.applicants.length}) — accept or dismiss
      </h3>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
        these came back with your party after a job — they want a place in the company.
      </div>
      {state.applicants.map((a) => (
        <ApplicantCard key={a.id} a={a} />
      ))}
    </section>
  );
}
