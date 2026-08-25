"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Coins01Icon,
  Moon01Icon,
  SparklesIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { useGetCredits } from "@/features/use-credits";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  badge?: string;
};

/* Only real destinations — no placeholder links. */
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/mini-tools", label: "Mini Tools", badge: "New" },
  { href: "/explore", label: "Explore" },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  const base = item.href.split("?")[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 py-2 text-[13.5px] transition-colors outline-none",
        "focus-visible:text-foreground",
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{item.label}</span>
      {item.badge && (
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
          {item.badge}
        </span>
      )}
      {/* Hover/focus underline — scales in from centre. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-center rounded-full transition-transform duration-200 ease-out",
          active
            ? "scale-x-100 bg-sky-500"
            : "scale-x-0 bg-foreground group-hover:scale-x-100 group-focus-visible:scale-x-100",
        )}
      />
    </Link>
  );
}

/** Live credit balance — links to pricing, where credits come from. */
function CreditsPill() {
  const { data: session } = authClient.useSession();
  const { data: credits, isLoading } = useGetCredits(session?.user?.id);
  const value = isLoading
    ? "…"
    : `${credits != null ? Math.max(0, Math.floor(Number(credits))) : 0}`;

  return (
    <Link
      href="/Pricing"
      title="Credits remaining"
      className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold tabular-nums text-foreground shadow-sm transition-colors hover:border-sky-300 dark:hover:border-sky-500/40"
    >
      <HugeiconsIcon
        icon={Coins01Icon}
        size={15}
        color="currentColor"
        strokeWidth={1.75}
        className="text-sky-600 dark:text-sky-400"
      />
      {value}
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {mounted ? (
        <HugeiconsIcon
          icon={isDark ? Sun01Icon : Moon01Icon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
        />
      ) : (
        <span className="size-4.5" />
      )}
    </button>
  );
}

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        // Sticky inside <main> so content scrolls *under* the navbar —
        // this is what makes backdrop-blur actually visible.
        "sticky top-0 z-30",
        // Height matches the sidebar brand row (h-17) so the borders align.
        "flex h-17 w-full items-center justify-between",
        "border-b border-border/60",
        "px-4 sm:px-6 lg:px-8 xl:px-10",
        "bg-background/80 supports-backdrop-filter:bg-background/55",
        "backdrop-blur-xl backdrop-saturate-200",
      )}
    >
      {/* Left: nav items */}
      <ul className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink item={item} active={isItemActive(pathname, item)} />
          </li>
        ))}
      </ul>

      {/* Right: credits, theme, upgrade */}
      <div className="flex items-center gap-2">
        <CreditsPill />
        <ThemeToggle />
        <Link
          href="/Pricing"
          className="flex h-9 items-center gap-1.5 rounded-full bg-sky-500 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-600"
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            size={15}
            color="currentColor"
            strokeWidth={2}
          />
          Upgrade
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
