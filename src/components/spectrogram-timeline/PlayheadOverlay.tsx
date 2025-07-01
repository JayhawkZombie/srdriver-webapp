import React from 'react';

const PlayheadOverlay: React.FC = () => {
  return (
    <div style={{ position: 'absolute', left: 40, top: 0, width: 2, height: '100%', background: '#ff00cc', zIndex: 2, borderRadius: 1 }} />
  );
};

export default PlayheadOverlay; 