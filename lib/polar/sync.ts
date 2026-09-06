import "server-only";
import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import prisma from "@/lib/prisma";
import { PLANS, isPaidPlanId } from "@/lib/plans";
import { planForProductId } from "./products";

/**
 * Subscription states that keep the user on their paid plan. `past_due` is
 * included as a grace period while Polar retries the payment.
 */
const ENTITLED_STATUSES = new Set<string>(["active", "trialing", "past_due"]);

export function isEntitledStatus(status: string | null | undefined): boolean {
  return !!status && ENTITLED_STATUSES.has(status);
}

/**
 * Both checkout paths tag the customer with our user id: `externalCustomerId`
 * (preferred, survives on the Polar customer) and `metadata.userId` (fallback,
 * copied by Polar onto subscriptions and orders).
 */
function resolveUserId(
  externalId: string | null | undefined,
  metadata: Record<string, unknown>,
): string | null {
  if (typeof externalId === "string" && externalId) return externalId;
  const fromMeta = metadata.userId;
  return typeof fromMeta === "string" && fromMeta ? fromMeta : null;
}

/**
 * Mirror a Polar subscription onto our User row. Safe to call from both the
 * webhook and from API responses (both are idempotent for the same state).
 *
 * Upgrades within the same subscription grant the credit difference between
 * tiers immediately; renewals and first payments are credited from `order.paid`.
 */
export async function syncSubscription(sub: Subscription): Promise<void> {
  const userId = resolveUserId(sub.customer.externalId, sub.metadata);
  if (!userId) {
    console.warn(`[Polar] subscription ${sub.id} has no user reference — skipped`);
    return;
  }

  const planId = planForProductId(sub.productId);
  if (!planId) {
    console.warn(`[Polar] subscription ${sub.id} uses unknown product ${sub.productId} — skipped`);
    return;
  }

  const entitled = isEntitledStatus(sub.status);

  const existing = await prisma.user.findUnique({
    where: { userId },
    select: { plan: true, polarSubscriptionId: true, polarProductId: true },
  });

  // A terminal event for a subscription that isn't the user's current one
  // (e.g. an old subscription being revoked after they re-subscribed) must not
  // clobber the live subscription.
  if (
    !entitled &&
    existing?.polarSubscriptionId &&
    existing.polarSubscriptionId !== sub.id
  ) {
    return;
  }

  const billingFields = entitled
    ? {
        polarCustomerId: sub.customerId,
        polarSubscriptionId: sub.id,
        polarProductId: sub.productId,
        plan: planId,
        subscriptionStatus: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
      }
    : {
        polarCustomerId: sub.customerId,
        polarSubscriptionId: null,
        polarProductId: null,
        plan: null,
        subscriptionStatus: sub.status,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: sub.endedAt ?? sub.currentPeriodEnd,
      };

  if (!existing) {
    await prisma.user.create({ data: { userId, ...billingFields } });
    return;
  }

  // Tier change on the same subscription → grant the difference, once.
  let delta = 0;
  if (
    entitled &&
    existing.polarSubscriptionId === sub.id &&
    existing.polarProductId !== sub.productId &&
    isPaidPlanId(existing.plan)
  ) {
    delta = PLANS[planId].credits - PLANS[existing.plan].credits;
  }

  if (delta > 0) {
    // Conditional on the previous product so a concurrent delivery can't grant twice.
    const { count } = await prisma.user.updateMany({
      where: { userId, polarProductId: existing.polarProductId },
      data: { ...billingFields, credits: { increment: delta } },
    });
    if (count === 1) {
      console.log(`[Polar] user=${userId} upgraded to ${planId}, credits +${delta}`);
      return;
    }
  }

  await prisma.user.update({ where: { userId }, data: billingFields });
}

/**
 * Grant the plan's monthly credits when Polar confirms a subscription payment.
 * Only the initial payment and renewals count; plan-change invoices are
 * handled by `syncSubscription`, and one-off purchases don't exist here.
 */
export async function grantCreditsForPaidOrder(order: Order): Promise<void> {
  if (!order.paid || !order.subscriptionId || !order.productId) return;
  if (
    order.billingReason !== "subscription_create" &&
    order.billingReason !== "subscription_cycle"
  ) {
    return;
  }

  const userId = resolveUserId(order.customer.externalId, order.metadata);
  const planId = planForProductId(order.productId);
  if (!userId || !planId) {
    console.warn(`[Polar] order ${order.id} not attributable (user=${userId}, plan=${planId}) — skipped`);
    return;
  }

  const credits = PLANS[planId].credits;
  await prisma.user.upsert({
    where: { userId },
    create: { userId, credits: PLANS.free.credits + credits, polarCustomerId: order.customerId },
    update: { credits: { increment: credits }, polarCustomerId: order.customerId },
  });

  console.log(`[Polar] user=${userId} ${order.billingReason} (${planId}), credits +${credits}`);
}
