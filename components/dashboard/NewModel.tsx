"use client";

import { ArrowRight, Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ───────────────────────── Types ───────────────────────── */

type FloatingCardData = {
  /** Path to your image. Drop the file in `/public` and put the path here. */
  src?: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Final rotation in degrees (negative = tilt left). */
  rotate: number;
  /** Final vertical offset in pixels (positive = pushed down — baselines sit
   *  BELOW the brain podium, which is the focal point). */
  offsetY: number;
  /** Gradient shown until you provide `src`. Designed to read as distinct
   *  designs (dark/red, light/finance, dark/green, warm) so the layout
   *  feels populated even before real images arrive. */
  placeholderGradient: string;
};

type NewModelProps = {
  badge?: string;
  modelName?: string;
  modelVersion?: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Override the 4 surrounding floating cards. The center podium stays fixed. */
  cards?: FloatingCardData[];
  className?: string;
};

/* ───────────────────────── Tokens ───────────────────────── */

// Single source of truth for the lime accent. Used by the badge, headline
// highlight, button, brain pillow, podium disc, grid, and ambient glow.
const ACCENT = "#a3e635"; // Tailwind lime-400 — matches the source

// Standard ease used everywhere. Snappy, no overshoot.
const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── Defaults ───────────────────────── */

const DEFAULT_CARDS: FloatingCardData[] = [
  {
    // Position 1 — outer-left
    src: "/newmodel/card-1.png",
    alt: "Showcase 1",
    rotate: -11,
    offsetY: 28,
    placeholderGradient:
      "linear-gradient(140deg, #1c1c1f 0%, #3a0d0d 55%, #7a1818 100%)",
  },
  {
    // Position 2 — inner-left
    src: "/newmodel/card-2.png",
    alt: "Showcase 2",
    rotate: -3,
    offsetY: 12,
    placeholderGradient:
      "linear-gradient(155deg, #ffffff 0%, #f3f4f6 60%, #e5e7eb 100%)",
  },
  {
    // Position 3 — inner-right
    src: "/newmodel/card-3.png",
    alt: "Showcase 3",
    rotate: 4,
    offsetY: 14,
    placeholderGradient:
      "linear-gradient(140deg, #0d0d0f 0%, #0b1f12 55%, #143d22 100%)",
  },
  {
    // Position 4 — outer-right
    src: "/newmodel/card-4.png",
    alt: "Showcase 4",
    rotate: 11,
    offsetY: 26,
    placeholderGradient:
      "linear-gradient(140deg, #312018 0%, #4a2a20 55%, #6a3a2a 100%)",
  },
];

/* ───────────────────────── Main ───────────────────────── */

export default function NewModel({
  badge = "NEW MODEL",
  modelName = "Claude",
  modelVersion = "4.8",
  subtitle = "Our most powerful model yet. Smarter, faster and better at bringing your ideas to life.",
  primaryCta = { label: "Try Claude 4.8", href: "#" },
  secondaryCta = { label: "Learn more", href: "#" },
  cards = DEFAULT_CARDS,
  className,
}: NewModelProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden rounded-3xl bg-black text-white",
        className,
      )}
    >
      <PerspectiveGrid />

      {/* Side-by-side switches at xl (not lg) because at lg with the sidebar
          open on a laptop, the deck + text pair overflows. Below xl we stack
          vertically so the deck gets full width and never compresses. */}
      <div className="relative grid grid-cols-1 items-center gap-12 px-8 py-12 md:px-12 md:py-14 xl:grid-cols-[1fr_auto] xl:gap-16 xl:px-16">
        <LeftCopy
          badge={badge}
          modelName={modelName}
          modelVersion={modelVersion}
          subtitle={subtitle}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
        />
        <FloatingDeck cards={cards} version={modelVersion} />
      </div>
    </section>
  );
}

/* ───────────────────────── Left copy ───────────────────────── */

