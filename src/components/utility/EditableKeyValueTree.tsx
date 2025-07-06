import React from 'react';
import AppStateStyleTreeNode from './AppStateStyleTreeNode';

export interface EditableKeyValueTreeProps {
  data: unknown;
}

export const EditableKeyValueTree: React.FC<EditableKeyValueTreeProps> = ({ data }) => {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
        <AppStateStyleTreeNode key={k} label={k} value={v} depth={0} />
      ))}
    </div>
  );
};

export default EditableKeyValueTree; 