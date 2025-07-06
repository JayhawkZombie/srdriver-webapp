import React, { useState } from 'react';
import { Box, Typography, IconButton, TextField, InputAdornment } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface EditableNicknameProps {
  browserId: string;
  value?: string;
  fallbackName: string;
  onChange: (nickname: string) => void;
  size?: 'small' | 'medium';
}

const EditableNickname: React.FC<EditableNicknameProps> = ({ browserId, value, fallbackName, onChange, size = 'medium' }) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value || '');

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInput(value || '');
    setEditing(true);
  };
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditing(false);
    setInput(value || '');
  };
  const handleSave = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (input.trim()) {
      onChange(input.trim());
      setEditing(false);
    }
  };
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          size={size}
          autoFocus
          variant="standard"
          sx={{ flexGrow: 1, minWidth: 0, fontSize: size === 'small' ? 14 : 16 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size={size} onClick={handleSave} aria-label="Save nickname">
                  <CheckIcon fontSize={size} />
                </IconButton>
                <IconButton size={size} onClick={handleCancel} aria-label="Cancel edit">
                  <CloseIcon fontSize={size} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{ flexGrow: 1, textAlign: 'left', fontSize: size === 'small' ? 14 : 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        title={value || fallbackName}
      >
        {value || fallbackName}
      </Typography>
      <IconButton size={size} onClick={handleEdit} aria-label="Edit nickname" sx={{ ml: 0.5 }}>
        <EditOutlinedIcon fontSize={size} />
      </IconButton>
    </Box>
  );
};

export default EditableNickname; 