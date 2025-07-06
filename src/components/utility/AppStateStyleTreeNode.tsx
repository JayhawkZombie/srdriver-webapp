import React from 'react';
import { Collapse, Button } from '@blueprintjs/core';
import Typography from '@mui/material/Typography';

const INDENT = 10;

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
}

export const AppStateStyleTreeNode: React.FC<AppStateStyleTreeNodeProps> = ({ label, value, depth = 0 }) => {
  const [open, setOpen] = React.useState(false);
  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  return (
    <div style={{ marginLeft: depth * INDENT, marginBottom: 0 }}>
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
        {/* Value rendering */}
        {(() => {
          if (!isExpandable) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}>{renderPrimitive(value)}</Typography>;
          if (isArray && Array.isArray(value)) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> [{(value as unknown[]).length}]</Typography>;
          if (isObject) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> {' {...}'} </Typography>;
          return null;
        })()}
      </div>
      {isExpandable && (
        <Collapse isOpen={open} keepChildrenMounted>
          <div style={{ marginTop: 0 }}>
            {isArray && Array.isArray(value)
              ? value.map((v: unknown, i: number) => (
                  <AppStateStyleTreeNode key={i} label={String(i)} value={v} depth={depth + 1} />
                ))
              : isObject && typeof value === 'object' && value !== null
                ? Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                    <AppStateStyleTreeNode key={k} label={k} value={v} depth={depth + 1} />
                  ))
                : null}
          </div>
        </Collapse>
      )}
    </div>
  );
};

export default AppStateStyleTreeNode; 