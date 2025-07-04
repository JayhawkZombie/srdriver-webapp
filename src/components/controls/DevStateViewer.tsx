import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Box, Button, Typography, Collapse, Paper } from '@mui/material';

function truncateArray(arr: any[]) {
  if (arr.length <= 5) return arr;
  return [...arr.slice(0, 5), '...'];
}
function truncateObject(obj: Record<string, any>) {
  const keys = Object.keys(obj);
  if (keys.length <= 5) return obj;
  const truncated: Record<string, any> = {};
  keys.slice(0, 5).forEach(k => truncated[k] = obj[k]);
  truncated['...'] = '...';
  return truncated;
}
function renderValue(val: any) {
  if (Array.isArray(val)) return JSON.stringify(truncateArray(val));
  if (val && typeof val === 'object') return JSON.stringify(truncateObject(val));
  return String(val);
}

const DevStateViewer: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const state = useAppStore();
  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 3000 }}>
      <Button variant="outlined" size="small" onClick={() => setOpen(o => !o)}>
        {open ? 'Hide State' : 'Show State'}
      </Button>
      <Collapse in={open}>
        <Paper sx={{ mt: 1, maxHeight: 400, maxWidth: 500, overflow: 'auto', p: 2, fontSize: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>App State (truncated)</Typography>
          <pre style={{ fontSize: 12, margin: 0 }}>
            {Object.entries(state).map(([k, v]) => `${k}: ${renderValue(v)}`).join('\n')}
          </pre>
        </Paper>
      </Collapse>
    </Box>
  );
};
export default DevStateViewer; 