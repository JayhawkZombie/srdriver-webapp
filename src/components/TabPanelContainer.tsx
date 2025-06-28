import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

export interface TabPanelTab {
  label: string;
  content: React.ReactNode;
}

interface TabPanelContainerProps {
  tabs: TabPanelTab[];
  initialTab?: number;
  tabSx?: object;
  tabsSx?: object;
}

const TabPanelContainer: React.FC<TabPanelContainerProps> = ({ tabs, initialTab = 0, tabSx, tabsSx }) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, ...tabsSx }}>
        {tabs.map((t, idx) => (
          <Tab key={t.label} label={t.label} id={`tab-${idx}`} aria-controls={`tabpanel-${idx}`} sx={tabSx} />
        ))}
      </Tabs>
      {tabs.map((t, idx) => (
        <div
          key={t.label}
          role="tabpanel"
          hidden={tab !== idx}
          id={`tabpanel-${idx}`}
          aria-labelledby={`tab-${idx}`}
          style={{ width: '100%' }}
        >
          {tab === idx && (
            <Box sx={{ width: '100%' }}>{t.content}</Box>
          )}
        </div>
      ))}
    </Box>
  );
};

export default TabPanelContainer; 