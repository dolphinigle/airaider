import { useState } from 'react';
import type { GameState, LLMLogEntry } from '../types';

/** OpenAI pricing per 1M tokens (USD), as of 2025-Q1. Update if rates change.
 *  Cached input is roughly 0.25x of standard input for most models. */
const MODEL_PRICES: Record<string, { in: number; out: number; cached: number }> = {
  'gpt-4.1-nano':   { in: 0.10, out: 0.40, cached: 0.025 },
  'gpt-4.1-mini':   { in: 0.40, out: 1.60, cached: 0.10  },
  'gpt-4.1':        { in: 2.00, out: 8.00, cached: 0.50  },
  'gpt-4o-mini':    { in: 0.15, out: 0.60, cached: 0.075 },
  'gpt-4o':         { in: 2.50, out: 10.0, cached: 1.25  },
};

function estimateCostUsd(e: LLMLogEntry): number | null {
  const price = MODEL_PRICES[e.model];
  if (!price) return null;
  if (e.promptTokens === undefined || e.completionTokens === undefined) return null;
  const cached = e.cachedPromptTokens ?? 0;
  const uncached = Math.max(0, e.promptTokens - cached);
  const cost =
    (uncached / 1_000_000) * price.in +
    (cached / 1_000_000) * price.cached +
    (e.completionTokens / 1_000_000) * price.out;
  return cost;
}

function fmtUsd(n: number | null): string {
  if (n === null) return '$?';
  if (n < 0.0001) return `$${n.toFixed(7)}`;
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

function LLMEntry({ e }: { e: LLMLogEntry }) {
  const [open, setOpen] = useState(false);
  const time = new Date(e.ts).toLocaleTimeString();
  let parsedResponse = e.response;
  try {
    const j = JSON.parse(e.response);
    if (typeof j === 'object' && j !== null) parsedResponse = JSON.stringify(j, null, 2);
  } catch { /* leave raw */ }
  const cost = estimateCostUsd(e);
  const cachedHit = e.cachedPromptTokens && e.cachedPromptTokens > 0;
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
        <span style={{ color: cachedHit ? 'var(--good)' : 'var(--accent)' }} title={cachedHit ? 'cached-prompt discount applied' : 'standard pricing'}>{fmtUsd(cost)}</span>
        {e.promptTokens !== undefined && (
          <span style={{ color: 'var(--muted)' }} title="input (cached) / output tokens">
            {e.promptTokens}{cachedHit ? `(${e.cachedPromptTokens}c)` : ''}/{e.completionTokens}t
          </span>
        )}
        <span style={{ flex: 1, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label ?? ''}</span>
      </div>
      {open && (
        <div style={{ padding: 6, borderTop: '1px solid var(--border)', fontSize: 10 }}>
          <div style={{ color: 'var(--muted)' }}>
            model: {e.model}
            {e.promptTokens !== undefined && (
              <> · in: {e.promptTokens}{cachedHit ? ` (${e.cachedPromptTokens} cached)` : ''} · out: {e.completionTokens} · est: {fmtUsd(cost)}</>
            )}
          </div>
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
  const totalCost = llmLog.reduce((acc, e) => acc + (estimateCostUsd(e) ?? 0), 0);
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
          {llmLog.length > 0 && <span style={{ color: 'var(--good)' }} title="cumulative estimated cost across visible calls">{fmtUsd(totalCost)} total</span>}
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>· click to expand</span>
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
