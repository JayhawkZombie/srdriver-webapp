import React from "react";
import TimelineHeader from "./TimelineHeader";
import { PlaybackProvider } from "./PlaybackContext";
import { Box } from "@mui/material";
import { FakeAppStateStoryProvider } from "../../store/FakeAppStateStoryProvider";

export default {
    title: "RefactoredTimeline/TimelineHeader",
};

export const Basic = () => (
    <Box
        sx={{
            width: "800px",
            height: "300px",
            margin: "0 0",
            background: "#00fca8",
            padding: "1rem",
            minHeight: 120,
        }}
    >
            <PlaybackProvider>
                <TimelineHeader />
            </PlaybackProvider>
    </Box>
);
