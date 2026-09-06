import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardSection from "../_common/dashboard-section";
import { CheckoutStatus } from "@/components/billing/checkout-status";
import { getSession } from "@/lib/auth";

/**
 * Dashboard route.
 *
 * Server-side responsibility: auth gate — redirect to /login if there's no
 * session. Everything else (profile, explore designs) loads on the client:
 * profile via ProfileProvider (single subscription), explore via its own
 * React Query call.
 *
 * Polar sends users back here with `?checkout=success`; CheckoutStatus turns
 * that into a toast and refreshes billing data.
 */
export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <Suspense fallback={null}>
        <CheckoutStatus />
      </Suspense>
      <DashboardSection />
    </div>
  );
}
