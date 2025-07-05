import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

export interface ResponseRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  selected?: boolean;
  hovered?: boolean;
  isGroupHovered?: boolean;
  hoveredHandle?: 'start' | 'end' | null;
  dragging?: boolean;
  resizing?: boolean;
  resizeEdge?: 'start' | 'end' | null;
  color?: string;
  borderColor?: string;
  opacity?: number;
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onDragStart?: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onResizeStart?: (e: any, edge: 'start' | 'end') => void;
  onResizeEnd?: (e: any) => void;
  onContextMenu?: (e: any) => void;
  onHandleMouseEnter?: (edge: 'start' | 'end') => void;
  onHandleMouseLeave?: () => void;
  onGroupMouseEnter?: () => void;
  onGroupMouseLeave?: () => void;
}

export const ResponseRect: React.FC<ResponseRectProps> = ({
  x, y, width, height, selected, hovered, isGroupHovered, hoveredHandle, dragging, resizing, resizeEdge,
  color, borderColor, opacity = 1,
  onPointerDown, onPointerUp, onPointerMove,
  onDragStart, onDragMove, onDragEnd,
  onResizeStart, onResizeEnd, onContextMenu,
  onHandleMouseEnter, onHandleMouseLeave, onGroupMouseEnter, onGroupMouseLeave,
}) => {
  // Rect outline color logic
  let stroke = borderColor || '#2196f3';
  let strokeWidth = 2;
  if (selected) {
    stroke = borderColor || '#4fc3f7';
    strokeWidth = 3;
  } else if (isGroupHovered || hovered) {
    stroke = borderColor || '#ffeb3b'; // High-contrast yellow
    strokeWidth = 4;
  }

  // Handle color logic
  const getHandleColors = (edge: 'start' | 'end') => {
    if (resizeEdge === edge && resizing) {
      return { fill: '#ff9800', stroke: '#ff9800' }; // Active resize: strong orange
    }
    if (hoveredHandle === edge) {
      return { fill: '#ffe082', stroke: '#ffb300', shadowBlur: 8, shadowColor: '#ffb300' }; // Hover: light yellow/orange, with glow
    }
    return { fill: '#fff', stroke: '#2196f3' };
  };

  return (
    <Group
      x={x}
      y={y}
      opacity={opacity}
      onMouseDown={onPointerDown}
      onMouseUp={onPointerUp}
      onMouseMove={onPointerMove}
      onDragStart={e => { console.log('onDragStart'); onDragStart?.(e); }}
      onDragMove={onDragMove}
      onDragEnd={e => { console.log('onDragEnd'); onDragEnd?.(e); }}
      onContextMenu={onContextMenu}
      draggable={true}
      onMouseEnter={onGroupMouseEnter}
      onMouseLeave={onGroupMouseLeave}
    >
      <Rect
        width={width}
        height={height}
        fill={color || (selected ? '#4fc3f7' : hovered ? '#90caf9' : '#2196f3')}
        shadowBlur={selected ? 8 : 0}
        cornerRadius={4}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
      {/* Resize handles */}
      {(selected || hovered || resizing) && (
        <>
          <Circle
            x={0}
            y={height / 2}
            radius={6}
            {...getHandleColors('start')}
            onMouseDown={e => onResizeStart?.(e, 'start')}
            onMouseUp={onResizeEnd}
            onMouseEnter={() => onHandleMouseEnter?.('start')}
            onMouseLeave={onHandleMouseLeave}
          />
          <Circle
            x={width}
            y={height / 2}
            radius={6}
            {...getHandleColors('end')}
            onMouseDown={e => onResizeStart?.(e, 'end')}
            onMouseUp={onResizeEnd}
            onMouseEnter={() => onHandleMouseEnter?.('end')}
            onMouseLeave={onHandleMouseLeave}
          />
        </>
      )}
    </Group>
  );
};

export default ResponseRect; 