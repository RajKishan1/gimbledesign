/**
 * Design Tree to SVG Export
 * 
 * Converts a Design Tree to high-fidelity SVG format for visual export.
 * 
 * IMPORTANT LIMITATION - SVG PASTE INTO FIGMA:
 * When pasting SVG into Figma, ALL elements become Groups or basic shapes.
 * This is a fundamental Figma limitation - SVG format cannot create Frames.
 * 
 * For PROPER FRAME HIERARCHY in Figma, use:
 * - Figma Plugin JSON export → Import via XDesign Figma plugin
 * - This creates real FRAME nodes with auto-layout support
 * 
 * SVG export is best for:
 * - Quick visual preview/paste
 * - Sharing designs as images
 * - Web/HTML embedding
 */

import {
  DesignNode,
  DesignTree,
  FrameNode,
  TextNode,
  ImageNode,
  IconNode,
  ButtonNode,
  RectangleNode,
  InputNode,
  Fill,
  Shadow,
  Stroke,
} from '@/types/design-tree';

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export interface SvgExportOptions {
  embedImages?: boolean;
  includeComments?: boolean;
  scale?: number;
}

/**
 * Convert Design Tree to SVG and copy to clipboard
 */
export async function copyDesignTreeAsSvg(
  tree: DesignTree,
  options: SvgExportOptions = {}
): Promise<void> {
  const svg = convertTreeToSvg(tree, options);
  
  try {
    // Try to copy as both text/plain and text/html for better compatibility
    if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      const items = new ClipboardItem({
        'text/plain': new Blob([svg], { type: 'text/plain' }),
        'text/html': new Blob([`<div>${svg}</div>`], { type: 'text/html' }),
      });
      await navigator.clipboard.write([items]);
    } else {
      await navigator.clipboard.writeText(svg);
    }
  } catch (error) {
    console.error('Clipboard write failed:', error);
    await navigator.clipboard.writeText(svg);
  }
}

/**
 * Convert Design Tree to SVG string
 */
