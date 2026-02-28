"use client";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import {
  ChevronDownIcon,
  Paperclip,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Spinner } from "./ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  SELECTABLE_MODELS,
  getModelName,
  AUTO_MODEL_ID,
} from "@/constant/models";
import { useState, useRef } from "react";

export type DeviceType = "mobile" | "web" | "inspirations" | "wireframe";

export type WireframeKind = "web" | "mobile";

interface PropsType {
  promptText: string;
  setPromptText: (value: string) => void;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
  hideSubmitBtn?: boolean;
  onSubmit?: () => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  deviceType?: DeviceType;
  onDeviceTypeChange?: (type: DeviceType) => void;
  /** When deviceType is "wireframe": "web" = one responsive screen (shown at 3 sizes), "mobile" = one mobile screen. Default "web". */
  wireframeKind?: WireframeKind;
  onWireframeKindChange?: (kind: WireframeKind) => void;
  /** When deviceType is "inspirations": "web" or "mobile" to generate designs for that device. Default "web". */
  inspirationKind?: WireframeKind;
  onInspirationKindChange?: (kind: WireframeKind) => void;
  /** Reference image/file for the design (e.g. attached screenshot). */
  referenceFile?: File | null;
  onReferenceChange?: (file: File | null) => void;
}

const PromptInput = ({
  promptText,
  setPromptText,
  isLoading,
  loadingText,
  className,
  hideSubmitBtn = false,
  onSubmit,
  selectedModel = AUTO_MODEL_ID,
  onModelChange,
  deviceType = "mobile",
  onDeviceTypeChange,
  wireframeKind = "web",
  onWireframeKindChange,
  inspirationKind = "web",
  onInspirationKindChange,
  referenceFile,
  onReferenceChange,
}: PropsType) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When popover opens with Auto selected, show only Auto; when another model is selected, show all
  const isAutoSelected = selectedModel === AUTO_MODEL_ID;
  const modelsExpanded = showAllModels || !isAutoSelected;

  const handleModelSelect = (modelId: string) => {
    onModelChange?.(modelId);
  };

  const selectedModelName = getModelName(selectedModel);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onReferenceChange?.(file ?? null);
    e.target.value = "";
  };

  const clearReference = () => {
    onReferenceChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-156  mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />
        <InputGroup
        className={cn(
          "min-h-39 max-h-[min(16rem,50vh)] bg-card rounded-2xl border border-border shadow-sm p-2.5 flex flex-col",
          className && className
        )}
      >
        <InputGroupTextarea
          className="text-base! py-2.5! min-h-12 max-h-[min(12rem,40vh)] overflow-y-auto"
          placeholder="Describe your design vision..."
          value={promptText}
          onChange={(e) => {
            setPromptText(e.target.value);
          }}
        />

        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-between gap-2 flex-wrap"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Attach reference image — available for all design types */}
            <button
              type="button"
              onClick={handleAttachClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            >
              <Paperclip className="size-4" />
              <span>Attach</span>
              {referenceFile && (
                <span
                  className="text-xs truncate max-w-24"
                  title={referenceFile.name}
                >
                  ({referenceFile.name})
                </span>
              )}
            </button>
            {referenceFile && (
              <button
                type="button"
                onClick={clearReference}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            )}

            {/* Model-only popover */}
            <Popover
              open={isFilterOpen}
              onOpenChange={(open) => {
                setIsFilterOpen(open);
                if (!open) setShowAllModels(false);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-colors"
                >
                  <Zap className="size-4" />
                  <span>{selectedModelName}</span>
                  <ChevronDownIcon className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
                <div className="p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="size-3.5" />
                    Model
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {modelsExpanded ? (
                      SELECTABLE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelSelect(model.id)}
                          className={cn(
                            "w-full flex flex-col items-start gap-0.5 px-2.5 py-2 text-left rounded-md transition-colors",
                            selectedModel === model.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium text-sm">
                              {model.name}
                            </span>
                            {selectedModel === model.id && (
                              <Check className="size-4 ml-auto text-primary shrink-0" />
                            )}
                          </div>
                          {model.description && (
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <>
                        {SELECTABLE_MODELS.filter(
                          (m) => m.id === AUTO_MODEL_ID
                        ).map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            className="w-full flex flex-col items-start gap-0.5 px-2.5 py-2 text-left rounded-md bg-accent text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="font-medium text-sm">
                                {model.name}
                              </span>
                              <Check className="size-4 ml-auto text-primary shrink-0" />
                            </div>
                            {model.description && (
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowAllModels(true)}
                          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <ChevronDownIcon className="size-4" />
                          Change model
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {!hideSubmitBtn && (
            <InputGroupButton
              variant="default"
              className={cn(
                "rounded-lg relative bg-primary text-primary-foreground hover:bg-primary/90 overflow-hidden px-4 font-medium",
                isLoading && "min-w-28"
              )}
              size="sm"
              disabled={(!promptText?.trim() && !referenceFile) || isLoading}
              onClick={() => onSubmit?.()}
            >
              {isLoading && (
                <span className="generate-btn-shimmer" aria-hidden />
              )}
              {isLoading ? (
                <>
                  <Spinner />
                  {loadingText && <span className="ml-2">{loadingText}</span>}
                </>
              ) : (
                <span className="flex items-center gap-2">
                  GENERATE
                  <ArrowRight className="size-4" />
                </span>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export default PromptInput;
