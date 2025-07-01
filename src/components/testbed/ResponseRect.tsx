import React, { useState } from 'react';
import { Group, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { leftHandleX, rightHandleX, mainRectWidth, RESPONSE_RECT_HEIGHT_INNER, HANDLE_OFFSET } from './timelineMath';

interface ResponseRectProps {
  x1: number;
  x2: number;
  y: number;
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
  /**
   * Called when the main rectangle is dragged. (newX, newY) are the top-left corner.
   */
  onMove?: (newX: number, newY: number) => void;
  /**
   * Called when the main rectangle drag ends. (newX, newY) are the top-left corner.
   */
  onMoveEnd?: (newX: number, newY: number) => void;
}

// Memoized for performance: only re-renders if props change
const ResponseRect: React.FC<ResponseRectProps> = React.memo(({
  x1, x2, y, fill, shadowColor, shadowBlur, cornerRadius,
  onResizeLeft, onResizeRight, onResizeLeftEnd, onResizeRightEnd, xToTime, minX, maxX,
  onMove, onMoveEnd
}) => {
  // Local state for dragging the main rect
  const [dragMain, setDragMain] = useState<{ x: number; y: number } | null>(null);
  // Local state for dragging handles
  const [dragLeftX, setDragLeftX] = useState<number | null>(null);
  const [dragRightX, setDragRightX] = useState<number | null>(null);

  const width = x2 - x1;
  if (!Number.isFinite(x1) || !Number.isFinite(x2) || !Number.isFinite(width) || width <= 0) return <Group />;

  // Use local drag state if dragging, otherwise use props
  const mainX = dragMain ? dragMain.x : (dragLeftX !== null ? dragLeftX + HANDLE_OFFSET : x1);
  const mainY = dragMain ? dragMain.y : y;
  const mainWidth = mainRectWidth(x1, x2, dragLeftX, dragRightX);
  const leftX = dragMain ? dragMain.x - HANDLE_OFFSET : (dragLeftX !== null ? dragLeftX : leftHandleX(x1));
  const rightX = dragMain ? dragMain.x + mainWidth - HANDLE_OFFSET : (dragRightX !== null ? dragRightX : rightHandleX(x1, x2 - x1));
  const handleY = mainY;

  // Left handle drag
  const handleLeftDragMove = (e: KonvaEventObject<DragEvent>) => {
    setDragLeftX(e.target.x());
  };
  const handleLeftDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const newX = e.target.x() + 5;
    const newStart = xToTime(newX);
    setDragLeftX(null);
    onResizeLeft(newStart);
    if (onResizeLeftEnd) onResizeLeftEnd(e);
  };

  // Right handle drag
  const handleRightDragMove = (e: KonvaEventObject<DragEvent>) => {
    setDragRightX(e.target.x());
  };
  const handleRightDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const newX = e.target.x() + 5;
    const newEnd = xToTime(newX);
    setDragRightX(null);
    onResizeRight(newEnd);
    if (onResizeRightEnd) onResizeRightEnd(e);
  };

  return (
    <Group>
      {/* Main response rectangle */}
      <Rect
        x={mainX}
        y={mainY}
        width={mainWidth}
        height={RESPONSE_RECT_HEIGHT_INNER}
        fill={fill}
        cornerRadius={cornerRadius}
        shadowBlur={shadowBlur}
        shadowColor={shadowColor}
        draggable
        dragBoundFunc={pos => ({
          x: Math.max(minX, Math.min(pos.x, maxX - mainWidth)),
          y: Math.max(0, pos.y) // allow vertical drag, clamp to top
        })}
        onDragStart={() => {
          setDragMain({ x: x1, y: y });
        }}
        onDragMove={e => {
          setDragMain({ x: e.target.x(), y: e.target.y() });
          if (typeof onMove === 'function') onMove(e.target.x(), e.target.y());
        }}
        onDragEnd={e => {
          if (typeof onMoveEnd === 'function') onMoveEnd(e.target.x(), e.target.y() + e.target.height() / 2);
          setDragMain(null);
        }}
        cursor="move"
      />
      {/* Left handle */}
      <Rect
        x={leftX}
        y={handleY}
        width={10}
        height={RESPONSE_RECT_HEIGHT_INNER}
        fill="#fff"
        opacity={0.8}
        draggable
        dragBoundFunc={pos => ({
          x: Math.max(minX, Math.min(pos.x, x2 - 15)),
          y: handleY
        })}
        onDragMove={handleLeftDragMove}
        onDragEnd={handleLeftDragEnd}
        cursor="ew-resize"
      />
      {/* Right handle */}
      <Rect
        x={rightX}
        y={handleY}
        width={10}
        height={RESPONSE_RECT_HEIGHT_INNER}
        fill="#fff"
        opacity={0.8}
        draggable
        dragBoundFunc={pos => ({
          x: Math.max(x1 + 15, Math.min(pos.x, maxX)),
          y: handleY
        })}
        onDragMove={handleRightDragMove}
        onDragEnd={handleRightDragEnd}
        cursor="ew-resize"
      />
    </Group>
  );
});

export default ResponseRect; 