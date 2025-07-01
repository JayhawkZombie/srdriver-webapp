import React from 'react';

const AudioUpload: React.FC = () => {
  return (
    <div style={{ marginBottom: 16 }}>
      <input type="file" accept="audio/*" />
      <span style={{ color: '#aaa', marginLeft: 8 }}>(Upload audio file)</span>
    </div>
  );
};

export default AudioUpload; 