import React, { useState } from 'react';
import {
  Box,
  Drawer,
} from '@mui/material';
import DashboardHeader from './DashboardHeader';
import LightsConnectionCard from './controls/LightsConnectionCard';
import TestbedModal from './testbed/TestbedModal';
import TestHarnessContent from './testbed/TestHarnessContent';

interface DashboardProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, onToggleMode }) => {
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [testbedModalOpen, setTestbedModalOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 0, py: 0 }}>
      <Box sx={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', mt: 0, pt: 0 }}>
        <DashboardHeader
          mode={mode}
          onToggleMode={onToggleMode}
          onOpenConnectionDrawer={() => setConnectionDrawerOpen(true)}
          onOpenLeftDrawer={() => setLeftDrawerOpen(true)}
          onOpenTestbedModal={() => setTestbedModalOpen(true)}
        />
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
