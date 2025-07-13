import React from "react";
import { Icon } from "@blueprintjs/core";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onRestart?: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onRestart,
}) => {
  const handlePlayPause = () => {
    if (isPlaying) onPause();
    else onPlay();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
        <Icon icon={isPlaying ? "pause" : "play"} />
      </button>
      <button onClick={onRestart || (() => onSeek(0))} title="Restart">
                  <Icon icon="refresh" />
      </button>
      <input
        type="range"
                  min={0}
        max={duration}
        step={0.01}
                  value={currentTime}
        onChange={e => onSeek(Number(e.target.value))}
        style={{ width: 120 }}
              />
      <span style={{ fontFamily: 'monospace', color: '#fff' }}>{currentTime.toFixed(2)}s</span>
      </div>
  );
};

export default PlaybackControls; 