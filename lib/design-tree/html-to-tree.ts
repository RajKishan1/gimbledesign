/**
 * HTML to Design Tree Parser - IMPROVED VERSION
 * 
 * Accurately converts HTML DOM elements into a structured Design Tree.
 * This version captures actual rendered positions, styles, and creates
 * proper nested frame hierarchy.
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
  Fill,
  Stroke,
  Shadow,
  TextStyle,
  LayoutProperties,
  LayoutMode,
  LayoutAlign,
  LayoutJustify,
  generateNodeId,
  createFrameNode,
} from '@/types/design-tree';

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export interface ParseOptions {
  frameId: string;
  frameName: string;
  frameWidth: number;
  frameHeight: number;
  themeId?: string;
}

/**
 * Parse an HTML element tree into a DesignTree structure
 */
export function parseHtmlToDesignTree(
  rootElement: Element,
  options: ParseOptions
): DesignTree {
  // Get the root's bounding rect for offset calculation
  const rootRect = rootElement.getBoundingClientRect();
  
  // Find the first meaningful child if root is body with no styles
  let actualRoot = rootElement;
  const doc = rootElement.ownerDocument;
  const win = doc.defaultView;
  
  if (win && rootElement.tagName.toLowerCase() === 'body') {
    const bodyStyles = win.getComputedStyle(rootElement);
    const firstChild = rootElement.children[0];
    
    // If body has no background and first child has one, use first child as root
    if (firstChild && 
        (bodyStyles.backgroundColor === 'rgba(0, 0, 0, 0)' || bodyStyles.backgroundColor === 'transparent') &&
        firstChild.children.length > 0) {
      const firstChildStyles = win.getComputedStyle(firstChild);
      if (firstChildStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
          firstChildStyles.backgroundColor !== 'transparent') {
        actualRoot = firstChild;
      }
    }
  }
  
  const actualRootRect = actualRoot.getBoundingClientRect();
  const rootNode = parseElement(actualRoot, null, actualRootRect.left, actualRootRect.top, 0);
  
  if (!rootNode) {
    throw new Error('Failed to parse root element');
  }

  // Ensure root is a frame
  const root: FrameNode = rootNode.type === 'frame' 
    ? rootNode as FrameNode
    : {
        ...createFrameNode(),
        id: generateNodeId(),
        name: options.frameName,
        x: 0,
        y: 0,
        width: options.frameWidth,
        height: options.frameHeight,
        children: [rootNode],
      };

  // Set root position to 0,0
  root.x = 0;
  root.y = 0;
  root.width = options.frameWidth;
  
  // Use actual content height
  const contentHeight = Math.round(actualRootRect.height);
  root.height = Math.max(options.frameHeight, contentHeight);

  // If root doesn't have a background fill but should have one, add default
  if (!root.fills || root.fills.length === 0) {
    // Check if we should add a white background (common for mobile apps)
    if (win) {
      const rootStyles = win.getComputedStyle(actualRoot);
      const bgColor = rootStyles.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        root.fills = [{ type: 'solid', color: bgColor, opacity: 1 }];
      }
    }
  }

  return {
    id: options.frameId,
    name: options.frameName,
    width: options.frameWidth,
    height: root.height,
    root,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    themeId: options.themeId,
  };
}

/**
 * Parse a single DOM element into a DesignNode
 * 
 * IMPORTANT: Positions are stored RELATIVE to root (absolute coordinates)
 * This makes SVG rendering simpler - just use x,y directly
 */
