"use client";

import React from "react";
import Link from "next/link";
import { Smartphone, Monitor, PenTool } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Smartphone,
    label: "Mobile apps",
    description: "Complete app screens & flows",
  },
  {
    icon: Monitor,
    label: "Web platforms",
    description: "Landing pages & dashboards",
  },
  {
    icon: PenTool,
    label: "Wireframes",
    description: "Structure before polish",
  },
];

const LandingCapabilities = () => (
  <section className="relative w-full overflow-hidden py-24 sm:py-32">
    {/* Faint floating flower accents echoing the hero */}
    <span aria-hidden className="landing-float absolute left-[8%] top-16 text-2xl opacity-20 dark:opacity-10">🌸</span>
    <span aria-hidden className="landing-float absolute right-[10%] top-32 text-xl opacity-20 [animation-delay:1.5s] dark:opacity-10">🌼</span>
    <span aria-hidden className="landing-float absolute bottom-16 left-[14%] text-xl opacity-20 [animation-delay:3s] dark:opacity-10">🌼</span>
    <span aria-hidden className="landing-float absolute bottom-24 right-[12%] text-2xl opacity-20 [animation-delay:2s] dark:opacity-10">🌸</span>

    <div className="mx-auto flex max-w-4xl flex-col items-center gap-14 px-6">
      <h2 className="font-display max-w-2xl text-balance text-center text-4xl leading-[1.15] text-foreground sm:text-5xl">
        You don&apos;t need a design team to bring an idea to life.
      </h2>

      <ul className="grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
        {CAPABILITIES.map(({ icon: Icon, label, description }) => (
          <li key={label} className="flex flex-col items-center gap-3 px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20">
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <p className="text-base font-semibold text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>

      <Link
        href="/login"
        className="group rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:shadow-md"
      >
        From a single prompt using{" "}
        <span className="font-semibold text-sky-600 transition-colors group-hover:text-sky-500 dark:text-sky-400">
          gimble.
        </span>
      </Link>
    </div>
  </section>
);

export default LandingCapabilities;
