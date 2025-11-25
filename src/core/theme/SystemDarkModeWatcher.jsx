import React, { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

// Componente que monitorea el modo oscuro del sistema
export const SystemDarkModeWatcher = () => {
  const { darkMode } = useTheme();

  useEffect(() => {
    if (darkMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(e.matches ? 'dark' : 'light');
    };

    // Aplicar modo actual
    handleChange(mediaQuery);
    
    // Escuchar cambios
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  return null;
};