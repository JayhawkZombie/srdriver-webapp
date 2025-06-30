import React from 'react';
import { Paper } from '@mui/material';
import PulseToolsCard from '../controls/PulseToolsCard';
import PatternResponsePanel from './PatternResponsePanel';
import TabPanelContainer, { TabPanelTab } from '../TabPanelContainer';

const tabs: TabPanelTab[] = [
  { label: 'Pulses', content: <PulseToolsCard /> },
  { label: 'Patterns', content: <PatternResponsePanel /> },
];

// This card controls the impulse response of the device, including the pulses and patterns
// When open, this will use the currently selected device to fire the pulses and patterns
// from the currently-open tab

// TODO: Re-use this so that when we are selecting impulses, we can use this card to select what
// we do in response to the impulse.
const ImpulseResponseCard: React.FC = () => {
  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', minWidth: 340 }}>
      <TabPanelContainer tabs={tabs} />
    </Paper>
  );
};

export default ImpulseResponseCard; 