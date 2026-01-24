/**
 * Design Tree to HTML Renderer
 * 
 * Converts a Design Tree back into HTML/CSS for display.
 * This enables:
 * 1. Rendering the editable layer tree as actual DOM
 * 2. Previewing changes in real-time
 * 3. Exporting to HTML
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
  LayoutProperties,
} from '@/types/design-tree';

// ============================================================================
// MAIN RENDERER
// ============================================================================

export interface RenderOptions {
  includeDataAttributes?: boolean;  // Add data-node-id for selection
  inlineStyles?: boolean;           // Use inline styles vs class-based
  theme?: Record<string, string>;   // Theme CSS variables
  editable?: boolean;               // Make text editable
}

/**
 * Render a complete Design Tree to HTML string
 */
export function renderDesignTreeToHtml(
  tree: DesignTree,
  options: RenderOptions = {}
): string {
  const { theme = {} } = options;
  
  // Build CSS variables
  const cssVariables = Object.entries(theme)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
  
  const htmlContent = renderNode(tree.root, options);
  
  return `
<div 
  class="design-tree-root" 
  style="
    width: ${tree.width}px;
    min-height: ${tree.height}px;
    position: relative;
    ${cssVariables}
  "
  data-tree-id="${tree.id}"
>
  ${htmlContent}
</div>
  `.trim();
}

/**
 * Render a single node to HTML
 */
export function renderNode(node: DesignNode, options: RenderOptions = {}): string {
  const { includeDataAttributes = true } = options;
  
  // Build common attributes
  const dataAttrs = includeDataAttributes 
    ? `data-node-id="${node.id}" data-node-type="${node.type}" data-node-name="${escapeAttr(node.name)}"` 
    : '';
  
  // Build common styles
  const baseStyles = buildBaseStyles(node);
  
  switch (node.type) {
    case 'frame':
      return renderFrameNode(node, baseStyles, dataAttrs, options);
    case 'group':
      return renderGroupNode(node, baseStyles, dataAttrs, options);
    case 'text':
      return renderTextNode(node, baseStyles, dataAttrs, options);
    case 'image':
      return renderImageNode(node, baseStyles, dataAttrs);
    case 'icon':
      return renderIconNode(node, baseStyles, dataAttrs);
    case 'button':
      return renderButtonNode(node, baseStyles, dataAttrs, options);
    case 'input':
      return renderInputNode(node, baseStyles, dataAttrs);
    case 'rectangle':
      return renderRectangleNode(node, baseStyles, dataAttrs);
    default:
      return `<!-- Unknown node type: ${(node as DesignNode).type} -->`;
  }
}

// ============================================================================
// NODE RENDERERS
// ============================================================================

function renderFrameNode(
  node: FrameNode,
  baseStyles: string,
  dataAttrs: string,
  options: RenderOptions
): string {
  const layoutStyles = node.layout ? buildLayoutStyles(node.layout) : '';
  const clipStyles = node.clipContent ? 'overflow: hidden;' : '';
  
  const childrenHtml = node.children
    .filter(child => child.visible !== false)
    .map(child => renderNode(child, options))
    .join('\n');
  
  return `
<div 
  ${dataAttrs}
  style="${baseStyles} ${layoutStyles} ${clipStyles}"
  class="design-node design-frame"
>
  ${childrenHtml}
</div>
  `.trim();
}

function renderGroupNode(
  node: FrameNode,
  baseStyles: string,
  dataAttrs: string,
  options: RenderOptions
): string {
  const childrenHtml = node.children
    .filter(child => child.visible !== false)
    .map(child => renderNode(child, options))
    .join('\n');
  
  return `
<div 
  ${dataAttrs}
  style="${baseStyles} position: relative;"
  class="design-node design-group"
>
  ${childrenHtml}
</div>
  `.trim();
}

function renderTextNode(
  node: TextNode,
  baseStyles: string,
  dataAttrs: string,
  options: RenderOptions
): string {
  const { editable = false } = options;
  const textStyles = buildTextStyles(node);
  const contentEditable = editable ? 'contenteditable="true"' : '';
  
  return `
<span 
  ${dataAttrs}
  ${contentEditable}
  style="${baseStyles} ${textStyles}"
  class="design-node design-text"
>${escapeHtml(node.content)}</span>
  `.trim();
}

