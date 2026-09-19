import "server-only";
import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import { PLANS, isPaidPlanId } from "@/lib/plans";
import { getPolar } from "./client";
import { planForProductId } from "./products";

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** MongoDB write conflict / deadlock inside a transaction — safe to retry. */
function isWriteConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
}

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

export type GrantOutcome = "granted" | "already_granted" | "skipped";

const GRANT_MAX_ATTEMPTS = 3;

/**
 * Grant the plan's monthly credits when Polar confirms a subscription payment.
 * Only the initial payment and renewals count; plan-change invoices are
 * handled by `syncSubscription`, and one-off purchases don't exist here.
 *
 * Exactly-once per order: the ledger row (keyed by the order id) and the
 * balance increment commit in one transaction, so the webhook, its retries and
 * the checkout confirmation can all call this for the same order and only the
 * first one changes the balance.
 */
export async function grantCreditsForPaidOrder(order: Order): Promise<GrantOutcome> {
  if (!order.paid || !order.subscriptionId || !order.productId) return "skipped";
  if (
    order.billingReason !== "subscription_create" &&
    order.billingReason !== "subscription_cycle"
  ) {
    return "skipped";
  }

  const userId = resolveUserId(order.customer.externalId, order.metadata);
  const planId = planForProductId(order.productId);
  if (!userId || !planId) {
    console.warn(`[Polar] order ${order.id} not attributable (user=${userId}, plan=${planId}) — skipped`);
    return "skipped";
  }

  // Create the row (with the default free credits) up front so the transaction
  // below is a plain increment and its only possible unique violation is the
  // ledger key. Losing a creation race to another request is fine.
  try {
    await prisma.user.upsert({ where: { userId }, create: { userId }, update: {} });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }

  const credits = PLANS[planId].credits;
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$transaction([
        prisma.creditGrant.create({
          data: {
            id: `polar:order:${order.id}`,
            userId,
            credits,
            reason: order.billingReason,
            planId,
          },
        }),
        prisma.user.update({
          where: { userId },
          data: { credits: { increment: credits }, polarCustomerId: order.customerId },
        }),
      ]);
      break;
    } catch (err) {
      if (isUniqueViolation(err)) return "already_granted";
      if (isWriteConflict(err) && attempt < GRANT_MAX_ATTEMPTS) continue;
      throw err;
    }
  }

  console.log(`[Polar] user=${userId} ${order.billingReason} (${planId}), credits +${credits}`);
  return "granted";
}

export type CheckoutConfirmation = "credited" | "pending" | "failed" | "not_found";

/**
 * Settle a checkout straight from Polar's API instead of waiting for the
 * webhook. Called when the customer lands back on the success URL, so credits
 * appear even if webhook delivery is delayed, failing or (in local development)
 * unreachable. Everything that decides the grant — ownership, payment state,
 * product — is read from Polar with our server token; the client contributes
 * only an id, and a checkout that isn't the caller's is reported as not found.
 */
export async function confirmCheckoutForUser(
  checkoutId: string,
  userId: string,
): Promise<CheckoutConfirmation> {
  const polar = getPolar();

  let checkout;
  try {
    checkout = await polar.checkouts.get({ id: checkoutId });
  } catch (err) {
    if (err instanceof ResourceNotFound) return "not_found";
    throw err;
  }

  if (resolveUserId(checkout.externalCustomerId, checkout.metadata) !== userId) {
    return "not_found";
  }
  if (checkout.status === "failed" || checkout.status === "expired") return "failed";
  if (checkout.status !== "succeeded") return "pending";

  // The order is created asynchronously after the checkout succeeds.
  const orders = await polar.orders.list({ checkoutId, limit: 10 });
  const paidOrders = orders.result.items.filter(
    (order) =>
      order.paid && resolveUserId(order.customer.externalId, order.metadata) === userId,
  );
  if (paidOrders.length === 0) return "pending";

  let credited = false;
  for (const order of paidOrders) {
    const outcome = await grantCreditsForPaidOrder(order);
    if (outcome !== "skipped") credited = true;
  }

  const subscriptionId = checkout.subscriptionId ?? paidOrders[0].subscriptionId;
  if (subscriptionId) {
    await syncSubscription(await polar.subscriptions.get({ id: subscriptionId }));
  }

  return credited ? "credited" : "failed";
}
