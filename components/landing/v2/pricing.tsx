"use client";

import Link from "next/link";
import { Check, Loader2, Sparkles } from "lucide-react";
import { PAID_PLAN_LIST, type PaidPlanId, type PlanDefinition } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useStartCheckout, useSubscription } from "@/features/use-subscription";

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
  const className = cn(
    "mb-6 mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200",
    "disabled:cursor-not-allowed disabled:opacity-70",
    plan.popular
      ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600 active:scale-[0.98]"
      : "border border-border bg-background text-foreground hover:bg-accent active:scale-[0.98]",
  );

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

const LandingPricing = () => {
  const { data: session } = authClient.useSession();
  const signedIn = !!session?.user;
  const { data: subscription } = useSubscription(signedIn);
  const checkout = useStartCheckout();

  const currentPlanId = signedIn ? (subscription?.planId ?? null) : null;
  const loadingPlanId = checkout.isPending ? checkout.variables : null;

  return (
    <section className="w-full py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="font-display text-4xl text-foreground sm:text-5xl">
            Pricing that scales with how fast you ship.
          </h2>
          <p className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Generate mobile + web app screens, then edit and iterate using the
            same credit balance. Billed monthly, cancel any time.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAID_PLAN_LIST.map((plan) => (
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

              <h3 className="mb-1 text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="mb-5 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground/70">billed monthly</p>
              </div>

              <PlanButton
                plan={plan}
                currentPlanId={currentPlanId}
                hasSubscription={!!subscription?.hasSubscription}
                loadingPlanId={loadingPlanId ?? null}
                onCheckout={(id) => checkout.mutate(id)}
              />

              <div className="mb-5 flex items-start gap-2.5 border-b border-border pb-5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-sky-500 dark:text-sky-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {plan.credits.toLocaleString()} AI credits / month
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ≈ {plan.screens.toLocaleString()} screens, regenerations &amp; AI edits
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
                      <Check size={14} className="mt-0.5 shrink-0 text-sky-500 dark:text-sky-400" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;
