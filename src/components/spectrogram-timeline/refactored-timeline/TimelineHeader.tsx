import React from "react";
import PlaybackControls from "./PlaybackControls";
import styles from "./TimelineHeader.module.css";
import { useContainerSize } from "./useContainerSize";
import { SvgVisualizationWrapper } from "./SvgVisualizationWrapper";
import BarWaveform from "./BarWaveform";
import { useWaveformAudioData } from "./WaveformAudioDataContext";

interface TimelineHeaderProps {
  children?: React.ReactNode;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children }) => {
  const [containerRef] = useContainerSize();
  const { barData } = useWaveformAudioData();

  return (
    <div className={styles.timelineHeader} ref={containerRef}>
      <div className={styles.headerControls}>
        <PlaybackControls />
      </div>
      <div className={styles.headerVis}>
        <SvgVisualizationWrapper className={styles.svgWrapper} minHeight={80} minWidth={120}>
          {({ width, height }) => (
            <BarWaveform data={barData} width={width} height={height} color="#4fc3f7" barWidth={1} />
          )}
        </SvgVisualizationWrapper>
      </div>
      {children}
    </div>
  );
};

export default TimelineHeader; 