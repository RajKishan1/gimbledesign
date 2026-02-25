"use client";
import React from "react";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  const [isDark, setIsDark] = React.useState(false);

  const footerLinks = [
    {
      title: "Company",
      links: [
        { name: "Homepage", href: "#" },
        { name: "Solution", href: "#" },
        { name: "About", href: "#" },
        { name: "Contact", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "Blog", href: "#" },
        { name: "Blog Details", href: "#" },
        { name: "Review", href: "#" },
        { name: "FAQ", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "Careers", href: "#" },
        { name: "Pricing", href: "#" },
        { name: "Request", href: "#" },
        { name: "404", href: "#" },
      ],
    },
  ];

  const XIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  return (
    <div className={isDark ? "dark" : ""}>
      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-900 dark:bg-black">
    

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Brand Section */}
            <div className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute left-0 top-0 h-4 w-4 bg-yellow-400"></div>
                    <div className="absolute right-0 top-0 h-4 w-4 bg-red-500"></div>
                    <div className="absolute bottom-0 left-0 h-4 w-4 bg-green-600"></div>
                    <div className="absolute bottom-0 right-0 h-4 w-4 bg-blue-600"></div>
                    <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-50 dark:bg-gray-900"></div>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <p className="max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                AI-powered tools for business growth, seamless scaling, and
                proven results.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-neutral-600 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-neutral-400 dark:hover:bg-gray-700"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-neutral-600 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-neutral-400 dark:hover:bg-gray-700"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-neutral-600 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-neutral-400 dark:hover:bg-gray-700"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-neutral-600 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-neutral-400 dark:hover:bg-gray-700"
                  aria-label="X (Twitter)"
                >
                  <XIcon />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-neutral-600 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-neutral-400 dark:hover:bg-gray-700"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Navigation Columns */}
            {footerLinks.map((column, index) => (
              <div key={index}>
                <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 dark:border-gray-800 sm:flex-row">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Copyright © 2024 Gimble. All rights reserved
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;