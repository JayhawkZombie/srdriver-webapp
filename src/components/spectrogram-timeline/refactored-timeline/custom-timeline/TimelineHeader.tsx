import React from "react";
import { Slider, Icon } from "@blueprintjs/core";
import PlaybackControls from "../PlaybackControls";
import BarWaveform from "../BarWaveform";
import { selectWaveform, useAppStore } from "../../../../store/appStore";
import { decodeAudioFile, getMonoPCMData } from "../../../../controllers/audioChunker";
import { workerManager } from "../../../../controllers/workerManager";
import { usePlayback } from "../PlaybackContext";
import { useState } from "react";
import styles from "./TimelineHeader.module.css";

interface TimelineHeaderProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  windowSize: number;
  onWindowSizeChange: (size: number) => void;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  currentTime,
  duration,
  onSeek,
  windowSize,
  onWindowSizeChange,
}) => {
  const waveform = useAppStore(selectWaveform);
  if (!waveform) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, width: '100%' }}>
      <div>
      <PlaybackControls />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <BarWaveform data={waveform} width={400} height={80} color="#4fc3f7" barWidth={1} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
        <Icon icon="timeline-events" intent="primary" />
        <Slider
          min={1}
          max={15}
          stepSize={0.1}
          labelStepSize={7}
          value={windowSize}
          onChange={onWindowSizeChange}
          labelRenderer={false}
          style={{ width: 120, margin: '0 8px' }}
        />
        <span style={{ minWidth: 32, textAlign: 'right', color: '#888', fontFamily: 'monospace' }}>{windowSize.toFixed(1)}s</span>
      </div>
    </div>
  );
};

export default TimelineHeader; 