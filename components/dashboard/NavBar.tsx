"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useGetProfile } from "@/features/use-profile";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  badge?: string;
  /** Optional additional paths under which this item is considered active. */
  matchPrefixes?: string[];
};

// Single source of truth for the top nav — reorder / extend here.
const NAV_ITEMS: NavItem[] = [
  { href: "/explore", label: "Explore" },
  { href: "/mini-tools", label: "Mini Tools", badge: "New" },
  { href: "/dashboard", label: "Mobile App" },
  // No dedicated /web route yet — points at dashboard. Update when one exists.
  { href: "/dashboard?type=web", label: "Web Platform" },
  // Placeholder until an /assets route exists.
  { href: "#", label: "Assets" },
  { href: "/Pricing", label: "Pricing" },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === "#") return false;
  const base = item.href.split("?")[0];
  if (base === "/") return pathname === "/";
  if (pathname === base) return true;
  if (pathname.startsWith(`${base}/`)) return true;
  return item.matchPrefixes?.some((p) => pathname.startsWith(p)) ?? false;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 py-2 text-[13.5px] transition-colors outline-none",
        "focus-visible:text-foreground",
        // Active page is signalled by weight + colour, not a permanent
        // underline. The underline below is hover/focus only.
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{item.label}</span>
      {item.badge && (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {item.badge}
        </span>
      )}
      {/* Hover/focus underline — scales in from centre. Only the hovered
          link shows one, so there's never more than one underline at a time. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] origin-center scale-x-0 rounded-full bg-foreground transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </Link>
  );
}

function SearchBar() {
  return (
    <div
      className={cn(
        "group flex h-9 items-center gap-2 rounded-full border border-border/60 bg-muted/60 pl-3 pr-1.5",
        "transition-colors hover:bg-muted focus-within:border-border focus-within:bg-background"
      )}
    >
      <Search
        className="size-4 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        placeholder="Search"
        aria-label="Search"
        className="w-40 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <kbd
        aria-hidden
        className="hidden items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground sm:inline-flex"
      >
        <span className="text-[12px] leading-none">⌘</span>
        <span>K</span>
      </kbd>
    </div>
  );
}

function ProfileAvatar() {
  const { data: profile } = useGetProfile();

  const initials = (profile?.name || profile?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      aria-label="Open profile menu"
      className="relative inline-flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <Avatar className="size-9">
        <AvatarImage
          src={profile?.profilePicture ?? undefined}
          alt={profile?.name ?? "User avatar"}
        />
        <AvatarFallback className="bg-neutral-900 text-[11px] font-semibold text-white dark:bg-neutral-700">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        aria-hidden
        className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500"
      />
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
        // Height locked to 68px so the bottom edge aligns exactly with the
        // sidebar's brand-row bottom edge (sidebar uses py-4 + h-9 = 68px).
        "flex h-[68px] w-full items-center justify-between",
        "border-b border-border/60",
        "px-4 sm:px-6 lg:px-8 xl:px-10",
        // Smoky glassmorphic surface. Solid-ish fallback for browsers
        // without backdrop-filter; much more translucent when supported so
        // the blur reads. Saturation boost gives the "frosted" feel.
        "bg-background/80 supports-[backdrop-filter]:bg-background/55",
        "backdrop-blur-xl backdrop-saturate-200",
      )}
    >
      {/* Left: nav items */}
      <ul className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <NavLink item={item} active={isItemActive(pathname, item)} />
          </li>
        ))}
      </ul>

      {/* Right: search, notifications, avatar */}
      <div className="flex items-center gap-2">
        <SearchBar />
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
        <ProfileAvatar />
      </div>
    </nav>
  );
};

export default NavBar;
