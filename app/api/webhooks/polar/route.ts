// POST /api/webhooks/polar — Polar event receiver.
//
// Security model:
//  - Every delivery is verified with the Standard Webhooks HMAC signature
//    before the body is trusted (raw body, never pre-parsed).
//  - Deliveries are recorded by `webhook-id` before processing so retries
//    and duplicates are acknowledged without re-applying side effects.
//  - Processing failures release the record and return 5xx so Polar retries.

import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import { getPolarEnv } from "@/lib/polar/env";
import { grantCreditsForPaidOrder, syncSubscription } from "@/lib/polar/sync";

const PROVIDER = "polar";
type PolarEvent = ReturnType<typeof validateEvent>;

async function handleEvent(event: PolarEvent): Promise<void> {
  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.past_due":
    case "subscription.canceled":
    case "subscription.uncanceled":
    case "subscription.revoked":
      await syncSubscription(event.data);
      break;
    case "order.paid":
      await grantCreditsForPaidOrder(event.data);
      break;
    default:
      // Not relevant to billing state — acknowledged so Polar doesn't retry.
      break;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signatureHeaders: Record<string, string> = {};
  for (const name of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
    const value = req.headers.get(name);
    if (value) signatureHeaders[name] = value;
  }

  let event: PolarEvent;
  try {
    event = validateEvent(body, signatureHeaders, getPolarEnv().POLAR_WEBHOOK_SECRET);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("[Polar Webhook] Failed to parse event:", err);
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const eventId = signatureHeaders["webhook-id"];
  const eventKey = { provider_eventId: { provider: PROVIDER, eventId } };

  try {
    await prisma.webhookEvent.create({
      data: { provider: PROVIDER, eventId, type: event.type },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[Polar Webhook] Failed to record event:", err);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`[Polar Webhook] Error processing ${event.type} (${eventId}):`, err);
    await prisma.webhookEvent.delete({ where: eventKey }).catch(() => undefined);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
