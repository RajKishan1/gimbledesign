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

// Scalable: add new formats here with supported: true when implemented
const EXPORT_FORMATS = [
  {
    id: "code-to-clipboard",
    label: "Code to Clipboard",
    description: "Copy full HTML for all screens to the clipboard.",
    icon: CodeIcon,
    supported: true,
  },
  {
    id: "prompt-export",
    label: "Prompt Export",
    description:
      "Download a detailed .md implementation plan with code, theme tokens, and build steps for any AI coding tool.",
    icon: DocumentCodeIcon,
    supported: true,
  },
  {
    id: "copy-to-figma",
    label: "Copy to Figma",
    description:
      "Copy all screens as Figma-compatible layers — paste directly into any Figma file.",
    icon: Copy01Icon,
    supported: true,
  },
  {
    id: "build-with-ai",
    label: "Build with AI",
    description:
      "Open anything.com — an AI builder that turns your design into a working app instantly.",
    icon: SparklesIcon,
    supported: true,
  },
] as const;

type FormatId = (typeof EXPORT_FORMATS)[number]["id"];

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

// Radio circle component
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 rounded-full border-2 items-center justify-center transition-colors",
        selected ? "border-primary" : "border-muted-foreground/50"
      )}
    >
      {selected && (
        <span className="h-2 w-2 rounded-full bg-primary block" />
      )}
    </span>
  );
}

// Individual format option row
function FormatOption({
  id,
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  icon: IconSvgElement;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors group",
        selected ? "bg-accent/60" : "hover:bg-accent/30"
      )}
    >
      <RadioDot selected={selected} />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Icon}
            size={15}
            color="currentColor"
            strokeWidth={1.75}
            className={cn(
              "shrink-0 transition-colors",
              selected ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              selected ? "text-foreground" : "text-foreground/80"
            )}
          >
            {label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pl-[19px]">
          {description}
        </p>
      </div>
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

  const handlePrimaryAction = useCallback(() => {
    if (selectedFormat === "code-to-clipboard") handleCodeToClipboard();
    else if (selectedFormat === "prompt-export") handlePromptExport();
    else if (selectedFormat === "copy-to-figma") handleCopyToFigma();
    else if (selectedFormat === "build-with-ai") handleBuildWithAI();
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
        className="flex flex-col w-full sm:max-w-[320px] gap-0 p-0 bg-card border-l border-border text-card-foreground"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground tracking-tight">
            Export
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Format label */}
          <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Format
          </p>

          {/* Options list */}
          <div className="flex flex-col">
            {supportedFormats.map((format) => (
              <FormatOption
                key={format.id}
                id={format.id}
                label={format.label}
                description={format.description}
                icon={format.icon}
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
        <div className="shrink-0 border-t border-border p-5 space-y-3">
          {selectedFormat === "prompt-export" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Downloads a detailed implementation plan (.md) with your
              design&apos;s code, theme tokens, and build steps—ready for any AI
              coding tool.
            </p>
          )}
          <Button
            className={cn(
              "w-full font-medium gap-2",
              selectedFormat === "prompt-export"
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-foreground text-background hover:opacity-90 dark:bg-primary dark:text-primary-foreground"
            )}
            onClick={handlePrimaryAction}
            disabled={isCopyingToFigma && selectedFormat === "copy-to-figma"}
          >
            <HugeiconsIcon
              icon={cta.icon}
              size={15}
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
                className="shrink-0 ml-auto"
              />
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
