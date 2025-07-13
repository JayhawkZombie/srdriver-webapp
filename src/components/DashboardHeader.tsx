import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch, Tooltip } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import WorkspacesSharpIcon from "@mui/icons-material/WorkspacesSharp";
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import BugReportIcon from '@mui/icons-material/BugReport';
import SpeedIcon from '@mui/icons-material/Speed';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { useDevToolsEnabled, useSetDevToolsEnabled } from '../store/appStore';
import { Popover, PopoverInteractionKind, Position as BPPosition } from '@blueprintjs/core';

interface DashboardHeaderProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onOpenConnectionDrawer?: () => void;
  onOpenLeftDrawer?: () => void;
  onOpenTestbedModal?: () => void;
  onOpenLogDrawer?: () => void;
  onOpenDevAppStateDrawer?: () => void;
  profilingPopoverContent?: React.ReactNode;
  profilingOpen?: boolean;
  setProfilingOpen?: (open: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  mode,
  onToggleMode,
  onOpenConnectionDrawer,
  onOpenLeftDrawer,
  onOpenTestbedModal,
  onOpenLogDrawer,
  onOpenDevAppStateDrawer,
  profilingPopoverContent,
  profilingOpen,
  setProfilingOpen,
}) => {
  const { devices } = useDeviceControllerContext();
  const anyConnected = devices.some(d => d.isConnected);
  const [pulse] = useState(false);
  const devToolsEnabled = useDevToolsEnabled();
  const setDevToolsEnabled = useSetDevToolsEnabled();

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
        {process.env.NODE_ENV === 'development' && onOpenDevAppStateDrawer && (
          <Tooltip title="Open App State Viewer">
            <IconButton color="inherit" onClick={onOpenDevAppStateDrawer} aria-label="Open App State Viewer" sx={{ ml: 0, mr: 1 }}>
              <DeveloperModeIcon />
            </IconButton>
          </Tooltip>
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
        {onOpenLogDrawer && (
          <Tooltip title="Open Log Drawer">
            <IconButton color="inherit" onClick={onOpenLogDrawer} aria-label="Open Log Drawer">
              <BugReportIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={devToolsEnabled ? "Hide Dev Tools" : "Show Dev Tools"}>
          <IconButton color={devToolsEnabled ? "primary" : "inherit"} onClick={() => setDevToolsEnabled(!devToolsEnabled)} aria-label="Toggle Dev Tools" sx={{ ml: 1, mr: 1 }}>
            <DeveloperModeIcon />
          </IconButton>
        </Tooltip>
        {devToolsEnabled && profilingPopoverContent && typeof profilingOpen === 'boolean' && setProfilingOpen && (
          <Popover
            isOpen={profilingOpen}
            onClose={() => setProfilingOpen(false)}
            interactionKind={PopoverInteractionKind.CLICK}
            position={BPPosition.BOTTOM}
            minimal={false}
            popoverClassName={mode === 'dark' ? 'bp5-dark' : ''}
            enforceFocus={false}
            autoFocus={false}
            content={profilingPopoverContent}
          >
            <IconButton
              color="inherit"
              onClick={() => setProfilingOpen(!profilingOpen)}
              aria-label="Open Profiler"
              sx={{ ml: 1, mr: 1 }}
            >
              <SpeedIcon />
            </IconButton>
          </Popover>
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