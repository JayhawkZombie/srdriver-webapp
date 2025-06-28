import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
} from '@mui/material';
import DevicePanel from './DevicePanel';
import AudioChunkerDemo from './AudioChunkerDemo';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { PulseControlsProvider } from '../controllers/PulseControlsContext';
import { PulseToolsProvider } from '../controllers/PulseToolsContext';
import DeviceSidebar from './DeviceSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, onToggleMode }) => {
  const {
    devices,
    addDevice,
    removeDevice,
    connectDevice,
    disconnectDevice,
    updateDevice
  } = useDeviceControllerContext();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [mainTab, setMainTab] = useState<number>(0); // 0 = Devices, 1 = Audio Chunker
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedDevice = devices[selectedDeviceIndex];

  return (
    <>
      <DeviceSidebar
        mainTab={mainTab}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        devices={devices}
        selectedDeviceIndex={selectedDeviceIndex}
        setSelectedDeviceIndex={setSelectedDeviceIndex}
        addDevice={addDevice}
        removeDevice={removeDevice}
      />

      {/* Main content area: margin-left and scrollable */}
      <Box sx={{
        ml: '220px',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        mt: 0,
        pt: 0,
      }}>
        <DashboardHeader
          mode={mode}
          onToggleMode={onToggleMode}
          selectedDevice={selectedDevice}
          mainTab={mainTab}
          setMainTab={setMainTab}
        />
        <Container maxWidth={false} sx={{ flexGrow: 1, width: '100%', py: 1, px: 0, m: 0 }}>
          <PulseControlsProvider>
            {mainTab === 0 ? (
              devices.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <Typography variant="h6">No devices added. Click "Add Device" to begin.</Typography>
                </Box>
              ) : (
                selectedDevice && (
                  <DevicePanel
                    device={selectedDevice}
                    onConnect={() => connectDevice(selectedDevice.id)}
                    onDisconnect={() => disconnectDevice(selectedDevice.id)}
                    onUpdate={update => updateDevice(selectedDevice.id, update)}
                  />
                )
              )
            ) : (
              <PulseToolsProvider>
                <AudioChunkerDemo />
              </PulseToolsProvider>
            )}
          </PulseControlsProvider>
        </Container>
      </Box>
    </>
  );
};

export default Dashboard;
