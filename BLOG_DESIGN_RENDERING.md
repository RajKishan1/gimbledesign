# Deep Dive: How XDesign Generates and Renders Designs on Canvas

## Introduction

XDesign is a powerful AI-driven design tool that generates complete UI screens from natural language prompts and renders them on an interactive canvas. This blog post takes a deep technical dive into how the system generates designs and renders them on the canvas, exploring the architecture, data structures, and rendering pipeline.

## Table of Contents

1. [The Design Generation Pipeline](#the-design-generation-pipeline)
2. [Design Tree: The Core Data Structure](#design-tree-the-core-data-structure)
3. [From Design Tree to HTML](#from-design-tree-to-html)
4. [Canvas Rendering Architecture](#canvas-rendering-architecture)
5. [Dynamic Height Management](#dynamic-height-management)
6. [Interactive Features](#interactive-features)
7. [Performance Optimizations](#performance-optimizations)
8. [Conclusion](#conclusion)

---

## The Design Generation Pipeline

### Overview

The design generation process follows a sophisticated multi-stage pipeline that transforms a user's natural language prompt into a fully rendered design on the canvas.

```
User Prompt → Analysis → Screen Planning → Design Tree Generation → Normalization → HTML Rendering → Canvas Display
```

### Stage 1: Analysis and Planning

The first stage uses a fast AI model (Google Gemini 3 Flash) to analyze the user's request and create a structured plan:

**File:** `inngest/functions/generateDesignTree.ts`

```typescript
const analysis = await step.run("analyze-and-plan-design-tree", async () => {
  const { object } = await generateObject({
    model: openrouter.chat(FAST_MODEL),
    schema: DesignTreeAnalysisSchema,
    system: DESIGN_TREE_ANALYSIS_PROMPT,
    prompt: analysisPrompt,
  });
  
  return { ...object, themeToUse };
});
```

The analysis produces:
- **Theme Selection**: Matches the product type to an appropriate theme (e.g., "ocean-breeze" for finance apps, "netflix" for entertainment)
- **Screen Count**: Determines how many screens to generate (1-24 screens)
- **Screen Plans**: Each screen gets an ID, name, purpose, and visual description

### Stage 2: Design Tree Generation

For each screen, a quality AI model (Google Gemini 3 Pro) generates a **Design Tree** - a hierarchical JSON structure representing the entire UI:

```typescript
const result = await generateText({
  model: openrouter.chat(generationModel),
  system: DESIGN_TREE_GENERATION_PROMPT,
  tools: { searchUnsplash: unsplashTool },
  prompt: `Generate a Design Tree JSON for this screen...`,
});
```

The AI generates a complete Design Tree JSON that includes:
- Root frame with dimensions (430x932 for mobile, 1440x800+ for web)
- Nested nodes representing all UI elements
- Styling information (colors, fonts, spacing)
- Layout properties (flexbox, padding, gaps)

### Stage 3: Normalization

The raw AI output is normalized to ensure consistency:

**File:** `inngest/functions/generateDesignTree.ts` (lines 56-160)

```typescript
function normalizeNode(node: any, depth: number = 0): any {
  const normalized: any = {
    id: node.id || generateNodeId(),
    name: node.name || `${node.type}-${depth}`,
    type: node.type,
    visible: node.visible ?? true,
    locked: node.locked ?? false,
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.width ?? 100,
    height: node.height ?? 100,
    opacity: node.opacity ?? 1,
  };
  
  // Type-specific normalization...
  return normalized;
}
```

This ensures every node has:
- Unique IDs
- Required properties with defaults
- Proper type-specific attributes
- Validated structure

---

## Design Tree: The Core Data Structure

### Structure Overview

The Design Tree is a hierarchical JSON structure that represents the entire UI as a tree of nodes:

```typescript
interface DesignTree {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  root: FrameNode;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  themeId?: string;
  themeVariables?: Record<string, string>;
}
```

### Node Types

The system supports multiple node types, each with specific properties:

#### 1. **Frame Node** (Container)
```typescript
interface FrameNode extends BaseNode {
  type: 'frame';
  layout?: LayoutProperties;  // Flexbox layout
  clipContent?: boolean;     // Overflow clipping
  children: DesignNode[];    // Nested nodes
}
```

#### 2. **Text Node**
```typescript
interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  textStyle: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number | string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    // ... more typography properties
  };
  autoWidth?: boolean;
  autoHeight?: boolean;
}
```

#### 3. **Image Node**
```typescript
interface ImageNode extends BaseNode {
  type: 'image';
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
}
```

#### 4. **Icon Node**
```typescript
interface IconNode extends BaseNode {
  type: 'icon';
  iconName: string;
  iconLibrary: string;  // e.g., 'hugeicons', 'lucide'
  color?: string;
}
```

#### 5. **Button Node**
```typescript
interface ButtonNode extends BaseNode {
  type: 'button';
  variant?: string;
  disabled?: boolean;
  layout?: LayoutProperties;
  children: DesignNode[];
}
```

#### 6. **Input Node**
```typescript
interface InputNode extends BaseNode {
  type: 'input';
  inputType: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
}
```

### Base Node Properties

All nodes inherit from `BaseNode`:

```typescript
interface BaseNode {
  id: string;
  name: string;
  type: string;
  x: number;           // Absolute X position
  y: number;           // Absolute Y position
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  
  // Styling
  fills?: Fill[];      // Background colors/gradients/images
  strokes?: Stroke[];  // Borders
  shadows?: Shadow[];  // Box shadows
  cornerRadius?: number | CornerRadius;
  blur?: number;
  backdropBlur?: number;
  clipContent?: boolean;
}
```

### Positioning System

**Critical Insight:** The Design Tree uses **absolute positioning** for all nodes. Each node's `x` and `y` coordinates are relative to the root frame, not the parent. This simplifies rendering but requires careful coordinate calculation during generation.

---

## From Design Tree to HTML

### The Rendering Pipeline

Once a Design Tree is generated and normalized, it must be converted to HTML for display. This happens in `lib/design-tree/tree-to-html.ts`:

**File:** `lib/design-tree/tree-to-html.ts`

```typescript
export function renderDesignTreeToHtml(
  tree: DesignTree,
  options: RenderOptions = {}
): string {
  const { theme = {} } = options;
  
  // Build CSS variables from theme
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
```

### Node Rendering

Each node type has a dedicated renderer function:

#### Frame Rendering
```typescript
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
```

#### Text Rendering
```typescript
function renderTextNode(
  node: TextNode,
  baseStyles: string,
  dataAttrs: string,
  options: RenderOptions
): string {
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
```

### Style Building

The system builds comprehensive inline styles for each node:

**Base Styles:**
```typescript
function buildBaseStyles(node: DesignNode): string {
  const styles: string[] = [];
  
  // Position & Size
  styles.push(`width: ${node.width}px`);
  styles.push(`height: ${node.height}px`);
  
  // Position (absolute, since coordinates are absolute)
  styles.push(`position: absolute`);
  styles.push(`left: ${node.x}px`);
  styles.push(`top: ${node.y}px`);
  
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
    const stroke = node.strokes[0];
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
  
  return styles.join('; ') + ';';
}
```

**Layout Styles (Flexbox):**
```typescript
function buildLayoutStyles(layout: LayoutProperties): string {
  const styles: string[] = [];
  
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
  if (layout.alignItems) {
    styles.push(`align-items: ${alignMap[layout.alignItems] || layout.alignItems}`);
  }
  
  if (layout.justifyContent) {
    styles.push(`justify-content: ${justifyMap[layout.justifyContent] || layout.justifyContent}`);
  }
  
  return styles.join('; ') + ';';
}
```

### HTML Wrapper

The generated HTML is wrapped with theme styles, fonts, and necessary scripts:

**File:** `lib/frame-wrapper.ts`

```typescript
export function getHTMLWrapper(
  html: string,
  title = "Untitled",
  theme_style?: string,
  frameId?: string,
  options?: { previewMode?: boolean; font?: FontOption }
) {
  const finalTheme = theme_style || OCEAN_BREEZE_THEME;
  const selectedFont = options?.font || getFontById(DEFAULT_FONT);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>

  <!-- Google Font -->
  <link href="${selectedFont.googleFontUrl}" rel="stylesheet">
  
  <!-- Tailwind + Iconify -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>

  <style type="text/tailwindcss">
    :root {${BASE_VARIABLES}${finalTheme}}
    /* ... base styles ... */
  </style>
</head>
<body>
  <div id="root">
    <div class="relative">
      ${html}
    </div>
    <script>
      (()=>{
        const fid='${frameId}';
        const send=()=>{
          const r=document.getElementById('root')?.firstElementChild;
          const h=r?.className.match(/h-(screen|full)|min-h-screen/)?
            Math.max(800,innerHeight):
            Math.max(r?.scrollHeight||0,document.body.scrollHeight,800);
          parent.postMessage({type:'FRAME_HEIGHT',frameId:fid,height:h},'*');
        };
        setTimeout(send,100);
        setTimeout(send,500);
      })();
    </script>
  </div>
</body>
</html>`;
}
```

**Key Features:**
- **Theme CSS Variables**: Injected into `:root` for consistent theming
- **Tailwind CSS**: Loaded from CDN for utility classes
- **Iconify**: For icon rendering
- **Height Communication**: Script sends iframe height to parent via `postMessage`

---

## Canvas Rendering Architecture

### Canvas Component Structure

The canvas is built using React with several key components:

**File:** `components/canvas/index.tsx`

```typescript
const Canvas = ({ projectId, isPending, projectName }) => {
  const { theme, frames, selectedFrame, deviceType } = useCanvas();
  const [toolMode, setToolMode] = useState<ToolModeType>(TOOL_MODE_ENUM.SELECT);
  const [zoomPercent, setZoomPercent] = useState<number>(53);
  const [currentScale, setCurrentScale] = useState<number>(0.53);
  
  return (
    <TransformWrapper
      initialScale={0.53}
      minScale={0.1}
      maxScale={3}
      wheel={{ step: 0.1 }}
      pinch={{ step: 0.1 }}
      onTransformed={(ref) => {
        setZoomPercent(Math.round(ref.state.scale * 100));
        setCurrentScale(ref.state.scale);
      }}
    >
      <TransformComponent>
        <div style={{ width: "4000px", height: "3000px" }}>
          {frames?.map((frame, index: number) => {
            const frameSpacing = deviceType === "web" ? 1500 : 480;
            const baseX = 100 + index * frameSpacing;
            const y = 100;

            return (
              <DeviceFrame
                key={frame.id}
                frameId={frame.id}
                projectId={projectId}
                title={frame.title}
                html={frame.htmlContent}
                scale={currentScale}
                initialPosition={{ x: baseX, y }}
                toolMode={toolMode}
                theme_style={theme?.style}
              />
            );
          })}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
};
```

### Key Components

#### 1. **TransformWrapper** (react-zoom-pan-pinch)
- Handles zoom (0.1x to 3x)
- Pan/scroll functionality
- Pinch-to-zoom support
- Smooth transformations

#### 2. **Large Canvas Container**
- Fixed size: 4000px × 3000px
- Provides space for multiple frames
- Frames positioned horizontally with spacing

#### 3. **DeviceFrame Component**

Each frame is rendered as a `DeviceFrame` component:

**File:** `components/canvas/device-frame.tsx`

```typescript
const DeviceFrame = ({
  html,
  title,
  frameId,
  scale,
  initialPosition,
  toolMode,
  theme_style,
}) => {
  const [contentHeight, setContentHeight] = useState<number>(DEVICE_MIN_HEIGHT);
  const [framePosition, setFramePosition] = useState(initialPosition);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const fullHtml = getHTMLWrapper(html, title, theme_style, frameId, { font });
  
  return (
    <Rnd
      default={{ x: initialPosition.x, y: initialPosition.y, width: DEVICE_WIDTH, height: contentHeight }}
      position={framePosition}
      disableDragging={toolMode === TOOL_MODE_ENUM.HAND || isPrototypeMode}
      scale={scale}
      onDragStop={(e, d) => setFramePosition({ x: d.x, y: d.y })}
    >
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          srcDoc={fullHtml}
          title={title}
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: DEVICE_WIDTH,
            height: contentHeight,
            border: "none",
            pointerEvents: isSelected && !isPrototypeMode && toolMode === TOOL_MODE_ENUM.SELECT ? "auto" : "none",
          }}
        />
        
        {/* Element hover overlay */}
        {!isPrototypeMode && (
          <ElementHoverOverlay
            iframeRef={iframeRef}
            isActive={isSelected && toolMode === TOOL_MODE_ENUM.SELECT}
          />
        )}
      </div>
    </Rnd>
  );
};
```

### Device Dimensions

The system supports both mobile and web designs:

```typescript
const getDeviceDimensions = () => {
  if (deviceType === "web") {
    return { width: 1440, height: null, minHeight: 800 };
  }
  return { width: 430, height: null, minHeight: 932 }; // Mobile
};
```

- **Mobile**: 430px width (iPhone 17 Pro Max)
- **Web**: 1440px width
- **Height**: Dynamic (calculated from content)

---

## Dynamic Height Management

### The Challenge

Designs can have variable heights depending on content. The system needs to:
1. Render the iframe with initial height
2. Measure actual content height
3. Update iframe height dynamically
4. Communicate height to parent for proper layout

### Solution: PostMessage Communication

**1. Iframe Script (in HTML wrapper):**
```javascript
const send=()=>{
  const r=document.getElementById('root')?.firstElementChild;
  const h=r?.className.match(/h-(screen|full)|min-h-screen/)?
    Math.max(800,innerHeight):
    Math.max(r?.scrollHeight||0,document.body.scrollHeight,800);
  parent.postMessage({type:'FRAME_HEIGHT',frameId:fid,height:h},'*');
};
setTimeout(send,100);
setTimeout(send,500);
```

**2. Parent Listener (DeviceFrame component):**
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (
      event.data.type === "FRAME_HEIGHT" &&
      event.data.frameId === frameId
    ) {
      const newHeight = Math.max(event.data.height, DEVICE_MIN_HEIGHT);
      setContentHeight(newHeight);
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [frameId, DEVICE_MIN_HEIGHT]);
```

**3. Height Calculation Logic:**
- Checks if root element has full-height classes (`h-screen`, `min-h-screen`)
- If yes: Uses viewport height (minimum 800px)
- If no: Uses `scrollHeight` of content (minimum 800px)
- Sends height via `postMessage` to parent window

**4. Multiple Timeouts:**
- First timeout (100ms): Catches initial render
- Second timeout (500ms): Catches async content (images, fonts)

---

## Interactive Features

### Element Hover Detection

The system can detect which element the user is hovering over, even inside an iframe:

**File:** `components/canvas/element-hover-overlay.tsx`

**How it works:**
1. **Script Injection**: When a frame is selected, a script is injected into the iframe
2. **Event Listeners**: The script adds `mousemove` and `click` listeners to the iframe document
3. **Element Detection**: Uses `document.elementFromPoint()` to find the element under the cursor
4. **Message Passing**: Sends element information to parent via `postMessage`
5. **Overlay Rendering**: Parent renders a highlight overlay on top of the iframe

**Injected Script (simplified):**
```javascript
function handleMouseMove(e) {
  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (element) {
    const rect = element.getBoundingClientRect();
    const info = {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      styles: getComputedStyles(element),
    };
    window.parent.postMessage({
      type: 'ELEMENT_HOVER',
      element: info,
    }, '*');
  }
}
```

**Overlay Component:**
```typescript
const ElementHoverOverlay = ({ iframeRef, isActive }) => {
  const [hoveredElement, setHoveredElement] = useState(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_HOVER') {
        setHoveredElement(event.data.element);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isActive]);
  
  if (!hoveredElement || !iframeRect) return null;
  
  return (
    <div
      className="absolute border-2 border-blue-400 pointer-events-none z-50"
      style={{
        left: hoveredElement.rect.left + iframeRect.left,
        top: hoveredElement.rect.top + iframeRect.top,
        width: hoveredElement.rect.width,
        height: hoveredElement.rect.height,
      }}
    />
  );
};
```

### Prototype Mode

The canvas supports a prototype mode where screens can be linked together:

**File:** `components/canvas/prototype-connectors.tsx`

- Users can draw connections between screens
- Connectors are rendered as SVG paths
- Clicking a connector navigates to the linked screen

### Tool Modes

The canvas supports multiple tool modes:

1. **Select Mode**: Select and inspect elements
2. **Hand Mode**: Pan/scroll the canvas
3. **Prototype Mode**: Link screens together

---

## Performance Optimizations

### 1. Lazy Rendering

Frames are only rendered when visible in the viewport (though the current implementation renders all frames).

### 2. Memoization

React hooks use `useMemo` and `useCallback` to prevent unnecessary re-renders:

```typescript
const fullHtml = useMemo(() => 
  getHTMLWrapper(html, title, theme_style, frameId, { font }),
  [html, title, theme_style, frameId, font]
);
```

### 3. Iframe Isolation

Each frame is rendered in its own iframe with `sandbox="allow-scripts allow-same-origin"`:
- Prevents CSS/JS conflicts between frames
- Isolates theme variables
- Allows independent scrolling

### 4. Scale-Based Rendering

The canvas scale affects rendering:
- At low zoom: Frames may be simplified
- At high zoom: Full detail is shown
- Transform operations are GPU-accelerated

### 5. Debounced Height Updates

Height calculations are debounced to prevent excessive `postMessage` calls:
- Initial: 100ms timeout
- Secondary: 500ms timeout (for async content)

---

## Advanced Features

### Design DNA System

For multi-screen apps, the system maintains "Design DNA" - extracted design patterns from the first few screens:

**File:** `lib/design-context-manager.ts`

```typescript
// After generating first 2-3 screens, extract Design DNA
if (generatedFrames.length >= 2 && generatedFrames.length <= 3) {
  const framesForContext = generatedFrames.map((f: any) => ({
    title: f.title,
    htmlContent: f.htmlContent || renderDesignTreeToHtml(f.designTree, {}),
  }));
  designContext = buildDesignContext(framesForContext, analysis.themeToUse);
}
```

This ensures consistency across all screens:
- Typography scales
- Spacing patterns
- Color usage
- Component styles

### SVG Export

Designs can be exported to SVG for use in other tools:

**File:** `lib/design-tree/tree-to-svg.ts`

- Converts Design Tree to SVG format
- Handles gradients, shadows, images
- Supports Figma import (with limitations)

### Figma Export

Direct export to Figma format:

**File:** `lib/figma-export.ts`

- Converts Design Tree to Figma JSON
- Creates proper Frame hierarchy
- Maintains styling and layout

---

## Conclusion

XDesign's rendering system is a sophisticated architecture that combines:

1. **AI-Powered Generation**: Converts natural language to structured Design Trees
2. **Hierarchical Data Structure**: Design Tree represents UI as a tree of nodes
3. **HTML Rendering**: Converts Design Tree to production-ready HTML
4. **Canvas Display**: Renders multiple frames on an interactive canvas
5. **Dynamic Layout**: Handles variable heights and responsive designs
6. **Interactive Features**: Element inspection, prototype linking, and more

The system's strength lies in its **separation of concerns**:
- **Design Tree**: Platform-agnostic representation
- **HTML Renderer**: Converts to web format
- **SVG/Figma Exporters**: Convert to other formats
- **Canvas**: Provides interactive viewing/editing

This architecture allows for:
- **Extensibility**: Easy to add new node types or export formats
- **Maintainability**: Clear separation between generation, storage, and rendering
- **Performance**: Efficient rendering with iframe isolation
- **Flexibility**: Supports both mobile and web designs

The canvas rendering system demonstrates modern web development best practices:
- React component architecture
- PostMessage for cross-frame communication
- CSS-in-JS for dynamic styling
- GPU-accelerated transforms
- Responsive design principles

As AI design tools evolve, this architecture provides a solid foundation for future enhancements like real-time collaboration, version control, and advanced editing capabilities.

---

## Technical Stack Summary

- **Frontend**: React, TypeScript, Tailwind CSS
- **Canvas Library**: react-zoom-pan-pinch
- **Drag & Drop**: react-rnd
- **AI Models**: Google Gemini 3 (Flash for analysis, Pro for generation)
- **Icons**: Iconify
- **Styling**: CSS Variables + Tailwind
- **Communication**: PostMessage API
- **Rendering**: HTML5 iframes with sandbox

---

*This blog post provides a comprehensive technical overview of XDesign's rendering system. For implementation details, refer to the source code files mentioned throughout the article.*
