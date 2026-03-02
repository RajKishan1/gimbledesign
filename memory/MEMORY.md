# Gimble Design – Project Memory

## Canvas Architecture
- **Custom pan/zoom hook**: `hooks/use-canvas-transform.ts` — replaced `react-zoom-pan-pinch`
  - Two-finger trackpad scroll (no ctrlKey) → PAN
  - Pinch gesture / Ctrl+Wheel (ctrlKey) → ZOOM
  - Uses `requestAnimationFrame` batching for 60fps smoothness
  - `willChange: transform` on content layer for GPU compositing
  - `touchAction: none` on container to suppress browser defaults
- **Canvas entry**: `components/canvas/index.tsx`
- **Canvas controls** (zoom buttons, tool mode): `components/canvas/canvas-controls.tsx`
- **Device frames** (draggable via react-rnd): `components/canvas/device-frame.tsx`
- Tool modes: SELECT (trackpad pan only) | HAND (click+drag pan)

## Key Paths
- Canvas context: `context/canvas-context.tsx`
- Prototype context: `context/prototype-context.tsx`
- Preview page: `app/(routes)/project/[id]/preview/page.tsx`
- Theme alias `@/*` maps to root `./*` (see tsconfig.json)

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- react-rnd for draggable frames
- Hugeicons for icons (`@hugeicons/react`, `@hugeicons/core-free-icons`)
- sonner for toasts
