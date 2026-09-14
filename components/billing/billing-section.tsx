"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { PAID_PLAN_IDS, PLANS, type PaidPlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useSubscription, useSubscriptionAction } from "@/features/use-subscription";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "ok" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "warn" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "ok" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "muted" && "bg-muted-foreground/60",
        )}
      />
      {label}
    </span>
  );
}

export function BillingSection() {
  const { data: session } = authClient.useSession();
  const { data: sub, isLoading } = useSubscription(!!session?.user);
  const action = useSubscriptionAction();

  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PaidPlanId | null>(null);

  const busy = action.isPending;
  const periodEnd = sub?.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), "MMM d, yyyy") : null;

  const status = (() => {
    if (!sub?.hasSubscription) return { label: "Free", tone: "muted" as const };
    if (sub.cancelAtPeriodEnd) return { label: "Cancels at period end", tone: "warn" as const };
    if (sub.status === "past_due") return { label: "Payment past due", tone: "warn" as const };
    if (sub.status === "trialing") return { label: "Trial", tone: "ok" as const };
    return { label: "Active", tone: "ok" as const };
  })();

  const runAndClose = (body: Parameters<typeof action.mutate>[0], close: () => void) =>
    action.mutate(body, { onSuccess: close });

  return (
    <section
      id="billing"
      className="mt-6 scroll-mt-24 overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_55px_-46px_rgba(15,23,42,0.5)]"
    >
      <div className="flex items-center gap-3 border-b border-border px-6 py-5 sm:px-8">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-400">
          <HugeiconsIcon
            icon={CreditCardIcon}
            size={19}
            color="currentColor"
            strokeWidth={1.75}
          />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.015em]">
            Plan &amp; billing
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Your subscription and monthly creative allowance.
          </p>
        </div>
      </div>

      {isLoading || !sub ? (
        <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground sm:px-8">
          <Spinner className="size-4" /> Loading billing details…
        </div>
      ) : (
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-7 lg:grid-cols-[1.35fr_0.8fr_0.8fr] lg:gap-0">
            <div className="lg:pr-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                  {sub.planName} plan
                </h3>
                <StatusPill label={status.label} tone={status.tone} />
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {sub.hasSubscription
                  ? PLANS[sub.planId].tagline
                  : "Start creating with the essentials, then upgrade whenever you need more room."}
              </p>
            </div>

            <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:px-8 lg:pt-0">
              <p className="text-xs font-medium text-muted-foreground">
                Monthly allowance
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.025em] tabular-nums">
                {PLANS[sub.planId].credits.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">credits</p>
            </div>

            <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-medium text-muted-foreground">
                {sub.cancelAtPeriodEnd ? "Access until" : sub.hasSubscription ? "Next renewal" : "Billing"}
              </p>
              <p className="mt-2 text-base font-semibold">
                {sub.hasSubscription
                  ? periodEnd || "End of period"
                  : "No recurring charge"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sub.hasSubscription
                  ? `$${PLANS[sub.planId].priceMonthly}/month`
                  : "Free forever"}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              {sub.hasSubscription
                ? "Changes are reflected in your account immediately."
                : `${PLANS.free.credits} starter credits are included with your account.`}
            </p>
            <div className="flex flex-wrap gap-2">
            {sub.hasSubscription ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setChangeOpen(true)}
                  disabled={busy}
                  className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Change plan
                </Button>
                {sub.cancelAtPeriodEnd ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy}
                    onClick={() => action.mutate({ action: "resume" })}
                  >
                    Resume subscription
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel subscription
                  </Button>
                )}
              </>
            ) : (
              <Button
                size="sm"
                asChild
                className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Link href="/Pricing">Upgrade</Link>
              </Button>
            )}
            {sub.hasBillingAccount && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl"
                disabled={busy}
                onClick={() => action.mutate({ action: "portal" })}
              >
                Invoices &amp; payment
              </Button>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Change plan */}
      <Dialog
        open={changeOpen}
        onOpenChange={(open) => {
          setChangeOpen(open);
          if (!open) setTargetPlan(null);
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change plan</DialogTitle>
            <DialogDescription>
              Upgrades take effect immediately and the prorated difference is charged now. Downgrades
              apply immediately and the unused balance is credited to your next invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            {PAID_PLAN_IDS.filter((id) => id !== sub?.planId).map((id) => {
              const plan = PLANS[id];
              const selected = targetPlan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTargetPlan(id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    selected
                      ? "border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/10"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{plan.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {plan.credits.toLocaleString()} credits / month
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">${plan.priceMonthly}/mo</span>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeOpen(false)} disabled={busy}>
              Back
            </Button>
            <Button
              disabled={!targetPlan || busy}
              onClick={() =>
                targetPlan &&
                runAndClose({ action: "change", planId: targetPlan }, () => setChangeOpen(false))
              }
            >
              {busy ? <Spinner className="mr-2 size-4" /> : null}
              {targetPlan ? `Switch to ${PLANS[targetPlan].name}` : "Select a plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-3xl sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              You keep {sub?.planName} access{periodEnd ? ` until ${periodEnd}` : " until the end of the current period"}.
              Remaining credits stay on your account. You can resume any time before then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={busy}>
              Keep plan
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => runAndClose({ action: "cancel" }, () => setCancelOpen(false))}
            >
              {busy ? <Spinner className="mr-2 size-4" /> : null}
              Cancel at period end
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
