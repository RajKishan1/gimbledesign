import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizeRole } from "@/types/user";
import { openSauceOne } from "@/app/fonts";
import DashboardSidebar from "../_common/dashboard-sidebar";
import AdminExploreDesigns from "@/components/admin/AdminExploreDesigns";

/**
 * Admin panel — manage the "Explore designs" tiles surfaced on the dashboard.
 *
 * Server-side guards:
 *   - No session → /login
 *   - Authenticated but role !== "admin" → /dashboard
 *
 * The `role` field can only be flipped at the database level (by design), so
 * there's no admin-promotion API. See the User model in prisma/schema.prisma.
 */
export default async function AdminPage() {
  const session = await getSession(await headers());
  if (!session?.user) {
    redirect("/login");
  }

  const userRecord = await prisma.user.findUnique({
    where: { userId: session.user.id },
  });
  if (normalizeRole(userRecord?.role) !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div
      className={`w-full h-screen overflow-hidden flex ${openSauceOne.className}`}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <AdminExploreDesigns />
        </main>
      </div>
    </div>
  );
}
