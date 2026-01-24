/**
 * Design Tree to Figma Export - IMPROVED VERSION
 * 
 * Creates Figma-compatible export formats:
 * 1. Figma Plugin JSON - For import via Figma plugin (best editability)
 * 2. Enhanced SVG - Preserves layer hierarchy as nested groups
 * 3. HTML for image capture - Fallback for quick copy
 * 
 * The Figma Plugin JSON format creates proper frames with auto-layout,
 * text layers, and other Figma-native features.
 * 
 * IMPORTANT: All container elements (frame, group, button, section, div, etc.)
 * are converted to Figma FRAME nodes to ensure proper layer hierarchy
 * and enable auto-layout, constraints, and layout editing in Figma.
 */

import {
  DesignNode,
  DesignTree,
  FrameNode,
  TextNode,
  ImageNode,
  IconNode,
  ButtonNode,
  InputNode,
  RectangleNode,
  GroupNode,
  Fill,
  Stroke,
  Shadow,
} from '@/types/design-tree';

// ============================================================================
// THEME COLOR RESOLVER
// ============================================================================

// Default theme colors to resolve CSS variables
const DEFAULT_THEME_COLORS: Record<string, string> = {
  '--background': '#ffffff',
  '--foreground': '#0a0a0a',
  '--card': '#ffffff',
  '--card-foreground': '#0a0a0a',
  '--popover': '#ffffff',
  '--popover-foreground': '#0a0a0a',
  '--primary': '#171717',
  '--primary-foreground': '#fafafa',
  '--secondary': '#f5f5f5',
  '--secondary-foreground': '#171717',
  '--muted': '#f5f5f5',
  '--muted-foreground': '#737373',
  '--accent': '#f5f5f5',
  '--accent-foreground': '#171717',
  '--destructive': '#ef4444',
  '--border': '#e5e5e5',
  '--input': '#e5e5e5',
  '--ring': '#0a0a0a',
  '--font-sans': 'Inter',
  '--font-heading': 'Space Grotesk',
};

let resolvedTheme: Record<string, string> = { ...DEFAULT_THEME_COLORS };

/**
 * Set theme colors for resolution
 */
export function setThemeColors(themeStyle: string): void {
  resolvedTheme = { ...DEFAULT_THEME_COLORS };
  
  // Parse theme CSS string
  const matches = themeStyle.matchAll(/--([a-z-]+):\s*([^;]+);/g);
  for (const match of matches) {
    resolvedTheme[`--${match[1]}`] = match[2].trim();
  }
}

/**
 * Resolve a color value, handling CSS variables
 */
function resolveColor(color: string): string {
  if (!color) return '#000000';
  
  // Handle CSS variables
  if (color.includes('var(')) {
    const varMatch = color.match(/var\(([^)]+)\)/);
    if (varMatch) {
      const varName = varMatch[1].trim();
      const resolved = resolvedTheme[varName];
      if (resolved) {
        // Recursively resolve in case of nested variables
        return resolveColor(resolved);
      }
    }
    return '#000000';
  }
  
  return color;
}

// ============================================================================
// FIGMA PLUGIN JSON FORMAT
// ============================================================================

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'IMAGE';
  color?: FigmaColor;
  opacity?: number;
  visible?: boolean;
  gradientStops?: { color: FigmaColor; position: number }[];
  scaleMode?: string;
  imageHash?: string;
}

interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  radius: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  spread?: number;
}

interface FigmaTypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
}

interface FigmaBaseNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface FigmaFrameNode extends FigmaBaseNode {
  type: 'FRAME';
  fills: FigmaPaint[];
  strokes: FigmaPaint[];
  strokeWeight: number;
  strokeAlign: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomRightRadius?: number;
  bottomLeftRadius?: number;
  effects: FigmaEffect[];
  clipsContent: boolean;
  // Auto-layout properties - ALWAYS set for proper Frame behavior
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  // Layout positioning for children
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';
  // Constraints for resize behavior
  constraints?: {
    horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
    vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
  };
  children: FigmaPluginNode[];
}

interface FigmaTextNode extends FigmaBaseNode {
  type: 'TEXT';
  characters: string;
  style: FigmaTypeStyle;
  fills: FigmaPaint[];
  effects: FigmaEffect[];
  // Text auto-resize
  textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  // Layout constraints
  layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
  layoutGrow?: number;
}

