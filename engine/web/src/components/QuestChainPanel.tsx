import type { QuestChainView } from '../types';

interface Props {
  chains: QuestChainView[];
}

const STATUS_COLOR: Record<string, string> = {
  active: '#d1c39a',
  completed: '#a4d39a',
  failed: '#d39a9a',
  abandoned: '#888',
};

const RARITY_COLOR: Record<string, string> = {
  common: '#aaa',
  uncommon: '#7ec07e',
  rare: '#7ea8d6',
  legendary: '#d6a85a',
};

export function QuestChainPanel({ chains }: Props) {
  if (chains.length === 0) return null;
  const active = chains.filter((c) => c.status === 'active');
  const ended = chains.filter((c) => c.status !== 'active');

  return (
    <div style={{
      border: '1px solid #4a3f2a',
      padding: 12,
      borderRadius: 4,
      background: '#1f1a13',
    }}>
      <div style={{ fontWeight: 'bold', color: '#d4c39a', marginBottom: 8, letterSpacing: 1 }}>
        SAGAS
      </div>
      {active.length === 0 && ended.length === 0 && (
        <div style={{ color: '#888', fontStyle: 'italic' }}>no sagas yet — pursue a rare lead to begin one</div>
      )}
      {active.map((c) => <ChainCard key={c.id} chain={c} />)}
      {ended.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: '#888' }}>
            ended sagas ({ended.length})
          </summary>
          <div style={{ marginTop: 6 }}>
            {ended.map((c) => <ChainCard key={c.id} chain={c} ended />)}
          </div>
        </details>
      )}
    </div>
  );
}

function ChainCard({ chain, ended }: { chain: QuestChainView; ended?: boolean }) {
  const stepDots = Array.from({ length: chain.totalSteps }, (_, i) => {
    const s = chain.steps[i];
    if (!s) return '·';
    if (s.status === 'resolved-favorable' || s.status === 'resolved-catastrophic-favorable') return '●';
    if (s.status === 'resolved-unfavorable') return '◐';
    if (s.status === 'resolved-catastrophic') return '✗';
    if (s.status === 'active') return '○';
    return '·';
  }).join(' ');
  return (
    <div style={{
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: '1px dotted #3a3020',
      opacity: ended ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: RARITY_COLOR[chain.chainRarity], fontWeight: 'bold' }}>
          {chain.title}
        </span>
        <span style={{ fontSize: 11, color: STATUS_COLOR[chain.status] }}>
          {chain.status} · {chain.kind}{chain.unitName ? ` · ${chain.unitName}` : ''}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#ccc', marginTop: 2, fontStyle: 'italic' }}>
        {chain.hook}
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 4, fontFamily: 'monospace' }}>
        {stepDots}  ({chain.currentStepIdx + (chain.status === 'active' ? 0 : 1)}/{chain.totalSteps})
        {' · '}{chain.region}
      </div>
      {ended && chain.epilogue && (
        <div style={{ fontSize: 12, color: '#bda87a', marginTop: 6, paddingLeft: 8, borderLeft: '2px solid #5a4a2a' }}>
          {chain.epilogue}
        </div>
      )}
    </div>
  );
}
