"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetProjectById } from "@/features/use-project-id";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { THEME_LIST } from "@/lib/themes";
import { DEFAULT_FONT, getFontById } from "@/constant/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  SmartPhone01Icon,
  ArrowDown01Icon,
  Tablet01Icon,
  LaptopIcon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INTERACTIVE_ELEMENT_SELECTORS } from "@/constant/canvas";
import { PrototypeLink } from "@/context/prototype-context";
import { FrameType } from "@/types/project";

// Storage key for prototype links (shared with main editor)
const getLinksStorageKey = (projectId: string) => `prototype-links-${projectId}`;

const MIN_DEVICE_HEIGHT = 300;

// 6 famous mobile sizes (viewport width in CSS px) – user can select any
const PREVIEW_DEVICE_PRESETS = [
  { id: "iphone-17-pro", name: "iPhone 17 Pro", width: 402 },
  { id: "iphone-16-pro", name: "iPhone 16 Pro", width: 393 },
  { id: "samsung-s24", name: "Samsung Galaxy S24", width: 360 },
  { id: "samsung-s24-ultra", name: "Samsung Galaxy S24 Ultra", width: 412 },
  { id: "pixel-9", name: "Google Pixel 9", width: 412 },
  { id: "oneplus-12", name: "OnePlus 12", width: 412 },
] as const;

// Web responsive breakpoints
type WebViewport = "mobile" | "tablet" | "desktop";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WEB_VIEWPORTS: { id: WebViewport; label: string; width: number; icon: any }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: SmartPhone01Icon },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet01Icon },
  { id: "desktop", label: "Desktop", width: 1440, icon: LaptopIcon },
];

const PreviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const screenParam = searchParams.get("screen");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigateToRef = useRef<(screenId: string) => void>(() => {});

  const { data: project, isPending } = useGetProjectById(projectId);
  const frames = project?.frames || [];
  const theme = THEME_LIST.find((t) => t.id === project?.theme);

  // Navigation state
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [iframeHeight, setIframeHeight] = useState<number>(MIN_DEVICE_HEIGHT);
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  const [viewportWidth, setViewportWidth] = useState<number>(400);
  const [devicePresetId, setDevicePresetId] = useState<string>(PREVIEW_DEVICE_PRESETS[0].id);
  const [webViewport, setWebViewport] = useState<WebViewport>("desktop");

  const isWebProject = project?.deviceType === "web";
  const deviceWidth = isWebProject
    ? WEB_VIEWPORTS.find((v) => v.id === webViewport)?.width ?? 1440
    : PREVIEW_DEVICE_PRESETS.find((p) => p.id === devicePresetId)?.width ?? PREVIEW_DEVICE_PRESETS[0].width;

  // Scale so device frame fits viewport (no overflow on mobile), max 1.35 on large screens
  const previewScale = useMemo(() => {
    if (isWebProject) {
      // For web: scale to fit width, no phone chrome overhead
      const availW = Math.max(0, viewportWidth - 48);
      const scaleByW = availW / deviceWidth;
      // Desktop at 1440px almost always needs to scale down; cap at 1.0 for web
      return Math.max(0.2, Math.min(1.0, scaleByW));
    }
    const chrome = 48; // padding + notch + home indicator
    const frameW = deviceWidth + 24;
    const frameH = Math.min(iframeHeight, viewportHeight * 0.9) + chrome;
    const availW = Math.max(0, viewportWidth - 48);
    const availH = Math.max(0, viewportHeight - 88);
    const scaleByW = availW / frameW;
    const scaleByH = availH / frameH;
    const fitScale = Math.min(scaleByW, scaleByH, 1.35);
    return Math.max(0.3, Math.min(1.35, fitScale));
  }, [isWebProject, deviceWidth, iframeHeight, viewportWidth, viewportHeight]);

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

  // Set initial screen (from ?screen=frameId or first frame)
  useEffect(() => {
    if (frames.length > 0 && !currentScreenId) {
      const initialId =
        screenParam && frames.some((f: FrameType) => f.id === screenParam)
          ? screenParam
          : frames[0].id;
      setCurrentScreenId(initialId);
      setNavigationHistory([initialId]);
      setHistoryIndex(0);
    }
  }, [frames, currentScreenId, screenParam]);

  // Track viewport size (for responsive scale)
  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Get current frame
  const currentFrame = useMemo(() => {
    return frames.find((f: FrameType) => f.id === currentScreenId);
  }, [frames, currentScreenId]);

  // Navigate to a screen - use ref to avoid stale closure
  const navigateTo = useCallback(
    (screenId: string) => {
      console.log("[Preview] Navigating to:", screenId);
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
    navigateToRef.current = (screenId: string) => navigateTo(screenId);
  }, [navigateTo]);

  // Go back in history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentScreenId(navigationHistory[historyIndex - 1]);
    }
  }, [historyIndex, navigationHistory]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
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
          
          // Make it interactive (no visual borders)
          htmlEl.style.cursor = "pointer";
          
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!project || frames.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No screens to preview</h1>
          <p className="text-muted-foreground mb-6">
            Add some screens to your project and create prototype links first.
          </p>
          <Button onClick={() => router.push(`/project/${projectId}`)}>
            Go back to editor
          </Button>
        </div>
      </div>
    );
  }

  const defaultFont = getFontById(DEFAULT_FONT);
  const fullHtml = currentFrame
    ? getHTMLWrapper(currentFrame.htmlContent, currentFrame.title, theme?.style, currentFrame.id, { previewMode: true, font: defaultFont })
    : "";

  // Use app theme (background from globals.css)
  const buttonClasses = "text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 rounded-full";

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {/* Navigation + device selector */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/project/${projectId}`)}
          className={buttonClasses}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.75} />
        </Button>

        {/* Center: web viewport tabs OR mobile device dropdown */}
        {isWebProject ? (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            {WEB_VIEWPORTS.map((vp) => (
              <Button
                key={vp.id}
                variant={webViewport === vp.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-3 gap-1.5 rounded-md text-xs font-medium transition-colors",
                  webViewport === vp.id
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                onClick={() => setWebViewport(vp.id)}
              >
                <HugeiconsIcon icon={vp.icon} size={14} color="currentColor" strokeWidth={1.75} className="shrink-0" />
                {vp.label}
                <span className="text-muted-foreground font-normal">{vp.width}px</span>
              </Button>
            ))}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border bg-card text-foreground hover:bg-accent shrink-0"
              >
                <HugeiconsIcon icon={SmartPhone01Icon} size={16} color="currentColor" strokeWidth={1.75} className="shrink-0" />
                <span className="max-w-[160px] truncate">
                  {PREVIEW_DEVICE_PRESETS.find((p) => p.id === devicePresetId)?.name ?? "Device"}
                </span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={16} color="currentColor" strokeWidth={1.75} className="opacity-70 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 rounded-lg">
              {PREVIEW_DEVICE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => setDevicePresetId(preset.id)}
                  className="cursor-pointer"
                >
                  {preset.name}
                  <span className="ml-auto text-xs text-muted-foreground">{preset.width}px</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className={buttonClasses}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="currentColor" strokeWidth={1.75} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goForward}
            disabled={historyIndex >= navigationHistory.length - 1}
            className={buttonClasses}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="fixed inset-0 flex items-center justify-center pt-14 pb-6" style={{ zIndex: 10 }}>
        {isWebProject ? (
          /* Web: browser chrome with scrollable content, scaled to fit */
          <div
            className="flex items-start justify-center w-full h-full overflow-hidden"
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
            }}
          >
            <div
              className="flex flex-col rounded-xl overflow-hidden shadow-2xl ring-1 ring-border bg-card"
              style={{ width: `${deviceWidth}px` }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b border-border shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 mx-2 h-6 bg-background rounded-md border border-border flex items-center px-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {currentFrame?.title ?? "Preview"}
                  </span>
                </div>
              </div>
              {/* Page content */}
              <div
                className="overflow-auto bg-white"
                style={{ height: `${Math.min(iframeHeight, viewportHeight * 0.85)}px`, maxHeight: "85vh" }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={fullHtml}
                  title={currentFrame?.title}
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={handleIframeLoad}
                  style={{
                    width: `${deviceWidth}px`,
                    height: `${iframeHeight}px`,
                    minHeight: `${MIN_DEVICE_HEIGHT}px`,
                    border: "none",
                    display: "block",
                    background: "white",
                    pointerEvents: "auto",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Mobile: phone mockup */
          <div
            className="flex items-center justify-center w-full h-full"
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "center center",
            }}
          >
            <div
              className={cn(
                "relative bg-black rounded-[28px] p-2 shadow-2xl",
                "ring-1 ring-border"
              )}
              style={{
                boxShadow: "0 0 0 1px var(--border), 0 20px 40px -10px rgba(0,0,0,0.25)",
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />
              <div
                className="relative bg-white dark:bg-background rounded-[22px] overflow-hidden"
                style={{
                  width: `${deviceWidth}px`,
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
                    width: `${deviceWidth}px`,
                    height: `${Math.min(iframeHeight, viewportHeight * 0.9)}px`,
                    minHeight: `${MIN_DEVICE_HEIGHT}px`,
                    border: "none",
                    display: "block",
                    background: "white",
                    pointerEvents: "auto",
                  }}
                />
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPage;
