import { useCallback, useEffect, useRef, useState } from "react";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface UseCanvasTransformOptions {
  initialScale?: number;
  initialX?: number;
  initialY?: number;
  minScale?: number;
  maxScale?: number;
}

/**
 * A high-performance canvas transform hook that handles:
 * - Two-finger trackpad SCROLL → pans the canvas (no ctrlKey)
 * - Pinch gesture / Ctrl+Wheel → zooms the canvas (ctrlKey present)
 * - Click+drag in HAND mode → pans the canvas
 *
 * Uses requestAnimationFrame batching so gestures are always 60fps smooth.
 */
export function useCanvasTransform(opts: UseCanvasTransformOptions = {}) {
  const {
    initialScale = 0.53,
    initialX = 40,
    initialY = 5,
    minScale = 0.05,
    maxScale = 4,
  } = opts;

  // The committed transform (written to state for React re-renders)
  const [transform, setTransform] = useState<CanvasTransform>({
    x: initialX,
    y: initialY,
    scale: initialScale,
  });

  // Live transform ref — mutated every frame without triggering re-renders.
  // We flush it to state after each rAF tick.
  const liveRef = useRef<CanvasTransform>({
    x: initialX,
    y: initialY,
    scale: initialScale,
  });

  // rAF handle — ensures we only have one pending frame at a time
  const rafRef = useRef<number | null>(null);

  // Whether a rAF flush is already scheduled
  const dirtyRef = useRef(false);

  const scheduleFlush = useCallback(() => {
    if (dirtyRef.current) return;
    dirtyRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      dirtyRef.current = false;
      setTransform({ ...liveRef.current });
    });
  }, []);

  // Clean up any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /**
   * Apply a transform update immediately to the live ref, then schedule
   * a single rAF flush so React state is updated once per frame.
   */
  const applyTransform = useCallback(
    (updater: (prev: CanvasTransform) => CanvasTransform) => {
      liveRef.current = updater(liveRef.current);
      scheduleFlush();
    },
    [scheduleFlush]
  );

  /**
   * Handle wheel events on the canvas container.
   *
   * The browser (and OS) tells us the intent via ctrlKey:
   *   ctrlKey = true  → pinch-to-zoom (or Ctrl+scroll)  → ZOOM
   *   ctrlKey = false → two-finger trackpad scroll       → PAN
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // ── ZOOM ──────────────────────────────────────────────────────────
        // deltaY is negative when fingers spread (zoom in), positive when pinch (zoom out).
        // We use a sensitivity tuned for both trackpad pinch and ctrl+scroll.
        const sensitivity = e.deltaMode === 1 ? 0.15 : 0.005;
        const delta = -e.deltaY * sensitivity;

        applyTransform((prev) => {
          const newScale = Math.min(
            maxScale,
            Math.max(minScale, prev.scale * (1 + delta))
          );
          const ratio = newScale / prev.scale;

          // Zoom toward the pointer position
          const pointerX = e.clientX;
          const pointerY = e.clientY;

          return {
            scale: newScale,
            x: pointerX - ratio * (pointerX - prev.x),
            y: pointerY - ratio * (pointerY - prev.y),
          };
        });
      } else {
        // ── PAN ───────────────────────────────────────────────────────────
        // deltaX / deltaY are the raw scroll deltas — just translate.
        // On a trackpad these are already in CSS pixels and feel 1:1.
        // We multiply by a slight factor so it isn't too slow.
        const panSpeed = 1.0;
        applyTransform((prev) => ({
          ...prev,
          x: prev.x - e.deltaX * panSpeed,
          y: prev.y - e.deltaY * panSpeed,
        }));
      }
    },
    [applyTransform, minScale, maxScale]
  );

  /**
   * Attach the wheel listener to a container element.
   * Must use { passive: false } so we can call preventDefault()
   * and stop the browser from doing its own scroll/zoom.
   */
  const attachWheelListener = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    },
    [handleWheel]
  );

  // ── POINTER / DRAG PAN ────────────────────────────────────────────────
  // Used in HAND mode: click-drag pans the canvas.

  const dragStateRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, lastX: 0, lastY: 0 });

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragStateRef.current = { active: true, lastX: clientX, lastY: clientY };
  }, []);

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStateRef.current.active) return;
      const dx = clientX - dragStateRef.current.lastX;
      const dy = clientY - dragStateRef.current.lastY;
      dragStateRef.current.lastX = clientX;
      dragStateRef.current.lastY = clientY;
      applyTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    },
    [applyTransform]
  );

  const endDrag = useCallback(() => {
    dragStateRef.current.active = false;
  }, []);

  // ── PROGRAMMATIC ZOOM (buttons) ────────────────────────────────────────

  const zoomBy = useCallback(
    (factor: number) => {
      applyTransform((prev) => {
        const newScale = Math.min(maxScale, Math.max(minScale, prev.scale * factor));
        return { ...prev, scale: newScale };
      });
    },
    [applyTransform, minScale, maxScale]
  );

  const zoomIn = useCallback(() => zoomBy(1.25), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(0.8), [zoomBy]);

  const setScale = useCallback(
    (scale: number) => {
      applyTransform((prev) => ({
        ...prev,
        scale: Math.min(maxScale, Math.max(minScale, scale)),
      }));
    },
    [applyTransform, minScale, maxScale]
  );

  const resetTransform = useCallback(() => {
    applyTransform(() => ({ x: initialX, y: initialY, scale: initialScale }));
  }, [applyTransform, initialX, initialY, initialScale]);

  return {
    transform,
    attachWheelListener,
    startDrag,
    updateDrag,
    endDrag,
    zoomIn,
    zoomOut,
    setScale,
    resetTransform,
    /** The CSS transform string to apply to the content element */
    cssTransform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    zoomPercent: Math.round(transform.scale * 100),
  };
}
