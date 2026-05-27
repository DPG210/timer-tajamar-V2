/**
 * Auth store — Zustand.
 * Resolves M-01 (token now accessible from axios interceptor),
 * M-auth (localStorage.removeItem instead of .clear()).
 *
 * The store hydrates from localStorage on first import so a page
 * refresh restores the session without a new login.
 */

import { create } from 'zustand';

const TOKEN_KEY = 'token';

interface AuthState {
  token: string | null;
  /** Store token in memory and persist to localStorage. */
  setToken: (token: string) => void;
  /** Remove token from memory and from localStorage (only the token key). */
  clearToken: () => void;
  /**
   * Returns true only if a non-empty, non-"undefined" token exists.
   * The original code stored the string "undefined" when the promise
   * didn't resolve correctly — this guard prevents that.
   */
  isAuthenticated: () => boolean;
}

function readStoredToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored || stored === 'undefined' || stored === 'null') return null;
  return stored;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Hydrate from localStorage on initialization
  token: readStoredToken(),

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  clearToken: () => {
    // Only remove the token key — do not clear() the entire localStorage (M-auth fix)
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },

  isAuthenticated: () => {
    const { token } = get();
    return token !== null && token !== 'undefined' && token.length > 0;
  },
}));
