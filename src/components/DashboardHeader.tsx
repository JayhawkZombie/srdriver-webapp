import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch, Tooltip } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import WorkspacesSharpIcon from "@mui/icons-material/WorkspacesSharp";
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';

interface DashboardHeaderProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onOpenConnectionDrawer?: () => void;
  onOpenLeftDrawer?: () => void;
  onOpenTestbedModal?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  mode,
  onToggleMode,
  onOpenConnectionDrawer,
  onOpenLeftDrawer,
  onOpenTestbedModal
}) => {
  const { devices } = useDeviceControllerContext();
  const anyConnected = devices.some(d => d.isConnected);
  const [pulse] = useState(false);

  return (
    <AppBar position="sticky" elevation={2} sx={{ zIndex: 1201, top: 0 }}>
      <Toolbar sx={{ minHeight: 48, px: 2 }}>
        {onOpenLeftDrawer && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onOpenLeftDrawer}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          SRDriver Dashboard
        </Typography>
        {onOpenTestbedModal && (
          <IconButton
            color="primary"
            onClick={onOpenTestbedModal}
            sx={{ mr: 1 }}
            aria-label="Open Testbed Modal"
          >
            <WorkspacesSharpIcon />
          </IconButton>
        )}
        {onOpenConnectionDrawer && (
          <Tooltip title={anyConnected ? "Device Connected" : "No Device Connected"}>
            <IconButton
              color={anyConnected ? "primary" : "error"}
              onClick={onOpenConnectionDrawer}
              sx={{ mr: 1 }}
              aria-label="Show Lights Connection"
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: pulse ? 'scale(1.25)' : 'scale(1)',
                boxShadow: pulse ? `0 0 12px 4px ${anyConnected ? '#1976d2' : '#d32f2f'}55` : 'none',
                borderRadius: '50%',
              }}>
                {anyConnected ? <PowerSettingsNewIcon /> : <HighlightOffIcon />}
              </span>
            </IconButton>
          </Tooltip>
        )}
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={onToggleMode} color="default" />}
          label={mode === 'dark' ? 'Dark' : 'Light'}
          sx={{ mr: 2 }}
        />
        {/* <DevAppStateViewer />  // Disabled for performance while working with large audio/plot data */}
      </Toolbar>
    </AppBar>
  );
};

export default DashboardHeader; 