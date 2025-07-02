import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import ResponseRect from "./ResponseRect";
import TrackList from "./TrackList";
import UnderlayCanvas from "./UnderlayCanvas";
import TimelineGrid from "./TimelineGrid";
import { useTimelineState } from "./useTimelineState";
import {
    timeToX,
    xToTime,
    TRACK_HEIGHT,
    TRACK_GAP,
    TIMELINE_LEFT,
    TIMELINE_RIGHT_PAD,
    centerYToTrackIndex,
    trackIndexToRectY,
    timeToXWindow,
    xToTimeWindow,
} from "./timelineMath";
import BandOverlayCanvas from "./BandOverlayCanvas";
import WaveSurferSpectrogram from "./WaveSurferSpectrogram";
import { useAppStore } from "../../store/appStore";
import { Box, Button } from "@mui/material";
import TimelineControls from "./TimelineControls";

// Use actual audio duration if available
const DEFAULT_DURATION = 15;
const LABEL_WIDTH = 160;

const muiBg = "#21262c";
const muiText = "#e3e6eb";
const muiAccent = "#90caf9";
const muiShadow = "rgba(0,0,0,0.18)";

type TrackType = "device" | "frequency" | "custom";

const TEMPLATES: {
    name: string;
    tracks: { name: string; type: TrackType }[];
}[] = [
    {
        name: "Music-Driven",
    tracks: [
            { name: "Bass", type: "frequency" },
            { name: "Snare", type: "frequency" },
            { name: "FX", type: "frequency" },
            { name: "Lights", type: "device" },
    ],
  },
  {
        name: "Device-Driven",
    tracks: [
            { name: "Front Wash", type: "device" },
            { name: "Lasers", type: "device" },
            { name: "Strobes", type: "device" },
            { name: "FX", type: "custom" },
    ],
  },
  {
        name: "Hybrid",
    tracks: [
            { name: "Bass", type: "frequency" },
            { name: "Snare", type: "frequency" },
            { name: "Front Wash", type: "device" },
            { name: "FX", type: "custom" },
    ],
  },
];

const UNDERLAY_OPTIONS = ["None", "Waveform", "Frequency"] as const;
type UnderlayType = (typeof UNDERLAY_OPTIONS)[number];

type Track = { name: string; type: TrackType };

type BandData = { band?: { name?: string }; magnitudes?: number[] };

const defaultTracks: Track[] = [
    { name: "Bass", type: "frequency" },
    { name: "Snare", type: "frequency" },
    { name: "FX", type: "custom" },
    { name: "Lights", type: "device" },
];

interface TimeTracksProps {
  audioBuffer: AudioBuffer | null;
}

