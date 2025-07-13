import React from 'react';
import { Tree, Spinner, type TreeNodeInfo } from '@blueprintjs/core';
import type { FileNode } from '../SDCardTree';

export interface SDCardFileTreeProps {
  fileTree: FileNode | null;
  expandedIds: Set<string>;
  loadingDirId?: string | null;
  onExpand: (path: string) => void;
  onCollapse: (path: string) => void;
  onFileSelect: (path: string) => void;
  onContextMenu?: (path: string, node: FileNode, e: React.MouseEvent) => void;
}

function fileNodeToTreeNodes(
  node: FileNode | FileNode[],
  expandedIds: Set<string>,
  loadingDirId?: string | null,
  parentPath = ''
): TreeNodeInfo[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap(child => fileNodeToTreeNodes(child, expandedIds, loadingDirId, parentPath));
  }
  const path = node.path || (parentPath === '' ? '/' : `${parentPath}/${node.name}`);
  const isExpanded = expandedIds.has(path);
  let childNodes: TreeNodeInfo[] | undefined =
    node.children && node.children.length > 0
      ? fileNodeToTreeNodes(node.children, expandedIds, loadingDirId, path)
      : undefined;
  // Show spinner if loading
  if (loadingDirId && path === loadingDirId && isExpanded && (!childNodes || childNodes.length === 0)) {
    childNodes = [
      {
        id: `${path}__loading`,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>
            <Spinner size={16} /> Loading…
          </span>
        ),
        icon: null,
        isExpanded: false,
        childNodes: undefined,
        nodeData: {},
      },
    ];
  }
  return [
    {
      id: path,
      label: node.name,
      icon: node.type === 'directory' ? 'folder-close' : 'document',
      isExpanded,
      hasCaret: node.type === 'directory',
      childNodes,
      nodeData: { ...node, path },
    },
  ];
}

export const SDCardFileTree: React.FC<SDCardFileTreeProps> = ({
  fileTree,
  expandedIds,
  loadingDirId,
  onExpand,
  onCollapse,
  onFileSelect,
  onContextMenu,
}) => {
  const treeNodes = React.useMemo(
    () => (fileTree ? fileNodeToTreeNodes(fileTree, expandedIds, loadingDirId) : []),
    [fileTree, expandedIds, loadingDirId]
  );

  // Custom render for tree node labels
  const renderLabel = (node: TreeNodeInfo) => {
    const fileNode = node.nodeData as FileNode;
    const sizeText = fileNode.type === 'file' && fileNode.size ? ` (${fileNode.size} bytes)` : '';
    return (
      <span
        style={{
          color: 'var(--bp5-intent-primary-text)',
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 0.2,
        }}
      >
        {node.label}
        {sizeText}
      </span>
    );
  };

  // Handle file select only (no expansion logic here)
  const handleNodeClick = (node: TreeNodeInfo) => {
    const fileNode = node.nodeData as FileNode;
    if (fileNode.type === 'file') {
      onFileSelect(fileNode.path || fileNode.name);
    }
  };

  // Handle expand/collapse
  const handleNodeExpand = (node: TreeNodeInfo) => {
    const fileNode = node.nodeData as FileNode;
    onExpand(fileNode.path || fileNode.name);
  };
  const handleNodeCollapse = (node: TreeNodeInfo) => {
    const fileNode = node.nodeData as FileNode;
    onCollapse(fileNode.path || fileNode.name);
  };

  // Context menu handler
  const handleContextMenu = (node: TreeNodeInfo, e: React.MouseEvent) => {
    e.preventDefault();
    const fileNode = node.nodeData as FileNode;
    if (onContextMenu) {
      onContextMenu(fileNode.path || fileNode.name, fileNode, e);
    }
  };

  if (!fileTree || !fileTree.children || fileTree.children.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <span style={{ color: 'var(--bp5-text-color-muted)', fontSize: 16 }}>
          No files found
        </span>
      </div>
    );
  }

  return (
    <Tree
      contents={treeNodes.map(node => ({
        ...node,
        label: renderLabel(node),
        secondaryLabel: undefined,
        onContextMenu: onContextMenu ? (e: React.MouseEvent) => handleContextMenu(node, e) : undefined,
      }))}
      onNodeClick={handleNodeClick}
      onNodeExpand={handleNodeExpand}
      onNodeCollapse={handleNodeCollapse}
      className="sdcard-tree"
    />
  );
}; 