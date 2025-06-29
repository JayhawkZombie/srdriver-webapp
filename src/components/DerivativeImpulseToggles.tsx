import React from 'react';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useAppStore } from '../store/appStore';

const DerivativeImpulseToggles: React.FC = () => {
  const showFirstDerivative = useAppStore(state => state.showFirstDerivative);
  const setShowFirstDerivative = useAppStore(state => state.setShowFirstDerivative);
  const showSecondDerivative = useAppStore(state => state.showSecondDerivative);
  const setShowSecondDerivative = useAppStore(state => state.setShowSecondDerivative);
  const showImpulses = useAppStore(state => state.showImpulses);
  const setShowImpulses = useAppStore(state => state.setShowImpulses);
  const showDetectionFunction = useAppStore(state => state.showDetectionFunction);
  const setShowDetectionFunction = useAppStore(state => state.setShowDetectionFunction);
  return (
    <FormGroup row sx={{ mb: 1, gap: 0.5 }}>
      <FormControlLabel
        control={<Checkbox size="small" checked={showFirstDerivative} onChange={e => setShowFirstDerivative(e.target.checked)} />}
        label="1st Deriv"
        sx={{ mr: 1 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={showSecondDerivative} onChange={e => setShowSecondDerivative(e.target.checked)} />}
        label="2nd Deriv"
        sx={{ mr: 1 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={showImpulses} onChange={e => setShowImpulses(e.target.checked)} />}
        label="Impulses"
        sx={{ mr: 1 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={showDetectionFunction} onChange={e => setShowDetectionFunction(e.target.checked)} />}
        label="Detect Fn"
        sx={{ mr: 1 }}
      />
    </FormGroup>
  );
};

export default DerivativeImpulseToggles; 