import React from "react";
import { PlaybackProvider } from "./PlaybackContext";
import { KonvaTimelineDemo } from "./KonvaTimelineDemo";

export default {
  title: "RefactoredTimeline/KonvaTimelineDemo",
};

export const FullCustomKonvaTimeline = () => (
  <PlaybackProvider>
    <KonvaTimelineDemo />
  </PlaybackProvider>
); 