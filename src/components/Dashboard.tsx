import React, { useState, useContext } from 'react';
import {
  Box,
  Drawer as MuiDrawer,
} from '@mui/material';
import DashboardHeader from './DashboardHeader';
import LightsConnectionCard from './controls/LightsConnectionCard';
import TestbedModal from './testbed/TestbedModal';
import TestHarnessContent from './testbed/TestHarnessContent';
import { AppStateLogDrawer } from './spectrogram-timeline/refactored-timeline/AppStateLogDrawer';
import DevAppStateViewer from './dev/DevAppStateViewer';
import { Card, Elevation, Drawer as BPDrawer, Position } from '@blueprintjs/core';
import { ResponsePaletteEditor } from './spectrogram-timeline/refactored-timeline/ResponsePaletteEditor';
import { ResponseRectToolbarGallery } from './spectrogram-timeline/refactored-timeline/ResponseRectToolbarGallery';
import { UnifiedThemeContext } from '../context/UnifiedThemeContext';
import DashboardTimeline from './spectrogram-timeline/refactored-timeline/DashboardTimeline';

interface DashboardProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode: _mode, onToggleMode }) => {
  const { mode } = useContext(UnifiedThemeContext) ?? { mode: 'light' };
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [testbedModalOpen, setTestbedModalOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [devAppStateDrawerOpen, setDevAppStateDrawerOpen] = useState(false);
  const toggleDevAppStateDrawer = () => setDevAppStateDrawerOpen(open => !open);

  return (
      <Box
          sx={{
              minHeight: "100vh",
              bgcolor: "background.default",
              px: 0,
              py: 0,
          }}
      >
          <AppStateLogDrawer
              isOpen={logDrawerOpen}
              onClose={() => setLogDrawerOpen(false)}
          />
          <DevAppStateViewer
              isOpen={devAppStateDrawerOpen}
              onClose={toggleDevAppStateDrawer}
          />
          <Box
              sx={{
                  height: "100vh",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  mt: 0,
                  pt: 0,
              }}
          >
              <DashboardHeader
                  mode={mode}
                  onToggleMode={onToggleMode}
                  onOpenConnectionDrawer={() => setConnectionDrawerOpen(true)}
                  onOpenLeftDrawer={() => setLeftDrawerOpen(true)}
                  onOpenTestbedModal={() => setTestbedModalOpen(true)}
                  onOpenLogDrawer={() => setLogDrawerOpen(true)}
                  onOpenDevAppStateDrawer={toggleDevAppStateDrawer}
              />
              <DashboardTimeline />
          </Box>
          <BPDrawer
              isOpen={leftDrawerOpen}
              onClose={() => setLeftDrawerOpen(false)}
              position={Position.LEFT}
              size={500}
              canOutsideClickClose
              hasBackdrop={false}
              style={{ marginTop: 64, height: "calc(100% - 64px)", top: 64 }}
          >
              <div
                  className={mode === "dark" ? "bp5-dark" : ""}
                  style={{
                      padding: 16,
                      minHeight: "100%",
                      background: mode === "dark" ? "#181c22" : "#fff",
                  }}
              >
                  <ResponsePaletteEditor />
                  <ResponseRectToolbarGallery />
              </div>
          </BPDrawer>
          <MuiDrawer
              anchor="right"
              open={connectionDrawerOpen}
              onClose={() => setConnectionDrawerOpen(false)}
              PaperProps={{
                  sx: {
                      width: 380,
                      p: 2,
                      bgcolor: "background.default",
                      boxShadow: 8,
                      mt: "64px",
                      height: "calc(100% - 64px)",
                      top: "64px",
                  },
              }}
          >
              <LightsConnectionCard />
          </MuiDrawer>
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
