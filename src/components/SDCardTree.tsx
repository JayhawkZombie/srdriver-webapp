import React, { useState, useEffect } from 'react';
import { Tree, Spinner, Text, type TreeNodeInfo } from '@blueprintjs/core';

// JSON format that matches the embedded device output
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  error?: string;
}

function fileNodeToTreeNodes(node: FileNode | FileNode[], keyPrefix = ''): TreeNodeInfo[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((child, idx) => fileNodeToTreeNodes(child, `${keyPrefix}${idx}-`));
  }
  return [{
    id: keyPrefix + node.name,
    label: node.name,
    icon: node.type === 'directory' ? 'folder-close' : 'document',
    isExpanded: node.type === 'directory',
    childNodes: node.children ? fileNodeToTreeNodes(node.children, `${keyPrefix}${node.name}-`) : undefined,
    nodeData: node,
  }];
}

// Stateless SDCardTree component
export interface SDCardTreeProps {
  fileTree: FileNode | null;
  onFileSelect: (fileName: string) => void;
  isLoading?: boolean;
}

export const SDCardTree: React.FC<SDCardTreeProps> = ({ fileTree, onFileSelect, isLoading = false }) => {
  const [treeNodes, setTreeNodes] = useState<TreeNodeInfo[]>([]);

  // Update tree nodes when fileTree changes
  useEffect(() => {
    if (fileTree && !fileTree.error) {
      setTreeNodes(fileNodeToTreeNodes(fileTree));
    } else {
      setTreeNodes([]);
    }
  }, [fileTree]);

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

  // Handle expand/collapse
  const handleNodeClick = (node: TreeNodeInfo) => {
    if (node.childNodes) {
      setTreeNodes(prev => updateNode(prev, node.id as string, n => ({ ...n, isExpanded: !n.isExpanded })));
    } else if ((node.nodeData as FileNode)?.type === 'file') {
      onFileSelect(node.label as string);
    }
  };

  function updateNode(nodes: TreeNodeInfo[], id: string, updater: (n: TreeNodeInfo) => TreeNodeInfo): TreeNodeInfo[] {
    return nodes.map(n => {
      if (n.id === id) return updater(n);
      if (n.childNodes) return { ...n, childNodes: updateNode(n.childNodes, id, updater) };
      return n;
    });
  }

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
      className="sdcard-tree"
    />
  );
}; 