function parseElement(
  element: Element,
  parent: Element | null,
  rootOffsetX: number,
  rootOffsetY: number,
  depth: number
): DesignNode | null {
  const tagName = element.tagName.toLowerCase();
  
  // Skip non-visual elements
  if (['script', 'style', 'meta', 'link', 'head', 'noscript', 'br'].includes(tagName)) {
    return null;
  }
  
  // Skip SVG internal elements (they're rendered as part of parent SVG)
  const svgInternalTags = ['circle', 'path', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g', 'defs', 'clippath', 'mask', 'use', 'tspan', 'foreignobject', 'lineargradient', 'radialgradient', 'stop', 'filter', 'fegaussianblur', 'feoffset', 'feblend', 'fedropshadow'];
  if (svgInternalTags.includes(tagName)) {
    return null;
  }

  // Get the window from the element's document
  const doc = element.ownerDocument;
  const win = doc.defaultView;
  if (!win) return null;

  // Get computed styles
  const styles = win.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  // Skip invisible elements
  if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
    return null;
  }
  
  // Skip elements with no dimensions (but allow very small ones)
  // Exception: iconify-icon elements might report 0 dimensions before render
  const isIconElement = tagName === 'iconify-icon' || element.classList.contains('iconify');
  if (rect.width <= 0 && rect.height <= 0 && !isIconElement) {
    return null;
  }

  // Calculate ABSOLUTE position relative to root (not relative to parent)
  // This is intentional - SVG renderer will use these directly
  const x = rect.left - rootOffsetX;
  const y = rect.top - rootOffsetY;

  // Determine node type based on element
  const nodeType = determineNodeType(element, tagName, styles);
  
  // Build base node properties with ABSOLUTE coordinates
  const baseProps = buildBaseNodeProps(element, styles, rect, x, y);

  // Special handling for SVG elements
  if (tagName === 'svg') {
    return buildSvgNode(element, styles, baseProps);
  }

  // Create specific node type
  switch (nodeType) {
    case 'text':
      return buildTextNode(element, styles, baseProps, win);
    case 'image':
      return buildImageNode(element as HTMLImageElement, styles, baseProps);
    case 'icon':
      return buildIconNode(element, styles, baseProps);
    case 'button':
      return buildContainerNode(element, styles, baseProps, rootOffsetX, rootOffsetY, depth, 'button');
    case 'input':
      return buildInputNode(element as HTMLInputElement, styles, baseProps);
    case 'frame':
    default:
      return buildContainerNode(element, styles, baseProps, rootOffsetX, rootOffsetY, depth, 'frame');
  }
}

// ============================================================================
// NODE TYPE DETECTION - IMPROVED
// ============================================================================

function determineNodeType(element: Element, tagName: string, styles: CSSStyleDeclaration): DesignNode['type'] {
  // Iconify icons
  if (tagName === 'iconify-icon' || element.classList.contains('iconify')) {
    return 'icon';
  }
  
  // SVG elements - treat as frame (they'll render their visual appearance via fills)
  if (tagName === 'svg') {
    return 'frame';
  }
  
  // SVG child elements (circles, paths, etc.) - skip them, they're part of the SVG visual
  if (['circle', 'path', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g', 'defs', 'clippath', 'mask', 'use', 'text', 'tspan'].includes(tagName)) {
    // These are handled as part of SVG parent
    return 'frame';
  }
  
  // Images
  if (tagName === 'img' || tagName === 'picture') {
    return 'image';
  }
  
  // Buttons
  if (tagName === 'button' || element.getAttribute('role') === 'button') {
    return 'button';
  }
  
  // Links that look like buttons
  if (tagName === 'a' && element.classList.toString().includes('btn')) {
    return 'button';
  }
  
  // Interactive links (nav items)
  if (tagName === 'a' && element.classList.toString().includes('nav')) {
    return 'button';
  }
  
  // Inputs
  if (tagName === 'input' || tagName === 'textarea') {
    return 'input';
  }
  
  // Check if element is a text-only node
  const childElements = Array.from(element.children);
  const hasText = element.textContent?.trim();
  
  // Pure text elements (no child elements, only text content)
  if (childElements.length === 0 && hasText) {
    return 'text';
  }
  
  // Inline text elements with only text or inline children
  const inlineTags = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'strong', 'em', 'b', 'i', 'small', 'a'];
  if (inlineTags.includes(tagName)) {
    const hasOnlyTextOrInline = childElements.every(child => {
      const childTag = child.tagName.toLowerCase();
      return inlineTags.includes(childTag) || childTag === 'iconify-icon' || childTag === 'svg';
    });
    
    // If it has only inline/text children and actual text, treat as text
    // Unless it has significant background/border styling
    if (hasOnlyTextOrInline && hasText) {
      const hasBg = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
      const hasBorder = parseFloat(styles.borderWidth) > 0;
      const hasPadding = parseFloat(styles.paddingTop) > 8 || parseFloat(styles.paddingBottom) > 8;
      
      // If it looks like a styled container, treat as frame
      if (hasBg || hasBorder || hasPadding) {
        return 'frame';
      }
      
      return 'text';
    }
  }
  
  // Default to frame (container)
  return 'frame';
}

// ============================================================================
// BASE NODE PROPERTIES - IMPROVED
// ============================================================================

interface BaseNodeProps {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  fills?: Fill[];
  strokes?: Stroke[];
  shadows?: Shadow[];
  cornerRadius?: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  cssClasses?: string[];
  blur?: number;
  backdropBlur?: number;
}

