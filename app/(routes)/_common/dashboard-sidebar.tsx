"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  User,
  Compass,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProfile } from "@/features/use-profile";
import { useGetCredits } from "@/features/use-credits";
import { authClient } from "@/lib/auth-client";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/", label: "Explore", icon: Compass },
  { href: "/Pricing", label: "Pricing", icon: CreditCard },
];

export default function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useGetProfile();
  const { data: credits, isLoading: isLoadingCredits } = useGetCredits(
    user?.id
  );

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-zinc-200 dark:border-zinc-800",
          isCollapsed ? "justify-center p-3" : "justify-between p-4"
        )}
      >
        {!isCollapsed && (
          <span className="font-semibold text-foreground text-sm">Menu</span>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <>
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <Coins className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {isLoadingCredits
                    ? "…"
                    : `${credits?.toFixed(1) ?? "0.0"} credits`}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </div>
          <Link
            href="/profile"
            className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            <Avatar className="h-9 w-9 shrink-0 rounded-full">
              <AvatarImage src={profilePicture} alt={displayName} />
              <AvatarFallback className="rounded-full text-xs">
                {displayName
                  ? displayName
                      .split(" ")
                      .map((n) => n.charAt(0))
                      .join("")
                      .slice(0, 2)
                  : user?.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName || "Account"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                View profile
              </p>
            </div>
          </Link>
        </>
      )}

      {isCollapsed && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-col items-center gap-2">
          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Profile"
          >
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={profilePicture} alt={displayName} />
              <AvatarFallback className="rounded-full text-xs">
                {displayName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      )}
    </aside>
  );
}
