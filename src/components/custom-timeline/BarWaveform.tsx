import React from "react";

export interface BarWaveformProps {
  data: number[]; // amplitude per time bin, 0-1
  width: number;
  height: number;
  color?: string;
  barWidth?: number;
}

const BarWaveform: React.FC<BarWaveformProps> = ({ data, width, height, color = "#aaa", barWidth }) => {
  const N = data.length;
  const bw = barWidth || Math.max(1, Math.floor(width / (N * 1.5)));
  const gap = (width - N * bw) / (N - 1);

  return (
    <svg width={width} height={height} style={{ display: 'block', background: '#181818', borderRadius: 4 }}>
      {data.map((v, i) => {
        const x = i * (bw + gap);
        const h = Math.max(1, v * height);
        return (
          <rect
            key={i}
            x={x}
            y={height - h}
            width={bw}
            height={h}
            fill={color}
            rx={bw * 0.3}
          />
        );
      })}
    </svg>
  );
};

export default BarWaveform; 