interface FigmaRectangleNode extends FigmaBaseNode {
  type: 'RECTANGLE';
  fills: FigmaPaint[];
  strokes: FigmaPaint[];
  strokeWeight: number;
  cornerRadius: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomRightRadius?: number;
  bottomLeftRadius?: number;
  effects: FigmaEffect[];
  // Layout constraints
  layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
  layoutGrow?: number;
}

interface FigmaEllipseNode extends FigmaBaseNode {
  type: 'ELLIPSE';
  fills: FigmaPaint[];
  strokes: FigmaPaint[];
  strokeWeight: number;
  effects: FigmaEffect[];
}

type FigmaPluginNode = FigmaFrameNode | FigmaTextNode | FigmaRectangleNode | FigmaEllipseNode;

interface FigmaPluginExport {
  version: '1.0';
  type: 'XDESIGN_FIGMA_EXPORT';
  name: string;
  width: number;
  height: number;
  nodes: FigmaPluginNode[];
  // Metadata for the plugin
  meta: {
    exportedAt: string;
    sourceId: string;
    theme?: Record<string, string>;
  };
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

export interface FigmaExportOptions {
  themeStyle?: string;
  preserveLayout?: boolean;
  flattenIcons?: boolean;
  includeImages?: boolean;
  // Convert all containers to frames (recommended)
  allContainersAsFrames?: boolean;
}

/**
 * Convert Design Tree to Figma Plugin JSON format
 * This format can be imported by a Figma plugin to create proper editable layers
 * 
 * IMPORTANT: All container elements are converted to FRAME type to ensure
 * proper layer hierarchy in Figma. This enables:
 * - Auto-layout on all containers
 * - Proper constraints and resize behavior
 * - Frame icon in Figma's layer panel (not group icon)
 */
export function convertTreeToFigmaPlugin(
  tree: DesignTree,
  options: FigmaExportOptions = {}
): FigmaPluginExport {
  // Set theme colors for resolution
  if (options.themeStyle) {
    setThemeColors(options.themeStyle);
  }
  
  // Default to converting all containers as frames
  const exportOptions = {
    ...options,
    allContainersAsFrames: options.allContainersAsFrames !== false,
  };
  
  const rootNode = convertNodeToFigma(tree.root, exportOptions, true);
  
  return {
    version: '1.0',
    type: 'XDESIGN_FIGMA_EXPORT',
    name: tree.name,
    width: tree.width,
    height: tree.height,
    nodes: rootNode ? [rootNode] : [],
    meta: {
      exportedAt: new Date().toISOString(),
      sourceId: tree.id,
      theme: resolvedTheme,
    },
  };
}

/**
 * Copy Design Tree as Figma Plugin JSON to clipboard
 */
export async function copyDesignTreeToFigma(
  tree: DesignTree,
  options: FigmaExportOptions = {}
): Promise<void> {
  const figmaData = convertTreeToFigmaPlugin(tree, options);
  const jsonString = JSON.stringify(figmaData, null, 2);
  
  try {
    // Copy both the JSON and as plain text for flexibility
    if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      const items = new ClipboardItem({
        'text/plain': new Blob([jsonString], { type: 'text/plain' }),
        'application/json': new Blob([jsonString], { type: 'application/json' }),
      });
      await navigator.clipboard.write([items]);
    } else {
      await navigator.clipboard.writeText(jsonString);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    await navigator.clipboard.writeText(jsonString);
  }
}

/**
 * Download Design Tree as Figma Plugin JSON file
 */
export function downloadFigmaPluginJson(
  tree: DesignTree,
  options: FigmaExportOptions = {}
): void {
  const figmaData = convertTreeToFigmaPlugin(tree, options);
  const jsonString = JSON.stringify(figmaData, null, 2);
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tree.name.replace(/\s+/g, '-').toLowerCase()}-figma.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// NODE CONVERTERS
// ============================================================================

/**
 * Check if a node type should be converted to a Figma FRAME
 * This ensures proper layer hierarchy in Figma
 */
function shouldBeFrame(node: DesignNode): boolean {
  // These types should ALWAYS be frames in Figma
  const frameTypes = ['frame', 'group', 'button'];
  return frameTypes.includes(node.type);
}

/**
 * Check if a node has children (is a container)
 */
function isContainer(node: DesignNode): boolean {
  return 'children' in node && Array.isArray((node as any).children);
}

function convertNodeToFigma(
  node: DesignNode,
  options: FigmaExportOptions,
  isRoot: boolean = false
): FigmaPluginNode | null {
  if (node.visible === false) return null;
  
  // Determine if this node should be a frame
  const convertToFrame = options.allContainersAsFrames && isContainer(node);
  
  switch (node.type) {
    case 'frame':
      return convertFrameToFigma(node as FrameNode, options, isRoot);
    case 'group':
      // IMPORTANT: Convert groups to frames for proper Figma hierarchy
      return convertGroupToFrame(node as GroupNode, options);
    case 'text':
      return convertTextToFigma(node as TextNode);
    case 'image':
      return convertImageToFigma(node as ImageNode);
    case 'icon':
      return convertIconToFigma(node as IconNode, options);
    case 'button':
      // Buttons are frames with children
      return convertButtonToFrame(node as ButtonNode, options);
    case 'input':
      return convertInputToFigma(node as InputNode);
    case 'rectangle':
      return convertRectangleToFigma(node as RectangleNode);
    default:
      // For unknown types with children, convert to frame
      if (isContainer(node)) {
        return convertGenericContainerToFrame(node, options);
      }
      return null;
  }
}

/**
 * Convert a Frame node to Figma FRAME
 */
function convertFrameToFigma(
  node: FrameNode,
  options: FigmaExportOptions,
  isRoot: boolean = false
): FigmaFrameNode {
  const children: FigmaPluginNode[] = [];
  
  for (const child of node.children || []) {
    const figmaChild = convertNodeToFigma(child, options, false);
    if (figmaChild) {
      children.push(figmaChild);
    }
  }
  
  // Determine layout mode
  let layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' = 'NONE';
  let hasAutoLayout = false;
  
  if (options.preserveLayout !== false && node.layout && node.layout.mode !== 'none') {
    layoutMode = node.layout.mode === 'vertical' ? 'VERTICAL' : 'HORIZONTAL';
    hasAutoLayout = true;
  }
  
  const figmaNode: FigmaFrameNode = {
    id: node.id,
    name: node.name || 'Frame',
    type: 'FRAME', // Always FRAME, never GROUP
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills),
    strokes: convertStrokesToFigma(node.strokes),
    strokeWeight: node.strokes?.[0]?.width || 0,
    strokeAlign: 'INSIDE',
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    effects: convertEffectsToFigma(node.shadows, node.blur, node.backdropBlur),
    clipsContent: node.clipContent ?? true, // Default to clipping for frames
    // Auto-layout properties
    layoutMode: layoutMode,
    primaryAxisSizingMode: hasAutoLayout ? 'AUTO' : 'FIXED',
    counterAxisSizingMode: 'FIXED',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'MIN',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,
    layoutPositioning: hasAutoLayout ? 'AUTO' : 'ABSOLUTE',
    children,
  };
  
