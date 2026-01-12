"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePrototype } from "@/context/prototype-context";
import { cn } from "@/lib/utils";
import { Link2, Plus, Target } from "lucide-react";
import { INTERACTIVE_ELEMENT_SELECTORS } from "@/constant/canvas";

interface InteractiveElement {
  id: string;
  rect: DOMRect;
  tagName: string;
  text: string;
}

interface PrototypeElementOverlayProps {
  frameId: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  frameRect: DOMRect | null;
  scale: number;
}

const PrototypeElementOverlay: React.FC<PrototypeElementOverlayProps> = ({
  frameId,
  iframeRef,
  frameRect,
  scale,
}) => {
  const {
    mode,
    linkingState,
    startLinking,
    getLinksFromScreen,
  } = usePrototype();

  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Scan iframe for interactive elements
  const scanForInteractiveElements = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsScanning(true);

    // Wait for iframe to be ready
    const checkIframe = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc || !iframeDoc.body) {
          setTimeout(checkIframe, 100);
          return;
        }

        const selector = INTERACTIVE_ELEMENT_SELECTORS.join(", ");
        const elements = iframeDoc.querySelectorAll(selector);
        
        const foundElements: InteractiveElement[] = [];
        
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          
          // Only include visible elements with reasonable size
          if (rect.width > 20 && rect.height > 15 && rect.width < 500) {
            const elementId = el.getAttribute("data-prototype-id") || 
                             el.id || 
                             `element-${frameId}-${index}`;
            
            foundElements.push({
              id: elementId,
              rect: rect,
              tagName: el.tagName.toLowerCase(),
              text: (el.textContent || "").trim().slice(0, 30),
            });
          }
        });

        setInteractiveElements(foundElements);
        setIsScanning(false);
      } catch (error) {
        console.warn("Could not scan iframe:", error);
        setIsScanning(false);
      }
    };

    checkIframe();
  }, [frameId, iframeRef]);

  // Scan when mode changes or iframe loads
  useEffect(() => {
    if (mode !== "prototype") {
      setInteractiveElements([]);
      return;
    }

    // Delay initial scan to allow iframe to load
    const timeoutId = setTimeout(scanForInteractiveElements, 800);
    
    // Rescan periodically for dynamic content
    const intervalId = setInterval(scanForInteractiveElements, 3000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [mode, scanForInteractiveElements]);

  // Handle click to start linking
  const handleElementClick = useCallback(
    (element: InteractiveElement, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!frameRect || !overlayRef.current) return;

      // Get overlay position
      const overlayRect = overlayRef.current.getBoundingClientRect();
      
      // Calculate element position in screen coordinates
      const elementRect = new DOMRect(
        overlayRect.left + element.rect.left,
        overlayRect.top + element.rect.top,
        element.rect.width,
        element.rect.height
      );

      startLinking(frameId, element.id, elementRect);
    },
    [frameId, frameRect, startLinking]
  );

  // Get existing links from this screen
  const existingLinks = getLinksFromScreen(frameId);
  const linkedElementIds = new Set(existingLinks.map((l) => l.fromElementId));

  if (mode !== "prototype") return null;

  const isLinkingFromThis = linkingState.isLinking && linkingState.fromScreenId === frameId;
  const isDropTarget = linkingState.isLinking && linkingState.fromScreenId !== frameId;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20"
      style={{ pointerEvents: isDropTarget ? "auto" : "none" }}
    >
      {/* Render hotspots for each interactive element */}
      {interactiveElements.map((element) => {
        const isHovered = hoveredElementId === element.id;
        const isLinked = linkedElementIds.has(element.id);
        const isActivelyLinking = isLinkingFromThis && linkingState.fromElementId === element.id;

        return (
          <div
            key={element.id}
            className={cn(
              "absolute pointer-events-auto cursor-pointer transition-all duration-200",
              "rounded-lg overflow-hidden",
              isActivelyLinking
                ? "ring-3 ring-indigo-500 bg-indigo-500/30"
                : isLinked
                ? "ring-2 ring-green-500/70 bg-green-500/10"
                : isHovered
                ? "ring-2 ring-indigo-400 bg-indigo-400/20"
                : "ring-1 ring-indigo-300/40 hover:ring-2 hover:ring-indigo-400"
            )}
            style={{
              left: element.rect.left,
              top: element.rect.top,
              width: element.rect.width,
              height: element.rect.height,
            }}
            onClick={(e) => handleElementClick(element, e)}
            onMouseEnter={() => setHoveredElementId(element.id)}
            onMouseLeave={() => setHoveredElementId(null)}
          >
            {/* Status indicator */}
            <div
              className={cn(
                "absolute -right-2 -top-2 w-5 h-5 rounded-full flex items-center justify-center",
                "shadow-md transition-all duration-200",
                isActivelyLinking
                  ? "bg-indigo-600 scale-125"
                  : isLinked
                  ? "bg-green-500"
                  : isHovered
                  ? "bg-indigo-500 scale-110"
                  : "bg-white border border-indigo-300"
              )}
            >
              {isLinked ? (
                <Link2 className="w-2.5 h-2.5 text-white" />
              ) : (
                <Plus className={cn("w-2.5 h-2.5", isHovered || isActivelyLinking ? "text-white" : "text-indigo-500")} />
              )}
            </div>

            {/* Hover tooltip */}
            {isHovered && !linkingState.isLinking && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-50 pointer-events-none">
                <div className="px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap">
                  {isLinked ? "Already linked" : "Click to link"}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Simple drop target overlay when another screen is linking */}
      {isDropTarget && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-dashed border-indigo-400 bg-indigo-400/10 rounded-xl animate-pulse" />
          <div className="relative z-10 flex flex-col items-center gap-2 p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl">
            <Target className="w-8 h-8 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Click to link here
            </span>
          </div>
        </div>
      )}

      {/* Loading indicator while scanning */}
      {isScanning && interactiveElements.length === 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded text-xs text-indigo-600 dark:text-indigo-300">
          Scanning...
        </div>
      )}

      {/* No elements found indicator */}
      {!isScanning && interactiveElements.length === 0 && !isDropTarget && (
        <div className="absolute top-2 left-2 right-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-300 text-center">
          No interactive elements detected
        </div>
      )}
    </div>
  );
};

export default PrototypeElementOverlay;
