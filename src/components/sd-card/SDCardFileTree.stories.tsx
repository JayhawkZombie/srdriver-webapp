import React, { useState } from 'react';
import { SDCardFileTree } from './SDCardFileTree';
import type { FileNode } from '../SDCardTree';
import { Card } from '@blueprintjs/core';
import { SDCardContextMenuPortal } from './SDCardContextMenuPortal';
import type { SDCardContextMenuAction } from './SDCardContextMenuAction';

// Mock file tree data
const mockFileTree: FileNode = {
  name: '/',
  type: 'directory',
  path: '/',
  children: [
    { name: 'config.json', type: 'file', size: 1024, path: '/config.json' },
    { name: 'logs', type: 'directory', path: '/logs', children: [
      { name: '2024-06-01.log', type: 'file', size: 4096, path: '/logs/2024-06-01.log' },
      { name: '2024-06-02.log', type: 'file', size: 2048, path: '/logs/2024-06-02.log' }
    ] },
    { name: 'data.csv', type: 'file', size: 2048, path: '/data.csv' },
    { name: 'README.md', type: 'file', size: 512, path: '/README.md' },
    { name: 'images', type: 'directory', path: '/images', children: [
      { name: 'photo1.jpg', type: 'file', size: 123456, path: '/images/photo1.jpg' },
      { name: 'photo2.jpg', type: 'file', size: 654321, path: '/images/photo2.jpg' }
    ] },
    { name: 'backup.zip', type: 'file', size: 1048576, path: '/backup.zip' }
  ]
};

export default {
  title: 'SD Card/SDCardFileTree',
  component: SDCardFileTree,
};

export const Default = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['/']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loadingDirId, setLoadingDirId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    node: FileNode;
    actions: SDCardContextMenuAction[];
  } | null>(null);

  const handleExpand = (path: string) => {
    setExpandedIds(prev => new Set(prev).add(path));
    if (path === '/logs') {
      setLoadingDirId(path);
      setTimeout(() => setLoadingDirId(null), 1200);
    }
  };
  const handleCollapse = (path: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  };
  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
  };

  const getContextMenuActions = (path: string, node: FileNode): SDCardContextMenuAction[] => [
    { label: 'Open', onClick: () => alert(`Open ${path}`) },
    {
      label: 'Export',
      children: [
        { label: 'As CSV', onClick: () => alert(`Export ${path} as CSV`) },
        { label: 'As JSON', onClick: () => alert(`Export ${path} as JSON`) },
      ],
    },
    { divider: true },
    { label: 'Delete', onClick: () => alert(`Delete ${path}`), intent: 'danger' },
  ];

  const handleContextMenu = (path: string, _node: FileNode, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      node: _node,
      actions: getContextMenuActions(path, _node),
    });
  };

  return (
    <Card style={{ maxWidth: 500, margin: '2rem auto', background: '#181c20', position: 'relative' }}>
      <h3 style={{ color: '#fff' }}>SD Card File Tree (Storybook)</h3>
      <div
        onContextMenu={e => e.preventDefault()} // Prevent browser menu globally
        style={{ position: 'relative' }}
      >
        <SDCardFileTree
          fileTree={mockFileTree}
          expandedIds={expandedIds}
          loadingDirId={loadingDirId}
          onExpand={handleExpand}
          onCollapse={handleCollapse}
          onFileSelect={handleFileSelect}
          onContextMenu={handleContextMenu}
        />
        {contextMenu && (
          <SDCardContextMenuPortal
            x={contextMenu.x}
            y={contextMenu.y}
            actions={contextMenu.actions}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
      {selectedPath && <div style={{ color: '#fff', marginTop: 16 }}>Selected: {selectedPath}</div>}
    </Card>
  );
}; 