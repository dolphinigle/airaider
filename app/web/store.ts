// Zustand store — a thin reactive wrapper over the shared GameEngine. The engine
// mutates GameState in place; we bump a `tick` to trigger React re-renders. No game
// logic lives here — every action delegates to core/game.ts (same as the CLI).
import { create } from 'zustand';
import { GameEngine } from '../core/game.js';
import type { Quest } from '../core/types.js';
import type { QuestResult } from '../core/quest.js';

interface Store {
  eng: GameEngine | null;
  tick: number;
  busy: string | null;          // label of in-flight async work, or null
  results: QuestResult[] | null; // last end-day reveal
  error: string | null;
  init: (seed?: string) => Promise<void>;
  pursue: (leadId: string) => Promise<void>;
  assign: (questId: string, slot: number, mercId: string) => void;
  unassign: (questId: string, slot: number) => void;
  endDay: () => Promise<void>;
  dismissResults: () => void;
  act: (fn: (eng: GameEngine) => unknown) => void; // generic sync action + re-render
}

const key = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY;

export const useGame = create<Store>((set, get) => ({
  eng: null, tick: 0, busy: null, results: null, error: null,

  init: async (seed?: string) => {
    set({ busy: 'mustering the company…' });
    const eng = await GameEngine.create({ provider: key ? 'openai' : 'mock', apiKey: key, browser: true, seed });
    set({ eng, tick: 1, busy: null });
  },

  pursue: async (leadId: string) => {
    const eng = get().eng; if (!eng) return;
    set({ busy: 'a courier rides out…', error: null });
    const res = await eng.pursue(leadId);
    if (res && 'error' in res) set({ busy: null, error: res.error });
    else set((s) => ({ busy: null, tick: s.tick + 1 }));
  },

  assign: (questId, slot, mercId) => { const eng = get().eng; if (eng) { eng.assign(questId, slot, mercId); set((s) => ({ tick: s.tick + 1 })); } },
  unassign: (questId, slot) => { const eng = get().eng; if (eng) { eng.unassign(questId, slot); set((s) => ({ tick: s.tick + 1 })); } },

  endDay: async () => {
    const eng = get().eng; if (!eng) return;
    set({ busy: 'the day turns…', error: null });
    const results = await eng.endDay();
    set((s) => ({ busy: null, results, tick: s.tick + 1 }));
  },
  dismissResults: () => set({ results: null }),

  act: (fn) => { const eng = get().eng; if (eng) { fn(eng); set((s) => ({ tick: s.tick + 1 })); } },
}));

export type { Quest };
