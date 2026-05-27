/**
 * AppLayout — shared layout wrapper with sidebar (desktop) and hamburger (mobile).
 * Wraps all authenticated and public routes that need navigation.
 */

import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from './Menu';
import { MenuPopUp } from './MenuPopUp';
import { useThemeStore } from '../../stores/themeStore';

const SunIcon = ({ size }: { size: 'sm' | 'md' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={size === 'md' ? 'h-5 w-5 text-amber-400' : 'h-4 w-4 text-amber-400'} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06L6.166 6.166z" />
  </svg>
);

const MoonIcon = ({ size }: { size: 'sm' | 'md' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={size === 'md' ? 'h-5 w-5 text-indigo-400' : 'h-4 w-4 text-indigo-400'} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
  </svg>
);

function DarkToggle({ variant = 'compact' }: { variant?: 'compact' | 'sidebar' }) {
  const { isDark, toggle } = useThemeStore();

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isDark ? <SunIcon size="md" /> : <MoonIcon size="md" />}
        <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {isDark ? <SunIcon size="sm" /> : <MoonIcon size="sm" />}
    </button>
  );
}

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar — visible on md+ */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wider">
            Timers
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Menu />
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <DarkToggle variant="sidebar" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mr-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-100 flex-1">Timers</span>
          <DarkToggle />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu drawer */}
      <MenuPopUp
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
