"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Layout01Icon,
  MagicWand01Icon,
  SmartPhone01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import DashboardSidebar from "../_common/dashboard-sidebar";
import { cn } from "@/lib/utils";

function WireframePreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col gap-2 w-[60%]">
        <div className="h-3 rounded-md border border-foreground/15 bg-background/40" />
        <div className="h-10 rounded-md border border-foreground/15 bg-background/40" />
        <div className="h-6 rounded-md border border-foreground/15 bg-background/40" />
      </div>
    </div>
  );
}

function ReimaginePreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-24 h-24">
        <div className="absolute left-0 top-2 w-16 h-16 rounded-lg border border-foreground/15 bg-background/40" />
        <div className="absolute right-0 bottom-0 w-16 h-16 rounded-lg border border-foreground/20 bg-foreground/5" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm text-foreground">
          <HugeiconsIcon
            icon={MagicWand01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}

function AppStoreScreensPreview() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-2">
      <div className="flex items-end gap-2">
        <div className="w-12 h-20 rounded-md border border-foreground/15 bg-background/40 -rotate-6 flex flex-col items-center pt-1">
          <div className="w-4 h-1 rounded-full bg-foreground/20" />
        </div>
        <div className="w-14 h-24 rounded-md border border-foreground/15 bg-background/50 flex flex-col items-center pt-1.5 z-10">
          <div className="w-5 h-1 rounded-full bg-foreground/20" />
        </div>
        <div className="w-12 h-20 rounded-md border border-foreground/15 bg-background/40 rotate-6 flex flex-col items-center pt-1">
          <div className="w-4 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
}

const tools = [
  {
    id: "wireframe",
    title: "Wireframe",
    valueProp: "Sketch low-fidelity layouts in seconds",
    cta: "Open Wireframe",
    href: "/dashboard?mini=wireframe",
    icon: Layout01Icon,
    accent: "from-blue-500/20 to-indigo-500/10",
    preview: <WireframePreview />,
    badge: undefined as string | undefined,
  },
  {
    id: "reimagine",
    title: "Reimagine",
    valueProp: "Turn any screenshot into a better design",
    cta: "Open Reimagine",
    href: "/dashboard?mini=inspirations",
    icon: MagicWand01Icon,
    accent: "from-fuchsia-500/20 to-pink-500/10",
    preview: <ReimaginePreview />,
    badge: undefined as string | undefined,
  },
  {
    id: "app-store",
    title: "App Store Screens",
    valueProp: "Generate marketing-ready store screenshots",
    cta: "Coming soon",
    href: "/mini-tools/app-store-screens",
    icon: SmartPhone01Icon,
    accent: "from-amber-500/20 to-orange-500/10",
    preview: <AppStoreScreensPreview />,
    badge: "Coming soon" as string | undefined,
  },
];

const workflows = [
  {
    label: "Turn sketch into app UI",
    href: "/dashboard?mini=wireframe",
    icon: Layout01Icon,
  },
  {
    label: "Reimagine a screenshot",
    href: "/dashboard?mini=inspirations",
    icon: MagicWand01Icon,
  },
  {
    label: "Generate App Store screenshots",
    href: "/mini-tools/app-store-screens",
    icon: SmartPhone01Icon,
  },
];

export default function MiniToolsPage() {
  return (
    <div className="w-full h-screen overflow-hidden flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto py-12 px-6">
            <div className="max-w-3xl mb-10">
              <h1 className="font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Mini Tools
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Focused utilities for sketching, reimagining and shipping
                designs. Pick a tool below or jump into a popular workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={cn(
                    "group flex flex-col h-[320px] rounded-2xl border border-border/60 bg-card overflow-hidden",
                    "transition-all duration-200",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
                    "hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] hover:border-border hover:-translate-y-0.5"
                  )}
                >
                  <div
                    className={cn(
                      "relative h-40 overflow-hidden bg-gradient-to-br",
                      tool.accent
                    )}
                  >
                    {tool.preview}
                    {tool.badge && (
                      <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/5 text-foreground">
                        <HugeiconsIcon
                          icon={tool.icon}
                          size={18}
                          color="currentColor"
                          strokeWidth={1.75}
                        />
                      </div>
                      <h2 className="font-semibold text-base text-foreground">
                        {tool.title}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {tool.valueProp}
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
                      {tool.cta}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={2}
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Popular workflows
              </h3>
              <div className="flex flex-wrap gap-2">
                {workflows.map((w) => (
                  <Link
                    key={w.label}
                    href={w.href}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/60 bg-card hover:bg-accent hover:border-border text-sm text-foreground transition-colors"
                  >
                    <HugeiconsIcon
                      icon={w.icon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.75}
                      className="text-muted-foreground"
                    />
                    {w.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