function LeftCopy({
  badge,
  modelName,
  modelVersion,
  subtitle,
  primaryCta,
  secondaryCta,
}: {
  badge: string;
  modelName: string;
  modelVersion: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}) {
  return (
    <div className="relative z-10 max-w-xl">
      {/* Badge */}
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase text-black"
        style={{ background: ACCENT, letterSpacing: "0.1em" }}
      >
        {badge}
      </motion.span>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: EASE }}
        className="mt-6 text-[40px] font-bold leading-[1.04] tracking-tight md:text-[52px]"
      >
        {modelName}{" "}
        <span style={{ color: ACCENT }}>{modelVersion}</span>{" "}
        is here.
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        className="mt-5 max-w-md text-[15px] leading-[1.55] text-neutral-300"
      >
        {subtitle}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <PrimaryButton href={primaryCta.href}>{primaryCta.label}</PrimaryButton>
        <SecondaryButton href={secondaryCta.href}>
          {secondaryCta.label}
        </SecondaryButton>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE }}
      href={href}
      className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-black"
      style={{
        background: ACCENT,
        boxShadow: `0 12px 32px -8px ${ACCENT}66`,
      }}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
    </motion.a>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      whileHover={{
        scale: 1.02,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE }}
      href={href}
      className="inline-flex items-center rounded-xl border border-neutral-800 bg-black px-6 py-3.5 text-sm font-semibold text-white"
    >
      {children}
    </motion.a>
  );
}

/* ───────────────────────── Floating deck ───────────────────────── */

