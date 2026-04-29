"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import DashboardSidebar from "../../_common/dashboard-sidebar";

export default function AppStoreScreensPage() {
  return (
    <div className="w-full h-screen overflow-hidden flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-16 px-6">
            <Link
              href="/mini-tools"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
              Back to Mini Tools
            </Link>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-border/60 mb-6">
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                size={26}
                color="currentColor"
                strokeWidth={1.5}
              />
            </div>

            <h1 className="font-bold text-3xl tracking-tight text-foreground">
              App Store Screens
            </h1>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              Generate beautiful App Store and Play Store screenshots from your
              designs. Branded backgrounds, captions, device frames, all sized
              for every platform.
            </p>

            <div className="mt-8 rounded-xl border border-border/60 bg-card p-5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Coming soon
              </span>
              <p className="text-sm text-foreground mt-3 font-medium">
                We are building this next.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                It will turn your designs into store-ready screenshots in 1
                click.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
