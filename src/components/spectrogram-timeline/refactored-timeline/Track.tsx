import React from "react";
import { Rect, Text as KonvaText, Line } from "react-konva";

interface TrackProps {
  y: number;
  height: number;
  label: string;
  width: number;
  styleOverride?: { fill?: string };
  listening?: boolean;
  showMidline?: boolean;
}

const Track: React.FC<TrackProps> = ({ y, height, label, width, styleOverride, listening, showMidline }) => {
  return (
    <>
      <Rect x={0} y={y} width={width} height={height} fill={styleOverride?.fill || "#23272f"} cornerRadius={8} listening={listening} />
      {showMidline && (
        <Line
          points={[0, y + height / 2, width, y + height / 2]}
          stroke="#fff"
          strokeWidth={1}
          opacity={0.25}
        />
      )}
      <KonvaText x={8} y={y + 8} text={label} fontSize={16} fill="#fff" listening={listening} />
    </>
  );
};

export default Track; 