/**
 * TanStack Query hooks for TimerEventos (read-only projection endpoints).
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { EmpresaArraySchema, EventoActualArraySchema } from '../types/models';

export const EMPRESAS_TIMERS_KEY = ['empresasTimers'] as const;

export const eventosEmpresaKey = (id: number) => ['eventosEmpresa', id] as const;
export const eventosActualesEmpresaKey = (id: number) =>
  ['eventosActualesEmpresa', id] as const;
export const eventosSalaKey = (id: number) => ['eventosSala', id] as const;

// ---------------------------------------------------------------------------
// Empresas that have timers assigned
// ---------------------------------------------------------------------------

export function useEmpresasTimers() {
  return useQuery({
    queryKey: EMPRESAS_TIMERS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/timereventos/empresastimers');
      return EmpresaArraySchema.parse(data);
    },
    staleTime: 5_000,
  });
}

// ---------------------------------------------------------------------------
// All events for an empresa
// ---------------------------------------------------------------------------

export function useEventosEmpresa(idEmpresa: number | null) {
  return useQuery({
    queryKey: eventosEmpresaKey(idEmpresa ?? 0),
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>(
        `api/timereventos/eventosempresa/${idEmpresa}`
      );
      return EventoActualArraySchema.parse(data);
    },
    enabled: idEmpresa !== null,
    staleTime: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Current and upcoming events for an empresa
// ---------------------------------------------------------------------------

export function useEventosActualesEmpresa(idEmpresa: number | null) {
  return useQuery({
    queryKey: eventosActualesEmpresaKey(idEmpresa ?? 0),
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>(
        `api/timereventos/eventosactualesempresa/${idEmpresa}`
      );
      return EventoActualArraySchema.parse(data);
    },
    enabled: idEmpresa !== null,
    staleTime: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Events for a sala
// ---------------------------------------------------------------------------

export function useEventosSala(idSala: number | null) {
  return useQuery({
    queryKey: eventosSalaKey(idSala ?? 0),
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>(
        `api/timereventos/eventossala/${idSala}`
      );
      return EventoActualArraySchema.parse(data);
    },
    enabled: idSala !== null,
    staleTime: 5_000,
  });
}
