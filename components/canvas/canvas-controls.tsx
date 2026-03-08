import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/canvas";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Hand,
  ImagePlus,
  MousePointer2,
  ZoomIn,
  ZoomOut,
} from "./canvas-toolbar-icons";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type PropsType = {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomPercent: number;
  toolMode: ToolModeType;
  setToolMode: (toolMode: ToolModeType) => void;
  onInsertImage?: () => void;
};
const CanvasControls = ({
  zoomIn,
  zoomOut,
  zoomPercent,
  toolMode,
  setToolMode,
  onInsertImage,
}: PropsType) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="
          -translate-x-1/2 absolute bottom-4 left-1/2
          flex items-center gap-3 rounded-full border
          dark:bg-[#242424] bg-white py-1.5 px-4 shadow-sm text-black! dark:text-white!
        "
      >
        {/* Tools: Select + Grab canvas */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className={cn(
                  "rounded-full cursor-pointer hover:bg-white/20! text-black! dark:text-white!",
                  toolMode === TOOL_MODE_ENUM.SELECT && "bg-white/20"
                )}
                onClick={() => setToolMode(TOOL_MODE_ENUM.SELECT)}
              >
                <MousePointer2 size={18} strokeWidth={1.75} className="shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Select
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className={cn(
                  "rounded-full cursor-pointer hover:bg-white/20! text-black! dark:text-white!",
                  toolMode === TOOL_MODE_ENUM.HAND && "bg-white/20"
                )}
                onClick={() => setToolMode(TOOL_MODE_ENUM.HAND)}
              >
                <Hand size={18} strokeWidth={1.75} className="shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Grab canvas
            </TooltipContent>
          </Tooltip>
        </div>

        {onInsertImage && (
          <>
            <Separator orientation="vertical" className="h-5! bg-white/30" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-full cursor-pointer hover:bg-white/20! text-black! dark:text-white!"
                  onClick={onInsertImage}
                >
                  <ImagePlus size={18} strokeWidth={1.75} className="shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Add image
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <Separator orientation="vertical" className="h-5! bg-white/30" />
        {/* Zoom: Out | % | In */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full cursor-pointer hover:bg-white/20! text-black! dark:text-white!"
                onClick={() => zoomOut()}
              >
                <ZoomOut size={18} strokeWidth={1.75} className="shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom out
            </TooltipContent>
          </Tooltip>
          <div className="min-w-10 text-center text-sm tabular-nums" title="Zoom level">
            {zoomPercent}%
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full cursor-pointer hover:bg-white/20! text-black! dark:text-white!"
                onClick={() => zoomIn()}
              >
                <ZoomIn size={18} strokeWidth={1.75} className="shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom in
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CanvasControls;
