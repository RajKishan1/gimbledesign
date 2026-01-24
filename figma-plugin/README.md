# XDesign Figma Plugin

This Figma plugin imports XDesign JSON exports and creates **proper Frame nodes** (not groups) for all layout containers.

## Why This Plugin?

When pasting SVG into Figma, all container elements become Groups. This is a Figma platform limitation. 

This plugin reads the XDesign JSON format and uses the Figma Plugin API to create actual **FRAME** nodes, ensuring:
- Frame icons in the layer panel (not group icons)
- Auto-layout support on all containers
- Proper constraints and resize behavior
- Consistent design semantics

## Installation

### Option 1: Load Locally (for development)

1. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest...**
2. Select the `manifest.json` file from this folder
3. The plugin will appear in your Plugins menu

### Option 2: Build and Publish

1. Install dependencies:
   ```bash
   cd figma-plugin
   npm install --save-dev @figma/plugin-typings typescript
   ```

2. Compile TypeScript:
   ```bash
   npx tsc code.ts --outFile code.js --target ES2017 --lib ES2017 --typeRoots ./node_modules/@figma/plugin-typings
   ```

3. In Figma, import the plugin from manifest

## Usage

1. **In XDesign**: Click "Download Figma JSON" to export your design
2. **Open the JSON file** and copy all contents (Ctrl+A, Ctrl+C)
3. **In Figma**: Run the XDesign Import plugin (Plugins → XDesign Import)
4. **Paste the JSON** and click Import

## What Gets Imported

| XDesign Node | Figma Node |
|--------------|------------|
| frame | FRAME |
| group | FRAME |
| button | FRAME |
| div (container) | FRAME |
| text | TEXT |
| image | RECTANGLE (placeholder) |
| icon | RECTANGLE (placeholder) |
| rectangle | RECTANGLE |
| input | FRAME |

All container elements become proper Frames with:
- Auto-layout (if defined in XDesign)
- Padding and gap
- Alignment settings
- Corner radius
- Fills and strokes
- Shadows and effects

## Troubleshooting

### "Invalid XDesign export format"
Make sure you're using the JSON file from "Download Figma JSON", not the SVG export.

### Font not loading
The plugin tries to load the exact font. If not available, it falls back to Inter.

### Images appear as gray rectangles
Image URLs can't be loaded directly in Figma plugins. They appear as placeholders.

## Technical Details

The plugin reads the `XDESIGN_FIGMA_EXPORT` JSON format which includes:
- Node hierarchy with proper types
- Auto-layout properties
- Style information (fills, strokes, effects)
- Text content and styling