function buildBaseNodeProps(
  element: Element,
  styles: CSSStyleDeclaration,
  rect: DOMRect,
  x: number,
  y: number
): BaseNodeProps {
  const id = element.id || generateNodeId();
  const name = getElementName(element, styles);
  
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  
  return {
    id,
    name,
    visible: true,
    locked: false,
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
    opacity: parseFloat(styles.opacity) || 1,
    fills: parseFills(styles),
    strokes: parseStrokes(styles),
    shadows: parseShadows(styles),
    cornerRadius: parseBorderRadius(styles, width, height),
    cssClasses: element.className ? element.className.toString().split(/\s+/).filter(Boolean) : undefined,
    blur: parseBlur(styles),
    backdropBlur: parseBackdropBlur(styles),
  };
}

function getElementName(element: Element, styles: CSSStyleDeclaration): string {
  // Use ID if available
  if (element.id) return element.id;
  
  const tagName = element.tagName.toLowerCase();
  const classes = element.className.toString();
  
  // Check for semantic elements
  const semanticTags: Record<string, string> = {
    'header': 'Header',
    'footer': 'Footer',
    'nav': 'Navigation',
    'main': 'Main Content',
    'aside': 'Sidebar',
    'section': 'Section',
    'article': 'Article',
    'button': 'Button',
    'input': 'Input',
    'img': 'Image',
    'h1': 'Heading 1',
    'h2': 'Heading 2',
    'h3': 'Heading 3',
    'p': 'Paragraph',
    'a': 'Link',
  };
  
  if (semanticTags[tagName]) {
    return semanticTags[tagName];
  }
  
  // Look for semantic class names
  const semanticPatterns = [
    { pattern: /header/i, name: 'Header' },
    { pattern: /footer/i, name: 'Footer' },
    { pattern: /nav|navigation|menu/i, name: 'Navigation' },
    { pattern: /sidebar/i, name: 'Sidebar' },
    { pattern: /modal|dialog/i, name: 'Modal' },
    { pattern: /card/i, name: 'Card' },
    { pattern: /btn|button/i, name: 'Button' },
    { pattern: /input|field/i, name: 'Input' },
    { pattern: /avatar/i, name: 'Avatar' },
    { pattern: /icon/i, name: 'Icon' },
    { pattern: /badge|tag|chip/i, name: 'Badge' },
    { pattern: /title|heading/i, name: 'Title' },
    { pattern: /subtitle|subheading/i, name: 'Subtitle' },
    { pattern: /description|text/i, name: 'Text' },
    { pattern: /container|wrapper/i, name: 'Container' },
    { pattern: /content/i, name: 'Content' },
    { pattern: /list/i, name: 'List' },
    { pattern: /item/i, name: 'Item' },
    { pattern: /row/i, name: 'Row' },
    { pattern: /column|col/i, name: 'Column' },
    { pattern: /grid/i, name: 'Grid' },
    { pattern: /flex/i, name: 'Flex Container' },
    { pattern: /image|img|photo/i, name: 'Image' },
    { pattern: /background|bg/i, name: 'Background' },
  ];
  
  for (const { pattern, name } of semanticPatterns) {
    if (pattern.test(classes)) {
      return name;
    }
  }
  
  // Use text content for text elements (truncated)
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length > 0 && textContent.length < 30) {
    return textContent;
  }
  
  // Fallback to tag name with index
  return tagName.charAt(0).toUpperCase() + tagName.slice(1);
}

// ============================================================================
// STYLE PARSERS - IMPROVED
// ============================================================================

