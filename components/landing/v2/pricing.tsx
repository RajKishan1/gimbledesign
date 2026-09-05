"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { PlanId } from "@/lib/paddle-plans";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";
type PricingOption = { price: number; label: string; originalPrice?: number };
type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  earlyBird?: boolean;
  monthly: PricingOption;
  yearly: PricingOption;
  credits: number;
  screens: number;
  perSeat?: boolean;
  buttonText: string;
  popular: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For quick experiments",
    monthly: { price: 0, label: "forever free" },
    yearly: { price: 0, label: "forever free" },
    credits: 100,
    screens: 3,
    buttonText: "Try Free",
    popular: false,
    features: [
      "Mobile + Web screen generation",
      "Edit screens (uses credits)",
      "1 project",
      "Community support",
    ],
  },
  // {
  //   id: "starter",
  //   name: "Starter",
  //   tagline: "For getting started",
  //   earlyBird: true,
  //   monthly: { price: 15, label: "billed monthly" },
  //   yearly: { price: 12, label: "billed yearly", originalPrice: 15 },
  //   credits: 500,
  //   screens: 50,
  //   buttonText: "Start Starter",
  //   popular: false,
  //   features: [
  //     "Up to 5 projects",
  //     "Edit with AI",
  //     "Create Prototypes",
  //     "Export to Figma",
  //     "Export to AI Coding apps",
  //     "Standard support",
  //   ],
  // },
  {
    id: "pro",
    name: "Pro",
    tagline: "For higher limits",
    earlyBird: true,
    monthly: { price: 29, label: "billed monthly" },
    yearly: { price: 23, label: "billed yearly", originalPrice: 29 },
    credits: 1000,
    screens: 100,
    buttonText: "Go Pro",
    popular: true,
    features: [
      "Unlimited projects",
      "Edit with AI",
      "Create Prototypes",
      "Export to Figma",
      "Export to AI Coding apps",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For agencies & product teams",
    earlyBird: true,
    monthly: { price: 59, label: "billed monthly" },
    yearly: { price: 47, label: "billed yearly", originalPrice: 59 },
    credits: 2000,
    screens: 200,
    perSeat: true,
    buttonText: "Go Scale",
    popular: false,
    features: [
      "Unlimited projects",
      "Edit with AI",
      "Create Prototypes",
      "Export to Figma",
      "Export to AI Coding apps",
      "Priority support",
      "Dedicated account manager",
    ],
  },
];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
  }
}

async function openPaddleCheckout(
  planId: PlanId,
  billing: BillingCycle,
  setLoadingPlan: (id: PlanId | null) => void,
) {
  setLoadingPlan(planId);
  try {
    const res = await fetch("/api/paddle/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, billing }),
    });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    const data = await res.json();
    if (!data.priceId) throw new Error("No price ID returned");

    if (!window.Paddle) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Paddle.js"));
        document.head.appendChild(script);
      });
    }

    if (process.env.NEXT_PUBLIC_PADDLE_ENV !== "production") {
      window.Paddle.Environment.set("sandbox");
    }

    window.Paddle.Initialize({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    });

    window.Paddle.Checkout.open({
      items: [{ priceId: data.priceId, quantity: 1 }],
      customer: { email: data.email },
      customData: { userId: data.userId },
      settings: {
        displayMode: "overlay",
        theme: "dark",
        locale: "en",
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
      },
    });
  } catch (err) {
    console.error("[Checkout] Error:", err);
  } finally {
    setLoadingPlan(null);
  }
}

const LandingPricing = () => {
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  return (
    <section className="w-full py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="font-display text-4xl text-foreground sm:text-5xl">
            Pricing that scales with how fast you ship.
          </h2>
          <p className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Generate mobile + web app screens, then edit and iterate using the
            same credit balance.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex items-center justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
          >
            <button
              onClick={() => setBilling("monthly")}
              aria-pressed={billing === "monthly"}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
                billing === "monthly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              aria-pressed={billing === "yearly"}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
                billing === "yearly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yearly
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                  billing === "yearly"
                    ? "bg-sky-500 text-white"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
                )}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const pricing = billing === "yearly" ? plan.yearly : plan.monthly;
            const isLoading = loadingPlan === plan.id;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-card p-6 transition-shadow duration-200",
                  plan.popular
                    ? "border-sky-400/60 shadow-[0_16px_48px_-16px_rgba(14,165,233,0.35)] ring-1 ring-sky-400/40 dark:border-sky-500/40"
                    : "border-border shadow-sm hover:shadow-md",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="rounded-full bg-sky-500 px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] text-white shadow-sm">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                  {plan.earlyBird && (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400">
                      EARLY BIRD
                    </span>
                  )}
                </div>

                <p className="mb-5 text-sm text-muted-foreground">
                  {plan.tagline}
                </p>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${pricing.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.perSeat ? "user/" : ""}mo
                    </span>
                    {pricing.originalPrice && (
                      <span className="ml-1 text-sm text-muted-foreground/60 line-through">
                        ${pricing.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {pricing.label}
                  </p>
                </div>

                <button
                  disabled={isLoading}
                  onClick={() =>
                    plan.id === "free"
                      ? (window.location.href = "/signup")
                      : openPaddleCheckout(plan.id, billing, setLoadingPlan)
                  }
                  className={cn(
                    "mb-6 mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-70",
                    plan.popular
                      ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600 active:scale-[0.98]"
                      : "border border-border bg-background text-foreground hover:bg-accent active:scale-[0.98]",
                  )}
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {plan.buttonText}
                </button>

                <div className="mb-5 flex items-start gap-2.5 border-b border-border pb-5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-sky-500 dark:text-sky-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {plan.credits.toLocaleString()} AI credits / month
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ≈ {plan.screens.toLocaleString()} screens, regenerations
                      &amp; AI edits{plan.perSeat ? " per seat" : ""}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Includes
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-sky-500 dark:text-sky-400"
                        />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;
