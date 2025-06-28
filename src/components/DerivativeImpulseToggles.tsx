import React from 'react';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';

interface DerivativeImpulseTogglesProps {
  showFirstDerivative: boolean;
  onShowFirstDerivative: (checked: boolean) => void;
  showSecondDerivative: boolean;
  onShowSecondDerivative: (checked: boolean) => void;
  showImpulses: boolean;
  onShowImpulses: (checked: boolean) => void;
}

const DerivativeImpulseToggles: React.FC<DerivativeImpulseTogglesProps> = ({
  showFirstDerivative,
  onShowFirstDerivative,
  showSecondDerivative,
  onShowSecondDerivative,
  showImpulses,
  onShowImpulses,
}) => (
  <FormGroup row sx={{ mb: 2 }}>
    <FormControlLabel
      control={<Checkbox checked={showFirstDerivative} onChange={e => onShowFirstDerivative(e.target.checked)} />}
      label="Show 1st Derivative"
    />
    <FormControlLabel
      control={<Checkbox checked={showSecondDerivative} onChange={e => onShowSecondDerivative(e.target.checked)} />}
      label="Show 2nd Derivative"
    />
    <FormControlLabel
      control={<Checkbox checked={showImpulses} onChange={e => onShowImpulses(e.target.checked)} />}
      label="Show Impulses"
    />
  </FormGroup>
);

export default DerivativeImpulseToggles; 