  // Handle individual corner radii
  if (typeof node.cornerRadius === 'object') {
    figmaNode.topLeftRadius = node.cornerRadius.topLeft;
    figmaNode.topRightRadius = node.cornerRadius.topRight;
    figmaNode.bottomRightRadius = node.cornerRadius.bottomRight;
    figmaNode.bottomLeftRadius = node.cornerRadius.bottomLeft;
  }
  
  // Apply auto-layout properties if enabled
  if (hasAutoLayout && node.layout) {
    const layout = node.layout;
    
    figmaNode.itemSpacing = layout.gap || 0;
    
    if (layout.padding) {
      figmaNode.paddingTop = layout.padding.top;
      figmaNode.paddingRight = layout.padding.right;
      figmaNode.paddingBottom = layout.padding.bottom;
      figmaNode.paddingLeft = layout.padding.left;
    }
    
    // Alignment mapping
    const alignMap: Record<string, 'MIN' | 'CENTER' | 'MAX'> = {
      'start': 'MIN',
      'center': 'CENTER',
      'end': 'MAX',
      'stretch': 'MIN',
      'baseline': 'MIN',
    };
    
    const justifyMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'> = {
      'start': 'MIN',
      'center': 'CENTER',
      'end': 'MAX',
      'space-between': 'SPACE_BETWEEN',
      'space-around': 'SPACE_BETWEEN',
      'space-evenly': 'SPACE_BETWEEN',
    };
    
    figmaNode.counterAxisAlignItems = alignMap[layout.alignItems] || 'MIN';
    figmaNode.primaryAxisAlignItems = justifyMap[layout.justifyContent] || 'MIN';
    
