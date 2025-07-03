import React from "react";
import BarWaveform from "./BarWaveform";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { PlaybackProvider } from "./PlaybackContext";
import { useAppStore } from "../../../store/appStore";
import { selectBarData } from "../../../store/selectors";

export default {
  title: "RefactoredTimeline/BarWaveform",
};

// BarWaveform now gets its data from Zustand
const BarWaveformFromStore = (props: Omit<React.ComponentProps<typeof BarWaveform>, 'data'>) => {
  const data = useAppStore(selectBarData);
  if (!Array.isArray(data) || data.length === 0) return null;
  return <BarWaveform data={data} {...props} />;
};

export const Random = () => (
  <FakeAppStateStoryProvider mockType="randomBar">
    <BarWaveformFromStore width={400} height={80} />
  </FakeAppStateStoryProvider>
);

export const Sine = () => (
  <FakeAppStateStoryProvider mockType="sineBar">
    <BarWaveformFromStore width={400} height={80} color="#4fc3f7" />
  </FakeAppStateStoryProvider>
);

export const BeatPattern = () => (
  <FakeAppStateStoryProvider mockType="beatBar">
    <BarWaveformFromStore width={400} height={80} color="#ffb300" barWidth={6} />
  </FakeAppStateStoryProvider>
);

export const ScreenshotLike = () => (
  <FakeAppStateStoryProvider mockType="screenshotBar">
    <BarWaveformFromStore width={600} height={80} color="#bbb" barWidth={1} />
  </FakeAppStateStoryProvider>
); 