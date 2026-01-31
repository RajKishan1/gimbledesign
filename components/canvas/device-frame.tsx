/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import axios from "axios";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/canvas";
import { useCanvas } from "@/context/canvas-context";
import { usePrototype } from "@/context/prototype-context";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { cn } from "@/lib/utils";
import DeviceFrameToolbar from "./device-frame-toolbar";
import PrototypeElementOverlay from "./prototype-element-overlay";
import ElementHoverOverlay from "./element-hover-overlay";
import { toast } from "sonner";
import DeviceFrameSkeleton from "./device-frame-skeleton";
import { useRegenerateFrame, useDeleteFrame } from "@/features/use-frame";
import {
  parseHtmlToDesignTree,
  copyDesignTreeAsSvg,
  collectImageUrlsFromTree,
} from "@/lib/design-tree";

type PropsType = {
  html: string;
  title?: string;
  width?: number;
  minHeight?: number | string;
  initialPosition?: { x: number; y: number };
  frameId: string;
  scale?: number;
  toolMode: ToolModeType;
  theme_style?: string;
  isLoading?: boolean;
  projectId: string;
  onOpenHtmlDialog: () => void;
  /** Override dimensions (e.g. wireframe: web 1440, tablet 768, mobile 430) */
  overrideWidth?: number;
  overrideMinHeight?: number;
};
const DeviceFrame = ({
  html,
  title = "Untitled",
  width = 430, // iPhone 17 Pro Max width
  minHeight = 932, // iPhone 17 Pro Max height
  initialPosition = { x: 0, y: 0 },
  frameId,
  scale = 1,
  toolMode,
  theme_style,
  isLoading = false,
  projectId,
  onOpenHtmlDialog,
  overrideWidth,
  overrideMinHeight,
}: PropsType) => {
  const { selectedFrameId, setSelectedFrameId, updateFrame, deviceType, customDimensions } =
    useCanvas();
  const {
    mode,
    updateScreenPosition,
    linkingState,
    finishLinking,
    cancelLinking,
  } = usePrototype();

  // Device dimensions: per-frame override (wireframe), custom (inspirations), or deviceType
  const getDeviceDimensions = () => {
    if (overrideWidth != null) {
      return {
        width: overrideWidth,
        height: null as number | null,
        minHeight: overrideMinHeight ?? 800,
      };
    }
    if (customDimensions?.width != null && customDimensions?.height != null) {
      return {
        width: customDimensions.width,
        height: customDimensions.height,
        minHeight: customDimensions.height,
      };
    }
    if (deviceType === "web") {
      return { width: 1440, height: null, minHeight: 800 };
    }
    return { width: 430, height: null, minHeight: 932 };
  };
  const {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    minHeight: DEVICE_MIN_HEIGHT,
  } = getDeviceDimensions();
  const isFlexibleHeight = true; // Both web and mobile have flexible height

  const [frameSize, setFrameSize] = useState({
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT || DEVICE_MIN_HEIGHT,
  });

  // Track actual content height for both web and mobile designs
  const [contentHeight, setContentHeight] = useState<number>(DEVICE_MIN_HEIGHT);
  const [framePosition, setFramePosition] = useState(initialPosition);
  const [frameRect, setFrameRect] = useState<DOMRect | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingToFigma, setIsCopyingToFigma] = useState(false);

  const regenerateMutation = useRegenerateFrame(projectId);
  const deleteMutation = useDeleteFrame(projectId);

  const rndRef = useRef<Rnd>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { font } = useCanvas();
  const isSelected = selectedFrameId === frameId;
  const isPrototypeMode = mode === "prototype";
  const fullHtml = getHTMLWrapper(html, title, theme_style, frameId, { font });

  // Update screen position for connector drawing
  useEffect(() => {
    updateScreenPosition(frameId, {
      x: framePosition.x,
      y: framePosition.y,
      width: DEVICE_WIDTH,
      height: contentHeight,
    });
  }, [
    frameId,
    framePosition,
    updateScreenPosition,
    DEVICE_WIDTH,
    contentHeight,
  ]);

  // Listen for iframe content height changes (for both web and mobile designs with flexible height)
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

  // Track frame rect for element overlay
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setFrameRect(containerRef.current.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [framePosition]);

  // Note: Dynamic height updates are now enabled for both mobile and web
  // The height listener is implemented above (lines 101-116) using contentHeight state

  // Calculate the actual height to use (must be defined before callbacks that use it)
  const actualHeight = contentHeight;

  const handleDownloadPng = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // Use actual content height
      const screenshotHeight = contentHeight;

      const response = await axios.post(
        "/api/screenshot",
        {
          html: fullHtml,
          width: DEVICE_WIDTH,
          height: screenshotHeight,
        },
        {
          responseType: "blob",
          validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
        },
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}
      -${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Screenshot downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to screenshot");
    } finally {
      setIsDownloading(false);
    }
  }, [fullHtml, isDownloading, title, contentHeight, DEVICE_WIDTH]);

  const handleRegenerate = useCallback(
    (prompt: string) => {
      regenerateMutation.mutate(
        { frameId, prompt },
        {
          onSuccess: () => {
            updateFrame(frameId, { isLoading: true });
          },
          onError: () => {
            updateFrame(frameId, { isLoading: false });
          },
        },
      );
    },
    [frameId, regenerateMutation, updateFrame],
  );

  const handleDeleteFrame = useCallback(() => {
    deleteMutation.mutate(frameId);
  }, [frameId, deleteMutation]);

  const handleCopyToFigma = useCallback(async () => {
    if (isCopyingToFigma) return;
    setIsCopyingToFigma(true);
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      const body = iframeDoc?.body;
      if (!body) {
        toast.error(
          "Design not ready. Wait for the frame to load, then try again.",
        );
        return;
      }
      const tree = parseHtmlToDesignTree(body, {
        frameId,
        frameName: title,
        frameWidth: DEVICE_WIDTH,
        frameHeight: contentHeight,
      });
      let embeddedImages: Record<string, string> = {};
      const urls = collectImageUrlsFromTree(tree);
      if (urls.length > 0) {
        try {
          const res = await fetch("/api/embed-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.images) embeddedImages = data.images;
          }
        } catch {
          // continue without embedded images
        }
      }
      await copyDesignTreeAsSvg(tree, {
        embeddedImages: Object.keys(embeddedImages).length
          ? embeddedImages
          : undefined,
      });
      toast.success(
        "Design copied as SVG! Paste in Figma (Ctrl+V or Cmd+V) for vector layers—no plugin needed.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy design to Figma");
    } finally {
      setIsCopyingToFigma(false);
    }
  }, [frameId, title, isCopyingToFigma, contentHeight, DEVICE_WIDTH]);

  // Handle click in prototype mode - used for drop target
  const handlePrototypeClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        isPrototypeMode &&
        linkingState.isLinking &&
        linkingState.fromScreenId !== frameId
      ) {
        e.stopPropagation();
        finishLinking(frameId);
      }
    },
    [isPrototypeMode, linkingState, frameId, finishLinking],
  );

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: initialPosition.x,
        y: initialPosition.y,
        width: DEVICE_WIDTH,
        height: actualHeight,
      }}
      minWidth={DEVICE_WIDTH}
      maxWidth={DEVICE_WIDTH}
      minHeight={DEVICE_MIN_HEIGHT}
      size={{
        width: DEVICE_WIDTH,
        height: actualHeight,
      }}
      position={framePosition}
      disableDragging={toolMode === TOOL_MODE_ENUM.HAND || isPrototypeMode}
      enableResizing={false}
      scale={scale}
      onDragStop={(e, d) => {
        setFramePosition({ x: d.x, y: d.y });
      }}
      onClick={(e: any) => {
        e.stopPropagation();

        // Handle prototype mode drop
        if (isPrototypeMode && linkingState.isLinking) {
          if (linkingState.fromScreenId !== frameId) {
            finishLinking(frameId);
          }
          return;
        }

        if (toolMode === TOOL_MODE_ENUM.SELECT && !isPrototypeMode) {
          setSelectedFrameId(frameId);
        }
      }}
      resizeHandleComponent={{
        topLeft: isSelected && !isPrototypeMode ? <Handle /> : undefined,
        topRight: isSelected && !isPrototypeMode ? <Handle /> : undefined,
        bottomLeft: isSelected && !isPrototypeMode ? <Handle /> : undefined,
        bottomRight: isSelected && !isPrototypeMode ? <Handle /> : undefined,
      }}
      resizeHandleStyles={{
        top: { cursor: "ns-resize" },
        bottom: { cursor: "ns-resize" },
        left: { cursor: "ew-resize" },
        right: { cursor: "ew-resize" },
      }}
      onResize={(e, direction, ref) => {
        // Prevent resizing - keep fixed iPhone dimensions
        // setFrameSize({
        //   width: parseInt(ref.style.width),
        //   height: parseInt(ref.style.height),
        // });
      }}
      className={cn(
        "relative z-10",
        isSelected &&
          toolMode !== TOOL_MODE_ENUM.HAND &&
          !isPrototypeMode &&
          "ring-3 ring-blue-400 ring-offset-1",
        isPrototypeMode &&
          linkingState.isLinking &&
          linkingState.fromScreenId !== frameId &&
          "ring-3 ring-indigo-400 ring-offset-2 ring-dashed",
        toolMode === TOOL_MODE_ENUM.HAND
          ? "cursor-grab! active:cursor-grabbing!"
          : isPrototypeMode
            ? "cursor-default"
            : "cursor-move",
      )}
    >
      <div className="w-full h-full" ref={containerRef}>
        {/* Show toolbar only in design mode */}
        {!isPrototypeMode && (
          <DeviceFrameToolbar
            title={title}
            isSelected={isSelected && toolMode !== TOOL_MODE_ENUM.HAND}
            disabled={
              isDownloading ||
              isLoading ||
              regenerateMutation.isPending ||
              deleteMutation.isPending ||
              isCopyingToFigma
            }
            isDownloading={isDownloading}
            isRegenerating={regenerateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isCopyingToFigma={isCopyingToFigma}
            onDownloadPng={handleDownloadPng}
            onRegenerate={handleRegenerate}
            onDeleteFrame={handleDeleteFrame}
            onCopyToFigma={handleCopyToFigma}
            onOpenHtmlDialog={onOpenHtmlDialog}
          />
        )}

        {/* Frame title in prototype mode */}
        {isPrototypeMode && (
          <div className="mb-2 px-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full shadow-sm">
              {title}
            </span>
          </div>
        )}

        <div
          className={cn(
            `relative w-full h-auto overflow-hidden bg-black shadow-2xl`,
            deviceType === "mobile" ? "rounded-[36px]" : "rounded-lg",
            isSelected &&
              toolMode !== TOOL_MODE_ENUM.HAND &&
              !isPrototypeMode &&
              "rounded-none",
            isPrototypeMode &&
              (deviceType === "mobile" ? "rounded-2xl" : "rounded-lg"),
          )}
          onClick={handlePrototypeClick}
        >
          <div
            className={cn(
              "relative bg-white dark:bg-background",
              "overflow-visible",
            )}
          >
            {isLoading ? (
              <DeviceFrameSkeleton
                style={{
                  position: "relative",
                  width: DEVICE_WIDTH,
                  minHeight: DEVICE_MIN_HEIGHT,
                  height: actualHeight,
                }}
              />
            ) : (
              <>
                <iframe
                  key={`${frameId}-${font?.id || "default"}`}
                  ref={iframeRef}
                  srcDoc={fullHtml}
                  title={title}
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: DEVICE_WIDTH,
                    minHeight: DEVICE_MIN_HEIGHT,
                    height: actualHeight,
                    border: "none",
                    // Enable pointer events when selected in design mode for hover detection
                    pointerEvents:
                      isSelected &&
                      !isPrototypeMode &&
                      toolMode === TOOL_MODE_ENUM.SELECT
                        ? "auto"
                        : "none",
                    display: "block",
                    background: "transparent",
                  }}
                />

                {/* Element hover overlay for design mode */}
                {!isPrototypeMode && (
                  <ElementHoverOverlay
                    iframeRef={iframeRef}
                    isActive={isSelected && toolMode === TOOL_MODE_ENUM.SELECT}
                  />
                )}

                {/* Prototype element overlay */}
                {isPrototypeMode && !isLoading && (
                  <PrototypeElementOverlay
                    frameId={frameId}
                    iframeRef={iframeRef}
                    frameRect={frameRect}
                    scale={scale}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
};

const Handle = () => (
  <div
    className="z-30 h-4 w-4
     bg-white border-2 border-blue-500"
  />
);

export default DeviceFrame;
