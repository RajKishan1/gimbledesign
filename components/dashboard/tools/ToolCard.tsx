"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "./tools-data";
import { TONE_STYLES } from "./tools-data";

/**
 * A single tool card.
 *
 * Layout:
 *   ┌────────────────────────────┐
 *   │  [colored image area]      │ ← gradient + glow + illustration
 *   │      [illustration]        │
 *   ├────────────────────────────┤
 *   │  Title                     │
 *   │  Description (2 lines) [→] │ ← arrow button bottom-right
 *   └────────────────────────────┘
 *
 * The card is wrapped in <Link>, so the whole thing is clickable.
 */
export default function ToolCard({ tool }: { tool: Tool }) {
  const tone = TONE_STYLES[tool.tone];
  const Illustration = tool.Illustration;

  return (
    <Link
      href={tool.href}
      aria-label={tool.title}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* ── Image area ─────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex h-44 items-center justify-center overflow-hidden",
          tone.background
        )}
      >
        {/* Soft glow halo behind the illustration */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-32 rounded-full opacity-70 blur-2xl",
            tone.glow
          )}
        />

        {/* Optional badge (e.g. "Beta", "New") */}
        {tool.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80 shadow-sm backdrop-blur">
            {tool.badge}
          </span>
        )}

        {/* The illustration itself */}
        <div className="relative">
          <Illustration />
        </div>
      </div>

      {/* ── Text + arrow ───────────────────────────────────────── */}
      <div className="flex flex-1 items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {tool.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
            {tool.description}
          </p>
        </div>

        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition-transform group-hover:translate-x-0.5"
        >
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