function parseFills(styles: CSSStyleDeclaration): Fill[] | undefined {
  const fills: Fill[] = [];
  
  // Background color
  const bgColor = styles.backgroundColor;
  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
    fills.push({
      type: 'solid',
      color: bgColor,
      opacity: 1,
    });
  }
  
  // Background image/gradient
  const bgImage = styles.backgroundImage;
  if (bgImage && bgImage !== 'none') {
    // Parse linear gradient
    if (bgImage.includes('linear-gradient')) {
      const gradientMatch = bgImage.match(/linear-gradient\(([^)]+)\)/);
      if (gradientMatch) {
        fills.push({
          type: 'gradient',
          color: bgImage, // Store full gradient string
          gradientStops: parseGradientStops(gradientMatch[1]),
        });
      }
    }
    // Parse radial gradient
    else if (bgImage.includes('radial-gradient')) {
      fills.push({
        type: 'gradient',
        color: bgImage,
      });
    }
    // Parse image URL
    else if (bgImage.includes('url(')) {
      // More robust URL extraction that handles various formats
      // url("..."), url('...'), url(...), and URLs with special characters
      let urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      
      // Try alternative pattern for URLs with parentheses or complex chars
      if (!urlMatch) {
        urlMatch = bgImage.match(/url\(([^)]+)\)/);
      }
      
      if (urlMatch) {
        let imageUrl = urlMatch[1].trim();
        
        // Remove quotes if present
        if ((imageUrl.startsWith('"') && imageUrl.endsWith('"')) ||
            (imageUrl.startsWith("'") && imageUrl.endsWith("'"))) {
          imageUrl = imageUrl.slice(1, -1);
        }
        
        // Ensure it's a valid URL (not a gradient or other function)
        if (imageUrl && !imageUrl.includes('gradient') && !imageUrl.includes('linear-')) {
          fills.push({
            type: 'image',
            imageUrl,
            imageScaleMode: parseBackgroundSize(styles.backgroundSize),
          });
        }
      }
    }
  }
  
  return fills.length > 0 ? fills : undefined;
}

function parseGradientStops(gradientContent: string): { color: string; position: number }[] {
  const stops: { color: string; position: number }[] = [];
  
  // Extract color stops from gradient string
  // Format: "direction, color1 position1, color2 position2, ..."
  const parts = gradientContent.split(',').map(s => s.trim());
  
  // Skip the direction part
  const colorParts = parts.slice(1);
  
  colorParts.forEach((part, index) => {
    // Extract color and position
    const colorMatch = part.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]+|[a-z]+)/i);
    const positionMatch = part.match(/(\d+)%/);
    
    if (colorMatch) {
      stops.push({
        color: colorMatch[1],
        position: positionMatch ? parseInt(positionMatch[1]) / 100 : index / Math.max(colorParts.length - 1, 1),
      });
    }
  });
  
  return stops;
}

function parseBackgroundSize(size: string): 'fill' | 'fit' | 'crop' | 'tile' {
  if (size.includes('cover')) return 'fill';
  if (size.includes('contain')) return 'fit';
  if (size.includes('repeat')) return 'tile';
  return 'fill';
}

function parseStrokes(styles: CSSStyleDeclaration): Stroke[] | undefined {
  const strokes: Stroke[] = [];
  
  // Check each border side
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  let hasUniformBorder = true;
  let firstBorder: Stroke | null = null;
  
  for (const side of sides) {
    const width = parseFloat(styles[`border${side}Width` as keyof CSSStyleDeclaration] as string);
    const color = styles[`border${side}Color` as keyof CSSStyleDeclaration] as string;
    const style = styles[`border${side}Style` as keyof CSSStyleDeclaration] as string;
    
    if (width > 0 && color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
      const stroke: Stroke = {
        color,
        width,
        style: (style === 'dashed' || style === 'dotted') ? style : 'solid',
        position: 'inside',
      };
      
      if (!firstBorder) {
        firstBorder = stroke;
      } else if (stroke.width !== firstBorder.width || stroke.color !== firstBorder.color) {
        hasUniformBorder = false;
      }
    }
  }
  
  // Only add stroke if there's a uniform border
  if (firstBorder && hasUniformBorder) {
    strokes.push(firstBorder);
  }
  
  return strokes.length > 0 ? strokes : undefined;
}

function parseShadows(styles: CSSStyleDeclaration): Shadow[] | undefined {
  const boxShadow = styles.boxShadow;
  if (!boxShadow || boxShadow === 'none') return undefined;
  
  const shadows: Shadow[] = [];
  
  // Split multiple shadows (separated by commas, but not inside parentheses)
  const shadowParts = boxShadow.split(/,(?![^(]*\))/);
  
  for (const part of shadowParts) {
    const trimmed = part.trim();
    const isInset = trimmed.includes('inset');
    const cleanPart = trimmed.replace('inset', '').trim();
    
    // Extract color (rgb/rgba/hex/named)
    let color = 'rgba(0, 0, 0, 0.25)';
    const rgbaMatch = cleanPart.match(/rgba?\([^)]+\)/);
    const hexMatch = cleanPart.match(/#[0-9a-fA-F]{3,8}/);
    
    if (rgbaMatch) {
      color = rgbaMatch[0];
    } else if (hexMatch) {
      color = hexMatch[0];
    }
    
    // Extract numeric values (offsetX, offsetY, blur, spread)
    const numbers = cleanPart.match(/-?\d+(\.\d+)?px/g) || [];
    const values = numbers.map(n => parseFloat(n));
    
    if (values.length >= 2) {
      shadows.push({
        type: isInset ? 'inner' : 'drop',
        color,
        offsetX: values[0] || 0,
        offsetY: values[1] || 0,
        blur: values[2] || 0,
        spread: values[3] || 0,
      });
    }
  }
  
  return shadows.length > 0 ? shadows : undefined;
}

