// POST /api/polar/checkout — create a hosted Polar checkout for a paid plan.
// Returns { url } for the client to navigate to. Users with a live
// subscription are told to change plans from Billing instead (409).

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PAID_PLAN_IDS } from "@/lib/plans";
import { getPolar } from "@/lib/polar/client";
import { getAppUrl } from "@/lib/polar/env";
import { productIdForPlan } from "@/lib/polar/products";
import { isEntitledStatus } from "@/lib/polar/sync";

const bodySchema = z.object({ planId: z.enum(PAID_PLAN_IDS) });

export async function POST(req: NextRequest) {
  const session = await getSession(await headers());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const { planId } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
      select: { polarSubscriptionId: true, subscriptionStatus: true },
    });

    if (user?.polarSubscriptionId && isEntitledStatus(user.subscriptionStatus)) {
      return NextResponse.json(
        {
          error: "You already have an active subscription. Change your plan from Billing.",
          code: "SUBSCRIPTION_EXISTS",
        },
        { status: 409 },
      );
    }

    const appUrl = getAppUrl();
    const checkout = await getPolar().checkouts.create({
      products: [productIdForPlan(planId)],
      successUrl: `${appUrl}/dashboard?checkout=success`,
      returnUrl: `${appUrl}/Pricing`,
      externalCustomerId: session.user.id,
      customerEmail: session.user.email,
      customerName: session.user.name || undefined,
      metadata: { userId: session.user.id, planId },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[Polar Checkout] Error:", err);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 502 });
  }
}
