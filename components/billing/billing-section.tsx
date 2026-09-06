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
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "ok" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "warn" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
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
    <section id="billing" className="mt-8 rounded-lg border bg-card p-6 scroll-mt-24">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon icon={CreditCardIcon} size={20} color="currentColor" strokeWidth={1.75} className="text-primary" />
        <h2 className="text-xl font-semibold">Billing</h2>
      </div>

      {isLoading || !sub ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Spinner className="size-4" /> Loading billing details…
        </div>
      ) : (
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{sub.planName} plan</p>
              <StatusPill label={status.label} tone={status.tone} />
            </div>
            <p className="text-sm text-muted-foreground">
              {sub.hasSubscription
                ? `${PLANS[sub.planId].credits.toLocaleString()} credits each month · ${
                    sub.cancelAtPeriodEnd ? "Access ends" : "Renews"
                  }${periodEnd ? ` on ${periodEnd}` : " at the end of the period"}`
                : `${PLANS.free.credits} starter credits. Upgrade for a monthly credit allowance and exports.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sub.hasSubscription ? (
              <>
                <Button size="sm" onClick={() => setChangeOpen(true)} disabled={busy}>
                  Change plan
                </Button>
                {sub.cancelAtPeriodEnd ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => action.mutate({ action: "resume" })}
                  >
                    Resume subscription
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setCancelOpen(true)}>
                    Cancel subscription
                  </Button>
                )}
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/Pricing">Upgrade</Link>
              </Button>
            )}
            {sub.hasBillingAccount && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => action.mutate({ action: "portal" })}
              >
                Invoices &amp; payment method
              </Button>
            )}
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
        <DialogContent className="sm:max-w-[480px]">
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
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
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
        <DialogContent className="sm:max-w-[440px]">
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
