import { useState, useCallback, useRef, useEffect } from "react";
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
  onRectMove?: (id: string, newProps: { timestamp: number; trackIndex: number }) => void;
  onRectResize?: (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => void;
  onContextMenu?: (info: any, event: any) => void;
  onBackgroundClick?: (info: any, event: any) => void;
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
  const [contextMenuInfo, setContextMenuInfo] = useState<any>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const openContextMenu = (position: { x: number; y: number }, info: any) => {
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

  // --- Track area pointer logic (for Stage or background Rect/div) ---
  const getTrackAreaProps = useCallback(() => ({
    onClick: (e: any) => {
      // Only add if not clicking on a rect
      if (selectedId || hoveredId) return;
      if ((e as any).evt && typeof (e as any).evt.preventDefault === 'function') {
        (e as any).evt.preventDefault();
      }
      const boundingRect = e.target.getStage ? e.target.getStage().container().getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
      const pointerX = (e as any).evt ? e.evt.clientX : e.clientX;
      const pointerY = (e as any).evt ? e.evt.clientY : e.clientY;
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
      console.log('getTrackAreaProps', info);
      if (!info) return;
      if (onBackgroundClick) onBackgroundClick(info, e);
    },
    onContextMenu: (e: any) => {
      if ((e as any).evt && typeof (e as any).evt.preventDefault === 'function') {
        (e as any).evt.preventDefault();
      }
      // Only open if not clicking on a rect
      if (selectedId || hoveredId) return;
      const boundingRect = e.target.getStage ? e.target.getStage().container().getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
      const pointerX = (e as any).evt ? e.evt.clientX : e.clientX;
      const pointerY = (e as any).evt ? e.evt.clientY : e.clientY;
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
      if (!info) return;
      if (onContextMenu) onContextMenu(info, e);
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
      onPointerDown: (e: any) => {
        setSelectedId(id);
        setHoveredId(id);
        e.cancelBubble = true;
      },
      onPointerMove: (e: any) => {
        setHoveredId(id);
        e.cancelBubble = true;
      },
      onPointerUp: (e: any) => {
        setHoveredId(null);
        setDraggingId(null);
        setResizing({ id: null, edge: null });
        dragStartRef.current = null;
        resizeStartRef.current = null;
        e.cancelBubble = true;
      },
      onDragStart: (e: any) => {
        setDraggingId(id);
        dragStartRef.current = { x: e.target.x(), y: e.target.y(), timestamp: rect.timestamp, trackIndex: rect.trackIndex };
        e.cancelBubble = true;
      },
      onDragMove: (e: any) => {
        if (!dragStartRef.current) return;
        const dx = e.target.x() - dragStartRef.current.x;
        const dy = e.target.y() - dragStartRef.current.y;
        // Convert dx to time delta
        const timeDelta = (dx / tracksWidth) * windowDuration;
        // Do NOT snap trackIndex while dragging; just store the floating Y offset
        const newTimestamp = Math.max(0, Math.min(totalDuration - rect.duration, dragStartRef.current.timestamp + timeDelta));
        // Keep trackIndex as original during drag
        if (onRectMove) onRectMove(id, { timestamp: newTimestamp, trackIndex: dragStartRef.current.trackIndex });
        e.cancelBubble = true;
      },
      onDragEnd: (e: any) => {
        if (!dragStartRef.current) return;
        // On drop, snap to nearest track
        const dy = e.target.y() - dragStartRef.current.y;
        const trackDelta = Math.round(dy / (trackHeight + trackGap));
        const snappedTrackIndex = Math.max(0, Math.min(numTracks - 1, dragStartRef.current.trackIndex + trackDelta));
        const dx = e.target.x() - dragStartRef.current.x;
        const timeDelta = (dx / tracksWidth) * windowDuration;
        const newTimestamp = Math.max(0, Math.min(totalDuration - rect.duration, dragStartRef.current.timestamp + timeDelta));
        if (onRectMove) onRectMove(id, { timestamp: newTimestamp, trackIndex: snappedTrackIndex });
        setDraggingId(null);
        dragStartRef.current = null;
        e.cancelBubble = true;
      },
      onResizeStart: (e: any, edge: 'start' | 'end') => {
        if (!edge) return; // Defensive: only call with valid edge
        setResizing({ id, edge });
        resizeStartRef.current = { x: e.evt ? e.evt.clientX : e.target.getStage().getPointerPosition().x, timestamp: rect.timestamp, duration: rect.duration };
        e.cancelBubble = true;
      },
      onResizeEnd: (e: any) => {
        setResizing({ id: null, edge: null });
        resizeStartRef.current = null;
        e.cancelBubble = true;
      },
      onContextMenu: (e: any) => {
        if (onContextMenu) onContextMenu(id, e);
        e.cancelBubble = true;
        if ((e as any).evt && typeof (e as any).evt.preventDefault === 'function') {
          (e as any).evt.preventDefault();
        }
      },
    };
  }, [selectedId, hoveredId, draggingId, resizing, responses, onRectMove, onRectResize, onContextMenu, tracksWidth, windowDuration, trackHeight, trackGap, numTracks, totalDuration]);

  // --- Resizing effect ---
  useEffect(() => {
    if (!resizing.id || !resizing.edge || !resizeStartRef.current) return;
    function handleMouseMove(e: MouseEvent) {
      const pointerX = e.clientX;
      const dx = pointerX - (resizeStartRef.current ? resizeStartRef.current.x : 0);
      const timeDelta = (dx / tracksWidth) * windowDuration;
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
    isContextMenuOpen,
    contextMenuPosition,
    contextMenuInfo,
    openContextMenu,
    closeContextMenu,
    contextMenuRef,
  };
} 