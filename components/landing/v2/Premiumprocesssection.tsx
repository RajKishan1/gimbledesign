import React from "react";
import { Smartphone, Monitor, PenTool } from "lucide-react";

/**
 * PremiumProcessSection
 *
 * A responsive, self-contained "Premium Section with Depth" component built
 * with React + Tailwind CSS. Matches the requested design: a glassmorphism
 * 3-step process card with a gradient connector line, floating 3D decorative
 * elements, and a bottom CTA pill.
 *
 * Colors (from brief):
 *  - Blue:   #3B82F6
 *  - Purple: #8B5CF6
 *  - Pink:   #EC4899
 *  - Text Primary: #0F172A
 *  - Text Muted:   #64748B
 *  - Background:   #F8FAFC
 */

interface Step {
  number: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ringColor: string;
  badgeColor: string;
  iconColor: string;
}

const steps: Step[] = [
  {
    number: "01",
    Icon: Smartphone,
    title: "Mobile apps",
    description: "Complete app screens & flows",
    ringColor: "ring-[#3B82F6]/15",
    badgeColor: "bg-[#3B82F6]",
    iconColor: "text-[#3B82F6]",
  },
  {
    number: "02",
    Icon: Monitor,
    title: "Web platforms",
    description: "Landing pages & dashboards",
    ringColor: "ring-[#8B5CF6]/15",
    badgeColor: "bg-[#8B5CF6]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    number: "03",
    Icon: PenTool,
    title: "Wireframes",
    description: "Structure before polish",
     ringColor: "ring-[#3B82F6]/15",
    badgeColor: "bg-[#3B82F6]",
    iconColor: "text-[#3B82F6]",
  },
];

