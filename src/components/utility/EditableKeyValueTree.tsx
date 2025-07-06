import React, { useState } from 'react';
import { Button, Collapse } from '@blueprintjs/core';
import MuiTooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';

export interface EditableKeyValueTreeProps {
  data: any;
  lockMeta: any;
  onDataChange: (data: any) => void;
  onLockMetaChange: (lockMeta: any) => void;
  depth?: number;
  maxArrayPreview?: number;
  parentLocked?: boolean;
}

const INDENT = 10;
const DEFAULT_ARRAY_PREVIEW = 5;

function mergeDataWithLockMeta(data: any, lockMeta: any): any {
  if (Array.isArray(data)) {
    return data.map((item, idx) => mergeDataWithLockMeta(item, lockMeta?.[idx]));
  }
  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = {
        value: data[key],
        lockKey: lockMeta?.[key]?.lockKey || false,
        lockValue: lockMeta?.[key]?.lockValue || false,
        children: mergeDataWithLockMeta(data[key], lockMeta?.[key]),
      };
    }
    return result;
  }
  return { value: data, lockKey: lockMeta?.lockKey || false, lockValue: lockMeta?.lockValue || false };
}

export const EditableKeyValueTree: React.FC<EditableKeyValueTreeProps> = ({
  data,
  lockMeta,
  onDataChange,
  onLockMetaChange,
  depth = 0,
  maxArrayPreview = DEFAULT_ARRAY_PREVIEW,
  parentLocked = false,
}) => {
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>({});
  const [arrayExpanded, setArrayExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<{ key?: string; field: 'key' | 'value' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const merged = mergeDataWithLockMeta(data, lockMeta);

  // Render for objects and arrays
  if (Array.isArray(data)) {
    const showAll = arrayExpanded['root'] || data.length <= maxArrayPreview;
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 13, opacity: parentLocked ? 0.5 : 1 }}>
        [
        {(showAll ? data : data.slice(0, maxArrayPreview)).map((item, idx) => (
          <div key={idx} style={{ marginLeft: INDENT }}>
            <EditableKeyValueTree
              data={item}
              lockMeta={lockMeta?.[idx]}
              onDataChange={v => {
                const newArr = [...data];
                newArr[idx] = v;
                onDataChange(newArr);
              }}
              onLockMetaChange={newLockMeta => {
                const newArr = [...(lockMeta || [])];
                newArr[idx] = newLockMeta;
                onLockMetaChange(newArr);
              }}
              depth={depth + 1}
              parentLocked={parentLocked}
            />
          </div>
        ))}
        {(!showAll && data.length > maxArrayPreview) && (
          <div style={{ marginLeft: INDENT, color: '#888', cursor: 'pointer' }} onClick={() => setArrayExpanded(a => ({ ...a, root: true }))}>
            ... ({data.length - maxArrayPreview} more)
          </div>
        )}
        ]
      </div>
    );
  }
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 13, opacity: parentLocked ? 0.5 : 1 }}>
        {'{'}
        {keys.map(key => {
          const val = merged[key].value;
          const lockKey = merged[key].lockKey;
          const lockValue = merged[key].lockValue;
          const isExpandable = typeof val === 'object' && val !== null;
          const isNodeExpanded = expanded[key] || false;
          const isLocked = lockKey || lockValue || parentLocked;
          const isEditingKey = editing && editing.key === key && editing.field === 'key';
          const isEditingValue = editing && editing.key === key && editing.field === 'value';
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', marginLeft: INDENT * (depth + 1), opacity: isLocked ? 0.5 : 1, minHeight: 20 }}>
              {isExpandable ? (
                <Button minimal small style={{ marginRight: 2, padding: 0, minWidth: 18, minHeight: 18 }} onClick={() => setExpanded(e => ({ ...e, [key]: !isNodeExpanded }))}>
                  {isNodeExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </Button>
              ) : <div style={{ width: 18 }} />} 
              <Button
                minimal
                small
                style={{ margin: 0, padding: 0, width: 18, height: 18 }}
                onClick={e => {
                  e.stopPropagation();
                  const newLockMeta = { ...lockMeta, [key]: { ...lockMeta?.[key], lockKey: !lockKey } };
                  onLockMetaChange(newLockMeta);
                }}
                tabIndex={-1}
                disabled={parentLocked}
              >
                <MuiTooltip title={lockKey ? 'Unlock key' : 'Lock key'}>
                  {lockKey ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                </MuiTooltip>
              </Button>
              {isEditingKey ? (
                <input
                  value={editValue}
                  autoFocus
                  disabled={lockKey || parentLocked}
                  style={{ width: 80, fontFamily: 'monospace', fontSize: 13, marginRight: 4, background: (lockKey || parentLocked) ? '#f5f5f5' : undefined }}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => {
                    setEditing(null);
                    if (editValue !== key && !lockKey && !parentLocked) {
                      const newObj = { ...data };
                      const newKey = editValue;
                      const valCopy = val;
                      delete newObj[key];
                      newObj[newKey] = valCopy;
                      onDataChange(newObj);
                      const newLockMeta = { ...lockMeta };
                      newLockMeta[newKey] = newLockMeta[key];
                      delete newLockMeta[key];
                      onLockMetaChange(newLockMeta);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              ) : (
                <>
                  <span style={{ width: 80, minWidth: 80, marginRight: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', fontFamily: 'monospace', fontSize: 13 }}>{key}</span>
                  {!lockKey && !parentLocked && (
                    <Button
                      minimal
                      small
                      style={{ margin: 0, padding: 0, width: 16, height: 16 }}
                      onClick={() => {
                        setEditing({ key, field: 'key' });
                        setEditValue(key);
                      }}
                      tabIndex={-1}
                    >
                      <MuiTooltip title="Edit key"><EditIcon fontSize="small" /></MuiTooltip>
                    </Button>
                  )}
                </>
              )}
              <Collapse isOpen={isNodeExpanded} keepChildrenMounted>
                {isExpandable && isNodeExpanded ? (
                  <EditableKeyValueTree
                    data={val}
                    lockMeta={lockMeta?.[key]}
                    onDataChange={v => {
                      const newObj = { ...data, [key]: v };
                      onDataChange(newObj);
                    }}
                    onLockMetaChange={newLockMeta => {
                      const updated = { ...lockMeta, [key]: newLockMeta };
                      onLockMetaChange(updated);
                    }}
                    depth={depth + 1}
                    parentLocked={isLocked}
                  />
                ) : null}
              </Collapse>
              {!isExpandable ? (
                <>
                  {isEditingValue ? (
                    <input
                      value={editValue}
                      autoFocus
                      disabled={lockValue || parentLocked}
                      style={{ width: 100, fontFamily: 'monospace', fontSize: 13, background: (lockValue || parentLocked) ? '#f5f5f5' : undefined }}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => {
                        setEditing(null);
                        if (editValue !== val && !lockValue && !parentLocked) {
                          const newObj = { ...data, [key]: editValue };
                          onDataChange(newObj);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  ) : (
                    <>
                      <span style={{ width: 100, minWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', fontFamily: 'monospace', fontSize: 13 }}>{val}</span>
                      {!lockValue && !parentLocked && (
                        <Button
                          minimal
                          small
                          style={{ margin: 0, padding: 0, width: 16, height: 16 }}
                          onClick={() => {
                            setEditing({ key, field: 'value' });
                            setEditValue(val);
                          }}
                          tabIndex={-1}
                        >
                          <MuiTooltip title="Edit value"><EditIcon fontSize="small" /></MuiTooltip>
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    minimal
                    small
                    style={{ margin: 0, padding: 0, width: 18, height: 18 }}
                    onClick={e => {
                      e.stopPropagation();
                      const newLockMeta = { ...lockMeta, [key]: { ...lockMeta?.[key], lockValue: !lockValue } };
                      onLockMetaChange(newLockMeta);
                    }}
                    tabIndex={-1}
                    disabled={parentLocked}
                  >
                    <MuiTooltip title={lockValue ? 'Unlock value' : 'Lock value'}>
                      {lockValue ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </MuiTooltip>
                  </Button>
                </>
              ) : null}
            </div>
          );
        })}
        {'}'}
      </div>
    );
  }
  // Primitive
  return (
    <input
      value={data}
      disabled={parentLocked}
      style={{ width: 100, fontFamily: 'monospace', fontSize: 13, background: parentLocked ? '#f5f5f5' : undefined, marginLeft: INDENT * depth }}
      onChange={e => {
        if (parentLocked) return;
        onDataChange(e.target.value);
      }}
    />
  );
};

export default EditableKeyValueTree;
// TODO: Add add/remove controls, better type handling, etc. 