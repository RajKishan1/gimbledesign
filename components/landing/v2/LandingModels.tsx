"use client";

import React from "react";

type Model = {
  name: string;
  provider: string;
  bg: string;
  /** rgba used for the per-brand hover glow */
  glow: string;
  icon: React.ReactNode;
};

const models: Model[] = [
  {
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    bg: "#",
    glow: "",
    icon: (
      <img src="/landing/clogo.webp" className="" alt="" />
      //   <svg
      //     viewBox="0 0 24 24"
      //     fill="none"
      //     stroke="#F97316"
      //     strokeWidth="1.8"
      //     strokeLinecap="round"
      //     className="h-5 w-5"
      //   >
      //     <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      //     <circle cx="12" cy="12" r="3.2" fill="#F97316" stroke="none" />
      //   </svg>
    ),
  },
  {
    name: "Gemini 3 Pro",
    provider: "Google",
    bg: "#",
    glow: "rgba(139,92,246,0.35)",
    icon: (
      <img src="/landing/glogo.webp" alt="" />
      //   <svg viewBox="0 0 24 24" fill="#8B5CF6" className="h-5 w-5">
      //     <path d="M12 2c.6 4.6 2.8 6.8 7.4 7.4-4.6.6-6.8 2.8-7.4 7.4-.6-4.6-2.8-6.8-7.4-7.4C9.2 8.8 11.4 6.6 12 2z" />
      //   </svg>
    ),
  },
  {
    name: "Kimi 2.5",
    provider: "Moonshot AI",
    bg: "#0F172A",
    glow: "rgba(15,23,42,0.35)",
    icon: (
      <img src="/landing/klogo.webp" alt="" />
      // <svg viewBox="0 0 24 24" fill="#ffffff" className="h-5 w-5">
      //   <path d="M14 3a9 9 0 1 0 7 14.6A9 9 0 0 1 14 3z" />
      // </svg>
    ),
  },
  {
    name: "Qwen 3.5 Plus",
    provider: "Alibaba",
    bg: "#F1F0FA",
    glow: "rgba(109,93,211,0.35)",
    icon: (
      <img src="/landing/qlogo.webp" alt="" />
      // <svg
      //   viewBox="0 0 24 24"
      //   fill="none"
      //   stroke="#6D5DD3"
      //   strokeWidth="1.6"
      //   className="h-5 w-5"
      // >
      //   <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      // </svg>
    ),
  },
  {
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    bg: "#",
    glow: "",
    icon: (
      <img src="/landing/clogo.webp" className="" alt="" />
      //   <svg
      //     viewBox="0 0 24 24"
      //     fill="none"
      //     stroke="#F97316"
      //     strokeWidth="1.8"
      //     strokeLinecap="round"
      //     className="h-5 w-5"
      //   >
      //     <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      //     <circle cx="12" cy="12" r="3.2" fill="#F97316" stroke="none" />
      //   </svg>
    ),
  },
  {
    name: "Gemini 3 Pro",
    provider: "Google",
    bg: "#",
    glow: "rgba(139,92,246,0.35)",
    icon: (
      <img src="/landing/glogo.webp" alt="" />
      //   <svg viewBox="0 0 24 24" fill="#8B5CF6" className="h-5 w-5">
      //     <path d="M12 2c.6 4.6 2.8 6.8 7.4 7.4-4.6.6-6.8 2.8-7.4 7.4-.6-4.6-2.8-6.8-7.4-7.4C9.2 8.8 11.4 6.6 12 2z" />
      //   </svg>
    ),
  },
  {
    name: "Kimi 2.5",
    provider: "Moonshot AI",
    bg: "#0F172A",
    glow: "rgba(15,23,42,0.35)",
    icon: (
      <img src="/landing/klogo.webp" alt="" />
      // <svg viewBox="0 0 24 24" fill="#ffffff" className="h-5 w-5">
      //   <path d="M14 3a9 9 0 1 0 7 14.6A9 9 0 0 1 14 3z" />
      // </svg>
    ),
  },
  {
    name: "Qwen 3.5 Plus",
    provider: "Alibaba",
    bg: "#F1F0FA",
    glow: "rgba(109,93,211,0.35)",
    icon: (
      <img src="/landing/qlogo.webp" alt="" />
      // <svg
      //   viewBox="0 0 24 24"
      //   fill="none"
      //   stroke="#6D5DD3"
      //   strokeWidth="1.6"
      //   className="h-5 w-5"
      // >
      //   <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      // </svg>
    ),
  },
];

