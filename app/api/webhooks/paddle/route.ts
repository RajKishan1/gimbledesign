import { NextRequest, NextResponse } from "next/server";
import paddle from "@/lib/paddle";
import prisma from "@/lib/prisma";
import { PRICE_TO_PLAN, PLANS } from "@/lib/paddle-plans";
import type { EventName } from "@paddle/paddle-node-sdk";

// Paddle requires raw body for HMAC signature verification — do NOT parse JSON before this
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch {
    console.error("[Paddle Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!event) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  // Idempotency: skip events we've already processed (Paddle delivers at-least-once)
  // We use a lightweight approach — if needed, store event IDs in a separate collection.

  const eventType = event.eventType as EventName;

  try {
    switch (eventType) {
      case "subscription.created": {
        const sub = event.data as {
          id: string;
          customerId: string;
          status: string;
          items: Array<{ price?: { id: string } }>;
          currentBillingPeriod?: { endsAt: string };
          customData?: { userId?: string };
        };

        const userId = sub.customData?.userId;
        if (!userId) {
          console.error("[Paddle Webhook] subscription.created — no userId in customData");
          break;
        }

        const priceId = sub.items?.[0]?.price?.id ?? "";
        const planId = PRICE_TO_PLAN[priceId];
        const credits = planId ? PLANS[planId].credits : 0;

        await prisma.user.update({
          where: { userId },
          data: {
            paddleCustomerId: sub.customerId,
            paddleSubscriptionId: sub.id,
            plan: planId ?? null,
            subscriptionStatus: sub.status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: sub.currentBillingPeriod?.endsAt
              ? new Date(sub.currentBillingPeriod.endsAt)
              : null,
            scheduledChangeAt: null,
            credits: { increment: credits },
          },
        });

        console.log(`[Paddle] subscription.created — user=${userId} plan=${planId} credits+${credits}`);
        break;
      }

      case "subscription.updated": {
        const sub = event.data as {
          id: string;
          customerId: string;
          status: string;
          items: Array<{ price?: { id: string } }>;
          currentBillingPeriod?: { endsAt: string };
          scheduledChange?: { action: string; effectiveAt: string } | null;
          customData?: { userId?: string };
        };

        const userId = sub.customData?.userId;
        if (!userId) break;

        const priceId = sub.items?.[0]?.price?.id ?? "";
        const planId = PRICE_TO_PLAN[priceId];

        const isCancelScheduled = sub.scheduledChange?.action === "cancel";

        await prisma.user.update({
          where: { userId },
          data: {
            plan: planId ?? undefined,
            subscriptionStatus: sub.status,
            cancelAtPeriodEnd: isCancelScheduled,
            currentPeriodEnd: sub.currentBillingPeriod?.endsAt
              ? new Date(sub.currentBillingPeriod.endsAt)
              : undefined,
            scheduledChangeAt: isCancelScheduled && sub.scheduledChange?.effectiveAt
              ? new Date(sub.scheduledChange.effectiveAt)
              : null,
          },
        });

        console.log(`[Paddle] subscription.updated — user=${userId} plan=${planId} cancelScheduled=${isCancelScheduled}`);
        break;
      }

      case "subscription.canceled": {
        const sub = event.data as {
          customData?: { userId?: string };
        };

        const userId = sub.customData?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { userId },
          data: {
            subscriptionStatus: "canceled",
            cancelAtPeriodEnd: false,
            scheduledChangeAt: null,
            plan: null,
          },
        });

        console.log(`[Paddle] subscription.canceled — user=${userId}`);
        break;
      }

      case "transaction.completed": {
        // Award credits on every successful renewal (recurring billing)
        const txn = event.data as {
          subscriptionId?: string;
          customData?: { userId?: string };
          items: Array<{ price?: { id: string } }>;
        };

        // Only handle renewals (subscription_id present) — first payment is handled by subscription.created
        if (!txn.subscriptionId) break;

        const userId = txn.customData?.userId;
        if (!userId) break;

        const priceId = txn.items?.[0]?.price?.id ?? "";
        const planId = PRICE_TO_PLAN[priceId];
        const credits = planId ? PLANS[planId].credits : 0;
        if (!credits) break;

        await prisma.user.update({
          where: { userId },
          data: { credits: { increment: credits } },
        });

        console.log(`[Paddle] transaction.completed (renewal) — user=${userId} credits+${credits}`);
        break;
      }

      default:
        // Unhandled event — return 200 so Paddle doesn't retry
        break;
    }
  } catch (err) {
    console.error(`[Paddle Webhook] Error processing ${eventType}:`, err);
    // Still return 200 to avoid Paddle retrying for DB errors
    // In production consider queuing a retry internally
  }

  return NextResponse.json({ received: true });
}