function FloatingDeck({
  cards,
  version,
}: {
  cards: FloatingCardData[];
  version: string;
}) {
  const left = cards.slice(0, 2);
  const right = cards.slice(2, 4);

  return (
    <div className="relative flex items-end justify-center">
      <div className="flex items-end gap-3 md:gap-4">
        {left.map((card, i) => (
          <div
            key={`l-${i}`}
            className={i === 0 ? "hidden xl:block" : "hidden sm:block"}
          >
            <FloatingImageCard card={card} delay={0.2 + i * 0.06} />
          </div>
        ))}
        <CenterPodium version={version} delay={0.32} />
        {right.map((card, i) => (
          <div
            key={`r-${i}`}
            className={i === 1 ? "hidden xl:block" : "hidden sm:block"}
          >
            <FloatingImageCard card={card} delay={0.38 + i * 0.06} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingImageCard({
  card,
  delay,
}: {
  card: FloatingCardData;
  delay: number;
}) {
  return (
    <motion.div
      // One-shot stagger to final rest position. No loops.
      initial={{ opacity: 0, y: 36, rotate: 0 }}
      animate={{ opacity: 1, y: card.offsetY, rotate: card.rotate }}
      transition={{ delay, duration: 0.7, ease: EASE }}
      // Hover: lift, straighten slightly, scale up. Returns to rest on leave.
      whileHover={{
        y: card.offsetY - 10,
        rotate: card.rotate * 0.6,
        scale: 1.04,
        transition: { duration: 0.25, ease: EASE },
      }}
      style={{ transformOrigin: "bottom center" }}
    >
      <div
        className="relative h-36 w-24 overflow-hidden rounded-2xl sm:h-44 sm:w-32"
        style={{
          background: card.placeholderGradient,
          // Hard drop shadow + thin inner edge — gives the card real weight.
          boxShadow: `
            0 24px 40px -12px rgba(0,0,0,0.65),
            0 8px 16px -8px rgba(0,0,0,0.5),
            inset 0 0 0 1px rgba(255,255,255,0.06)
          `,
        }}
      >
        {card.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.src}
            alt={card.alt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Center podium ─────────────────────────
 * Three parts:
 *   1. Brain pillow — lime rounded square with inset top highlight +
 *      bottom shadow that makes it read as a physical object.
 *   2. Podium disc — single defined lime oval the pillow sits on.
 *   3. Powered-by pill below.
 * No continuous motion. Hover scales/tilts the pillow only.
 */
function CenterPodium({
  version,
  delay,
}: {
  version: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: EASE }}
      className="relative z-10 flex flex-col items-center"
    >
      {/*
        Brain pillow + ambient halo, both driven by one hover/tap gesture.
        The outer motion.div captures the pointer events and propagates
        `rest` / `hover` / `tap` variants to its children, so the halo
        grows + brightens at the same time the card scales + tilts.
        No continuous motion — everything sits still until you touch it.
      */}
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        className="relative"
      >
        {/* Ambient halo behind the card.
            Subtle at rest, *slightly* brighter on hover — the previous
            version blew out at hover and looked amateur. Tightened margin,
            blur, and the hover scale so the glow stays contained. */}
        <motion.div
          aria-hidden
          variants={{
            rest: { opacity: 0.4, scale: 1 },
            hover: { opacity: 0.6, scale: 1.1 },
            tap: { opacity: 0.45, scale: 1.02 },
          }}
          transition={{ duration: 0.3, ease: EASE }}
          className="pointer-events-none absolute inset-0 -m-6 rounded-full blur-xl"
          style={{ background: ACCENT }}
        />

        {/* Brain pillow */}
        <motion.div
          variants={{
            rest: { scale: 1, rotate: 0 },
            hover: { scale: 1.04, rotate: -1.5 },
            tap: { scale: 0.97, rotate: 0 },
          }}
          transition={{ duration: 0.25, ease: EASE }}
          className="relative flex h-40 w-40 items-center justify-center rounded-[34px] sm:h-44 sm:w-44"
          style={{
            background: ACCENT,
            // Refined layered shadows — meaningful depth without the glow blowout.
            //   - Modest outer halo (was 60px opacity 88 → 36px opacity 55)
            //   - Grounded drop shadow tinted lime
            //   - Thin lime ring to define the silhouette
            //   - Inset top highlight (light from above)
            //   - Inset bottom shadow (weight)
            boxShadow: `
              0 0 36px 0 ${ACCENT}55,
              0 22px 44px -12px ${ACCENT}4d,
              0 0 0 1px ${ACCENT}cc,
              inset 0 3px 0 0 rgba(255,255,255,0.35),
              inset 0 -4px 0 0 rgba(0,0,0,0.2)
            `,
          }}
        >
          <Brain
            className="size-[78px] text-black sm:size-[84px]"
            strokeWidth={2.4}
          />
        </motion.div>
      </motion.div>

      {/*
        Podium — a real platform, not a hairline.
        Wider than the brain card so the card visibly SITS on it. The
        top→bottom gradient + inset top/bottom shadows give it physical
        thickness so it reads as a 3D disc, not a flat stripe.
      */}
      <div
        className="relative -mt-3 h-5 w-52 rounded-full sm:w-60"
        style={{
          background:
            "linear-gradient(to bottom, #b5e858 0%, #a3e635 30%, #82b82a 70%, #6a9e1f 100%)",
          boxShadow: `
            0 16px 40px -6px ${ACCENT}80,
            0 0 90px 0 ${ACCENT}55,
            inset 0 2px 0 rgba(255,255,255,0.5),
            inset 0 -2px 0 rgba(0,0,0,0.25)
          `,
        }}
      />

      {/* Powered-by pill */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.25, duration: 0.4, ease: EASE }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-lg shadow-black/30"
      >
        <Sparkles className="size-3" style={{ color: ACCENT }} fill={ACCENT} />
        Powered by {`Claude ${version}`}
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Perspective grid ─────────────────────────
 * Lime grid receding into the distance + a single static ambient glow
 * at the horizon. No pulse, no flicker — the source is a still image.
 */
function PerspectiveGrid() {
  // Pre-computed line positions. Vertical lines converge toward a vanishing
  // point near (100, 0); horizontals are spaced with a 1/n-style falloff so
  // closer-to-viewer lines sit further apart than horizon lines.
  const verticalsX = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
  const horizontalsY = [100, 88, 76, 65, 55, 46, 38, 32, 27, 23, 20];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] overflow-hidden"
    >
      {/*
        SVG perspective grid — replaces the CSS approach (perspective +
        rotateX + mask + two linear-gradients). SVG renders once into a
        single paint layer, no GPU composite, no mask filter.
      */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="ng-grid-fade"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.45" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#ng-grid-fade)"
          fill="none"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        >
          {/* Verticals converging toward (100, 0) */}
          {verticalsX.map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1={100}
              x2={100 + (x - 100) * 0.15}
              y2={0}
            />
          ))}
          {/* Horizontals — perspective-spaced (closer = wider gap) */}
          {horizontalsY.map((y) => (
            <line key={`h-${y}`} x1={0} y1={y} x2={200} y2={y} />
          ))}
        </g>
      </svg>

      {/* Horizon ambient glow — blur dropped from 3xl → 2xl to cut paint
          cost. Still readable as an atmospheric haze behind the podium. */}
      <div
        className="absolute -bottom-24 left-1/2 h-64 w-[30rem] -translate-x-1/2 rounded-[50%] blur-2xl"
        style={{ background: ACCENT, opacity: 0.4 }}
      />
    </div>
  );
}
