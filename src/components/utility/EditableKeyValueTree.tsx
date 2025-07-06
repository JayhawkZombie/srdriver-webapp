import React from 'react';
import AppStateStyleTreeNode from './AppStateStyleTreeNode';

export interface EditableKeyValueTreeProps {
  data: unknown;
  editable?: boolean;
  onDataChange?: (newData: unknown) => void;
  autoExpandDepth?: number;
  lockMeta?: Record<string, { lockKey: boolean; lockValue: boolean }>;
}

function isKeyValueArray(arr: unknown[]): arr is { key: string; value: unknown }[] {
  return arr.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'key' in item &&
      'value' in item &&
      typeof (item as { key: unknown }).key === 'string'
  );
}

export const EditableKeyValueTree: React.FC<EditableKeyValueTreeProps> = ({ data, editable = false, onDataChange, autoExpandDepth = 0, lockMeta }) => {
  console.log('EditableKeyValueTree', data);
  
  // Only support object or array root for now
  const handleChange = (key: string | number, newValue: unknown) => {
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        const newArr = [...data];
        newArr[Number(key)] = newValue;
        onDataChange?.(newArr);
      } else {
        const newObj = { ...(data as Record<string, unknown>), [key]: newValue };
        onDataChange?.(newObj);
      }
    }
  };

  if (Array.isArray(data)) {
    if (isKeyValueArray(data)) {
      // Render as key-value pairs on one line
      return (
        <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {data.map((item, idx) => (
            <AppStateStyleTreeNode
              key={item.key}
              label={item.key}
              value={item.value}
              depth={0}
              editable={editable}
              onChange={newValue => {
                const newArr = [...data];
                newArr[idx] = { ...item, value: newValue };
                onDataChange?.(newArr);
              }}
              autoExpandDepth={autoExpandDepth}
              lockMeta={lockMeta ? lockMeta[item.key] : undefined}
            />
          ))}
        </div>
      );
    }
    // Otherwise, use previous logic
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
        {data.map((item, idx) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            // Expand object properties as a group, not under index
            return (
              <div key={idx} style={{ marginBottom: 4 }}>
                {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <AppStateStyleTreeNode
                    key={k}
                    label={k}
                    value={v}
                    depth={0}
                    editable={editable}
                    onChange={newValue => {
                      // Update just this property in the object at idx
                      const newObj = { ...(item as Record<string, unknown>), [k]: newValue };
                      handleChange(idx, newObj);
                    }}
                    autoExpandDepth={autoExpandDepth}
                    lockMeta={lockMeta ? lockMeta[k] : undefined}
                  />
                ))}
              </div>
            );
          } else {
            // Primitive, array, function, etc.
            return (
              <AppStateStyleTreeNode
                key={idx}
                label={String(idx)}
                value={item}
                depth={0}
                editable={editable}
                onChange={newValue => handleChange(idx, newValue)}
                autoExpandDepth={autoExpandDepth}
              />
            );
          }
        })}
      </div>
    );
  }

  // Object root
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
      {typeof data === 'object' && data !== null && !Array.isArray(data) &&
        Object.entries(data as Record<string, unknown>).map(([k, v]) => (
          <AppStateStyleTreeNode
            key={k}
            label={k}
            value={v}
            depth={0}
            editable={editable}
            onChange={newValue => handleChange(k, newValue)}
            autoExpandDepth={autoExpandDepth}
            lockMeta={lockMeta ? lockMeta[k] : undefined}
          />
        ))}
    </div>
  );
};

export default EditableKeyValueTree; 