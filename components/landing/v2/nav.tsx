"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  
  { label: "Showcases", href: "/explore" },
  { label: "Pricing", href: "/Pricing" },
  { label: "FAQ", href: "/FAQ" },
];

/**
 * Floating pill navigation that hovers over the hero imagery.
 * Glass surface so it reads on both the sky photo and plain sections.
 */
const LandingNav = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex w-full max-w-4xl items-center justify-between gap-4",
          "rounded-full border border-white/50 bg-white/70 py-2 pl-6 pr-2",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl",
          "dark:border-white/10 dark:bg-zinc-900/70",
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-baseline text-xl font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80 dark:text-white"
        >
          gimble<span className="text-sky-600 dark:text-sky-400">.</span>
        </Link>

        <div className="hidden xl:pl-16 items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex size-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {mounted ? (
              isDark ? (
                <Sun className="size-[18px]" />
              ) : (
                <Moon className="size-[18px]" />
              )
            ) : (
              <span className="size-[18px]" />
            )}
          </button>

          {user ? (
            <Link
              href="/dashboard"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-950 sm:block dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-950 sm:block dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Log in
            </Link>
          )}

          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-700 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get started
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 md:hidden dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="mx-auto mt-2 w-full max-w-4xl rounded-3xl border border-white/50 bg-white/90 p-3 shadow-xl backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-zinc-900/90">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-[15px] font-medium text-zinc-800 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={user ? "/dashboard" : "/login"}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] font-medium text-zinc-800 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              {user ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingNav;
