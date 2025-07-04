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
import { useDeviceMetadata, useDeviceConnection, useDeviceState } from '../../store/appStore';
import ConnectionTools from './ConnectionTools';

const LightsConnectionCard: React.FC = () => {
    const { devices, connectDevice } = useDeviceControllerContext();
    const theme = useTheme();
    const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null);
    const [visible, setVisible] = React.useState(true);

    // Only show devices that are actually connecting or connected
    const visibleDevices = devices.filter(d => d.isConnecting || d.isConnected);

    React.useEffect(() => {
        if (!selectedDeviceId && visibleDevices.length > 0) {
            setSelectedDeviceId(visibleDevices[0].browserId);
        }
    }, [visibleDevices, selectedDeviceId]);
    console.log('devices', visibleDevices);

    const selectedDevice = selectedDeviceId ? visibleDevices.find(d => d.browserId === selectedDeviceId) : null;

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

    console.log("devices", devices);

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: 380 }}>
            <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, width: '100%', textAlign: 'center' }}
            >
                Visualizer → Lights Connection
            </Typography>
            <IconButton
                size="small"
                color="primary"
                onClick={() => connectDevice()}
                sx={{ position: "absolute", top: 8, right: 8 }}
                aria-label="Add Device"
            >
                <AddIcon fontSize="small" />
            </IconButton>
            {visibleDevices.length === 0 ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, mb: 1 }}
                >
                    No devices connected.
                </Typography>
            ) : (
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
                            {visibleDevices.map((device) => {
                                const isSelected = selectedDeviceId === device.browserId;
                                return (
                                    <Box
                                        key={device.browserId}
                                        onClick={() => setSelectedDeviceId(device.browserId)}
                                        sx={{
                                            flex: 1,
                                            justifyContent: "flex-start",
                                            textTransform: "none",
                                            minWidth: 0,
                                            px: 1,
                                            py: 0.5,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            opacity: 1,
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
                                    >
                                        <ConnectionTools deviceId={device.browserId} />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                    {selectedDevice && (
                        <Box sx={{ mt: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                                Device Controls
                            </Typography>
                            <DeviceControls deviceId={selectedDevice.browserId} />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default LightsConnectionCard;