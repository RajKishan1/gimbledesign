"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import DashboardSidebar from "../_common/dashboard-sidebar";
import Header from "../_common/header";
import { useExploreProjects } from "@/features/use-explore";
import { Spinner } from "@/components/ui/spinner";
import { openSauceOne } from "@/app/fonts";

export default function ExplorePage() {
  const { data: projects = [], isLoading } = useExploreProjects(50);

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
              <div className="flex justify-center py-20">
                <Spinner className="size-10" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
                <p className="text-muted-foreground">
                  No explore projects yet. Check back later or create your own and ask an admin to share it.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/project/${p.id}`}
                    className="group flex flex-col rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
                  >
                    <div className="h-36 relative overflow-hidden flex items-center justify-center">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt=""
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
                        {p.name}
                      </h3>
                      <p className="text-xs text-white/70">
                        {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })} •{" "}
                        {p.deviceType === "web" ? "Web" : p.deviceType === "mobile" ? "Mobile" : p.deviceType}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
