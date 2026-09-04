import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardSection from "../_common/dashboard-section";
import { getSession } from "@/lib/auth";

/**
 * Dashboard route.
 *
 * Server-side responsibility: auth gate — redirect to /login if there's no
 * session. Everything else (profile, explore designs) loads on the client:
 * profile via ProfileProvider (single subscription), explore via its own
 * React Query call.
 *
 * The projects prefetch that used to live here was removed along with the
 * dashboard's "My Projects" section — projects now live only on /projects.
 */
export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <DashboardSection />
    </div>
  );
}
