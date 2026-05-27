/**
 * Login — migrated from Login.js (class component).
 *
 * Resolves:
 *   M-08: Swal lives here (component), not in service layer
 *   M-02: errors from useLogin() propagate correctly
 *   M-auth: clearToken uses removeItem, not localStorage.clear()
 *
 * socket emit "vamos" is also here (Start Event button).
 * socket emit "start" (emergency reset) is intentionally NOT exposed in UI (PRD: WONT).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { socket } from '../../socket';
import { TimerMenu } from '../timer/TimerMenu';

export function Login() {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  const { isAuthenticated, clearToken } = useAuthStore();
  const authenticated = isAuthenticated();

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(
      { userName, password },
      {
        onSuccess: () => {
          void navigate('/horario');
        },
        onError: (error) => {
          // M-08: Swal in component, not in service
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            void Swal.fire({
              title: 'Acceso denegado',
              text: 'Credenciales incorrectas. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Cerrar',
            });
          } else {
            void Swal.fire({
              title: 'Error de conexión',
              text: 'No se pudo conectar con el servidor. Comprueba tu conexión.',
              icon: 'error',
              confirmButtonText: 'Cerrar',
            });
          }
        },
      }
    );
  }

  function handleSignOut() {
    clearToken(); // only removes "token" key (M-auth fix)
    void navigate('/login');
  }

  async function handleStartEvent() {
    const result = await Swal.fire({
      title: '¿Iniciar evento?',
      text: 'Se iniciará la cuenta atrás de los temporizadores.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      socket.emit('vamos');
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar with hamburger */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <span className="font-semibold text-gray-800 text-sm">Timers</span>
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          aria-label="Abrir menú"
          className="p-2 rounded hover:bg-gray-100 text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <TimerMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />

      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Timers — Panel de control
        </h1>

        {!authenticated ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                id="userName"
                type="text"
                autoComplete="username"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPending}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 space-y-4 text-center">
            <p className="text-gray-700">Sesión activa</p>

            <button
              type="button"
              onClick={() => void handleStartEvent()}
              className="w-full bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 transition-colors"
            >
              Iniciar evento
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
