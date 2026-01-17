"use client";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import { CornerDownLeftIcon, ChevronDownIcon } from "lucide-react";
import { Spinner } from "./ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { AI_MODELS, DEFAULT_MODEL, getModelName } from "@/constant/models";
import { useState } from "react";

interface PropsType {
  promptText: string;
  setPromptText: (value: string) => void;
  isLoading?: boolean;
  className?: string;
  hideSubmitBtn?: boolean;
  onSubmit?: () => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}
const PromptInput = ({
  promptText,
  setPromptText,
  isLoading,
  className,
  hideSubmitBtn = false,
  onSubmit,
  selectedModel = DEFAULT_MODEL,
  onModelChange,
}: PropsType) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const handleModelSelect = (modelId: string) => {
    onModelChange?.(modelId);
    setIsModelDropdownOpen(false);
  };

  const selectedModelName = getModelName(selectedModel);
  const selectedModelProvider = AI_MODELS.find(
    (m) => m.id === selectedModel
  )?.provider;

  return (
    <div className="bg-zinc-950">
      <InputGroup
        className={cn(
          "min-h-50  bg-zinc-950 ",
          className && className
        )}
      >
        <InputGroupAddon
          align="block-start"
          className="flex bg-zinc-800 items-center justify-between w-full px-3 pt-3 pb-2"
        >
          <DropdownMenu open={isModelDropdownOpen} onOpenChange={setIsModelDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="xs"
                className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span className="hidden sm:inline">{selectedModelProvider}</span>
                <span>{selectedModelName}</span>
                <ChevronDownIcon className="size-3" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 cursor-pointer rounded-none",
                    selectedModel === model.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {model.provider} {model.description && `• ${model.description}`}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>

        <InputGroupTextarea
          className="text-base! py-2.5!"
          placeholder="I want to design an app that..."
          value={promptText}
          onChange={(e) => {
            setPromptText(e.target.value);
          }}
        />

        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-end"
        >
          {!hideSubmitBtn && (
            <InputGroupButton
              variant="default"
              className=""
              size="sm"
              disabled={!promptText?.trim() || isLoading}
              onClick={() => onSubmit?.()}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  Design
                  <CornerDownLeftIcon className="size-4" />
                </>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export default PromptInput;
