# Layer-Based Design Architecture

## The Core Insight

> "Sleek is editable because their canvas is built from a layer tree (DOM/layout nodes), not a screenshot. We need the same layer-tree system; then click-to-edit and Figma copy/paste both become possible."

Currently, our AI generates HTML strings that are rendered in iframes. While we have element selection/editing capabilities, we lack a **structured Design Tree** that would enable:

1. ✅ Click-to-select any element → **Already working (ElementHoverOverlay)**
2. ❌ Persistent edits to elements → **Changes don't save back to data**
3. ❌ Export as Figma layers → **Currently exports PNG images only**
4. ❌ Component detection/reuse → **No structured data to analyze**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CURRENT FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   AI Prompt → HTML String → iframe → Display                             │
│                    ↓                                                     │
│            (stored in DB)                                                │
│                                                                          │
│   Problems:                                                              │
│   • No structure - just a string                                         │
│   • Edits in iframe don't persist                                        │
│   • Can only export as image (PNG)                                       │
│   • No layer hierarchy                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ MIGRATION ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                           TARGET FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   AI Prompt → Design Tree (JSON) → HTML Renderer → Display               │
│                    ↓                      ↓                              │
│            (stored in DB)           Selection/Edit                       │
│                    ↓                      ↓                              │
│              Figma Export ←──── Update Tree                              │
│                                                                          │
│   Benefits:                                                              │
│   • Structured layer data                                                │
│   • Edits persist in tree → re-render                                    │
│   • Export as Figma layers (frames/text/shapes)                          │
│   • Component detection possible                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files Created

I've created the foundation for the Design Tree system:

### 1. Type Definitions

**`types/design-tree.ts`**

- Complete type definitions for all node types (Frame, Text, Image, Icon, Button, Input, etc.)
- Style properties (fills, strokes, shadows, corner radius)
- Layout properties (flexbox-compatible auto-layout)
- Utility functions for tree traversal and manipulation

### 2. HTML → Design Tree Parser

**`lib/design-tree/html-to-tree.ts`**

- Parses existing HTML DOM into structured Design Tree
- Extracts computed styles into typed properties
- Detects node types (text, image, icon, button, etc.)
- Builds layout information from flexbox styles

### 3. Design Tree → HTML Renderer

**`lib/design-tree/tree-to-html.ts`**

- Renders Design Tree back to HTML for display
- Adds `data-node-id` attributes for selection
- Supports real-time preview of changes

### 4. Design Tree → Figma Export

**`lib/design-tree/tree-to-figma.ts`**

- Converts Design Tree to Figma clipboard format
- Preserves frames, text, colors, layout
- Enables paste as editable layers in Figma

---

## Implementation Plan (MVP Phases)

### Phase 1: Hybrid Mode (Quick Win)

**Goal:** Enable Figma export from existing HTML content

**Changes:**

1. When user clicks "Copy to Figma":
   - Parse current iframe DOM → Design Tree (using `parseHtmlToDesignTree`)
   - Resolve image URLs to base64 (optional, for embedded images)
   - Convert Design Tree → SVG (using `copyDesignTreeAsSvg`) and copy to clipboard

**Implemented in:**

- `lib/design-tree/tree-to-svg.ts` – SVG export with embedded images, stroke-only icons
- `components/canvas/device-frame.tsx` – `handleCopyToFigma` uses parse → embed images → copyDesignTreeAsSvg

**Flow:** Copy to Figma puts SVG on clipboard; user pastes in Figma (Ctrl+V) for vector layers—no plugin.

---

### Phase 2: Persistent Edits

**Goal:** Save element changes to Design Tree

**Changes:**

1. Store Design Tree alongside HTML in database
2. When user edits element:
   - Update node in Design Tree
   - Re-render tree to HTML
   - Display updated content
3. Save Design Tree to DB on changes

**Database schema change:**

