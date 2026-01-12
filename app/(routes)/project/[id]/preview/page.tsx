"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGetProjectById } from "@/features/use-project-id";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { THEME_LIST } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { INTERACTIVE_ELEMENT_SELECTORS } from "@/constant/canvas";
import { PrototypeLink } from "@/context/prototype-context";

// Storage key for prototype links (shared with main editor)
const getLinksStorageKey = (projectId: string) => `prototype-links-${projectId}`;

// Portrait mode dimensions (iPhone-like aspect ratio)
const DEVICE_WIDTH = 320;
const MIN_DEVICE_HEIGHT = 568;

const PreviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigateToRef = useRef<(screenId: string) => void>(() => {});

  const { data: project, isPending } = useGetProjectById(projectId);
  const frames = project?.frames || [];
  const theme = THEME_LIST.find((t) => t.id === project?.theme);

  // Navigation state
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right">("right");
  const [iframeHeight, setIframeHeight] = useState<number>(MIN_DEVICE_HEIGHT);
  const [viewportHeight, setViewportHeight] = useState<number>(800);

  // Load prototype links from localStorage
  const [links, setLinks] = useState<PrototypeLink[]>([]);

  // Debug: Log links when loaded
  useEffect(() => {
    if (!projectId) return;
    
    const stored = localStorage.getItem(getLinksStorageKey(projectId));
    console.log("[Preview] Loading links from storage:", stored);
    if (stored) {
      try {
        const parsedLinks = JSON.parse(stored);
        console.log("[Preview] Parsed links:", parsedLinks);
        setLinks(parsedLinks);
      } catch (e) {
        console.error("Failed to parse stored links:", e);
      }
    }
  }, [projectId]);

  // Set initial screen
  useEffect(() => {
    if (frames.length > 0 && !currentScreenId) {
      const firstScreenId = frames[0].id;
      setCurrentScreenId(firstScreenId);
      setNavigationHistory([firstScreenId]);
      setHistoryIndex(0);
    }
  }, [frames, currentScreenId]);

  // Track viewport height
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  // Get current frame
  const currentFrame = useMemo(() => {
    return frames.find((f) => f.id === currentScreenId);
  }, [frames, currentScreenId]);

  // Navigate to a screen - use ref to avoid stale closure
  const navigateTo = useCallback(
    (screenId: string, direction: "left" | "right" = "right") => {
      console.log("[Preview] Navigating to:", screenId);
      setTransitionDirection(direction);
      setNavigationHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(screenId);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
      setCurrentScreenId(screenId);
    },
    [historyIndex]
  );

  // Keep ref updated
  useEffect(() => {
    navigateToRef.current = (screenId: string) => navigateTo(screenId, "right");
  }, [navigateTo]);

  // Go back in history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setTransitionDirection("left");
      setHistoryIndex(historyIndex - 1);
      setCurrentScreenId(navigationHistory[historyIndex - 1]);
    }
  }, [historyIndex, navigationHistory]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      setTransitionDirection("right");
      setHistoryIndex(historyIndex + 1);
      setCurrentScreenId(navigationHistory[historyIndex + 1]);
    }
  }, [historyIndex, navigationHistory]);


  // Get links for current screen
  const currentScreenLinks = useMemo(() => {
    return links.filter((l) => l.fromScreenId === currentScreenId);
  }, [links, currentScreenId]);

  // Setup iframe interactions when content loads
  const setupIframeInteractions = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !currentScreenId) return;

    console.log("[Preview] Setting up interactions for screen:", currentScreenId);
    console.log("[Preview] Links for this screen:", currentScreenLinks);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) {
        console.log("[Preview] iframe document not ready, retrying...");
        setTimeout(setupIframeInteractions, 100);
        return;
      }

      // Find all interactive elements
      const selector = INTERACTIVE_ELEMENT_SELECTORS.join(", ");
      const elements = iframeDoc.querySelectorAll(selector);
      console.log("[Preview] Found", elements.length, "interactive elements");

      // Create a map of links by element index (extracted from element ID)
      const linksByIndex = new Map<number, PrototypeLink>();
      currentScreenLinks.forEach((link) => {
        const match = link.fromElementId.match(/element-.*-(\d+)$/);
        if (match) {
          linksByIndex.set(parseInt(match[1]), link);
        }
      });

      console.log("[Preview] Links by index:", Object.fromEntries(linksByIndex));

      elements.forEach((el, index) => {
        // Check if there's a link for this element index
        const link = linksByIndex.get(index);

        if (link) {
          console.log("[Preview] Setting up link on element", index, "->", link.toScreenId);
          
          const htmlEl = el as HTMLElement;
          
          // Make it visually interactive
          htmlEl.style.cursor = "pointer";
          htmlEl.style.outline = "3px solid rgba(99, 102, 241, 0.8)";
          htmlEl.style.outlineOffset = "2px";
          htmlEl.style.borderRadius = "6px";
          htmlEl.style.transition = "all 0.15s ease";
          
          // Store the target screen ID
          htmlEl.setAttribute("data-link-target", link.toScreenId);
          
          // Add click handler directly
          htmlEl.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetScreen = htmlEl.getAttribute("data-link-target");
            console.log("[Preview] Click! Navigating to:", targetScreen);
            if (targetScreen) {
              navigateToRef.current(targetScreen);
            }
          };
          
          // Add hover effects
          htmlEl.onmouseenter = () => {
            htmlEl.style.outline = "4px solid rgba(99, 102, 241, 1)";
            htmlEl.style.transform = "scale(1.03)";
            htmlEl.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          };
          
          htmlEl.onmouseleave = () => {
            htmlEl.style.outline = "3px solid rgba(99, 102, 241, 0.8)";
            htmlEl.style.transform = "scale(1)";
            htmlEl.style.boxShadow = "none";
          };
        }
      });

      // Also add a global click hint if there are links
      if (currentScreenLinks.length > 0) {
        console.log("[Preview] Screen has", currentScreenLinks.length, "outgoing links");
      }
    } catch (error) {
      console.warn("[Preview] Could not setup iframe interactions:", error);
    }
  }, [currentScreenId, currentScreenLinks]);

  // Listen for iframe height updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "FRAME_HEIGHT" &&
        event.data.frameId === currentScreenId
      ) {
        const newHeight = Math.max(MIN_DEVICE_HEIGHT, event.data.height);
        setIframeHeight(newHeight);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentScreenId]);

  // Setup interactions when iframe loads
  const handleIframeLoad = useCallback(() => {
    console.log("[Preview] iframe loaded for screen:", currentScreenId);
    // Give iframe content time to fully render
    setTimeout(setupIframeInteractions, 300);
    setTimeout(setupIframeInteractions, 600); // Retry once more
  }, [setupIframeInteractions, currentScreenId]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        goBack();
      } else if (e.key === "ArrowRight") {
        goForward();
      } else if (e.key === "Escape") {
        router.push(`/project/${projectId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goForward, router, projectId]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!project || frames.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No screens to preview</h1>
          <p className="text-white/70 mb-6">
            Add some screens to your project and create prototype links first.
          </p>
          <Button onClick={() => router.push(`/project/${projectId}`)}>
            Go back to editor
          </Button>
        </div>
      </div>
    );
  }

  const fullHtml = currentFrame
    ? getHTMLWrapper(currentFrame.htmlContent, currentFrame.title, theme?.style, currentFrame.id, { previewMode: true })
    : "";

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Simple Navigation Controls */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between">
        {/* Left: Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/project/${projectId}`)}
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Right: Navigation Arrows */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={goForward}
            disabled={historyIndex >= navigationHistory.length - 1}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-full"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ 
          zIndex: 10,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreenId}
            initial={{
              opacity: 0,
              x: transitionDirection === "right" ? 40 : -40,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: transitionDirection === "right" ? -40 : 40,
              scale: 0.95,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 40,
            }}
            className="flex items-center justify-center"
          >
            {/* Device Frame - Portrait Mode */}
            <div
              className={cn(
                "relative bg-black rounded-[28px] p-2 shadow-2xl",
                "ring-1 ring-white/10"
              )}
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.1), 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 60px rgba(99, 102, 241, 0.15)",
              }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />

              {/* Screen Content - Responsive height with scrolling */}
              <div 
                className="relative bg-white rounded-[22px] overflow-hidden"
                style={{
                  width: `${DEVICE_WIDTH}px`,
                  height: `${Math.min(iframeHeight, viewportHeight * 0.9)}px`,
                  maxHeight: "90vh",
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={fullHtml}
                  title={currentFrame?.title}
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={handleIframeLoad}
                  style={{
                    width: `${DEVICE_WIDTH}px`,
                    height: `${Math.min(iframeHeight, viewportHeight * 0.9)}px`,
                    minHeight: `${MIN_DEVICE_HEIGHT}px`,
                    border: "none",
                    display: "block",
                    background: "white",
                    pointerEvents: "auto",
                  }}
                />
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/30 rounded-full" />
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PreviewPage;
