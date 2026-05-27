/**
 * SalaPopUp — modal for selecting the active sala in TimerView.
 * Migrated from SalaPopUp.js (class component).
 *
 * Uses useSalas hook — no manual fetch.
 */

import { useSalas } from '../../hooks/useSalas';
import type { Sala } from '../../types/models';

interface SalaPopUpProps {
  onSelect: (sala: Sala) => void;
  onClose: () => void;
}

export function SalaPopUp({ onSelect, onClose }: SalaPopUpProps) {
  const { data: salas, isLoading, isError } = useSalas();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Seleccionar sala"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona una sala</h2>

        {isLoading && (
          <p className="text-gray-500 text-sm text-center py-4">Cargando salas…</p>
        )}

        {isError && (
          <p className="text-red-600 text-sm text-center py-4">
            Error al cargar las salas. Inténtalo de nuevo.
          </p>
        )}

        {salas && (
          <ul className="space-y-2" role="listbox">
            {salas.map((sala) => (
              <li key={sala.idSala}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => onSelect(sala)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium text-gray-700"
                >
                  {sala.nombreSala}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