    if (layout.wrap) {
      figmaNode.layoutWrap = 'WRAP';
    }
  }
  
  // Set constraints for root frame
  if (isRoot) {
    figmaNode.constraints = {
      horizontal: 'MIN',
      vertical: 'MIN',
    };
  }
  
  return figmaNode;
}

/**
 * Convert a Group node to Figma FRAME (not GROUP)
 * This ensures groups appear as frames in Figma for better editability
 */
function convertGroupToFrame(
  node: GroupNode,
  options: FigmaExportOptions
): FigmaFrameNode {
  const children: FigmaPluginNode[] = [];
  
  for (const child of node.children || []) {
    const figmaChild = convertNodeToFigma(child, options, false);
    if (figmaChild) {
      children.push(figmaChild);
    }
  }
  
  return {
    id: node.id,
    name: node.name || 'Group',
    type: 'FRAME', // Convert to FRAME for proper Figma behavior
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills) || [],
    strokes: convertStrokesToFigma(node.strokes) || [],
    strokeWeight: node.strokes?.[0]?.width || 0,
    strokeAlign: 'INSIDE',
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    effects: convertEffectsToFigma(node.shadows, node.blur, node.backdropBlur),
    clipsContent: false, // Groups typically don't clip
    // No auto-layout for groups by default
    layoutMode: 'NONE',
    primaryAxisSizingMode: 'FIXED',
    counterAxisSizingMode: 'FIXED',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'MIN',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,
    layoutPositioning: 'ABSOLUTE',
    children,
  };
}

/**
 * Convert a Button node to Figma FRAME
 */
function convertButtonToFrame(
  node: ButtonNode,
  options: FigmaExportOptions
): FigmaFrameNode {
  const children: FigmaPluginNode[] = [];
  
  for (const child of node.children || []) {
    const figmaChild = convertNodeToFigma(child, options, false);
    if (figmaChild) {
      children.push(figmaChild);
    }
  }
  
  // Determine layout mode
  let layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' = 'HORIZONTAL'; // Default to horizontal for buttons
  
  if (node.layout && node.layout.mode !== 'none') {
    layoutMode = node.layout.mode === 'vertical' ? 'VERTICAL' : 'HORIZONTAL';
  }
  
  const figmaNode: FigmaFrameNode = {
    id: node.id,
    name: node.name || 'Button',
    type: 'FRAME',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills),
    strokes: convertStrokesToFigma(node.strokes),
    strokeWeight: node.strokes?.[0]?.width || 0,
    strokeAlign: 'INSIDE',
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 8,
    effects: convertEffectsToFigma(node.shadows, node.blur, node.backdropBlur),
    clipsContent: true,
    layoutMode: layoutMode,
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    primaryAxisAlignItems: 'CENTER',
    counterAxisAlignItems: 'CENTER',
    paddingLeft: node.layout?.padding?.left ?? 16,
    paddingRight: node.layout?.padding?.right ?? 16,
    paddingTop: node.layout?.padding?.top ?? 12,
    paddingBottom: node.layout?.padding?.bottom ?? 12,
    itemSpacing: node.layout?.gap ?? 8,
    layoutPositioning: 'AUTO',
    children,
  };
  
  // Handle individual corner radii
  if (typeof node.cornerRadius === 'object') {
    figmaNode.topLeftRadius = node.cornerRadius.topLeft;
    figmaNode.topRightRadius = node.cornerRadius.topRight;
    figmaNode.bottomRightRadius = node.cornerRadius.bottomRight;
    figmaNode.bottomLeftRadius = node.cornerRadius.bottomLeft;
  }
  
  return figmaNode;
}

/**
 * Convert any generic container node to Figma FRAME
 */
function convertGenericContainerToFrame(
  node: DesignNode,
  options: FigmaExportOptions
): FigmaFrameNode {
  const children: FigmaPluginNode[] = [];
  const nodeWithChildren = node as DesignNode & { children?: DesignNode[] };
  
  for (const child of nodeWithChildren.children || []) {
    const figmaChild = convertNodeToFigma(child, options, false);
    if (figmaChild) {
      children.push(figmaChild);
    }
  }
  
  return {
    id: node.id,
    name: node.name || 'Container',
    type: 'FRAME',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills) || [],
    strokes: convertStrokesToFigma(node.strokes) || [],
    strokeWeight: node.strokes?.[0]?.width || 0,
    strokeAlign: 'INSIDE',
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    effects: convertEffectsToFigma(node.shadows, node.blur, node.backdropBlur),
    clipsContent: false,
    layoutMode: 'NONE',
    primaryAxisSizingMode: 'FIXED',
    counterAxisSizingMode: 'FIXED',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'MIN',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,
    layoutPositioning: 'ABSOLUTE',
    children,
  };
}

