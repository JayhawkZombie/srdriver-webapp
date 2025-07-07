import React, { useState, useEffect } from "react";
import { useTimelineResponses, useAddTimelineResponse, useUpdateTimelineResponse, useSetTimelineResponses, useTrackTargets } from "../../store/appStore";
import { usePlayback } from "./PlaybackContext";
import { useAppStore } from "../../store/appStore";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import KonvaResponseTimeline from "./KonvaResponseTimeline";
import PlaybackControls from "./PlaybackControls";
import AudioUpload from "./AudioUpload";
import BarWaveform from "./BarWaveform";

const numTracks = 3;
const tracksWidth = 900;
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const labelWidth = 110;

export const KonvaTimelineDashboard: React.FC = () => {
    // State and store hooks
    const responses = useTimelineResponses();
    const addTimelineResponse = useAddTimelineResponse();
    const updateTimelineResponse = useUpdateTimelineResponse();
    const setTimelineResponses = useSetTimelineResponses();
    const { totalDuration, currentTime, isPlaying } = usePlayback();
    const trackTargets = useTrackTargets();
    const palettes = useAppStore((state) => state.palettes);

    // Local state for audio upload and waveform
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [waveform, setWaveform] = useState<number[] | null>(null);

    // Window logic
    const [windowDuration] = useState(5);
    const [windowStart, setWindowStart] = useState(0);
    useEffect(() => {
        let newWindowStart = currentTime - windowDuration / 2;
        if (newWindowStart < 0) newWindowStart = 0;
        if (newWindowStart > totalDuration - windowDuration)
            newWindowStart = totalDuration - windowDuration;
        setWindowStart(newWindowStart);
    }, [currentTime, windowDuration, totalDuration]);

    // Robust local state for hover/selection
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Pointer handler for drag/resize/context menu
    const pointerHandler = useTimelinePointerHandler({
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration,
        responses,
        onRectMove: (
            id: string,
            {
                timestamp,
                trackIndex,
                destroyAndRespawn,
            }: {
                timestamp: number;
                trackIndex: number;
                destroyAndRespawn?: boolean;
            }
        ) => {
            if (destroyAndRespawn) {
                const oldRect = responses.find((r) => r.id === id);
                if (!oldRect) return;
                const newResponses = responses.filter((r) => r.id !== id);
                const newRect = {
                    ...oldRect,
                    id: crypto.randomUUID(),
                    timestamp,
                    trackIndex,
                };
                setTimelineResponses([...newResponses, newRect]);
            } else {
                updateTimelineResponse(id, { timestamp, trackIndex });
            }
        },
        onRectResize: (
            id: string,
            edge: "start" | "end",
            newTimestamp: number,
            newDuration: number
        ) => {
            if (edge === "start") {
                updateTimelineResponse(id, {
                    timestamp: newTimestamp,
                    duration: newDuration,
                });
            } else {
                updateTimelineResponse(id, { duration: newDuration });
            }
        },
        onBackgroundClick: ({ time, trackIndex }: { time: number; trackIndex: number }) => {
            const duration = 1;
            addTimelineResponse({
                id: crypto.randomUUID(),
                timestamp: time,
                duration,
                trackIndex,
                data: {},
                triggered: false,
            });
        },
    });

    // Active rects
    const activeRectIds = responses
        .filter(
            (r) =>
                currentTime >= r.timestamp &&
                currentTime < r.timestamp + r.duration &&
                !!trackTargets[r.trackIndex]
        )
        .map((r) => r.id);

    // Shadow rect for dragging
    const { draggingId } = pointerHandler.pointerState;
    const draggingRectPos = pointerHandler.draggingRectPos;

    // Geometry for rects
    const geometry = {
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration,
    };

    // Audio upload handler
    const handleAudioBuffer = (buffer: AudioBuffer) => {
        setAudioBuffer(buffer);
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

    // Convert trackTargets object to array for KonvaResponseTimeline
    const trackTargetsArray = Array.isArray(trackTargets)
        ? trackTargets
        : Object.keys(trackTargets).map((k) => trackTargets[Number(k)]);

    // Seek by clicking waveform
    const handleWaveformClick = () => {
        if (!waveform || !audioBuffer) return;
        // TODO: wire this to playback context if needed
    };

    // Local visualTime for smooth playhead animation
    const [visualTime, setVisualTime] = useState(currentTime);
    const lastCurrentTimeRef = React.useRef(currentTime);
    const lastFrameRef = React.useRef(performance.now());

    useEffect(() => {
        if (!isPlaying) {
            setVisualTime(currentTime);
            return;
        }
        let frame: number;
        const animate = (now: number) => {
            const dt = (now - lastFrameRef.current) / 1000;
            lastFrameRef.current = now;
            setVisualTime((prev) => {
                // Debug log
                // eslint-disable-next-line no-console
                console.log(`[ANIMATE] currentTime: ${currentTime.toFixed(3)}, visualTime: ${prev.toFixed(3)}, dt: ${dt.toFixed(3)}`);
                // If the official time jumped (seek), snap
                if (Math.abs(currentTime - lastCurrentTimeRef.current) > 0.2) return currentTime;
                // Otherwise, advance smoothly
                return prev + dt;
            });
            lastCurrentTimeRef.current = currentTime;
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [isPlaying]);

    // On seek or pause, snap visualTime to currentTime
    useEffect(() => {
        if (!isPlaying) setVisualTime(currentTime);
    }, [currentTime, isPlaying]);

    // Layout: controls left, waveform right/center, timeline below
    return (
        <div style={{ width: tracksWidth + labelWidth + 40, margin: "40px auto", background: "#23272f", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", marginBottom: 24 }}>
                {/* Controls (left) */}
                <div style={{ width: 220, marginRight: 32 }}>
                    <div style={{ marginBottom: 16, color: '#b8d4ff', fontWeight: 700 }}>Controls</div>
                    <PlaybackControls />
                    <div style={{ marginTop: 16 }}>
                        <AudioUpload onAudioBuffer={handleAudioBuffer} />
                    </div>
                </div>
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
                pointerHandler={pointerHandler}
                palettes={palettes}
                trackTargets={trackTargetsArray}
                activeRectIds={activeRectIds}
                geometry={geometry}
                draggingId={draggingId}
                draggingRectPos={draggingRectPos}
                currentTime={visualTime}
                windowStart={windowStart}
                windowDuration={windowDuration}
            />
        </div>
    );
};

export default KonvaTimelineDashboard; 