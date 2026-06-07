"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ToolCard from "./ToolCard";
import { TOOLS, type Tool } from "./tools-data";

/**
 * The "Tools" section on the dashboard.
 *
 * Layout (two rows):
 *  - Featured row on top: 6 larger cards (1 row at lg+).
 *  - Standard row below: 8 compact cards (1 row at xl+, wraps below).
 *  - Search filters both tiers in place; empty tiers hide themselves so
 *    results stay dense and aligned.
 */
export default function ToolsSection() {
  const [query, setQuery] = useState("");

  // Filter once, then split into tiers for rendering.
  const { featured, standard } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const matches = (t: Tool) =>
      !trimmed || t.title.toLowerCase().includes(trimmed);

    return {
      featured: TOOLS.filter((t) => t.tier === "featured" && matches(t)),
      standard: TOOLS.filter((t) => t.tier === "standard" && matches(t)),
    };
  }, [query]);

  const hasResults = featured.length + standard.length > 0;

  return (
    <section className="w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
        {/* ── Section header ──────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Tools
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Powerful utilities to help you design, reimagine and ship amazing
              products faster.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Search input */}
            <div className="flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card px-4 shadow-sm transition-colors focus-within:border-border">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <input
                type="search"
                placeholder="Search tools..."
                aria-label="Search tools"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-40 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:w-48"
              />
            </div>

            {/* Filter dropdown — placeholder, wire up later. */}
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              All Tools
              <ChevronDown
                className="size-4 text-muted-foreground"
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* ── Featured row — 6 cards, 1 row at lg+ ──────────────────── */}
        {featured.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* ── Standard row — 8 cards, 1 row at xl+, wraps below ─── */}
        {standard.length > 0 && (
          <div
            className={
              (featured.length > 0 ? "mt-4" : "mt-8") +
              " grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            }
          >
            {standard.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Empty state when search returns nothing. */}
        {!hasResults && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No tools match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </section>
  );
}
