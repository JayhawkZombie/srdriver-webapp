import React from "react";
import BarWaveform from "./BarWaveform";
import { FakeAudioDataProvider, useWaveformAudioData } from "./WaveformAudioDataContext";

export default {
  title: "RefactoredTimeline/BarWaveform",
};

const BarWaveformWithFakeData = ({ type, ...props }: { type: any; width: number; height: number; color?: string; barWidth?: number }) => {
  const { barData } = useWaveformAudioData();
  return <BarWaveform data={barData} {...props} />;
};

export const Random = () => (
  <FakeAudioDataProvider type="random" length={64}>
    <BarWaveformWithFakeData type="random" width={400} height={80} />
  </FakeAudioDataProvider>
);

export const Sine = () => (
  <FakeAudioDataProvider type="sine" length={64}>
    <BarWaveformWithFakeData type="sine" width={400} height={80} color="#4fc3f7" />
  </FakeAudioDataProvider>
);

export const BeatPattern = () => (
  <FakeAudioDataProvider type="beat" length={64}>
    <BarWaveformWithFakeData type="beat" width={400} height={80} color="#ffb300" barWidth={6} />
  </FakeAudioDataProvider>
);

export const ScreenshotLike = () => (
  <FakeAudioDataProvider type="screenshot" length={400}>
    <BarWaveformWithFakeData type="screenshot" width={600} height={80} color="#bbb" barWidth={1} />
  </FakeAudioDataProvider>
); 