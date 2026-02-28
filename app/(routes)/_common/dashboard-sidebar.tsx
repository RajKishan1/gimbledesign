"use client";

import { useState } from "react";
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
  BulbIcon,
  Refresh01Icon,
  Home01Icon,
  CompassIcon,
  Brain01Icon,
  Logout01Icon,
  MagicWand01Icon,
} from "@hugeicons/core-free-icons";
import { useGetProfile } from "@/features/use-profile";
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

/* Button-style nav items (white/dark rounded blocks) */
const buttonNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home01Icon, isHugeicon: true },
  { href: "/mini-tools", label: "Mini Tools", icon: MagicWand01Icon, isHugeicon: true },
  { href: "/explore", label: "Explore", icon: CompassIcon, isHugeicon: true },
  { href: "/profile", label: "Settings", icon: Settings01Icon, isHugeicon: true },
];

/* Text-only links (no button background) */
const linkNavItems = [
  { href: "/projects", label: "Projects", icon: FolderOpenIcon, isHugeicon: true },
  { href: "/FAQ", label: "Support", icon: Message01Icon, isHugeicon: true },
];

export default function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useGetProfile();
  const { data: credits, isLoading: isLoadingCredits } = useGetCredits(user?.id);

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";
  const userEmail = user?.email ?? "";

  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isMiniToolsActive = pathname === "/mini-tools" || pathname.startsWith("/mini-tools/");
  const isExploreActive = pathname === "/explore" || pathname.startsWith("/explore/");
  const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");
  const isProjectsActive = pathname === "/projects" || pathname.startsWith("/projects/");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-background transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Top: Brand + collapse */}
      <div
        className={cn(
          "flex items-center border-b border-border",
          isCollapsed ? "justify-center py-4 px-3" : "justify-between py-4 px-4"
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-foreground text-background shrink-0">
              <HugeiconsIcon
                icon={Brain01Icon}
                size={20}
                color="currentColor"
                strokeWidth={1.75}
              />
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight truncate">
              gimble
              <span className="text-primary">.</span>
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.75} /> : <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="currentColor" strokeWidth={1.75} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {buttonNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? isDashboardActive && item.label === "Dashboard"
              : item.href === "/mini-tools"
              ? isMiniToolsActive
              : item.href === "/explore"
              ? isExploreActive
              : item.href === "/profile"
              ? isProfileActive
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                  : "bg-card text-foreground hover:bg-card/90 shadow-sm border border-border"
              )}
            >
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" strokeWidth={1.75} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Text-only links */}
        {!isCollapsed && (
          <div className="pt-2 space-y-0.5">
            {linkNavItems.map((item) => {
              const isActive = item.href === "/projects" ? isProjectsActive : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} size={16} color="currentColor" strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom: Upgrade CTA, Plan card, Feedback, Profile dropdown, black bar */}
      {!isCollapsed && (
        <>
          <div className="border-t border-border px-3 py-4 space-y-2">
            {/* Upgrade CTA — prominent above plan */}
            <Link
              href="/Pricing"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm border border-primary/20"
            >
              Upgrade
            </Link>

            {/* Plan / Credits card */}
            <Link
              href="/Pricing"
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm hover:bg-card/90 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <HugeiconsIcon icon={Refresh01Icon} size={16} color="currentColor" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Free Plan</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {isLoadingCredits ? "…" : `${credits != null ? Math.max(0, Math.floor(Number(credits))) : 0} left`}
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={1.75} className="text-muted-foreground" />
              </div>
            </Link>

            {/* Feedback */}
            <Link
              href="/FAQ"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border shadow-sm hover:bg-card/90 transition-colors text-foreground"
            >
              <HugeiconsIcon icon={BulbIcon} size={16} color="currentColor" strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">Feedback</span>
            </Link>

            {/* Profile dropdown — like reference: avatar + name, menu with Account, Upgrade, Log out */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-card border border-border shadow-sm hover:bg-card/90 transition-colors text-left"
                >
                  <Avatar className="h-8 w-8 rounded-full shrink-0 border border-border">
                    <AvatarImage src={profilePicture} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                      {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                    {displayName || "Account"}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-muted-foreground" aria-hidden>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={8}
                className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] rounded-xl border border-border bg-popover p-0 shadow-lg"
              >
                <div className="px-3 pt-3 pb-2">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName || "Account"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail || "Signed in"}</p>
                </div>
                <Link
                  href="/Pricing"
                  className="mx-2 mb-2 flex items-center justify-center py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Upgrade
                </Link>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <HugeiconsIcon icon={Settings01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                    Account / Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => authClient.signOut()}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Black footer bar */}
          <div className="h-1.5 bg-foreground shrink-0" aria-hidden />
        </>
      )}

      {/* Collapsed: only icons + profile dropdown + footer bar */}
      {isCollapsed && (
        <>
          <div className="mt-auto pt-2 px-2 space-y-1">
            {linkNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={item.label}
              >
                <HugeiconsIcon icon={item.icon} size={20} color="currentColor" strokeWidth={1.75} />
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8 rounded-full border border-border">
                    <AvatarImage src={profilePicture} alt={displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                      {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={8}
                className="min-w-[240px] rounded-xl border border-border bg-popover p-0 shadow-lg"
              >
                <div className="px-3 pt-3 pb-2">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName || "Account"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail || "Signed in"}</p>
                </div>
                <Link
                  href="/Pricing"
                  className="mx-2 mb-2 flex items-center justify-center py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Upgrade
                </Link>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <HugeiconsIcon icon={Settings01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                    Account / Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => authClient.signOut()}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="h-1.5 bg-foreground shrink-0" aria-hidden />
        </>
      )}
    </aside>
  );
}
