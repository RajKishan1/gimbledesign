// Returns the Paddle price ID for the requested plan + billing cycle.
// The actual checkout is opened client-side via Paddle.js overlay —
// this endpoint just validates the session and returns the priceId + clientToken.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { PLANS } from "@/lib/paddle-plans";
import type { PlanId } from "@/lib/paddle-plans";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billing } = (await req.json()) as {
      planId: PlanId;
      billing: "monthly" | "yearly";
    };

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId =
      billing === "yearly" ? plan.yearlyPriceId : plan.monthlyPriceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      priceId,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      // Pass userId so webhook can link the payment back to this user
      userId: session.user.id,
      email: session.user.email,
    });
  } catch (err) {
    console.error("[Paddle Checkout] Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
