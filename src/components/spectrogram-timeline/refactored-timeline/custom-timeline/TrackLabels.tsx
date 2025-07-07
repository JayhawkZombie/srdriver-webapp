import React from "react";
import { Icon } from "@blueprintjs/core";

interface TrackLabelsProps {
  numTracks: number;
  trackNames: string[];
  height: number;
  trackHeight: number;
  trackGap: number;
  tracksTopOffset: number;
}

const TrackLabels: React.FC<TrackLabelsProps> = ({
  numTracks,
  trackNames,
  height,
  trackHeight,
  trackGap,
  tracksTopOffset,
}) => {
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {[...Array(numTracks)].map((_, i) => {
        const y = tracksTopOffset + i * (trackHeight + trackGap) + trackHeight / 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: y - 16,
              right: 0,
              width: '100%',
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              color: '#fff',
              fontWeight: 500,
              fontFamily: 'monospace',
              fontSize: 16,
              pointerEvents: 'none',
              gap: 6,
            }}
          >
            <Icon icon="drag-handle-vertical" style={{ opacity: 0.7, marginRight: 6 }} />
            {trackNames[i] || `Track ${i + 1}`}
          </div>
        );
      })}
    </div>
  );
};

export default TrackLabels; 