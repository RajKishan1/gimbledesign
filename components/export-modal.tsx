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
} from "@hugeicons/core-free-icons";
import { useState, useCallback } from "react";
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
      "Export the full prompt and complete output—including code for every screen—as a single document.",
    icon: DocumentCodeIcon,
    supported: true,
  },
  {
    id: "build-with-ai",
    label: "Build with AI",
    description:
      "Download a detailed .md implementation plan with code and build steps for any AI coding tool.",
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
    label: "Export prompt & code",
    icon: DocumentCodeIcon,
  },
  "build-with-ai": {
    label: "Download AI Build Plan",
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
  const { theme: themeId, font: canvasFont } = useCanvas();
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
    const lines: string[] = [
      `# ${projectName} – Prompt & Code Export`,
      "",
      "## Original prompt",
      initialPrompt
        ? `\`\`\`\n${initialPrompt}\n\`\`\``
        : "_No prompt stored._",
      "",
      "## Screens & code",
      "",
    ];
    frames.forEach((f: { title: string; htmlContent: string }) => {
      lines.push(`### ${f.title}`);
      lines.push("");
      lines.push("```html");
      lines.push(buildFullHtmlForFrame(f.htmlContent, f.title));
      lines.push("```");
      lines.push("");
    });
    copyToClipboard(lines.join("\n"));
    onOpenChange(false);
  }, [
    frames,
    project?.name,
    initialPrompt,
    buildFullHtmlForFrame,
    copyToClipboard,
    onOpenChange,
  ]);

  const handleBuildWithAI = useCallback(() => {
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
    a.download = `${slug || "project"}-build-plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Implementation plan downloaded!");
    onOpenChange(false);
  }, [
    project?.name,
    project,
    initialPrompt,
    description,
    frames,
    theme,
    font,
    buildFullHtmlForFrame,
    onOpenChange,
  ]);

  const handlePrimaryAction = useCallback(() => {
    if (selectedFormat === "code-to-clipboard") handleCodeToClipboard();
    else if (selectedFormat === "prompt-export") handlePromptExport();
    else if (selectedFormat === "build-with-ai") handleBuildWithAI();
  }, [
    selectedFormat,
    handleCodeToClipboard,
    handlePromptExport,
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

          {/* Build with AI: description field */}
          {selectedFormat === "build-with-ai" && (
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
          {selectedFormat === "build-with-ai" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Downloads a detailed implementation plan (.md) with your
              design&apos;s code, theme tokens, and build steps—ready for any AI
              coding tool.
            </p>
          )}
          <Button
            className={cn(
              "w-full font-medium gap-2",
              selectedFormat === "build-with-ai"
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-foreground text-background hover:opacity-90 dark:bg-primary dark:text-primary-foreground"
            )}
            onClick={handlePrimaryAction}
          >
            <HugeiconsIcon
              icon={cta.icon}
              size={15}
              color="currentColor"
              strokeWidth={1.75}
              className="shrink-0"
            />
            {cta.label}
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
