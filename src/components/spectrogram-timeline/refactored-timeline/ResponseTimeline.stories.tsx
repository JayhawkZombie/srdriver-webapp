import React from "react";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";

function PlaybackAutoAdvanceEnabler() {
  usePlaybackAutoAdvance(true);
  return null;
}

function PlaybackAutoStart() {
  const { play, isPlaying } = usePlayback();
  React.useEffect(() => {
    if (!isPlaying) play();
  }, [isPlaying, play]);
  return null;
}

export default {
  title: "RefactoredTimeline/ResponseTimeline",
  component: ResponseTimeline,
};

export const Basic = () => (
  <PlaybackProvider>
    <PlaybackAutoAdvanceEnabler />
    <PlaybackAutoStart />
    <ResponseTimeline />
  </PlaybackProvider>
); 