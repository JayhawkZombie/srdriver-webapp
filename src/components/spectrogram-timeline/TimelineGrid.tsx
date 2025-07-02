import React from "react";
import { Line, Rect, Text, Group } from "react-konva";
import { TRACK_HEIGHT, trackIndexToRectY, timeToXWindow } from "./timelineMath";

interface Track {
    name: string;
    type: string;
}

interface TimelineGridProps {
    width: number;
    tracks: Track[];
    muiText: string;
    muiShadow: string;
    dragOverTrack?: number | null;
    windowStart: number;
    windowDuration: number;
}

const TimelineGrid: React.FC<TimelineGridProps> = ({
    width,
    tracks,
    muiText,
    muiShadow,
    dragOverTrack,
    windowStart,
    windowDuration,
}) => {
    // Only show ticks for the visible window
    const startTick = Math.ceil(windowStart);
    const endTick = Math.floor(windowStart + windowDuration);
    return (
        <Group>
            {/* Timeline axis */}
            <Line
                points={[50, 30, width - 10, 30]}
                stroke={muiText}
                strokeWidth={2}
            />
            {/* Time ticks for window */}
            {Array.from({ length: endTick - startTick + 1 }).map((_, i) => {
                const t = startTick + i;
                if (t < windowStart || t > windowStart + windowDuration) return null;
                const tickX = timeToXWindow({
                    time: t,
                    windowStart,
                    windowDuration,
                    width,
                });
                return (
                    <Group key={t}>
                        <Line
                            points={[tickX, 25, tickX, 35]}
                            stroke={muiText}
                            strokeWidth={1}
                        />
                        <Text
                            x={tickX - 8}
                            y={10}
                            text={t.toString()}
                            fontSize={12}
                            fill={muiText}
                        />
                    </Group>
                );
            })}
            {/* Track backgrounds */}
            {tracks.map((track, i) => {
                const y = trackIndexToRectY(i) - 8; // Subtract RESPONSE_RECT_Y_OFFSET to align with full track background
                const isDragOver =
                    typeof dragOverTrack === "number" && dragOverTrack === i;
                return (
                    <Rect
                        key={track.name + i}
                        x={50}
                        y={y}
                        width={width - 60}
                        height={TRACK_HEIGHT}
                        fill={
                            isDragOver
                                ? "rgba(144,202,249,0.18)"
                                : "rgba(45,51,59,0.25)"
                        }
                        cornerRadius={8}
                        shadowBlur={4}
                        shadowColor={muiShadow}
                        stroke={isDragOver ? "#90caf9" : undefined}
                        strokeWidth={isDragOver ? 2 : 0}
                    />
                );
            })}
        </Group>
    );
};

export default TimelineGrid;
