/**
 * Design Tree Renderer Hook
 * 
 * Provides functionality for rendering Design Tree JSON to HTML
 * and managing tree-based editing operations.
 */

import { useMemo, useCallback, useState } from 'react';
import {
  DesignTree,
  DesignNode,
  FrameNode,
  findNodeById,
  updateNodeInTree,
  traverseTree,
  NodeUpdate,
} from '@/types/design-tree';
import { renderDesignTreeToHtml, RenderOptions } from '@/lib/design-tree/tree-to-html';
import { validateDesignTree, safeParseDesignTree } from '@/lib/design-tree/schema';

interface UseDesignTreeRendererOptions {
  theme?: Record<string, string>;
  editable?: boolean;
  includeDataAttributes?: boolean;
}

interface UseDesignTreeRendererReturn {
  // Rendered HTML
  html: string;
  
  // Tree state
  tree: DesignTree | null;
  isValid: boolean;
  error: string | null;
  
  // Tree operations
  setTree: (tree: DesignTree) => void;
  parseFromJson: (json: string) => boolean;
  updateNode: (nodeId: string, updates: NodeUpdate) => void;
  findNode: (nodeId: string) => DesignNode | null;
  
  // Re-render
  rerender: () => void;
}

/**
 * Hook for rendering and managing Design Tree state
 */
export function useDesignTreeRenderer(
  initialTree: DesignTree | null = null,
  options: UseDesignTreeRendererOptions = {}
): UseDesignTreeRendererReturn {
  const {
    theme = {},
    editable = false,
    includeDataAttributes = true,
  } = options;

  const [tree, setTreeState] = useState<DesignTree | null>(initialTree);
  const [error, setError] = useState<string | null>(null);
  const [renderVersion, setRenderVersion] = useState(0);

  // Validate tree
  const isValid = useMemo(() => {
    if (!tree) return false;
    const result = validateDesignTree(tree);
    return result.success;
  }, [tree]);

  // Render tree to HTML
  const html = useMemo(() => {
    if (!tree) return '';
    
    const renderOptions: RenderOptions = {
      includeDataAttributes,
      inlineStyles: true,
      theme,
      editable,
    };

    try {
      return renderDesignTreeToHtml(tree, renderOptions);
    } catch (err) {
      console.error('Failed to render Design Tree:', err);
      return `<div class="p-4 text-red-500">Failed to render design</div>`;
    }
  }, [tree, theme, editable, includeDataAttributes, renderVersion]);

  // Set tree with validation
  const setTree = useCallback((newTree: DesignTree) => {
    const result = validateDesignTree(newTree);
    if (result.success) {
      setTreeState(newTree);
      setError(null);
    } else {
      setError(result.error?.message || 'Invalid Design Tree');
    }
  }, []);

  // Parse tree from JSON string
  const parseFromJson = useCallback((json: string): boolean => {
    try {
      const parsed = safeParseDesignTree(json);
      if (parsed) {
        setTreeState(parsed);
        setError(null);
        return true;
      }
      setError('Invalid Design Tree JSON');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON');
      return false;
    }
  }, []);

  // Update a node in the tree
  const updateNode = useCallback((nodeId: string, updates: NodeUpdate) => {
    if (!tree) return;

    const updatedRoot = updateNodeInTree(tree.root, nodeId, updates) as FrameNode;
    const newTree: DesignTree = {
      ...tree,
      root: updatedRoot,
      updatedAt: new Date(),
      version: (tree.version || 1) + 1,
    };

    setTreeState(newTree);
  }, [tree]);

  // Find a node by ID
  const findNode = useCallback((nodeId: string): DesignNode | null => {
    if (!tree) return null;
    return findNodeById(tree.root, nodeId);
  }, [tree]);

  // Force re-render
  const rerender = useCallback(() => {
    setRenderVersion(v => v + 1);
  }, []);

  return {
    html,
    tree,
    isValid,
    error,
    setTree,
    parseFromJson,
    updateNode,
    findNode,
    rerender,
  };
}

/**
 * Hook for managing Design Tree node selection
 */
export function useDesignTreeSelection(tree: DesignTree | null) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedIds(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      );
    } else {
      setSelectedIds([nodeId]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedNodes = useMemo(() => {
    if (!tree) return [];
    return selectedIds
      .map(id => findNodeById(tree.root, id))
      .filter((node): node is DesignNode => node !== null);
  }, [tree, selectedIds]);

  const hoveredNode = useMemo(() => {
    if (!tree || !hoveredId) return null;
    return findNodeById(tree.root, hoveredId);
  }, [tree, hoveredId]);

  return {
    selectedIds,
    hoveredId,
    selectedNodes,
    hoveredNode,
    selectNode,
    clearSelection,
    setHoveredId,
  };
}

/**
 * Hook for flattening Design Tree into a list for layer panel
 */
export function useDesignTreeLayers(tree: DesignTree | null) {
  const layers = useMemo(() => {
    if (!tree) return [];

    const items: { node: DesignNode; depth: number; parent: DesignNode | null }[] = [];

    traverseTree(tree.root, (node, parent, depth) => {
      items.push({ node, depth, parent });
    });

    return items;
  }, [tree]);

  return { layers };
}

/**
 * Convert Design Tree to exportable format
 */
export function useDesignTreeExport(tree: DesignTree | null) {
  const toJson = useCallback(() => {
    if (!tree) return '';
    return JSON.stringify(tree, null, 2);
  }, [tree]);

  const toHtml = useCallback((options?: RenderOptions) => {
    if (!tree) return '';
    return renderDesignTreeToHtml(tree, options);
  }, [tree]);

  return { toJson, toHtml };
}

export default useDesignTreeRenderer;
