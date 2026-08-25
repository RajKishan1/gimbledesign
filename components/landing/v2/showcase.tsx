"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/* Miniature site mockups, hand-built in CSS so they stay razor sharp  */
/* at any DPI and add zero image weight. Each one is fixed-palette      */
/* artwork (like a screenshot), so they don't respond to the theme.    */
/* ------------------------------------------------------------------ */

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-full ${className}`} />
);

const MockPortfolio = () => (
  <div className="flex h-full w-full flex-col bg-[#f5f2ec] p-5">
    <div className="flex items-center justify-between">
      <Bar className="h-2 w-16 bg-zinc-400" />
      <div className="size-4 rounded-full border border-zinc-400" />
    </div>
    <div className="mt-5 flex flex-1 gap-4">
      <div className="flex w-1/2 flex-col gap-2">
        <div className="h-20 w-24 -rotate-3 rounded-sm bg-zinc-800 shadow-md" />
        <div className="ml-8 h-16 w-20 rotate-2 rounded-sm bg-zinc-500 shadow-md" />
      </div>
      <div className="flex w-1/2 flex-col justify-center gap-1.5">
        <Bar className="h-2.5 w-full bg-zinc-800" />
        <Bar className="h-2.5 w-4/5 bg-zinc-800" />
        <Bar className="h-1.5 w-3/5 bg-zinc-400" />
      </div>
    </div>
    <span className="font-display text-3xl italic leading-none text-orange-600">
      JO
    </span>
  </div>
);

const MockSaaS = () => (
  <div className="flex h-full w-full flex-col bg-white p-5">
    <div className="flex items-center gap-3">
      <Bar className="h-2 w-12 bg-indigo-500" />
      <Bar className="h-1.5 w-8 bg-zinc-300" />
      <Bar className="h-1.5 w-8 bg-zinc-300" />
      <div className="ml-auto h-4 w-12 rounded-full bg-indigo-500" />
    </div>
    <div className="mt-4 flex flex-1 gap-4">
      <div className="flex w-1/2 flex-col justify-center gap-2">
        <Bar className="h-3 w-full bg-zinc-900" />
        <Bar className="h-3 w-3/4 bg-zinc-900" />
        <Bar className="h-1.5 w-4/5 bg-zinc-400" />
        <div className="mt-1 h-4 w-14 rounded-full bg-zinc-900" />
      </div>
      <div className="flex w-1/2 flex-col gap-2 rounded-lg bg-indigo-50 p-3">
        <div className="h-10 rounded-md bg-white shadow-sm" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded-md bg-indigo-200" />
          <div className="h-8 flex-1 rounded-md bg-white shadow-sm" />
        </div>
      </div>
    </div>
  </div>
);

const MockArchitecture = () => (
  <div className="flex h-full w-full flex-col bg-[#faf9f6] p-5">
    <div className="flex justify-between">
      <span className="text-[8px] font-semibold tracking-[0.3em] text-zinc-700">
        AURELL
      </span>
      <div className="flex gap-2">
        <Bar className="h-1 w-6 bg-zinc-300" />
        <Bar className="h-1 w-6 bg-zinc-300" />
      </div>
    </div>
    <div className="mt-3 flex flex-1 items-center gap-4">
      <div className="w-1/2">
        <p className="font-display text-xl leading-tight text-zinc-900">
          Architecture of <em className="italic">Purpose.</em>
        </p>
        <Bar className="mt-2 h-1 w-16 bg-zinc-300" />
      </div>
      <div className="flex h-full w-1/2 gap-2">
        <div className="h-full flex-1 bg-gradient-to-b from-zinc-300 to-zinc-500" />
        <div className="mt-6 h-2/3 w-1/3 bg-zinc-800" />
      </div>
    </div>
  </div>
);

const MockAgency = () => (
  <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-zinc-950 p-5">
    <div
      aria-hidden
      className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-600/60 to-transparent blur-xl"
    />
    <p className="relative z-10 text-sm font-black uppercase leading-[1.05] tracking-tight text-white">
      Experimental
      <br />
      Creative
      <br />
      Agency
    </p>
    <div className="relative z-10 flex items-end justify-between">
      <span className="text-2xl font-black text-white">WE</span>
      <div className="flex flex-col items-end gap-1">
        <Bar className="h-1 w-10 bg-white/50" />
        <Bar className="h-1 w-8 bg-white/50" />
        <Bar className="h-1 w-12 bg-white/50" />
      </div>
    </div>
  </div>
);

const MockSpace = () => (
  <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#05070f] p-5">
    <div
      aria-hidden
      className="absolute -bottom-10 -right-6 size-32 rounded-full bg-gradient-to-tl from-sky-500/50 to-transparent blur-md"
    />
    <div
      aria-hidden
      className="absolute bottom-0 right-0 size-24 rounded-full bg-zinc-900 shadow-[inset_-6px_6px_12px_rgba(56,189,248,0.35)]"
    />
    <div className="relative z-10 flex items-center gap-1.5">
      <div className="size-2 rotate-45 bg-sky-400" />
      <span className="text-[8px] font-bold tracking-[0.3em] text-white">
        ORBITAL
      </span>
    </div>
    <p className="relative z-10 mt-2 max-w-[70%] text-base font-semibold leading-snug text-white">
      Building the infrastructure for what&apos;s next.
    </p>
    <Bar className="relative z-10 mt-2 h-1.5 w-24 bg-white/30" />
  </div>
);

const MockShop = () => (
  <div className="flex h-full w-full flex-col bg-[#fdfbf7] p-5">
    <div className="flex items-center justify-between">
      <span className="text-[8px] font-semibold tracking-[0.3em] text-zinc-700">
        AURORA
      </span>
      <div className="size-3.5 rounded-full bg-zinc-900" />
    </div>
    <div className="mt-3 flex flex-1 gap-3">
      <div className="flex w-1/2 flex-col justify-center gap-2">
        <p className="font-display text-xl leading-tight text-zinc-900">
          Inspired by <em className="italic">Nature.</em>
        </p>
        <div className="h-4 w-16 rounded-full bg-zinc-900" />
      </div>
      <div className="relative w-1/2 overflow-hidden rounded-lg bg-gradient-to-br from-fuchsia-300 via-rose-200 to-sky-200">
        <div className="absolute bottom-2 left-2 right-2 rounded-md bg-white/80 p-1.5 backdrop-blur-sm">
          <Bar className="h-1.5 w-3/4 bg-zinc-700" />
          <Bar className="mt-1 h-1 w-1/3 bg-zinc-400" />
        </div>
      </div>
    </div>
  </div>
);

const MockWedding = () => (
  <div className="flex h-full w-full flex-col bg-[#f7f4ee] p-5">
    <div className="flex justify-between">
      <span className="text-[8px] font-semibold tracking-[0.25em] text-zinc-700">
        OPEN CANVAS
      </span>
      <div className="h-3.5 w-12 rounded-sm border border-zinc-800" />
    </div>
    <div className="mt-3 flex flex-1 gap-4">
      <div className="flex w-1/2 flex-col justify-center">
        <p className="text-sm font-semibold leading-snug text-zinc-900">
          Upfront prices. Real dates. No surprises.
        </p>
        <div className="mt-2 flex gap-1.5">
          <div className="h-3.5 w-14 rounded-sm bg-zinc-900" />
          <div className="h-3.5 w-14 rounded-sm border border-zinc-400" />
        </div>
      </div>
      <div className="grid w-1/2 grid-cols-3 gap-1.5">
        {["bg-rose-200", "bg-stone-300", "bg-emerald-200", "bg-amber-200", "bg-stone-400", "bg-rose-300"].map(
          (c, i) => (
            <div
              key={i}
              className={`${c} rounded-sm ${i % 2 ? "rotate-2" : "-rotate-2"}`}
            />
          ),
        )}
      </div>
    </div>
  </div>
);

const MockFintech = () => (
  <div className="flex h-full w-full items-center justify-center gap-4 bg-[#101418] p-5">
    <div className="flex h-full w-24 flex-col gap-2 rounded-xl bg-zinc-900 p-2.5 ring-1 ring-white/10">
      <Bar className="h-1.5 w-10 bg-zinc-600" />
      <Bar className="h-3 w-14 bg-white" />
      <div className="mt-1 flex flex-1 items-end gap-1">
        {[40, 70, 55, 90, 65].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-sm ${i === 3 ? "bg-emerald-400" : "bg-zinc-700"}`}
          />
        ))}
      </div>
      <Bar className="h-1.5 w-full bg-zinc-700" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Bar className="h-2.5 w-24 bg-white" />
      <Bar className="h-1.5 w-20 bg-zinc-500" />
      <div className="mt-1 h-4 w-16 rounded-full bg-emerald-400" />
    </div>
  </div>
);

