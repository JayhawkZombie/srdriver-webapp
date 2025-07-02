import React from "react";
import PlaybackControls from "./PlaybackControls";
import Waveform from "./Waveform";
import styles from "./TimelineHeader.module.css";

// Mock amplitude data for now
const mockWaveformData = Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * 4 * Math.PI));

interface TimelineHeaderProps {
  children?: React.ReactNode;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children }) => (
  <div className={styles.timelineHeader}>
    <PlaybackControls />
    <Waveform data={mockWaveformData} width={400} height={64} />
    {children}
  </div>
);

export default TimelineHeader; 