function parseBorderRadius(
  styles: CSSStyleDeclaration,
  width?: number,
  height?: number
): number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number } | undefined {
  let topLeft = parseFloat(styles.borderTopLeftRadius) || 0;
  let topRight = parseFloat(styles.borderTopRightRadius) || 0;
  let bottomRight = parseFloat(styles.borderBottomRightRadius) || 0;
  let bottomLeft = parseFloat(styles.borderBottomLeftRadius) || 0;
  
  if (topLeft === 0 && topRight === 0 && bottomRight === 0 && bottomLeft === 0) {
    return undefined;
  }
  
  // Cap extremely large values (like Tailwind's rounded-full: 9999px)
  // A reasonable max is half the element's smallest dimension
  // If we don't have dimensions, cap at a sensible default (24px)
  const maxReasonableRadius = width && height 
    ? Math.min(width, height) / 2 
    : 24;
  
  // Only cap if the value seems unreasonably large (> 100px usually means rounded-full)
  // We want to preserve intentional large radius values while capping 9999px
  if (topLeft > 100) topLeft = Math.min(topLeft, maxReasonableRadius);
  if (topRight > 100) topRight = Math.min(topRight, maxReasonableRadius);
  if (bottomRight > 100) bottomRight = Math.min(bottomRight, maxReasonableRadius);
  if (bottomLeft > 100) bottomLeft = Math.min(bottomLeft, maxReasonableRadius);
  
  // If all corners are the same, return single value
  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
    return Math.round(topLeft);
  }
  
  // Otherwise return object with all corners
  return { 
    topLeft: Math.round(topLeft), 
    topRight: Math.round(topRight), 
    bottomRight: Math.round(bottomRight), 
    bottomLeft: Math.round(bottomLeft) 
  };
}

function parseBlur(styles: CSSStyleDeclaration): number | undefined {
  const filter = styles.filter;
  if (!filter || filter === 'none') return undefined;
  
  const blurMatch = filter.match(/blur\((\d+(?:\.\d+)?)px\)/);
  return blurMatch ? parseFloat(blurMatch[1]) : undefined;
}

function parseBackdropBlur(styles: CSSStyleDeclaration): number | undefined {
  const backdropFilter = styles.backdropFilter || (styles as any).webkitBackdropFilter;
  if (!backdropFilter || backdropFilter === 'none') return undefined;
  
  const blurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)px\)/);
  return blurMatch ? parseFloat(blurMatch[1]) : undefined;
}

// ============================================================================
// LAYOUT PARSER - IMPROVED
// ============================================================================

function parseLayout(styles: CSSStyleDeclaration): LayoutProperties | undefined {
  const display = styles.display;
  
  if (display !== 'flex' && display !== 'inline-flex') {
    return undefined;
  }
  
  const flexDirection = styles.flexDirection;
  const mode: LayoutMode = flexDirection === 'column' || flexDirection === 'column-reverse' 
    ? 'vertical' 
    : 'horizontal';
  
  // Parse padding
  const padding = {
    top: parseFloat(styles.paddingTop) || 0,
    right: parseFloat(styles.paddingRight) || 0,
    bottom: parseFloat(styles.paddingBottom) || 0,
    left: parseFloat(styles.paddingLeft) || 0,
  };
  
  // Parse gap
  const gap = parseFloat(styles.gap) || parseFloat(styles.rowGap) || parseFloat(styles.columnGap) || 0;
  
  // Parse alignment
  const alignItemsMap: Record<string, LayoutAlign> = {
    'flex-start': 'start',
    'start': 'start',
    'flex-end': 'end',
    'end': 'end',
    'center': 'center',
    'stretch': 'stretch',
    'baseline': 'baseline',
  };
  
  const justifyContentMap: Record<string, LayoutJustify> = {
    'flex-start': 'start',
    'start': 'start',
    'flex-end': 'end',
    'end': 'end',
    'center': 'center',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  };
  
  return {
    mode,
    padding,
    gap,
    alignItems: alignItemsMap[styles.alignItems] || 'start',
    justifyContent: justifyContentMap[styles.justifyContent] || 'start',
    wrap: styles.flexWrap === 'wrap' || styles.flexWrap === 'wrap-reverse',
  };
}

