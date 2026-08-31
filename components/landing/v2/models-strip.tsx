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

/* OpenAI: interlocking blossom approximated as six rotated petals on black */
const OpenAIMark = () => (
  <Tile className="bg-[#0d0d0d]">
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <g stroke="#fff" strokeWidth="1.9" strokeLinecap="round" fill="none">
        {Array.from({ length: 6 }, (_, i) => (
          <rect
            key={i}
            x="9.75"
            y="3.2"
            width="4.5"
            height="10.6"
            rx="2.25"
            transform={`rotate(${i * 60} 12 12)`}
          />
        ))}
      </g>
    </svg>
  </Tile>
);

/* DeepSeek: stylized whale curve in their signature blue */
const DeepSeekMark = () => (
  <Tile>
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M21 8.5c-1 .8-2 1.1-2.9 1-0.6 3.4-2.6 6.2-5.6 7.8-2.6 1.4-5.6 1.6-8 .6 1.5-.3 2.8-1 3.7-2-1.9-.7-3.3-2.2-3.9-4.2 1 .5 2.1.7 3.1.5C6 10.9 5.6 9.2 6 7.4c1.4 1.9 3.4 3.2 5.7 3.6.2-2 1.5-3.6 3.4-4.2 1.4-.4 2.8-.2 3.9.6.8-.1 1.5-.4 2-.9-.1.8-.4 1.5-1 2z"
        fill="#4D6BFE"
      />
    </svg>
  </Tile>
);

type Model = {
  name: string;
  provider: string;
  logo: React.ReactNode;
};

const MODELS: Model[] = [
  { name: "Claude Opus 5", provider: "Anthropic", logo: <ClaudeMark /> },
  { name: "GPT-5.6 Sol", provider: "OpenAI", logo: <OpenAIMark /> },
  { name: "Gemini 3.1 Pro", provider: "Google", logo: <GeminiMark /> },
  { name: "DeepSeek V4", provider: "DeepSeek", logo: <DeepSeekMark /> },
  { name: "Kimi K3", provider: "Moonshot AI", logo: <KimiMark /> },
  { name: "Qwen 3.8 Max", provider: "Alibaba", logo: <QwenMark /> },
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
