import React from "react";
import Box from "@mui/material/Box";
import ColorPicker from "./ColorPicker";
import { Typography } from "@mui/material";

export default {
    title: "Controls/ColorPicker",
};

export const Basic = () => {
    const [color, setColor] = React.useState("#000000");
    return (
        <Box sx={{ display: "flex", gap: 1, bgcolor: "#222", p: 2, borderRadius: 2, alignItems: "flex-start", width: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>
                Color Picker
            </Typography>
            <ColorPicker color={color} onChange={setColor} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
                <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5, color: "black" }}>
                    Color: {color}
                </Typography>
            </Box>
        </Box>
    );
}
