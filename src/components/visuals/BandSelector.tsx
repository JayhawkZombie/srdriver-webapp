import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAppStore } from '../../store/appStore';

const BAND_NAMES = ['Bass', 'Low Mid', 'Mid', 'Treble', 'High Treble'];

const BandSelector: React.FC = () => {
  const selectedBand = useAppStore(state => state.selectedBand);
  const setSelectedBand = useAppStore(state => state.setSelectedBand);
  return (
    <ToggleButtonGroup
      value={selectedBand}
      exclusive
      onChange={(_, newBand) => {
        if (newBand) setSelectedBand(newBand);
      }}
      aria-label="Band selection"
    >
      {BAND_NAMES.map(bandName => (
        <ToggleButton key={bandName} value={bandName} aria-label={bandName}>
          {bandName}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default BandSelector; 