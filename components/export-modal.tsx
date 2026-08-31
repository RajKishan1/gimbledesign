"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  CodeIcon,
  DocumentCodeIcon,
  SparklesIcon,
  ArrowRight01Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import { useState, useCallback, useRef } from "react";
import { useGetProjectById } from "@/features/use-project-id";
import { useCanvas } from "@/context/canvas-context";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { THEME_LIST } from "@/lib/themes";
import { getFontById, DEFAULT_FONT } from "@/constant/fonts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateBuildPlan } from "@/lib/generate-build-plan";

/* Mini Figma logo for the Copy-to-Figma tile. */
function FigmaMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path d="M12 2H8.5a3.5 3.5 0 0 0 0 7H12V2Z" fill="#F24E1E" />
      <path d="M12 2h3.5a3.5 3.5 0 0 1 0 7H12V2Z" fill="#FF7262" />
      <path d="M12 9H8.5a3.5 3.5 0 0 0 0 7H12V9Z" fill="#A259FF" />
      <circle cx="15.5" cy="12.5" r="3.5" fill="#1ABCFE" />
      <path d="M12 16H8.5a3.5 3.5 0 1 0 3.5 3.5V16Z" fill="#0ACF83" />
    </svg>
  );
}

// Scalable: add new formats here with supported: true when implemented
const EXPORT_FORMATS = [
  {
    id: "code-to-clipboard",
    label: "Code to Clipboard",
    description: "Copy full HTML + CSS + JS for all screens.",
    icon: CodeIcon,
    tileClass: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    badge: "Recommended",
    badgeClass:
      "bg-[#53f22b]/20 text-[#1e9403] dark:bg-[#53f22b]/10 dark:text-[#6bf94a]",
    supported: true,
  },
  {
    id: "copy-to-figma",
    label: "Copy to Figma",
    description: "Copy all screens as Figma-compatible layers.",
    icon: Copy01Icon,
    tileClass: "bg-neutral-100 dark:bg-white/10",
    badge: "Recommended",
    badgeClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    supported: true,
  },
  {
    id: "prompt-export",
    label: "Prompt Export",
    description:
      "Download a detailed .md implementation plan with code, tokens & steps.",
    icon: DocumentCodeIcon,
    tileClass:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    badge: undefined,
    badgeClass: undefined,
    supported: true,
  },
  {
    id: "build-with-ai",
    label: "Build with AI",
    description:
      "Open anything.com — an AI builder that turns your design into a working app.",
    icon: SparklesIcon,
    tileClass:
      "bg-indigo-100 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400",
    badge: undefined,
    badgeClass: undefined,
    supported: true,
  },
] as const;

type ExportFormat = (typeof EXPORT_FORMATS)[number];
type FormatId = ExportFormat["id"];

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

// Radio circle — sits outside the card, green when selected
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 rounded-full border-2 items-center justify-center transition-colors",
        selected ? "border-[#2fb90f]" : "border-muted-foreground/40"
      )}
    >
      {selected && (
        <span className="h-2 w-2 rounded-full bg-[#2fb90f] block" />
      )}
    </span>
  );
}

// Individual format option: radio outside, card with icon tile + badge
function FormatOption({
  format,
  selected,
  onSelect,
}: {
  format: ExportFormat;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group flex w-full items-center gap-3 px-5 text-left"
    >
      <RadioDot selected={selected} />
      <span
        className={cn(
          "flex min-w-0 flex-1 items-start gap-3 rounded-2xl border p-3.5 transition-all",
          selected
            ? "border-[#53f22b] bg-[#53f22b]/6 shadow-[0_0_0_3px_rgba(83,242,43,0.12)]"
            : "border-border bg-card group-hover:border-foreground/20"
        )}
      >
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            format.tileClass
          )}
        >
          {format.id === "copy-to-figma" ? (
            <FigmaMark />
          ) : (
            <HugeiconsIcon
              icon={format.icon}
              size={22}
              color="currentColor"
              strokeWidth={1.75}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {format.label}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {format.description}
          </span>
          {format.badge && (
            <span
              className={cn(
                "mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                format.badgeClass
              )}
            >
              {format.badge}
            </span>
          )}
        </span>
        {selected && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            color="currentColor"
            strokeWidth={2}
            className="mt-1 shrink-0 self-center text-[#2fb90f]"
          />
        )}
      </span>
    </button>
  );
}

// CTA button config per format
const CTA_CONFIG: Record<
  FormatId,
  { label: string; icon: IconSvgElement; trailingIcon?: IconSvgElement }
