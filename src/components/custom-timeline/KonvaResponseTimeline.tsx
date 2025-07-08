import React from "react";
import { TimelineVisuals } from "./TimelineVisuals";
import type { TimelineResponse, Palettes, TrackTarget, Geometry } from "./TimelineVisuals";
import type { TimelinePointerInfo } from './useTimelinePointerHandler';
import { Select } from '@blueprintjs/select';
import { MenuItem } from '@blueprintjs/core';

interface KonvaResponseTimelineProps {
  responses: TimelineResponse[];
  hoveredId: string | null;
  selectedId: string | null;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  pointerHandler: Record<string, unknown>;
  palettes: Palettes;
  trackTargets: TrackTarget[];
  devices: string[];
  deviceMetadata: Record<string, { nickname?: string; name?: string }>;
  setTrackTarget: (trackIndex: number, target: TrackTarget | undefined) => void;
  activeRectIds: string[];
  geometry: Geometry;
  draggingId: string | null;
  draggingRectPos: { x: number; y: number } | null;
  currentTime: number;
  windowStart: number;
  windowDuration: number;
  onBackgroundClick?: (args: TimelinePointerInfo) => void;
  onContextMenu?: (info: any, event: MouseEvent) => void;
}

const labelWidth = 110;
const labelHeight = 32;
const tracksHeight = 300;
const numTracks = 3;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;

export const KonvaResponseTimeline: React.FC<KonvaResponseTimelineProps> = ({
  responses,
  hoveredId,
  selectedId,
  setHoveredId,
  setSelectedId,
  pointerHandler,
  palettes,
  trackTargets,
  devices,
  deviceMetadata,
  setTrackTarget,
  activeRectIds,
  geometry,
  draggingId,
  draggingRectPos,
  currentTime,
  windowStart,
  windowDuration,
  onBackgroundClick,
  onContextMenu,
}) => {
  // Helper to get device label
  const getDeviceLabel = (id: string) => deviceMetadata[id]?.nickname || deviceMetadata[id]?.name || id;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: geometry.tracksWidth + labelWidth + 40,
        margin: "40px auto",
        background: "#23272f",
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Track labels column with dropdowns */}
      <div
        style={{
          width: labelWidth,
          position: "relative",
          height: tracksHeight,
        }}
      >
        {[...Array(numTracks)].map((_, i) => {
          const y = tracksTopOffset + i * (trackHeight + trackGap) + trackHeight / 2;
          const currentTarget = trackTargets[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y - labelHeight / 2,
                left: 0,
                width: "100%",
                height: labelHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: "#fff",
                fontWeight: 500,
                fontFamily: "monospace",
                fontSize: 14,
                pointerEvents: "auto",
                zIndex: 2,
              }}
            >
              <Select<string>
                items={devices}
                itemRenderer={(id: string, { handleClick, modifiers }: { handleClick: React.MouseEventHandler<HTMLElement>; modifiers: { active: boolean } }) => (
                  <MenuItem
                    key={id}
                    text={getDeviceLabel(id)}
                    onClick={handleClick}
                    active={modifiers.active}
                    label={id}
                    style={{ fontSize: 13, minWidth: 120 }}
                  />
                )}
                filterable={false}
                onItemSelect={(id: string) => setTrackTarget(i, id ? { type: 'device', id } : undefined)}
                popoverProps={{ minimal: true, position: 'bottom', usePortal: false }}
                noResults={<MenuItem disabled text="No devices" />}
                disabled={devices.length === 0}
                activeItem={currentTarget?.id || null}
                fill
              >
                <button
                  type="button"
                  className="bp5-button bp5-minimal"
                  style={{ width: '100%', textAlign: 'right', fontSize: 13, padding: '2px 8px', background: 'none', color: '#fff', border: 'none' }}
                >
                  {currentTarget?.id ? getDeviceLabel(currentTarget.id) : 'Unassigned'}
                </button>
              </Select>
            </div>
          );
        })}
      </div>
      {/* Timeline Konva Stage column */}
      <div style={{ flex: 1 }}>
        <TimelineVisuals
          numTracks={numTracks}
          tracksWidth={geometry.tracksWidth}
          tracksHeight={tracksHeight}
          trackHeight={trackHeight}
          trackGap={trackGap}
          tracksTopOffset={tracksTopOffset}
          windowStart={windowStart}
          windowDuration={windowDuration}
          responses={responses}
          hoveredId={hoveredId}
          selectedId={selectedId}
          setHoveredId={setHoveredId}
          setSelectedId={setSelectedId}
          pointerHandler={pointerHandler}
          palettes={palettes}
          trackTargets={Array.isArray(trackTargets) ? trackTargets : Object.values(trackTargets)}
          activeRectIds={activeRectIds}
          geometry={geometry}
          draggingId={draggingId}
          draggingRectPos={draggingRectPos}
          currentTime={currentTime}
          onBackgroundClick={onBackgroundClick}
          onContextMenu={onContextMenu}
        />
      </div>
    </div>
  );
};

export default KonvaResponseTimeline; 