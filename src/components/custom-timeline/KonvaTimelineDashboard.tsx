import React, { useState } from "react";
import KonvaResponseTimeline from "./KonvaResponseTimeline";
import AudioUpload from "./AudioUpload";
import BarWaveform from "./BarWaveform";
import PlaybackControls from "./PlaybackControls";
import PlaybackProvider, { usePlaybackState, usePlaybackController } from "./PlaybackContext";
import type { TimelineResponse } from "./TimelineVisuals";

const numTracks = 3;
const tracksWidth = 900;
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const labelWidth = 110;

const KonvaTimelineDashboardInner: React.FC = () => {
    // Audio state
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [waveform, setWaveform] = useState<number[] | null>(null);
    const { currentTime, isPlaying, duration } = usePlaybackState();
    const { play, pause, seek, setBuffer } = usePlaybackController();

    // Timeline state (mock for now)
    const [responses] = useState<TimelineResponse[]>([]);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [windowDuration] = useState(5);
    const [windowStart] = useState(0);
    const palettes = { demo: { baseColor: "#2196f3", borderColor: "#fff", states: {} } };
    const trackTargets = [undefined, undefined, undefined];
    const geometry = {
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration: duration,
    };

    // Audio upload handler
    const handleAudioBuffer = (buffer: AudioBuffer) => {
        setAudioBuffer(buffer);
        setBuffer(buffer);
        // Downsample waveform for demo
        const pcm = buffer.getChannelData(0);
        const numPoints = 1000;
        const step = Math.floor(pcm.length / numPoints);
        const wf = Array.from({ length: numPoints }, (_, i) => {
            const start = i * step;
            const end = Math.min(start + step, pcm.length);
            let min = 1, max = -1;
            for (let j = start; j < end; j++) {
                if (pcm[j] < min) min = pcm[j];
                if (pcm[j] > max) max = pcm[j];
            }
            return (max - min) / 2 + min;
        });
        setWaveform(wf);
    };

    // Seek by clicking waveform
    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!waveform || !audioBuffer) return;
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        seek(percent * duration);
    };

    // Controls UI
    const Controls = (
        <div style={{ width: 220, marginRight: 32 }}>
            <div style={{ marginBottom: 16, color: '#b8d4ff', fontWeight: 700 }}>Controls</div>
            <PlaybackControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onRestart={() => seek(0)}
            />
            <AudioUpload onAudioBuffer={handleAudioBuffer} />
            {audioBuffer && (
                <div style={{ color: "#b8d4ff", fontSize: 13, marginTop: 8 }}>
                    Selected file: <strong>{audioBuffer.duration.toFixed(2)}s</strong>
                </div>
            )}
        </div>
    );

    // Layout: controls left, waveform right/center, timeline below
    return (
        <div style={{ width: tracksWidth + labelWidth + 40, margin: "40px auto", background: "#23272f", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", marginBottom: 24 }}>
                {Controls}
                {/* Waveform (right/center) */}
                <div style={{ flex: 1 }}>
                    {waveform ? (
                        <div style={{ width: 600, margin: '0 auto', height: 80, background: '#181c22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleWaveformClick}>
                            <BarWaveform data={waveform} width={600} height={80} color="#4fc3f7" barWidth={1} />
                        </div>
                    ) : (
                        <div style={{ width: 600, margin: '0 auto', height: 80, background: '#181c22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                            Waveform (upload audio)
                        </div>
                    )}
                </div>
            </div>
            {/* Timeline below */}
            <KonvaResponseTimeline
                responses={responses}
                hoveredId={hoveredId}
                selectedId={selectedId}
                setHoveredId={setHoveredId}
                setSelectedId={setSelectedId}
                pointerHandler={{ getRectProps: () => ({}) }}
                palettes={palettes}
                trackTargets={trackTargets}
                activeRectIds={[]}
                geometry={geometry}
                draggingId={null}
                draggingRectPos={null}
                currentTime={currentTime}
                windowStart={windowStart}
                windowDuration={windowDuration}
            />
        </div>
    );
};

const KonvaTimelineDashboard: React.FC = () => (
    // <PlaybackProvider>
        <KonvaTimelineDashboardInner />
    // </PlaybackProvider>
);

export default KonvaTimelineDashboard; 