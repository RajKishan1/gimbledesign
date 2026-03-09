// GET  — returns current subscription status for the logged-in user
// POST — actions: "cancel" | "upgrade" | "portal"

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import paddle from "@/lib/paddle";
import { PLANS } from "@/lib/paddle-plans";
import type { PlanId } from "@/lib/paddle-plans";

export async function GET() {
  try {
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        scheduledChangeAt: true,
        paddleCustomerId: true,
        paddleSubscriptionId: true,
        credits: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error("[Paddle Subscription GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      action: "cancel" | "upgrade" | "portal";
      planId?: PlanId;
      billing?: "monthly" | "yearly";
    };

    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- CANCEL ---
    if (body.action === "cancel") {
      if (!user.paddleSubscriptionId) {
        return NextResponse.json({ error: "No active subscription" }, { status: 400 });
      }

      await paddle.subscriptions.cancel(user.paddleSubscriptionId, {
        effectiveFrom: "next_billing_period",
      });

      // Webhook will update the DB, but optimistically mark it here too
      await prisma.user.update({
        where: { userId: session.user.id },
        data: { cancelAtPeriodEnd: true },
      });

      return NextResponse.json({ success: true, message: "Subscription will cancel at end of billing period" });
    }

    // --- UPGRADE / DOWNGRADE ---
    if (body.action === "upgrade") {
      if (!user.paddleSubscriptionId) {
        return NextResponse.json({ error: "No active subscription to upgrade" }, { status: 400 });
      }

      const { planId, billing } = body;
      if (!planId || !billing) {
        return NextResponse.json({ error: "planId and billing are required" }, { status: 400 });
      }

      const plan = PLANS[planId];
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      const priceId = billing === "yearly" ? plan.yearlyPriceId : plan.monthlyPriceId;
      if (!priceId) {
        return NextResponse.json({ error: "Price not configured" }, { status: 500 });
      }

      await paddle.subscriptions.update(user.paddleSubscriptionId, {
        items: [{ priceId, quantity: 1 }],
        prorationBillingMode: "prorated_immediately",
      });

      // Webhook (subscription.updated) will sync the DB with the new plan
      return NextResponse.json({ success: true, message: "Plan updated" });
    }

    // --- CUSTOMER PORTAL ---
    if (body.action === "portal") {
      if (!user.paddleCustomerId || !user.paddleSubscriptionId) {
        return NextResponse.json({ error: "No subscription found" }, { status: 400 });
      }

      const portalSession = await paddle.customerPortalSessions.create(
        user.paddleCustomerId,
        { subscriptionIds: [user.paddleSubscriptionId] }
      );

      return NextResponse.json({
        success: true,
        url: (portalSession as unknown as { urls: { general: { overview: string } } }).urls.general.overview,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Paddle Subscription POST] Error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
