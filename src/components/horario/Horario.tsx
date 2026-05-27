/**
 * Horario — schedule table view.
 * Migrated from Horario.js (class component).
 *
 * Resolves:
 *   M-07: TES operations are atomic (create/delete via hooks)
 *   M-10: functional component
 *   M-12: idEvento = 1 (known debt, documented)
 *
 * Table: rows = timers, columns = salas, cells = assigned empresa (or empty).
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useTimers } from '../../hooks/useTimers';
import { useSalas } from '../../hooks/useSalas';
import { useEmpresas } from '../../hooks/useEmpresas';
import { useCategorias, getCategoriaDuracion } from '../../hooks/useCategorias';
import { useTES, useCreateTES, useDeleteTES, findTESForTimerInSala } from '../../hooks/useTES';
import { useAuthStore } from '../../stores/authStore';
import { formatInicio, calcularFin } from '../../utils/time';

export function Horario() {
  const { data: timers = [], isLoading: loadingTimers } = useTimers();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: categorias = [] } = useCategorias();
  const { data: tesList = [] } = useTES();
  const createTES = useCreateTES();
  const deleteTES = useDeleteTES();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [selectedEmpresaMap, setSelectedEmpresaMap] = useState<Record<string, number>>({});

  const isLoading = loadingTimers || loadingSalas || loadingEmpresas;

  function getCellKey(idTimer: number, idSala: number) {
    return `${idTimer}-${idSala}`;
  }

  function getAssignedEmpresa(idTimer: number, idSala: number) {
    const tes = findTESForTimerInSala(tesList, idTimer, idSala);
    return tes ? empresas.find((e) => e.idEmpresa === tes.idEmpresa) : null;
  }

  async function handleAssign(idTimer: number, idSala: number) {
    const key = getCellKey(idTimer, idSala);
    const idEmpresa = selectedEmpresaMap[key];
    if (!idEmpresa) return;

    const existing = findTESForTimerInSala(tesList, idTimer, idSala);
    if (existing) {
      void Swal.fire('Ya asignado', 'Este slot ya tiene una empresa asignada. Elimínala primero.', 'info');
      return;
    }

    createTES.mutate(
      { idTimer, idEmpresa, idSala },
      { onError: () => void Swal.fire('Error', 'No se pudo crear la asignación.', 'error') }
    );
  }

  async function handleRemove(idTimer: number, idSala: number) {
    const tes = findTESForTimerInSala(tesList, idTimer, idSala);
    if (!tes) return;

    const result = await Swal.fire({
      title: 'Eliminar asignación',
      text: '¿Eliminar esta empresa de este slot?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;

    deleteTES.mutate(tes.id, {
      onError: () => void Swal.fire('Error', 'No se pudo eliminar la asignación.', 'error'),
    });
  }

  if (isLoading) return <div className="p-6 text-gray-500">Cargando horario…</div>;

  return (
    <div className="p-4 overflow-x-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Horario</h1>

      <div className="min-w-max">
        <table className="text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                Inicio / Fin
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                Categoría
              </th>
              {salas.map((sala) => (
                <th key={sala.idSala} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 whitespace-nowrap">
                  {sala.nombreSala}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timers.map((timer) => {
              const duracion = getCategoriaDuracion(categorias, timer.idCategoria) ?? 0;
              const fin = calcularFin(timer.inicio, duracion);
              return (
                <tr key={timer.idTemporizador} className="even:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                    {formatInicio(timer.inicio)} – {fin}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-gray-500">
                    {categorias.find((c) => c.idCategoria === timer.idCategoria)?.categoria ?? '—'}
                  </td>
                  {salas.map((sala) => {
                    const assigned = getAssignedEmpresa(timer.idTemporizador, sala.idSala);
                    const key = getCellKey(timer.idTemporizador, sala.idSala);
                    return (
                      <td key={sala.idSala} className="border border-gray-200 px-2 py-1 text-center min-w-[120px]">
                        {assigned ? (
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-gray-700 font-medium text-xs">{assigned.nombreEmpresa}</span>
                            {isAuthenticated && (
                              <button
                                type="button"
                                onClick={() => void handleRemove(timer.idTemporizador, sala.idSala)}
                                className="text-red-400 hover:text-red-600 text-xs"
                                aria-label={`Quitar ${assigned.nombreEmpresa} de ${sala.nombreSala}`}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : isAuthenticated ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={selectedEmpresaMap[key] ?? ''}
                              onChange={(e) =>
                                setSelectedEmpresaMap((prev) => ({
                                  ...prev,
                                  [key]: Number(e.target.value),
                                }))
                              }
                              className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
                              aria-label={`Seleccionar empresa para ${sala.nombreSala}`}
                            >
                              <option value="">—</option>
                              {empresas.map((e) => (
                                <option key={e.idEmpresa} value={e.idEmpresa}>
                                  {e.nombreEmpresa}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => void handleAssign(timer.idTemporizador, sala.idSala)}
                              disabled={!selectedEmpresaMap[key]}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-30"
                              aria-label="Asignar empresa"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {timers.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No hay temporizadores configurados.</p>
        )}
      </div>
    </div>
  );
}
