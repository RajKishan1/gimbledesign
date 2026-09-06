// GET  /api/polar/subscription — current plan + billing state for the signed-in user
// POST /api/polar/subscription — { action: "cancel" | "resume" | "portal" }
//                                { action: "change", planId: "basic" | "pro" | "max" }

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PAID_PLAN_IDS, planFromStored } from "@/lib/plans";
import { getPolar } from "@/lib/polar/client";
import { getAppUrl } from "@/lib/polar/env";
import { productIdForPlan } from "@/lib/polar/products";
import { isEntitledStatus, syncSubscription } from "@/lib/polar/sync";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("portal") }),
  z.object({ action: z.literal("change"), planId: z.enum(PAID_PLAN_IDS) }),
]);

export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        credits: true,
        polarCustomerId: true,
        polarSubscriptionId: true,
      },
    });

    const plan = planFromStored(user?.plan);
    const hasSubscription =
      !!user?.polarSubscriptionId && isEntitledStatus(user.subscriptionStatus);

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        planName: plan.name,
        status: user?.subscriptionStatus ?? null,
        hasSubscription,
        cancelAtPeriodEnd: user?.cancelAtPeriodEnd ?? false,
        currentPeriodEnd: user?.currentPeriodEnd ?? null,
        credits: user?.credits ?? 0,
        hasBillingAccount: !!user?.polarCustomerId,
      },
    });
  } catch (err) {
    console.error("[Polar Subscription GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(await headers());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        polarCustomerId: true,
        polarSubscriptionId: true,
      },
    });

    const polar = getPolar();

    if (body.action === "portal") {
      if (!user?.polarCustomerId) {
        return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
      }
      const portal = await polar.customerSessions.create({
        customerId: user.polarCustomerId,
        returnUrl: `${getAppUrl()}/profile`,
      });
      return NextResponse.json({ success: true, url: portal.customerPortalUrl });
    }

    // Everything below needs a live subscription.
    const subscriptionId = user?.polarSubscriptionId;
    if (!subscriptionId || !isEntitledStatus(user.subscriptionStatus)) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    if (body.action === "change" && body.planId === user.plan) {
      return NextResponse.json({ error: "You are already on this plan" }, { status: 400 });
    }

    const subscriptionUpdate =
      body.action === "change"
        ? { productId: productIdForPlan(body.planId), prorationBehavior: "invoice" as const }
        : { cancelAtPeriodEnd: body.action === "cancel" };

    const updated = await polar.subscriptions.update({
      id: subscriptionId,
      subscriptionUpdate,
    });

    // Reflect the new state immediately; the webhook will confirm it shortly.
    await syncSubscription(updated);

    const message =
      body.action === "cancel"
        ? "Your subscription will end at the close of the current billing period."
        : body.action === "resume"
          ? "Your subscription will continue renewing."
          : "Plan updated.";

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error(`[Polar Subscription POST] ${body.action} failed:`, err);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 502 });
  }
}
