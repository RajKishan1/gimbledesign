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
import { copyDesignToFigma } from "@/lib/figma-export";

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
}: PropsType) => {
  const { selectedFrameId, setSelectedFrameId, updateFrame, deviceType } = useCanvas();
  const { 
    mode, 
    updateScreenPosition, 
    linkingState, 
    finishLinking,
    cancelLinking,
  } = usePrototype();
  
  // Device dimensions based on type
  // For web, height is dynamic (auto), for mobile/creative it's fixed
  const getDeviceDimensions = () => {
    switch (deviceType) {
      case "web":
        return { width: 1440, height: null, minHeight: 800 }; // Height is dynamic for web
      case "creative":
        return { width: 1290, height: 2796, minHeight: 2796 };
      default: // mobile
        return { width: 430, height: 932, minHeight: 932 };
    }
  };
  const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT, minHeight: DEVICE_MIN_HEIGHT } = getDeviceDimensions();
  const isFlexibleHeight = deviceType === "web"; // Web has flexible height
  
  const [frameSize, setFrameSize] = useState({
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT || DEVICE_MIN_HEIGHT,
  });
  
  // Track actual content height for web designs
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
      height: isFlexibleHeight ? contentHeight : (DEVICE_HEIGHT || DEVICE_MIN_HEIGHT),
    });
  }, [frameId, framePosition, updateScreenPosition, DEVICE_WIDTH, DEVICE_HEIGHT, DEVICE_MIN_HEIGHT, isFlexibleHeight, contentHeight]);

  // Listen for iframe content height changes (for web designs with flexible height)
  useEffect(() => {
    if (!isFlexibleHeight) return;
    
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
  }, [frameId, isFlexibleHeight, DEVICE_MIN_HEIGHT]);

  // Track frame rect for element overlay
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setFrameRect(containerRef.current.getBoundingClientRect());
      }
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [framePosition]);

  // Disable dynamic height updates - use fixed iPhone 17 Pro Max dimensions
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (
  //       event.data.type === "FRAME_HEIGHT" &&
  //       event.data.frameId === frameId
  //     ) {
  //       setFrameSize((prev) => ({
  //         ...prev,
  //         height: event.data.height,
  //       }));
  //     }
  //   };
  //   window.addEventListener("message", handleMessage);
  //   return () => window.removeEventListener("message", handleMessage);
  // }, [frameId]);

  // Calculate the actual height to use (must be defined before callbacks that use it)
  const actualHeight = isFlexibleHeight ? contentHeight : (DEVICE_HEIGHT || DEVICE_MIN_HEIGHT);

  const handleDownloadPng = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // For web designs, use actual content height; for others use fixed height
      const screenshotHeight = isFlexibleHeight ? contentHeight : actualHeight;
      
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
        }
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
  }, [fullHtml, isDownloading, title, isFlexibleHeight, contentHeight, actualHeight, DEVICE_WIDTH]);

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
        }
      );
    },
    [frameId, regenerateMutation, updateFrame]
  );

  const handleDeleteFrame = useCallback(() => {
    deleteMutation.mutate(frameId);
  }, [frameId, deleteMutation]);

  const handleCopyToFigma = useCallback(async () => {
    if (isCopyingToFigma) return;
    setIsCopyingToFigma(true);
    try {
      // For web designs, use actual content height; for others use fixed height
      const figmaHeight = isFlexibleHeight ? contentHeight : actualHeight;
      
      // Pass the iframe reference for better conversion
      await copyDesignToFigma(
        iframeRef.current,
        html,
        DEVICE_WIDTH,
        figmaHeight,
        title
      );

      toast.success("Design copied! Paste in Figma (Ctrl+V or Cmd+V)");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy design to Figma");
    } finally {
      setIsCopyingToFigma(false);
    }
  }, [html, title, isCopyingToFigma, isFlexibleHeight, contentHeight, actualHeight, DEVICE_WIDTH]);

  // Handle click in prototype mode - used for drop target
  const handlePrototypeClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPrototypeMode && linkingState.isLinking && linkingState.fromScreenId !== frameId) {
        e.stopPropagation();
        finishLinking(frameId);
      }
    },
    [isPrototypeMode, linkingState, frameId, finishLinking]
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
        isPrototypeMode && linkingState.isLinking && linkingState.fromScreenId !== frameId &&
          "ring-3 ring-indigo-400 ring-offset-2 ring-dashed",
        toolMode === TOOL_MODE_ENUM.HAND
          ? "cursor-grab! active:cursor-grabbing!"
          : isPrototypeMode
          ? "cursor-default"
          : "cursor-move"
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
            deviceType === "mobile" ? "rounded-[36px]" : deviceType === "creative" ? "rounded-xl" : "rounded-lg",
            isSelected && toolMode !== TOOL_MODE_ENUM.HAND && !isPrototypeMode && "rounded-none",
            isPrototypeMode && (deviceType === "mobile" ? "rounded-2xl" : deviceType === "creative" ? "rounded-lg" : "rounded-lg")
          )}
          onClick={handlePrototypeClick}
        >
          <div className={cn(
            "relative bg-white dark:bg-background",
            isFlexibleHeight ? "overflow-visible" : "overflow-hidden"
          )}>
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
                  key={`${frameId}-${font?.id || 'default'}`}
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
                    pointerEvents: isSelected && !isPrototypeMode && toolMode === TOOL_MODE_ENUM.SELECT ? "auto" : "none",
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
