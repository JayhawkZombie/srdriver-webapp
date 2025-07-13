import type { FileNode } from '../SDCardTree';

/**
 * Normalize an SD card path: ensures a single leading slash, no trailing slash (except root), no duplicate slashes.
 */
export function normalizeSDPath(path: string): string {
  if (!path) return '/';
  // Replace backslashes, collapse multiple slashes, trim
  let norm = path.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  if (!norm.startsWith('/')) norm = '/' + norm;
  if (norm.length > 1 && norm.endsWith('/')) norm = norm.slice(0, -1);
  // Collapse multiple slashes again
  norm = norm.replace(/\/+/g, '/');
  return norm;
}

/**
 * Join SD card path segments robustly.
 */
export function joinSDPath(...parts: string[]): string {
  return normalizeSDPath(parts.filter(Boolean).join('/'));
}

/**
 * Get the full path for a node, given its name and parent path.
 */
export function getNodePath(name: string, parentPath: string): string {
  if (parentPath === '' && name === '/') return '/';
  return joinSDPath(parentPath, name === '/' ? '' : name);
}

/**
 * Recursively finds a node in a FileNode tree by its full path.
 * @param root The root FileNode (usually your fileTree from Zustand)
 * @param path The full path to search for (e.g. "/logs" or "/logs/2024-06-01.log")
 * @returns The FileNode if found, or null if not found
 */
export function findNodeByPath(root: FileNode | null, path: string): FileNode | null {
  if (!root) return null;
  const normPath = normalizeSDPath(path);
  if ((root.path || root.name) === normPath) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByPath(child, normPath);
    if (found) return found;
  }
  return null;
}

/**
 * Utility to update the children of a node by path in a FileNode tree.
 * Returns a new tree with the update applied.
 */
export function updateNodeChildren(tree: FileNode, nodePath: string, children: FileNode[]): FileNode {
  const thisPath = tree.path || tree.name;
  if (normalizeSDPath(thisPath) === normalizeSDPath(nodePath)) {
    return { ...tree, children };
  }
  if (tree.children) {
    return { ...tree, children: tree.children.map(child => updateNodeChildren(child, nodePath, children)) };
  }
  return tree;
}

/**
 * Utility to ensure all directories in the tree have children: [] if not loaded.
 * Useful for prepping the tree for expansion logic.
 */
export function ensureEmptyChildrenForDirs(node: FileNode): FileNode {
  if (node.type === 'directory') {
    return {
      ...node,
      children: node.children ? node.children.map(ensureEmptyChildrenForDirs) : [],
    };
  }
  return node;
}

/**
 * Recursively adds a 'path' property to each FileNode, matching the UI tree logic, using robust helpers.
 */
export function addPathsToFileTree(node: FileNode, parentPath = ''): FileNode {
  const isRoot = parentPath === '' && node.name === '/';
  const path = isRoot ? '/' : getNodePath(node.name, parentPath);
  return {
    ...node,
    path,
    children: node.children ? node.children.map(child => addPathsToFileTree(child, path)) : node.children,
  };
} 