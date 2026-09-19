// POST /api/polar/checkout/confirm — { checkoutId }
// Called by the dashboard when the customer returns from Polar's hosted
// checkout. Settles that checkout from Polar's API (see confirmCheckoutForUser)
// so credits don't depend on webhook delivery. The client can't influence what
// is granted: it only names a checkout, which must belong to the session user.

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { confirmCheckoutForUser } from "@/lib/polar/sync";

const bodySchema = z.object({ checkoutId: z.uuid() });

// Best-effort, per-instance throttle: each call costs up to three Polar API
// requests, and a legitimate return from checkout needs only a handful.
const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 12;
const recentCalls = new Map<string, number[]>();

function isThrottled(userId: string): boolean {
  const now = Date.now();
  const calls = (recentCalls.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (calls.length >= MAX_CALLS_PER_WINDOW) {
    recentCalls.set(userId, calls);
    return true;
  }
  calls.push(now);
  recentCalls.set(userId, calls);
  if (recentCalls.size > 5_000) {
    for (const [key, times] of recentCalls) {
      if (times.every((t) => now - t >= WINDOW_MS)) recentCalls.delete(key);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSession(await headers());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout" }, { status: 400 });
  }

  if (isThrottled(session.user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const status = await confirmCheckoutForUser(parsed.data.checkoutId, session.user.id);
    if (status === "not_found") {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[Polar Checkout Confirm] Error:", err);
    return NextResponse.json({ error: "Failed to confirm checkout" }, { status: 502 });
  }
}