function ModelChip({ model }: { model: Model }) {
  return (
    <div
      className="
        gimble-model-chip group/chip relative shrink-0
        flex min-w-[190px] items-center gap-3
        overflow-hidden rounded-2xl
        border border-slate-900/[0.06] dark:border-white/15 bg-white/10
        px-5 py-3.5 pl-3.5 backdrop-blur-2xl
        transition-transform duration-300 ease-out
        hover:scale-[1.06]
        after:absolute after:bottom-0 after:left-3.5 after:right-5 after:h-0.75  
        after:origin-left after:scale-x-0 after:rounded-t-full
        after:bg-gradient-to-r after:from-blue-500 after:via-violet-500 after:to-pink-500
        after:transition-transform after:duration-300
        group-hover/chip:after:scale-x-100
      "
      style={{ "--chip-glow": model.glow } as React.CSSProperties}
    >
      {/* Icon (decorative — name/provider text below carries the meaning) */}
      <div
        aria-hidden="true"
        className="
          flex h-10 w-10 min-w-10 items-center justify-center rounded-xl
          transition-transform duration-300
          group-hover/chip:scale-105 group-hover/chip:rotate-3
        "
        style={{ backgroundColor: model.bg }}
      >
        {model.icon}
      </div>

      <div className="flex flex-col text-left">
        <span className="text-sm font-bold leading-[1.3] text-[#202020] dark:text-gray-300">
          {model.name}
        </span>
        <span className="text-xs leading-[1.3] text-gray-400">
          {model.provider}
        </span>
      </div>
    </div>
  );
}

interface LandingModelsProps {
  /** Full loop duration in seconds. Lower = faster scroll. */
  speedSeconds?: number;
  className?: string;
}

export default function LandingModels({
  speedSeconds = 60,
  className = "",
}: LandingModelsProps) {
  // Duplicate the models so the loop is seamless once the track scrolls -50%.
  const marqueeModels = [...models, ...models];

  return (
    <section className={`w-full  py-28 ${className}`}>
      <div className="mx-auto w-full max-w-[1400px] px-5 text-center">
        <p className="mb-7  text-[12px] font-bold tracking-[0.14em] text-slate-500">
          POWERED BY THE BEST AI MODELS
        </p>

        {/* Screen-reader-only list: the visual marquee below duplicates
            content for a seamless loop, which would otherwise be
            announced twice. */}
        <div className="sr-only">
          <p>Powered by these AI models:</p>
          <ul>
            {models.map((m) => (
              <li key={m.name}>
                {m.name} by {m.provider}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden="true"
          className="
            relative overflow-hidden
            [mask-image:linear-gradient(90deg,transparent_0,#000_64px,#000_calc(100%-64px),transparent_100%)]
            [-webkit-mask-image:linear-gradient(90deg,transparent_0,#000_64px,#000_calc(100%-64px),transparent_100%)]
          "
        >
          <div
            className="gimble-models-track flex w-max gap-3.5"
            style={{ animationDuration: `${speedSeconds}s` }}
          >
            {marqueeModels.map((model, index) => (
              <ModelChip key={`${model.name}-${index}`} model={model} />
            ))}
          </div>
        </div>

        <p className="mt-[30px] text-sm text-slate-500">
          <strong className="font-bold text-slate-900">Auto mode</strong> picks
          the best model for every prompt — or{" "}
          <a
            href="#"
            className="text-blue-500 no-underline transition-colors hover:text-blue-600 hover:underline"
          >
            switch anytime
          </a>
          .
        </p>
      </div>

      {/* Global (non-scoped) styles — kept minimal and namespaced to avoid
          collisions. Works in any React setup, not just Next.js. */}
      <style>{`
        @keyframes gimbleModelsMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .gimble-models-track {
          animation-name: gimbleModelsMarquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-play-state: running;
          will-change: transform;
        }
        .gimble-models-track:hover {
          animation-play-state: paused;
        }
        .gimble-models-track:hover .gimble-model-chip {
          opacity: 0.55;
        }
        .gimble-models-track .gimble-model-chip:hover {
          opacity: 1;
          box-shadow: 0 16px 32px -14px var(--chip-glow, rgba(15, 23, 42, 0.25));
        }
        @media (prefers-reduced-motion: reduce) {
          .gimble-models-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
