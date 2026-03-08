import { Suspense } from "react";
import DashboardSection from "../_common/dashboard-section";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className="w-full min-h-screen flex items-center justify-center bg-card">
            <Spinner className="size-10" />
          </div>
        }
      >
        <DashboardSection />
      </Suspense>
    </div>
  );
}
