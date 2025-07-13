import React, { useState } from 'react';
import { Drawer, Button, Tag, HTMLSelect } from '@blueprintjs/core';
import { useAppStore } from '../../store/appStore';

export interface AppStateLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppStateLogDrawer: React.FC<AppStateLogDrawerProps> = ({ isOpen, onClose }) => {
  const logs = useAppStore(s => s.logs);
  const clearLogs = useAppStore(s => s.clearLogs);
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');

  const categories = Array.from(new Set(logs.map(l => l.category)));
  const levels = ['all', 'info', 'warn', 'error', 'debug'];

  const filteredLogs = logs.filter(l =>
    (category === 'all' || l.category === category) &&
    (level === 'all' || l.level === level)
  );

  // Show newest logs at the top
  const sortedLogs = [...filteredLogs].sort((a, b) => b.timestamp - a.timestamp);

  function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour12: false });
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Application Log"
      size={Drawer.SIZE_LARGE}
      position="right"
      style={{ top: 64, height: 'calc(100vh - 64px)', width: '60vw' }}
      portalClassName="app-log-drawer-portal"
    >
      <div style={{ padding: 16, paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <HTMLSelect value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </HTMLSelect>
          <HTMLSelect value={level} onChange={e => setLevel(e.target.value)}>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </HTMLSelect>
          <Button icon="trash" intent="danger" onClick={clearLogs}>Clear</Button>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
          {sortedLogs.length === 0 && <div style={{ color: '#888', padding: 8 }}>No logs to display.</div>}
          {sortedLogs.map(log => (
            <div key={log.id} style={{ borderBottom: '1px solid #eee', padding: 8, display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Left column: timestamp, tags */}
              <div style={{ minWidth: 90, maxWidth: 110, textAlign: 'left', marginRight: 12 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>{formatTime(log.timestamp)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <Tag minimal intent={log.level === 'error' ? 'danger' : log.level === 'warn' ? 'warning' : 'none'} style={{ fontSize: 11, padding: '0 6px', marginBottom: 2 }}>
                    {log.level.toUpperCase()}
                  </Tag>
                  <Tag minimal style={{ fontSize: 11, padding: '0 6px' }}>{log.category}</Tag>
                </div>
              </div>
              {/* Right column: message, data */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{log.message}</div>
                {log.data && (
                  <pre style={{ fontSize: 10, background: '#f5f8fa', color: '#000', margin: 0, padding: 4 }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}; 