```prisma
model Frame {
  id          String   @id @default(uuid())
  projectId   String
  title       String
  htmlContent String   @db.Text
  designTree  Json?    // NEW: Structured design data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Files to modify:**

- `prisma/schema.prisma` - Add designTree field
- `context/canvas-context.tsx` - Manage Design Tree state
- `components/canvas/element-hover-overlay.tsx` - Save edits to tree
- `inngest/functions/generateScreens.ts` - Generate both HTML and tree

**Estimated effort:** 3-5 days

---

### Phase 3: AI-Native Design Tree Generation

**Goal:** AI generates Design Tree directly (not HTML)

**Changes:**

1. Create new prompt that outputs structured JSON
2. AI generates Design Tree with proper hierarchy
3. Render tree to HTML for display

**New prompt structure:**

```typescript
const DESIGN_TREE_GENERATION_PROMPT = `
Generate a structured design tree for this screen.

Output format (JSON):
{
  "root": {
    "type": "frame",
    "name": "Screen Name",
    "layout": { "mode": "vertical", "gap": 16, "padding": { "top": 48, "right": 24, "bottom": 24, "left": 24 } },
    "children": [
      {
        "type": "frame",
        "name": "Header",
        "layout": { "mode": "horizontal", "justifyContent": "space-between", "alignItems": "center" },
        "children": [
          { "type": "text", "name": "Title", "content": "Dashboard", "textStyle": { "fontSize": 24, "fontWeight": 700 } },
          { "type": "icon", "name": "Menu Icon", "iconName": "hugeicons:menu-01", "width": 24, "height": 24 }
        ]
      },
      {
        "type": "frame",
        "name": "Card",
        "fills": [{ "type": "solid", "color": "var(--card)" }],
        "cornerRadius": 12,
        "children": [...]
      }
    ]
  }
}
`;
```

**Files to create/modify:**

- `lib/prompt-design-tree.ts` - New prompt for tree generation
- `inngest/functions/generateDesignTree.ts` - New generation function
- Schema validation with Zod for AI output

**Estimated effort:** 5-7 days

---

### Phase 4: Component System

**Goal:** Detect and reuse common components

**Features:**

1. Detect repeated patterns (e.g., bottom nav, cards)
2. Create component definitions
3. Export components to Figma
4. Enable component instances in Design Tree

**Component detection algorithm:**

```typescript
function detectComponents(trees: DesignTree[]): ComponentDefinition[] {
  // 1. Extract all frames from all trees
  // 2. Hash structure (ignoring content)
  // 3. Find frames with matching structures
  // 4. Create component definition from pattern
  // 5. Replace instances with component references
}
```

**Estimated effort:** 1-2 weeks

---

## Data Model Reference

### Design Tree Node Structure

```typescript
// Base node (all nodes have these)
interface BaseDesignNode {
  id: string; // Unique identifier
  name: string; // Display name ("Header", "Balance")
  type: DesignNodeType; // 'frame' | 'text' | 'image' | etc.
  visible: boolean;
  locked: boolean;
  x: number; // Position relative to parent
  y: number;
  width: number;
  height: number;
  opacity: number; // 0-1
  fills?: Fill[]; // Background colors/gradients
  strokes?: Stroke[]; // Borders
  shadows?: Shadow[]; // Drop shadows
  cornerRadius?: number; // Border radius
}

// Frame (container with children)
interface FrameNode extends BaseDesignNode {
  type: "frame";
  children: DesignNode[];
  layout?: LayoutProperties; // Flexbox-like auto-layout
  clipContent?: boolean;
}

// Text
interface TextNode extends BaseDesignNode {
  type: "text";
  content: string; // The actual text
  textStyle: TextStyle; // Font, size, weight, etc.
}

// Image
interface ImageNode extends BaseDesignNode {
  type: "image";
  src: string;
  alt?: string;
  objectFit: "cover" | "contain" | "fill";
}

// Icon
interface IconNode extends BaseDesignNode {
  type: "icon";
  iconName: string; // "hugeicons:home-01"
  iconLibrary: string; // "hugeicons"
  color?: string;
}
```

### Complete Design Tree

```typescript
interface DesignTree {
  id: string; // Frame/screen ID
  name: string; // Screen name
  width: number; // Artboard width
  height: number; // Artboard height
  root: FrameNode; // Root frame containing all elements
  themeId?: string; // Theme reference
  themeVariables?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  version: number; // For optimistic updates
}
```

---

## Migration Strategy

### Option A: Gradual Migration (Recommended)

1. **Keep HTML generation working** - Don't break existing flow
2. **Add Design Tree alongside HTML** - Generate both
3. **Parse HTML → Tree for existing frames** - Backward compatible
4. **Gradually switch to tree-first** - When stable

### Option B: Full Migration

1. **Update AI to generate Design Tree JSON**
2. **Render tree to HTML for display**
3. **Migrate existing frames by parsing HTML**

**Recommendation:** Start with Option A to minimize risk.

---

## Testing the Foundation

The files I created can be tested immediately:

```typescript
// Test HTML parsing (in browser console on canvas page)
import { parseHtmlToDesignTree } from '@/lib/design-tree';

const iframe = document.querySelector('iframe');
const tree = parseHtmlToDesignTree(iframe.contentDocument.body, {
  frameId: 'test',
  frameName: 'Test Screen',
  frameWidth: 430,
  frameHeight: 932,
});
console.log(tree);

// Test Figma export (SVG – no plugin)
import { copyDesignTreeAsSvg } from '@/lib/design-tree';
await copyDesignTreeAsSvg(tree, { embeddedImages: {...} });
// Paste in Figma (Ctrl+V)
```

---

## Key Decisions Needed

1. **Database storage:** Store Design Tree as JSON column vs separate table?
2. **AI output format:** Generate tree directly vs HTML + parse?
3. **Component library:** Build custom vs integrate with existing (Radix, etc.)?
4. **Real-time collab:** Need CRDT/OT for concurrent tree edits?

---

## Summary

| What              | Current            | Target             |
| ----------------- | ------------------ | ------------------ |
| Data format       | HTML string        | Design Tree (JSON) |
| Element selection | ✅ Works           | ✅ Works           |
| Edit persistence  | ❌ Lost on refresh | ✅ Saved to tree   |
| Figma export      | PNG image          | Editable layers    |
| Component reuse   | None               | Detected & shared  |

**The foundation is now in place.** The `types/design-tree.ts` and `lib/design-tree/*` files provide:

- Complete type definitions
- HTML → Tree parser
- Tree → HTML renderer
- Tree → Figma exporter

**Next step:** Implement Phase 1 (hybrid mode) to enable Figma layer export from existing HTML content.
