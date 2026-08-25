"use client";

import React from "react";
import Image from "next/image";

/**
 * Immersive full-bleed hero: photographic sky/meadow backdrop (separate
 * artwork per theme) with a serif display headline and the prompt input
 * passed in as children. The bottom fades into --background so the next
 * section connects seamlessly.
 */
const LandingHero = ({ children }: { children?: React.ReactNode }) => {
  return (
    <section className="relative isolate flex min-h-[92vh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-32 pt-36 sm:pt-40">
      {/* Gradient fallback renders instantly (and behind) the photography */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 dark:from-[#0b1030] dark:via-[#1a1f4d] dark:to-[#141433]"
      />
      <Image
        src="/landing/hero-sky-light.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover dark:hidden"
      />
      <Image
        src="/landing/hero-sky-dark.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 hidden object-cover dark:block"
      />

      {/* Legibility scrim behind the centered copy */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_50%_42%,rgba(0,0,0,0.28),transparent_70%)] dark:bg-[radial-gradient(ellipse_55%_45%_at_50%_42%,rgba(0,0,0,0.45),transparent_70%)]"
      />
      {/* Seamless fade into the page background */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7">
        {/* Social proof pill */}
        <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/20 py-1.5 pl-2 pr-4 shadow-sm backdrop-blur-md">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <img
                key={i}
                src="/men.webp"
                alt=""
                className="size-6 rounded-full border-2 border-white/70 object-cover"
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
            Join 30,000+ founders building today
          </span>
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          <h1 className="font-display text-6xl leading-[1.02] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] sm:text-7xl md:text-[84px]">
            Bring ideas <em className="italic">to life</em>
          </h1>
          <p className="max-w-xl text-balance text-lg font-medium leading-relaxed text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)] sm:text-xl">
            Describe what you want, and we handle the rest. From idea to
            stunning mobile &amp; web design in seconds.
          </p>
        </div>

        {/* Prompt input + device toggle come from the page (keeps all logic there) */}
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </section>
  );
};

export default LandingHero;
