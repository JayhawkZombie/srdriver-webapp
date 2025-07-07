import React, { useState, useEffect } from "react";
import {
    useTimelineResponses,
    useAddTimelineResponse,
    useUpdateTimelineResponse,
    useSetTimelineResponses,
    useTrackTargets,
    useSetTrackTarget,
} from "../../store/appStore";
import { usePlayback } from "./PlaybackContext";
import { useAppStore } from "../../store/appStore";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import KonvaResponseTimeline from "./KonvaResponseTimeline";

export default {
    title: "RefactoredTimeline/CustomKonvaResponseTimeline",
};

export const CustomKonvaResponseTimeline = () => {
    // State and store hooks
    const responses = useTimelineResponses();
    const addTimelineResponse = useAddTimelineResponse();
    const updateTimelineResponse = useUpdateTimelineResponse();
    const setTimelineResponses = useSetTimelineResponses();
    const { totalDuration, currentTime } = usePlayback();
    const trackTargets = useTrackTargets();
    const palettes = useAppStore((state) => state.palettes);

    // Timeline geometry
    const numTracks = 3;
    const tracksWidth = 900;
    const tracksHeight = 300;
    const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
    const trackGap = 8;
    const tracksTopOffset = 32;

    // Window logic
    const [windowDuration, setWindowDuration] = useState(5);
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
        onBackgroundClick: ({
            time,
            trackIndex,
        }: {
            time: number;
            trackIndex: number;
        }) => {
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

    return (
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
            draggingId={draggingId}
            draggingRectPos={draggingRectPos}
            currentTime={currentTime}
            windowStart={windowStart}
            windowDuration={windowDuration}
        />
    );
};
