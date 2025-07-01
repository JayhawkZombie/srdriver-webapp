import React from 'react';
import TrackLabel from './TrackLabel';

type TrackType = 'device' | 'frequency' | 'custom';

interface Track {
  name: string;
  type: TrackType;
  color?: string;
}

interface TrackListProps {
  tracks: Track[];
  editingTrack: number | null;
  editingValue: string;
  editingType: TrackType | null;
  onEdit: (i: number) => void;
  onEditCommit: () => void;
  onEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// Memoized for performance: only re-renders if props change
const TrackList: React.FC<TrackListProps> = React.memo(({
  tracks, editingTrack, editingValue, editingType, onEdit, onEditCommit, onEditChange, onTypeChange
}) => (
  <>
    {tracks.map((track, i) => (
      <TrackLabel
        key={i}
        name={track.name}
        type={track.type}
        color={track.color}
        isEditing={editingTrack === i}
        editingValue={editingValue}
        editingType={editingType || track.type}
        onEdit={() => onEdit(i)}
        onEditCommit={onEditCommit}
        onEditChange={onEditChange}
        onTypeChange={onTypeChange}
      />
    ))}
  </>
));

export default TrackList; 