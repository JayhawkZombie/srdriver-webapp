import React, { useState } from "react";
import KonvaResponseTimeline from "./KonvaResponseTimeline";
import TimelineControls from "./TimelineControls";
import { usePlaybackState, usePlaybackController } from "./PlaybackContext";
import type { TimelineResponse } from "./TimelineVisuals";
import { useAppStore } from "../../store/appStore";
import type { TrackTarget } from "../../store/appStore";
import { useTimelineSelectionState } from "./useTimelineSelectionState";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";
import { Mixer } from "../../controllers/Mixer";
import Waveform from "./Waveform";
import type { TimelineMenuAction } from "./TimelineContextMenu";
import KonvaTimelineTemplateSelector from "./KonvaTimelineTemplateSelector";
import AudioAnalysisPanel from "./AudioAnalysisPanel";
import { Drawer } from "@blueprintjs/core";
import { useAudioAnalysis } from "./AudioAnalysisContextHelpers";
import { useDetectionData } from "./DetectionDataContext";
import WindowedTimeSeriesPlot from "./WindowedTimeSeriesPlot";

const numTracks = 3;
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const labelWidth = 110;

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
    // Track assignment state from Zustand
    const trackMapping = useAppStore((state) => state.tracks.mapping);
    const trackTargets: (TrackTarget | undefined)[] = [0, 1, 2].map(i => trackMapping[i]);
    const setTrackTarget = useAppStore((state) => state.setTrackTarget);
    // Track targets from app store (array)
    // const trackMapping = useAppStore((state) => state.tracks.mapping);
    // const trackTargets = [0, 1, 2].map((i) => trackMapping[i]);

    // Instantiate mixer (replace null with your actual engine if needed)
    const mixer = React.useMemo(() => new Mixer(), []);

    // Get rect templates from the app store
    const rectTemplates = useAppStore(state => state.rectTemplates);
    type RectTemplate = typeof rectTemplates extends Record<string, infer T> ? T : never;

    // Helper: create a TimelineResponse from a RectTemplate
    function createResponseFromTemplate(
        template: RectTemplate,
        timestamp: number,
        trackIndex: number
    ): TimelineResponse {
        return {
            id: crypto.randomUUID(),
            timestamp,
            duration: template.defaultDuration,
            trackIndex,
            data: {
                ...template.defaultData,
                type: template.type,
                paletteName: template.paletteName,
            },
            triggered: false,
        };
    }

    // Add state for selected template key
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(() => Object.keys(rectTemplates)[0] || "");

    // Handler for background click: add a new rect from the selected template
    const handleBackgroundClick = ({ time, trackIndex }: { time: number; trackIndex: number }) => {
        const template = rectTemplates[selectedTemplateKey] || Object.values(rectTemplates)[0];
        if (!template) return;
        setResponses(responses => [
            ...responses,
            createResponseFromTemplate(template, time, trackIndex)
        ]);
    };

    // Responsive container size
    const [containerRef, { width: measuredWidth }] = useMeasuredContainerSize({
        minWidth: 400,
        maxWidth: 1800,
    });
    const parentPadding = 24; // matches the parent container's padding
    const timelinePadding = 0; // padding inside the timeline area
    const contentWidth = Math.max(
        400,
        measuredWidth - labelWidth - 2 * parentPadding - 2 * timelinePadding
    );

    // Timeline state (local for now)
    const [responses, setResponses] = useState<TimelineResponse[]>([]);
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

    // Define your actions array (or function)
    const actions: TimelineMenuAction[] = [
        {
            key: 'add',
            text: 'Add Random Response',
            icon: 'add',
            onClick: () => {
                // For demo, pick the first template from the store
                const template = Object.values(useAppStore.getState().rectTemplates)[0];
                if (!template) return;
                const timestamp = Math.random() * 10;
                const duration = template.defaultDuration;
                const trackIndex = Math.floor(Math.random() * 3);
                setResponses((responses) => [
                    ...responses,
                    {
                        id: crypto.randomUUID(),
                        timestamp,
                        duration,
                        trackIndex,
                        data: {
                            ...template.defaultData,
                            type: template.type,
                            paletteName: template.paletteName,
                        },
                        triggered: false,
                    },
                ]);
            },
        },
        {
            key: 'test',
            text: 'test',
            onClick: () => {
                console.log("TEST");
            }
        },
        {
            key: 'close',
            text: 'Close',
            icon: 'cross',
            onClick: () => {
                console.log("Closed");
            },
        },
    ];

    // Add this handler to update rects on drag/drop
    const handleRectMove = (id: string, { timestamp, trackIndex, destroyAndRespawn }: { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean }) => {
        setResponses(responses => responses.map(r => {
            if (r.id === id) {
                const updated = { ...r, timestamp, trackIndex };
                console.log('[DASHBOARD] Rect moved:', updated, { destroyAndRespawn });
                return updated;
            }
            return r;
        }));
    };

    // Add this handler to update rects on resize
    const handleRectResize = (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => {
        setResponses(responses => responses.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    timestamp: edge === 'start' ? newTimestamp : r.timestamp,
                    duration: newDuration,
                };
            }
            return r;
        }));
    };

    // Pointer/drag/resize logic

    // Active rects for highlighting
    const activeRectIds = responses.filter((r) => r.triggered).map((r) => r.id);

    // Update triggered state and fire mixer on playhead overlap
    React.useEffect(() => {
        setResponses((prevResponses) =>
            prevResponses.map((rect) => {
                const assignedTarget = trackMapping[rect.trackIndex];
                const isActive =
                    !!assignedTarget &&
                    currentTime >= rect.timestamp &&
                    currentTime < rect.timestamp + rect.duration;
                if (
                    assignedTarget &&
                    isActive &&
                    !rect.triggered &&
                    rect.data &&
                    rect.data.type &&
                    rect.data.pattern
                ) {
                    console.log("RECT", rect);
                    mixer.triggerResponse({...rect} as unknown as import('../../controllers/Mixer').MixerResponseInfo);
                }
                return { ...rect, triggered: isActive };
            })
        );
    }, [currentTime, mixer, trackMapping]);

    // Drawer state for analysis tools
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Layout: controls + waveform header, timeline below
    return (
        <>
            {/* Main dashboard UI */}
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
                    <button
                        style={{ padding: 8, borderRadius: 6, background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => setDrawerOpen(true)}
                    >
                        Analysis Tools
                    </button>
                </div>
                {/* Drawer for analysis tools */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title="Audio Analysis Tools"
                    size="large"
                >
                    <div style={{ display: drawerOpen ? 'block' : 'none', height: '100%' }}>
                        <AudioAnalysisPanel />
                    </div>
                </Drawer>
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
                {/* Template selector below waveform */}
                <KonvaTimelineTemplateSelector
                    rectTemplates={rectTemplates}
                    selectedTemplateKey={selectedTemplateKey}
                    onSelect={setSelectedTemplateKey}
                />
                {/* Timeline visuals below waveform (full width) */}
                <div
                    style={{
                        position: "relative",
                        background: "#23272f",
                        borderRadius: 16,
                        marginTop: 0,
                        padding: timelinePadding,
                        boxSizing: "border-box",
                        width: "100%",
                        overflow: "hidden",
                        height: tracksHeight + 32, // ensure enough height for both
                    }}
                >
                    {/* Impulse plot underlay, aligned with a specific track */}
                    {/* Remove manual absolute positioning of the impulse plot underlay here */}
                    {/* Instead, pass it as a prop to TimelineVisuals (via KonvaResponseTimeline if needed) */}
                    {/* TimelineVisuals will handle its own positioning */}

                    {/* Timeline visuals (Konva) */}
                    <KonvaResponseTimeline
                        responses={responses}
                        hoveredId={hoveredId}
                        selectedId={selectedId}
                        setHoveredId={setHoveredId}
                        setSelectedId={setSelectedId}
                        palettes={palettes}
                        trackTargets={trackTargets}
                        devices={devices}
                        deviceMetadata={deviceMetadata}
                        setTrackTarget={setTrackTarget}
                        activeRectIds={activeRectIds}
                        geometry={{
                            ...geometry,
                            tracksWidth: contentWidth,
                        }}
                        currentTime={currentTime}
                        windowStart={windowStart}
                        windowDuration={windowDuration}
                        actions={actions}
                        onRectMove={handleRectMove}
                        onRectResize={handleRectResize}
                        onBackgroundClick={handleBackgroundClick}
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
                    <div>
                        <h4>All Rects:</h4>
                        <ul>
                            {responses.map(r => (
                                <li key={r.id}>
                                    ID: {r.id}, Track: {r.trackIndex}, Time: {r.timestamp.toFixed(2)}, Duration: {r.duration.toFixed(2)}, Triggered: {String(r.triggered)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>Active rect IDs: [{activeRectIds.join(", ")}]</div>
                    <div>Hovered rect ID: {hoveredId ? hoveredId : "none"}</div>
                </div>
            </div>
        </>
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
 