import React, { useState, useEffect } from 'react';
import { Tree, Spinner, Text, type TreeNodeInfo } from '@blueprintjs/core';

// JSON format that matches the embedded device output
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  error?: string;
  path?: string; // Add path for unique identification
}

function fileNodeToTreeNodes(node: FileNode | FileNode[], keyPrefix = '', parentPath = ''): TreeNodeInfo[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((child, idx) => fileNodeToTreeNodes(child, `${keyPrefix}${idx}-`, parentPath));
  }
  // Special-case root node to avoid double slashes
  const isRoot = parentPath === '' && node.name === '/';
  const path = isRoot
    ? '/'
    : parentPath === '' || parentPath === '/'
      ? `/${node.name}`
      : `${parentPath}/${node.name}`;
  return [{
    id: path, // Use full path as unique ID
    label: node.name,
    icon: node.type === 'directory' ? 'folder-close' : 'document',
    isExpanded: node.type === 'directory',
    hasCaret: node.type === 'directory', // Force caret for directories
    childNodes: node.children ? fileNodeToTreeNodes(node.children, `${keyPrefix}${node.name}-`, path) : undefined,
    nodeData: { ...node, path },
  }];
}

// Stateless SDCardTree component
export interface SDCardTreeProps {
  fileTree: FileNode | null;
  onFileSelect: (fileName: string) => void;
  isLoading?: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (nodeId: string, isExpanding: boolean) => void;
  loadingDirId?: string | null;
}

export const SDCardTree: React.FC<SDCardTreeProps> = ({ fileTree, onFileSelect, isLoading = false, expandedIds, onToggleExpand, loadingDirId }) => {
  const [treeNodes, setTreeNodes] = useState<TreeNodeInfo[]>([]);

  // Update tree nodes when fileTree, expandedIds, or loadingDirId changes
  useEffect(() => {
    function markExpanded(nodes: TreeNodeInfo[]): TreeNodeInfo[] {
      return nodes.map(n => {
        const isExpanded = expandedIds.has(n.id as string);
        let childNodes = n.childNodes ? markExpanded(n.childNodes) : undefined;
        // If this node is loading, show a spinner as a child
        if (loadingDirId && n.id === loadingDirId && isExpanded && (!childNodes || childNodes.length === 0)) {
          childNodes = [{
            id: `${n.id}__loading`,
            label: <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}><Spinner size={16} /> Loading…</span>,
            icon: null,
            isExpanded: false,
            childNodes: undefined,
            nodeData: {},
          }];
        }
        return {
          ...n,
          isExpanded,
          childNodes,
        };
      });
    }
    if (fileTree && !fileTree.error) {
      setTreeNodes(markExpanded(fileNodeToTreeNodes(fileTree)));
    } else {
      setTreeNodes([]);
    }
  }, [fileTree, expandedIds, loadingDirId]);

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
        {node.label}{sizeText}
      </span>
    );
  };

  // Handle file select only (no expansion logic here)
  const handleNodeClick = (node: TreeNodeInfo) => {
    const fileNode = node.nodeData as FileNode;
    console.log('[SDCardTree] Node clicked:', { id: node.id, name: fileNode.name, type: fileNode.type });
    if (fileNode.type === 'file') {
      onFileSelect(node.label as string);
    }
  };

  // Handle expand/collapse
  const handleNodeExpand = (node: TreeNodeInfo) => {
    console.log('[SDCardTree] Node expanded:', { id: node.id });
    onToggleExpand(node.id as string, true);
  };
  const handleNodeCollapse = (node: TreeNodeInfo) => {
    console.log('[SDCardTree] Node collapsed:', { id: node.id });
    onToggleExpand(node.id as string, false);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size={50} />
      </div>
    );
  }

  if (fileTree?.error) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text style={{ color: 'var(--bp5-intent-danger)', fontSize: 16 }}>
          Error: {fileTree.error}
        </Text>
      </div>
    );
  }

  if (!fileTree || !fileTree.children || fileTree.children.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text style={{ color: 'var(--bp5-text-color-muted)', fontSize: 16 }}>
          No files found
        </Text>
      </div>
    );
  }

  return (
    <Tree
      contents={treeNodes.map(node => ({ ...node, label: renderLabel(node) }))}
      onNodeClick={handleNodeClick}
      onNodeExpand={handleNodeExpand}
      onNodeCollapse={handleNodeCollapse}
      className="sdcard-tree"
    />
  );
}; 