function convertTextToFigma(node: TextNode): FigmaTextNode {
  const { textStyle } = node;
  
  const textAlignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
    'left': 'LEFT',
    'center': 'CENTER',
    'right': 'RIGHT',
    'justify': 'JUSTIFIED',
  };
  
  const textCaseMap: Record<string, 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'> = {
    'none': 'ORIGINAL',
    'uppercase': 'UPPER',
    'lowercase': 'LOWER',
    'capitalize': 'TITLE',
  };
  
  const textDecorationMap: Record<string, 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'> = {
    'none': 'NONE',
    'underline': 'UNDERLINE',
    'line-through': 'STRIKETHROUGH',
  };
  
  // Resolve font family
  let fontFamily = textStyle.fontFamily;
  if (fontFamily.includes('var(')) {
    fontFamily = resolveColor(fontFamily);
  }
  fontFamily = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  
  return {
    id: node.id,
    name: node.name || node.content.substring(0, 20) || 'Text',
    type: 'TEXT',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    characters: node.content,
    style: {
      fontFamily: fontFamily || 'Inter',
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
      textAlignHorizontal: textAlignMap[textStyle.textAlign] || 'LEFT',
      textAlignVertical: 'TOP',
      letterSpacing: textStyle.letterSpacing,
      lineHeightPx: typeof textStyle.lineHeight === 'number'
        ? textStyle.lineHeight * textStyle.fontSize
        : textStyle.fontSize * 1.2,
      textCase: textCaseMap[textStyle.textTransform] || 'ORIGINAL',
      textDecoration: textDecorationMap[textStyle.textDecoration] || 'NONE',
    },
    fills: convertFillsToFigma(node.fills),
    effects: convertEffectsToFigma(node.shadows),
    textAutoResize: node.autoWidth && node.autoHeight ? 'WIDTH_AND_HEIGHT' : 
                    node.autoHeight ? 'HEIGHT' : 'NONE',
    layoutAlign: 'INHERIT',
    layoutGrow: 0,
  };
}

function convertImageToFigma(node: ImageNode): FigmaRectangleNode {
  return {
    id: node.id,
    name: node.name || 'Image',
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: [{
      type: 'IMAGE',
      visible: true,
      scaleMode: node.objectFit === 'contain' ? 'FIT' : 'FILL',
      imageHash: node.src,
    }],
    strokes: [],
    strokeWeight: 0,
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    effects: convertEffectsToFigma(node.shadows),
    layoutAlign: 'INHERIT',
    layoutGrow: 0,
  };
}

function convertIconToFigma(node: IconNode, options: FigmaExportOptions): FigmaRectangleNode {
  const iconColor = node.color ? resolveColor(node.color) : '#666666';
  
  return {
    id: node.id,
    name: `Icon: ${node.iconLibrary || 'hugeicons'}:${node.iconName}`,
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: [{
      type: 'SOLID',
      color: hexToFigmaColor(iconColor),
      opacity: 0.2,
      visible: true,

    }],
    strokes: [{
      type: 'SOLID',
      color: hexToFigmaColor(iconColor),
      opacity: 1,
    }],
    strokeWeight: 1,
    cornerRadius: 4,
    effects: [],
    layoutAlign: 'INHERIT',
    layoutGrow: 0,
  };
}

function convertInputToFigma(node: InputNode): FigmaFrameNode {
  const textNode: FigmaTextNode = {
    id: `${node.id}-placeholder`,
    name: 'Placeholder',
    type: 'TEXT',
    visible: true,
    locked: false,
    opacity: 1,
    x: 12,
    y: 0,
    width: node.width - 24,
    height: node.height,
    characters: node.placeholder || '',
    style: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      textAlignHorizontal: 'LEFT',
      textAlignVertical: 'CENTER',
      letterSpacing: 0,
    },
    fills: [{
      type: 'SOLID',
      color: { r: 0.6, g: 0.6, b: 0.6, a: 1 },
      visible: true,
    }],
    effects: [],
    textAutoResize: 'NONE',
    layoutAlign: 'INHERIT',
    layoutGrow: 1,
  };
  
  return {
    id: node.id,
    name: node.name || 'Input',
    type: 'FRAME',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills) || [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1, a: 1 },
      visible: true,
    }],
    strokes: convertStrokesToFigma(node.strokes) || [{
      type: 'SOLID',
      color: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
    }],
    strokeWeight: 1,
    strokeAlign: 'INSIDE',
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 8,
    effects: [],
    clipsContent: true,
    layoutMode: 'HORIZONTAL',
    primaryAxisSizingMode: 'FIXED',
    counterAxisSizingMode: 'FIXED',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'CENTER',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,
    layoutPositioning: 'AUTO',
    children: [textNode],
  };
}

