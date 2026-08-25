"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FolderOpenIcon,
  Message01Icon,
  Settings01Icon,
  Home01Icon,
  CompassIcon,
  Coins01Icon,
  Logout01Icon,
  MagicWand01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useProfile } from "@/context/profile-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetCredits } from "@/features/use-credits";
import { authClient } from "@/lib/auth-client";

/* Primary navigation — quiet ghost rows; active gets the sky treatment. */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home01Icon },
  { href: "/projects", label: "Projects", icon: FolderOpenIcon },
  { href: "/mini-tools", label: "Mini Tools", icon: MagicWand01Icon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
];

const SECONDARY_ITEMS = [
  { href: "/profile", label: "Settings", icon: Settings01Icon },
  { href: "/FAQ", label: "Support", icon: Message01Icon },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared row styling for nav links (expanded + collapsed). */
function NavRow({
  href,
  label,
  icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof Home01Icon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
        active
          ? "bg-sky-50 font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400"
          : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={20}
        color="currentColor"
        strokeWidth={active ? 2 : 1.75}
        className="shrink-0"
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function DashboardSidebarImpl() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useProfile();
  const { data: credits, isLoading: isLoadingCredits } = useGetCredits(
    user?.id,
  );

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";
  const userEmail = user?.email ?? "";
  const creditsLabel = isLoadingCredits
    ? "…"
    : `${credits != null ? Math.max(0, Math.floor(Number(credits))) : 0}`;

  const accountMenu = (
    <DropdownMenuContent
      align="start"
      side={isCollapsed ? "right" : "top"}
      sideOffset={8}
      className="min-w-60 rounded-2xl border border-border bg-popover p-0 shadow-lg"
    >
      <div className="px-3.5 pb-2 pt-3.5">
        <p className="truncate text-sm font-semibold text-foreground">
          {displayName || "Account"}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {userEmail || "Signed in"}
        </p>
      </div>
      <Link
        href="/Pricing"
        className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
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
  );

  return (
    <aside
      onClick={(e) => {
        if (isCollapsed) {
          setIsCollapsed(false);
          return;
        }
        // Collapse when clicking blank sidebar area (not a link/button/interactive)
        const target = e.target as HTMLElement;
        if (target.closest("a, button, [role='menuitem']")) return;
        setIsCollapsed(true);
      }}
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18 cursor-pointer" : "w-64",
      )}
    >
      {/* Brand row — 68px tall to align with the top navbar. */}
      <div
        className={cn(
          "flex h-17 shrink-0 items-center border-b border-border",
          isCollapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(false);
            }}
            aria-label="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-lg font-semibold tracking-tight text-foreground shadow-sm transition-transform hover:scale-[1.04]"
          >
            g<span className="text-sky-600 dark:text-sky-400">.</span>
          </button>
        ) : (
          <>
            <Link href="/" className="flex min-w-0 items-baseline">
              <span className="truncate text-lg font-semibold tracking-tight text-foreground">
                gimble<span className="text-sky-600 dark:text-sky-400">.</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
            </button>
          </>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            {...item}
            active={isActivePath(pathname, item.href)}
            collapsed={isCollapsed}
          />
        ))}

        <div
          className={cn("my-3! h-px bg-border", isCollapsed ? "mx-2" : "mx-3")}
          aria-hidden
        />

        {SECONDARY_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            {...item}
            active={isActivePath(pathname, item.href)}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Bottom block */}
      {!isCollapsed ? (
        <div className="space-y-2 border-t border-border px-3 py-4">
          {/* Plan / credits card with Upgrade action */}
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <HugeiconsIcon
                  icon={Coins01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.75}
                  className="text-sky-600 dark:text-sky-400"
                />
                Credits
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {creditsLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Free plan · generations &amp; edits
            </p>
            <Link
              href="/Pricing"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600"
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

          {/* Account row */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
              >
                <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border">
                  <AvatarImage src={profilePicture} alt={displayName} />
                  <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                    {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {displayName || "Account"}
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.75}
                  className="shrink-0 -rotate-90 text-muted-foreground"
                />
              </button>
            </DropdownMenuTrigger>
            {accountMenu}
          </DropdownMenu>
        </div>
      ) : (
        <div className="mt-auto space-y-1 border-t border-border px-2 py-3">
          <Link
            href="/Pricing"
            aria-label="Upgrade"
            title="Upgrade"
            className="flex items-center justify-center rounded-xl bg-sky-500 p-2 text-white transition-colors hover:bg-sky-600"
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              color="currentColor"
              strokeWidth={2}
            />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-xl p-2 transition-colors hover:bg-accent"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8 rounded-full border border-border">
                  <AvatarImage src={profilePicture} alt={displayName} />
                  <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                    {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            {accountMenu}
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}

const DashboardSidebar = memo(DashboardSidebarImpl);
DashboardSidebar.displayName = "DashboardSidebar";
export default DashboardSidebar;
