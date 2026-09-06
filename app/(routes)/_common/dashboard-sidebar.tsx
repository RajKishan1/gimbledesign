"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BubbleChatIcon,
  CompassIcon,
  DashboardSquare01Icon,
  FolderOpenIcon,
  MagicWand01Icon,
  Message01Icon,
  RefreshIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { useGetCredits } from "@/features/use-credits";
import { useSubscription } from "@/features/use-subscription";
import { authClient } from "@/lib/auth-client";

/* Primary navigation — quiet ghost rows; active gets the solid dark pill. */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/mini-tools", label: "Tools", icon: MagicWand01Icon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/profile", label: "Settings", icon: Settings01Icon },
];

const SECONDARY_ITEMS = [
  { href: "/projects", label: "Projects", icon: FolderOpenIcon },
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
  icon: typeof DashboardSquare01Icon;
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
          ? "bg-neutral-900 font-semibold text-white shadow-sm dark:bg-white dark:text-neutral-900"
          : "font-medium text-muted-foreground hover:bg-black/4 hover:text-foreground dark:hover:bg-white/6",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        color="currentColor"
        strokeWidth={active ? 2 : 1.75}
        className="shrink-0"
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/** Black app tile with the gimble mark — matches the brand row. */
function BrandTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden>
        <path
          d="M12 3.5c.5 4 4 7.5 8 8-4 .5-7.5 4-8 8-.5-4-4-7.5-8-8 4-.5 7.5-4 8-8Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function DashboardSidebarImpl() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: credits, isLoading: isLoadingCredits } = useGetCredits(
    user?.id,
  );

  const { data: subscription } = useSubscription(!!user);

  const creditsLabel = isLoadingCredits
    ? "…"
    : `${credits != null ? Math.max(0, Math.floor(Number(credits))) : 0}`;
  const planLabel = `${subscription?.planName ?? "Free"} Plan`;
  const hasSubscription = !!subscription?.hasSubscription;
  const planHref = hasSubscription ? "/profile#billing" : "/Pricing";

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
      }}
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-[#F7F8F8] transition-all duration-300 ease-in-out dark:bg-[#1B1B1B]",
        isCollapsed ? "w-18 cursor-pointer" : "w-64",
      )}
    >
      {/* Brand row — 68px tall to align with the top navbar. */}
      <div
        className={cn(
          "flex h-17 shrink-0 items-center",
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
            className="transition-transform hover:scale-[1.04]"
          >
            <BrandTile />
          </button>
        ) : (
          <>
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <BrandTile />
              <span className="truncate text-lg font-semibold tracking-tight text-foreground">
                gimble<span className="text-muted-foreground">.</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/8"
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
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            {...item}
            active={isActivePath(pathname, item.href)}
            collapsed={isCollapsed}
          />
        ))}

        <div
          className={cn("my-3! h-px bg-border", isCollapsed ? "mx-2" : "mx-1")}
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

      {/* Bottom block — Upgrade, plan/credits, feedback. */}
      {!isCollapsed ? (
        <div className="space-y-2 px-3 py-4">
          <Link
            href={planHref}
            className="flex items-center justify-center rounded-xl bg-[#53f22b] py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#47dd21]"
          >
            {hasSubscription ? "Manage plan" : "Upgrade"}
          </Link>

          <Link
            href={planHref}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-accent"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#53f22b]/15 text-[#2eae0e]">
              <HugeiconsIcon
                icon={RefreshIcon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-foreground">
                {planLabel}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Credits
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {creditsLabel} left
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={12}
                color="currentColor"
                strokeWidth={1.75}
              />
            </span>
          </Link>

          <Link
            href="/FAQ"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <HugeiconsIcon
              icon={BubbleChatIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
              className="text-muted-foreground"
            />
            Feedback
          </Link>
        </div>
      ) : (
        <div className="mt-auto space-y-1.5 px-2 py-3">
          <Link
            href={planHref}
            aria-label={hasSubscription ? "Manage plan" : "Upgrade"}
            title={hasSubscription ? "Manage plan" : "Upgrade"}
            className="flex items-center justify-center rounded-xl bg-[#53f22b] p-2.5 text-black transition-colors hover:bg-[#47dd21]"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={16}
              color="currentColor"
              strokeWidth={2}
            />
          </Link>
          <Link
            href="/FAQ"
            aria-label="Feedback"
            title="Feedback"
            className="flex items-center justify-center rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon
              icon={BubbleChatIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </Link>
        </div>
      )}
    </aside>
  );
}

const DashboardSidebar = memo(DashboardSidebarImpl);
DashboardSidebar.displayName = "DashboardSidebar";
export default DashboardSidebar;