> = {
  "code-to-clipboard": {
    label: "Copy code to clipboard",
    icon: CodeIcon,
  },
  "prompt-export": {
    label: "Download Prompt & Code",
    icon: DocumentCodeIcon,
  },
  "copy-to-figma": {
    label: "Copy to Figma",
    icon: Copy01Icon,
  },
  "build-with-ai": {
    label: "Copy & Open anything.com",
    icon: SparklesIcon,
    trailingIcon: ArrowRight01Icon,
  },
};

export function ExportModal({
  open,
  onOpenChange,
  projectId,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatId>(
    "code-to-clipboard"
  );
  const [description, setDescription] = useState("");
  const { data: project } = useGetProjectById(projectId);
  const { theme: themeId, font: canvasFont, deviceType, selectedFrame: activeFrame } = useCanvas();
  const [isCopyingToFigma, setIsCopyingToFigma] = useState(false);
  const figmaClipboardCache = useRef<Map<string, string>>(new Map());
  const theme = THEME_LIST.find((t) => t.id === (project?.theme ?? themeId));
  const font = canvasFont ?? getFontById(DEFAULT_FONT);
  const frames = project?.frames ?? [];
  const initialPrompt =
    (project as { initialPrompt?: string | null })?.initialPrompt ?? "";

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const buildFullHtmlForFrame = useCallback(
    (html: string, title: string) => {
      return getHTMLWrapper(html, title, theme?.style, undefined, { font });
    },
    [theme?.style, font]
  );

  const handleCodeToClipboard = useCallback(() => {
    if (frames.length === 0) {
      toast.error("No screens to export");
      return;
    }
    const combined =
      frames
        .map(
          (f: { title: string; htmlContent: string }) =>
            `<!-- Screen: ${f.title} -->\n${buildFullHtmlForFrame(f.htmlContent, f.title)}`
        )
        .join("\n\n") || "";
    copyToClipboard(combined);
    onOpenChange(false);
  }, [frames, buildFullHtmlForFrame, copyToClipboard, onOpenChange]);

  const handlePromptExport = useCallback(() => {
    if (frames.length === 0) {
      toast.error("No screens to export");
      return;
    }

    const projectName = project?.name ?? "Project";
    const userDesc = description.trim() || "Make this real.";
    const deviceType = (project as { deviceType?: string })?.deviceType ?? "web";

    const planFrames = frames.map((f: { title: string; htmlContent: string }) => ({
      title: f.title,
      fullHtml: buildFullHtmlForFrame(f.htmlContent, f.title),
    }));

    const markdown = generateBuildPlan({
      projectName,
      initialPrompt: initialPrompt || "",
      userInstructions: userDesc,
      deviceType,
      themeName: theme?.name ?? "Default",
      themeStyle: theme?.style ?? "",
      fontFamily: font?.family ?? "Plus Jakarta Sans",
      fontUrl: font?.googleFontUrl ?? "",
      fontCategory: font?.category ?? "sans-serif",
      frames: planFrames,
    });

    // Trigger file download
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.href = url;
    a.download = `${slug || "project"}-prompt-export.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Implementation plan downloaded!");
    onOpenChange(false);
  }, [
    frames,
    project?.name,
    project,
    initialPrompt,
    description,
    theme,
    font,
    buildFullHtmlForFrame,
    onOpenChange,
  ]);

  const handleCopyToFigma = useCallback(async () => {
    if (frames.length === 0) {
      toast.error("No screens to export");
      return;
    }
    // Use the selected frame, or fall back to the first frame
    const frame = (activeFrame ?? frames[0]) as { title: string; htmlContent: string };
    if (!frame) return;

    if (isCopyingToFigma) return;
    setIsCopyingToFigma(true);
    try {
      const viewportWidth = deviceType === "web" ? 1440 : 393;
      const fullHtml = buildFullHtmlForFrame(frame.htmlContent, frame.title);
      const cacheKey = `${viewportWidth}:${fullHtml}`;
      let clipboardHtml = figmaClipboardCache.current.get(cacheKey);

      if (!clipboardHtml) {
        const res = await fetch("/api/figma-clipboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: fullHtml, width: viewportWidth }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          toast.error(err.error || "Failed to prepare for Figma");
          return;
        }
        clipboardHtml = await res.text();
        figmaClipboardCache.current.set(cacheKey, clipboardHtml);
      }

      // Prefer Clipboard API, fallback to execCommand
      const blob = new Blob([clipboardHtml], { type: "text/html" });
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "text/html": blob }),
          ]);
          toast.success(`Copied "${frame.title}"! Paste in Figma with Ctrl+V (or Cmd+V)`);
          onOpenChange(false);
          return;
        } catch {
          // Fall through to execCommand fallback
        }
      }
      const handler = (e: ClipboardEvent) => {
        e.clipboardData?.setData("text/html", clipboardHtml!);
        e.preventDefault();
        document.removeEventListener("copy", handler);
      };
      document.addEventListener("copy", handler);
      document.execCommand("copy");
      toast.success(`Copied "${frame.title}"! Paste in Figma with Ctrl+V (or Cmd+V)`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy to Figma");
    } finally {
      setIsCopyingToFigma(false);
    }
  }, [frames, activeFrame, deviceType, buildFullHtmlForFrame, isCopyingToFigma, onOpenChange]);

  const handleBuildWithAI = useCallback(async () => {
    if (frames.length === 0) {
      toast.error("No screens to export");
      return;
    }

    // Build the prompt to copy
    const projectName = project?.name ?? "Project";
    const deviceType = (project as { deviceType?: string })?.deviceType ?? "web";
    const planFrames = frames.map((f: { title: string; htmlContent: string }) => ({
      title: f.title,
      fullHtml: buildFullHtmlForFrame(f.htmlContent, f.title),
    }));

    const markdown = generateBuildPlan({
      projectName,
      initialPrompt: initialPrompt || "",
      userInstructions: "Build this application with identical design.",
      deviceType,
      themeName: theme?.name ?? "Default",
      themeStyle: theme?.style ?? "",
      fontFamily: font?.family ?? "Plus Jakarta Sans",
      fontUrl: font?.googleFontUrl ?? "",
      fontCategory: font?.category ?? "sans-serif",
      frames: planFrames,
    });

    // Copy to clipboard, then open anything.com
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Prompt copied to clipboard — paste it in anything.com", {
        duration: 5000,
      });
    } catch {
      toast.error("Failed to copy prompt to clipboard");
      return;
    }

    window.open("https://anything.com", "_blank");
    onOpenChange(false);
  }, [
    frames,
    project?.name,
    project,
    initialPrompt,
    theme,
    font,
    buildFullHtmlForFrame,
    onOpenChange,
  ]);

  // Re-entry guard: a double-click on the CTA must not run the export twice
  // (duplicate downloads / double clipboard writes / two anything.com tabs).
  const isRunningRef = useRef(false);
  const handlePrimaryAction = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    try {
      if (selectedFormat === "code-to-clipboard") handleCodeToClipboard();
      else if (selectedFormat === "prompt-export") handlePromptExport();
      else if (selectedFormat === "copy-to-figma") await handleCopyToFigma();
      else if (selectedFormat === "build-with-ai") await handleBuildWithAI();
    } finally {
      isRunningRef.current = false;
    }
  }, [
    selectedFormat,
    handleCodeToClipboard,
    handlePromptExport,
    handleCopyToFigma,
    handleBuildWithAI,
  ]);

  const supportedFormats = EXPORT_FORMATS.filter((f) => f.supported);
  const cta = CTA_CONFIG[selectedFormat];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-90 gap-0 p-0 bg-card border-l border-border text-card-foreground"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground tracking-tight">
            Export
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Format label */}
          <p className="px-5 pb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Choose format
          </p>

          {/* Options list */}
          <div className="flex flex-col gap-3">
            {supportedFormats.map((format) => (
              <FormatOption
                key={format.id}
                format={format}
                selected={selectedFormat === format.id}
                onSelect={() => setSelectedFormat(format.id)}
              />
            ))}
          </div>

          {/* Prompt Export: description field */}
          {selectedFormat === "prompt-export" && (
            <div className="px-5 pt-4 pb-2 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </p>
              <Textarea
                placeholder="Make this real."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none border-border bg-background text-foreground placeholder:text-muted-foreground text-sm rounded-xl"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-border p-5 space-y-2.5">
          <Button
            className="h-12 w-full gap-2 rounded-2xl bg-neutral-900 text-[15px] font-medium text-white shadow-lg hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
            onClick={handlePrimaryAction}
            disabled={isCopyingToFigma && selectedFormat === "copy-to-figma"}
          >
            <HugeiconsIcon
              icon={cta.icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
              className={cn("shrink-0", isCopyingToFigma && selectedFormat === "copy-to-figma" && "animate-spin")}
            />
            {isCopyingToFigma && selectedFormat === "copy-to-figma" ? "Preparing for Figma…" : cta.label}
            {cta.trailingIcon && (
              <HugeiconsIcon
                icon={cta.trailingIcon}
                size={15}
                color="currentColor"
                strokeWidth={1.75}
                className="shrink-0"
              />
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Includes all screens and assets
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
