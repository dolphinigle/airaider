import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Command, GameState, RoomDef } from './types';

export function useGameState() {
  return useQuery({
    queryKey: ['state'],
    queryFn: async (): Promise<GameState> => {
      const r = await fetch('/api/state');
      if (!r.ok) throw new Error(`state: ${r.status}`);
      const j = await r.json();
      return j.state;
    },
  });
}

export function useRoomCatalog() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async (): Promise<RoomDef[]> => {
      const r = await fetch('/api/catalog/rooms');
      if (!r.ok) throw new Error(`catalog: ${r.status}`);
      const j = await r.json();
      return j.rooms;
    },
    staleTime: Infinity,
  });
}

export function useDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cmd: Command) => {
      const r = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `cmd ${cmd.kind} failed`);
      return j;
    },
    onSuccess: (data) => {
      if (data.state) qc.setQueryData(['state'], data.state);
    },
  });
}
