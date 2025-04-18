import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null); // Start with null to prevent premature render

  // Initialize theme from localStorage on first render
  useEffect(() => {
    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme !== null) {
      setIsDarkMode(storedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      localStorage.setItem('darkMode', String(prefersDark));
    }
  }, []); // Empty dependency array means this runs once on mount

  // Apply theme changes when isDarkMode state changes
  useEffect(() => {
    // Only apply when isDarkMode is not null (after initialization)
    if (isDarkMode === null) return;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      // No need to add 'light' class since that's our default
    }
  }, [isDarkMode]); // This runs when isDarkMode changes

  const toggleDarkMode = () => {
    if (isDarkMode === null) return;
    
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleDarkMode}
      className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
    >
      {!isDarkMode ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )}
    </Button>
  );
}
