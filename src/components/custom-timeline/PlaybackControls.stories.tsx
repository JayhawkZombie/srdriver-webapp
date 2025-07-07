import React, { useState } from "react";
import PlaybackControls from "./PlaybackControls";

export default {
  title: "CustomTimeline/PlaybackControls",
};

export const Basic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 30;

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleSeek = (t: number) => setCurrentTime(t);
  const handleRestart = () => setCurrentTime(0);

  // Simulate playhead movement when playing
  React.useEffect(() => {
    if (!isPlaying) return;
    let raf: number;
    const step = () => {
      setCurrentTime((t) => {
        if (t >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return t + 0.016;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration]);

  return (
    <div style={{ padding: 32, background: '#23272f' }}>
      <PlaybackControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeek={handleSeek}
        onRestart={handleRestart}
      />
    </div>
  );
};
