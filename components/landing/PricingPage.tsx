"use client";

import Link from "next/link";
import { Check, Info, Loader2 } from "lucide-react";
import { PAID_PLAN_LIST, type PaidPlanId, type PlanDefinition } from "@/lib/plans";
import { authClient } from "@/lib/auth-client";
import { useStartCheckout, useSubscription } from "@/features/use-subscription";

const INFO_FEATURES = new Set([
  "Edit screens (uses credits)",
  "Edit with AI",
  "Create Prototypes",
  "Export to Figma",
  "Export to AI Coding apps",
  "Priority support",
  "Dedicated account manager",
]);

function PlanButton({
  plan,
  currentPlanId,
  hasSubscription,
  loadingPlanId,
  onCheckout,
}: {
  plan: PlanDefinition<PaidPlanId>;
  currentPlanId: string | null;
  hasSubscription: boolean;
  loadingPlanId: string | null;
  onCheckout: (planId: PaidPlanId) => void;
}) {
  const className = `w-full mt-5 mb-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
    plan.popular
      ? "bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]"
      : "bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)]"
  }`;

  if (currentPlanId === plan.id) {
    return (
      <button disabled className={className}>
        Current plan
      </button>
    );
  }

  if (hasSubscription) {
    return (
      <Link href="/profile#billing" className={className}>
        Switch plan
      </Link>
    );
  }

  const isLoading = loadingPlanId === plan.id;
  return (
    <button
      disabled={loadingPlanId !== null}
      onClick={() => onCheckout(plan.id)}
      className={className}
    >
      {isLoading && <Loader2 size={14} className="animate-spin" />}
      {plan.cta}
    </button>
  );
}

export default function PricingPage() {
  const { data: session } = authClient.useSession();
  const signedIn = !!session?.user;
  const { data: subscription } = useSubscription(signedIn);
  const checkout = useStartCheckout();

  const currentPlanId = signedIn ? (subscription?.planId ?? null) : null;
  const loadingPlanId = checkout.isPending ? checkout.variables : null;

  return (
    <section className="bg-[var(--background)] py-20 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
          Pricing that scales with how fast you ship UI
        </h1>
        <p className="text-[var(--muted-foreground)] text-base md:text-lg max-w-xl mx-auto">
          Generate mobile + web app screens, then edit and iterate using the same credit balance.
          Billed monthly, cancel any time.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAID_PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 ${
              plan.popular
                ? "bg-[var(--card)] border-2 border-[var(--primary)] shadow-[0_0_24px_0_var(--primary)/15]"
                : "bg-[var(--card)] border border-[var(--border)]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] font-bold tracking-[0.15em] px-4 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                  MOST POPULAR
                </span>
              </div>
            )}

            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{plan.name}</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-5">{plan.tagline}</p>

            <div className="mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--foreground)]">
                  ${plan.priceMonthly}
                </span>
                <span className="text-[var(--muted-foreground)] text-sm">/mo</span>
              </div>
              <p className="text-[var(--muted-foreground)]/60 text-xs mt-0.5">billed monthly</p>
            </div>

            <PlanButton
              plan={plan}
              currentPlanId={currentPlanId}
              hasSubscription={!!subscription?.hasSubscription}
              loadingPlanId={loadingPlanId ?? null}
              onCheckout={(id) => checkout.mutate(id)}
            />

            <div className="flex items-start gap-2 mb-5 pb-5 border-b border-[var(--border)]">
              <span className="text-[var(--primary)] mt-0.5 text-base leading-none">✦</span>
              <div>
                <p className="text-[var(--foreground)] text-sm font-semibold">
                  {plan.credits.toLocaleString()} AI credits / month
                </p>
                <p className="text-[var(--muted-foreground)] text-xs flex items-center gap-1 mt-0.5">
                  ≈ {plan.screens.toLocaleString()} screens / regeneration / AI edits
                  <Info size={11} className="opacity-50" />
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted-foreground)] uppercase mb-3">
                Includes
              </p>
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-[var(--primary)]" />
                    <span className="text-[var(--muted-foreground)] text-sm flex items-center gap-1">
                      {feature}
                      {INFO_FEATURES.has(feature) && <Info size={11} className="opacity-40" />}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
