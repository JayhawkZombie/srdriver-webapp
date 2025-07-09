import { useState, useCallback, useRef, useEffect } from "react";
import { getTimelinePointerInfo, snapYToTrackIndex } from "./timelineMath";

export type TimelinePointerInfo = { time: number; trackIndex: number };
export type TimelineContextInfo =
  | { type: 'background'; time: number; trackIndex: number }
  | { type: 'rect'; rect: { id: string; timestamp: number; duration: number; trackIndex: number } };

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
 *
 * onContextMenu: (rectId: string, event) for rects, (pointerInfo: object, event) for background
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
  onRectMove,
  onRectResize,
  onContextMenu,
  onBackgroundClick,
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
  onRectMove?: (id: string, newProps: { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean }) => void;
  onRectResize?: (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => void;
  onContextMenu?: (info: TimelineContextInfo, event: unknown) => void;
  onBackgroundClick?: (info: TimelinePointerInfo, event: unknown) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string | null; edge: 'start' | 'end' | null }>({ id: null, edge: null });
  const dragStartRef = useRef<{ x: number; y: number; timestamp: number; trackIndex: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; timestamp: number; duration: number } | null>(null);

  // Context menu state for IMGUI/Blueprint menus
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuInfo, setContextMenuInfo] = useState<TimelineContextInfo | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const [draggingRectPos, setDraggingRectPos] = useState<{ x: number; y: number } | null>(null);
  // Track the last snapped shadow position for DAR
  const lastSnappedShadowRef = useRef<{ timestamp: number; trackIndex: number } | null>(null);

  const openContextMenu = (position: { x: number; y: number }, info: TimelineContextInfo) => {
    console.log('[TimelinePointerHandler] open ContextMenu', position, info);
    setContextMenuPosition(position);
    setContextMenuInfo(info);
    setIsContextMenuOpen(true);
  };
  const closeContextMenu = () => {
    setIsContextMenuOpen(false);
    setContextMenuPosition(null);
    setContextMenuInfo(null);
  };

  // Helper to get rect by id
  const getRectById = (id: string) => responses.find(r => r.id === id);

  // Helper to reset all pointer state
  const resetPointerState = () => {
    setSelectedId(null);
    setHoveredId(null);
    setDraggingId(null);
    setResizing({ id: null, edge: null });
  };

  // --- Track area pointer logic (for Stage or background Rect/div) ---
  const getTrackAreaProps = useCallback(() => ({
    onClick: (e: unknown) => {
      console.log('[TrackArea] onClick', e, { selectedId, hoveredId });
      // Only add if not clicking on a rect
      if (selectedId || hoveredId) return;
      const evt = (e as any).evt ?? e;
      if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
      }
      const boundingRect = (e as any).target.getStage ? (e as any).target.getStage().container().getBoundingClientRect() : (e as any).currentTarget.getBoundingClientRect();
      const pointerX = (e as any).evt ? (e as any).evt.clientX : (e as any).clientX;
      const pointerY = (e as any).evt ? (e as any).evt.clientY : (e as any).clientY;
      const info = getTimelinePointerInfo({
        pointerX,
        pointerY,
        boundingRect,
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration,
      });
      console.log('[TrackArea] onClick info', info);
      if (!info) return;
      if (onBackgroundClick) onBackgroundClick(info, e);
    },
    onContextMenu: (e: unknown) => {
      console.log('[TrackArea] onContextMenu', e, { selectedId, hoveredId });
      const evt = (e as any).evt ?? e;
      if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
      }
      // Always allow context menu to open (do not skip for selectedId/hoveredId)
      resetPointerState();
      // Always use the cursor's position for the menu
      let x = 0, y = 0;
      if (evt && 'clientX' in evt && 'clientY' in evt) {
        x = evt.clientX;
        y = evt.clientY;
      } else if ((e as any).clientX && (e as any).clientY) {
        x = (e as any).clientX;
        y = (e as any).clientY;
      }
      const boundingRect = (e as any).target.getStage ? (e as any).target.getStage().container().getBoundingClientRect() : (e as any).currentTarget.getBoundingClientRect();
      const pointerX = (e as any).evt ? (e as any).evt.clientX : (e as any).clientX;
      const pointerY = (e as any).evt ? (e as any).evt.clientY : (e as any).clientY;
      const info = getTimelinePointerInfo({
        pointerX,
        pointerY,
        boundingRect,
        windowStart,
        windowDuration,
        tracksWidth,
        tracksTopOffset,
        trackHeight,
        trackGap,
        numTracks,
        totalDuration,
      });
      console.log('[TrackArea] onContextMenu info', info);
      if (!info) return;
      if (onContextMenu) {
        console.log('[TrackArea] calling onContextMenu with', { type: 'background', time: info.time, trackIndex: info.trackIndex });
        // Pass the cursor position up for menu placement
        onContextMenu({ type: 'background', time: info.time, trackIndex: info.trackIndex }, { clientX: x, clientY: y });
      }
    },
  }), [selectedId, hoveredId, onBackgroundClick, onContextMenu, windowStart, windowDuration, tracksWidth, tracksTopOffset, trackHeight, trackGap, numTracks, totalDuration]);

  // --- Rect logic ---
  const getRectProps = useCallback((id: string) => {
    const rect = getRectById(id);
    if (!rect) return {};
    return {
      selected: selectedId === id,
      hovered: hoveredId === id,
      dragging: draggingId === id,
      resizing: resizing.id === id,
      resizeEdge: resizing.id === id ? resizing.edge : null,
      onPointerDown: (e: unknown) => {
        console.log('[Rect] onPointerDown', id, e);
        setSelectedId(id);
        setHoveredId(id);
        (e as any).cancelBubble = true;
      },
      onPointerMove: (e: unknown) => {
        // console.log('[Rect] onPointerMove', id, e);
        setHoveredId(id);
        (e as any).cancelBubble = true;
      },
      onPointerUp: (e: unknown) => {
        console.log('[Rect] onPointerUp', id, e);
        setHoveredId(null);
        setDraggingId(null);
        setResizing({ id: null, edge: null });
        dragStartRef.current = null;
        resizeStartRef.current = null;
        (e as any).cancelBubble = true;
      },
      onDragStart: (e: unknown) => {
        console.log('[Rect] onDragStart', id, e);
        setDraggingId(id);
        dragStartRef.current = { x: (e as any).target.x(), y: (e as any).target.y(), timestamp: rect.timestamp, trackIndex: rect.trackIndex };
        (e as any).cancelBubble = true;
      },
      onDragMove: (e: unknown) => {
        console.log('[Rect] onDragMove', id, e);
        if (!dragStartRef.current) return;
        const x = (e as any).target.x();
        const y = (e as any).target.y();
        setDraggingRectPos({ x, y });
        const dx = x - dragStartRef.current.x;
        // Convert dx to time delta
        const timeDelta = (dx / tracksWidth) * windowDuration;
        const newTimestamp = Math.max(0, Math.min(totalDuration - rect.duration, dragStartRef.current.timestamp + timeDelta));
        // Snap y to track
        const geometry = {
          windowStart,
          windowDuration,
          tracksWidth,
          tracksTopOffset,
          trackHeight,
          trackGap,
          numTracks,
          totalDuration,
        };
        const snappedTrackIndex = snapYToTrackIndex(y, geometry);
        // Store the last snapped shadow position for DAR
        lastSnappedShadowRef.current = { timestamp: newTimestamp, trackIndex: snappedTrackIndex };
        // Do NOT update trackIndex during drag; keep it at the original track
        if (onRectMove) onRectMove(id, { timestamp: newTimestamp, trackIndex: dragStartRef.current.trackIndex });
        (e as any).cancelBubble = true;
      },
      onDragEnd: (e: unknown) => {
        // Always DAR using the last snapped shadow position
        const snapped = lastSnappedShadowRef.current;
        if (!snapped) return;
        const evt = (e as any).evt ?? e;
        if (evt && typeof evt.preventDefault === 'function') {
          evt.preventDefault();
        }
        // Debug log for DAR drop
        console.log('[DAR DEBUG] onDragEnd using last shadow position:', snapped);
        resetPointerState();
        if (onRectMove) onRectMove(id, { ...snapped, destroyAndRespawn: true });
      },
      onGroupMouseEnter: () => {
        console.log('[Rect] onGroupMouseEnter', id);
        setHoveredId(id);
      },
      onGroupMouseLeave: () => {
        console.log('[Rect] onGroupMouseLeave', id);
        setHoveredId(null);
      },
      onResizeStart: (e: unknown, edge: 'start' | 'end') => {
        console.log('[Rect] RESIZE START', id, edge);
        if (!edge) return; // Defensive: only call with valid edge
        setResizing({ id, edge });
        const initialX = (e as any).evt ? (e as any).evt.clientX : (e as any).target.getStage().getPointerPosition().x;
        resizeStartRef.current = { x: initialX, timestamp: rect.timestamp, duration: rect.duration };
        (e as any).cancelBubble = true;
        // Add global listeners
        function handleMouseMove(ev: MouseEvent) {
          const pointerX = ev.clientX;
          const dx = pointerX - (resizeStartRef.current ? resizeStartRef.current.x : 0);
          const timeDelta = (dx / tracksWidth) * windowDuration;
          let newTimestamp = resizeStartRef.current ? resizeStartRef.current.timestamp : 0;
          let newDuration = resizeStartRef.current ? resizeStartRef.current.duration : 0.1;
          if (edge === 'start') {
            newTimestamp = Math.max(0, Math.min(newTimestamp + timeDelta, newTimestamp + newDuration - 0.1));
            newDuration = Math.max(0.1, (resizeStartRef.current ? resizeStartRef.current.duration : 0.1) - timeDelta);
          } else if (edge === 'end') {
            newDuration = Math.max(0.1, (resizeStartRef.current ? resizeStartRef.current.duration : 0.1) + timeDelta);
          }
          console.log('[Rect] handleMouseMove (resize)', { id, edge, pointerX, initialX: resizeStartRef.current?.x, dx, timeDelta, newTimestamp, newDuration });
          if (onRectResize && id && edge) onRectResize(id, edge, newTimestamp, newDuration);
        }
        function handleMouseUp(ev: MouseEvent) {
          setResizing({ id: null, edge: null });
          resizeStartRef.current = null;
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        }
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      },
      onResizeEnd: (e: unknown) => {
        setResizing({ id: null, edge: null });
        resizeStartRef.current = null;
        (e as any).cancelBubble = true;
      },
      onContextMenu: (e: unknown) => {
        const evt = (e as any).evt ?? e;
        if (evt && typeof evt.preventDefault === 'function') {
          evt.preventDefault();
        }
        console.log('[Rect] onContextMenu', id, rect, e);
        resetPointerState();
        if (onContextMenu) onContextMenu({ type: 'rect', rect }, e);
      },
    };
  }, [selectedId, hoveredId, draggingId, resizing, onRectMove, onRectResize, windowStart, windowDuration, tracksWidth, tracksTopOffset, trackHeight, trackGap, numTracks, totalDuration]);

  // --- Resizing effect ---
  useEffect(() => {
    if (!resizing.id || !resizing.edge || !resizeStartRef.current) return;
    function handleMouseMove(e: MouseEvent) {
      const pointerX = e.clientX;
      console.log("POINTER X", pointerX);
      const dx = pointerX - (resizeStartRef.current ? resizeStartRef.current.x : 0);
      console.log("DX", dx);
      const timeDelta = (dx / tracksWidth) * windowDuration;
      console.log("TIME DELTA", timeDelta);
      let newTimestamp = resizeStartRef.current ? resizeStartRef.current.timestamp : 0;
      let newDuration = resizeStartRef.current ? resizeStartRef.current.duration : 0.1;
      if (resizing.edge === 'start') {
        newTimestamp = Math.max(0, Math.min(newTimestamp + timeDelta, newTimestamp + newDuration - 0.1));
        newDuration = Math.max(0.1, (resizeStartRef.current ? resizeStartRef.current.duration : 0.1) - timeDelta);
      } else if (resizing.edge === 'end') {
        newDuration = Math.max(0.1, (resizeStartRef.current ? resizeStartRef.current.duration : 0.1) + timeDelta);
      }
      if (onRectResize && resizing.id && resizing.edge) onRectResize(resizing.id, resizing.edge, newTimestamp, newDuration);
    }
    function handleMouseUp(e: MouseEvent) {
      setResizing({ id: null, edge: null });
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, tracksWidth, windowDuration, onRectResize]);

  return {
    getTrackAreaProps,
    getRectProps,
    pointerState: {
      hoveredId,
      selectedId,
      draggingId,
      resizing,
    },
    draggingRectPos,
    isContextMenuOpen,
    contextMenuPosition,
    contextMenuInfo,
    openContextMenu,
    closeContextMenu,
    contextMenuRef,
    resetPointerState,
  };
} 

export type TimelinePointerHandler = ReturnType<typeof useTimelinePointerHandler>; 