// ============================================================================
// SPECIFIC NODE BUILDERS - IMPROVED
// ============================================================================

function buildTextNode(
  element: Element,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps,
  win: Window
): TextNode {
  // Get all text content, including from nested inline elements
  const content = element.textContent?.trim() || '';
  
  const textStyle: TextStyle = {
    fontFamily: styles.fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') || 'Inter',
    fontSize: parseFloat(styles.fontSize) || 16,
    fontWeight: parseFontWeight(styles.fontWeight),
    lineHeight: parseLineHeight(styles.lineHeight, styles.fontSize),
    letterSpacing: parseFloat(styles.letterSpacing) || 0,
    textAlign: parseTextAlign(styles.textAlign),
    textDecoration: parseTextDecoration(styles.textDecorationLine || styles.textDecoration),
    textTransform: parseTextTransform(styles.textTransform),
  };
  
  // Text color from computed color (this is the FILL for text)
  const textColor = styles.color || '#000000';
  const fills: Fill[] = [{
    type: 'solid',
    color: textColor,
    opacity: 1,
  }];
  
  return {
    // Use base props but override fills (text shouldn't have background)
    id: baseProps.id,
    name: baseProps.name,
    visible: baseProps.visible,
    locked: baseProps.locked,
    x: baseProps.x,
    y: baseProps.y,
    width: baseProps.width,
    height: baseProps.height,
    opacity: baseProps.opacity,
    type: 'text',
    content,
    textStyle,
    fills, // Only text color, no background
    // Don't include strokes, shadows, cornerRadius for text
    autoWidth: false,
    autoHeight: true,
  };
}

function parseFontWeight(weight: string): number {
  const numWeight = parseInt(weight);
  if (!isNaN(numWeight)) return numWeight;
  
  const weightMap: Record<string, number> = {
    'normal': 400,
    'bold': 700,
    'lighter': 300,
    'bolder': 700,
  };
  return weightMap[weight] || 400;
}

function parseLineHeight(lineHeight: string, fontSize: string): number {
  if (lineHeight === 'normal') return 1.2;
  
  const lhValue = parseFloat(lineHeight);
  const fsValue = parseFloat(fontSize);
  
  // If line-height is in px, convert to ratio
  if (lineHeight.includes('px') && fsValue > 0) {
    return lhValue / fsValue;
  }
  
  return lhValue || 1.2;
}

function parseTextAlign(align: string): TextStyle['textAlign'] {
  const alignMap: Record<string, TextStyle['textAlign']> = {
    'left': 'left',
    'right': 'right',
    'center': 'center',
    'justify': 'justify',
    'start': 'left',
    'end': 'right',
  };
  return alignMap[align] || 'left';
}

function parseTextDecoration(decoration: string): TextStyle['textDecoration'] {
  if (decoration.includes('underline')) return 'underline';
  if (decoration.includes('line-through')) return 'line-through';
  return 'none';
}

function parseTextTransform(transform: string): TextStyle['textTransform'] {
  const transformMap: Record<string, TextStyle['textTransform']> = {
    'uppercase': 'uppercase',
    'lowercase': 'lowercase',
    'capitalize': 'capitalize',
    'none': 'none',
  };
  return transformMap[transform] || 'none';
}

function buildImageNode(
  element: HTMLImageElement,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps
): ImageNode {
  const objectFit = styles.objectFit;
  
  // Get the image source - prefer the fully resolved src property over getAttribute
  // element.src gives us the absolute URL
  let src = '';
  
  // First try the resolved src property (gives absolute URL)
  if (element.src) {
    src = element.src;
  }
  
  // Fallback to attribute
  if (!src) {
    src = element.getAttribute('src') || '';
  }
  
  // Handle srcset - get the largest image
  const srcset = element.getAttribute('srcset');
  if (srcset && !src) {
    const sources = srcset.split(',').map(s => s.trim());
    if (sources.length > 0) {
      // Get the last (usually largest) source
      const lastSource = sources[sources.length - 1];
      src = lastSource.split(' ')[0];
    }
  }
  
  // Handle lazy loading - check data-src attributes
  if (!src || src.includes('data:image/gif') || src.includes('placeholder')) {
    src = element.getAttribute('data-src') || 
          element.getAttribute('data-lazy-src') ||
          element.getAttribute('data-original') ||
          src;
  }
  
  // Ensure URL is absolute
  if (src && !src.startsWith('http') && !src.startsWith('data:')) {
    try {
      src = new URL(src, element.ownerDocument.baseURI).href;
    } catch {
      // Keep relative if URL parsing fails
    }
  }
  
  return {
    ...baseProps,
    type: 'image',
    src,
    alt: element.alt || element.getAttribute('alt') || '',
    objectFit: objectFit === 'contain' ? 'contain' : objectFit === 'fill' ? 'fill' : 'cover',
  };
}

