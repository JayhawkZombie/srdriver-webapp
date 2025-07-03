import React from "react";
import { getPeakIndex, waveformToSvgPoints, getPeakCoordinate } from "./audioMath";
import styles from "./Waveform.module.css";

export interface WaveformProps {
  data: number[]; // amplitudes, -1 to 1
  width: number;
  height: number;
  showPeakTrace?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ data, width, height, showPeakTrace }) => {
  // Use shared math for SVG points and peak tracing
  const points = waveformToSvgPoints(data, width, height);
  const peakIdx = getPeakIndex(data);
  const [peakX, peakY] = getPeakCoordinate(data, peakIdx, width, height);

  return (
    <div className={styles.waveformRoot} style={{ width, height }}>
      <svg width={width} height={height} className={styles.waveformSvg}>
        <polyline
          fill="none"
          stroke="#4fc3f7"
          strokeWidth={2}
          points={points}
        />
        {showPeakTrace && (
          <circle
            cx={peakX}
            cy={peakY}
            r={6}
            fill="yellow"
            stroke="black"
            strokeWidth={1}
          />
        )}
      </svg>
    </div>
  );
};

export default Waveform; 