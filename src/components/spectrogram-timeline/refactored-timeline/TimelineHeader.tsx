import React from "react";
import PlaybackControls from "./PlaybackControls";
import Waveform from "./Waveform";
import styles from "./TimelineHeader.module.css";
import { useContainerSize } from "./useContainerSize";

// Mock amplitude data for now
const mockWaveformData = Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * 4 * Math.PI));

interface TimelineHeaderProps {
  children?: React.ReactNode;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children }) => {
  const [containerRef, { width, height }] = useContainerSize();

  return (
      <div className={styles.timelineHeader} ref={containerRef}>
          <div className={styles.headerControls}>
              <PlaybackControls />
          </div>
          <div className={styles.headerVis}>
              <div className={styles.svgWrapper}>
                  <Waveform
                      data={mockWaveformData}
                      width={width}
                      height={height / 2}
                  />
              </div>
          </div>
          {children}
      </div>
  );
};

export default TimelineHeader; 