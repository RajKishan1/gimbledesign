"use client";

import { ArrowRight, Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────────── Types ─────────────────────── */

type FloatingCardData = {
  /** Path to your image. Drop the file in `/public` and put the path here. */
  src?: string;
  /** Alt text for the image (accessibility). */
  alt: string;
  /** Rotation in degrees applied to the card (negative = tilt left). */
  rotate: number;
  /** Vertical offset in pixels (positive = pushed further down). */
  offsetY: number;
  /** Gradient shown while there's no image yet — keeps the layout polished. */
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

/* ─────────────────────── Constants ─────────────────────── */

// Single source of truth for the lime accent — used by the badge, headline
// highlight, button, brain card, pedestal, grid, and glow.
const ACCENT = "#a3e635"; // Tailwind lime-400

// Default cards. Replace `src` with your own images, or pass a `cards` prop.
const DEFAULT_CARDS: FloatingCardData[] = [
  {
    src: "/newmodel/card-1.png",
    alt: "Showcase 1",
    rotate: -12,
    offsetY: 24,
    placeholderGradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  },
  {
    src: "/newmodel/card-2.png",
    alt: "Showcase 2",
    rotate: -4,
    offsetY: 6,
    placeholderGradient: "linear-gradient(135deg, #fafafa 0%, #d4d4d8 100%)",
  },
  {
    src: "/newmodel/card-3.png",
    alt: "Showcase 3",
    rotate: 6,
    offsetY: 6,
    placeholderGradient: "linear-gradient(135deg, #18181b 0%, #312e81 100%)",
  },
  {
    src: "/newmodel/card-4.png",
    alt: "Showcase 4",
    rotate: 14,
    offsetY: 24,
    placeholderGradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
  },
];

/* ─────────────────────── Main component ─────────────────────── */

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
        "relative w-full overflow-hidden rounded-3xl bg-[#0a0a0a] text-white shadow-2xl shadow-black/30",
        className
      )}
    >
      {/* Bottom perspective grid + ambient lime glow */}
      <PerspectiveGrid />

      {/* Main content row */}
      <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-2 lg:gap-6 lg:px-14">
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

/* ─────────────────────── Left copy ─────────────────────── */

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
    <div className="relative z-10">
      {/* Badge */}
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black"
        style={{ background: ACCENT }}
      >
        {badge}
      </motion.span>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl"
      >
        {modelName}{" "}
        <span style={{ color: ACCENT }}>{modelVersion}</span>{" "}
        is here.
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-300"
      >
        {subtitle}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-7 flex flex-wrap items-center gap-3"
      >
        <motion.a
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          href={primaryCta.href}
          className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-black"
          style={{
            background: ACCENT,
            boxShadow: `0 10px 30px ${ACCENT}40`,
          }}
        >
          {primaryCta.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </motion.a>
        <motion.a
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          href={secondaryCta.href}
          className="inline-flex items-center rounded-full border border-neutral-700/80 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          {secondaryCta.label}
        </motion.a>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Floating deck (right side) ─────────────────────── */

function FloatingDeck({
  cards,
  version,
}: {
  cards: FloatingCardData[];
  version: string;
}) {
  // 4 surrounding cards split around the center podium.
  const left = cards.slice(0, 2);
  const right = cards.slice(2, 4);

  return (
    <div className="relative flex h-[300px] items-end justify-center">
      <div className="flex items-end gap-2 sm:gap-3 md:gap-4">
        {/* Left cards. Outer one hides on mobile so the layout stays tidy. */}
        {left.map((card, i) => (
          <div
            key={`l-${i}`}
            className={i === 0 ? "hidden md:block" : "hidden sm:block"}
          >
            <FloatingImageCard card={card} delay={0.2 + i * 0.08} />
          </div>
        ))}

        {/* Center podium with the brain icon */}
        <CenterPodium version={version} />

        {/* Right cards. Mirror the hide rules. */}
        {right.map((card, i) => (
          <div
            key={`r-${i}`}
            className={i === 1 ? "hidden md:block" : "hidden sm:block"}
          >
            <FloatingImageCard card={card} delay={0.36 + i * 0.08} />
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
      // Stagger in on mount, then settle at the final rotate + offsetY.
      initial={{ opacity: 0, y: 40, rotate: 0 }}
      animate={{ opacity: 1, y: card.offsetY, rotate: card.rotate }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="origin-bottom"
    >
      {/* Continuous gentle bob — different speed per card so they don't sync. */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 4 + delay * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative h-36 w-24 overflow-hidden rounded-2xl shadow-xl shadow-black/40 ring-1 ring-white/10 sm:h-40 sm:w-28"
        style={{ background: card.placeholderGradient }}
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
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────── Center podium (brain + pedestal + pill) ─────────────────────── */

function CenterPodium({ version }: { version: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Brain card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-32 w-32 items-center justify-center rounded-[28px]"
          style={{
            background: ACCENT,
            boxShadow: `0 20px 60px ${ACCENT}55, inset 0 0 0 2px rgba(255,255,255,0.22)`,
          }}
        >
          <Brain className="size-16 text-black" strokeWidth={2.2} />
        </motion.div>
      </motion.div>

      {/* Pedestal — flat disc that the brain card sits on. */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="-mt-3 h-3 w-32 rounded-full"
        style={{ background: ACCENT, opacity: 0.95 }}
      />
      {/* Soft glow under the disc. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="-mt-2 h-2 w-24 rounded-full blur-[2px]"
        style={{ background: ACCENT }}
      />

      {/* "Powered by" pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md shadow-black/30"
      >
        <Sparkles className="size-3" style={{ color: ACCENT }} fill={ACCENT} />
        Powered by {`Claude ${version}`}
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Perspective floor grid ─────────────────────── */

function PerspectiveGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] overflow-hidden"
    >
      {/* Grid lines tilted with `perspective` so they recede into the distance. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[140%] origin-bottom"
        style={{
          transform: "perspective(560px) rotateX(62deg)",
          backgroundImage:
            "linear-gradient(to right, rgba(163, 230, 53, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(163, 230, 53, 0.22) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 90%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 90%)",
        }}
      />
      {/* Slow-pulsing ambient lime glow under the podium. */}
      <motion.div
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-24 left-1/2 h-72 w-[28rem] -translate-x-1/2 rounded-[50%] blur-3xl"
        style={{ background: ACCENT }}
      />
    </div>
  );
}
