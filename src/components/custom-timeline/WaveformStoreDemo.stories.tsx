import React from "react";
import { PlaybackProvider } from "./PlaybackContext";
import AudioAnalysisPanel from "./AudioAnalysisPanel";

export default {
  title: "RefactoredTimeline/WaveformStoreDemo",
};

export const StoreDrivenWaveform = () => {
  return (
    <PlaybackProvider>
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: 16 }}>
        <h3>Store-Driven Waveform Upload & Progress Demo</h3>
        <AudioAnalysisPanel />
      </div>
    </PlaybackProvider>
  );
}
