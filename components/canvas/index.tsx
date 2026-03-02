import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { LoadingStatusType, useCanvas } from "@/context/canvas-context";
import { usePrototype } from "@/context/prototype-context";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/canvas";
import CanvasControls from "./canvas-controls";
import DeviceFrame from "./device-frame";
import HtmlDialog from "./html-dialog";
import PrototypeConnectors from "./prototype-connectors";
import { toast } from "sonner";
import { useCanvasTransform } from "@/hooks/use-canvas-transform";

const Canvas = ({
  projectId,
  isPending,
  projectName,
}: {
  projectId: string;
  isPending: boolean;
  projectName: string | null;
}) => {
  const {
    theme,
    frames,
    selectedFrame,
    setSelectedFrameId,
    loadingStatus,
    setLoadingStatus,
    deviceType,
    customDimensions,
    wireframeKind,
    updateFrame,
  } = useCanvas();

  // Web wireframe: one responsive frame shown at 3 viewport sizes (same HTML, different container widths)
  const isWireframeWebResponsive =
    deviceType === "wireframe" &&
    wireframeKind === "web" &&
    frames?.length === 1;
  const wireframeWebViewports = [
    { id: "web", title: "Web", width: 1440, minHeight: 300 },
    { id: "tablet", title: "Tablet", width: 768, minHeight: 300 },
    { id: "mobile", title: "Mobile", width: 393, minHeight: 300 },
  ];
  const GAP = 80;
  const wireframeWidths = [1440, 768, 393];
  const wireframeMinHeights = [300, 300, 300];

  const {
    mode,
    linkingState,
    updateLinkingPosition,
    cancelLinking,
    setSelectedLinkId,
  } = usePrototype();

  const [toolMode, setToolMode] = useState<ToolModeType>(TOOL_MODE_ENUM.SELECT);
  const [openHtmlDialog, setOpenHtmlDialog] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasImages, setCanvasImages] = useState<
    { id: string; src: string; x: number; y: number; width: number; height: number }[]
  >([]);

  const canvasRootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const isPrototypeMode = mode === "prototype";

  // ── Custom canvas transform (pan + zoom) ──────────────────────────────
  const {
    transform,
    attachWheelListener,
    startDrag,
    updateDrag,
    endDrag,
    zoomIn,
    zoomOut,
    cssTransform,
    zoomPercent,
  } = useCanvasTransform({
    initialScale: 0.53,
    initialX: 40,
    initialY: 5,
    minScale: 0.05,
    maxScale: 4,
  });

  // Attach the non-passive wheel listener to the container so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cleanup = attachWheelListener(el);
    return cleanup;
  }, [attachWheelListener]);

  // ── Pointer drag pan (HAND mode) ─────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (toolMode !== TOOL_MODE_ENUM.HAND) return;
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      startDrag(e.clientX, e.clientY);
    },
    [toolMode, startDrag]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Prototype linking mouse tracking (uses clientX/Y directly, no transform needed)
      if (linkingState.isLinking) {
        updateLinkingPosition(e.clientX, e.clientY);
      }
      updateDrag(e.clientX, e.clientY);
    },
    [linkingState.isLinking, updateLinkingPosition, updateDrag]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      endDrag();
    },
    [endDrag]
  );

  // ── Canvas click (cancel linking / deselect) ──────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (linkingState.isLinking) {
        cancelLinking();
      }
      setSelectedLinkId(null);
    },
    [linkingState.isLinking, cancelLinking, setSelectedLinkId]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && linkingState.isLinking) {
        cancelLinking();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [linkingState.isLinking, cancelLinking]);

  // ── Image insert ──────────────────────────────────────────────────────
  const handleInsertImageClick = useCallback(() => {
    insertImageInputRef.current?.click();
  }, []);

  const handleInsertImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const maxW = 280;
          const maxH = 200;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxW || h > maxH) {
            const r = Math.min(maxW / w, maxH / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          const id = `canvas-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          setCanvasImages((prev) => [
            ...prev,
            { id, src: dataUrl, x: 150, y: 150, width: w, height: h },
          ]);
          toast.success("Image added to canvas");
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    []
  );

  // ── Thumbnail / screenshot ────────────────────────────────────────────
  const saveThumbnailToProject = useCallback(
    async (projectId: string | null) => {
      try {
        if (!projectId) return null;
        const result = getCanvasHtmlContent();
        if (!result?.html) return null;
        setSelectedFrameId(null);
        setIsSaving(true);
        const response = await axios.post("/api/screenshot", {
          html: result.html,
          width: result.element.scrollWidth,
          height: 700,
          projectId,
        });
        if (response.data) {
          console.log("Thumbnail saved", response.data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsSaving(false);
      }
    },
    [setSelectedFrameId]
  );

  useEffect(() => {
    if (!projectId) return;
    if (loadingStatus === "completed") {
      saveThumbnailToProject(projectId);
    }
  }, [loadingStatus, projectId, saveThumbnailToProject]);

  const onOpenHtmlDialog = () => setOpenHtmlDialog(true);

  function getCanvasHtmlContent() {
    const el = canvasRootRef.current;
    if (!el) {
      toast.error("Canvas element not found");
      return null;
    }
    let styles = "";
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) styles += rule.cssText;
      } catch {}
    }
    return {
      element: el,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0}*{box-sizing:border-box}${styles}</style></head><body>${el.outerHTML}</body></html>`,
    };
  }

  const handleCanvasScreenshot = useCallback(async () => {
    try {
      const result = getCanvasHtmlContent();
      if (!result?.html) {
        toast.error("Failed to get canvas content");
        return null;
      }
      setSelectedFrameId(null);
      setIsScreenshotting(true);
      const response = await axios.post(
        "/api/screenshot",
        { html: result.html, width: result.element.scrollWidth, height: 700 },
        { responseType: "blob", validateStatus: (s) => (s >= 200 && s < 300) || s === 304 }
      );
      const title = projectName || "Canvas";
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Screenshot downloaded");
    } catch (error) {
      console.log(error);
      toast.error("Failed to screenshot canvas");
    } finally {
      setIsScreenshotting(false);
    }
  }, [projectName, setSelectedFrameId]);

  const currentStatus = isSaving
    ? "finalizing"
    : isPending && (loadingStatus === null || loadingStatus === "idle")
    ? "fetching"
    : loadingStatus !== "idle" && loadingStatus !== "completed"
    ? loadingStatus
    : null;

  return (
    <>
      <div className="relative w-full h-full overflow-hidden">
        {currentStatus && <CanvasLoader status={currentStatus} />}

        {/* Canvas container — captures all pointer and wheel events */}
        <div
          ref={containerRef}
          className={cn(
            "absolute inset-0 w-full h-full bg-muted",
            toolMode === TOOL_MODE_ENUM.HAND
              ? "cursor-grab active:cursor-grabbing"
              : linkingState.isLinking
              ? "cursor-crosshair"
              : "cursor-default",
            isPrototypeMode && "bg-accent/30"
          )}
          style={{
            backgroundImage: isPrototypeMode
              ? "radial-gradient(circle, var(--grid-color) 1px, transparent 1px), linear-gradient(135deg, rgba(99, 102, 241, 0.02) 25%, transparent 25%)"
              : "radial-gradient(circle, var(--grid-color) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            // Prevent browser's own pan/zoom so our handler is the sole authority
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleCanvasClick}
        >
          {/* The single transformed layer — GPU-composited via transform */}
          <div
            ref={canvasRootRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "4000px",
              height: "3000px",
              transform: cssTransform,
              transformOrigin: "0 0",
              // Use will-change so the browser promotes this to its own GPU layer
              willChange: "transform",
            }}
          >
            {/* Device Frames */}
            {isWireframeWebResponsive
              ? wireframeWebViewports.map((vp, index) => {
                  const frame = frames[0];
                  const baseX =
                    100 +
                    wireframeWebViewports
                      .slice(0, index)
                      .reduce((acc, w) => acc + w.width + GAP, 0);
                  return (
                    <DeviceFrame
                      key={`${frame.id}-${vp.id}`}
                      frameId={frame.id}
                      projectId={projectId}
                      title={vp.title}
                      html={frame.htmlContent}
                      isLoading={frame.isLoading}
                      scale={transform.scale}
                      initialPosition={{ x: baseX, y: 100 }}
                      toolMode={toolMode}
                      theme_style={theme?.style}
                      onOpenHtmlDialog={onOpenHtmlDialog}
                      overrideWidth={vp.width}
                      overrideMinHeight={vp.minHeight}
                      heightMessageId={`${frame.id}-${vp.id}`}
                    />
                  );
                })
              : (frames ?? []).map((frame, index: number) => {
                  const isWireframe = deviceType === "wireframe";
                  const wireframeIndex =
                    isWireframe &&
                    wireframeKind === "mobile" &&
                    (frames?.length ?? 0) === 1
                      ? 2
                      : index;
                  const frameWidth = isWireframe
                    ? wireframeWidths[wireframeIndex] ?? 393
                    : undefined;
                  const frameMinHeight = isWireframe
                    ? wireframeMinHeights[wireframeIndex] ?? 852
                    : undefined;

                  let baseX: number;
                  if (isWireframe && frameWidth != null) {
                    baseX =
                      100 +
                      wireframeWidths
                        .slice(0, index)
                        .reduce((acc, w) => acc + w + GAP, 0);
                  } else {
                    const frameSpacing = customDimensions?.width
                      ? customDimensions.width + GAP
                      : deviceType === "web"
                      ? 1500
                      : 393 + GAP;
                    baseX = 100 + index * frameSpacing;
                  }

                  return (
                    <DeviceFrame
                      key={frame.id}
                      frameId={frame.id}
                      projectId={projectId}
                      title={frame.title}
                      html={frame.htmlContent}
                      isLoading={frame.isLoading}
                      scale={transform.scale}
                      initialPosition={{ x: baseX, y: 100 }}
                      toolMode={toolMode}
                      theme_style={theme?.style}
                      onOpenHtmlDialog={onOpenHtmlDialog}
                      overrideWidth={frameWidth}
                      overrideMinHeight={frameMinHeight}
                    />
                  );
                })}

            {/* Canvas-level images */}
            {canvasImages.map((img) => (
              <div
                key={img.id}
                className="absolute pointer-events-none"
                style={{ left: img.x, top: img.y, width: img.width, height: img.height }}
              >
                <img
                  src={img.src}
                  alt="Inserted"
                  className="w-full h-full object-contain rounded shadow-md border border-black/10"
                  draggable={false}
                />
              </div>
            ))}

            {/* Prototype connector arrows layer */}
            <PrototypeConnectors canvasScale={transform.scale} />
          </div>
        </div>

        <input
          ref={insertImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-hidden
          onChange={handleInsertImageFile}
        />

        <CanvasControls
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomPercent={zoomPercent}
          toolMode={toolMode}
          setToolMode={setToolMode}
          onInsertImage={handleInsertImageClick}
        />
      </div>

      <HtmlDialog
        html={selectedFrame?.htmlContent || ""}
        title={selectedFrame?.title}
        theme_style={theme?.style}
        open={openHtmlDialog}
        onOpenChange={setOpenHtmlDialog}
      />
    </>
  );
};

function CanvasLoader({
  status,
}: {
  status?: LoadingStatusType | "fetching" | "finalizing";
}) {
  return (
    <div
      className={cn(
        `absolute top-4 left-1/2 -translate-x-1/2 min-w-40
      max-w-full px-4 pt-1.5 pb-2
      rounded-br-xl rounded-bl-xl shadow-md
      flex items-center space-x-2 z-20
    `,
        status === "fetching" && "bg-gray-500 text-white",
        status === "running" && "bg-amber-500 text-white",
        status === "analyzing" && "bg-blue-500 text-white",
        status === "generating" && "bg-purple-500 text-white",
        status === "finalizing" && "bg-purple-500 text-white"
      )}
    >
      <Spinner className="w-4 h-4 stroke-3!" />
      <span className="text-sm font-semibold capitalize">
        {status === "fetching" ? "Loading Project" : status}
      </span>
    </div>
  );
}

export default Canvas;