/**
 * Build a node for SVG elements
 * SVGs are treated as rectangles with their visual appearance
 */
function buildSvgNode(
  element: Element,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps
): RectangleNode {
  // Try to extract primary colors from SVG
  const fills: Fill[] = [];
  const strokes: Stroke[] = [];
  
  // Check for stroke/fill on SVG children
  const circles = element.querySelectorAll('circle');
  const paths = element.querySelectorAll('path');
  const rects = element.querySelectorAll('rect');
  
  // Get stroke color from first circle or path
  const firstShape = circles[0] || paths[0] || rects[0];
  if (firstShape) {
    const win = element.ownerDocument.defaultView;
    if (win) {
      const shapeStyles = win.getComputedStyle(firstShape);
      const strokeColor = shapeStyles.stroke;
      const fillColor = shapeStyles.fill;
      
      if (strokeColor && strokeColor !== 'none' && strokeColor !== 'transparent') {
        strokes.push({
          color: strokeColor,
          width: parseFloat(shapeStyles.strokeWidth) || 2,
          style: 'solid',
          position: 'center',
        });
      }
      
      if (fillColor && fillColor !== 'none' && fillColor !== 'transparent') {
        fills.push({
          type: 'solid',
          color: fillColor,
          opacity: 1,
        });
      }
    }
  }
  
  return {
    ...baseProps,
    type: 'rectangle',
    fills: fills.length > 0 ? fills : baseProps.fills,
    strokes: strokes.length > 0 ? strokes : baseProps.strokes,
    // Use the actual corner radius from styles, not forced circular
    cornerRadius: baseProps.cornerRadius,
  };
}

function buildIconNode(
  element: Element,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps
): IconNode {
  // Get icon attribute (iconify-icon uses "icon" attribute)
  const iconAttr = element.getAttribute('icon') || '';
  
  // Parse icon name and library
  // Format is usually "prefix:icon-name" e.g., "hugeicons:home-01" or "lucide:menu"
  let iconLibrary = 'hugeicons'; // Default to hugeicons since that's what the app uses
  let iconName = iconAttr;
  
  if (iconAttr.includes(':')) {
    const parts = iconAttr.split(':');
    iconLibrary = parts[0];
    iconName = parts.slice(1).join(':');
  }
  
  // Get color from computed styles or element attributes
  let color = styles.color;
  
  // Check for inline style color
  const inlineStyle = element.getAttribute('style') || '';
  const colorMatch = inlineStyle.match(/color:\s*([^;]+)/);
  if (colorMatch) {
    color = colorMatch[1].trim();
  }
  
  // Check for class-based color (e.g., text-[var(--primary)])
  const classAttr = element.getAttribute('class') || '';
  const classColorMatch = classAttr.match(/text-\[([^\]]+)\]/);
  if (classColorMatch && (!color || color === 'rgb(0, 0, 0)')) {
    // This is a CSS variable reference, use computed style
    color = styles.color;
  }
  
  // Get explicit width/height attributes if set
  let width = baseProps.width;
  let height = baseProps.height;
  
  const widthAttr = element.getAttribute('width');
  const heightAttr = element.getAttribute('height');
  
  if (widthAttr && !widthAttr.includes('%')) {
    const parsed = parseInt(widthAttr);
    if (!isNaN(parsed) && parsed > 0) width = parsed;
  }
  if (heightAttr && !heightAttr.includes('%')) {
    const parsed = parseInt(heightAttr);
    if (!isNaN(parsed) && parsed > 0) height = parsed;
  }
  
  // Try to get size from font-size (icons often match text size)
  if ((width < 8 || height < 8) && styles.fontSize) {
    const fontSize = parseFloat(styles.fontSize);
    if (fontSize > 8) {
      width = Math.max(width, fontSize);
      height = Math.max(height, fontSize);
    }
  }
  
  // Ensure minimum size for icons (some might have 0 computed dimensions)
  if (width < 8) width = 24;
  if (height < 8) height = 24;
  
  // Make sure we have a valid color (not empty or just black if it should be different)
  if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
    color = '#666666';
  }
  
  return {
    ...baseProps,
    type: 'icon',
    iconName,
    iconLibrary,
    color,
    width,
    height,
  };
}

