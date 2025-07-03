import React from "react";
import PlaybackControls from "./PlaybackControls";
import Waveform from "./Waveform";
import styles from "./TimelineHeader.module.css";
import { useContainerSize } from "./useContainerSize";
import { useWaveformAudioData } from "./WaveformAudioDataContext";

interface TimelineHeaderProps {
  children?: React.ReactNode;
}

const HEIGHT = 100;

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children }) => {
  const [containerRef, { width }] = useContainerSize();
  const { waveformData } = useWaveformAudioData();

  return (
    <div className={styles.timelineHeader} ref={containerRef}>
      <div className={styles.waveformOverlay}>
        <Waveform data={waveformData} width={width} height={HEIGHT} />
      </div>
      <div className={styles.controlsOverlay}>
        <PlaybackControls />
      </div>
      {children}
    </div>
  );
};

export default TimelineHeader; 