import React from "react";
import Waveform from "./Waveform";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { PlaybackProvider } from "./PlaybackContext";

export default {
  title: "RefactoredTimeline/Waveform",
};

// Helper to generate mock waveform data
const makeSineWave = (length: number) => Array.from({ length }, (_, i) => Math.sin((i / length) * 4 * Math.PI));
const makeNoise = (length: number) => Array.from({ length }, () => Math.random() * 2 - 1);

export const Sine = () => (
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { waveform: makeSineWave(256), duration: 4, fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
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
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { waveform: makeNoise(256), duration: 4, fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
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