export function convertTreeToSvg(
  tree: DesignTree,
  options: SvgExportOptions = {}
): string {
  const { includeComments = false, scale = 1 } = options;
  
  const width = Math.round(tree.width * scale);
  const height = Math.round(tree.height * scale);
  
  // Build defs for gradients, filters, clip paths
  const defs: string[] = [];
  const elements: string[] = [];
  
  // Collect all defs first
  collectDefs(tree.root, defs, scale);
  
  // Render all nodes (root has absolute position 0,0 already)
  renderNodeToSvg(tree.root, elements, 0, 0, scale, options, includeComments);
  
  // Build the final SVG
  const defsContent = defs.length > 0 ? defs.map(d => '    ' + d).join('\n') : '';
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="${width}" 
  height="${height}" 
  viewBox="0 0 ${width} ${height}"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <title>${escapeXml(tree.name)}</title>
  <defs>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&amp;display=swap');
    </style>
${defsContent}
  </defs>
${elements.join('\n')}
</svg>`;

  return svg;
}

// ============================================================================
// DEFS COLLECTION (gradients, filters, clip paths)
// ============================================================================

function collectDefs(node: DesignNode, defs: string[], scale: number): void {
  // Collect shadow filters
  if (node.shadows && node.shadows.length > 0) {
    defs.push(createShadowFilter(node.shadows, node.id));
  }
  
  // Collect gradient and image pattern defs
  if (node.fills) {
    for (let i = 0; i < node.fills.length; i++) {
      const fill = node.fills[i];
      if (fill.type === 'gradient' && fill.gradientStops) {
        defs.push(createGradientDef(fill, node.id));
      }
      if (fill.type === 'image' && fill.imageUrl) {
        defs.push(createImagePatternDef(fill, node, i, scale));
      }
    }
  }
  
  // Collect clip paths for rounded corners
  if (node.cornerRadius && (node.type === 'image' || hasRoundedClip(node))) {
    defs.push(createClipPath(node, scale));
  }
  
  // Recurse into children
  if ('children' in node && node.children) {
    for (const child of node.children) {
      collectDefs(child, defs, scale);
    }
  }
}

function hasRoundedClip(node: DesignNode): boolean {
  return node.type === 'image' && node.cornerRadius !== undefined;
}

function createShadowFilter(shadows: Shadow[], nodeId: string): string {
  const filters: string[] = [];
  
  shadows.forEach((shadow, index) => {
    const color = parseColor(shadow.color);
    
    if (shadow.type === 'drop') {
      filters.push(`
    <feDropShadow 
      dx="${shadow.offsetX}" 
      dy="${shadow.offsetY}" 
      stdDeviation="${shadow.blur / 2}" 
      flood-color="${color.hex}"
      flood-opacity="${color.alpha}"
    />`);
    } else {
      // Inner shadow (more complex)
      filters.push(`
    <feOffset dx="${shadow.offsetX}" dy="${shadow.offsetY}" />
    <feGaussianBlur stdDeviation="${shadow.blur / 2}" />
    <feComposite operator="out" in="SourceGraphic" />`);
    }
  });
  
  return `<filter id="shadow-${sanitizeId(nodeId)}" x="-50%" y="-50%" width="200%" height="200%">${filters.join('')}
  </filter>`;
}

function createGradientDef(fill: Fill, nodeId: string): string {
  if (!fill.gradientStops || fill.gradientStops.length === 0) return '';
  
  const stops = fill.gradientStops.map(stop => {
    const color = parseColor(stop.color);
    return `<stop offset="${Math.round(stop.position * 100)}%" stop-color="${color.hex}" stop-opacity="${color.alpha}"/>`;
  }).join('\n      ');
  
  // Determine gradient angle from the color string
  const angle = parseGradientAngle(fill.color || '');
  const coords = angleToCoords(angle);
  
  return `<linearGradient id="gradient-${sanitizeId(nodeId)}" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
      ${stops}
    </linearGradient>`;
}

function parseGradientAngle(gradientStr: string): number {
  const angleMatch = gradientStr.match(/(\d+)deg/);
  if (angleMatch) return parseInt(angleMatch[1]);
  
  // Direction keywords
  if (gradientStr.includes('to right')) return 90;
  if (gradientStr.includes('to left')) return 270;
  if (gradientStr.includes('to bottom')) return 180;
  if (gradientStr.includes('to top')) return 0;
  if (gradientStr.includes('to bottom right')) return 135;
  if (gradientStr.includes('to bottom left')) return 225;
  if (gradientStr.includes('to top right')) return 45;
  if (gradientStr.includes('to top left')) return 315;
  
  return 180; // Default to top-to-bottom
}

function angleToCoords(angle: number): { x1: string; y1: string; x2: string; y2: string } {
  const rad = (angle - 90) * (Math.PI / 180);
  const x1 = 50 - 50 * Math.cos(rad);
  const y1 = 50 - 50 * Math.sin(rad);
  const x2 = 50 + 50 * Math.cos(rad);
  const y2 = 50 + 50 * Math.sin(rad);
  
  return {
    x1: `${Math.round(x1)}%`,
    y1: `${Math.round(y1)}%`,
    x2: `${Math.round(x2)}%`,
    y2: `${Math.round(y2)}%`,
  };
}

function createClipPath(node: DesignNode, scale: number): string {
  const w = Math.round(node.width * scale);
  const h = Math.round(node.height * scale);
  const r = typeof node.cornerRadius === 'number' 
    ? Math.round(node.cornerRadius * scale)
    : 0;
  
  return `<clipPath id="clip-${sanitizeId(node.id)}">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}"/>
    </clipPath>`;
}

function createImagePatternDef(fill: Fill, node: DesignNode, index: number, scale: number): string {
  if (!fill.imageUrl) return '';
  
  const w = Math.round(node.width * scale);
  const h = Math.round(node.height * scale);
  const patternId = `img-pattern-${sanitizeId(node.id)}-${index}`;
  
  // Ensure URL is absolute
  let imageUrl = fill.imageUrl;
  if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
    // Can't use relative URLs in exported SVG
    return '';
  }
  
  // Determine preserveAspectRatio based on scale mode
  let aspectRatio = 'xMidYMid slice'; // cover
  if (fill.imageScaleMode === 'fit') {
    aspectRatio = 'xMidYMid meet'; // contain
  } else if (fill.imageScaleMode === 'tile') {
    aspectRatio = 'none';
  }
  
  return `<pattern id="${patternId}" patternUnits="objectBoundingBox" width="1" height="1">
      <image href="${escapeXml(imageUrl)}" width="${w}" height="${h}" preserveAspectRatio="${aspectRatio}"/>
    </pattern>`;
}

// ============================================================================
// NODE RENDERERS - IMPROVED
// ============================================================================

/**
 * Render a node to SVG
 * 
 * NOTE: node.x and node.y are ABSOLUTE coordinates (relative to root)
 * We don't add parent offsets - just use them directly with scaling
 */
function renderNodeToSvg(
  node: DesignNode,
  elements: string[],
  _parentX: number,  // Not used - positions are absolute
  _parentY: number,  // Not used - positions are absolute
  scale: number,
  options: SvgExportOptions,
  includeComments: boolean
): void {
  if (node.visible === false) return;
  if (node.opacity === 0) return;
  
  // Use absolute coordinates directly (scaled)
  const x = Math.round(node.x * scale);
  const y = Math.round(node.y * scale);
  const w = Math.round(node.width * scale);
  const h = Math.round(node.height * scale);
  
  if (w <= 0 || h <= 0) return;
  
  // Add comment with node name for debugging
  if (includeComments) {
    elements.push(`  <!-- ${escapeXml(node.name)} (${node.type}) @ ${x},${y} ${w}x${h} -->`);
  }
  
  switch (node.type) {
    case 'frame':
    case 'group':
      renderFrame(node as FrameNode, elements, x, y, w, h, scale, options, includeComments);
      break;
    case 'text':
      renderText(node as TextNode, elements, x, y, w, h, scale);
      break;
    case 'image':
      renderImage(node as ImageNode, elements, x, y, w, h, scale, options);
      break;
    case 'icon':
      renderIcon(node as IconNode, elements, x, y, w, h, scale);
      break;
    case 'button':
      renderFrame(node as unknown as FrameNode, elements, x, y, w, h, scale, options, includeComments);
      break;
    case 'input':
      renderInput(node as InputNode, elements, x, y, w, h, scale);
      break;
    case 'rectangle':
      renderRectangle(node as RectangleNode, elements, x, y, w, h, scale);
      break;
    default:
      renderRectangle(node as RectangleNode, elements, x, y, w, h, scale);
  }
}

function renderFrame(
  node: FrameNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
  options: SvgExportOptions,
  includeComments: boolean
): void {
  // Use the node's actual name without any prefix
  // SVG export creates groups in Figma, not frames - this is a Figma limitation
  const groupId = sanitizeId(node.name || node.id);
  const opacity = node.opacity !== 1 ? ` opacity="${node.opacity}"` : '';
  
  // Start group
  elements.push(`  <g id="${groupId}"${opacity}>`);
  
  // Render background rectangle if has fills or strokes
  const hasFill = node.fills && node.fills.length > 0;
  const hasStroke = node.strokes && node.strokes.length > 0;
  const hasShadow = node.shadows && node.shadows.length > 0;
  
  if (hasFill || hasStroke || hasShadow) {
    const fill = hasFill ? getFillAttr(node.fills!, node.id) : 'none';
    const stroke = hasStroke ? getStrokeAttr(node.strokes!) : '';
    const radius = getRadiusAttr(node.cornerRadius, scale);
    const shadow = hasShadow ? ` filter="url(#shadow-${sanitizeId(node.id)})"` : '';
    
    elements.push(`    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${radius}${stroke}${shadow}/>`);
  }
  
  // Render children (they have their own absolute positions)
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      // Pass 0,0 for parent position since children have absolute coordinates
      renderNodeToSvg(child, elements, 0, 0, scale, options, includeComments);
    }
  }
  
  // End group
  elements.push(`  </g>`);
}

function renderText(
  node: TextNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const { textStyle, content } = node;
  
  if (!content || content.trim().length === 0) return;
  
  // Get text color
  const fill = node.fills && node.fills.length > 0 
    ? getColorValue(node.fills[0]) 
    : '#000000';
  
  const fontSize = Math.round(textStyle.fontSize * scale);
  const fontWeight = textStyle.fontWeight;
  const fontFamily = escapeXml(textStyle.fontFamily);
  const letterSpacing = textStyle.letterSpacing ? textStyle.letterSpacing * scale : 0;
  
  // Calculate line height
  const lineHeight = typeof textStyle.lineHeight === 'number' 
    ? textStyle.lineHeight 
    : 1.2;
  
  // Calculate number of lines for multi-line text
  const lines = content.split('\n');
  const lineCount = lines.length;
  const totalTextHeight = fontSize * lineHeight * lineCount;
  
  // Text anchor based on alignment
  const anchorMap: Record<string, string> = {
    'left': 'start',
    'center': 'middle',
    'right': 'end',
    'justify': 'start',
  };
  const anchor = anchorMap[textStyle.textAlign] || 'start';
  
  // Calculate X position based on horizontal alignment
  let textX = x;
  if (textStyle.textAlign === 'center') {
    textX = x + w / 2;
  } else if (textStyle.textAlign === 'right') {
    textX = x + w;
  }
  
  // Calculate Y position - vertically center text within its bounding box
  // SVG text y coordinate is at the baseline, so we need to account for:
  // 1. Center the text block vertically in the element
  // 2. Add baseline offset (approximately 0.35 of fontSize from bottom of text)
  const baselineOffset = fontSize * 0.35; // Distance from bottom of text to baseline
  const textBlockTop = y + (h - totalTextHeight) / 2; // Top of centered text block
  const textY = textBlockTop + fontSize - baselineOffset; // First line baseline
  
  // Build text attributes
  const attrs: string[] = [
    `x="${textX}"`,
    `y="${textY}"`,
    `fill="${fill}"`,
    `font-family="'${fontFamily}', Inter, -apple-system, sans-serif"`,
    `font-size="${fontSize}"`,
    `font-weight="${fontWeight}"`,
    `text-anchor="${anchor}"`,
  ];
  
  if (letterSpacing !== 0) {
    attrs.push(`letter-spacing="${letterSpacing}"`);
  }
  
  if (textStyle.textDecoration !== 'none') {
    attrs.push(`text-decoration="${textStyle.textDecoration}"`);
  }
  
  if (node.opacity !== 1) {
    attrs.push(`opacity="${node.opacity}"`);
  }
  
  // Handle multi-line text
  const lineHeightPx = fontSize * lineHeight;
  
  if (lineCount === 1) {
    // Single line
    const escapedContent = escapeXml(content);
    elements.push(`    <text ${attrs.join(' ')}>${escapedContent}</text>`);
  } else {
    // Multi-line text using tspans
    elements.push(`    <text ${attrs.join(' ')}>`);
    lines.forEach((line, i) => {
      const lineY = textY + (i * lineHeightPx);
      const escapedLine = escapeXml(line) || ' '; // Use space for empty lines
      if (i === 0) {
        elements.push(`      <tspan>${escapedLine}</tspan>`);
      } else {
        elements.push(`      <tspan x="${textX}" dy="${lineHeightPx}">${escapedLine}</tspan>`);
      }
    });
    elements.push(`    </text>`);
  }
}

function renderImage(
  node: ImageNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
  options: SvgExportOptions = {}
): void {
  const opacity = node.opacity !== 1 ? ` opacity="${node.opacity}"` : '';
  const radius = node.cornerRadius;
  
  // Determine preserveAspectRatio based on objectFit
  const aspectRatioMap: Record<string, string> = {
    'cover': 'xMidYMid slice',
    'contain': 'xMidYMid meet',
    'fill': 'none',
    'none': 'xMidYMid meet',
  };
  const aspectRatio = aspectRatioMap[node.objectFit] || 'xMidYMid slice';
  
  // Get the image source
  let imageSrc = node.src;
  
  // Ensure the URL is properly formatted for SVG
  if (imageSrc && !imageSrc.startsWith('data:')) {
    // Ensure it's an absolute URL
    if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://')) {
      // If it's a relative URL, we can't use it in exported SVG
      imageSrc = '';
    }
  }
  
  const imageId = `image-${sanitizeId(node.id)}`;
  const clipId = `clip-${sanitizeId(node.id)}`;
  
  // Create a group for the image with fallback
  elements.push(`    <g id="${imageId}">`);
  
  // Add a placeholder rectangle as visual fallback
  // This ensures something shows if image fails to load
  const rx = typeof radius === 'number' ? radius * scale : (radius?.topLeft || 0) * scale;
  elements.push(`      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f0f0f0" rx="${rx}"${opacity}/>`);
  
  // Add diagonal lines to indicate it's an image placeholder
  elements.push(`      <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#ddd" stroke-width="1"/>`);
  elements.push(`      <line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#ddd" stroke-width="1"/>`);
  
  if (imageSrc) {
    // Add the actual image
    if (radius && (typeof radius === 'number' ? radius > 0 : true)) {
      // Use clip path for rounded images
      elements.push(`      <g clip-path="url(#${clipId})" transform="translate(${x}, ${y})">`);
      elements.push(`        <image width="${w}" height="${h}" href="${escapeXml(imageSrc)}" preserveAspectRatio="${aspectRatio}"${opacity}>`);
      elements.push(`          <title>${escapeXml(node.alt || 'Image')}</title>`);
      elements.push(`        </image>`);
      elements.push(`      </g>`);
    } else {
      elements.push(`      <image x="${x}" y="${y}" width="${w}" height="${h}" href="${escapeXml(imageSrc)}" preserveAspectRatio="${aspectRatio}"${opacity}>`);
      elements.push(`        <title>${escapeXml(node.alt || 'Image')}</title>`);
      elements.push(`      </image>`);
    }
  }
  
  elements.push(`    </g>`);
}

