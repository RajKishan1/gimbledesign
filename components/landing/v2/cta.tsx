"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

/** Closing call-to-action: returns to the hero's sky imagery for a bookend. */
const LandingCta = () => (
  <section className="w-full px-4 py-16 sm:px-6 sm:py-20">
    <div className="relative isolate mx-auto flex min-h-105 max-w-6xl flex-col items-center justify-center gap-7 overflow-hidden rounded-[2.5rem] px-6 py-20 text-center shadow-xl">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-sky-400 to-emerald-200 dark:from-[#0b1030] dark:to-[#141433]"
      />
      <Image
        src="/landing/hero-sky-light.webp"
        alt=""
        fill
        sizes="(max-width: 1152px) 100vw, 1152px"
        className="-z-10 object-cover dark:hidden"
      />
      <Image
        src="/landing/hero-sky-dark.webp"
        alt=""
        fill
        sizes="(max-width: 1152px) 100vw, 1152px"
        className="-z-10 hidden object-cover dark:block"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(0,0,0,0.32),transparent_75%)]"
      />

      <h2 className="font-display max-w-2xl text-balance text-4xl leading-[1.08] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] sm:text-6xl">
        Bring your next idea <em className="italic">to life.</em>
      </h2>
      <p className="max-w-md text-balance text-base font-medium text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] sm:text-lg">
        Start free with 100 credits. No credit card required.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-sky-700 shadow-lg transition-all hover:bg-sky-50 active:scale-[0.98]"
        >
          Get started — it&apos;s free
        </Link>
        <Link
          href="/Pricing"
          className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98]"
        >
          View pricing
        </Link>
      </div>
    </div>
  </section>
);

export default LandingCta;
