"use client";

/**
 * Re-export Lucide icons used by the canvas toolbar.
 * Isolating imports here avoids Turbopack HMR invalidating the lucide-react
 * icon modules when canvas-controls.tsx is updated.
 */
export {
  Hand,
  ImagePlus,
  MousePointer2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
