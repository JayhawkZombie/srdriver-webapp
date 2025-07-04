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
    const { devices, addDevice } = useDeviceControllerContext();
    const theme = useTheme();
    const deviceMetadata = useAppStore(state => state.deviceMetadata);
    const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null);
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        if (!selectedDeviceId && devices.length > 0) {
            setSelectedDeviceId(devices[0].id);
        }
    }, [devices, selectedDeviceId]);
    console.log('devices', devices);

    const selectedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;

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
            <IconButton
                size="small"
                color="primary"
                onClick={addDevice}
                sx={{ position: "absolute", top: 8, right: 8 }}
                aria-label="Add Device"
            >
                <AddIcon fontSize="small" />
            </IconButton>
            {devices.length === 0 ? (
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
                            {devices.map((device) => {
                                const isSelected = selectedDeviceId === device.id;
                                return (
                                    <Box
                                        key={device.id}
                                        onClick={() => setSelectedDeviceId(device.id)}
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
                                        <ConnectionTools deviceId={device.id} />
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
                            <DeviceControls deviceId={selectedDevice.id} />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default LightsConnectionCard;