"use client";

import React from "react";

/* App-icon style tiles with each provider's original brand colors.
   Drawn inline (the /public webp logos are monochrome). */

const Tile = ({
  children,
  className = "bg-white",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] shadow-sm ring-1 ring-black/8 dark:ring-white/10 ${className}`}
  >
    {children}
  </span>
);

/* Anthropic's coral starburst */
const ClaudeMark = () => (
  <Tile>
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <g stroke="#D97757" strokeWidth="2.4" strokeLinecap="round">
        {/* Coordinates rounded to 2dp so SSR and client render identical
            markup (raw trig floats differ in the last digit and cause
            hydration mismatches). */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const r2 = (n: number) => Math.round(n * 100) / 100;
          return (
            <line
              key={i}
              x1={r2(12 + Math.cos(a) * 3.2)}
              y1={r2(12 + Math.sin(a) * 3.2)}
              x2={r2(12 + Math.cos(a) * 9.2)}
              y2={r2(12 + Math.sin(a) * 9.2)}
            />
          );
        })}
      </g>
    </svg>
  </Tile>
);

/* Google Gemini's four-point star, blue → purple gradient */
const GeminiMark = () => (
  <Tile>
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <defs>
        <linearGradient id="gemini-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="55%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5C12.6 7.2 16.8 11.4 22.5 12 16.8 12.6 12.6 16.8 12 22.5 11.4 16.8 7.2 12.6 1.5 12 7.2 11.4 11.4 7.2 12 1.5Z"
        fill="url(#gemini-grad)"
      />
    </svg>
  </Tile>
);

/* Moonshot AI (Kimi): crescent on their near-black tile */
const KimiMark = () => (
  <Tile className="bg-[#16161a]">
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <path
        d="M17.5 15.5A7.5 7.5 0 0 1 8.5 4.6a8 8 0 1 0 10.9 10.4 7.4 7.4 0 0 1-1.9.5z"
        fill="#fff"
      />
      <circle cx="16.6" cy="6.4" r="1.6" fill="#7B61FF" />
    </svg>
  </Tile>
);

/* Alibaba Qwen: geometric cube knot, indigo → violet gradient */
const QwenMark = () => (
  <Tile>
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <defs>
        <linearGradient id="qwen-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#615CED" />
          <stop offset="100%" stopColor="#9D7BFF" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#qwen-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z" />
        <path d="M12 2.8v9.2M12 12l8 4.6M12 12 4 16.6" opacity="0.75" />
      </g>
    </svg>
  </Tile>
);

type Model = {
  name: string;
  provider: string;
  logo: React.ReactNode;
};

const MODELS: Model[] = [
  { name: "Claude Opus 4.8", provider: "Anthropic", logo: <ClaudeMark /> },
  { name: "Gemini 3 Pro", provider: "Google", logo: <GeminiMark /> },
  { name: "Kimi 2.5", provider: "Moonshot AI", logo: <KimiMark /> },
  { name: "Qwen 3.5 Plus", provider: "Alibaba", logo: <QwenMark /> },
];

/** Credibility strip: the real models powering generation, in brand color. */
const LandingModelsStrip = () => (
  <section className="w-full py-14">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-7 px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Powered by the best AI models
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {MODELS.map((model) => (
          <li key={model.name}>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card py-2.5 pl-3 pr-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              {model.logo}
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">
                  {model.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {model.provider}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Auto mode</span> picks
        the best model for every prompt — or switch anytime.
      </p>
    </div>
  </section>
);

export default LandingModelsStrip;