function renderImageNode(
  node: ImageNode,
  baseStyles: string,
  dataAttrs: string
): string {
  return `
<img 
  ${dataAttrs}
  src="${escapeAttr(node.src)}"
  alt="${escapeAttr(node.alt || '')}"
  style="${baseStyles} object-fit: ${node.objectFit};"
  class="design-node design-image"
/>
  `.trim();
}

function renderIconNode(
  node: IconNode,
  baseStyles: string,
  dataAttrs: string
): string {
  const iconName = node.iconLibrary 
    ? `${node.iconLibrary}:${node.iconName}` 
    : node.iconName;
  
  const colorStyle = node.color ? `color: ${node.color};` : '';
  
  return `
<iconify-icon 
  ${dataAttrs}
  icon="${escapeAttr(iconName)}"
  style="${baseStyles} ${colorStyle}"
  class="design-node design-icon"
></iconify-icon>
  `.trim();
}

function renderButtonNode(
  node: ButtonNode,
  baseStyles: string,
  dataAttrs: string,
  options: RenderOptions
): string {
  const layoutStyles = node.layout ? buildLayoutStyles(node.layout) : '';
  const disabledAttr = node.disabled ? 'disabled' : '';
  
  const childrenHtml = node.children
    .filter(child => child.visible !== false)
    .map(child => renderNode(child, options))
    .join('\n');
  
  return `
<button 
  ${dataAttrs}
  ${disabledAttr}
  style="${baseStyles} ${layoutStyles} cursor: pointer;"
  class="design-node design-button"
>
  ${childrenHtml}
</button>
  `.trim();
}

function renderInputNode(
  node: InputNode,
  baseStyles: string,
  dataAttrs: string
): string {
  const disabledAttr = node.disabled ? 'disabled' : '';
  
  return `
<input 
  ${dataAttrs}
  type="${node.inputType}"
  placeholder="${escapeAttr(node.placeholder || '')}"
  value="${escapeAttr(node.value || '')}"
  ${disabledAttr}
  style="${baseStyles}"
  class="design-node design-input"
/>
  `.trim();
}

function renderRectangleNode(
  node: RectangleNode,
  baseStyles: string,
  dataAttrs: string
): string {
  return `
<div 
  ${dataAttrs}
  style="${baseStyles}"
  class="design-node design-rectangle"
></div>
  `.trim();
}

// ============================================================================
// STYLE BUILDERS
// ============================================================================

function buildBaseStyles(node: DesignNode): string {
  const styles: string[] = [];
  
  // Position & Size
  // Use relative positioning for flow layout, absolute for manual positioning
  styles.push(`width: ${node.width}px`);
  styles.push(`height: ${node.height}px`);
  
  // Opacity
  if (node.opacity !== undefined && node.opacity !== 1) {
    styles.push(`opacity: ${node.opacity}`);
  }
  
  // Fills (background)
  if (node.fills && node.fills.length > 0) {
    const backgrounds = node.fills.map(buildFillStyle).filter(Boolean);
    if (backgrounds.length > 0) {
      styles.push(`background: ${backgrounds.join(', ')}`);
    }
  }
  
  // Strokes (border)
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0]; // Use first stroke
    styles.push(`border: ${stroke.width}px ${stroke.style} ${stroke.color}`);
  }
  
  // Shadows
  if (node.shadows && node.shadows.length > 0) {
    const shadowStrings = node.shadows.map(buildShadowStyle);
    styles.push(`box-shadow: ${shadowStrings.join(', ')}`);
  }
  
  // Corner radius
  if (node.cornerRadius !== undefined) {
    if (typeof node.cornerRadius === 'number') {
      styles.push(`border-radius: ${node.cornerRadius}px`);
    } else {
      styles.push(`border-radius: ${node.cornerRadius.topLeft}px ${node.cornerRadius.topRight}px ${node.cornerRadius.bottomRight}px ${node.cornerRadius.bottomLeft}px`);
    }
  }
  
  // Blur effects
  if (node.blur) {
    styles.push(`filter: blur(${node.blur}px)`);
  }
  if (node.backdropBlur) {
    styles.push(`backdrop-filter: blur(${node.backdropBlur}px)`);
  }
  
  // Visibility
  if (node.visible === false) {
    styles.push('display: none');
  }
  
  return styles.join('; ') + ';';
}

