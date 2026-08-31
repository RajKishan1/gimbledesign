import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Rnd } from "react-rnd";
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
    setChatImage,
  } = useCanvas();

  // Hand a canvas image to the chat input as an "@" attachment so it can be
  // used as a generation reference. Converts remote srcs to data URLs.
  const attachImageToChat = useCallback(
    async (src: string) => {
      try {
        let dataUrl = src;
        if (!src.startsWith("data:")) {
          const blob = await (await fetch(src)).blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        }
        setChatImage({ dataUrl, name: "Canvas image" });
        toast.success("Image attached to chat — describe what to design with it");
      } catch {
        toast.error("Failed to attach image to chat");
      }
    },
    [setChatImage],
  );

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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ── Persisted canvas images ────────────────────────────────────────────
  const { data: canvasImages = [] } = useQuery<
    { id: string; src: string; x: number; y: number; width: number; height: number }[]
  >({
    queryKey: ["canvasImages", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/project/${projectId}/canvas-image`);
      return res.data.images ?? [];
    },
    enabled: !!projectId,
  });

  const addImageMutation = useMutation({
    mutationFn: async (img: { src: string; x: number; y: number; width: number; height: number }) => {
      const res = await axios.post(`/api/project/${projectId}/canvas-image`, img);
      return res.data.image;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["canvasImages", projectId] }),
  });

  const updateImageMutation = useMutation({
    mutationFn: async (data: { imageId: string; x?: number; y?: number; width?: number; height?: number }) => {
      const res = await axios.patch(`/api/project/${projectId}/canvas-image`, data);
      return res.data.image;
    },
    // Rnd's position/size props are CONTROLLED by this cache, so it must be
    // updated optimistically — otherwise the next re-render feeds the old
    // coordinates back in and the image snaps back to where it was.
    onMutate: async ({ imageId, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: ["canvasImages", projectId] });
      const previous = queryClient.getQueryData<
        { id: string; src: string; x: number; y: number; width: number; height: number }[]
      >(["canvasImages", projectId]);
      queryClient.setQueryData<
        { id: string; src: string; x: number; y: number; width: number; height: number }[]
      >(["canvasImages", projectId], (old = []) =>
        old.map((img) => (img.id === imageId ? { ...img, ...fields } : img)),
      );
      return { previous };
    },
    // Roll back to the server's last known state if the save fails.
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["canvasImages", projectId], context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["canvasImages", projectId] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await axios.delete(`/api/project/${projectId}/canvas-image`, { data: { imageId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["canvasImages", projectId] }),
  });

  const deleteCanvasImage = useCallback((id: string) => {
    deleteImageMutation.mutate(id);
    setSelectedImageId((curr) => (curr === id ? null : curr));
  }, [deleteImageMutation]);

  const canvasRootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const isPrototypeMode = mode === "prototype";

  // ── Custom canvas transform (pan + zoom) ──────────────────────────────
  const {
    transform,
    attachWheelListener,
    attachTransformElement,
    startDrag,
    updateDrag,
    endDrag,
    zoomIn,
    zoomOut,
    zoomPercent,
  } = useCanvasTransform({
    initialScale: 0.53,
    initialX: 40,
    initialY: 5,
    minScale: 0.05,
    maxScale: 4,
  });

  // Keyboard delete for selected canvas image
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedImageId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteCanvasImage(selectedImageId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedImageId, deleteCanvasImage]);

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
      setSelectedImageId(null);
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
      // Ignore when typing in inputs/textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      )
        return;

      if (e.key === "Escape" && linkingState.isLinking) {
        cancelLinking();
      }

      // Figma-style tool shortcuts
      const key = e.key.toLowerCase();
      if (key === "v") {
        setToolMode(TOOL_MODE_ENUM.SELECT);
      } else if (key === "h") {
        setToolMode(TOOL_MODE_ENUM.HAND);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [linkingState.isLinking, cancelLinking, setToolMode]);

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
          const maxW = 600;
          const maxH = 500;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxW || h > maxH) {
            const r = Math.min(maxW / w, maxH / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          const rect = containerRef.current?.getBoundingClientRect();
          const centerX = rect
            ? (rect.width / 2 - transform.x) / transform.scale - w / 2
            : 150;
          const centerY = rect
            ? (rect.height / 2 - transform.y) / transform.scale - h / 2
            : 150;
          addImageMutation.mutate(
            { src: dataUrl, x: centerX, y: centerY, width: w, height: h },
            { onSuccess: () => toast.success("Image added to canvas") }
          );
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [transform.x, transform.y, transform.scale]
  );

  // Thumbnails are now generated as small AI SVGs at project creation time
  // (see lib/thumbnail-generator.ts), so the canvas no longer has to take a
  // Puppeteer screenshot when generation completes.

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

  const currentStatus =
    isPending && (loadingStatus === null || loadingStatus === "idle")
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
            "canvas-bg absolute inset-0 w-full h-full",
            toolMode === TOOL_MODE_ENUM.HAND
              ? "cursor-grab active:cursor-grabbing"
              : linkingState.isLinking
              ? "cursor-crosshair"
              : "cursor-default",
            isPrototypeMode && "bg-accent/30"
          )}
          style={{
            // Prevent browser's own pan/zoom so our handler is the sole authority
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleCanvasClick}
        >
          {/* The single transformed layer — GPU-composited via transform.
              The transform itself is written directly by the hook (per-frame
              DOM writes during gestures); React must NOT set it here or a
              stale value would be re-applied on every state commit. */}
          <div
            ref={(el) => {
              canvasRootRef.current = el;
              attachTransformElement(el);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "4000px",
              height: "3000px",
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
            {canvasImages.map((img) => {
              const isSelected = selectedImageId === img.id;
              return (
                <Rnd
                  key={img.id}
                  position={{ x: img.x, y: img.y }}
                  size={{ width: img.width, height: img.height }}
                  scale={transform.scale}
                  disableDragging={toolMode === TOOL_MODE_ENUM.HAND || isPrototypeMode}
                  enableResizing={
                    isSelected && toolMode !== TOOL_MODE_ENUM.HAND && !isPrototypeMode
                      ? { bottomRight: true, bottomLeft: true, topRight: true, topLeft: true }
                      : false
                  }
                  lockAspectRatio
                  onDragStart={(e) => {
                    (e as Event).stopPropagation?.();
                    setSelectedImageId(img.id);
                  }}
                  onDragStop={(_e, d) => {
                    updateImageMutation.mutate({ imageId: img.id, x: d.x, y: d.y });
                  }}
                  onResizeStop={(_e, _dir, ref, _delta, position) => {
                    updateImageMutation.mutate({
                      imageId: img.id,
                      width: Math.round(parseFloat(ref.style.width)),
                      height: Math.round(parseFloat(ref.style.height)),
                      x: position.x,
                      y: position.y,
                    });
                  }}
                  className={cn("z-[50]", isSelected && "ring-2 ring-blue-500 rounded")}
                  style={{ cursor: toolMode === TOOL_MODE_ENUM.HAND ? "grab" : "move" }}
                >
                  <div
                    className="relative w-full h-full"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedImageId(img.id);
                    }}
                  >
                    <img
                      src={img.src}
                      alt="Inserted"
                      className="w-full h-full object-contain rounded shadow-md border border-black/10"
                      draggable={false}
                    />
                    {isSelected && (
                      <>
                        <button
                          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCanvasImage(img.id);
                          }}
                          title="Remove image"
                        >
                          &times;
                        </button>
                        <button
                          className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-md z-10 whitespace-nowrap hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            attachImageToChat(img.src);
                          }}
                          title="Attach this image to the chat as a design reference"
                        >
                          @ Add to chat
                        </button>
                      </>
                    )}
                  </div>
                </Rnd>
              );
            })}

            {/* Prototype connector arrows layer */}
            <PrototypeConnectors canvasScale={transform.scale} />
          </div>

          {/* Centered placeholder when the canvas has nothing to show yet —
              a generating card while a job runs, a quiet hint when idle. */}
          {frames.length === 0 && canvasImages.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              {currentStatus ? (
                <div className="generating-gradient flex flex-col items-center gap-3 rounded-2xl px-10 py-8 shadow-lg ring-1 ring-black/5">
                  <span className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-neutral-800 shadow backdrop-blur-sm">
                    <Spinner className="size-4" />
                    {currentStatus === "fetching"
                      ? "Loading your project…"
                      : currentStatus === "analyzing"
                        ? "Planning your screens…"
                        : "Designing your screens…"}
                  </span>
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-neutral-700 backdrop-blur-sm">
                    First screens usually appear within a minute
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    No screens yet
                  </p>
                  <p className="max-w-60 text-xs text-muted-foreground/70">
                    Describe your design in the chat to generate your first
                    screens.
                  </p>
                </div>
              )}
            </div>
          )}
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
  status?: LoadingStatusType | "fetching";
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
        status === "generating" && "bg-purple-500 text-white"
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
