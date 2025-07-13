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
 * Merge LIST response into the file tree.
 * - If path is '/', replace root.
 * - Otherwise, update children of the node at the given path.
 * - Never replace root with a subdir node.
 * - Deep debug logging for every step.
 */
export function updateFileTreeWithListResponse(
  prevTree: FileNode | null,
  listNode: FileNode
): FileNode {
  const logPrefix = '[updateFileTreeWithListResponse]';
  if (!prevTree || listNode.path === '/') {
    console.log(`${logPrefix} Setting root to:`, listNode);
    return listNode;
  }
  if (!listNode.path) {
    console.warn(`${logPrefix} No path in listNode, cannot merge.`, listNode);
    return prevTree;
  }
  // Deep clone prevTree for immutability
  const clone = JSON.parse(JSON.stringify(prevTree));
  let found = false;

  function recurse(node: FileNode): FileNode {
    if (node.path === listNode.path) {
      found = true;
      console.log(`${logPrefix} Updating children of node:`, node.path, 'with:', listNode.children);
      return { ...node, children: listNode.children || [] };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child =>
          typeof child === 'object' && child !== null && 'path' in child
            ? recurse(child as FileNode)
            : child
        ),
      };
    }
    return node;
  }

  const updated = recurse(clone);
  if (!found) {
    console.warn(`${logPrefix} Node not found for path:`, listNode.path, 'in tree:', prevTree);
    return prevTree;
  }
  return updated;
}

/**
 * Utility to update the children of a node by path in a FileNode tree.
 * Returns a new tree with the update applied.
 */
export function updateNodeChildren(tree: FileNode, nodePath: string, children: FileNode[]): FileNode {
  const thisPath = tree.path || tree.name;
  if (normalizeSDPath(thisPath) === normalizeSDPath(nodePath)) {
    console.log('[updateNodeChildren] Updating children for', thisPath, 'with', children);
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

/**
 * Converts a compact SD card JSON object (with fields like f, t, sz, ch, etc.)
 * to the FileNode format expected by the UI (name, type, size, children, etc.).
 * Works recursively for the whole tree.
 */
export function compactJsonToFileNode(node: Record<string, unknown>): FileNode {
  if (!node) return { name: '', type: 'file' };
  return {
    name:
      (node.f as string) ||
      (node.name as string) ||
      (typeof node.d === 'string'
        ? node.d === '/' ? '/' : node.d.split('/').filter(Boolean).pop() || ''
        : ''),
    type: node.t === 'd' || node.type === 'directory' ? 'directory' : 'file',
    size: node.sz !== undefined ? (node.sz as number) : (node.size as number | undefined),
    children: Array.isArray(node.ch)
      ? (node.ch as Record<string, unknown>[]).map(child => compactJsonToFileNode(child))
      : Array.isArray(node.children)
        ? (node.children as Record<string, unknown>[]).map(child => compactJsonToFileNode(child))
        : undefined,
    error: (node.err as string) || (node.error as string) || undefined,
    path: node.path as string | undefined, // will be set by addPathsToFileTree
  };
} 