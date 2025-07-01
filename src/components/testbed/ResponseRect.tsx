import React from 'react';
import { Group, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface ResponseRectProps {
  x1: number;
  x2: number;
  y: number;
  height: number;
  fill: string;
  shadowColor: string;
  shadowBlur: number;
  cornerRadius: number;
  onResizeLeft: (newTime: number) => void;
  onResizeRight: (newTime: number) => void;
  onResizeLeftEnd?: (e: KonvaEventObject<DragEvent>) => void;
  onResizeRightEnd?: (e: KonvaEventObject<DragEvent>) => void;
  xToTime: (x: number) => number;
  minX: number;
  maxX: number;
}

const ResponseRect: React.FC<ResponseRectProps> = ({
  x1, x2, y, height, fill, shadowColor, shadowBlur, cornerRadius,
  onResizeLeft, onResizeRight, onResizeLeftEnd, onResizeRightEnd, xToTime, minX, maxX
}) => {
  const width = x2 - x1;
  if (!Number.isFinite(x1) || !Number.isFinite(x2) || !Number.isFinite(width) || width <= 0) return null;
  return (
    <Group>
      {/* Main response rectangle */}
      <Rect
        x={x1}
        y={y}
        width={width}
        height={height}
        fill={fill}
        cornerRadius={cornerRadius}
        shadowBlur={shadowBlur}
        shadowColor={shadowColor}
      />
      {/* Left handle */}
      <Rect
        x={x1 - 5}
        y={y}
        width={10}
        height={height}
        fill="#fff"
        opacity={0.8}
        draggable
        dragBoundFunc={pos => ({
          x: Math.max(minX, Math.min(pos.x, x2 - 15)),
          y: y
        })}
        onDragMove={e => {
          const newX = e.target.x() + 5;
          const newStart = xToTime(newX);
          onResizeLeft(newStart);
        }}
        onDragEnd={onResizeLeftEnd}
        cursor="ew-resize"
      />
      {/* Right handle */}
      <Rect
        x={x2 - 5}
        y={y}
        width={10}
        height={height}
        fill="#fff"
        opacity={0.8}
        draggable
        dragBoundFunc={pos => ({
          x: Math.max(x1 + 15, Math.min(pos.x, maxX)),
          y: y
        })}
        onDragMove={e => {
          const newX = e.target.x() + 5;
          const newEnd = xToTime(newX);
          onResizeRight(newEnd);
        }}
        onDragEnd={onResizeRightEnd}
        cursor="ew-resize"
      />
    </Group>
  );
};

export default ResponseRect; 