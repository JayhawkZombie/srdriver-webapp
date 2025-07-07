import React, { useState } from "react";
import KonvaResponseTimeline from "./KonvaResponseTimeline";
import TimelineControls from "./TimelineControls";
import BarWaveform from "./BarWaveform";
import { usePlaybackState, usePlaybackController } from "./PlaybackContext";
import type { TimelineResponse } from "./TimelineVisuals";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import { useAppStore } from "../../store/appStore";
import { useTimelineSelectionState } from "./useTimelineSelectionState";

const numTracks = 3;
const tracksWidth = 900;
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const labelWidth = 110;

type RectMoveArgs = { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean };

const KonvaTimelineDashboardInner: React.FC = () => {
    // Audio state
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [waveform, setWaveform] = useState<number[] | null>(null);
    const { currentTime, isPlaying, duration } = usePlaybackState();
    const { play, pause, seek, setBuffer } = usePlaybackController();

    // Use palettes from the app store
    const palettes = useAppStore(state => state.palettes);

    // Timeline state (local for now)
    const [responses, setResponses] = useState<TimelineResponse[]>([
        {
            id: crypto.randomUUID(),
            timestamp: 1,
            duration: 1.5,
            trackIndex: 0,
            data: { paletteName: "lightPulse" },
            triggered: false,
        },
        {
            id: crypto.randomUUID(),
            timestamp: 3,
            duration: 0.8,
            trackIndex: 2,
            data: { paletteName: "singleFirePattern" },
            triggered: false,
        },
    ]);
    const [windowDuration, setWindowDuration] = useState(5);
    const windowStart = Math.max(0, Math.min(currentTime - windowDuration / 2, duration - windowDuration));
    const { hoveredId, setHoveredId, selectedId, setSelectedId } = useTimelineSelectionState();
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

    // Pointer/drag/resize logic
    const pointerHandler = useTimelinePointerHandler({
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration: duration,
        responses,
        onRectMove: (id: string, args: RectMoveArgs) => {
            const { timestamp, trackIndex, destroyAndRespawn } = args;
            if (destroyAndRespawn) {
                const oldRect = responses.find(r => r.id === id);
                if (!oldRect) return;
                const newResponses = responses.filter(r => r.id !== id);
                const newRect = { ...oldRect, id: crypto.randomUUID(), timestamp, trackIndex };
                setResponses([...newResponses, newRect]);
            } else {
                setResponses(responses => responses.map(r => r.id === id ? { ...r, timestamp, trackIndex } : r));
            }
        },
        onRectResize: (id, edge, newTimestamp, newDuration) => {
            setResponses(responses => responses.map(r => {
                if (r.id !== id) return r;
                if (edge === 'start') return { ...r, timestamp: newTimestamp, duration: newDuration };
                return { ...r, duration: newDuration };
            }));
        },
        onBackgroundClick: ({ time, trackIndex }) => {
            const duration = 1;
            setResponses(responses => [
                ...responses,
                {
                    id: crypto.randomUUID(),
                    timestamp: time,
                    duration,
                    trackIndex,
                    data: { paletteName: "lightPulse" },
                    triggered: false,
                },
            ]);
        },
    });

    // Active rects for highlighting
    const activeRectIds = responses
        .filter(r => currentTime >= r.timestamp && currentTime < r.timestamp + r.duration && !!trackTargets[r.trackIndex])
        .map(r => r.id);

    // Layout: controls + waveform header, timeline below
    return (
        <div style={{ width: tracksWidth + labelWidth + 40, margin: "40px auto", background: "#23272f", borderRadius: 12, padding: 24 }}>
            {/* Controls + waveform header */}
            <TimelineControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onRestart={() => seek(0)}
                onAudioBuffer={handleAudioBuffer}
                windowDuration={windowDuration}
                setWindowDuration={setWindowDuration}
            >
                {waveform ? (
                    <div style={{ width: 600, margin: '0 auto', height: 80, background: '#181c22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleWaveformClick}>
                        <BarWaveform data={waveform} width={600} height={80} color="#4fc3f7" barWidth={1} />
                    </div>
                ) : (
                    <div style={{ width: 600, margin: '0 auto', height: 80, background: '#181c22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                        Waveform (upload audio)
                    </div>
                )}
            </TimelineControls>
            {/* Timeline below */}
            <KonvaResponseTimeline
                responses={responses}
                hoveredId={hoveredId}
                selectedId={selectedId}
                setHoveredId={setHoveredId}
                setSelectedId={setSelectedId}
                pointerHandler={pointerHandler}
                palettes={palettes}
                trackTargets={trackTargets}
                activeRectIds={activeRectIds}
                geometry={geometry}
                draggingId={pointerHandler.pointerState.draggingId}
                draggingRectPos={pointerHandler.draggingRectPos}
                currentTime={currentTime}
                windowStart={windowStart}
                windowDuration={windowDuration}
            />
        </div>
    );

    // Audio upload handler
    function handleAudioBuffer(buffer: AudioBuffer) {
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
    }

    // Seek by clicking waveform
    function handleWaveformClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!waveform || !audioBuffer) return;
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        seek(percent * duration);
    }
};

export default KonvaTimelineDashboardInner; 