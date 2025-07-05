import React from 'react';
import { Drawer } from '@blueprintjs/core';
import { useAppStore } from '../../store/appStore';
import { Collapse, Button } from '@blueprintjs/core';
import Typography from '@mui/material/Typography';

const isDev = process.env.NODE_ENV === 'development';

type TreeNodeProps = {
  label: string;
  value: unknown;
  depth?: number;
};

const INDENT = 18;

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

// Helper to render the value for a field (primitive, array, object)
const FieldValue: React.FC<{ value: unknown; isExpandable: boolean; isArray: boolean; isObject: boolean }> = ({ value, isExpandable, isArray, isObject }) => {
  if (!isExpandable) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}>{renderPrimitive(value)}</Typography>;
  if (isArray && Array.isArray(value)) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> [{(value as unknown[]).length}]</Typography>;
  if (isObject) return <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#888' }}> {' {...}'} </Typography>;
  return null;
};

const TreeNode: React.FC<TreeNodeProps> = ({ label, value, depth = 0 }) => {
  const [open, setOpen] = React.useState(false);
  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  return (
    <div style={{ marginLeft: depth * INDENT, marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 24 }}>
        {isExpandable && (
          <Button
            minimal
            small
            icon={open ? 'chevron-down' : 'chevron-right'}
            onClick={() => setOpen(o => !o)}
            style={{ marginRight: 2 }}
          />
        )}
        <Typography component="span" sx={{ fontWeight: 600, color: '#137cbd', fontFamily: 'monospace', fontSize: 14 }}>{label}</Typography>
        <FieldValue value={value} isExpandable={!!isExpandable} isArray={!!isArray} isObject={!!isObject} />
      </div>
      {isExpandable && (
        <Collapse isOpen={open} keepChildrenMounted>
          <div style={{ marginTop: 0 }}>
            {isArray && Array.isArray(value)
              ? value.map((v: unknown, i: number) => (
                  <TreeNode key={i} label={String(i)} value={v} depth={depth + 1} />
                ))
              : isObject && typeof value === 'object' && value !== null
                ? Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                    <TreeNode key={k} label={k} value={v} depth={depth + 1} />
                  ))
                : null}
          </div>
        </Collapse>
      )}
    </div>
  );
};

const DevAppStateViewer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const appState = useAppStore();
  if (!isDev) return null;
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="App State Viewer"
      size="30vw"
      position="left"
      style={{ top: 64, height: 'calc(100vh - 64px)' }}
      portalClassName="dev-app-state-drawer-portal"
    >
      <div style={{ padding: 12 }}>
        <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 700, fontFamily: 'monospace', fontSize: 16, mb: 1 }}>
          App State <span style={{ fontWeight: 400, fontSize: 13 }}>(expand/collapse sections below)</span>
        </Typography>
        <div>
          {Object.entries(appState).map(([k, v]: [string, unknown]) => (
            <div key={k} style={{ marginBottom: 2, borderBottom: '1px solid #eee', paddingBottom: 2 }}>
              <TreeNode label={k} value={v} depth={0} />
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
};

export default DevAppStateViewer; 