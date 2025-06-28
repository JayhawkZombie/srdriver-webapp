import React from 'react';
import { Snackbar, Alert, Box } from '@mui/material';
import { useToastContext } from '../controllers/ToastContext';

const AUTO_HIDE_DURATION = 2000;

const GlobalToast: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <Box sx={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 1400, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
      {toasts.map((toast, idx) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={AUTO_HIDE_DURATION}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: idx * 7 }}
        >
          <Alert severity="info" sx={{ width: '100%', pointerEvents: 'auto' }} onClose={() => removeToast(toast.id)}>
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default GlobalToast; 