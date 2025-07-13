import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { UnifiedThemeContext } from './UnifiedThemeContext';
import type { ReactNode } from 'react';

function getInitialMode(): 'light' | 'dark' {
  const saved = localStorage.getItem('colorMode');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const UnifiedThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode());
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode]);

  return (
    <UnifiedThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={mode === 'dark' ? 'bp5-dark' : ''} style={{ minHeight: '100vh' }}>
          {children}
        </div>
      </ThemeProvider>
    </UnifiedThemeContext.Provider>
  );
}; 