"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ToolCard from "./ToolCard";
import { TOOLS } from "./tools-data";

/**
 * The "Tools" section on the dashboard.
 *
 * Renders:
 *  - Heading on the left (title + subtitle)
 *  - Search input + filter dropdown on the right
 *  - Responsive grid of ToolCards below
 *
 * The search box filters cards client-side by matching the typed text
 * against each tool's title and description.
 *
 * The filter dropdown is currently a visual placeholder. Wire it up
 * when you have categories/tags on `Tool` in `tools-data.ts`.
 */
export default function ToolsSection() {
  const [query, setQuery] = useState("");

  // Filter the TOOLS list by the search query.
  const filteredTools = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return TOOLS;
    return TOOLS.filter(
      (tool) =>
        tool.title.toLowerCase().includes(trimmed) ||
        tool.description.toLowerCase().includes(trimmed)
    );
  }, [query]);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        {/* ── Section header ──────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Tools
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Powerful utilities to help you design, reimagine and ship amazing
              products faster.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Search input */}
            <div className="flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card px-4 shadow-sm transition-colors focus-within:border-border">
              <Search
                className="size-4 text-muted-foreground"
                aria-hidden
              />
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

        {/* ── Tool cards grid ─────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Empty state when search returns nothing. */}
        {filteredTools.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No tools match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </section>
  );
}
