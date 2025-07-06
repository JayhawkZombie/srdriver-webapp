import React, { useState } from 'react';
import { Collapse, Button, Card, Elevation } from '@blueprintjs/core';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MuiTooltip from '@mui/material/Tooltip';

const INDENT = 10;
const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_MAX_CHILDREN = 20;

function renderPrimitive(val: unknown): React.ReactNode {
  switch (typeof val) {
    case 'string':
      return <span style={{ color: '#c7254e' }}>&quot;{val}&quot;</span>;
    case 'number':
      return <span style={{ color: '#1c7ed6' }}>{val}</span>;
    case 'boolean':
      return <span style={{ color: '#22863a' }}>{String(val)}</span>;
    case 'undefined':
      return <span style={{ color: '#888' }}>undefined</span>;
    case 'bigint':
      return <span style={{ color: '#b07d48' }}>{String(val)}n</span>;
    case 'symbol':
      return <span style={{ color: '#b07d48' }}>{String(val)}</span>;
    case 'function':
      return <span style={{ color: '#888' }}>[function]</span>;
    case 'object':
      if (val === null) return <span style={{ color: '#888' }}>null</span>;
      if (val instanceof Date) return <span style={{ color: '#b07d48' }}>{val.toISOString()}</span>;
      if (val instanceof RegExp) return <span style={{ color: '#b07d48' }}>{val.toString()}</span>;
      return <span style={{ color: '#888' }}>[object]</span>;
    default:
      return <span style={{ color: '#888' }}>{String(val)}</span>;
  }
}

export interface AppStateStyleTreeNodeProps {
  label: string;
  value: unknown;
  depth?: number;
  editable?: boolean;
  onChange?: (newValue: unknown) => void;
  autoExpandDepth?: number;
  maxDepth?: number;
  maxChildren?: number;
  lockMeta?: { lockKey?: boolean; lockValue?: boolean };
}

