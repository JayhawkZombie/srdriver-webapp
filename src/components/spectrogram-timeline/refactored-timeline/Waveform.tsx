import React from "react";
import { getPeakIndex } from "./audioMath";

export interface WaveformProps {
  data: number[]; // amplitudes, -1 to 1
  width: number;
  height: number;
  showPeakTrace?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ data, width, height, showPeakTrace }) => {
  const len = data.length;
  // Map amplitudes to SVG points
  const points = data.map((amp, i) => {
    const x = (i / (len - 1)) * width;
    // SVG y=0 is top, so invert amplitude
    const y = height / 2 - (amp * (height / 2));
    return `${x},${y}`;
  }).join(' ');

  // Find peak (max abs amplitude)
  const peakIdx = getPeakIndex(data);
  const peakX = (peakIdx / (len - 1)) * width;
  const peakY = height / 2 - (data[peakIdx] * (height / 2));

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
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
  );
};

export default Waveform; 