import { useState } from 'react';
import type { ChainView, ChainOutcome, Command, Merc } from '../types';

interface Props {
  chains: ChainView[];
  mercs: Merc[];
  busy: boolean;
  onCommand: (cmd: Command) => void;
}

const OUTCOME: Record<ChainOutcome, { glyph: string; color: string; label: string }> = {
  clean_win: { glyph: '✦', color: '#a4d39a', label: 'a clean victory' },
  narrow_win: { glyph: '✓', color: '#c8d39a', label: 'a narrow win' },
  partial_loss: { glyph: '◐', color: '#d3c39a', label: 'a costly setback' },
  failure: { glyph: '✗', color: '#d39a9a', label: 'a grim failure' },
};

const STAKES_COLOR: Record<string, string> = {
  uncommon: '#7ec07e',
  rare: '#7ea8d6',
  legendary: '#d6a85a',
};

export function QuestChainPanel({ chains, mercs, busy, onCommand }: Props) {
  const [party, setParty] = useState<Record<string, string[]>>({});

  const toggleMerc = (chainId: string, mercId: string) => {
    setParty((prev) => {
      const cur = prev[chainId] ?? [];
      const next = cur.includes(mercId) ? cur.filter((id) => id !== mercId) : [...cur, mercId];
      return { ...prev, [chainId]: next };
    });
  };

  const open = chains.filter((c) => c.status !== 'done' && c.status !== 'failed');
  const ended = chains.filter((c) => c.status === 'done' || c.status === 'failed');

  return (
    <div style={{ border: '1px solid #4a3f2a', padding: 12, borderRadius: 4, background: '#1f1a13', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold', color: '#d4c39a', letterSpacing: 1 }}>STORY CHAINS</span>
        <button
          onClick={() => onCommand({ kind: 'chain-new' })}
          disabled={busy || mercs.length < 2}
          title={mercs.length < 2 ? 'need at least 2 mercs to seed a story' : 'a new story stirs among your company'}
          style={btnStyle(busy || mercs.length < 2)}
        >
          ＋ begin a story
        </button>
      </div>

      {chains.length === 0 && (
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          no stories yet — begin one and your company writes its own legend
        </div>
      )}

      {open.map((c) => (
        <ChainCard key={c.id} chain={c} mercs={mercs} busy={busy} onCommand={onCommand}
          selected={party[c.id] ?? []} onToggleMerc={(mid) => toggleMerc(c.id, mid)} />
      ))}

      {ended.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: '#888' }}>closed sagas ({ended.length})</summary>
          <div style={{ marginTop: 6 }}>
            {ended.map((c) => (
              <ChainCard key={c.id} chain={c} mercs={mercs} busy={busy} onCommand={onCommand}
                selected={[]} onToggleMerc={() => {}} ended />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ChainCard({
  chain, mercs, busy, onCommand, selected, onToggleMerc, ended,
}: {
  chain: ChainView;
  mercs: Merc[];
  busy: boolean;
  onCommand: (cmd: Command) => void;
  selected: string[];
  onToggleMerc: (mercId: string) => void;
  ended?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px dotted #3a3020', opacity: ended ? 0.75 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: STAKES_COLOR[chain.stakes] ?? '#ccc', fontWeight: 'bold' }}>{chain.title}</span>
        <span style={{ fontSize: 11, color: '#8a7a55' }}>
          {chain.stakes} · {chain.step}/{chain.target}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#bdb08a', marginTop: 4, fontStyle: 'italic' }}>{chain.leadBlurb}</div>

      {chain.knownToPlayer.length > 0 && (
        <div style={{ fontSize: 11, color: '#9a8f6a', marginTop: 6, paddingLeft: 8, borderLeft: '2px solid #4a3f2a' }}>
          <div style={{ color: '#7a6f4a', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }}>WHAT YOU'VE PIECED TOGETHER</div>
          {chain.knownToPlayer.map((k, i) => <div key={i} style={{ marginTop: 2 }}>— {k}</div>)}
        </div>
      )}

      {chain.log.map((e) => {
        const o = OUTCOME[e.outcome];
        return (
          <div key={e.step} style={{ marginTop: 8, paddingLeft: 8, borderLeft: `2px solid ${o.color}` }}>
            <div style={{ fontSize: 11, color: o.color, fontWeight: 'bold' }}>
              {o.glyph} Chapter {e.step}: {e.questTitle} · {o.label} · +{e.gold}g
            </div>
            <div style={{ fontSize: 11, color: '#8a8060', marginTop: 1 }}>sent: {e.party} (fit {e.fit}/6)</div>
            <div style={{ fontSize: 12, color: '#cbbf9a', marginTop: 3, whiteSpace: 'pre-wrap' }}>{e.prose}</div>
          </div>
        );
      })}

      {chain.status === 'awaiting-offer' && (
        <button onClick={() => onCommand({ kind: 'chain-offer', chainId: chain.id })} disabled={busy}
          style={{ ...btnStyle(busy), marginTop: 8 }}>
          summon the next chapter →
        </button>
      )}

      {chain.status === 'awaiting-assign' && chain.openQuest && (
        <div style={{ marginTop: 8, padding: 8, border: '1px solid #4a3f2a', borderRadius: 4, background: '#262017' }}>
          <div style={{ fontSize: 12, color: '#e0d3a0', fontWeight: 'bold' }}>{chain.openQuest.questTitle}</div>
          <div style={{ fontSize: 12, color: '#cbbf9a', marginTop: 4, whiteSpace: 'pre-wrap' }}>{chain.openQuest.card}</div>
          <div style={{ fontSize: 11, color: '#9a8f6a', marginTop: 6 }}>
            {chain.openQuest.fictionalReason && <div style={{ fontStyle: 'italic' }}>{chain.openQuest.fictionalReason}</div>}
            <div style={{ marginTop: 2 }}>
              the work calls for{' '}
              {[...chain.openQuest.desiredStats, ...chain.openQuest.desiredTraits].join(', ') || 'whoever you can spare'}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {mercs.map((m) => {
              const on = selected.includes(m.id);
              return (
                <button key={m.id} onClick={() => onToggleMerc(m.id)} disabled={busy} style={chipStyle(on, busy)}>
                  {m.name}
                </button>
              );
            })}
          </div>
          <button onClick={() => onCommand({ kind: 'chain-resolve', chainId: chain.id, mercIds: selected })} disabled={busy}
            style={{ ...btnStyle(busy), marginTop: 8 }}>
            send {selected.length ? `${selected.length} out` : 'no one'} →
          </button>
        </div>
      )}

      {chain.pendingRecruit && (
        <div style={{ marginTop: 8, padding: 8, border: '1px solid #5a4a2a', borderRadius: 4, background: '#2a2417' }}>
          <div style={{ fontSize: 12, color: '#e0c98a' }}>
            ✦ <b>{chain.pendingRecruit.name}</b> steps forward, asking to join your company.
          </div>
          <div style={{ fontSize: 11, color: '#bda87a', marginTop: 3, fontStyle: 'italic' }}>{chain.pendingRecruit.background}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={() => onCommand({ kind: 'chain-recruit', chainId: chain.id, accept: true })} disabled={busy}
              style={btnStyle(busy)}>welcome them</button>
            <button onClick={() => onCommand({ kind: 'chain-recruit', chainId: chain.id, accept: false })} disabled={busy}
              style={btnStyle(busy)}>turn them away</button>
          </div>
        </div>
      )}

      {(chain.status === 'done' || chain.status === 'failed') && (
        <div style={{ fontSize: 11, marginTop: 6, color: chain.status === 'failed' ? '#d39a9a' : '#a4d39a', fontStyle: 'italic' }}>
          {chain.status === 'failed' ? '✗ the saga closes on a grim note.' : '✓ the saga reaches its end.'}
        </div>
      )}
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#2a2418' : '#3a3220',
    color: disabled ? '#6a6045' : '#e0d3a0',
    border: '1px solid #4a3f2a',
    borderRadius: 3,
    padding: '3px 10px',
    fontSize: 12,
    cursor: disabled ? 'default' : 'pointer',
  };
}

function chipStyle(on: boolean, disabled: boolean): React.CSSProperties {
  return {
    background: on ? '#4a5a3a' : '#2a2418',
    color: on ? '#d4e0a0' : '#9a8f6a',
    border: `1px solid ${on ? '#6a8a4a' : '#4a3f2a'}`,
    borderRadius: 3,
    padding: '2px 8px',
    fontSize: 11,
    cursor: disabled ? 'default' : 'pointer',
  };
}