export const AppStateStyleTreeNode: React.FC<AppStateStyleTreeNodeProps> = ({
  label,
  value,
  depth = 0,
  editable = false,
  onChange,
  autoExpandDepth = 0,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxChildren = DEFAULT_MAX_CHILDREN,
  lockMeta,
}) => {
  const [open, setOpen] = useState(depth < autoExpandDepth);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showAllChildren, setShowAllChildren] = useState(false);
  const [allowDeeper, setAllowDeeper] = useState(false);
  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const isPrimitive = !isExpandable;

  // Only allow editing for primitives if editable is true and not locked
  const showEdit = editable && isPrimitive && !(lockMeta && lockMeta.lockValue);
  const showReadOnly = (!editable || (lockMeta && lockMeta.lockValue)) && isPrimitive;

  const cardStyle = depth === 0
    ? { marginLeft: depth * INDENT, marginBottom: 2, padding: '2px 4px', boxShadow: 'none', background: '#fff', overflow: 'visible' }
    : { marginLeft: depth * INDENT, marginBottom: 2, padding: '2px 4px', boxShadow: 'none', background: 'transparent', overflow: 'visible' };

  // Render children with maxChildren limit
  function renderChildren(children: [string, unknown][]) {
    const visible = showAllChildren ? children : children.slice(0, maxChildren);
    const extra = children.length - visible.length;
    return (
      <>
        {visible.map(([k, v]) => (
          <AppStateStyleTreeNode
            key={k}
            label={k}
            value={v}
            depth={depth + 1}
            editable={editable}
            onChange={onChange}
            autoExpandDepth={autoExpandDepth}
            maxDepth={maxDepth}
            maxChildren={maxChildren}
            lockMeta={undefined} // Only lock at the root for now; can be extended for nested lockMeta
          />
        ))}
        {extra > 0 && (
          <div style={{ color: '#888', fontStyle: 'italic', marginLeft: (depth + 1) * INDENT }}>
            + {extra} more...{' '}
            <Button minimal small onClick={e => { e.stopPropagation(); setShowAllChildren(true); }}>Show all</Button>
          </div>
        )}
      </>
    );
  }

  // If we've hit maxDepth, show a button to allow further recursion
  if (isExpandable && depth >= maxDepth && !allowDeeper) {
    return (
      <Card elevation={Elevation.ONE} style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 18, padding: '0 2px', fontFamily: 'monospace', fontSize: 12, fontWeight: depth === 0 ? 700 : 400, color: depth === 0 ? '#137cbd' : '#222', borderBottom: depth === 0 ? '1px solid #eee' : undefined, background: isExpandable && open ? 'rgba(19,124,189,0.06)' : undefined, borderRadius: 0, transition: 'background 0.15s', }}>
          <Button
            minimal
            small
            icon={open ? 'chevron-down' : 'chevron-right'}
            style={{ marginRight: 2, padding: 0, minWidth: 18, minHeight: 18 }}
            tabIndex={-1}
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          />
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: depth === 0 ? 700 : 400, fontSize: 12 }}>{label}</span>
          <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888', marginLeft: 1 }}>{isArray ? `[array] [${(value as unknown[]).length}]` : '{...}'}</Typography>
          <Button minimal small onClick={e => { e.stopPropagation(); setAllowDeeper(true); }}>Show deeper</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card elevation={Elevation.ONE} style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 18,
          padding: '0 2px',
          cursor: isExpandable ? 'pointer' : 'default',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: depth === 0 ? 700 : 400,
          color: depth === 0 ? '#137cbd' : '#222',
          borderBottom: depth === 0 ? '1px solid #eee' : undefined,
          background: isExpandable && open ? 'rgba(19,124,189,0.06)' : undefined,
          borderRadius: 0,
          transition: 'background 0.15s',
        }}
        onClick={isExpandable ? () => setOpen(o => !o) : undefined}
        onKeyDown={isExpandable ? (e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); } : undefined}
        tabIndex={isExpandable ? 0 : -1}
        role={isExpandable ? 'button' : undefined}
        aria-expanded={isExpandable ? open : undefined}
      >
        {isExpandable && (
          <Button
            minimal
            small
            icon={open ? 'chevron-down' : 'chevron-right'}
            style={{ marginRight: 2, padding: 0, minWidth: 18, minHeight: 18 }}
            tabIndex={-1}
          />
        )}
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: depth === 0 ? 700 : 400, fontSize: 12 }}>{label}</span>
        {/* Value rendering for primitives */}
        {isPrimitive && editing ? (
          <input
            value={editValue}
            autoFocus
            style={{ width: 120, fontFamily: 'monospace', fontSize: 13, marginLeft: 4 }}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (onChange && editValue !== value) onChange(editValue);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        ) : (
          <>
            <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888', marginLeft: 1 }}>{renderPrimitive(value)}</Typography>
            {showEdit && (
              <Button
                minimal
                small
                style={{ margin: 0, padding: 0, width: 16, height: 16, color: '#888' }}
                onClick={e => {
                  e.stopPropagation();
                  setEditValue(String(value ?? ''));
                  setEditing(true);
                }}
                tabIndex={-1}
              >
                <MuiTooltip title="Edit value"><EditIcon fontSize="small" /></MuiTooltip>
              </Button>
            )}
            {showReadOnly && (
              <MuiTooltip title="Read-only">
                <VisibilityIcon fontSize="small" style={{ color: '#bbb', marginLeft: 2 }} />
              </MuiTooltip>
            )}
          </>
        )}
        {/* Value rendering for objects/arrays */}
        {!isPrimitive && (() => {
          if (isArray && Array.isArray(value)) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> [{(value as unknown[]).length}]</Typography>;
          if (isObject) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> {' {...}'} </Typography>;
          return null;
        })()}
      </div>
      {isExpandable && (
        <Collapse isOpen={open} keepChildrenMounted>
          <div style={{ marginTop: 0 }}>
            {isArray && Array.isArray(value)
              ? renderChildren((value as unknown[]).map((v, i) => [String(i), v]))
              : isObject && typeof value === 'object' && value !== null
                ? renderChildren(Object.entries(value as Record<string, unknown>))
                : null}
          </div>
        </Collapse>
      )}
    </Card>
  );
};

export default AppStateStyleTreeNode; 