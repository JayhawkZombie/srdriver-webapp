import React from 'react';

interface TimelineControlsProps {
  windowDuration: number;
  setWindowDuration: (val: number) => void;
  audioDuration: number;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  windowDuration,
  setWindowDuration,
  audioDuration,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0' }}>
      <span style={{ color: '#aaa' }}>Window Size:</span>
      <input
        type="range"
        min={1}
        max={audioDuration}
        step={0.1}
        value={windowDuration}
        onChange={e => setWindowDuration(Number(e.target.value))}
        style={{ width: 240 }}
        disabled={audioDuration <= 1}
      />
      <span style={{ color: '#aaa', marginLeft: 8 }}>
        {windowDuration.toFixed(2)}s
      </span>
    </div>
  );
};

export default TimelineControls; 