import React from "react";
import { getPeakIndex, waveformToSvgPoints, getPeakCoordinate } from "./audioMath";
import styles from "./Waveform.module.css";
import { useAppStore } from "../../../store/appStore";
import { selectWaveform, selectDuration } from "../../../store/selectors";
import { usePlayback } from "./PlaybackContext";

interface WaveformProps {
  width: number;
  height: number;
  showPeakTrace?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ width, height, showPeakTrace }) => {
  // Use selectors for waveform data and duration
  const waveformData = useAppStore(selectWaveform);
  const duration = useAppStore(selectDuration);
  // Playback state
  const { currentTime, seek } = usePlayback();

  if (!waveformData || !duration || !Array.isArray(waveformData) || waveformData.length === 0) return null;

  const points = waveformToSvgPoints(waveformData, width, height);
  const peakIdx = getPeakIndex(waveformData);
  const [peakX, peakY] = getPeakCoordinate(waveformData, peakIdx, width, height);

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