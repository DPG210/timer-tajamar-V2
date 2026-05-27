/**
 * useCurrentActiveTimer — calculates the currently active timer from REST data.
 *
 * Used as a fallback in TimerView when the socket has not yet emitted a timerID
 * (e.g. on initial page load while an event is already running).
 *
 * The socket value takes precedence; this hook only provides the initial value.
 *
 * IMPORTANT: comparison is time-of-day only (minutes from midnight), NOT full
 * datetime. The `inicio` field often carries a historical date (e.g. 2024-06-01)
 * that does not match today, but the HH:mm schedule is always current.
 *
 * Timezone: pinned to Europe/Madrid via Intl.DateTimeFormat (nowMadridMinutes).
 * The browser OS clock is NOT consulted for timezone offset — the IANA tzdata
 * bundled with the browser engine is used instead. DST (CET↔CEST) is handled
 * automatically.
 */

import { useMemo } from 'react';
import { useTimers } from './useTimers';
import { useCategorias } from './useCategorias';
import { parseInicio } from '../utils/time';
import { nowMadridMinutes } from '../utils/timezone';

export function useCurrentActiveTimer(): number | null {
  const { data: timers = [] } = useTimers();
  const { data: categorias = [] } = useCategorias();

  return useMemo(() => {
    // Minutes elapsed since midnight in Europe/Madrid — explicit timezone,
    // immune to browser OS clock offset.
    const nowMinutes = nowMadridMinutes();

    for (const timer of timers) {
      const categoria = categorias.find((c) => c.idCategoria === timer.idCategoria);
      if (!categoria) continue;

      const { hours, minutes } = parseInicio(timer.inicio);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + categoria.duracion;

      if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
        return timer.idTemporizador;
      }
    }
    return null;
  }, [timers, categorias]);
}
