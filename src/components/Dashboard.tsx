import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Drawer,
  IconButton,
} from '@mui/material';
import DevicePanel from './DevicePanel';
import AudioChunkerDemo from './AudioChunkerDemo';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { PulseControlsProvider } from '../controllers/PulseControlsContext';
import { PulseToolsProvider } from '../controllers/PulseToolsContext';
import DeviceSidebar from './DeviceSidebar';
import DashboardHeader from './DashboardHeader';
import { SingleDeviceProvider } from '../controllers/DeviceControllerContext';
import LightsConnectionCard from './LightsConnectionCard';
import FirePatternOnImpulse from './FirePatternOnImpulse';
import TestbedModal from './testbed/TestbedModal';
import TestHarnessContent from './testbed/TestHarnessContent';

interface DashboardProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, onToggleMode }) => {
  const { devices } = useDeviceControllerContext();
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [testbedModalOpen, setTestbedModalOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(devices[0]?.id ?? null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 0, py: 0 }}>
      <FirePatternOnImpulse />
      <Box sx={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', mt: 0, pt: 0 }}>
        <DashboardHeader
          mode={mode}
          onToggleMode={onToggleMode}
          onOpenConnectionDrawer={() => setConnectionDrawerOpen(true)}
          onOpenLeftDrawer={() => setLeftDrawerOpen(true)}
          onOpenTestbedModal={() => setTestbedModalOpen(true)}
        />
        <Box sx={{ flexGrow: 1, width: '100%', py: 1, px: 0, m: 0 }}>
          <PulseControlsProvider>
            <PulseToolsProvider>
              <AudioChunkerDemo />
            </PulseToolsProvider>
          </PulseControlsProvider>
        </Box>
      </Box>
      <Drawer
        anchor="left"
        open={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        PaperProps={{ sx: { width: 380, p: 2, bgcolor: 'background.default', boxShadow: 8, mt: '64px', height: 'calc(100% - 64px)', top: '64px' } }}
      >
        <LightsConnectionCard />
      </Drawer>
      <Drawer
        anchor="right"
        open={connectionDrawerOpen}
        onClose={() => setConnectionDrawerOpen(false)}
        PaperProps={{ sx: { width: 380, p: 2, bgcolor: 'background.default', boxShadow: 8, mt: '64px', height: 'calc(100% - 64px)', top: '64px' } }}
      >
        <LightsConnectionCard />
      </Drawer>
      <TestbedModal
        open={testbedModalOpen}
        onClose={() => setTestbedModalOpen(false)}
      >
        <TestHarnessContent />
      </TestbedModal>
    </Box>
  );
};

export default Dashboard;
