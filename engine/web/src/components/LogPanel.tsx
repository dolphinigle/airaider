import { useState } from 'react';
import type { GameState, LLMLogEntry } from '../types';

function LLMEntry({ e }: { e: LLMLogEntry }) {
  const [open, setOpen] = useState(false);
  const time = new Date(e.ts).toLocaleTimeString();
  let parsedResponse = e.response;
  try {
    const j = JSON.parse(e.response);
    if (typeof j === 'object' && j !== null) parsedResponse = JSON.stringify(j, null, 2);
  } catch { /* leave raw */ }
  return (
    <div style={{ marginBottom: 4, border: '1px solid var(--border)', borderRadius: 3, background: 'var(--panel-2)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '4px 6px', cursor: 'pointer', display: 'flex', gap: 6, fontSize: 11, alignItems: 'baseline' }}
        data-testid={`llm-entry-${e.ts}`}
      >
        <span style={{ color: 'var(--muted)' }}>{open ? '▼' : '▶'}</span>
        <span style={{ color: 'var(--accent)' }}>{e.kind}</span>
        <span style={{ color: 'var(--muted)' }}>{time}</span>
        {e.elapsedMs !== undefined && <span style={{ color: 'var(--muted)' }}>{e.elapsedMs}ms</span>}
        <span style={{ flex: 1, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label ?? ''}</span>
      </div>
      {open && (
        <div style={{ padding: 6, borderTop: '1px solid var(--border)', fontSize: 10 }}>
          <div style={{ color: 'var(--muted)' }}>model: {e.model}</div>
          <details style={{ marginTop: 4 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>system prompt ({e.systemPrompt.length} chars)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--panel)', padding: 4, margin: '2px 0', maxHeight: 200, overflow: 'auto' }}>{e.systemPrompt}</pre>
          </details>
          <details style={{ marginTop: 4 }} open>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>user prompt</summary>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--panel)', padding: 4, margin: '2px 0', maxHeight: 200, overflow: 'auto' }}>{e.userPrompt}</pre>
          </details>
          <details style={{ marginTop: 4 }} open>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>response</summary>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--panel)', padding: 4, margin: '2px 0', maxHeight: 200, overflow: 'auto' }}>{parsedResponse}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export function LogPanel({ state }: { state: GameState }) {
  const [showAI, setShowAI] = useState(true);
  const llmLog = state.llmLog ?? [];
  return (
    <section data-testid="log-panel" style={{ background: 'var(--panel)', padding: 12, borderRadius: 3, overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)' }}>FORT LOG</h3>
      {state.fortLog.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>nothing recorded yet.</div>}
      <pre style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap', margin: 0 }}>
        {state.fortLog.slice().reverse().map((e) => `d${e.day}  ${e.message}`).join('\n')}
      </pre>
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div
          onClick={() => setShowAI(!showAI)}
          style={{ cursor: 'pointer', fontSize: 12, color: 'var(--accent)', display: 'flex', gap: 6, alignItems: 'baseline' }}
        >
          <span>{showAI ? '▼' : '▶'}</span>
          <strong>AI CALLS ({llmLog.length})</strong>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>most recent first · click to expand</span>
        </div>
        {showAI && (
          <div style={{ marginTop: 6 }}>
            {llmLog.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 11, fontStyle: 'italic' }}>no AI calls yet (set OPENAI_API_KEY and end a day)</div>}
            {llmLog.slice().reverse().map((e) => <LLMEntry key={e.ts} e={e} />)}
          </div>
        )}
      </div>
    </section>
  );
}
