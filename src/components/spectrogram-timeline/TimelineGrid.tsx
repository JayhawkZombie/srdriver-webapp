import React from "react";
import { Line, Rect, Text, Group } from "react-konva";
import { TRACK_HEIGHT, trackIndexToRectY } from "./timelineMath";

interface Track {
    name: string;
    type: string;
}

interface TimelineGridProps {
    width: number;
    // height: number; // unused
    tracks: Track[];
    duration: number;
    muiText: string;
    muiShadow: string;
    dragOverTrack?: number | null;
}

const TimelineGrid: React.FC<TimelineGridProps> = ({
    width,
    tracks,
    duration,
    muiText,
    muiShadow,
    dragOverTrack,
}) => {
    return (
        <Group>
            {/* Timeline axis */}
            <Line
                points={[50, 30, width - 10, 30]}
                stroke={muiText}
                strokeWidth={2}
            />
            {/* Time ticks */}
            {Array.from({ length: duration + 1 }).map((_, i) => {
                const tickX = 50 + (width - 60) * (i / duration);
                return (
                    <Group key={i}>
                        <Line
                            points={[tickX, 25, tickX, 35]}
                            stroke={muiText}
                            strokeWidth={1}
                        />
                        <Text
                            x={tickX - 8}
                            y={10}
                            text={i.toString()}
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
