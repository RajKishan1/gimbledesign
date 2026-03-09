"use client";
import { useState } from "react";
import { Check, Info, Loader2 } from "lucide-react";
import type { PlanId } from "@/lib/paddle-plans";

type BillingCycle = "monthly" | "yearly";
type PricingOption = { price: number; label: string; originalPrice?: number };
type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: { label: string; variant: "neon" | "muted" };
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
    id: "lite",
    name: "Lite",
    tagline: "Good for trying out",
    badge: { label: "EARLY BIRD", variant: "muted" },
    monthly: { price: 9.99, label: "billed monthly" },
    yearly: { price: 8, label: "billed yearly" },
    credits: 1000,
    screens: 30,
    buttonText: "Upgrade to Lite",
    popular: false,
    features: [
      "2 projects",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For higher limits",
    badge: { label: "40% OFF APPLIED", variant: "neon" },
    monthly: { price: 24.99, label: "billed monthly" },
    yearly: { price: 12, label: "billed yearly", originalPrice: 20 },
    credits: 3000,
    screens: 100,
    buttonText: "Upgrade to Starter",
    popular: false,
    features: [
      "5 projects",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
      "Share preview links",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For even higher AI limits",
    badge: { label: "EARLY BIRD", variant: "muted" },
    monthly: { price: 49.99, label: "billed monthly" },
    yearly: { price: 35, label: "billed yearly" },
    credits: 20000,
    screens: 650,
    buttonText: "Upgrade to Pro",
    popular: true,
    features: [
      "Unlimited projects",
      "Purchase additional credits",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
      "Share preview links",
      "REST API access",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Built for collaboration",
    badge: { label: "EARLY BIRD", variant: "muted" },
    monthly: { price: 69.99, label: "billed monthly" },
    yearly: { price: 40, label: "billed yearly" },
    credits: 30000,
    screens: 1000,
    perSeat: true,
    buttonText: "Upgrade to Team",
    popular: false,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Priority support",
      "Centralized billing",
    ],
  },
];

const INFO_FEATURES = new Set([
  "Purchase additional credits",
  "Team collaboration",
  "Priority support",
  "Share preview links",
  "Unlimited code exports",
  "Unlimited Figma exports",
  "Export to AI builders",
]);

function Badge({ label, variant }: { label: string; variant: "neon" | "muted" }) {
  if (variant === "neon") {
    return (
      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/25">
        {label}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">
      {label}
    </span>
  );
}

// Declare Paddle on window for TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
  }
}

async function openPaddleCheckout(
  planId: PlanId,
  billing: BillingCycle,
  setLoadingPlan: (id: PlanId | null) => void
) {
  setLoadingPlan(planId);
  try {
    const res = await fetch("/api/paddle/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, billing }),
    });

    if (res.status === 401) {
      // Not logged in — redirect to login
      window.location.href = "/login";
      return;
    }

    const data = await res.json();
    if (!data.priceId) throw new Error("No price ID returned");

    // Dynamically load Paddle.js if not already loaded
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

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  return (
    <section className="bg-[var(--background)] py-20 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
          Transparent pricing for everyone
        </h1>
        <p className="text-[var(--muted-foreground)] text-base md:text-lg max-w-xl mx-auto">
          A fraction of the cost and time of hiring designers or doing it
          yourself from scratch.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full p-1 gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billing === "monthly"
                ? "bg-[var(--secondary)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billing === "yearly"
                ? "bg-[var(--secondary)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/25 px-2 py-0.5 rounded-full">
              4 MONTHS FREE
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const pricing = billing === "yearly" ? plan.yearly : plan.monthly;
          const isLoading = loadingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 ${
                plan.popular
                  ? "bg-[var(--card)] border-2 border-[var(--primary)] shadow-[0_0_24px_0_var(--primary)/15]"
                  : "bg-[var(--card)] border border-[var(--border)]"
              }`}
            >
              {/* Most Popular banner */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] font-bold tracking-[0.15em] px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan name + badge */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {plan.name}
                </h3>
                {plan.badge && (
                  <Badge label={plan.badge.label} variant={plan.badge.variant} />
                )}
              </div>

              {/* Tagline */}
              <p className="text-[var(--muted-foreground)] text-sm mb-5">
                {plan.tagline}
              </p>

              {/* Price */}
              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--foreground)]">
                    ${pricing.price}
                  </span>
                  <span className="text-[var(--muted-foreground)] text-sm">
                    /{plan.perSeat ? "user/" : ""}mo
                  </span>
                  {pricing.originalPrice && (
                    <span className="text-[var(--muted-foreground)]/50 text-sm line-through ml-1">
                      ${pricing.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-[var(--muted-foreground)]/60 text-xs mt-0.5">
                  {pricing.label}
                </p>
              </div>

              {/* CTA Button */}
              <button
                disabled={isLoading}
                onClick={() => openPaddleCheckout(plan.id, billing, setLoadingPlan)}
                className={`w-full mt-5 mb-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                  plan.popular
                    ? "bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]"
                    : "bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)]"
                }`}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {plan.buttonText}
              </button>

              {/* Credits */}
              <div className="flex items-start gap-2 mb-5 pb-5 border-b border-[var(--border)]">
                <span className="text-[var(--primary)] mt-0.5 text-base leading-none">
                  ✦
                </span>
                <div>
                  <p className="text-[var(--foreground)] text-sm font-semibold">
                    {plan.credits.toLocaleString()} AI credits / month
                  </p>
                  <p className="text-[var(--muted-foreground)] text-xs flex items-center gap-1 mt-0.5">
                    ≈ {plan.screens.toLocaleString()}
                    {plan.perSeat ? " screens per seat" : " screens"}
                    <Info size={11} className="opacity-50" />
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted-foreground)] uppercase mb-3">
                  Includes
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-[var(--primary)]"
                      />
                      <span className="text-[var(--muted-foreground)] text-sm flex items-center gap-1">
                        {feature}
                        {INFO_FEATURES.has(feature) && (
                          <Info size={11} className="opacity-40" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
