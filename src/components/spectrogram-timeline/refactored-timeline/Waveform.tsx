import React from "react";
import { getPeakIndex } from "./audioMath";

export const SvgVisualizationWrapper: React.FC<{
  width: number;
  height: number;
  borderRadius?: number;
  children: React.ReactNode;
}> = ({ width, height, borderRadius = 4, children }) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      overflow: "hidden",
      pointerEvents: "none",
      position: "relative",
    }}
  >
    {children}
  </div>
);

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
  let peakIdx = 0;
  let peakVal = Math.abs(data[0] || 0);
  for (let i = 1; i < data.length; i++) {
    if (Math.abs(data[i]) > peakVal) {
      peakVal = Math.abs(data[i]);
      peakIdx = i;
    }
  }
  const peakX = (peakIdx / (len - 1)) * width;
  const peakY = height / 2 - (data[peakIdx] * (height / 2));

  return (
    <SvgVisualizationWrapper width={width} height={height} borderRadius={4}>
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
    </SvgVisualizationWrapper>
  );
};

export default Waveform; 