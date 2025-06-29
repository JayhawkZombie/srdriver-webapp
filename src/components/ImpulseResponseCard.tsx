import React from 'react';
import { Paper } from '@mui/material';
import PulseToolsCard from './PulseToolsCard';
import PatternResponsePanel from './PatternResponsePanel';
import TabPanelContainer, { TabPanelTab } from './TabPanelContainer';

const tabs: TabPanelTab[] = [
  { label: 'Pulses', content: <PulseToolsCard /> },
  { label: 'Patterns', content: <PatternResponsePanel /> },
];

const ImpulseResponseCard: React.FC = () => {
  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', minWidth: 340 }}>
      <TabPanelContainer tabs={tabs} />
    </Paper>
  );
};

export default ImpulseResponseCard; 