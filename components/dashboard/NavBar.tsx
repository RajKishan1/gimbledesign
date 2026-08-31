"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  Moon01Icon,
  Notification03Icon,
  Search01Icon,
  Settings01Icon,
  SparklesIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { useProfile } from "@/context/profile-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  badge?: string;
  /** When set, active only on /dashboard with this ?type= value. */
  dashboardType?: string;
};

/* Only real destinations — no placeholder links. */
const NAV_ITEMS: NavItem[] = [
  { href: "/explore", label: "Explore" },
  { href: "/mini-tools", label: "Tools", badge: "New" },
  { href: "/dashboard?type=mobile", label: "Mobile App", dashboardType: "mobile" },
  { href: "/dashboard?type=web", label: "Web Platform", dashboardType: "web" },
  { href: "/mini-tools/app-store-screens", label: "Assets" },
  { href: "/Pricing", label: "Pricing" },
];

function isItemActive(
  pathname: string,
  typeParam: string | null,
  item: NavItem,
): boolean {
  if (item.dashboardType) {
    return pathname === "/dashboard" && typeParam === item.dashboardType;
  }
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
        <span className="inline-flex items-center rounded-full bg-[#53f22b]/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#1e9403] dark:bg-[#53f22b]/10 dark:text-[#6bf94a]">
          {item.badge}
        </span>
      )}
      {/* Hover/focus underline — scales in from centre. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-center rounded-full bg-foreground transition-transform duration-200 ease-out",
          active
            ? "scale-x-100"
            : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
        )}
      />
    </Link>
  );
}

/** Compact search field — submits to Explore. ⌘K / Ctrl+K focuses it. */
function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          query.trim()
            ? `/explore?q=${encodeURIComponent(query.trim())}`
            : "/explore",
        );
      }}
      className="hidden items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 transition-colors focus-within:border-foreground/25 focus-within:bg-card md:flex"
    >
      <HugeiconsIcon
        icon={Search01Icon}
        size={15}
        color="currentColor"
        strokeWidth={1.75}
        className="shrink-0 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search designs"
        className="h-9 w-36 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground lg:w-44"
      />
      <kbd className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
        ⌘ K
      </kbd>
    </form>
  );
}

function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon
            icon={Notification03Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl">
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          No notifications yet.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useProfile();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9 rounded-full border border-border">
            <AvatarImage src={profilePicture} alt={displayName} />
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
              {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-60 rounded-2xl border border-border bg-popover p-0 shadow-lg"
      >
        <div className="px-3.5 pb-2 pt-3.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {displayName || "Account"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user?.email || "Signed in"}
          </p>
        </div>
        <Link
          href="/Pricing"
          className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-xl bg-[#53f22b] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#47dd21]"
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            size={15}
            color="currentColor"
            strokeWidth={2}
          />
          Upgrade
        </Link>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex cursor-pointer items-center gap-2"
          >
            <HugeiconsIcon
              icon={Settings01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          <HugeiconsIcon
            icon={isDark ? Sun01Icon : Moon01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
          {isDark ? "Light theme" : "Dark theme"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="flex cursor-pointer items-center gap-2"
          onClick={() => authClient.signOut()}
        >
          <HugeiconsIcon
            icon={Logout01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NavBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  return (
    <nav
      aria-label="Primary"
      className={cn(
        // Sticky inside <main> so content scrolls *under* the navbar —
        // this is what makes backdrop-blur actually visible.
        "sticky top-0 z-30",
        // Height matches the sidebar brand row (h-17) so the borders align.
        "flex h-17 w-full items-center justify-between gap-4",
        "border-b border-border/60",
        "px-4 sm:px-6 lg:px-8 xl:px-10",
        "bg-background/80 supports-backdrop-filter:bg-background/55",
        "backdrop-blur-xl backdrop-saturate-200",
      )}
    >
      {/* Left: nav items */}
      <ul className="flex items-center gap-6 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <li key={item.label} className="shrink-0">
            <NavLink
              item={item}
              active={isItemActive(pathname, typeParam, item)}
            />
          </li>
        ))}
      </ul>

      {/* Right: search, notifications, account */}
      <div className="flex shrink-0 items-center gap-2">
        <SearchBox />
        <NotificationsButton />
        <AccountMenu />
      </div>
    </nav>
  );
};

export default NavBar;
