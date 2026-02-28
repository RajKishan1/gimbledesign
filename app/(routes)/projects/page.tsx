"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import DashboardSidebar from "../_common/dashboard-sidebar";
import Header from "../_common/header";
import { useGetProjects } from "@/features/use-project";
import { useGetProfile } from "@/features/use-profile";
import {
  useMoveProjectToExplore,
} from "@/features/use-explore";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { openSauceOne } from "@/app/fonts";
import { ProjectType } from "@/types/project";
import { ArrowLeft } from "lucide-react";
import { ProjectsGrid } from "../_common/dashboard-section";

export default function ProjectsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const { data: profile } = useGetProfile();
  const { data: projects = [], isLoading } = useGetProjects(user?.id, undefined);
  const moveToExplore = useMoveProjectToExplore();
  const isAdmin = profile?.role === "admin";

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div
      className={`w-full h-screen overflow-hidden flex ${openSauceOne.className}`}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto px-6 py-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
            <div className="mb-8">
              <h1 className="font-bold text-3xl tracking-tight text-foreground">
                All Projects
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage all your projects.
              </p>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner className="size-10" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
                <p className="text-muted-foreground">
                  No projects yet. Create one from the dashboard.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <ProjectsGrid
                projects={projects as ProjectType[]}
                isAdmin={isAdmin}
                onMoveToExplore={moveToExplore.mutate}
                isMovingToExplore={moveToExplore.isPending}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
