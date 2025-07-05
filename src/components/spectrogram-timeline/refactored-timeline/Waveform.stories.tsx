import React from "react";
import Waveform from "./Waveform";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { PlaybackProvider } from "./PlaybackContext";

export default {
  title: "RefactoredTimeline/Waveform",
};

export const Sine = () => (
  <FakeAppStateStoryProvider mockType="sine">
    <PlaybackProvider>
      <div>
        <div style={{ marginBottom: 8 }}>Without peak trace:</div>
        <Waveform width={400} height={80} />
        <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
        <Waveform width={400} height={80} showPeakTrace />
      </div>
    </PlaybackProvider>
  </FakeAppStateStoryProvider>
);

export const Noise = () => (
  <FakeAppStateStoryProvider mockType="noise">
    <PlaybackProvider>
      <div>
        <div style={{ marginBottom: 8 }}>Without peak trace:</div>
        <Waveform width={400} height={80} />
        <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
        <Waveform width={400} height={80} showPeakTrace />
      </div>
    </PlaybackProvider>
  </FakeAppStateStoryProvider>
); 