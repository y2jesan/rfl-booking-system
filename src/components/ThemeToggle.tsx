'use client';

import { useTheme } from '@/app/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-in-out hover:scale-105" aria-label="Toggle theme">
        <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-in-out hover:scale-105" aria-label="Toggle theme">
      {theme === 'dark' ? <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
    </button>
  );
}
