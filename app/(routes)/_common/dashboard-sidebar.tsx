"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FolderOpen, MessageCircle, Settings, Lightbulb, RefreshCw } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, CompassIcon, Brain01Icon } from "@hugeicons/core-free-icons";
import { useGetProfile } from "@/features/use-profile";
import { useGetCredits } from "@/features/use-credits";
import { authClient } from "@/lib/auth-client";

/* Button-style nav items (white/dark rounded blocks) */
const buttonNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home01Icon, isHugeicon: true },
  { href: "/explore", label: "Explore", icon: CompassIcon, isHugeicon: true },
  { href: "/profile", label: "Settings", icon: Settings },
];

/* Text-only links (no button background) */
const linkNavItems = [
  { href: "/dashboard", label: "Projects", icon: FolderOpen },
  { href: "/FAQ", label: "Support", icon: MessageCircle },
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
  const isExploreActive = pathname === "/explore" || pathname.startsWith("/explore/");
  const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");

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
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {buttonNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? isExploreActive
              : item.href === "/dashboard"
              ? isDashboardActive && item.label === "Dashboard"
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
              {item.isHugeicon ? (
                <HugeiconsIcon icon={item.icon} size={20} color="currentColor" strokeWidth={1.75} className="shrink-0" />
              ) : (
                <item.icon className="size-5 shrink-0" />
              )}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Text-only links */}
        {!isCollapsed && (
          <div className="pt-2 space-y-0.5">
            {linkNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom: Plan card, Feedback, Account, black bar */}
      {!isCollapsed && (
        <>
          <div className="border-t border-border px-3 py-4 space-y-2">
            {/* Plan / Credits card */}
            <Link
              href="/Pricing"
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm hover:bg-card/90 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <RefreshCw className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Free Plan</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {isLoadingCredits ? "…" : `${credits != null ? Math.max(0, Math.floor(Number(credits))) : 0} left`}
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </div>
            </Link>

            {/* Feedback */}
            <Link
              href="/FAQ"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border shadow-sm hover:bg-card/90 transition-colors text-foreground"
            >
              <Lightbulb className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">Feedback</span>
            </Link>

            {/* Account */}
            <Link href="/profile" className="block px-3 pt-1 pb-0 rounded-lg hover:bg-accent/50 transition-colors">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Account</p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{userEmail || displayName || "Signed in"}</p>
            </Link>
          </div>

          {/* Black footer bar */}
          <div className="h-1.5 bg-foreground shrink-0" aria-hidden />
        </>
      )}

      {/* Collapsed: only icons + footer bar */}
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
                <item.icon className="size-5" />
              </Link>
            ))}
          </div>
          <div className="h-1.5 bg-foreground shrink-0" aria-hidden />
        </>
      )}
    </aside>
  );
}
