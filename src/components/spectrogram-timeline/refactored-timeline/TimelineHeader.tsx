import React, { useRef, useState, useLayoutEffect } from "react";
import PlaybackControls from "./PlaybackControls";
import Waveform from "./Waveform";
import styles from "./TimelineHeader.module.css";

// Mock amplitude data for now
const mockWaveformData = Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * 4 * Math.PI));

interface TimelineHeaderProps {
  children?: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ children, minHeight = 100, minWidth = 320, maxHeight = 400, maxWidth = 900 }: TimelineHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(minWidth);
  const [height, setHeight] = useState(minHeight);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      const newWidth = Math.min(containerRef.current?.offsetWidth ?? 0, maxWidth);
      const newHeight = Math.min(containerRef.current?.offsetHeight ?? 0, maxHeight);
      setWidth(newWidth);
      setHeight(newHeight);
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={styles.main} ref={containerRef} >
      <div className={styles.controlsOverlay}>
        <PlaybackControls />
      </div>
      <div className={styles.waveformOverlay}>
        <Waveform data={mockWaveformData} width={width * 0.8} height={height * 0.8} />
      </div>
      {children}
    </div>
  );
};

export default TimelineHeader; 