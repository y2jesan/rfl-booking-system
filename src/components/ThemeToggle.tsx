'use client';

import { useTheme } from '@/app/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all duration-300 ease-in-out hover:scale-105" aria-label="Toggle theme">
        <SunIcon className="h-5 w-5 text-secondary-foreground" />
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all duration-300 ease-in-out hover:scale-105" aria-label="Toggle theme">
      {theme === 'dark' ? <MoonIcon className="h-5 w-5 text-secondary-foreground" /> : <SunIcon className="h-5 w-5 text-secondary-foreground" />}
    </button>
  );
}
