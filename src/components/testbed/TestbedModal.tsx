import React from 'react';
import { Modal, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TestbedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const style = {
  position: 'fixed' as const,
  left: '50%',
  top: '3vh',
  transform: 'translateX(-50%)',
  width: '98vw',
  minHeight: '90vh',
  maxHeight: '94vh',
  overflow: 'auto',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 6,
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '0',
};

const TestbedModal: React.FC<TestbedModalProps> = ({ open, onClose, children }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="testbed-modal-title" aria-describedby="testbed-modal-desc">
    <Box sx={style}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '18px 24px 0 0', position: 'relative', zIndex: 2 }}>
        <IconButton onClick={onClose} sx={{ fontSize: 32 }}>
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>
      <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        {children}
      </div>
    </Box>
  </Modal>
);

export default TestbedModal; 