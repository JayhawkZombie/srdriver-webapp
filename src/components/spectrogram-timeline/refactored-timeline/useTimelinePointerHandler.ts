import { useState, useCallback, useRef } from "react";
import { getTimelinePointerInfo } from "./timelineMath";

/**
 * useTimelinePointerHandler
 *
 * Handles all pointer/drag/selection/context menu events for a timeline area.
 * Exposes pointerState and event handlers for the tracks area.
 *
 * API:
 *   const { getTrackAreaProps, pointerState } = useTimelinePointerHandler({ ...geometry, responses, ...callbacks });
 *
 * Callbacks (all optional):
 *   onPointerDown, onPointerUp, onPointerMove, onPointerLeave,
 *   onTrackClick, onDragStart, onDragMove, onDragEnd, onHover, onSelect, onContextMenu
 */
export function useTimelinePointerHandler({
  windowStart,
  windowDuration,
  tracksWidth,
  tracksTopOffset,
  trackHeight,
  trackGap,
  numTracks,
  totalDuration,
  responses,
  onPointerDown,
  onPointerUp,
  onPointerMove,
  onPointerLeave,
  onTrackClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHover,
  onSelect,
  onContextMenu,
}: {
  windowStart: number;
  windowDuration: number;
  tracksWidth: number;
  tracksTopOffset: number;
  trackHeight: number;
  trackGap: number;
  numTracks: number;
  totalDuration: number;
  responses: { id: string; timestamp: number; duration: number; trackIndex: number }[];
  onPointerDown?: (info: any, event: React.PointerEvent) => void;
  onPointerUp?: (info: any, event: React.PointerEvent) => void;
  onPointerMove?: (info: any, event: React.PointerEvent) => void;
  onPointerLeave?: (event: React.PointerEvent) => void;
  onTrackClick?: (info: any, event: React.PointerEvent) => void;
  onDragStart?: (info: any, event: React.PointerEvent) => void;
  onDragMove?: (info: any, event: React.PointerEvent) => void;
  onDragEnd?: (info: any, event: React.PointerEvent) => void;
  onHover?: (info: any, event: React.PointerEvent) => void;
  onSelect?: (info: any, event: React.PointerEvent) => void;
  onContextMenu?: (info: any, event: React.PointerEvent) => void;
}) {
  const [pointerState, setPointerState] = useState({
    hoveredTrackIndex: null as number | null,
    hoveredResponseId: null as string | null,
    isDragging: false,
    dragStart: null as any,
    dragCurrent: null as any,
    selectionBox: null as { x0: number; y0: number; x1: number; y1: number } | null,
  });
  const draggingRef = useRef(false);

  const getPointerInfo = (e: React.PointerEvent) => {
    const bounding = e.currentTarget.getBoundingClientRect();
    return getTimelinePointerInfo({
      pointerX: e.clientX,
      pointerY: e.clientY,
      boundingRect: bounding,
      windowStart,
      windowDuration,
      tracksWidth,
      tracksTopOffset,
      trackHeight,
      trackGap,
      numTracks,
      totalDuration,
    });
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerInfo = getPointerInfo(e);
      if (pointerInfo) {
        draggingRef.current = true;
        setPointerState((s) => ({
          ...s,
          isDragging: true,
          dragStart: pointerInfo,
          dragCurrent: pointerInfo,
        }));
      }
      if (onPointerDown) onPointerDown(pointerInfo, e);
      if (pointerInfo && onTrackClick) onTrackClick(pointerInfo, e);
      if (pointerInfo && onDragStart) {
        onDragStart(pointerInfo, e);
      }
    },
    [onPointerDown, onTrackClick, onDragStart, getPointerInfo]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerInfo = getPointerInfo(e);
      let hoveredTrackIndex: number | null = null;
      let hoveredResponseId: string | null = null;
      if (pointerInfo) {
        hoveredTrackIndex = pointerInfo.trackIndex;
        const time = pointerInfo.time;
        const trackIndex = pointerInfo.trackIndex;
        hoveredResponseId = responses.find(
          r =>
            r.trackIndex === trackIndex &&
            time >= r.timestamp &&
            time < r.timestamp + r.duration
        )?.id || null;
      }
      setPointerState((s) => ({
        ...s,
        hoveredTrackIndex,
        hoveredResponseId,
        dragCurrent: draggingRef.current ? pointerInfo : null,
      }));
      if (onPointerMove) onPointerMove(pointerInfo, e);
      if (pointerInfo && onHover) onHover(pointerInfo, e);
      if (draggingRef.current && onDragMove) onDragMove(pointerInfo, e);
    },
    [onPointerMove, onHover, onDragMove, responses, getPointerInfo]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerInfo = getPointerInfo(e);
      draggingRef.current = false;
      setPointerState((s) => ({
        ...s,
        isDragging: false,
        dragStart: null,
        dragCurrent: null,
        selectionBox: null,
      }));
      if (onPointerUp) onPointerUp(pointerInfo, e);
      if (onDragEnd) onDragEnd(pointerInfo, e);
    },
    [onPointerUp, onDragEnd, getPointerInfo]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (onPointerLeave) onPointerLeave(e);
      draggingRef.current = false;
      setPointerState((s) => ({
        ...s,
        hoveredTrackIndex: null,
        hoveredResponseId: null,
        isDragging: false,
        dragStart: null,
        dragCurrent: null,
        selectionBox: null,
      }));
    },
    [onPointerLeave]
  );

  const handleContextMenu = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pointerInfo = getPointerInfo(e);
      if (onContextMenu) onContextMenu(pointerInfo, e);
    },
    [onContextMenu, getPointerInfo]
  );

  // Selection box logic could be added here (drag-to-select)

  return {
    getTrackAreaProps: () => ({
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onContextMenu: handleContextMenu,
    }),
    pointerState,
  };
} 