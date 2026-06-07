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
        "relative inline-flex items-center gap-1.5 py-3 text-[13.5px] font-medium transition-colors outline-none",
        "focus-visible:text-foreground",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{item.label}</span>
      {item.badge && (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {item.badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-foreground"
        />
      )}
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
      className="flex w-full items-center justify-between border-b border-border/60 px-6"
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
