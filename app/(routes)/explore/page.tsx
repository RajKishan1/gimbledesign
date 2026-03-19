"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import DashboardSidebar from "../_common/dashboard-sidebar";
import Header from "../_common/header";
import { useExploreProjects, ExploreProject } from "@/features/use-explore";
import { Spinner } from "@/components/ui/spinner";
import { openSauceOne } from "@/app/fonts";

const PAGE_SIZE = 12;

function ShimmerCard() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-neutral-900 dark:bg-neutral-800">
      <div className="h-36 relative overflow-hidden bg-neutral-800 dark:bg-neutral-700">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-neutral-800 dark:bg-neutral-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-3 w-1/2 rounded bg-neutral-800 dark:bg-neutral-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function ShimmerGrid({ count = 10, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

const ExploreCard = memo(function ExploreCard({ project }: { project: ExploreProject }) {
  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-lg bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
    >
      <div className="h-36 relative overflow-hidden flex items-center justify-center">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-left scale-110 opacity-90"
          />
        ) : (
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
            Project
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[15px] leading-[1.4] mb-1 line-clamp-1 text-white">
          {project.name}
        </h3>
        <p className="text-xs text-white/70">
          {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })} •{" "}
          {project.deviceType === "web" ? "Web" : project.deviceType === "mobile" ? "Mobile" : project.deviceType}
        </p>
      </div>
    </Link>
  );
});

export default function ExplorePage() {
  const { data: projects = [], isLoading } = useExploreProjects(50);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < projects.length;

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, projects.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, projects.length]);

  // Reset visible count when projects change (e.g. refetch)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [projects.length]);

  const visibleProjects = projects.slice(0, visibleCount);

  return (
    <div className={`w-full h-screen overflow-hidden flex ${openSauceOne.className}`}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="font-bold text-3xl tracking-tight text-foreground">
                Explore
              </h1>
              <p className="text-muted-foreground mt-1">
                Community designs shared by creators. Open any project to view and get inspired.
              </p>
            </div>
            {isLoading ? (
              <ShimmerGrid count={10} />
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
                <p className="text-muted-foreground">
                  No explore projects yet. Check back later or create your own and ask an admin to share it.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {visibleProjects.map((p) => (
                    <ExploreCard key={p.id} project={p} />
                  ))}
                </div>
                {hasMore && (
                  <div ref={loaderRef} className="flex justify-center py-8">
                    <Spinner className="size-6" />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
