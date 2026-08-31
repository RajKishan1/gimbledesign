import React, { CSSProperties } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

type PropsType = {
  style: CSSProperties;
};

/**
 * Placeholder shown while a screen's HTML is being generated: a slowly
 * drifting pastel gradient (`.generating-gradient` in globals.css) with
 * ghost layout blocks and a centered "Generating…" pill.
 */
const DeviceFrameSkeleton = ({ style }: PropsType) => {
  return (
    <div
      className="generating-gradient absolute origin-center overflow-hidden shadow-sm ring"
      style={style}
    >
      {/* Soft glow so the centre reads lighter than the edges. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),rgba(255,255,255,0)_70%)]"
      />

      {/* Ghost layout blocks — hint at the screen being built. */}
      <div aria-hidden className="relative p-4 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/40">
          <div className="h-5 w-5 rounded-md bg-white/45" />
          <div className="h-4 w-32 rounded-md bg-white/45" />
        </div>
        <div className="h-6 w-3/4 rounded-md bg-white/45" />
        <div className="h-4 w-full rounded-md bg-white/35" />
        <div className="h-4 w-5/6 rounded-md bg-white/35" />
        <div className="h-48 w-full rounded-xl bg-white/40" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded-md bg-white/35" />
          <div className="h-4 w-2/3 rounded-md bg-white/35" />
        </div>
      </div>

      {/* Centered status pill. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
          <HugeiconsIcon
            icon={SparklesIcon}
            size={16}
            color="currentColor"
            strokeWidth={2}
            className="animate-pulse text-violet-500"
          />
          Generating
          <span className="flex gap-0.5" aria-hidden>
            <span className="size-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
            <span className="size-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
            <span className="size-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
          </span>
        </span>
      </div>
    </div>
  );
};

export default DeviceFrameSkeleton;
