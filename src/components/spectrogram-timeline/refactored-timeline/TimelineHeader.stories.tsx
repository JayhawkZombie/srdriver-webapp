import React from "react";
import TimelineHeader from "./TimelineHeader";
import { PlaybackProvider } from "./PlaybackContext";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";
import { Box } from "@mui/material";
import { FakeAudioDataProvider } from "./WaveformAudioDataContext";

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
        <FakeAudioDataProvider type="sine" length={256}>
            <PlaybackProvider>
                <TimelineHeader />
            </PlaybackProvider>
        </FakeAudioDataProvider>
    </Box>
);
