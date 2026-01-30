/**
 * Design Tree Types - Foundation for Layer-Based Canvas
 *
 * This is the "source of truth" for all design data.
 * Both rendering (HTML/canvas) and export (Figma) derive from this tree.
 */

// ============================================================================
// CORE NODE TYPES
// ============================================================================

export type DesignNodeType =
  | "frame" // Container/artboard (like Figma Frame)
  | "group" // Logical grouping of elements
  | "rectangle" // Basic shape with fill/stroke
  | "text" // Text element
  | "image" // Bitmap image
  | "icon" // Vector icon (iconify)
  | "component" // Reusable component instance
  | "input" // Form input
  | "button" // Interactive button
  | "svg"; // Raw SVG element

// ============================================================================
// STYLE PROPERTIES (Figma-compatible)
// ============================================================================

export interface Fill {
  type: "solid" | "gradient" | "image";
  color?: string; // Hex, rgb, rgba, or CSS variable
  opacity?: number; // 0-1
  gradientStops?: { color: string; position: number }[];
  gradientAngle?: number;
  imageUrl?: string;
  imageScaleMode?: "fill" | "fit" | "crop" | "tile";
}

export interface Stroke {
  color: string;
  width: number;
  style: "solid" | "dashed" | "dotted";
  position: "inside" | "outside" | "center";
}

export interface Shadow {
  type: "drop" | "inner";
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number; // 100-900
  lineHeight: number | "auto"; // px or multiplier
  letterSpacing: number; // px
  textAlign: "left" | "center" | "right" | "justify";
  textDecoration: "none" | "underline" | "line-through";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

// ============================================================================
// LAYOUT PROPERTIES (Auto-layout / Flexbox)
// ============================================================================

export type LayoutMode = "none" | "horizontal" | "vertical" | "wrap";
export type LayoutAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type LayoutJustify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export interface LayoutProperties {
  mode: LayoutMode;
  padding: { top: number; right: number; bottom: number; left: number };
  gap: number; // Space between children
  alignItems: LayoutAlign; // Cross-axis alignment
  justifyContent: LayoutJustify; // Main-axis alignment
  wrap: boolean; // Allow wrapping
}

export interface Constraints {
  horizontal: "left" | "right" | "center" | "stretch" | "scale";
  vertical: "top" | "bottom" | "center" | "stretch" | "scale";
}

// ============================================================================
// BASE DESIGN NODE
// ============================================================================

export interface BaseDesignNode {
  id: string; // Unique identifier
  name: string; // Display name (e.g., "Header", "Balance Text")
  type: DesignNodeType;
  visible: boolean;
  locked: boolean;

  // Position & Size (relative to parent)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Degrees

  // Constraints (how element resizes with parent)
  constraints?: Constraints;

  // Common styles
  opacity: number; // 0-1
  fills?: Fill[];
  strokes?: Stroke[];
  shadows?: Shadow[];
  cornerRadius?: number | CornerRadius;
  clipContent?: boolean; // Clip children to bounds

  // Effects
  blur?: number;
  backdropBlur?: number;

  // Metadata
  tags?: string[]; // For component detection
  cssClasses?: string[]; // Original Tailwind classes (for reference)
}

// ============================================================================
// SPECIFIC NODE TYPES
// ============================================================================

export interface FrameNode extends BaseDesignNode {
  type: "frame";
  children: DesignNode[];
  layout?: LayoutProperties;
  isComponent?: boolean; // Can be used as a component
  componentId?: string; // Reference to component definition
}

export interface GroupNode extends BaseDesignNode {
  type: "group";
  children: DesignNode[];
}

export interface RectangleNode extends BaseDesignNode {
  type: "rectangle";
}

export interface TextNode extends BaseDesignNode {
  type: "text";
  content: string; // The actual text
  textStyle: TextStyle;
  autoWidth?: boolean; // Width adjusts to content
  autoHeight?: boolean; // Height adjusts to content
  maxLines?: number; // Truncate after N lines
}

export interface ImageNode extends BaseDesignNode {
  type: "image";
  src: string; // Image URL
  alt?: string;
  objectFit: "cover" | "contain" | "fill" | "none";
}

export interface IconNode extends BaseDesignNode {
  type: "icon";
  iconName: string; // e.g., "hugeicons:home-01"
  iconLibrary: string; // e.g., "hugeicons", "lucide"
  color?: string;
  /** SVG path data (d attributes) for Figma VECTOR export when present */
  svgPathData?: string[];
}

export interface ButtonNode extends BaseDesignNode {
  type: "button";
  children: DesignNode[];
  layout?: LayoutProperties;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
}

export interface InputNode extends BaseDesignNode {
  type: "input";
  inputType: "text" | "email" | "password" | "number" | "search";
  placeholder?: string;
  value?: string;
  disabled?: boolean;
}

export interface SvgNode extends BaseDesignNode {
  type: "svg";
  svgContent: string; // Raw SVG markup
  viewBox?: string;
}

// Union type for all design nodes
export type DesignNode =
  | FrameNode
  | GroupNode
  | RectangleNode
  | TextNode
  | ImageNode
  | IconNode
  | ButtonNode
  | InputNode
  | SvgNode;

// ============================================================================
// DESIGN TREE (Complete Screen)
// ============================================================================

export interface DesignTree {
  id: string; // Frame/screen ID
  name: string; // Screen name
  width: number; // Artboard width
  height: number; // Artboard height
  backgroundColor?: string;
  root: FrameNode; // Root frame containing all elements

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number; // For optimistic updates

