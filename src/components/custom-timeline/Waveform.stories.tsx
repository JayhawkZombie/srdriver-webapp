import React from "react";
import Waveform from "./Waveform";
import { FakeAppStateStoryProvider } from "../../store/FakeAppStateStoryProvider";
import { PlaybackProvider } from "./PlaybackContext";
import { useAppStore } from "../../store/appStore";

export default {
  title: "RefactoredTimeline/Waveform",
};

export const SineNew = {
  title: "RefactoredTimeline/Waveform/SineNew",
  component: Waveform,
  args: {
    width: 400,
    height: 80,
  },
  render: (args) => {
    const waveform = useAppStore(state => state.audio.analysis.waveform);
    if (!waveform) return null;
    return <Waveform waveform={waveform} width={args.width} height={args.height} />;
  },
  decorators: [
    (Story) => (
      <FakeAppStateStoryProvider mockType="sineBar">
        <PlaybackProvider totalDuration={15}>
          <Story />
        </PlaybackProvider>
      </FakeAppStateStoryProvider>
    ),
  ],
}

export const Sine = () => (
  // <FakeAppStateStoryProvider mockType="sine">
    <PlaybackProvider>
      <div>
        <div style={{ marginBottom: 8 }}>Without peak trace:</div>
        <Waveform width={400} height={80} />
        <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
        <Waveform width={400} height={80} showPeakTrace />
      </div>
    </PlaybackProvider>
  // </FakeAppStateStoryProvider>
);

export const Noise = () => (
  // <FakeAppStateStoryProvider mockType="noise">
    <PlaybackProvider>
      <div>
        <div style={{ marginBottom: 8 }}>Without peak trace:</div>
        <Waveform width={400} height={80} />
        <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
        <Waveform width={400} height={80} showPeakTrace />
      </div>
    </PlaybackProvider>
  // </FakeAppStateStoryProvider>
); 