function convertRectangleToFigma(node: RectangleNode): FigmaRectangleNode {
  const figmaNode: FigmaRectangleNode = {
    id: node.id,
    name: node.name || 'Rectangle',
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: convertFillsToFigma(node.fills),
    strokes: convertStrokesToFigma(node.strokes),
    strokeWeight: node.strokes?.[0]?.width || 0,
    cornerRadius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    effects: convertEffectsToFigma(node.shadows),
    layoutAlign: 'INHERIT',
    layoutGrow: 0,
  };
  
  if (typeof node.cornerRadius === 'object') {
    figmaNode.topLeftRadius = node.cornerRadius.topLeft;
    figmaNode.topRightRadius = node.cornerRadius.topRight;
    figmaNode.bottomRightRadius = node.cornerRadius.bottomRight;
    figmaNode.bottomLeftRadius = node.cornerRadius.bottomLeft;
  }
  
  return figmaNode;
}

// ============================================================================
// STYLE CONVERTERS
// ============================================================================

function convertFillsToFigma(fills?: Fill[]): FigmaPaint[] {
  if (!fills || fills.length === 0) return [];
  
  return fills.map(fill => {
    switch (fill.type) {
      case 'solid':
        const color = resolveColor(fill.color || '#000000');
        return {
          type: 'SOLID' as const,
          color: hexToFigmaColor(color),
          opacity: fill.opacity ?? 1,
          visible: true,
        };
      
      case 'gradient':
        return {
          type: 'GRADIENT_LINEAR' as const,
          gradientStops: fill.gradientStops?.map(stop => ({
            color: hexToFigmaColor(resolveColor(stop.color)),
            position: stop.position,
          })) || [],
          visible: true,
        };
      
      case 'image':
        return {
          type: 'IMAGE' as const,
          scaleMode: (fill.imageScaleMode?.toUpperCase() || 'FILL'),
          imageHash: fill.imageUrl,
          visible: true,
        };
      
      default:
        return {
          type: 'SOLID' as const,
          color: { r: 0, g: 0, b: 0, a: 0 },
          visible: false,
        };
    }
  });
}

function convertStrokesToFigma(strokes?: Stroke[]): FigmaPaint[] {
  if (!strokes || strokes.length === 0) return [];
  
  return strokes.map(stroke => ({
    type: 'SOLID' as const,
    color: hexToFigmaColor(resolveColor(stroke.color)),
    opacity: 1,
  }));
}

function convertEffectsToFigma(
  shadows?: Shadow[],
  blur?: number,
  backdropBlur?: number
): FigmaEffect[] {
  const effects: FigmaEffect[] = [];
  
  if (shadows) {
    for (const shadow of shadows) {
      effects.push({
        type: shadow.type === 'inner' ? 'INNER_SHADOW' : 'DROP_SHADOW',
        visible: true,
        radius: shadow.blur,
        color: hexToFigmaColor(resolveColor(shadow.color)),
        offset: { x: shadow.offsetX, y: shadow.offsetY },
        spread: shadow.spread,
      });
    }
  }
  
  if (blur) {
    effects.push({
      type: 'LAYER_BLUR',
      visible: true,
      radius: blur,
    });
  }
  
  if (backdropBlur) {
    effects.push({
      type: 'BACKGROUND_BLUR',
      visible: true,
      radius: backdropBlur,
    });
  }
  
  return effects;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function hexToFigmaColor(color: string): FigmaColor {
  // Handle special cases
  if (color === 'transparent' || color === 'none') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }
  }
  
  // Handle hex
  let hex = color.replace('#', '');
  
  // Shorthand hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // 8-digit hex (with alpha)
  let alpha = 1;
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  }
  
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b, a: alpha };
}

export function parseColorToFigma(color: string): FigmaColor {
  return hexToFigmaColor(resolveColor(color));
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Keep the old export names for compatibility
export const convertTreeToFigma = convertTreeToFigmaPlugin;
export const convertNode = convertNodeToFigma;
