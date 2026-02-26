"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  CodeIcon,
  DocumentCodeIcon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { useState, useCallback } from "react";
import { useGetProjectById } from "@/features/use-project-id";
import { useCanvas } from "@/context/canvas-context";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { THEME_LIST } from "@/lib/themes";
import { getFontById, DEFAULT_FONT } from "@/constant/fonts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      "Get a ready-to-use prompt with code and steps to continue in any AI builder.",
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

export function ExportModal({ open, onOpenChange, projectId }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatId>("code-to-clipboard");
  const [description, setDescription] = useState("");
  const { data: project } = useGetProjectById(projectId);
  const { theme: themeId, font: canvasFont } = useCanvas();
  const theme = THEME_LIST.find((t) => t.id === (project?.theme ?? themeId));
  const font = canvasFont ?? getFontById(DEFAULT_FONT);
  const frames = project?.frames ?? [];
  const initialPrompt = (project as { initialPrompt?: string | null })?.initialPrompt ?? "";

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      } catch {
        toast.error("Failed to copy");
      }
    },
    []
  );

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
      initialPrompt ? `\`\`\`\n${initialPrompt}\n\`\`\`` : "_No prompt stored._",
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
    const text = lines.join("\n");
    copyToClipboard(text);
    onOpenChange(false);
  }, [frames, project?.name, initialPrompt, buildFullHtmlForFrame, copyToClipboard, onOpenChange]);

  const handleBuildWithAI = useCallback(() => {
    const projectName = project?.name ?? "Project";
    const userDesc = description.trim() || "Make this real.";
    const promptExportBody =
      frames.length > 0
        ? frames
            .map(
              (f: { title: string; htmlContent: string }) =>
                `## ${f.title}\n\`\`\`html\n${buildFullHtmlForFrame(f.htmlContent, f.title)}\n\`\`\``
            )
            .join("\n\n")
        : "";
    const fullPrompt = [
      "I have a design project I want to build with AI.",
      "",
      "Project name: " + projectName,
      "Original idea: " + (initialPrompt || "(none)"),
      "",
      "My instructions: " + userDesc,
      "",
      "Attached is the full HTML for each screen. Use this as reference to implement the app.",
      "",
      promptExportBody,
    ].join("\n");
    copyToClipboard(fullPrompt);
    toast.success("Ready-to-use prompt copied. Paste it into your AI builder.");
    onOpenChange(false);
  }, [project?.name, initialPrompt, description, frames, buildFullHtmlForFrame, copyToClipboard, onOpenChange]);

  const handlePrimaryAction = useCallback(() => {
    if (selectedFormat === "code-to-clipboard") handleCodeToClipboard();
    else if (selectedFormat === "prompt-export") handlePromptExport();
    else if (selectedFormat === "build-with-ai") handleBuildWithAI();
  }, [selectedFormat, handleCodeToClipboard, handlePromptExport, handleBuildWithAI]);

  const supportedFormats = EXPORT_FORMATS.filter((f) => f.supported);
  const currentFormat = EXPORT_FORMATS.find((f) => f.id === selectedFormat);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md gap-0 p-0 bg-card border-border text-card-foreground overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground">
            Export
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Format selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Format</Label>
            <div className="space-y-1">
              {supportedFormats.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;
                return (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setSelectedFormat(format.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 rounded-full border-2 items-center justify-center",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} color="currentColor" strokeWidth={1.75} /> : null}
                    </span>
                    <HugeiconsIcon icon={Icon} size={20} color="currentColor" strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {format.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format description */}
          {currentFormat && (
            <p className="text-sm text-muted-foreground">
              {currentFormat.description}
            </p>
          )}

          {/* Build with AI: description field */}
          {selectedFormat === "build-with-ai" && (
            <div className="space-y-2">
              <Label htmlFor="export-desc" className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="export-desc"
                placeholder="e.g. Make this real. / Add login flow. / Export for React."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none border-border bg-background text-foreground placeholder:text-muted-foreground"
                rows={3}
              />
            </div>
          )}

          {/* Primary action */}
          <div className="pt-2">
            {selectedFormat === "code-to-clipboard" && (
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                onClick={handlePrimaryAction}
              >
                <HugeiconsIcon icon={Download01Icon} size={16} color="currentColor" strokeWidth={1.75} className="mr-2 shrink-0" />
                Copy code to clipboard
              </Button>
            )}
            {selectedFormat === "prompt-export" && (
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                onClick={handlePrimaryAction}
              >
                <HugeiconsIcon icon={DocumentCodeIcon} size={16} color="currentColor" strokeWidth={1.75} className="mr-2 shrink-0" />
                Export prompt & code
              </Button>
            )}
            {selectedFormat === "build-with-ai" && (
              <Button
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                onClick={handlePrimaryAction}
              >
                <HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" strokeWidth={1.75} className="mr-2 shrink-0" />
                Build with AI
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.75} className="ml-2 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
