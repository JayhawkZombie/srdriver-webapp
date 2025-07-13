import type { FileNode } from '../SDCardTree';

/**
 * Recursively finds a node in a FileNode tree by its full path.
 * @param root The root FileNode (usually your fileTree from Zustand)
 * @param path The full path to search for (e.g. "/logs" or "/logs/2024-06-01.log")
 * @returns The FileNode if found, or null if not found
 */
export function findNodeByPath(root: FileNode | null, path: string): FileNode | null {
  if (!root) return null;
  // Normalize path: always start with /
  const normPath = path.startsWith('/') ? path : '/' + path;
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
  if (thisPath === nodePath) {
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
 * Recursively adds a 'path' property to each FileNode, matching the UI tree logic.
 * @param node The FileNode to process
 * @param parentPath The path of the parent node
 * @returns A new FileNode tree with 'path' set on every node
 */
export function addPathsToFileTree(node: FileNode, parentPath = ''): FileNode {
  const isRoot = parentPath === '' && node.name === '/';
  // Remove leading slash from name except for root
  const safeName = isRoot ? '/' : node.name.replace(/^\/+/, '');
  const path = isRoot
    ? '/'
    : parentPath === '' || parentPath === '/'
      ? `/${safeName}`
      : `${parentPath}/${safeName}`;
  return {
    ...node,
    path,
    children: node.children ? node.children.map(child => addPathsToFileTree(child, path)) : node.children,
  };
} 