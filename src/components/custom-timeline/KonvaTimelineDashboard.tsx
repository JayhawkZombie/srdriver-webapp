import React, { useState } from "react";
import KonvaResponseTimeline from "./KonvaResponseTimeline";
import TimelineControls from "./TimelineControls";
import { usePlaybackState, usePlaybackController } from "./PlaybackContext";
import type { TimelineResponse } from "./TimelineVisuals";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import { useAppStore } from "../../store/appStore";
import { useTimelineSelectionState } from "./useTimelineSelectionState";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";
import { Mixer } from "../../controllers/Mixer";
import Waveform from "./Waveform";

const numTracks = 3;
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const labelWidth = 110;

type RectMoveArgs = {
    timestamp: number;
    trackIndex: number;
    destroyAndRespawn?: boolean;
};

const KonvaTimelineDashboardInner: React.FC = () => {
    // Audio state
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    // REMOVE: const [waveform, setWaveform] = useState<number[] | null>(null);
    // Defensive: ensure waveform is always an array
    const rawWaveform = useAppStore((s) => s.audio.analysis?.waveform);
    const waveform = Array.isArray(rawWaveform)
        ? rawWaveform
        : rawWaveform && typeof rawWaveform === 'object'
        ? Object.values(rawWaveform) as number[]
        : [];
    const duration = useAppStore((s) => s.audio.analysis?.duration) || 0;
    const { currentTime, isPlaying } = usePlaybackState();
    const { play, pause, seek } = usePlaybackController();

    // Use palettes from the app store
    const palettes = useAppStore((state) => state.palettes);
    const devices = useAppStore((state) => state.devices);
    const deviceMetadata = useAppStore((state) => state.deviceMetadata);
    // Removed unused setTrackTarget assignment
    // Track targets from app store (array)
    const trackMapping = useAppStore((state) => state.tracks.mapping);
    const trackTargets = [0, 1, 2].map((i) => trackMapping[i]);

    // Instantiate mixer (replace null with your actual engine if needed)
    const mixer = React.useMemo(() => new Mixer(), []);

    // Responsive container size
    const [containerRef, { width: measuredWidth }] = useMeasuredContainerSize({
        minWidth: 400,
        maxWidth: 1800,
    });
    const parentPadding = 24; // matches the parent container's padding
    const timelinePadding = 24; // padding inside the timeline area
    const contentWidth = Math.max(
        400,
        measuredWidth - labelWidth - 2 * parentPadding - 2 * timelinePadding
    );
    // LOGS for debugging
    console.log('[KonvaTimelineDashboard] waveform:', waveform);
    console.log('[KonvaTimelineDashboard] duration:', duration);
    console.log('[KonvaTimelineDashboard] currentTime:', currentTime);
    console.log('[KonvaTimelineDashboard] measuredWidth:', measuredWidth, 'contentWidth:', contentWidth);

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
    const windowStart = Math.max(
        0,
        Math.min(currentTime - windowDuration / 2, duration - windowDuration)
    );
    const { hoveredId, setHoveredId, selectedId, setSelectedId } =
        useTimelineSelectionState();
    const geometry = {
        windowStart,
        windowDuration,
        tracksWidth: contentWidth,
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
        tracksWidth: contentWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration: duration,
        responses,
        onRectMove: (id: string, args: RectMoveArgs) => {
            const { timestamp, trackIndex, destroyAndRespawn } = args;
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
                setResponses([...newResponses, newRect]);
            } else {
                setResponses((responses) =>
                    responses.map((r) =>
                        r.id === id ? { ...r, timestamp, trackIndex } : r
                    )
                );
            }
        },
        onRectResize: (id, edge, newTimestamp, newDuration) => {
            setResponses((responses) =>
                responses.map((r) => {
                    if (r.id !== id) return r;
                    if (edge === "start")
                        return {
                            ...r,
                            timestamp: newTimestamp,
                            duration: newDuration,
                        };
                    return { ...r, duration: newDuration };
                })
            );
        },
        onBackgroundClick: ({ time, trackIndex }) => {
            const duration = 1;
            setResponses((responses) => [
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
    const activeRectIds = responses.filter((r) => r.triggered).map((r) => r.id);

    // Update triggered state and fire mixer on playhead overlap
    React.useEffect(() => {
        setResponses((prevResponses) =>
            prevResponses.map((rect) => {
                const isActive =
                    currentTime >= rect.timestamp &&
                    currentTime < rect.timestamp + rect.duration;
                // If just became active, trigger the mixer with all rect.data (including type)
                if (
                    isActive &&
                    !rect.triggered &&
                    rect.data &&
                    rect.data.type
                ) {
                    mixer.triggerResponse({ ...rect.data });
                }
                return { ...rect, triggered: isActive };
            })
        );
    }, [currentTime, mixer]);
    console.log("Waveform", waveform);

    // Layout: controls + waveform header, timeline below
    return (
        <div
            ref={containerRef}
            style={{
                width: "90vw",
                maxWidth: 1800,
                minWidth: 400,
                margin: "40px auto",
                background: "#23272f",
                borderRadius: 12,
                padding: parentPadding,
                boxSizing: "border-box",
            }}
        >
            {/* Controls bar (top row, full width) */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
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
                />
                <button style={{ padding: 8, borderRadius: 6, background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Analysis Tools
                </button>
            </div>
            {/* Waveform header (full width) */}
            {waveform && waveform.length > 0 ? (
                <div
                    style={{
                        width: '100%',
                        height: 80,
                        background: '#181c22',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        marginBottom: 16,
                    }}
                    onClick={handleWaveformClick}
                >
                    <Waveform
                        waveform={waveform}
                        width={contentWidth}
                        height={100}
                        duration={duration}
                        currentTime={currentTime}
                    />
                </div>
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: 80,
                        background: '#181c22',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        marginBottom: 16,
                    }}
                >
                    Waveform (upload audio)
                </div>
            )}
            {/* Timeline visuals below waveform (full width) */}
            <div
                style={{
                    background: "#23272f",
                    borderRadius: 16,
                    marginTop: 0,
                    padding: timelinePadding,
                    boxSizing: "border-box",
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                <KonvaResponseTimeline
                    responses={responses}
                    hoveredId={hoveredId}
                    selectedId={selectedId}
                    setHoveredId={setHoveredId}
                    setSelectedId={setSelectedId}
                    pointerHandler={pointerHandler}
                    palettes={palettes}
                    trackTargets={trackTargets}
                    devices={devices}
                    deviceMetadata={deviceMetadata}
                    setTrackTarget={() => {}} // no-op to satisfy prop type
                    activeRectIds={activeRectIds}
                    geometry={{
                        ...geometry,
                        tracksWidth: contentWidth,
                    }}
                    draggingId={pointerHandler.pointerState.draggingId}
                    draggingRectPos={pointerHandler.draggingRectPos}
                    currentTime={currentTime}
                    windowStart={windowStart}
                    windowDuration={windowDuration}
                    onBackgroundClick={({ time, trackIndex }) => {
                        const duration = 1;
                        setResponses((responses) => [
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
                    }}
                />
            </div>
            {/* Debug info below timeline */}
            <div
                style={{
                    marginTop: 16,
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: 15,
                    background: "#23272f",
                    borderRadius: 8,
                    padding: "12px 20px",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <div>Active rect IDs: [{activeRectIds.join(", ")}]</div>
                <div>Hovered rect ID: {hoveredId ? hoveredId : "none"}</div>
            </div>
        </div>
    );

    // Audio upload handler
    function handleAudioBuffer(buffer: AudioBuffer) {
        setAudioBuffer(buffer);
        console.log('[KonvaTimelineDashboard] handleAudioBuffer called with buffer:', buffer);
        // REMOVE: local downsampling and setWaveform
        // The waveform will be generated by the worker and stored in Zustand
    }

    // Seek by clicking waveform
    function handleWaveformClick(
        e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) {
        if (!waveform || !audioBuffer) return;
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        seek(percent * duration);
    }
};

export default KonvaTimelineDashboardInner;
