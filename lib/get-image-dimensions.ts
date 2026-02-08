import sizeOf from "image-size";

const DEFAULT_WIDTH = 393;
const DEFAULT_HEIGHT = 852;
const MAX_DIMENSION = 2000;

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get width and height from an image buffer. Returns defaults if parsing fails.
 * Clamps to MAX_DIMENSION to avoid huge canvases.
 */
export function getImageDimensions(buffer: Buffer): ImageDimensions {
  try {
    const dims = sizeOf(buffer);
    if (dims.width && dims.height) {
      let w = dims.width;
      let h = dims.height;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      return { width: w, height: h };
    }
  } catch {
    // ignore
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

export { DEFAULT_WIDTH, DEFAULT_HEIGHT };
