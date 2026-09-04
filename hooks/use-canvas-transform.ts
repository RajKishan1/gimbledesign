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

  // The transformed layer element. During gestures we write its style
  // DIRECTLY every frame (cheap GPU composite) and only commit React state
  // on a throttle — re-rendering the whole frame tree (iframes included)
  // at 60fps is what made zoom/pan/scroll feel laggy.
  const transformElRef = useRef<HTMLElement | null>(null);

  /** Attach the element that receives the live transform (the canvas layer). */
  const attachTransformElement = useCallback((el: HTMLElement | null) => {
    transformElRef.current = el;
    if (el) {
      const t = liveRef.current;
      el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
  }, []);

  // rAF handle for the direct DOM write — one pending frame at a time
  const rafRef = useRef<number | null>(null);
  // Throttled React state commit
  const commitTimerRef = useRef<number | null>(null);
  const lastCommitRef = useRef(0);
  const STATE_COMMIT_MS = 90;

  const scheduleFlush = useCallback(() => {
    // 1) Visual update: write the style directly, batched per frame.
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const el = transformElRef.current;
        if (el) {
          const t = liveRef.current;
          el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
        }
      });
    }
    // 2) React state: throttled with a trailing commit so overlays
    //    (toolbars, Rnd scale, connectors) settle right after the gesture.
    if (commitTimerRef.current !== null) return;
    const elapsed = performance.now() - lastCommitRef.current;
    const delay = Math.max(0, STATE_COMMIT_MS - elapsed);
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      lastCommitRef.current = performance.now();
      setTransform({ ...liveRef.current });
    }, delay);
  }, []);

  // Clean up any pending rAF/timer on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (commitTimerRef.current !== null)
        clearTimeout(commitTimerRef.current);
    };
  }, []);

  /**
   * Apply a transform update immediately to the live ref, paint it directly
   * to the DOM on the next frame, and commit React state on a throttle.
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

  // The canvas container — wheel events inside it drive the canvas transform.
  const containerElRef = useRef<HTMLElement | null>(null);

  /**
   * Register the canvas container element. The actual listener lives on
   * `window` (capture, non-passive) so that:
   *   - cursor inside the canvas  → pan/zoom the CANVAS
   *   - ctrl+wheel anywhere else  → swallowed, so the browser never
   *     page-zooms the whole app while the editor is open
   */
  const attachWheelListener = useCallback((el: HTMLElement | null) => {
    containerElRef.current = el;
    return () => {
      if (containerElRef.current === el) containerElRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const container = containerElRef.current;
      if (container && e.target instanceof Node && container.contains(e.target)) {
        handleWheel(e);
      } else if (e.ctrlKey) {
        // Pinch / ctrl+wheel outside the canvas: block browser page zoom.
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () =>
      window.removeEventListener("wheel", onWheel, { capture: true });
  }, [handleWheel]);

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
        const ratio = newScale / prev.scale;
        // Anchor the zoom at the visible center of the canvas container —
        // scaling from the origin makes the content jump toward the corner.
        const rect = containerElRef.current?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        return {
          scale: newScale,
          x: cx - ratio * (cx - prev.x),
          y: cy - ratio * (cy - prev.y),
        };
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

  // Ctrl/Cmd +/-/0 would browser-zoom the whole app — intercept them and
  // drive the canvas zoom instead, matching design-tool conventions.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransform();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomIn, zoomOut, resetTransform]);

  return {
    transform,
    attachWheelListener,
    attachTransformElement,
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