type Showcase = { label: string; node: React.ReactNode };

const ROW_ONE: Showcase[] = [
  { label: "Photography portfolio", node: <MockPortfolio /> },
  { label: "SaaS landing page", node: <MockSaaS /> },
  { label: "Architecture studio", node: <MockArchitecture /> },
  { label: "Creative agency", node: <MockAgency /> },
];

const ROW_TWO: Showcase[] = [
  { label: "Space technology", node: <MockSpace /> },
  { label: "Skincare brand", node: <MockShop /> },
  { label: "Wedding directory", node: <MockWedding /> },
  { label: "Fintech dashboard", node: <MockFintech /> },
];

const ShowcaseCard = ({ item }: { item: Showcase }) => (
  <figure className="group relative h-56 w-80 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-64 sm:w-96">
    {item.node}
    <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
      {item.label}
    </figcaption>
  </figure>
);

const MarqueeRow = ({
  items,
  reverse = false,
  duration = 55,
}: {
  items: Showcase[];
  reverse?: boolean;
  duration?: number;
}) => (
  <div className="landing-fade-x w-full overflow-hidden">
    <div
      className={`landing-marquee flex w-max gap-5 ${reverse ? "landing-marquee-reverse" : ""}`}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      {items.map((item, i) => (
        <ShowcaseCard key={i} item={item} />
      ))}
      {/* duplicate for a seamless loop */}
      <div aria-hidden className="flex gap-5">
        {items.map((item, i) => (
          <ShowcaseCard key={`dup-${i}`} item={item} />
        ))}
      </div>
    </div>
  </div>
);

const LandingShowcase = () => (
  <section className="landing-marquee-group w-full overflow-hidden py-20 sm:py-24">
    <div className="mx-auto mb-10 flex max-w-6xl items-baseline justify-between gap-4 px-6">
      <h2 className="font-display text-3xl text-foreground sm:text-4xl">
        See what people are building{" "}
        <span aria-hidden className="align-middle text-2xl">
          👀
        </span>
      </h2>
    </div>
    <div className="flex flex-col gap-5">
      <MarqueeRow items={ROW_ONE} duration={55} />
      <MarqueeRow items={ROW_TWO} reverse duration={65} />
    </div>
  </section>
);

export default LandingShowcase;
