"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Textarea } from "../ui/textarea";
import { Spinner } from "../ui/spinner";

export type VariationsConfig = {
  numberOfOptions: number;
  creativeRange: "refine" | "explore" | "reimagine";
  customInstructions: string;
  aspectsToVary: {
    layout: boolean;
    colorScheme: boolean;
    images: boolean;
    textFont: boolean;
    textContent: boolean;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: VariationsConfig) => void;
  isGenerating?: boolean;
};

const ASPECTS = [
  { key: "layout" as const, label: "Layout" },
  { key: "colorScheme" as const, label: "Color scheme" },
  { key: "images" as const, label: "Images" },
  { key: "textFont" as const, label: "Text font" },
  { key: "textContent" as const, label: "Text content" },
];

export default function GenerateVariationsPanel({
  open,
  onClose,
  onGenerate,
  isGenerating = false,
}: Props) {
  const [numberOfOptions, setNumberOfOptions] = useState(3);
  const [creativeRange, setCreativeRange] = useState<
    "refine" | "explore" | "reimagine"
  >("explore");
  const [customInstructions, setCustomInstructions] = useState("");
  const [aspectsToVary, setAspectsToVary] = useState({
    layout: false,
    colorScheme: false,
    images: false,
    textFont: false,
    textContent: false,
  });

  const toggleAspect = (key: keyof typeof aspectsToVary) => {
    setAspectsToVary((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    onGenerate({
      numberOfOptions,
      creativeRange,
      customInstructions,
      aspectsToVary,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[200] flex">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Panel — mirrors design-sidebar: bg-card, border-l, same width */}
      <div className="relative ml-auto flex h-full w-[300px] flex-col bg-card border-l border-border animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Generate variations
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
          {/* Number of options */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Number of options
            </p>
            <div className="flex items-center gap-0">
              <button
                onClick={() =>
                  setNumberOfOptions(Math.max(1, numberOfOptions - 1))
                }
                disabled={numberOfOptions <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-l-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <HugeiconsIcon
                  icon={MinusSignIcon}
                  size={12}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
              <div className="flex h-8 w-9 items-center justify-center border-y border-border bg-card text-sm font-medium text-foreground">
                {numberOfOptions}
              </div>
              <button
                onClick={() =>
                  setNumberOfOptions(Math.min(4, numberOfOptions + 1))
                }
                disabled={numberOfOptions >= 4}
                className="flex h-8 w-8 items-center justify-center rounded-r-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  size={12}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>

          {/* Creative range */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Creative range
            </p>
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {(["refine", "explore", "reimagine"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setCreativeRange(range)}
                  className={cn(
                    "flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                    creativeRange === range
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom instructions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Custom instructions
            </p>
            <Textarea
              placeholder="Make all in the style of..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className={cn(
                "min-h-[80px] resize-none text-sm",
                "rounded-xl bg-card border border-border",
                "placeholder:text-muted-foreground/60",
                "focus:ring-1 focus:ring-pink-500/25 dark:focus:ring-pink-500/40"
              )}
            />
          </div>

          {/* Aspects to vary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Aspects to vary
            </p>
            <div className="space-y-0.5">
              {ASPECTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleAspect(key)}
                  className="flex w-full items-center justify-between rounded-lg px-1 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm">{label}</span>
                  {/* Toggle switch */}
                  <div
                    className={cn(
                      "relative h-[18px] w-8 rounded-full transition-colors",
                      aspectsToVary[key]
                        ? "bg-foreground dark:bg-primary"
                        : "bg-muted-foreground/25"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform",
                        aspectsToVary[key]
                          ? "translate-x-[14px]"
                          : "translate-x-[2px]"
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — matches the send button style from design-sidebar */}
        <div className="px-4 py-4 border-t border-border">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "w-full h-9 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
              "border border-white/10 dark:border-white/5",
              "shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98]",
              isGenerating
                ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                : "bg-foreground text-background hover:opacity-90 dark:bg-primary dark:text-primary-foreground dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            )}
          >
            {isGenerating ? (
              <>
                <Spinner className="w-3.5 h-3.5" />
                <span>Generating...</span>
              </>
            ) : (
              "Generate variations"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