function renderIcon(
  node: IconNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const opacity = node.opacity !== 1 ? ` opacity="${node.opacity}"` : '';
  
  // Get icon color (URL encoded for the API)
  const color = node.color ? parseColor(node.color).hex : '#666666';
  // Remove the # from hex color for URL encoding
  const colorForUrl = color.startsWith('#') ? color.substring(1) : color;
  
  // Build Iconify SVG API URL
  // Format: https://api.iconify.design/{prefix}/{name}.svg?color=%23{hexcolor}
  let iconUrl = '';
  let prefix = node.iconLibrary || 'hugeicons';
  let name = node.iconName || '';
  
  // Clean up icon name - remove any prefix if it's duplicated
  if (name.includes(':')) {
    const [namePrefix, ...nameParts] = name.split(':');
    prefix = namePrefix;
    name = nameParts.join(':');
  }
  
  // Build the URL with proper color encoding
  // Iconify API uses %23 for # in colors
  iconUrl = `https://api.iconify.design/${prefix}/${name}.svg?color=%23${colorForUrl}`;
  
  // Create a group with the icon image and a fallback colored rectangle
  const groupId = `icon-${sanitizeId(node.id || name)}`;
  
  elements.push(`    <g id="${groupId}"${opacity}>`);
  
  // Add a subtle background rectangle as fallback (in case image doesn't load)
  elements.push(`      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.1" rx="4"/>`);
  
  // Add the icon image from Iconify CDN
  elements.push(`      <image x="${x}" y="${y}" width="${w}" height="${h}" href="${iconUrl}" preserveAspectRatio="xMidYMid meet">`);
  elements.push(`        <title>${prefix}:${name}</title>`);
  elements.push(`      </image>`);
  
  elements.push(`    </g>`);
}

