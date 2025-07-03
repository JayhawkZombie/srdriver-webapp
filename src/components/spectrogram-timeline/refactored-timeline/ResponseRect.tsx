import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

export interface ResponseRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  selected?: boolean;
  hovered?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onDragStart?: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onResizeStart?: (e: any, edge: 'start' | 'end') => void;
  onContextMenu?: (e: any) => void;
}

export const ResponseRect: React.FC<ResponseRectProps> = ({
  x, y, width, height, selected, hovered,
  onPointerDown, onPointerUp, onPointerMove,
  onDragStart, onDragMove, onDragEnd,
  onResizeStart, onContextMenu,
}) => (
  <Group
    x={x}
    y={y}
    onMouseDown={onPointerDown}
    onMouseUp={onPointerUp}
    onMouseMove={onPointerMove}
    onDragStart={onDragStart}
    onDragMove={onDragMove}
    onDragEnd={onDragEnd}
    onContextMenu={onContextMenu}
    draggable={!!onDragMove}
  >
    <Rect
      width={width}
      height={height}
      fill={selected ? '#4fc3f7' : hovered ? '#90caf9' : '#2196f3'}
      shadowBlur={selected ? 8 : 0}
      cornerRadius={4}
    />
    {/* Resize handles */}
    {(selected || hovered) && (
      <>
        <Circle
          x={0}
          y={height / 2}
          radius={6}
          fill="#fff"
          stroke="#2196f3"
          strokeWidth={2}
          onMouseDown={e => onResizeStart?.(e, 'start')}
        />
        <Circle
          x={width}
          y={height / 2}
          radius={6}
          fill="#fff"
          stroke="#2196f3"
          strokeWidth={2}
          onMouseDown={e => onResizeStart?.(e, 'end')}
        />
      </>
    )}
  </Group>
);

export default ResponseRect; 