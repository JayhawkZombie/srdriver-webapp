import React from "react";
import TimelineHeader from "./TimelineHeader";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider } from "./PlaybackContext";
import { FakeAudioDataProvider } from "./WaveformAudioDataContext";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";

export default {
  title: "RefactoredTimeline/TimelineHeader + ResponseTimeline",
};

const WithFakeAudioData = () => {
    usePlaybackAutoAdvance(true);
    return (
        <FakeAudioDataProvider type="screenshot" length={600}>
            <div
                style={{
                    width: "100%",
                    maxWidth: 900,
                    margin: "0 auto",
                    background: "#181818",
                    padding: 24,
                    minHeight: 320,
                }}
            >
                <TimelineHeader />
                <div style={{ height: 24 }} />
                <ResponseTimeline />
            </div>
        </FakeAudioDataProvider>
    );
};

export const UnifiedDemo = () => (
  <PlaybackProvider totalDuration={15}>
    <FakeAudioDataProvider type="screenshot" length={600}>
      <PlaybackAutoAdvanceEnabler />
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', background: '#181818', padding: 24, minHeight: 320 }}>
        <TimelineHeader />
        <div style={{ height: 24 }} />
        <ResponseTimeline />
      </div>
    </FakeAudioDataProvider>
  </PlaybackProvider>
);

function PlaybackAutoAdvanceEnabler() {
  usePlaybackAutoAdvance(true);
  return null;
} 