function renderInput(
  node: InputNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  // Render input as a rectangle with text
  const fill = node.fills && node.fills.length > 0 
    ? getFillAttr(node.fills, node.id) 
    : '#ffffff';
  const stroke = node.strokes && node.strokes.length > 0 
    ? getStrokeAttr(node.strokes) 
    : ' stroke="#d1d5db" stroke-width="1"';
  const radius = getRadiusAttr(node.cornerRadius, scale);
  
  elements.push(`    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${radius}${stroke}/>`);
  
  // Add placeholder text
  if (node.placeholder) {
    const fontSize = Math.round(14 * scale);
    const textY = y + h / 2 + fontSize / 3;
    const textX = x + 12 * scale;
    elements.push(`    <text x="${textX}" y="${textY}" fill="#9ca3af" font-family="Inter, sans-serif" font-size="${fontSize}">${escapeXml(node.placeholder)}</text>`);
  }
}

function renderRectangle(
  node: RectangleNode,
  elements: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const fill = node.fills && node.fills.length > 0 
    ? getFillAttr(node.fills, node.id) 
    : 'transparent';
  const stroke = node.strokes && node.strokes.length > 0 
    ? getStrokeAttr(node.strokes) 
    : '';
  const radius = getRadiusAttr(node.cornerRadius, scale);
  const opacity = node.opacity !== 1 ? ` opacity="${node.opacity}"` : '';
  const shadow = node.shadows && node.shadows.length > 0 
    ? ` filter="url(#shadow-${sanitizeId(node.id)})"` 
    : '';
  
  elements.push(`    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${radius}${stroke}${opacity}${shadow}/>`);
}

