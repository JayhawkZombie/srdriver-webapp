import React from "react";
import { usePlayback } from "./PlaybackContext";
import IconControl from "./IconControl";
import SliderControl from "./SliderControl";
import { Icon } from "@blueprintjs/core";
import styles from "./PlaybackControls.module.css";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";

interface PlaybackControlsProps {
  children?: React.ReactNode;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ children }) => {
  const { currentTime, isPlaying, play, pause, seek, totalDuration } = usePlayback();
  const { enabled: autoplayEnabled, toggleAutoplay } = usePlaybackAutoAdvance();

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else play();
  };

  return (
      <div className={styles.playbackControls}>
          <div className={styles.controlsRow}>
              <IconControl onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
                  <Icon
                    icon={isPlaying ? "pause" : "play"}
                  />
              </IconControl>
              <IconControl onClick={() => seek(0)} title="Restart">
                  <Icon icon="refresh" />
              </IconControl>
              <IconControl
                  onClick={toggleAutoplay}
                  title={
                      autoplayEnabled ? "Disable Autoplay" : "Enable Autoplay"
                  }
              >
                  <Icon icon={"run-history"} style={{ color: autoplayEnabled ? "green" : "red" }} />
              </IconControl>
              <SliderControl
                  min={0}
                  max={totalDuration}
                  value={currentTime}
                  onChange={seek}
                  label={undefined}
              />
              <span className={styles.time}>{currentTime.toFixed(2)}s</span>
          </div>
          {children && <div className={styles.children}>{children}</div>}
      </div>
  );
};

export default PlaybackControls; 