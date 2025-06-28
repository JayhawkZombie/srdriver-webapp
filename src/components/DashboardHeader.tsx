import React from 'react';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch, Chip, Tabs, Tab } from '@mui/material';
import DevAppStateViewer from './DevAppStateViewer';

interface DashboardHeaderProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  selectedDevice?: { isConnected: boolean };
  mainTab: number;
  setMainTab: (tab: number) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  mode,
  onToggleMode,
  selectedDevice,
  mainTab,
  setMainTab
}) => (
  <AppBar position="static" elevation={0}>
    <Toolbar sx={{ minHeight: 48, px: 2 }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        SRDriver Dashboard
      </Typography>
      <FormControlLabel
        control={<Switch checked={mode === 'dark'} onChange={onToggleMode} color="default" />}
        label={mode === 'dark' ? 'Dark' : 'Light'}
        sx={{ mr: 2 }}
      />
      {selectedDevice && (
        <Chip
          label={selectedDevice.isConnected ? 'Connected' : 'Disconnected'}
          color={selectedDevice.isConnected ? 'success' : 'default'}
          size="small"
        />
      )}
      <DevAppStateViewer />
    </Toolbar>
    <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} centered>
      <Tab label="Devices" />
      <Tab label="Audio Chunker" />
    </Tabs>
  </AppBar>
);

export default DashboardHeader; 