// ============================================================================
// ATTRIBUTE HELPERS
// ============================================================================

function getFillAttr(fills: Fill[], nodeId: string): string {
  if (!fills || fills.length === 0) return 'transparent';
  
  const fill = fills[0];
  
  switch (fill.type) {
    case 'solid':
      return getColorValue(fill);
    case 'gradient':
      if (fill.gradientStops && fill.gradientStops.length > 0) {
        return `url(#gradient-${sanitizeId(nodeId)})`;
      }
      // Fallback: use first gradient color
      return fill.gradientStops?.[0]?.color || 'transparent';
    case 'image':
      // Return pattern URL for image fills
      if (fill.imageUrl) {
        return `url(#img-pattern-${sanitizeId(nodeId)}-0)`;
      }
      return '#e5e7eb'; // Placeholder gray if no URL
    default:
      return 'transparent';
  }
}

function getColorValue(fill: Fill, nodeId?: string, fillIndex?: number): string {
  // Handle image fills - return pattern reference
  if (fill.type === 'image' && fill.imageUrl && nodeId !== undefined && fillIndex !== undefined) {
    return `url(#img-pattern-${sanitizeId(nodeId)}-${fillIndex})`;
  }
  
  // Handle gradient fills - return gradient reference
  if (fill.type === 'gradient' && fill.gradientStops && nodeId !== undefined) {
    return `url(#gradient-${sanitizeId(nodeId)})`;
  }
  
  if (!fill.color) return 'transparent';
  
  const parsed = parseColor(fill.color);
  
  if (parsed.alpha < 1) {
    return `rgba(${Math.round(parsed.r * 255)}, ${Math.round(parsed.g * 255)}, ${Math.round(parsed.b * 255)}, ${parsed.alpha})`;
  }
  
  return parsed.hex;
}

