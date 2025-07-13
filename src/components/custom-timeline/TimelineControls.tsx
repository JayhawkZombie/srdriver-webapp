import React from "react";
import { Icon, Slider } from "@blueprintjs/core";
import PlaybackControls from "./PlaybackControls";
import AudioUpload from "./AudioUpload";

interface TimelineControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (time: number) => void;
    onRestart?: () => void;
    onAudioBuffer: (buffer: AudioBuffer) => void;
    windowDuration: number;
    setWindowDuration: (d: number) => void;
    minWindow?: number;
    maxWindow?: number;
    children?: React.ReactNode; // For waveform
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
    isPlaying,
    currentTime,
    duration,
    onPlay,
    onPause,
    onSeek,
    onRestart,
    onAudioBuffer,
    windowDuration,
    setWindowDuration,
    minWindow = 1,
    maxWindow = 15,
    children,
}) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                gap: 24,
            }}
        >
            {/* Controls and file upload */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    minWidth: 220,
                    gap: 8,
                }}
            >
                <PlaybackControls
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onPlay={onPlay}
                    onPause={onPause}
                    onSeek={onSeek}
                    onRestart={onRestart}
                />
                <AudioUpload onAudioBuffer={onAudioBuffer} />
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                    }}
                >
                    <Icon icon="timeline-events" intent="primary" />
                    <Slider
                        min={minWindow}
                        max={maxWindow}
                        stepSize={0.1}
                        labelStepSize={maxWindow - minWindow}
                        value={windowDuration}
                        onChange={setWindowDuration}
                        labelRenderer={false}
                        style={{ width: 120, margin: "0 8px" }}
                    />
                    <span
                        style={{
                            minWidth: 32,
                            textAlign: "right",
                            color: "#888",
                            fontFamily: "monospace",
                        }}
                    >
                        {windowDuration.toFixed(1)}s
                    </span>
                </div>
            </div>
            {/* Waveform or children */}
            <div style={{ flex: 1, minWidth: 120 }}>{children}</div>
        </div>
    );
};

export default TimelineControls;
