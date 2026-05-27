/**
 * Hook that wires the socket singleton to TanStack Query cache invalidation.
 *
 * On "timerID" event:
 *   - Updates local state with the active timer ID
 *   - Invalidates the TES query so components get fresh data (resolves M-06)
 *
 * NOTE: the "envio" event (backend countdown) is intentionally NOT handled here.
 * The backend counts from when "vamos" was pressed, not from the scheduled inicio,
 * making it unreliable as a display source. Remaining time is now calculated
 * client-side in useCalculatedRemainingSeconds from inicio + duracion.
 *
 * Cleanup on unmount removes listeners — prevents double-registration (M-03).
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../socket';
import { TES_KEY } from './useTES';

interface TimerSocketState {
  activeTimerId: number | null;
  isConnected: boolean;
}

export function useTimerSocket(): TimerSocketState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<TimerSocketState>({
    activeTimerId: null,
    isConnected: socket.connected,
  });

  useEffect(() => {
    function onConnect() {
      setState((prev) => ({ ...prev, isConnected: true }));
    }

    function onDisconnect() {
      setState((prev) => ({ ...prev, isConnected: false }));
    }

    function onTimerId(idTimer: number) {
      setState((prev) => ({ ...prev, activeTimerId: idTimer }));
      // Single TES fetch per timerID event — all consumers share the cache (M-06)
      void queryClient.invalidateQueries({ queryKey: TES_KEY });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('timerID', onTimerId);

    // Return cleanup to avoid duplicate listeners on re-render (M-03)
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('timerID', onTimerId);
    };
  }, [queryClient]);

  return state;
}
