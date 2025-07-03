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
    <FakeAudioDataProvider type="sine" length={256}>
        <PlaybackProvider>
            <Box
                sx={{
                    width: "800px",
                    height: "200px",
                    margin: "0 0",
                    background: "#42f5bf",
                    padding: "1rem",
                    minHeight: 120,
                }}
            >
                <TimelineHeader />
            </Box>
        </PlaybackProvider>
    </FakeAudioDataProvider>
);