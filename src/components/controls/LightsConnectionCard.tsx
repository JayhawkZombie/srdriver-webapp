import React from "react";
import {
    Typography,
    Box,
    Button,
    IconButton,
    Stack,
    useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { useDeviceControllerContext } from "../../controllers/DeviceControllerContext";
import DeviceControls from "./DeviceControls";
import { useAppStore } from "../../store/appStore";
import ConnectionTools from './ConnectionTools';

const LightsConnectionCard: React.FC = () => {
    const {
        devices,
        addDevice,
        updateDevice,
    } = useDeviceControllerContext();
    const theme = useTheme();
    const activeDeviceId = useAppStore(state => state.activeDeviceId);
    const setActiveDeviceId = useAppStore(state => state.setActiveDeviceId);
    const activeDevice = devices.find((d) => d.id === activeDeviceId);
    const [visible, setVisible] = React.useState(true);

    // Auto-select the first connected device
    React.useEffect(() => {
        if (!activeDeviceId) {
            const firstConnected = devices.find(d => d.isConnected);
            if (firstConnected) {
                setActiveDeviceId(firstConnected.id);
            }
        }
        // Only run when devices change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [devices]);

    // Debug: log current activeDeviceId and selected device
    console.log('[LightsConnectionCard] activeDeviceId:', activeDeviceId, 'activeDevice:', activeDevice);

    if (!visible) {
        return (
            <Box
                onClick={() => setVisible(true)}
                sx={{
                    position: 'fixed',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2000,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                    boxShadow: 4,
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: 'primary.dark' },
                }}
                aria-label="Show Lights Connection"
            >
                <PowerSettingsNewIcon fontSize="medium" />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: 380 }}>
            <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, width: '100%', textAlign: 'center' }}
            >
                Visualizer → Lights Connection
            </Typography>
            {devices.length === 0 ? (
                <Button
                    variant="contained"
                    fullWidth
                    onClick={addDevice}
                    sx={{ mb: 1 }}
                >
                    Add Device
                </Button>
            ) : (
                <IconButton
                    size="small"
                    color="primary"
                    onClick={addDevice}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    aria-label="Add Device"
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            )}
            {devices.length === 0 ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, mb: 1 }}
                >
                    No devices added.
                </Typography>
            ) : (
                <>
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                Devices:
                            </Typography>
                            <Stack spacing={0.5}>
                                {devices.map((device) => {
                                    const isSelected = activeDeviceId === device.id && device.isConnected;
                                    return (
                                        <Box
                                            key={device.id}
                                            onClick={() => {
                                                if (device.isConnected) {
                                                    console.log('[LightsConnectionCard] setActiveDeviceId:', device.id);
                                                    setActiveDeviceId(device.id);
                                                }
                                            }}
                                            sx={{
                                                flex: 1,
                                                justifyContent: "flex-start",
                                                textTransform: "none",
                                                minWidth: 0,
                                                px: 1,
                                                py: 0.5,
                                                fontSize: 14,
                                                cursor: device.isConnected ? 'pointer' : 'default',
                                                opacity: device.isConnected ? 1 : 0.6,
                                                border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                                                borderRadius: 1,
                                                background: isSelected ? theme.palette.action.selected : 'transparent',
                                                color: theme.palette.text.primary,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                width: '100%',
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-disabled={!device.isConnected}
                                        >
                                            <ConnectionTools deviceId={device.id} />
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                        {activeDevice && activeDevice.isConnected && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                                    Device Controls
                                </Typography>
                                <DeviceControls deviceId={activeDevice.id} onUpdate={update => updateDevice(activeDevice.id, update)} />
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default LightsConnectionCard;