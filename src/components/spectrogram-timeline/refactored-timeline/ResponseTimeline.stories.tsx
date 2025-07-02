import React from "react";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider } from "./PlaybackContext";

export default {
  title: "RefactoredTimeline/ResponseTimeline",
  component: ResponseTimeline,
};

export const Basic = () => (
  <PlaybackProvider>
    <ResponseTimeline />
  </PlaybackProvider>
); 