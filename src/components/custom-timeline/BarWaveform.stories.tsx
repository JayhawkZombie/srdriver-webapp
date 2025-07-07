import React from "react";
import BarWaveform from "./BarWaveform";
import { FakeAppStateStoryProvider } from "../../store/FakeAppStateStoryProvider";

export default {
  title: "RefactoredTimeline/BarWaveform",
};

// BarWaveform gets its data from props or local state
const mockBarData = Array.from({ length: 64 }, () => Math.random());
const BarWaveformFromMock = (props: Omit<React.ComponentProps<typeof BarWaveform>, 'data'>) => {
  return <BarWaveform data={mockBarData} {...props} />;
};

export const Random = () => (
  <BarWaveformFromMock width={400} height={80} />
);

export const Sine = () => (
  <FakeAppStateStoryProvider mockType="sineBar">
    <BarWaveformFromMock width={400} height={80} color="#4fc3f7" />
  </FakeAppStateStoryProvider>
);

export const BeatPattern = () => (
  <FakeAppStateStoryProvider mockType="beatBar">
    <BarWaveformFromMock width={400} height={80} color="#ffb300" barWidth={6} />
  </FakeAppStateStoryProvider>
);

export const ScreenshotLike = () => (
  <FakeAppStateStoryProvider mockType="screenshotBar">
    <BarWaveformFromMock width={600} height={80} color="#bbb" barWidth={1} />
  </FakeAppStateStoryProvider>
); 