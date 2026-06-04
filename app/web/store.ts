// Zustand store — a thin reactive wrapper over the shared GameEngine. The engine
// mutates GameState in place; we bump a `tick` to trigger React re-renders. No game
// logic lives here — every action delegates to core/game.ts (same as the CLI).
// AUTOSAVE: GameState is plain serializable data, so we persist it to localStorage after
// every action and restore on load — an accidental refresh never nukes a playthrough.
import { create } from 'zustand';
import { GameEngine } from '../core/game.js';
import { makeNarrator, type AICallRecord, type Narrator } from '../core/ai.js';
import { initGame } from '../core/state.js';
import { stockLeadBoard } from '../core/leads.js';
import { rngFrom } from '../core/rng.js';
import type { Quest, GameState } from '../core/types.js';
import type { QuestResult } from '../core/quest.js';

const SAVE_KEY = 'airaider-save-v1';
function saveState(eng: GameEngine | null) {
  try { if (eng) localStorage.setItem(SAVE_KEY, JSON.stringify(eng.state)); } catch { /* quota/unavailable */ }
}
function loadState(): GameState | null {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (!s) return null;
    const st = JSON.parse(s) as GameState;
    // shape-guard: discard a corrupt or schema-stale save rather than crash on restore
    const ok = st && st.cards && st.cells && st.leads && Array.isArray(st.pendingMainChains) && typeof st.cycle === 'number';
    return ok ? st : null;
  } catch { return null; }
}

interface Store {
  eng: GameEngine | null;
  provider: 'openai' | 'mock';
  aiLog: AICallRecord[];
  tick: number;
  busy: string | null;          // label of in-flight async work, or null
  results: QuestResult[] | null; // last end-day reveal
  error: string | null;
  restored: boolean;            // did we load a saved game?
  init: (seed?: string) => Promise<void>;
  newGame: () => Promise<void>;
  pursue: (leadId: string) => Promise<void>;
  assign: (questId: string, slot: number, mercId: string) => void;
  unassign: (questId: string, slot: number) => void;
  endDay: () => Promise<void>;
  dismissResults: () => void;
  act: (fn: (eng: GameEngine) => unknown) => void; // generic sync action + re-render
}

const key = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY;

async function buildNarrator(onCall: (rec: AICallRecord) => void): Promise<Narrator> {
  return makeNarrator({ provider: key ? 'openai' : 'mock', apiKey: key, browser: true, onCall });
}

export const useGame = create<Store>((set, get) => {
  const onCall = (rec: AICallRecord) => { const log = get().aiLog; log.push(rec); set({ aiLog: log, tick: get().tick + 1 }); };
  const persist = () => saveState(get().eng);

  return {
    eng: null, provider: key ? 'openai' : 'mock', aiLog: [], tick: 0, busy: null, results: null, error: null, restored: false,

    init: async (seed?: string) => {
      set({ busy: 'mustering the company…' });
      const ai = await buildNarrator(onCall);
      const saved = loadState();
      let eng: GameEngine; let restored = false;
      if (saved) { eng = new GameEngine(saved, ai); restored = true; }   // resume the saved playthrough
      else { const state = initGame(seed); eng = new GameEngine(state, ai); stockLeadBoard(state, rngFrom(`${state.seed}:board:${state.cycle}`)); }
      set({ eng, provider: key ? 'openai' : 'mock', tick: 1, busy: null, restored });
      persist();
    },

    newGame: async () => {
      try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
      set({ eng: null, aiLog: [], results: null, error: null, restored: false });
      await get().init();
    },

    pursue: async (leadId: string) => {
      const eng = get().eng; if (!eng) return;
      set({ busy: 'a courier rides out…', error: null });
      const res = await eng.pursue(leadId);
      if (res && 'error' in res) set({ busy: null, error: res.error });
      else set((s) => ({ busy: null, tick: s.tick + 1 }));
      persist();
    },

    assign: (questId, slot, mercId) => { const eng = get().eng; if (eng) { eng.assign(questId, slot, mercId); set((s) => ({ tick: s.tick + 1 })); persist(); } },
    unassign: (questId, slot) => { const eng = get().eng; if (eng) { eng.unassign(questId, slot); set((s) => ({ tick: s.tick + 1 })); persist(); } },

    endDay: async () => {
      const eng = get().eng; if (!eng) return;
      set({ busy: 'the day turns…', error: null });
      const results = await eng.endDay();
      set((s) => ({ busy: null, results, tick: s.tick + 1 }));
      persist();
    },
    dismissResults: () => set({ results: null }),

    act: (fn) => {
      const eng = get().eng; if (!eng) return;
      const res = fn(eng) as { error?: string } | undefined;
      set((s) => ({ tick: s.tick + 1, error: res && typeof res === 'object' && 'error' in res ? res.error ?? null : null }));
      persist();
    },
  };
});

export type { Quest };