function buildFillStyle(fill: Fill): string {
  switch (fill.type) {
    case 'solid':
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      if (opacity === 1) {
        return fill.color || 'transparent';
      }
      // Add opacity to color
      return `${fill.color || 'transparent'}`;
    
    case 'gradient':
      // Return the gradient string as-is if it's already formatted
      return fill.color || 'transparent';
    
    case 'image':
      if (fill.imageUrl) {
        const scaleMode = fill.imageScaleMode || 'cover';
        return `url(${fill.imageUrl}) center/${scaleMode} no-repeat`;
      }
      return '';
    
    default:
      return '';
  }
}

function buildShadowStyle(shadow: Shadow): string {
  const inset = shadow.type === 'inner' ? 'inset ' : '';
  return `${inset}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
}

function buildLayoutStyles(layout: LayoutProperties): string {
  const styles: string[] = [];
  
  // Display mode
  if (layout.mode !== 'none') {
    styles.push('display: flex');
    styles.push(`flex-direction: ${layout.mode === 'vertical' ? 'column' : 'row'}`);
  }
  
  // Padding
  if (layout.padding) {
    const { top, right, bottom, left } = layout.padding;
    styles.push(`padding: ${top}px ${right}px ${bottom}px ${left}px`);
  }
  
  // Gap
  if (layout.gap) {
    styles.push(`gap: ${layout.gap}px`);
  }
  
  // Alignment
  const alignMap: Record<string, string> = {
    'start': 'flex-start',
    'end': 'flex-end',
    'center': 'center',
    'stretch': 'stretch',
    'baseline': 'baseline',
  };
  
  const justifyMap: Record<string, string> = {
    'start': 'flex-start',
    'end': 'flex-end',
    'center': 'center',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  };
  
  if (layout.alignItems) {
    styles.push(`align-items: ${alignMap[layout.alignItems] || layout.alignItems}`);
  }
  
  if (layout.justifyContent) {
    styles.push(`justify-content: ${justifyMap[layout.justifyContent] || layout.justifyContent}`);
  }
  
  // Wrap
  if (layout.wrap) {
    styles.push('flex-wrap: wrap');
  }
  
  return styles.join('; ') + ';';
}

function buildTextStyles(node: TextNode): string {
  const styles: string[] = [];
  const { textStyle } = node;
  
  styles.push(`font-family: ${textStyle.fontFamily}`);
  styles.push(`font-size: ${textStyle.fontSize}px`);
  styles.push(`font-weight: ${textStyle.fontWeight}`);
  
  if (typeof textStyle.lineHeight === 'number') {
    styles.push(`line-height: ${textStyle.lineHeight}`);
  }
  
  if (textStyle.letterSpacing) {
    styles.push(`letter-spacing: ${textStyle.letterSpacing}px`);
  }
  
  styles.push(`text-align: ${textStyle.textAlign}`);
  
  if (textStyle.textDecoration !== 'none') {
    styles.push(`text-decoration: ${textStyle.textDecoration}`);
  }
  
  if (textStyle.textTransform !== 'none') {
    styles.push(`text-transform: ${textStyle.textTransform}`);
  }
  
  // Text color from fills
  if (node.fills && node.fills.length > 0 && node.fills[0].color) {
    styles.push(`color: ${node.fills[0].color}`);
  }
  
  // Auto-sizing
  if (node.autoWidth) {
    styles.push('width: auto');
  }
  if (node.autoHeight) {
    styles.push('height: auto');
  }
  
  return styles.join('; ') + ';';
}

// ============================================================================
// UTILITIES
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { buildBaseStyles, buildLayoutStyles, buildTextStyles };
