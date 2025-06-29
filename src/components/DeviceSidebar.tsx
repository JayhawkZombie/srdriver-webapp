import React from 'react';
import { Paper, Box, Typography, Button, Tabs, Tab, IconButton, Drawer } from '@mui/material';
import { Add as AddIcon, Bluetooth as BluetoothIcon, Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import EditableNickname from './EditableNickname';
import { useAppStore } from '../store/appStore';

interface DeviceSidebarProps {
  mainTab: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  devices: any[];
  addDevice: () => void;
  removeDevice: (id: string) => void;
}

const DeviceSidebar: React.FC<DeviceSidebarProps> = ({
  mainTab,
  drawerOpen,
  setDrawerOpen,
  devices,
  addDevice,
  removeDevice
}) => {
  const activeDeviceId = useAppStore(state => state.activeDeviceId);
  const setActiveDeviceId = useAppStore(state => state.setActiveDeviceId);
  const devicesMetadata = useAppStore(state => state.devicesMetadata);
  const setDeviceNickname = useAppStore(state => state.setDeviceNickname);

  // Find the index of the active device
  const selectedDeviceIndex = devices.findIndex(d => d.id === activeDeviceId);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (devices[newValue]) {
      setActiveDeviceId(devices[newValue].id);
    }
  };

  if (mainTab === 0) {
    return (
      <Paper sx={{
        width: 220,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        p: 1,
      }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: 18, mb: 1 }}>
            SRDriver Devices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addDevice}
            fullWidth
            sx={{ mb: 1, py: 0.5, fontSize: 14 }}
            size="small"
          >
            Add Device
          </Button>
        </Box>
        <Tabs
          orientation="vertical"
          value={selectedDeviceIndex}
          onChange={handleTabChange}
          sx={{ flexGrow: 1, borderRight: 1, borderColor: 'divider', minWidth: 0 }}
          TabIndicatorProps={{ style: { width: 3 } }}
          variant="scrollable"
        >
          {devices.map((device, index) => (
            <Tab
              key={device.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <BluetoothIcon
                    sx={{
                      mr: 1,
                      color: device.isConnected ? 'success.main' : 'text.disabled',
                      fontSize: 16
                    }}
                  />
                  <EditableNickname
                    macOrId={device.macOrId}
                    value={devicesMetadata[device.macOrId]?.nickname}
                    fallbackName={device.name}
                    onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
                    size="small"
                  />
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      removeDevice(device.id);
                    }}
                    style={{
                      marginLeft: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Remove device"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        removeDevice(device.id);
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </span>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                minHeight: 40,
                px: 1,
                py: 0.5,
                fontSize: 14,
                mb: 0.5
              }}
            />
          ))}
        </Tabs>
      </Paper>
    );
  }

  // Drawer for other tabs (e.g. Audio Chunker)
  return (
    <>
      {!drawerOpen && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={() => setDrawerOpen(true)}
          sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 220, p: 1 } }}
      >
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: 18, mb: 1 }}>
            SRDriver Devices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addDevice}
            fullWidth
            sx={{ mb: 1, py: 0.5, fontSize: 14 }}
            size="small"
          >
            Add Device
          </Button>
        </Box>
        <Tabs
          orientation="vertical"
          value={selectedDeviceIndex}
          onChange={handleTabChange}
          sx={{ flexGrow: 1, borderRight: 1, borderColor: 'divider', minWidth: 0 }}
          TabIndicatorProps={{ style: { width: 3 } }}
          variant="scrollable"
        >
          {devices.map((device, index) => (
            <Tab
              key={device.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <BluetoothIcon
                    sx={{
                      mr: 1,
                      color: device.isConnected ? 'success.main' : 'text.disabled',
                      fontSize: 16
                    }}
                  />
                  <EditableNickname
                    macOrId={device.macOrId}
                    value={devicesMetadata[device.macOrId]?.nickname}
                    fallbackName={device.name}
                    onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
                    size="small"
                  />
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      removeDevice(device.id);
                    }}
                    style={{
                      marginLeft: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Remove device"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        removeDevice(device.id);
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </span>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                minHeight: 40,
                px: 1,
                py: 0.5,
                fontSize: 14,
                mb: 0.5
              }}
            />
          ))}
        </Tabs>
      </Drawer>
    </>
  );
};

export default DeviceSidebar; 