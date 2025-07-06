import React from 'react';
import { Drawer } from '@blueprintjs/core';
import { useAppStore } from '../../store/appStore';
import Typography from '@mui/material/Typography';
import AppStateStyleTreeNode from '../utility/AppStateStyleTreeNode';

const isDev = process.env.NODE_ENV === 'development';

const DevAppStateViewer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const appState = useAppStore();
   if (!isDev) return null;
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="App State Viewer"
      size="30vw"
      position="left"
      style={{ top: 64, height: 'calc(100vh - 64px)' }}
      portalClassName="dev-app-state-drawer-portal"
    >
      <div style={{ padding: 8, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 700, fontFamily: 'monospace', fontSize: 14, mb: 0.5 }}>
          App State <span style={{ fontWeight: 400, fontSize: 12 }}>(expand/collapse sections below)</span>
        </Typography>
        <div>
          {Object.entries(appState).map(([k, v]: [string, unknown]) => (
            <div key={k} style={{ marginBottom: 0, borderBottom: '1px solid #eee', paddingBottom: 0 }}>
              <AppStateStyleTreeNode label={k} value={v} depth={0} />
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
};

export default DevAppStateViewer; 