function getStrokeAttr(strokes: Stroke[]): string {
  if (!strokes || strokes.length === 0) return '';
  
  const stroke = strokes[0];
  const color = parseColor(stroke.color);
  
  let attr = ` stroke="${color.hex}" stroke-width="${stroke.width}"`;
  
  if (color.alpha < 1) {
    attr += ` stroke-opacity="${color.alpha}"`;
  }
  
  if (stroke.style === 'dashed') {
    attr += ` stroke-dasharray="${stroke.width * 3} ${stroke.width * 2}"`;
  } else if (stroke.style === 'dotted') {
    attr += ` stroke-dasharray="${stroke.width} ${stroke.width}"`;
  }
  
  return attr;
}

function getRadiusAttr(
  radius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number } | undefined,
  scale: number
): string {
  if (!radius) return '';
  
  if (typeof radius === 'number') {
    const r = Math.round(radius * scale);
    return r > 0 ? ` rx="${r}" ry="${r}"` : '';
  }
  
  // For non-uniform radius, use the largest value (SVG rect doesn't support individual corners)
  const maxRadius = Math.max(radius.topLeft, radius.topRight, radius.bottomRight, radius.bottomLeft);
  const r = Math.round(maxRadius * scale);
  return r > 0 ? ` rx="${r}" ry="${r}"` : '';
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  alpha: number;
  hex: string;
}

function parseColor(color: string): ParsedColor {
  // Default
  const defaultColor: ParsedColor = { r: 0, g: 0, b: 0, alpha: 1, hex: '#000000' };
  
  if (!color) return defaultColor;
  
  // Handle CSS variables (can't resolve, use black)
  if (color.includes('var(')) {
    // Try to extract fallback value
    const fallbackMatch = color.match(/var\([^,]+,\s*([^)]+)\)/);
    if (fallbackMatch) {
      return parseColor(fallbackMatch[1].trim());
    }
    return defaultColor;
  }
  
  // Handle transparent
  if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return { r: 0, g: 0, b: 0, alpha: 0, hex: 'transparent' };
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    return parseHex(color);
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    return parseRgba(color);
  }
  
  // Handle named colors
  const namedColors: Record<string, string> = {
    'white': '#ffffff',
    'black': '#000000',
    'red': '#ff0000',
    'green': '#00ff00',
    'blue': '#0000ff',
    'gray': '#808080',
    'grey': '#808080',
  };
  
  if (namedColors[color.toLowerCase()]) {
    return parseHex(namedColors[color.toLowerCase()]);
  }
  
  return defaultColor;
}

function parseHex(hex: string): ParsedColor {
  let h = hex.replace('#', '');
  
  // Handle shorthand
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  
  // Handle 8-digit hex (with alpha)
  let alpha = 1;
  if (h.length === 8) {
    alpha = parseInt(h.slice(6, 8), 16) / 255;
    h = h.slice(0, 6);
  }
  
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  
  return {
    r, g, b, alpha,
    hex: `#${h}`,
  };
}

function parseRgba(rgba: string): ParsedColor {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  
  if (!match) {
    return { r: 0, g: 0, b: 0, alpha: 1, hex: '#000000' };
  }
  
  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;
  const alpha = match[4] ? parseFloat(match[4]) : 1;
  
  const hex = '#' + [r, g, b].map(c => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  
  return { r, g, b, alpha, hex };
}

// ============================================================================
// UTILITIES
// ============================================================================

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/--+/g, '-').substring(0, 50);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { convertTreeToSvg };
