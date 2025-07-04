import React from "react";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import IconControl from "./IconControl";
import { Icon } from "@blueprintjs/core";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";

export default {
  title: "RefactoredTimeline/PlaybackContext",
};

function PlaybackControlsTest() {
  const { currentTime, isPlaying, play, pause, seek, totalDuration } = usePlayback();

  // Animate currentTime if playing
  React.useEffect(() => {
    if (!isPlaying) return;
    let raf: number;
    let last: number | null = null;
    function step(ts: number) {
      if (last === null) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      seek(Math.min(currentTime + dt, totalDuration));
      if (currentTime + dt < totalDuration) {
        raf = requestAnimationFrame(step);
      } else {
        pause();
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTime, totalDuration]);

  return (
    <Box sx={{ width: 500, p: 2, bgcolor: "#222", borderRadius: 2, color: "#fff", mx: "auto" }}>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <IconControl onClick={play} title="Play">
          <Icon icon="play" />
        </IconControl>
        <IconControl onClick={pause} title="Pause">
          <Icon icon="pause" />
        </IconControl>
        <IconControl onClick={() => seek(0)} title="Restart">
          <Icon icon="refresh" />
        </IconControl>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1 }}>
        <Slider
          min={0}
          max={totalDuration}
          step={0.01}
          value={currentTime}
          onChange={(_, v) => seek(Number(v))}
          sx={{ flex: 1, mx: 2 }}
        />
        <Typography variant="body2" sx={{ minWidth: 60, textAlign: "right" }}>
          {currentTime.toFixed(2)}s
        </Typography>
      </Box>
      <Box sx={{ fontFamily: "monospace", fontSize: 15, mt: 1 }}>
        isPlaying: {isPlaying ? "true" : "false"} | totalDuration: {totalDuration} | currentTime: {currentTime.toFixed(2)}
      </Box>
    </Box>
  );
}

export const BasicControls = () => (
  <FakeAppStateStoryProvider mockType="sine">
    <PlaybackProvider totalDuration={15}>
      <PlaybackControlsTest />
    </PlaybackProvider>
  </FakeAppStateStoryProvider>
); 