  // Theme reference
  themeId?: string;
  themeVariables?: Record<string, string>;
}

// ============================================================================
// COMPONENT DEFINITIONS (for reusable patterns)
// ============================================================================

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  category:
    | "navigation"
    | "card"
    | "form"
    | "button"
    | "header"
    | "footer"
    | "list"
    | "modal"
    | "other";
  tree: FrameNode; // The component's design tree
  variants?: {
    name: string;
    overrides: Partial<FrameNode>;
  }[];
  defaultProps?: Record<string, unknown>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// For tree traversal
export type NodeVisitor = (
  node: DesignNode,
  parent: DesignNode | null,
  depth: number,
) => void;

// For node updates
export type NodeUpdate = Partial<Omit<DesignNode, "id" | "type">>;

// Selection state
export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
}

// ============================================================================
// UTILITY FUNCTIONS (to be implemented)
// ============================================================================

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a default frame node
 */
export function createFrameNode(overrides: Partial<FrameNode> = {}): FrameNode {
  return {
    id: generateNodeId(),
    name: "Frame",
    type: "frame",
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    opacity: 1,
    children: [],
    ...overrides,
  };
}

/**
 * Create a default text node
 */
export function createTextNode(
  content: string,
  overrides: Partial<TextNode> = {},
): TextNode {
  return {
    id: generateNodeId(),
    name: content.slice(0, 20) || "Text",
    type: "text",
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 100,
    height: 24,
    opacity: 1,
    content,
    textStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      textAlign: "left",
      textDecoration: "none",
      textTransform: "none",
    },
    ...overrides,
  };
}

/**
 * Traverse the design tree and call visitor for each node
 */
export function traverseTree(
  node: DesignNode,
  visitor: NodeVisitor,
  parent: DesignNode | null = null,
  depth: number = 0,
): void {
  visitor(node, parent, depth);

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      traverseTree(child, visitor, node, depth + 1);
    }
  }
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(root: DesignNode, id: string): DesignNode | null {
  let found: DesignNode | null = null;

  traverseTree(root, (node) => {
    if (node.id === id) {
      found = node;
    }
  });

  return found;
}

/**
 * Update a node in the tree (immutable)
 */
export function updateNodeInTree(
  root: DesignNode,
  nodeId: string,
  updates: NodeUpdate,
): DesignNode {
  if (root.id === nodeId) {
    return { ...root, ...updates } as DesignNode;
  }

  if ("children" in root && Array.isArray(root.children)) {
    return {
      ...root,
      children: root.children.map((child) =>
        updateNodeInTree(child, nodeId, updates),
      ),
    } as DesignNode;
  }

  return root;
}

/**
 * Get all nodes of a specific type
 */
export function getNodesByType<T extends DesignNode>(
  root: DesignNode,
  type: DesignNodeType,
): T[] {
  const nodes: T[] = [];

  traverseTree(root, (node) => {
    if (node.type === type) {
      nodes.push(node as T);
    }
  });

  return nodes;
}

/**
 * Calculate the bounding box of a node and all its children
 */
export function calculateBoundingBox(node: DesignNode): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = node.x;
  let minY = node.y;
  let maxX = node.x + node.width;
  let maxY = node.y + node.height;

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childBox = calculateBoundingBox(child);
      minX = Math.min(minX, node.x + childBox.x);
      minY = Math.min(minY, node.y + childBox.y);
      maxX = Math.max(maxX, node.x + childBox.x + childBox.width);
      maxY = Math.max(maxY, node.y + childBox.y + childBox.height);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
