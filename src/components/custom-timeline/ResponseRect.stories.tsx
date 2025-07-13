import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { ResponseRect } from './ResponseRect';
import { useTimelinePointerHandler } from './useTimelinePointerHandler';
import TimelineContextMenu, { type TimelineMenuAction } from './TimelineContextMenu';
import type { ResponseRectProps } from './ResponseRect';

function randomColor() {
  // Pastel random color
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 70%)`;
}

export default {
  title: 'RefactoredTimeline/ResponseRect',
  component: ResponseRect,
};

export const FullInteractive = () => {
  const [rects, setRects] = useState([
    { id: 'rect1', timestamp: 1, duration: 2, trackIndex: 0, color: randomColor(), borderColor: '#fff' },
    { id: 'rect2', timestamp: 2.5, duration: 1.2, trackIndex: 0, color: randomColor(), borderColor: '#fff' },
  ]);
  const [menu, setMenu] = useState<{
    open: boolean;
    position: { x: number; y: number } | null;
    info: any;
    type: 'rect' | 'bg' | null;
  }>({
    open: false,
    position: null,
    info: null,
    type: null,
  });
  const menuRef = useRef(null);

  const geometry = {
    windowStart: 0,
    windowDuration: 5,
    tracksWidth: 300,
    tracksTopOffset: 0,
    trackHeight: 32,
    trackGap: 0,
    numTracks: 1,
    totalDuration: 5,
  };

  // Add rect on background click
  const handleStageClick = (e: any) => {
    if (e.target.name() !== 'stage-bg') return; // Only add if clicking on background
    e.evt.preventDefault();
    const boundingRect = e.target.getStage().container().getBoundingClientRect();
    const pointerX = e.evt.clientX;
    const pointerY = e.evt.clientY;
    const x = pointerX - boundingRect.left;
    const time = geometry.windowStart + (x / geometry.tracksWidth) * geometry.windowDuration;
    const defaultDuration = 1;
    const timestamp = Math.max(0, Math.min(time, geometry.totalDuration - defaultDuration));
    setRects(rects => [
      ...rects,
      {
        id: `rect${Math.random().toString(36).slice(2, 8)}`,
        timestamp,
        duration: defaultDuration,
        trackIndex: 0,
        color: randomColor(),
        borderColor: '#fff',
      },
    ]);
  };

  // Context menu for background
  const handleStageContextMenu = (e: any) => {
    if (e.target.name() !== 'stage-bg') return;
    e.evt.preventDefault();
    setMenu({
      open: true,
      position: { x: e.evt.clientX, y: e.evt.clientY },
      info: {},
      type: 'bg',
    });
  };

  // Context menu for rect
  const handleRectContextMenu = (rect: any, e: any) => {
    e.evt.preventDefault();
    setMenu({
      open: true,
      position: { x: e.evt.clientX, y: e.evt.clientY },
      info: rect,
      type: 'rect',
    });
  };

  // Move and resize logic for rects
  const handleRectMove = (id: string, { timestamp, trackIndex }: { timestamp: number; trackIndex: number }) => {
    setRects(rects => rects.map(r => r.id === id ? { ...r, timestamp, trackIndex } : r));
  };
  const handleRectResize = (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => {
    setRects(rects => rects.map(r => r.id === id ? { ...r, timestamp: edge === 'start' ? newTimestamp : r.timestamp, duration: newDuration } : r));
  };

  // Use pointer handler for rects only
  const pointerHandler = useTimelinePointerHandler({
    ...geometry,
    responses: rects,
    onRectMove: handleRectMove,
    onRectResize: handleRectResize,
  });

  const rectActions = [
    {
      key: 'delete',
      text: 'Delete Rect',
      icon: 'trash',
      onClick: (info: any) => {
        setRects(rects => rects.filter(r => r.id !== info.id));
        setMenu({ open: false, position: null, info: null, type: null });
      },
    },
    {
      key: 'close',
      text: 'Close',
      icon: 'cross',
      onClick: () => setMenu({ open: false, position: null, info: null, type: null }),
    },
  ];
  const bgActions = [
    {
      key: 'add',
      text: 'Add Rect Here',
      icon: 'add',
      onClick: () => setMenu({ open: false, position: null, info: null, type: null }),
    },
    {
      key: 'close',
      text: 'Close',
      icon: 'cross',
      onClick: () => setMenu({ open: false, position: null, info: null, type: null }),
    },
  ];

  return (
    <div style={{ position: 'relative', width: geometry.tracksWidth, height: 120 }}>
      <Stage
        width={geometry.tracksWidth}
        height={120}
        style={{ background: '#222', borderRadius: 8 }}
        onClick={handleStageClick}
        onContextMenu={handleStageContextMenu}
      >
        <Layer>
          {/* Background shape for hit testing */}
          <Rect
            name="stage-bg"
            x={0}
            y={0}
            width={geometry.tracksWidth}
            height={120}
            fill="rgba(0,0,0,0)"
            listening={true}
          />
          {rects.map(rect => {
            const x = ((rect.timestamp - geometry.windowStart) / geometry.windowDuration) * geometry.tracksWidth;
            const y = geometry.tracksTopOffset + rect.trackIndex * (geometry.trackHeight + geometry.trackGap) + geometry.trackHeight / 2 - 16;
            const width = (rect.duration / geometry.windowDuration) * geometry.tracksWidth;
            const height = 32;
            const rectProps: ResponseRectProps = {
              x,
              y,
              width,
              height,
              color: rect.color,
              borderColor: rect.borderColor,
              ...pointerHandler.getRectProps(rect.id),
              onContextMenu: (e: any) => handleRectContextMenu(rect, e),
            };
            return (
              <ResponseRect
                key={rect.id}
                {...rectProps}
              />
            );
          })}
        </Layer>
      </Stage>
      <TimelineContextMenu
        isOpen={menu.open}
        position={menu.position}
        info={menu.info}
        onClose={() => setMenu({ open: false, position: null, info: null, type: null })}
        menuRef={menuRef}
        actions={menu.type === 'rect' ? rectActions : bgActions}
      />
    </div>
  );
}; 