"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Layout01Icon,
  MagicWand01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import DashboardSidebar from "../_common/dashboard-sidebar";
import Header from "../_common/header";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "wireframe",
    title: "Wireframe",
    description:
      "Generate low-fidelity wireframes. One responsive web layout (shown at 3 sizes) or one mobile screen.",
    href: "/dashboard?mini=wireframe",
    icon: Layout01Icon,
  },
  {
    id: "reimagine",
    title: "Reimagine",
    description:
      "Upload an image or describe a design and get multiple visual variations. Great for exploring directions.",
    href: "/dashboard?mini=inspirations",
    icon: MagicWand01Icon,
  },
];

export default function MiniToolsPage() {
  return (
    <div className="w-full h-screen overflow-hidden flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto py-12 px-6">
            <div className="mb-10">
              <h1 className="font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Mini Tools
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Small utilities for wireframes and design exploration. More tools
                coming soon.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={cn(
                    "group flex flex-col rounded-xl border border-border bg-card p-6",
                    "shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      <HugeiconsIcon
                        icon={tool.icon}
                        size={22}
                        color="currentColor"
                        strokeWidth={1.75}
                      />
                    </div>
                    <h2 className="font-semibold text-lg text-foreground">
                      {tool.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Open
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      color="currentColor"
                      strokeWidth={2}
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
