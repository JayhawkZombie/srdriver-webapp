import React from 'react';

const TimelineControls: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0' }}>
      <button style={{ padding: '4px 12px', borderRadius: 4 }}>Play</button>
      <button style={{ padding: '4px 12px', borderRadius: 4 }}>Pause</button>
      <input type="range" min={0} max={100} style={{ width: 200 }} />
      <span style={{ color: '#aaa', marginLeft: 8 }}>(Window position)</span>
    </div>
  );
};

export default TimelineControls; 