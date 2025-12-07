import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (storedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (systemPrefersDark) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const isNowDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
    setIsDark(isNowDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 bg-white dark:bg-gray-800 text-yellow-500 dark:text-blue-400 border border-gray-200 dark:border-gray-700 cursor-pointer"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? <Moon size={24} /> : <Sun size={24} />}
    </button>
  );
}
