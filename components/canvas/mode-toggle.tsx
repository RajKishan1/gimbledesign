"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePrototype, CanvasMode } from "@/context/prototype-context";
import { cn } from "@/lib/utils";
import { Pencil, GitBranch, Play, Link2 } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface ModeToggleProps {
  projectId: string;
  onPlay?: () => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ projectId, onPlay }) => {
  const { mode, setMode, links } = usePrototype();

  const modes: { id: CanvasMode; label: string; icon: React.ReactNode }[] = [
    {
      id: "design",
      label: "Design",
      icon: <Pencil className="w-4 h-4" />,
    },
    {
      id: "prototype",
      label: "Prototype",
      icon: <GitBranch className="w-4 h-4" />,
    },
  ];

  const handleOpenPreview = () => {
    const previewUrl = `/project/${projectId}/preview`;
    window.open(previewUrl, "_blank");
    onPlay?.();
  };

  const designButtonWidth = 76;
  const prototypeButtonWidth = 94;
  const padding = 4;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "relative flex items-center p-1 rounded-lg",
          "bg-muted",
          "border border-border"
        )}
      >
        <motion.div
          className={cn(
            "absolute h-[calc(100%-8px)] rounded-md",
            "bg-background shadow-sm",
            "border border-border"
          )}
          initial={false}
          animate={{
            x: mode === "design" ? padding : designButtonWidth + padding,
            width: mode === "design" ? designButtonWidth : prototypeButtonWidth,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />

        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md",
              "text-sm font-medium transition-colors duration-200",
              "min-w-fit",
              mode === m.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {mode === "prototype" && links.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
            "bg-secondary text-secondary-foreground",
            "text-xs font-medium",
            "border border-border"
          )}
        >
          <Link2 className="w-3 h-3" />
          {links.length} link{links.length !== 1 ? "s" : ""}
        </motion.div>
      )}

      {mode === "prototype" && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleOpenPreview}
                variant="default"
                size="sm"
                disabled={links.length === 0}
              >
                <Play className="w-4 h-4" />
                <span>Play</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {links.length === 0
                ? "Add links between screens to preview"
                : "Preview prototype in new tab"}
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </div>
  );
};

export default ModeToggle;
