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
  Smartphone,
  Globe,
  Sparkles,
  Paperclip,
  Check,
  Zap,
  Lightbulb,
  ArrowUp,
  Layout,
} from "lucide-react";
import { Spinner } from "./ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  SELECTABLE_MODELS,
  getModelName,
  AUTO_MODEL_ID,
} from "@/constant/models";
import { useState, useRef } from "react";

export type DeviceType = "mobile" | "web" | "inspirations" | "wireframe";

const DESIGN_TYPES: { value: DeviceType; label: string; icon: React.ReactNode }[] = [
  { value: "mobile", label: "Mobile", icon: <Smartphone className="size-4" /> },
  { value: "web", label: "Website", icon: <Globe className="size-4" /> },
  { value: "inspirations", label: "Inspirations", icon: <Lightbulb className="size-4" /> },
  { value: "wireframe", label: "Wireframe", icon: <Layout className="size-4" /> },
];

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

  const handleTypeSelect = (type: DeviceType) => {
    onDeviceTypeChange?.(type);
  };

  const selectedModelName = getModelName(selectedModel);
  const selectedTypeLabel = DESIGN_TYPES.find((t) => t.value === deviceType)?.label ?? "Mobile";
  const selectedTypeIcon = DESIGN_TYPES.find((t) => t.value === deviceType)?.icon;

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
    <div className="max-w-156 mx-auto">
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
          "min-h-50 bg-[#ffffff] dark:bg-zinc-950 p-3 ",
          className && className,
        )}
      >
        <InputGroupTextarea
          className="text-base! py-2.5! "
          placeholder="Describe design you need..."
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
            {/* Attach reference */}
            <button
              type="button"
              onClick={handleAttachClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
            >
              <Paperclip className="size-4" />
              <span>Attach</span>
              {referenceFile && (
                <span className="text-xs truncate max-w-24" title={referenceFile.name}>
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

            {/* Type + Model popover (filter) */}
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
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {selectedTypeIcon}
                    <span>{selectedTypeLabel}</span>
                  </span>
                  <span className="text-muted-foreground/70">·</span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-4" />
                    <span>{selectedModelName}</span>
                  </span>
                  <ChevronDownIcon className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {DESIGN_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeSelect(type.value)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-2 text-sm font-medium rounded-md transition-colors",
                          deviceType === type.value
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground",
                        )}
                      >
                        {type.icon}
                        <span>{type.label}</span>
                        {deviceType === type.value && (
                          <Check className="size-4 ml-auto text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                          )}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium text-sm">{model.name}</span>
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
                        {SELECTABLE_MODELS.filter((m) => m.id === AUTO_MODEL_ID).map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            className="w-full flex flex-col items-start gap-0.5 px-2.5 py-2 text-left rounded-md bg-accent text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="font-medium text-sm">{model.name}</span>
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
                          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
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
                "rounded-full relative overflow-hidden",
                isLoading && "min-w-28",
              )}
              size="sm"
              disabled={(!promptText?.trim() && !referenceFile) || isLoading}
              onClick={() => onSubmit?.()}
            >
              {isLoading && <span className="generate-btn-shimmer" aria-hidden />}
              {isLoading ? (
                <>
                  <Spinner />
                  {loadingText && <span className="ml-2">{loadingText}</span>}
                </>
              ) : (
                <div className="px-1 flex gap-1.5 items-center">
                  Generate
                  <ArrowUp className="size-4" />
                </div>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export default PromptInput;
