import React from "react";
import { getPeakIndex, waveformToSvgPoints, getPeakCoordinate } from "./audioMath";
import styles from "./Waveform.module.css";
import { usePlayback } from "./PlaybackContext";

interface WaveformProps {
  width: number;
  height: number;
  showPeakTrace?: boolean;
  waveform: number[];
  duration?: number;
}

const Waveform: React.FC<WaveformProps> = ({ width, height, showPeakTrace, waveform, duration }) => {
  // Playback state
  const { currentTime, seek } = usePlayback();

  if (!waveform || !duration || !Array.isArray(waveform) || waveform.length === 0) return null;

  const points = waveformToSvgPoints(waveform, width, height);
  const peakIdx = getPeakIndex(waveform);
  const [peakX, peakY] = getPeakCoordinate(waveform, peakIdx, width, height);

  // Playhead X
  const playheadX = (currentTime / duration) * width;

  // Click-to-seek
  const handleClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = (e.target as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / width) * duration;
    seek(time);
  };

  return (
    <div className={styles.waveformRoot} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className={styles.waveformSvg}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <polyline fill="none" stroke="#4fc3f7" strokeWidth={2} points={points} />
        {showPeakTrace && (
          <circle cx={peakX} cy={peakY} r={6} fill="yellow" stroke="black" strokeWidth={1} />
        )}
        <line x1={playheadX} x2={playheadX} y1={0} y2={height} stroke="#ff1744" strokeWidth={2} />
      </svg>
    </div>
  );
};

export default Waveform; 