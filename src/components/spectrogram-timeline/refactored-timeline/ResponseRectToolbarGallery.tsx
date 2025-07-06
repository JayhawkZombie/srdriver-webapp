import React from 'react';
import { useAppStore } from '../../../store/appStore';
// import { Card } from '@blueprintjs/core';
// import Typography from '@mui/material/Typography';
// import { Stage, Layer } from 'react-konva';
// import { ResponseRect } from './ResponseRect';

// const rectWidth = 40;
// const rectHeight = 14;

export const ResponseRectToolbarGallery: React.FC = () => {
  // Select the whole rectTemplates object
  const rectTemplates = useAppStore(state => state.rectTemplates);
  return (
    <div style={{ padding: 16 }}>
      <ul>
        {Object.values(rectTemplates).map(t => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </div>
  );
}; 