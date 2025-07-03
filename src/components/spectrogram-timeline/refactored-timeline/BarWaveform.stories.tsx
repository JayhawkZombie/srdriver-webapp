import React from "react";
import BarWaveform from "./BarWaveform";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";

export default {
  title: "RefactoredTimeline/BarWaveform",
};

// Helper to generate mock bar data
const makeRandomBarData = (length: number) => Array.from({ length }, () => Math.random());
const makeSineBarData = (length: number) => Array.from({ length }, (_, i) => Math.abs(Math.sin((i / length) * 4 * Math.PI)));
const makeBeatBarData = (length: number) => Array.from({ length }, (_, i) => (i % 32 < 4 ? 1 : Math.random() * 0.4));
const makeScreenshotLikeBarData = (length: number) => {
  const N = length;
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    let env = 1;
    if (t < 0.1) env = t / 0.1;
    else if (t > 0.9) env = (1 - t) / 0.1;
    const beat = Math.sin(2 * Math.PI * t * 8) * 0.2 + 0.8;
    const noise = 0.85 + Math.random() * 0.15;
    return Math.max(0, Math.min(1, env * beat * noise));
  });
};

export const Random = () => (
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { barData: makeRandomBarData(64), fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
    <BarWaveform data={makeRandomBarData(64)} width={400} height={80} />
  </FakeAppStateStoryProvider>
);

export const Sine = () => (
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { barData: makeSineBarData(64), fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
    <BarWaveform data={makeSineBarData(64)} width={400} height={80} color="#4fc3f7" />
  </FakeAppStateStoryProvider>
);

export const BeatPattern = () => (
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { barData: makeBeatBarData(64), fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
    <BarWaveform data={makeBeatBarData(64)} width={400} height={80} color="#ffb300" barWidth={6} />
  </FakeAppStateStoryProvider>
);

export const ScreenshotLike = () => (
  <FakeAppStateStoryProvider initialState={{
    audio: {
      analysis: { barData: makeScreenshotLikeBarData(400), fftSequence: [], summary: null, audioBuffer: null },
      data: { metadata: null, analysis: null }
    }
  }}>
    <BarWaveform data={makeScreenshotLikeBarData(400)} width={600} height={80} color="#bbb" barWidth={1} />
  </FakeAppStateStoryProvider>
); 