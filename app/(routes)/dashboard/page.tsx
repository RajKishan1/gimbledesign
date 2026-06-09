import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import DashboardSection from "../_common/dashboard-section";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Dashboard route.
 *
 * Server-side responsibilities:
 *   1. Auth gate — redirect to /login if there's no session.
 *   2. Prefetch ONLY the data that's needed for first paint above the fold
 *      (the user's recent projects). Profile + explore-projects load on
 *      the client — profile via ProfileProvider (single subscription), and
 *      explore via its own React Query call. Both feel instant because the
 *      welcome chip has a "there" fallback and the explore grid is below
 *      the fold.
 *
 * What was removed:
 *   - The outer <Suspense fallback> was dead code: DashboardSection is a
 *     client component that never throws a promise during render, so the
 *     spinner never showed. Removing it cuts a noop boundary.
 *   - The profile prefetch did 1–3 DB calls (find + maybe create + maybe
 *     update). It's now handled lazily by ProfileProvider when the user
 *     first lands, saving ~200–800ms off TTFB on cold connections.
 *   - The explore-projects prefetch was below-the-fold work paid up front.
 *     Moved to client-side fetch on render.
 */
export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const queryClient = new QueryClient();

  // Prefetch ONLY the projects list — above the fold and slow on cold cache.
  // Query key must exactly match useGetProjects(userId, 10, false) on the
  // client, otherwise the hydration boundary won't see it.
  await queryClient.prefetchQuery({
    queryKey: ["projects", 10, false],
    queryFn: () =>
      prisma.project.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          deviceType: true,
          theme: true,
          isFavorite: true,
          isExplore: true,
          shareToken: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
  });

  return (
    <div className="w-full">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardSection />
      </HydrationBoundary>
    </div>
  );
}