const PremiumProcessSection: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden mt-28 px-4 py-20 sm:py-28">
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 40%, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 40%, black 0%, transparent 70%)",
        }}
      />
      {/* Faint floating flower accents echoing the hero */}
      <span
        aria-hidden
        className="landing-float absolute left-[8%] top-16 text-2xl opacity-20 dark:opacity-10"
      >
        🌸
      </span>
      <span
        aria-hidden
        className="landing-float absolute right-[10%] top-32 text-xl opacity-20 [animation-delay:1.5s] dark:opacity-10"
      >
        🌼
      </span>
      <span
        aria-hidden
        className="landing-float absolute bottom-16 left-[14%] text-xl opacity-20 [animation-delay:3s] dark:opacity-10"
      >
        🌼
      </span>
      <span
        aria-hidden
        className="landing-float absolute bottom-24 right-[12%] text-2xl opacity-20 [animation-delay:2s] dark:opacity-10"
      >
        🌸
      </span>
      {/* Floating 3D decorative elements */}
      {/* <div className="pointer-events-none absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-[#3B82F6]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#EC4899]/25 blur-3xl" />
      <div
        className="pointer-events-none absolute left-6 bottom-6 hidden h-20 w-20 rounded-full sm:block animate-float-slow"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #ffffff, #e2e8f0 60%, #cbd5e1)",
          boxShadow:
            "0 20px 40px -10px rgba(15, 23, 42, 0.25), inset -6px -6px 12px rgba(148,163,184,0.4)",
        }}
      />
      <div
        className="pointer-events-none absolute right-10 top-8 hidden h-16 w-14 sm:block animate-float"
        style={{
          background:
            "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #e0e7ff 100%)",
          clipPath:
            "polygon(50% 0%, 90% 25%, 100% 65%, 60% 100%, 20% 90%, 0% 45%)",
          boxShadow: "0 15px 30px -8px rgba(59,130,246,0.3)",
          opacity: 0.9,
        }}
      />
      <div className="pointer-events-none absolute left-[8%] top-[18%] hidden text-[#8B5CF6]/50 sm:block animate-float">
        <FlowerIcon className="h-6 w-6" />
      </div>
      <div className="pointer-events-none absolute right-[10%] top-[10%] hidden text-[#8B5CF6]/40 sm:block animate-float-slow">
        <FlowerIcon className="h-5 w-5" />
      </div> */}

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-4xl leading-tight tracking-tight text-[#202020] dark:text-gray-300 sm:text-5xl">
            You don&apos;t need a design team to bring an{" "}
            <span className="italic text-[#3B82F6]">idea</span> to life.
          </h2>
        </div>

        {/* Glassmorphism process card */}
        <div className="relative mx-auto mt-14 max-w-5xl rounded-3xl border border-white/20 bg-white/80 dark:bg-white/2 p-8 shadow-xl backdrop-blur-xl sm:p-10 md:p-12">
          {/* Everything below shares one relative wrapper so the connector
              line's coordinate system (0-300 viewBox) maps exactly onto the
              3 equal-width columns of the grid: column centers sit at
              x = 50 / 150 / 250, i.e. 1/6, 1/2, 5/6 of the width. */}
          <div className="relative">
            {/* Gradient connector line (desktop only) — glow + crisp pass */}
            <svg
              className="pointer-events-none absolute inset-x-0 top-5 hidden h-10 w-full md:block"
              viewBox="0 0 300 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="stepConnector"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <filter
                  id="lineGlow"
                  x="-50%"
                  y="-100%"
                  width="200%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="3.2" />
                </filter>
              </defs>
              {/* soft glow pass */}
              <path
                d="M 50 20 C 83 40 117 40 150 20 C 183 0 217 0 250 20"
                fill="none"
                stroke="url(#stepConnector)"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.35"
                filter="url(#lineGlow)"
              />
              {/* crisp line pass */}
              <path
                d="M 50 20 C 83 40 117 40 150 20 C 183 0 217 0 250 20"
                fill="none"
                stroke="url(#stepConnector)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>

            {/* Vertical dividers between columns (desktop only) */}
            {/* <div className="pointer-events-none absolute left-1/3 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-[#0F172A]/10 md:block" />
            <div className="pointer-events-none absolute left-2/3 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-[#0F172A]/10 md:block" /> */}

            {/* Steps grid — a single 3-column grid with NO extra sibling
                elements in between, so every column's icon/title/description
                sit on the exact same row and align at the same height
                regardless of description line-wrapping. */}
            <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-y-0">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="group flex flex-col items-center px-4 text-center transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  {/* Number badge + icon */}
                  <div className="relative mb-5">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full bg-white ring-8 ${step.ringColor} transition-transform duration-300 ease-out group-hover:scale-105`}
                    >
                      <step.Icon
                        className={`h-8 w-8 ${step.iconColor}`}
                        // strokeWidth={1.75}
                      />
                    </div>
                    <span
                      className={`absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full ${step.badgeColor} text-xs font-semibold text-white shadow-md`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-[#202020] dark:text-gray-300">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-[#64748B] dark:text-gray-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA pill */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className="group flex items-center gap-3 rounded-full border border-[#0F172A]/10 bg-white dark:bg-white/2 backdrop-blur-2xl px-8 py-3 text-base font-medium text-[#0F172A] shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg dark:border-white/20"
          >
            <span className="text-[#0F172A] dark:text-gray-300">
              From a single prompt using{" "}
              <span className="font-semibold text-[#3B82F6]">gimble</span>.
            </span>
            <ArrowIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5 text-[#0F172A] dark:text-gray-300" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(4deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-slow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

const FlowerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2c1.5 0 2.5 1.3 2.1 2.7l-.4 1.5 1.2-1c1.2-1 3-.6 3.6.9.6 1.4-.2 3-1.7 3.3l-1.5.3 1.2 1c1.2 1 1.2 2.9 0 3.9l-1.2 1 1.5.3c1.5.3 2.3 1.9 1.7 3.3-.6 1.5-2.4 1.9-3.6.9l-1.2-1 .4 1.5c.4 1.4-.6 2.7-2.1 2.7s-2.5-1.3-2.1-2.7l.4-1.5-1.2 1c-1.2 1-3 .6-3.6-.9-.6-1.4.2-3 1.7-3.3l1.5-.3-1.2-1c-1.2-1-1.2-2.9 0-3.9l1.2-1-1.5-.3C4.7 9.9 3.9 8.3 4.5 6.9c.6-1.5 2.4-1.9 3.6-.9l1.2 1-.4-1.5C8.5 3.3 9.5 2 11 2h1z" />
  </svg>
);

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default PremiumProcessSection;
