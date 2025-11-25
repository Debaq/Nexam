import React, { createContext, useContext, useEffect, useState } from 'react';
import { SystemDarkModeWatcher } from './SystemDarkModeWatcher';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('violet');
  const [darkMode, setDarkMode] = useState('system');

  useEffect(() => {
    // Cargar configuraciones guardadas
    const savedTheme = localStorage.getItem('nexam-theme') || 'violet';
    const savedDarkMode = localStorage.getItem('nexam-dark-mode') || 'system';

    setTheme(savedTheme);
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    // Aplicar tema
    document.documentElement.classList.remove('light', 'dark', 'violet', 'blue', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Aplicar modo oscuro
    document.documentElement.classList.remove('light', 'dark');

    if (darkMode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(darkMode);
    }
  }, [darkMode]);

  const setThemeAndSave = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('nexam-theme', newTheme);
  };

  const setDarkModeAndSave = (newMode) => {
    setDarkMode(newMode);
    localStorage.setItem('nexam-dark-mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme: setThemeAndSave,
      darkMode,
      setDarkMode: setDarkModeAndSave
    }}>
      {children}
      <SystemDarkModeWatcher />
    </ThemeContext.Provider>
  );
};