import React from 'react';
import { Modal, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TestbedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  maxWidth: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  outline: 'none',
};

const TestbedModal: React.FC<TestbedModalProps> = ({ open, onClose, children }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="testbed-modal-title" aria-describedby="testbed-modal-desc">
    <Box sx={style}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
        <CloseIcon />
      </IconButton>
      {children}
    </Box>
  </Modal>
);

export default TestbedModal; 