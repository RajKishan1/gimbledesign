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
    // Open preview in new tab
    const previewUrl = `/project/${projectId}/preview`;
    window.open(previewUrl, "_blank");
    onPlay?.();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mode Toggle Switch */}
      <div
        className={cn(
          "relative flex items-center p-1 rounded-lg",
          "bg-gray-100 dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700"
        )}
      >
        {/* Animated background indicator */}
        <motion.div
          className={cn(
            "absolute h-[calc(100%-8px)] rounded-md",
            mode === "design"
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "bg-indigo-500 shadow-md"
          )}
          initial={false}
          animate={{
            x: mode === "design" ? 4 : "calc(100% + 4px)",
            width: mode === "design" ? "76px" : "94px",
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
              mode === m.id
                ? m.id === "prototype"
                  ? "text-white"
                  : "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Link count badge (only in prototype mode) */}
      {mode === "prototype" && links.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "bg-indigo-100 dark:bg-indigo-900/50",
            "text-indigo-600 dark:text-indigo-300",
            "text-xs font-medium"
          )}
        >
          <Link2 className="w-3 h-3" />
          {links.length} link{links.length !== 1 ? "s" : ""}
        </motion.div>
      )}

      {/* Play Button (only in prototype mode) */}
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
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gradient-to-r from-indigo-500 to-purple-500",
                  "hover:from-indigo-600 hover:to-purple-600",
                  "text-white font-medium shadow-md",
                  "transition-all duration-200 hover:scale-105 hover:shadow-lg"
                )}
                disabled={links.length === 0}
              >
                <Play className="w-4 h-4 fill-current" />
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
