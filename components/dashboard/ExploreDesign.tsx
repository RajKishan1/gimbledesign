"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useExploreDesigns,
  type ExploreDesign as Design,
} from "@/features/use-explore-designs";
/*print*/

/**
 * Inject Cloudinary delivery transforms so we don't ship a 2 MB original
 * for a 200 px tile. `f_auto` → AVIF/WebP when supported, `q_auto` → smart
 * quality, `w_500` → resized to roughly the card width. Roughly 10–20×
 * smaller than the raw upload, with no visible quality loss at this size.
 */
function optimizeCloudinaryUrl(url: string, width = 500) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width},c_limit/`,
  );
}

/* ─────────────────────── Filter pills ─────────────────────── */

type FilterValue = "all" | "mobile" | "web";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mobile", label: "Mobile App" },
  { value: "web", label: "Web Platform" },
];

/* ─────────────────────── Main component ─────────────────────── */

export default function ExploreDesign() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const { data: designs = [], isLoading } = useExploreDesigns();

  // Filter client-side for instant tab switches (no extra request).
  const filtered = useMemo(() => {
    if (filter === "all") return designs;
    return designs.filter((d) => d.category === filter);
  }, [designs, filter]);

  return (
    <section className="w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
        {/* Header row: title + filter pills + "View all" link */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Explore designs
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    filter === f.value
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {isLoading ? (
            <ShimmerCards />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((design) => (
              <DesignCard key={design.id} design={design} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Card ─────────────────────── */

const DesignCard = memo(function DesignCard({ design }: { design: Design }) {
  const card = (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizeCloudinaryUrl(design.imageUrl)}
        alt={design.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  );

  // When a link is set, wrap the card; otherwise it's just an image.
  if (design.link) {
    return (
      <Link href={design.link} aria-label={design.title}>
        {card}
      </Link>
    );
  }
  return card;
});

/* ─────────────────────── Loading + empty states ─────────────────────── */

function ShimmerCards() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] animate-pulse rounded-2xl bg-muted"
        />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
      <p className="text-sm text-muted-foreground">
        No designs to show yet. Admins can upload designs to appear here.
      </p>
    </div>
  );
}
