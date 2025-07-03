import React from "react";
import { Rect, Text as KonvaText } from "react-konva";

interface TrackProps {
  y: number;
  height: number;
  label: string;
  width: number;
  styleOverride?: { fill?: string };
}

const Track: React.FC<TrackProps> = ({ y, height, label, width, styleOverride }) => {
  return (
    <>
      <Rect x={0} y={y} width={width} height={height} fill={styleOverride?.fill || "#23272f"} cornerRadius={8} />
      <KonvaText x={8} y={y + 8} text={label} fontSize={16} fill="#fff" />
    </>
  );
};

export default Track; 