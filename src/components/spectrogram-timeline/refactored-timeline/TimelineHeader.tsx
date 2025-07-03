import React from "react";
import PlaybackControls from "./PlaybackControls";
import Waveform from "./Waveform";
import styles from "./TimelineHeader.module.css";
import { useContainerSize } from "./useContainerSize";
import { SvgVisualizationWrapper } from "./SvgVisualizationWrapper";

// Mock amplitude data for now
const mockWaveformData = Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * 4 * Math.PI));

interface TimelineHeaderProps {
  children?: React.ReactNode;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children }) => {
  const [containerRef] = useContainerSize();

  return (
    <div className={styles.timelineHeader} ref={containerRef}>
      <div className={styles.headerControls}>
        <PlaybackControls />
      </div>
      <div className={styles.headerVis}>
        <SvgVisualizationWrapper className={styles.svgWrapper} minHeight={80} minWidth={120}>
          {({ width, height }) => (
            <Waveform data={mockWaveformData} width={width} height={height} />
          )}
        </SvgVisualizationWrapper>
      </div>
      {children}
    </div>
  );
};

export default TimelineHeader; 