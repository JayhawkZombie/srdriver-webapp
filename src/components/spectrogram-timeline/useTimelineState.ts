import { useState, useRef, useEffect, useCallback } from "react";
import {
    xToTime,
    xToTimeWindow,
    TRACK_HEIGHT,
    TRACK_GAP,
} from "./timelineMath";

export interface ResponseEvent {
    start: number;
    end: number;
    track: number;
}

export type TrackType = "device" | "frequency" | "custom";

export interface Track {
    name: string;
    type: TrackType;
    color?: string;
}

export interface UseTimelineStateOptions {
    defaultTracks: Track[];
    duration: number;
    trackHeight?: number;
    trackGap?: number;
    defaultResponseDuration?: number;
}

export function useTimelineState({
    defaultTracks,
    duration,
    trackHeight = TRACK_HEIGHT,
    trackGap = TRACK_GAP,
    defaultResponseDuration = 1,
}: UseTimelineStateOptions) {
    const [responses, setResponses] = useState<ResponseEvent[]>([]);
    const [playhead, setPlayhead] = useState(0);
    const [tracks, setTracks] = useState<Track[]>(defaultTracks);
    const [editingTrack, setEditingTrack] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [editingType, setEditingType] = useState<TrackType | null>(null);
    const [templateIdx, setTemplateIdx] = useState(0);
    const animRef = useRef<number | null>(null);
    const playingRef = useRef(false);
    const [underlay, setUnderlay] = useState<"None" | "Waveform" | "Frequency">(
        "None"
    );
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const [timelineSize, setTimelineSize] = useState({
        width: 800,
        height: 400,
    });
    const [windowStart, setWindowStart] = useState(0);
    const [windowDuration, setWindowDuration] = useState(15);

    // Dynamically size timeline to fill parent
    useEffect(() => {
        const handleResize = () => {
            if (timelineContainerRef.current) {
                const rect =
                    timelineContainerRef.current.getBoundingClientRect();
                const neededHeight =
                    40 + tracks.length * (trackHeight + trackGap) + 20;
                setTimelineSize({
                    width: Math.max(400, rect.width),
                    height: Math.max(
                        neededHeight,
                        Math.min(rect.height, window.innerHeight * 0.7)
                    ),
                });
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [tracks.length, trackHeight, trackGap]);

    // Playhead animation
    const startPlayhead = useCallback(() => {
        if (playingRef.current) return;
        playingRef.current = true;
        const start = performance.now() - playhead * 1000;
        const animate = (now: number) => {
            if (!playingRef.current) return;
            const t = Math.min((now - start) / 1000, duration);
            setPlayhead(t);
            if (t < duration) {
                animRef.current = requestAnimationFrame(animate);
            } else {
                playingRef.current = false;
            }
        };
        animRef.current = requestAnimationFrame(animate);
    }, [playhead, duration]);
    const stopPlayhead = useCallback(() => {
        playingRef.current = false;
        if (animRef.current) cancelAnimationFrame(animRef.current);
    }, []);
    const resetPlayhead = useCallback(() => {
        stopPlayhead();
        setPlayhead(0);
    }, [stopPlayhead]);

    // Converts X coordinate to time (seconds)
    const xToTimeLocal = useCallback(
        (x: number) => xToTime({ x, duration, width: timelineSize.width }),
        [timelineSize.width, duration]
    );

    // Click to add response
    const handleStageClick = useCallback(
        (
            e: import("konva/lib/Node").KonvaEventObject<PointerEvent>,
            timelineTrackLabelsRef: React.RefObject<HTMLDivElement>,
            windowStart: number,
            windowDuration: number,
            timelineTracksOnlyWidth: number,
            tracksAreaRef: React.RefObject<HTMLDivElement>
        ) => {
            console.log('Stage clicked!');
            console.log('editingTrack:', editingTrack);
            console.log('tracksAreaRef.current:', tracksAreaRef.current);
            if (editingTrack !== null) return;
            if (!tracksAreaRef.current) return;
            const clientX = e.evt.clientX;
            const tracksRect = tracksAreaRef.current.getBoundingClientRect();
            const timelineX = clientX - tracksRect.left;
            const pointer = e.target.getStage()?.getPointerPosition();
            const y = pointer ? pointer.y : 0;
            console.log('handleStageClick debug:', {
                clientX,
                tracksRectLeft: tracksRect.left,
                timelineX,
                timelineTracksOnlyWidth,
                windowStart,
                windowDuration,
                pointerY: y
            });
            if (
                timelineX < 0 ||
                timelineX > timelineTracksOnlyWidth
            ) {
                console.log('Click outside timeline X bounds');
                return;
            }
            let added = false;
            for (let i = 0; i < tracks.length; i++) {
                const top = 40 + i * (trackHeight + trackGap);
                const bottom = top + trackHeight;
                console.log(`Checking track ${i}: y=${y}, top=${top}, bottom=${bottom}`);
                if (y >= top && y <= bottom) {
                    let start = xToTimeWindow({
                        x: timelineX,
                        windowStart,
                        windowDuration,
                        width: timelineTracksOnlyWidth,
                    });
                    console.log('Computed start time:', start);
                    start = Math.max(
                        0,
                        Math.min(duration - defaultResponseDuration, start)
                    );
                    const end = Math.min(
                        duration,
                        start + defaultResponseDuration
                    );
                    setResponses((prev) => [...prev, { start, end, track: i }]);
                    console.log(`Added rect: { start: ${start}, end: ${end}, track: ${i} }`);
                    added = true;
                    break;
                }
            }
            if (!added) {
                console.log('Click did not hit any track row');
            }
        },
        [
            editingTrack,
            tracks.length,
            duration,
            windowStart,
            windowDuration,
            timelineSize.width,
            trackHeight,
            trackGap,
            defaultResponseDuration,
        ]
    );

    // Resize response
    const handleResize = useCallback(
        (idx: number, edge: "left" | "right", newTime: number) => {
            setResponses((prev) =>
                prev.map((resp, i) => {
                    if (i !== idx) return resp;
                    if (edge === "left") {
                        const newStart = Math.max(
                            0,
                            Math.min(resp.end - 0.1, newTime)
                        );
                        return { ...resp, start: newStart };
                    } else {
                        const newEnd = Math.min(
                            duration,
                            Math.max(resp.start + 0.1, newTime)
                        );
                        return { ...resp, end: newEnd };
                    }
                })
            );
        },
        [duration]
    );

    // Track name editing
    const handleTrackNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditingValue(e.target.value);
        },
        []
    );
    const handleTrackNameCommit = useCallback(() => {
        if (editingTrack !== null) {
            setTracks((prev) =>
                prev.map((track, i) =>
                    i === editingTrack
                        ? {
                              ...track,
                              name: editingValue.trim() || track.name,
                              type: editingType ?? track.type,
                          }
                        : track
                )
            );
            setEditingTrack(null);
            setEditingValue("");
            setEditingType(null);
        }
    }, [editingTrack, editingValue, editingType]);

    // Template selection
    const handleTemplateSelect = useCallback(
        (
            idx: number,
            templates: {
                name: string;
                tracks: { name: string; type: TrackType }[];
            }[]
        ) => {
            setTemplateIdx(idx);
            setTracks(templates[idx].tracks.map((t) => ({ ...t })));
            setEditingTrack(null);
            setEditingValue("");
            setEditingType(null);
        },
        []
    );

    return {
        responses,
        setResponses,
        playhead,
        setPlayhead,
        startPlayhead,
        stopPlayhead,
        resetPlayhead,
        tracks,
        setTracks,
        editingTrack,
        setEditingTrack,
        editingValue,
        setEditingValue,
        editingType,
        setEditingType,
        templateIdx,
        setTemplateIdx,
        underlay,
        setUnderlay,
        timelineContainerRef,
        timelineSize,
        setTimelineSize,
        xToTimeLocal,
        handleStageClick,
        handleResize,
        handleTrackNameChange,
        handleTrackNameCommit,
        handleTemplateSelect,
        windowStart,
        setWindowStart,
        windowDuration,
        setWindowDuration,
        trackHeight,
        trackGap,
        defaultResponseDuration,
    };
}
