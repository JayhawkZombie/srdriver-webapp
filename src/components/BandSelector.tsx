import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface BandSelectorProps {
  bands: { name: string }[];
  selectedBand: string;
  onSelect: (bandName: string) => void;
}

const BandSelector: React.FC<BandSelectorProps> = ({ bands, selectedBand, onSelect }) => {
  return (
    <ToggleButtonGroup
      value={selectedBand}
      exclusive
      onChange={(_, newBand) => {
        if (newBand) onSelect(newBand);
      }}
      aria-label="Band selection"
    >
      {bands.map(band => (
        <ToggleButton key={band.name} value={band.name} aria-label={band.name}>
          {band.name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default BandSelector; 