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
  width = 420,
  minHeight = 800,
  initialPosition = { x: 0, y: 0 },
  frameId,
  scale = 1,
  toolMode,
  theme_style,
  isLoading = false,
  projectId,
  onOpenHtmlDialog,
}: PropsType) => {
  const { selectedFrameId, setSelectedFrameId, updateFrame } = useCanvas();
  const { 
    mode, 
    updateScreenPosition, 
    linkingState, 
    finishLinking,
    cancelLinking,
  } = usePrototype();
  
  const [frameSize, setFrameSize] = useState({
    width,
    height: minHeight,
  });
  const [framePosition, setFramePosition] = useState(initialPosition);
  const [frameRect, setFrameRect] = useState<DOMRect | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingToFigma, setIsCopyingToFigma] = useState(false);

  const regenerateMutation = useRegenerateFrame(projectId);
  const deleteMutation = useDeleteFrame(projectId);

  const rndRef = useRef<Rnd>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isSelected = selectedFrameId === frameId;
  const isPrototypeMode = mode === "prototype";
  const fullHtml = getHTMLWrapper(html, title, theme_style, frameId);

  // Update screen position for connector drawing
  useEffect(() => {
    updateScreenPosition(frameId, {
      x: framePosition.x,
      y: framePosition.y,
      width: frameSize.width,
      height: typeof frameSize.height === 'number' ? frameSize.height : 800,
    });
  }, [frameId, framePosition, frameSize, updateScreenPosition]);

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
  }, [framePosition, frameSize]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "FRAME_HEIGHT" &&
        event.data.frameId === frameId
      ) {
        setFrameSize((prev) => ({
          ...prev,
          height: event.data.height,
        }));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frameId]);

  const handleDownloadPng = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await axios.post(
        "/api/screenshot",
        {
          html: fullHtml,
          width: frameSize.width,
          height: frameSize.height,
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
  }, [frameSize.height, frameSize.width, fullHtml, isDownloading, title]);

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
      // Pass the iframe reference for better conversion
      await copyDesignToFigma(
        iframeRef.current,
        html,
        frameSize.width,
        frameSize.height,
        title
      );

      toast.success("Design copied! Paste in Figma (Ctrl+V or Cmd+V)");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy design to Figma");
    } finally {
      setIsCopyingToFigma(false);
    }
  }, [html, frameSize.width, frameSize.height, title, isCopyingToFigma]);

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
        width,
        height: frameSize.height,
      }}
      minWidth={width}
      minHeight={minHeight}
      size={{
        width: frameSize.width,
        height: frameSize.height,
      }}
      position={framePosition}
      disableDragging={toolMode === TOOL_MODE_ENUM.HAND || isPrototypeMode}
      enableResizing={isSelected && toolMode !== TOOL_MODE_ENUM.HAND && !isPrototypeMode}
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
        setFrameSize({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        });
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
            `relative w-full h-auto
            rounded-[36px] overflow-hidden bg-black
            shadow-2xl
              `,
            isSelected && toolMode !== TOOL_MODE_ENUM.HAND && !isPrototypeMode && "rounded-none",
            isPrototypeMode && "rounded-2xl"
          )}
          onClick={handlePrototypeClick}
        >
          <div className="relative bg-white dark:bg-background overflow-hidden">
            {isLoading ? (
              <DeviceFrameSkeleton
                style={{
                  position: "relative",
                  width,
                  minHeight: minHeight,
                  height: `${frameSize.height}px`,
                }}
              />
            ) : (
              <>
                <iframe
                  ref={iframeRef}
                  srcDoc={fullHtml}
                  title={title}
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: "100%",
                    minHeight: `${minHeight}px`,
                    height: `${frameSize.height}px`,
                    border: "none",
                    pointerEvents: "none",
                    display: "block",
                    background: "transparent",
                  }}
                />
                
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