function buildInputNode(
  element: HTMLInputElement,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps
): InputNode {
  const inputType = element.type || 'text';
  const validTypes: InputNode['inputType'][] = ['text', 'email', 'password', 'number', 'search'];
  
  return {
    ...baseProps,
    type: 'input',
    inputType: validTypes.includes(inputType as InputNode['inputType']) 
      ? (inputType as InputNode['inputType']) 
      : 'text',
    placeholder: element.placeholder || '',
    value: element.value || '',
    disabled: element.disabled || false,
  };
}

function buildContainerNode(
  element: Element,
  styles: CSSStyleDeclaration,
  baseProps: BaseNodeProps,
  rootOffsetX: number,
  rootOffsetY: number,
  depth: number,
  nodeType: 'frame' | 'button'
): FrameNode | ButtonNode {
  const children: DesignNode[] = [];
  const win = element.ownerDocument.defaultView!;
  
  // Parse all child elements
  const childElements = Array.from(element.children);
  
  for (const child of childElements) {
    const childNode = parseElement(child, element, rootOffsetX, rootOffsetY, depth + 1);
    if (childNode) {
      children.push(childNode);
    }
  }
  
  // Check for direct text content (text not in child elements)
  const directText = getDirectTextContent(element);
  
  if (directText) {
    if (children.length === 0) {
      // Container has only text - add text node as child
      const textRect = element.getBoundingClientRect();
      const textNode = buildTextNode(element, styles, {
        ...baseProps,
        id: generateNodeId(),
        name: directText.slice(0, 20),
        x: baseProps.x,
        y: baseProps.y,
        width: baseProps.width,
        height: baseProps.height,
        // Text node shouldn't inherit container's fills
        fills: undefined,
        strokes: undefined,
        shadows: undefined,
      }, win);
      
      // Don't wrap in frame - just return the frame with text child
      return {
        ...baseProps,
        type: nodeType,
        children: [textNode],
        layout: parseLayout(styles),
        clipContent: styles.overflow === 'hidden' || styles.overflow === 'clip',
      } as FrameNode | ButtonNode;
    } else {
      // Container has both child elements AND direct text
      // Add text node for the direct text content
      const textNode: TextNode = {
        id: generateNodeId(),
        name: directText.slice(0, 20),
        type: 'text',
        visible: true,
        locked: false,
        x: baseProps.x,
        y: baseProps.y,
        width: baseProps.width,
        height: Math.round(parseFloat(styles.fontSize) * 1.5),
        opacity: 1,
        content: directText,
        textStyle: {
          fontFamily: styles.fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') || 'Inter',
          fontSize: parseFloat(styles.fontSize) || 16,
          fontWeight: parseFontWeight(styles.fontWeight),
          lineHeight: parseLineHeight(styles.lineHeight, styles.fontSize),
          letterSpacing: parseFloat(styles.letterSpacing) || 0,
          textAlign: parseTextAlign(styles.textAlign),
          textDecoration: parseTextDecoration(styles.textDecorationLine || styles.textDecoration),
          textTransform: parseTextTransform(styles.textTransform),
        },
        fills: [{ type: 'solid', color: styles.color, opacity: 1 }],
      };
      children.unshift(textNode); // Add text at the beginning
    }
  }
  
  const result = {
    ...baseProps,
    type: nodeType,
    children,
    layout: parseLayout(styles),
    clipContent: styles.overflow === 'hidden' || styles.overflow === 'clip',
  };
  
  if (nodeType === 'button') {
    return {
      ...result,
      variant: 'primary',
      disabled: (element as HTMLButtonElement).disabled || false,
    } as ButtonNode;
  }
  
  return result as FrameNode;
}

function getDirectTextContent(element: Element): string | null {
  let text = '';
  
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ============================================================================
// EXPORT FOR EXTERNAL USE
// ============================================================================

export { parseElement, determineNodeType };