const TimeTracks: React.FC<TimeTracksProps> = ({ audioBuffer }) => {
    const bandDataArr = useAppStore(
        (state) => (state.audioData?.analysis?.bandDataArr as BandData[]) || []
    );
    const bandNames = bandDataArr.map((b) => b.band?.name || "Band");
  const [selectedBandIdx, setSelectedBandIdx] = useState(0);
  const [dragOverTrack, setDragOverTrack] = useState<number | null>(null);
  const {
    responses,
    playhead,
    setPlayhead,
        startPlayhead,
        stopPlayhead,
    tracks,
        editingTrack,
        setEditingTrack,
        editingValue,
        setEditingValue,
        editingType,
        setEditingType,
    templateIdx,
        underlay,
        setUnderlay,
        timelineContainerRef,
        timelineSize,
    handleStageClick,
    handleResize,
    handleTrackNameChange,
    handleTrackNameCommit,
    handleTemplateSelect,
    setResponses,
        windowDuration,
        setWindowDuration,
    } = useTimelineState({
        defaultTracks,
        duration: audioBuffer?.duration || DEFAULT_DURATION,
        trackHeight: TRACK_HEIGHT,
        trackGap: TRACK_GAP,
    });

    const timlineTrackListRef = useRef<HTMLDivElement>(null);
    const timelineTrackLabelsRef = useRef<HTMLDivElement>(null);
    const tracksAreaRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = React.useState(false);
    // Play/pause handlers
    const handlePlayPause = (playing: boolean) => {
        setIsPlaying(playing);
        if (playing) startPlayhead();
        else stopPlayhead();
    };
    // Seek handler
    const handleSeek = (time: number) => {
        setPlayhead(time);
    };
    // Reset handler
  const handleReset = () => {
        setIsPlaying(false);
        stopPlayhead();
    setPlayhead(0);
  };

  // Drag-to-move handler (still local, but updates global state)
  const handleResponseMove = (idx: number, newX: number, newY: number) => {
    const newTrack = centerYToTrackIndex(newY, tracks.length);
    setDragOverTrack(newTrack);
    // Don't update state here, only onMoveEnd
  };
  const handleResponseMoveEnd = (idx: number, newX: number, newY: number) => {
    const duration = responses[idx].end - responses[idx].start;
        const totalDuration = audioBuffer?.duration || DEFAULT_DURATION;
        let newStart = xToTime({
            x: newX,
            duration: totalDuration,
            width: timelineSize.width,
        });
        newStart = Math.max(0, Math.min(totalDuration - duration, newStart));
    const newTrack = centerYToTrackIndex(newY, tracks.length);
    setDragOverTrack(null);
        if (typeof setResponses === "function") {
      setResponses((prev: typeof responses) => {
        const updated = prev.map((resp, i) =>
          i === idx
            ? {
                ...resp,
                start: newStart,
                end: newStart + duration,
                track: newTrack,
              }
            : resp
        );
        return updated;
      });
    }
  };

    // Auto-scroll timeline horizontally to keep playhead in view
    useEffect(() => {
        if (!timlineTrackListRef.current) return;
        const container = timlineTrackListRef.current;
        const duration = audioBuffer?.duration || DEFAULT_DURATION;
        const playheadX = timeToX({
            time: playhead,
            duration,
            width: container.scrollWidth,
        });
        const containerWidth = container.clientWidth;
        // If playhead is outside the visible area, scroll to center it
        if (playheadX < container.scrollLeft || playheadX > container.scrollLeft + containerWidth - 40) {
            container.scrollLeft = Math.max(0, playheadX - containerWidth / 2);
        }
    }, [playhead, timlineTrackListRef, audioBuffer]);

    // Compute windowStart: keep playhead centered in window except near start/end
    const audioDuration = audioBuffer?.duration || DEFAULT_DURATION;
    const minWindowStart = 0;
    const maxWindowStart = audioDuration - windowDuration;
    let windowStart = Math.max(
      minWindowStart,
      Math.min(
        playhead - windowDuration / 2,
        maxWindowStart
      )
    );
    windowStart = Math.max(0, windowStart);

    // Compute local playhead position relative to the visible window
    const localPlayhead = playhead - windowStart;
    const windowWidth = timelineSize.width - TIMELINE_LEFT - TIMELINE_RIGHT_PAD;
    const playheadX = (localPlayhead / windowDuration) * windowWidth + TIMELINE_LEFT;

    // Get the actual label width from the ref, fallback to 160 if not available
    const labelWidth = timelineTrackLabelsRef.current?.clientWidth || 160;
    // Calculate the width of the tracks area (excluding labels and pads)
    const timelineTracksOnlyWidth = timelineSize.width - labelWidth - TIMELINE_LEFT - TIMELINE_RIGHT_PAD;

    // --- Trigger on playback time reaching response rect start ---
    const triggeredRectsRef = useRef<Set<number>>(new Set());
    useEffect(() => {
        if (!isPlaying) {
            // Reset triggers when playback stops or resets
            triggeredRectsRef.current.clear();
            return;
        }
        const validResponses = responses.filter(
            (resp) =>
                Number.isFinite(resp.start) &&
                Number.isFinite(resp.end) &&
                resp.end > resp.start &&
                Number.isFinite(resp.track) &&
                resp.track >= 0 &&
                resp.track < tracks.length
        );
        validResponses.forEach((resp, idx) => {
            if (
                !triggeredRectsRef.current.has(idx) &&
                playhead >= resp.start
            ) {
                triggeredRectsRef.current.add(idx);
                console.log(`Playback reached start of response rect #${idx} (start=${resp.start})`, playhead);
                // TODO: Replace with your trigger action
            }
        });
    }, [playhead, isPlaying, responses, tracks.length]);

  return (
        <div
            style={{
                position: "relative",
                width: "auto",
                height: "auto",
                maxHeight: "94vh",
                overflow: "auto",
      background: muiBg,
      borderRadius: 18,
      boxShadow: `0 4px 48px ${muiShadow}`,
      padding: 56,
      color: muiText,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
            }}
        >
            <TimelineControls
                windowDuration={windowDuration}
                setWindowDuration={setWindowDuration}
                audioDuration={audioDuration}
            />
      <h3 style={{ color: muiAccent, marginTop: 0 }}>Timeline</h3>
      {/* Band selector toggle */}
      {bandNames.length > 0 && (
                <div
                    style={{
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span style={{ fontWeight: 600, color: muiAccent }}>
                        Band Overlay:
                    </span>
          {bandNames.map((name, idx) => (
            <button
              key={name}
              onClick={() => setSelectedBandIdx(idx)}
              style={{
                marginRight: 6,
                borderRadius: 6,
                                background:
                                    selectedBandIdx === idx
                                        ? muiAccent
                                        : "#b0bec5",
                                color:
                                    selectedBandIdx === idx ? muiBg : muiText,
                                border: "none",
                                padding: "4px 14px",
                fontWeight: 600,
                                cursor: "pointer",
                                outline:
                                    selectedBandIdx === idx
                                        ? `2px solid ${muiAccent}`
                                        : "none",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {/* Template selector */}
            <div
                style={{
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span style={{ fontWeight: 600, color: muiAccent }}>
                    Template:
                </span>
        {TEMPLATES.map((tpl, idx) => (
          <button
            key={tpl.name}
            onClick={() => handleTemplateSelect(idx, TEMPLATES)}
            style={{
              marginRight: 6,
              borderRadius: 6,
                            background:
                                templateIdx === idx ? muiAccent : "#b0bec5",
              color: templateIdx === idx ? muiBg : muiText,
                            border: "none",
                            padding: "4px 14px",
              fontWeight: 600,
                            cursor: "pointer",
                            outline:
                                templateIdx === idx
                                    ? `2px solid ${muiAccent}`
                                    : "none",
            }}
          >
            {tpl.name}
          </button>
        ))}
      </div>
      {/* Underlay toggle */}
            <div
                style={{
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span style={{ fontWeight: 600, color: muiAccent }}>
                    Underlay:
                </span>
        {UNDERLAY_OPTIONS.map((opt: UnderlayType) => (
          <button
            key={opt}
            onClick={() => setUnderlay(opt)}
            style={{
              marginRight: 6,
              borderRadius: 6,
                            background:
                                underlay === opt ? muiAccent : "#b0bec5",
              color: underlay === opt ? muiBg : muiText,
                            border: "none",
                            padding: "4px 14px",
              fontWeight: 600,
                            cursor: "pointer",
                            outline:
                                underlay === opt
                                    ? `2px solid ${muiAccent}`
                                    : "none",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
            {/* Playback controls */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    mb: 1,
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setIsPlaying(true)}
                    disabled={isPlaying}
                    sx={{ minWidth: 80 }}
                >
                    Play
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setIsPlaying(false)}
                    disabled={!isPlaying}
                    sx={{ minWidth: 80 }}
                >
                    Pause
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{ minWidth: 80 }}
                >
                    Reset
                </Button>
            </Box>
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                }}
            >
                {/* WaveSurfer Spectrogram will go here, aligned with timeline */}
                {audioBuffer && (
                    <div
                        style={{
                            position: "relative",
                            width: timelineTracksOnlyWidth,
                            transform: `translateX(${TIMELINE_LEFT + labelWidth}px)`,
                        }}
                    >
                        <WaveSurferSpectrogram
                            audioBuffer={audioBuffer}
                            isPlaying={isPlaying}
                            playhead={playhead}
                            onSeek={handleSeek}
                            onPlayPause={handlePlayPause}
                            duration={audioBuffer.duration}
                            width={timelineTracksOnlyWidth}
                        />
                    </div>
                )}
      <div
        ref={timelineContainerRef}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          width: "100%",
          height: timelineSize.height,
          background: muiBg,
          borderRadius: 16,
          boxShadow: `0 2px 24px ${muiShadow}`,
        }}
      >
        {/* Track labels column */}
                    <div
                        ref={timelineTrackLabelsRef}
                        style={{
                            width: LABEL_WIDTH,
                            minWidth: LABEL_WIDTH,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-end",
                            paddingTop: 40,
                            height: "100%",
                        }}
                    >
          <TrackList
            tracks={tracks}
            editingTrack={editingTrack}
            editingValue={editingValue}
            editingType={editingType}
                            onEdit={(i) => {
              setEditingTrack(i);
              setEditingValue(tracks[i].name);
              setEditingType(tracks[i].type);
            }}
            onEditCommit={handleTrackNameCommit}
            onEditChange={handleTrackNameChange}
                            onTypeChange={(e) =>
                                setEditingType(e.target.value as TrackType)
                            }
          />
        </div>
        {/* Timeline Stage with underlay canvas absolutely positioned */}
                    <div
                        ref={tracksAreaRef}
                        style={{
          flex: 1,
          minWidth: 400,
          position: "relative",
          overflow: "hidden",
          height: "100%",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
        }}
                    >
          {/* Underlay canvas */}
                        <div
                            style={{
                                position: "absolute",
                                left: TIMELINE_LEFT,
                                top: 40,
                                width: `calc(100% - ${
                                    TIMELINE_LEFT + TIMELINE_RIGHT_PAD
                                }px)`,
                                height: timelineSize.height - 40,
                                pointerEvents: "none",
                            }}
                        >
            <UnderlayCanvas
              type={underlay}
                                width={
                                    timelineSize.width -
                                    TIMELINE_LEFT -
                                    TIMELINE_RIGHT_PAD
                                }
              height={timelineSize.height - 40}
                                audioData={
                                    audioBuffer
                                        ? audioBuffer.getChannelData(0)
                                        : undefined
                                }
            />
            {/* Band overlay canvas */}
            {bandDataArr[selectedBandIdx]?.magnitudes && (
              <BandOverlayCanvas
                                    magnitudes={
                                        bandDataArr[selectedBandIdx].magnitudes
                                    }
                playhead={playhead}
                                    duration={audioBuffer?.duration || DEFAULT_DURATION}
                                    width={
                                        timelineSize.width -
                                        TIMELINE_LEFT -
                                        TIMELINE_RIGHT_PAD
                                    }
                height={timelineSize.height - 40}
              />
            )}
          </div>
          <Stage
            width={timelineSize.width}
            height={timelineSize.height}
            style={{
                background: "none",
                borderRadius: 10,
                width: "100%",
                height: "100%",
                position: "relative",
                zIndex: 1,
            }}
            onClick={e => handleStageClick(
                e as unknown as import("konva/lib/Node").KonvaEventObject<PointerEvent>,
                timelineTrackLabelsRef,
                windowStart,
                windowDuration,
                timelineTracksOnlyWidth,
                tracksAreaRef
            )}
          >
            <Layer>
              <Text
                x={TIMELINE_LEFT + 10}
                y={10}
                text={`playhead: ${playhead.toFixed(2)}, windowStart: ${windowStart.toFixed(2)}, windowDuration: ${windowDuration.toFixed(2)}, playheadX: ${playheadX.toFixed(2)}`}
              />
              <TimelineGrid
                width={timelineTracksOnlyWidth}
                tracks={tracks}
                muiText={muiText}
                muiShadow={muiShadow}
                dragOverTrack={dragOverTrack}
                windowStart={windowStart}
                windowDuration={windowDuration}
              />
              {/* Draw responses */}
              {(() => {
                const validResponses = responses.filter(
                                        (resp) =>
                                            Number.isFinite(resp.start) &&
                                            Number.isFinite(resp.end) &&
                                            resp.end > resp.start &&
                                            Number.isFinite(resp.track) &&
                                            resp.track >= 0 &&
                                            resp.track < tracks.length
                                    );
                                    if (
                                        validResponses.length !==
                                        responses.length
                                    ) {
                                        console.warn(
                                            "Filtered out invalid responses:",
                                            responses.filter(
                                                (r) =>
                                                    !validResponses.includes(r)
                                            )
                                        );
                }
                return validResponses.map((resp, idx) => {
                  const y = trackIndexToRectY(resp.track);
                  const x1 = timeToXWindow({
                    time: resp.start,
                    windowStart,
                    windowDuration,
                    width: timelineTracksOnlyWidth,
                  });
                  const x2 = timeToXWindow({
                    time: resp.end,
                    windowStart,
                    windowDuration,
                    width: timelineTracksOnlyWidth,
                  });
                  return (
                    <ResponseRect
                      key={idx}
                      x1={x1}
                      x2={x2}
                      y={y}
                      fill={muiAccent}
                      shadowColor={muiShadow}
                      shadowBlur={4}
                      cornerRadius={4}
                                                onResizeLeft={(newStart) => {
                                                    if (
                                                        Math.abs(
                                                            newStart -
                                                                resp.start
                                                        ) > 1e-4 &&
                                                        newStart <
                                                            resp.end - 0.1 &&
                                                        newStart >= windowStart
                                                    ) {
                                                        handleResize(
                                                            idx,
                                                            "left",
                                                            newStart
                                                        );
                                                    }
                                                }}
                                                onResizeRight={(newEnd) => {
                                                    if (
                                                        Math.abs(
                                                            newEnd - resp.end
                                                        ) > 1e-4 &&
                                                        newEnd >
                                                            resp.start + 0.1 &&
                                                        newEnd <=
                                                            windowStart +
                                                                windowDuration
                                                    ) {
                                                        handleResize(
                                                            idx,
                                                            "right",
                                                            newEnd
                                                        );
                                                    }
                                                }}
                                                onResizeLeftEnd={(e) => {
                                                    e.target.position({
                                                        x: x1 - 5,
                                                        y: y,
                                                    });
                                                }}
                                                onResizeRightEnd={(e) => {
                                                    e.target.position({
                                                        x: x2 - 5,
                                                        y: y,
                                                    });
                                                }}
                                                xToTime={(x) =>
                                                    xToTimeWindow({
                                                        x,
                                                        windowStart,
                                                        windowDuration,
                                                        width: timelineTracksOnlyWidth,
                                                    })
                                                }
                      minX={TIMELINE_LEFT}
                                                maxX={
                                                    timelineTracksOnlyWidth
                                                }
                                                onMove={(newX, newY) =>
                                                    handleResponseMove(
                                                        idx,
                                                        newX,
                                                        newY
                                                    )
                                                }
                                                onMoveEnd={(newX, newY) =>
                                                    handleResponseMoveEnd(
                                                        idx,
                                                        newX,
                                                        newY
                                                    )
                                                }
                    />
                  );
                });
              })()}
              {/* Draw playhead */}
              <Line
                points={[
                    playheadX,
                    30,
                    playheadX,
                    timelineSize.height - 10,
                ]}
                stroke="#ff5252"
                strokeWidth={2}
                dash={[8, 6]}
              />
            </Layer>
          </Stage>
        </div>
      </div>
            </Box>
            <div style={{ color: "#b0bec5", marginTop: 12, fontSize: 15 }}>
                <p>
                    Click on a track name to rename it. Click on a track to add
                    a response at that time. Use Play/Pause/Reset to control the
                    playhead.
                </p>
                <p>
                    Use the Underlay toggle above to preview how a waveform or
                    frequency plot would look beneath your timeline.
                </p>
      </div>
    </div>
  );
};

export default TimeTracks; 
