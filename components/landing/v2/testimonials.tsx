"use client";

import React from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "We went from a rough idea to a full product design using just one prompt. Screens, flows, everything — done in minutes.",
    name: "Rahul Mehta",
    role: "Product Manager",
    highlight: true,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Gimble generates clean, consistent layouts that actually make sense. Huge time saver for early-stage products.",
    name: "Ananya Verma",
    role: "Startup Founder",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  },
  {
    quote:
      "I just describe what I want, and Gimble gives me complete UI flows ready to build.",
    name: "Arjun Patel",
    role: "Frontend Developer",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Gimble helps us visualize the entire product before writing a single line of code.",
    name: "Sneha Kapoor",
    role: "UX Lead",
    highlight: true,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
  {
    quote:
      "It's fast, intuitive, and surprisingly accurate for end-to-end design generation.",
    name: "Kunal Sharma",
    role: "Indie Hacker",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Instead of designing screen by screen, we now generate complete user journeys instantly.",
    name: "Sneha Joshi",
    role: "Operations & Product",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  },
];

const Stars = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex items-center gap-0.5 ${className}`}
    role="img"
    aria-label="Rated 5 out of 5 stars"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <Star
        key={i}
        aria-hidden
        className="size-4 fill-amber-400 text-amber-400"
      />
    ))}
  </div>
);

const LandingTestimonials = () => (
  <section className="relative w-full overflow-hidden py-20 sm:py-28">
    {/* Soft ambient glow behind the grid */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-150 w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/40 blur-[140px] dark:bg-sky-500/10"
    />

    <div className="mx-auto max-w-6xl px-6">
      <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-5 text-center">
        <h2 className="font-display text-4xl text-foreground sm:text-5xl">
          Loved by builders.
        </h2>
        <p className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Founders, PMs, and developers use Gimble to go from idea to shipped
          design — without waiting on anyone.
        </p>

        {/* Social-proof summary */}
        <div className="mt-1 flex items-center gap-4 rounded-full border border-border bg-card py-2 pl-2.5 pr-5 shadow-sm">
          <div className="flex -space-x-2.5">
            {TESTIMONIALS.slice(0, 4).map((t) => (
              <img
                key={t.name}
                src={t.avatar}
                alt=""
                className="size-7 rounded-full border-2 border-card object-cover"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Stars />
            <span className="text-sm font-semibold text-foreground">5.0</span>
            <span className="text-sm text-muted-foreground">
              from 110+ builders
            </span>
          </div>
        </div>
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 *:mb-5">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className={`group relative break-inside-avoid rounded-3xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              t.highlight
                ? "border-sky-200/80 bg-linear-to-b from-sky-50/80 to-card dark:border-sky-500/25 dark:from-sky-500/10 dark:to-card"
                : "border-border bg-card"
            }`}
          >
            {/* Oversized serif quote mark */}
            <span
              aria-hidden
              className="font-display pointer-events-none absolute right-6 top-3 text-6xl leading-none text-foreground/6 transition-colors duration-300 group-hover:text-sky-500/15 dark:text-white/6"
            >
              &rdquo;
            </span>

            <Stars className="mb-4" />

            <blockquote className="text-[15px] leading-relaxed text-foreground">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
              <img
                src={t.avatar}
                alt=""
                loading="lazy"
                className="size-10 rounded-full object-cover ring-2 ring-background shadow-sm"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default LandingTestimonials;
