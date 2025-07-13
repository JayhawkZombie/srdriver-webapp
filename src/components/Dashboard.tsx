import React, { useState, useContext } from 'react';
import {
  Box,
  Drawer as MuiDrawer,
} from '@mui/material';
import DashboardHeader from './DashboardHeader';
import LightsConnectionCard from './controls/LightsConnectionCard';
import TestbedModal from './testbed/TestbedModal';
import TestHarnessContent from './testbed/TestHarnessContent';
import { AppStateLogDrawer } from './dev/AppStateLogDrawer';
import DevAppStateViewer from './dev/DevAppStateViewer';
import { Drawer as BPDrawer, Position, Card } from '@blueprintjs/core';
import { ResponsePaletteEditor } from './custom-timeline/ResponsePaletteEditor';
import { ResponseRectToolbarGallery } from './custom-timeline/ResponseRectToolbarGallery';
import { UnifiedThemeContext } from '../context/UnifiedThemeContext';
import { Profiling } from './utility/Profiling';
import { useDevToolsEnabled } from '../store/appStore';
import { AudioAnalysisProvider } from "./custom-timeline/AudioAnalysisContext";
import {
    DetectionDataProvider,
} from "./custom-timeline/DetectionDataContext";
import KonvaTimelineDashboard from './custom-timeline/KonvaTimelineDashboard';
import PlaybackProvider from './custom-timeline/PlaybackContext';
import TabPanelContainer from './TabPanelContainer';
import { SDCardView } from './sd-card/SDCardView';

interface DashboardProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, onToggleMode }) => {
  useContext(UnifiedThemeContext); // Only for side effects if needed
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [testbedModalOpen, setTestbedModalOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [devAppStateDrawerOpen, setDevAppStateDrawerOpen] = useState(false);
  const [profilingCompact, setProfilingCompact] = useState(true);
  const devToolsEnabled = useDevToolsEnabled();
  const toggleDevAppStateDrawer = () => setDevAppStateDrawerOpen(open => !open);

  // --- SD Card state from Zustand ---
  // (You may want to wire this up to BLE later)
  // import { useAppStore } from '../store/appStore';
  // const { fileTree, loading, error } = useAppStore(state => state.sdCard);

  return (
      <Box
          sx={{
              minHeight: "100vh",
              bgcolor: "background.default",
              px: 0,
              py: 0,
          }}
      >
          <PlaybackProvider>
              <AudioAnalysisProvider>
                  <DetectionDataProvider>
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
                              onOpenConnectionDrawer={() =>
                                  setConnectionDrawerOpen(true)
                              }
                              onOpenLeftDrawer={() => setLeftDrawerOpen(true)}
                              onOpenTestbedModal={() =>
                                  setTestbedModalOpen(true)
                              }
                              onOpenLogDrawer={() => setLogDrawerOpen(true)}
                              onOpenDevAppStateDrawer={toggleDevAppStateDrawer}
                          />
                          {/* --- Dashboard Tabs --- */}
                          <div style={{ flex: 1, width: '100%', maxWidth: 1800, margin: '0 auto', padding: 0 }}>
                            <TabPanelContainer
                              tabs={[
                                { label: 'Timeline', content: <KonvaTimelineDashboard /> },
                                { label: 'SD Card', content: <SDCardView fileTree={null} loading={false} error={null} /> },
                              ]}
                              tabsSx={{
                                background: mode === 'dark' ? 'var(--bp5-dark-gray1)' : '#f5f8fa',
                                borderRadius: 12,
                                px: 2,
                                pt: 2,
                                mb: 2,
                              }}
                              tabSx={{
                                color: mode === 'dark' ? 'var(--bp5-text-color)' : '#1a1a1a',
                                fontWeight: 600,
                                fontSize: 18,
                              }}
                            />
                          </div>
                          {devToolsEnabled && (
                              <Card
                                  elevation={4}
                                  className={mode === "dark" ? "bp5-dark" : ""}
                                  style={{
                                      position: "fixed",
                                      top: 32,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      zIndex: 20000,
                                      minWidth: 320,
                                      maxWidth: 480,
                                      padding: 0,
                                  }}
                              >
                                  <Profiling
                                      onClose={() => {}}
                                      compact={profilingCompact}
                                      onToggleCompact={() =>
                                          setProfilingCompact((c) => !c)
                                      }
                                  />
                              </Card>
                          )}
                      </Box>
                      <BPDrawer
                          isOpen={leftDrawerOpen}
                          onClose={() => setLeftDrawerOpen(false)}
                          position={Position.LEFT}
                          size={500}
                          canOutsideClickClose
                          hasBackdrop={false}
                          style={{
                              marginTop: 64,
                              height: "calc(100% - 64px)",
                              top: 64,
                          }}
                      >
                          <div
                              className={mode === "dark" ? "bp5-dark" : ""}
                              style={{
                                  padding: 16,
                                  minHeight: "100%",
                                  background:
                                      mode === "dark" ? "#181c22" : "#fff",
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
                  </DetectionDataProvider>
              </AudioAnalysisProvider>
          </PlaybackProvider>
      </Box>
  );
};

export default Dashboard;
