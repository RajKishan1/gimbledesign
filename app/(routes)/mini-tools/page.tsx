"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  BrowserIcon,
  CubeIcon,
  Edit02Icon,
  EraserIcon,
  Image01Icon,
  Layers01Icon,
  Layout01Icon,
  MagicWand01Icon,
  PencilEdit02Icon,
  Search01Icon,
  ShoppingBag01Icon,
  SmartPhone01Icon,
  SourceCodeIcon,
  StarIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import DashboardSidebar from "../_common/dashboard-sidebar";
import NavBar from "@/components/dashboard/NavBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Category = "Design" | "Generate" | "Edit" | "Export";

type Tool = {
  id: string;
  title: string;
  description: string;
  /** Set only for tools that actually exist — the rest show "Coming soon". */
  href?: string;
  badge?: string;
  icon: typeof Layout01Icon;
  /** Pastel tile background + icon color. */
  tile: string;
  iconColor: string;
  category: Category;
};

const TOOLS: Tool[] = [
  {
    id: "wireframe",
    title: "Wireframe",
    description: "Sketch low-fidelity layouts in seconds",
    href: "/dashboard?mini=wireframe",
    icon: Layout01Icon,
    tile: "bg-indigo-50 dark:bg-indigo-500/10",
    iconColor: "text-indigo-500",
    category: "Design",
  },
  {
    id: "reimagine",
    title: "Reimagine",
    description: "Turn any screenshot into a better design",
    href: "/dashboard?mini=inspirations",
    icon: MagicWand01Icon,
    tile: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
    iconColor: "text-fuchsia-500",
    category: "Design",
  },
  {
    id: "app-store",
    title: "App Store Screens",
    description: "Generate marketing-ready store screenshots",
    href: "/mini-tools/app-store-screens",
    icon: SmartPhone01Icon,
    tile: "bg-orange-50 dark:bg-orange-500/10",
    iconColor: "text-orange-500",
    category: "Export",
  },
  {
    id: "magic-edit",
    title: "Magic Edit",
    description: "Edit any part of your design with simple prompts",
    badge: "Beta",
    icon: Edit02Icon,
    tile: "bg-green-50 dark:bg-green-500/10",
    iconColor: "text-green-600",
    category: "Edit",
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Create consistent styles and components",
    icon: TextFontIcon,
    tile: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-500",
    category: "Design",
  },
  {
    id: "image-generator",
    title: "Image Generator",
    description: "Generate original images for your projects",
    icon: Image01Icon,
    tile: "bg-violet-50 dark:bg-violet-500/10",
    iconColor: "text-violet-500",
    category: "Generate",
  },
  {
    id: "ai-mockups",
    title: "AI Mockups",
    description: "Create realistic device mockups instantly",
    icon: SmartPhone01Icon,
    tile: "bg-sky-50 dark:bg-sky-500/10",
    iconColor: "text-sky-600",
    category: "Generate",
  },
  {
    id: "icon-generator",
    title: "Icon Generator",
    description: "Generate beautiful icons in any style",
    icon: StarIcon,
    tile: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-500",
    category: "Generate",
  },
  {
    id: "remove-background",
    title: "Remove Background",
    description: "Remove image backgrounds in one click",
    icon: EraserIcon,
    tile: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-500",
    category: "Edit",
  },
  {
    id: "brand-kit",
    title: "Brand Kit Extractor",
    description: "Extract colors, fonts and assets from any brand",
    icon: ShoppingBag01Icon,
    tile: "bg-stone-100 dark:bg-stone-500/10",
    iconColor: "text-stone-600",
    category: "Export",
  },
  {
    id: "illustration-generator",
    title: "Illustration Generator",
    description: "Create stunning illustrations in seconds",
    icon: PencilEdit02Icon,
    tile: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-500",
    category: "Generate",
  },
  {
    id: "landing-page",
    title: "Landing Page Generator",
    description: "Generate high-converting landing pages",
    icon: BrowserIcon,
    tile: "bg-indigo-50 dark:bg-indigo-500/10",
    iconColor: "text-indigo-500",
    category: "Generate",
  },
  {
    id: "content-generator",
    title: "Content Generator",
    description: "Generate content blocks for your designs",
    icon: CubeIcon,
    tile: "bg-yellow-50 dark:bg-yellow-500/10",
    iconColor: "text-yellow-600",
    category: "Generate",
  },
  {
    id: "design-to-code",
    title: "Design to Code",
    description: "Convert designs into clean frontend code",
    icon: SourceCodeIcon,
    tile: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-500",
    category: "Export",
  },
  {
    id: "export-assets",
    title: "Export Assets",
    description: "Export assets in all formats and sizes",
    icon: Layers01Icon,
    tile: "bg-violet-50 dark:bg-violet-500/10",
    iconColor: "text-violet-500",
    category: "Export",
  },
];

const CATEGORIES: ("All Tools" | Category)[] = [
  "All Tools",
  "Design",
  "Generate",
  "Edit",
  "Export",
];

function ToolCard({ tool }: { tool: Tool }) {
  const card = (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        "shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200",
        tool.href
          ? "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.3)]"
          : "cursor-default",
      )}
    >
      {/* Pastel tile */}
      <div
        className={cn(
          "relative flex h-36 items-center justify-center",
          tool.tile,
        )}
      >
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10",
            tool.iconColor,
          )}
        >
          <HugeiconsIcon
            icon={tool.icon}
            size={26}
            color="currentColor"
            strokeWidth={1.75}
          />
        </span>
        {(tool.badge || !tool.href) && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
            {tool.badge ?? "Coming soon"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-sm font-semibold text-foreground">
          {tool.title}
          {tool.badge && (
            <span className="ml-1.5 text-xs font-medium text-muted-foreground">
              ({tool.badge})
            </span>
          )}
        </h2>
        <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
        <span
          className={cn(
            "mt-3 flex size-7 items-center justify-center self-end rounded-full border border-border text-muted-foreground transition-all",
            tool.href &&
              "group-hover:border-foreground group-hover:bg-foreground group-hover:text-background",
          )}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={13}
            color="currentColor"
            strokeWidth={2}
          />
        </span>
      </div>
    </div>
  );

  if (tool.href) {
    return (
      <Link href={tool.href} aria-label={tool.title}>
        {card}
      </Link>
    );
  }
  return card;
}

export default function MiniToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    "All Tools",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (category !== "All Tools" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="w-full h-screen overflow-hidden flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* NavBar reads useSearchParams — needs Suspense on this
              statically-prerendered page. */}
          <Suspense fallback={<div className="h-17 border-b border-border/60" />}>
            <NavBar />
          </Suspense>

          <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
            {/* Header row: title + search + category filter */}
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-sm">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Tools
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Powerful utilities to help you design, reimagine and ship
                  amazing products faster.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex h-10 w-full max-w-64 items-center gap-2 rounded-full border border-border bg-card px-3.5 transition-colors focus-within:border-foreground/25 sm:w-64">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={15}
                    color="currentColor"
                    strokeWidth={1.75}
                    className="shrink-0 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tools..."
                    aria-label="Search tools"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {category}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.75}
                        className="text-muted-foreground"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    {CATEGORIES.map((c) => (
                      <DropdownMenuItem
                        key={c}
                        onClick={() => setCategory(c)}
                        className={cn(
                          "cursor-pointer rounded-lg text-sm",
                          category === c && "font-semibold text-foreground",
                        )}
                      >
                        {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No tools match &quot;{query}&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
