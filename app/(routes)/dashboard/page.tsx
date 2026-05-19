import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import DashboardSection from "../_common/dashboard-section";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizeRole } from "@/types/user";

// Dashboard runs server-side: it authenticates, prefetches projects/explore/profile
// in parallel via Prisma, and hands a dehydrated React Query cache to the client.
// The existing `DashboardSection` hooks (useGetProjects, useExploreProjects,
// useGetProfile) read from this cache on first render — no fetch round-trip,
// no empty flash.
export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const userId = user.id;
  const queryClient = new QueryClient();

  await Promise.all([
    // Mirrors GET /api/project — same select, same order. Query key must match
    // useGetProjects(userId, 10, false): ["projects", 10, false].
    queryClient.prefetchQuery({
      queryKey: ["projects", 10, false],
      queryFn: () =>
        prisma.project.findMany({
          where: { userId },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            thumbnail: true,
            deviceType: true,
            theme: true,
            isFavorite: true,
            isExplore: true,
            shareToken: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
    }),
    // Mirrors GET /api/explore. Query key from useExploreProjects(8): ["explore", 8].
    queryClient.prefetchQuery({
      queryKey: ["explore", 8],
      queryFn: () =>
        prisma.project.findMany({
          where: { isExplore: true },
          take: 8,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            thumbnail: true,
            deviceType: true,
            theme: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
    }),
    // Mirrors GET /api/profile (including find-or-create). Query key: ["profile"].
    queryClient.prefetchQuery({
      queryKey: ["profile"],
      queryFn: async () => {
        let userRecord = await prisma.user.findUnique({
          where: { userId },
        });
        if (!userRecord) {
          userRecord = await prisma.user.create({
            data: {
              userId,
              credits: 30.0,
              totalCreditsUsed: 0.0,
              name: user.name ?? null,
              email: user.email ?? null,
              profilePicture: user.image ?? null,
            },
          });
        } else if (
          !userRecord.name ||
          !userRecord.email ||
          !userRecord.profilePicture
        ) {
          userRecord = await prisma.user.update({
            where: { userId },
            data: {
              name: userRecord.name || user.name || null,
              email: userRecord.email || user.email || null,
              profilePicture: userRecord.profilePicture || user.image || null,
            },
          });
        }
        return {
          id: userRecord.id,
          userId: userRecord.userId,
          role: normalizeRole(userRecord.role),
          name: userRecord.name || user.name || "",
          email: userRecord.email || user.email || "",
          profilePicture: userRecord.profilePicture || user.image || null,
          headerImage: userRecord.headerImage,
          credits: userRecord.credits,
          totalCreditsUsed: userRecord.totalCreditsUsed || 0,
        };
      },
    }),
  ]);

  return (
    <div className="w-full">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className="w-full min-h-screen flex items-center justify-center bg-card">
              <Spinner className="size-10" />
            </div>
          }
        >
          <DashboardSection />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
