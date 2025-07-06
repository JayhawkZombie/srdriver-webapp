import React, { useState } from 'react';
import { ResponseRectToolbarGallery } from './ResponseRectToolbarGallery';

export default {
  title: 'Timeline/ResponseRectToolbarGallery',
  component: ResponseRectToolbarGallery,
};

export const Gallery = () => {
  const [selected, setSelected] = useState<string | undefined>();
  return (
    <div style={{ maxWidth: 340, margin: '0 auto', background: 'var(--bp5-app-background, #181c22)' }}>
      <ResponseRectToolbarGallery selectedId={selected} onSelect={setSelected} />
      {selected && (
        <div style={{ marginTop: 16, color: '#888', fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace', fontSize: 13 }}>
          Selected: {selected}
        </div>
      )}
    </div>
  );
}; 