"use client";

import React from "react";
import Link from "next/link";
import { Linkedin, Youtube } from "lucide-react";

const PRODUCT_LINKS = [
  { name: "How it works", href: "/Howitworks" },
  { name: "Showcases", href: "/explore" },
  { name: "Pricing", href: "/Pricing" },
  { name: "FAQ", href: "/FAQ" },
];

const ACCOUNT_LINKS = [
  { name: "Log in", href: "/login" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Profile", href: "/profile" },
];

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LandingFooter = () => (
  <footer className="w-full border-t border-border">
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Brand */}
        <div className="space-y-5">
          <Link
            href="/"
            className="inline-flex items-baseline text-2xl font-semibold tracking-tight text-foreground"
          >
            gimble<span className="text-sky-600 dark:text-sky-400">.</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Describe what you want, and we handle the rest. From idea to
            stunning mobile &amp; web design in seconds.
          </p>
          <div className="flex items-center gap-2.5">
            {[
              { label: "X (Twitter)", icon: <XIcon /> },
              { label: "LinkedIn", icon: <Linkedin className="size-4" /> },
              { label: "YouTube", icon: <Youtube className="size-4" /> },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <nav aria-label="Product">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
          <ul className="space-y-3">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Account</h3>
          <ul className="space-y-3">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Gimble. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms &amp; Conditions
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
