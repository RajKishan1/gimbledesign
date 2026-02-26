"use client";

import { cn } from "@/lib/utils";
import {
  CodeIcon,
  DownloadIcon,
  GripVertical,
  MoreHorizontalIcon,
  Trash2Icon,
  Send,
  Wand2,
  Wand2Icon,
  Sparkles,
  Pencil,
  Eye,
  ChevronDown,
  Share2,
} from "lucide-react";
import { useState, useRef } from "react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverAnchor } from "../ui/popover";
import { InputGroup, InputGroupAddon } from "../ui/input-group";
import { Input } from "../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type PropsType = {
  title: string;
  frameId: string;
  projectId: string;
  isSelected?: boolean;
  disabled?: boolean;
  isDownloading: boolean;
  scale?: number;
  isRegenerating?: boolean;
  isDeleting?: boolean;
  isCopyingToFigma?: boolean;
  onOpenHtmlDialog: () => void;
  onDownloadPng?: () => void;
  onRegenerate?: (prompt: string) => void;
  onDeleteFrame?: () => void;
  onPasteToFigma?: () => void;
};

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 300C77.6142 300 100 277.614 100 250V200H50C22.3858 200 0 222.386 0 250C0 277.614 22.3858 300 50 300Z"
        fill="#0ACF83"
      />
      <path
        d="M0 150C0 122.386 22.3858 100 50 100H100V200H50C22.3858 200 0 177.614 0 150Z"
        fill="#A259FF"
      />
      <path
        d="M0 50C0 22.3858 22.3858 0 50 0H100V100H50C22.3858 100 0 77.6142 0 50Z"
        fill="#F24E1E"
      />
      <path
        d="M100 0H150C177.614 0 200 22.3858 200 50C200 77.6142 177.614 100 150 100H100V0Z"
        fill="#FF7262"
      />
      <path
        d="M200 150C200 177.614 177.614 200 150 200C122.386 200 100 177.614 100 150C100 122.386 122.386 100 150 100C177.614 100 200 122.386 200 150Z"
        fill="#1ABCFE"
      />
    </svg>
  );
}

const DeviceFrameToolbar = ({
  title,
  frameId,
  projectId,
  isSelected,
  disabled,
  scale = 1.7,
  isDownloading,
  isRegenerating = false,
  isDeleting = false,
  isCopyingToFigma = false,
  onOpenHtmlDialog,
  onDownloadPng,
  onRegenerate,
  onDeleteFrame,
  onPasteToFigma,
}: PropsType) => {
  const [promptValue, setPromptValue] = useState("");
  const [aiPopoverOpen, setAiPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRegenerate = () => {
    if (promptValue.trim()) {
      onRegenerate?.(promptValue);
      setPromptValue("");
      setAiPopoverOpen(false);
    }
  };

  // Open popover directly from button click (no dropdown) so nothing steals focus
  const openAiPopover = () => setAiPopoverOpen(true);

  const previewUrl = `/project/${projectId}/preview${frameId ? `?screen=${encodeURIComponent(frameId)}` : ""}`;

  return (
    <div
      className={cn(
        "absolute -mt-2 flex items-center justify-between gap-1 rounded-lg z-[110] border border-border bg-card shadow-sm",
        isSelected
          ? "left-1/2 -translate-x-1/2 pl-2 pr-1 py-1.5 min-w-[320px] h-[38px]"
          : "w-auto left-10 min-w-[140px] h-[32px] py-1 pl-2 pr-2",
      )}
      style={{
        top: isSelected ? "-70px" : "-38px",
        transformOrigin: "center top",
        transform: `scale(${scale})`,
      }}
    >
      {/* Screen name (left) - kept as-is */}
      <div
        role="button"
        className="flex flex-1 cursor-grab items-center justify-start gap-1.5 active:cursor-grabbing h-full min-w-0"
      >
        <GripVertical className="size-4 text-muted-foreground shrink-0" />
        <span
          className={cn(
            "font-medium text-sm truncate",
            isSelected ? "max-w-[120px]" : "max-w-[80px]",
          )}
          title={title}
        >
          {title}
        </span>
      </div>

      {isSelected && (
        <>
          <Separator orientation="vertical" className="h-5 bg-border mx-0.5" />

          <div className="flex items-center gap-0.5 relative">
            {/* Generate & Modify open the same AI popover (no dropdown = no focus steal) */}
            <Popover open={aiPopoverOpen} onOpenChange={setAiPopoverOpen}>
              <PopoverAnchor asChild>
                <span className="absolute left-0 top-0 w-1 h-7" aria-hidden />
              </PopoverAnchor>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 rounded-md text-foreground hover:bg-accent"
                disabled={disabled}
                onClick={openAiPopover}
              >
                <Sparkles className="size-3.5" />
                <span className="text-xs font-medium">Generate</span>
                <ChevronDown className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 rounded-md text-foreground hover:bg-accent"
                disabled={disabled}
                onClick={openAiPopover}
              >
                <Pencil className="size-3.5" />
                <span className="text-xs font-medium">Modify</span>
                <ChevronDown className="size-3" />
              </Button>
              <PopoverContent
                align="start"
                className="w-80 p-3 rounded-lg"
                side="bottom"
                sideOffset={4}
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  inputRef.current?.focus();
                }}
              >
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Describe changes to regenerate this screen
                  </p>
                  <InputGroup className="bg-transparent border-0 shadow-none ring-0 px-0">
                    <Input
                      ref={inputRef}
                      placeholder="Edit with AI..."
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      className="ring-0 border-0 shadow-none bg-transparent"
                      onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        size="icon-sm"
                        disabled={!promptValue.trim() || isRegenerating}
                        onClick={handleRegenerate}
                      >
                        {isRegenerating ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </PopoverContent>
            </Popover>

            {/* Preview */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1.5 rounded-md text-foreground hover:bg-accent"
                    onClick={() => window.open(previewUrl, "_blank")}
                  >
                    <Eye className="size-3.5" />
                    <span className="text-xs font-medium">Preview</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Open prototype preview in new tab
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* More dropdown */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1.5 rounded-md text-foreground hover:bg-accent"
                      >
                        <MoreHorizontalIcon className="size-3.5" />
                        <span className="text-xs font-medium">More</span>
                        <ChevronDown className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-52 rounded-lg p-1">
                <DropdownMenuItem
                  disabled={disabled}
                  onClick={onOpenHtmlDialog}
                  className="cursor-pointer gap-2"
                >
                  <CodeIcon className="size-4" />
                  View code
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={disabled || isCopyingToFigma}
                  onClick={onPasteToFigma}
                  className="cursor-pointer gap-2"
                >
                  {isCopyingToFigma ? (
                    <Spinner className="size-4" />
                  ) : (
                    <FigmaIcon className="size-4" />
                  )}
                  Copy to Figma
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                    <Share2 className="size-4" />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-lg">
                    <DropdownMenuItem
                      disabled={disabled || isDownloading}
                      onClick={onDownloadPng}
                      className="cursor-pointer gap-2"
                    >
                      {isDownloading ? (
                        <Spinner className="size-4" />
                      ) : (
                        <DownloadIcon className="size-4" />
                      )}
                      Download as PNG
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  disabled={disabled || isDownloading}
                  onClick={onDownloadPng}
                  className="cursor-pointer gap-2"
                >
                  {isDownloading ? (
                    <Spinner className="size-4" />
                  ) : (
                    <DownloadIcon className="size-4" />
                  )}
                  Download
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem
                  disabled={disabled || isDeleting}
                  onClick={onDeleteFrame}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceFrameToolbar;
