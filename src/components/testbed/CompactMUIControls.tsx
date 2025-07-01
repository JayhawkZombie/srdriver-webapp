import React from 'react';
import { Slider, Switch, Button, Stack, Typography } from '@mui/material';

const CompactMUIControls: React.FC = () => {
  const [sliderValue, setSliderValue] = React.useState(30);
  const [toggle, setToggle] = React.useState(false);

  return (
    <Stack spacing={1} sx={{ width: 200, p: 2, border: '1px solid #ccc', borderRadius: 2, background: '#222', color: '#fff' }}>
      <Typography variant="caption" sx={{ color: '#aaa' }}>MUI Compact Controls</Typography>
      <Slider
        size="small"
        value={sliderValue}
        min={0}
        max={100}
        onChange={(_, v) => setSliderValue(v as number)}
        sx={{ color: '#90caf9' }}
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <Switch size="small" checked={toggle} onChange={() => setToggle(!toggle)} />
        <Typography variant="caption">Toggle</Typography>
      </Stack>
      <Button size="small" variant="contained" color="primary">Action</Button>
    </Stack>
  );
};

export default CompactMUIControls; 