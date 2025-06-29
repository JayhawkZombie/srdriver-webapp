import React from 'react';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import WorkspacesSharpIcon from "@mui/icons-material/WorkspacesSharp";

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
}) => (
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
        <IconButton
          color="primary"
          onClick={onOpenConnectionDrawer}
          sx={{ mr: 1 }}
          aria-label="Show Lights Connection"
        >
          <PowerSettingsNewIcon />
        </IconButton>
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

export default DashboardHeader; 