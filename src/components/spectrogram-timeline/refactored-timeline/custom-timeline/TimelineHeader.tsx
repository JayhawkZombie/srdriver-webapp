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

const AudioUpload: React.FC<{
    onAudioBuffer: (audioBuffer: AudioBuffer) => void;
}> = ({ onAudioBuffer }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const setAudioData = useAppStore((s) => s.setAudioData);
    const { setAudioBuffer } = usePlayback();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAudioFile(file);
        if (file) {
            const audioBuffer = await decodeAudioFile(file);
            setAudioBuffer(audioBuffer);
            onAudioBuffer(audioBuffer);
            const pcm = getMonoPCMData(audioBuffer);
            const req = {
                type: "waveform" as const,
                pcmBuffer: pcm.buffer,
                sampleRate: audioBuffer.sampleRate,
                numPoints: 1000,
            };
            const result = await workerManager.enqueueJob<
                typeof req,
                { type: string; waveform?: number[] }
            >("waveform", req);
            console.log("Worker result:", result);
            if (
                result &&
                result.type === "waveformResult" &&
                Array.isArray(result.waveform)
            ) {
                setAudioData({
                    waveform: result.waveform,
                    duration: audioBuffer.duration,
                });
            } else {
                console.error("No waveform returned from worker!", result);
            }
        }
    };

    return (
        <div className={styles.audioUpload}>
            <input type="file" accept="audio/*" onChange={handleFileChange} />
            {audioFile && (
                <div style={{ color: "#b8d4ff", fontSize: 13, marginTop: 8 }}>
                    Selected file: <strong>{audioFile.name}</strong>
                </div>
            )}
        </div>
    );
};

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