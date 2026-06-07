"use client";

import { memo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Tool } from "./tools-data";
import { TONE_STYLES } from "./tools-data";

/**
 * A single tool card.
 *
 * Layout (both tiers — the difference is just typography weight + size,
 * since featured cards are in a wider-column grid so they come out bigger):
 *   ┌────────────────────────┐
 *   │   [colored 4:3 area]   │  ← gradient + glow + illustration
 *   │     [illustration]     │
 *   ├────────────────────────┤
 *   │   Title (Beta)         │  ← single line + optional inline badge
 *   └────────────────────────┘
 *
 * Shadow stack:
 *  - Rest:  layered subtle drop shadow + tiny ambient — feels "real" but quiet.
 *  - Hover: deeper lifted shadow, card translates up 4px, border darkens.
 *  - All transitions on `duration-300 ease-out` so the lift feels smooth.
 */
function ToolCardImpl({ tool }: { tool: Tool }) {
  const tone = TONE_STYLES[tool.tone];
  const Illustration = tool.Illustration;
  const isFeatured = tool.tier === "featured";

  return (
    <Link
      href={tool.href}
      aria-label={tool.title}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-foreground/10",
        // Layered soft shadow — quiet at rest, real lift on hover.
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_10px_-2px_rgba(0,0,0,0.08),0_16px_28px_-8px_rgba(0,0,0,0.08)]",
      )}
    >
      {/* ── Image area (square-ish, holds the illustration) ──────── */}
      <div
        className={cn(
          "relative flex aspect-[4/3] items-center justify-center overflow-hidden",
          tone.background,
        )}
      >
        {/* Soft glow halo behind the illustration */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full opacity-70 blur-2xl",
            isFeatured ? "size-28 sm:size-32" : "size-20 sm:size-24",
            tone.glow,
          )}
        />

        {/* Illustration — slight scale on featured so the bigger card
            doesn't end up with a small graphic floating in the middle. */}
        <div
          className={cn(
            "relative transition-transform duration-300 ease-out group-hover:scale-105",
            isFeatured ? "scale-90 sm:scale-100" : "scale-75 sm:scale-90",
          )}
        >
          <Illustration />
        </div>
      </div>

      {/* ── Title row (one line, optional inline badge) ─────────── */}
      <div
        className={cn(
          "flex items-baseline gap-1 px-3",
          isFeatured ? "py-3" : "py-2.5",
        )}
      >
        <h3
          className={cn(
            "truncate text-foreground",
            isFeatured
              ? "text-sm font-semibold"
              : "text-[13px] font-medium",
          )}
        >
          {tool.title}
        </h3>
        {tool.badge && (
          <span
            className={cn(
              "shrink-0 font-normal text-muted-foreground",
              isFeatured ? "text-xs" : "text-[11px]",
            )}
          >
            ({tool.badge})
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * memo'd because the parent (ToolsSection) re-renders on every keystroke
 * in the search box, which would otherwise re-render all 14 cards even when
 * only one or two should appear/disappear.
 */
const ToolCard = memo(ToolCardImpl, (prev, next) => prev.tool.id === next.tool.id);
ToolCard.displayName = "ToolCard";
export default ToolCard;
