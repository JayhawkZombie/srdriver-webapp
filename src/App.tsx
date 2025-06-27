import React, { useState } from 'react';
import { 
  ThemeProvider,
  createTheme,
  CssBaseline,
  FormControlLabel,
  Switch
} from '@mui/material';
import DeviceManager from './components/DeviceManager';
import { DeviceControllerProvider } from './controllers/DeviceControllerContext';

function App() {
  const getInitialMode = () => {
    const saved = localStorage.getItem('colorMode');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode());
  const theme = createTheme({ palette: { mode } });
  const handleToggle = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DeviceControllerProvider>
        <DeviceManager mode={mode} onToggleMode={handleToggle} />
      </DeviceControllerProvider>
    </ThemeProvider>
  );
}

export default App;

