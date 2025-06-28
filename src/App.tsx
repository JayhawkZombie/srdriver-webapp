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
import { PulseProvider } from './controllers/PulseContext';
import { ToastProvider } from './controllers/ToastContext';
import GlobalToast from './components/GlobalToast';
import DevAppStateViewer from './components/DevAppStateViewer';

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
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DeviceControllerProvider>
          <PulseProvider>
            <ToastProvider>
              <GlobalToast />
              <DeviceManager mode={mode} onToggleMode={handleToggle} />
            </ToastProvider>
          </PulseProvider>
        </DeviceControllerProvider>
      </ThemeProvider>
    </>
  );
}

export default App;

