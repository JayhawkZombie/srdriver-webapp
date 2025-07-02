import React from "react";
import PlaybackControls from "./PlaybackControls";
import { PlaybackProvider } from "./PlaybackContext";

export default {
  title: "RefactoredTimeline/PlaybackControls",
};

export const Basic = () => (
  <PlaybackProvider>
    <PlaybackControls>
      <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>Child content (e.g., spectrogram)</div>
      <div style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>
        <strong>Tip:</strong> The <span style={{fontWeight:'bold'}}>circular arrows</span> button toggles autoplay (auto-advance) for demo/testing.
      </div>
    </PlaybackControls>
  </PlaybackProvider>
); 