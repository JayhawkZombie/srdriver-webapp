import React from "react";
import Waveform from "./Waveform";
import { FakeAudioDataProvider, useWaveformAudioData } from "./WaveformAudioDataContext";

export default {
  title: "RefactoredTimeline/Waveform",
};

const WaveformWithFakeData = ({ type, ...props }: { type: any; width: number; height: number; showPeakTrace?: boolean }) => {
  const { waveformData } = useWaveformAudioData();
  return <Waveform data={waveformData} {...props} />;
};

export const Sine = () => (
  <FakeAudioDataProvider type="sine" length={256}>
    <div>
      <div style={{ marginBottom: 8 }}>Without peak trace:</div>
      <WaveformWithFakeData type="sine" width={400} height={80} />
      <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
      <WaveformWithFakeData type="sine" width={400} height={80} showPeakTrace />
    </div>
  </FakeAudioDataProvider>
);

export const Noise = () => (
  <FakeAudioDataProvider type="random" length={256}>
    <div>
      <div style={{ marginBottom: 8 }}>Without peak trace:</div>
      <WaveformWithFakeData type="random" width={400} height={80} />
      <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
      <WaveformWithFakeData type="random" width={400} height={80} showPeakTrace />
    </div>
  </FakeAudioDataProvider>
); 