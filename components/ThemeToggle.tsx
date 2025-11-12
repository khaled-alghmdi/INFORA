'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-6 h-6 text-gray-600 hover:text-green-600 transition-colors" />
      ) : (
        <Sun className="w-6 h-6 text-yellow-400 hover:text-yellow-300 transition-colors" />
      )}
    </button>
  );
};

export default ThemeToggle;

