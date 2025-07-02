import React from "react";
import TimelineHeader from "./TimelineHeader";
import { PlaybackProvider } from "./PlaybackContext";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";

export default {
  title: "RefactoredTimeline/TimelineHeader",
};

export const Basic = () => {
  return (
    <PlaybackProvider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#181818', padding: 24, minHeight: 120 }}>
        <TimelineHeader />
      </div>
    </PlaybackProvider>
  );
};