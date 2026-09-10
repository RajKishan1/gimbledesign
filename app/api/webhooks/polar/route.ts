// POST /api/webhooks/polar — Polar event receiver.
//
// Security model:
//  - Every delivery is verified with the Standard Webhooks HMAC signature
//    before the body is trusted (raw body, never pre-parsed).
//  - Deliveries are recorded by `webhook-id` before processing so retries
//    and duplicates are acknowledged without re-applying side effects.
//  - Processing failures release the record and return 5xx so Polar retries.

import { NextRequest, NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError as PolarWebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import {
  Webhook,
  WebhookVerificationError as StandardWebhookVerificationError,
} from "standardwebhooks";
import { Order$inboundSchema } from "@polar-sh/sdk/models/components/order.js";
import { Subscription$inboundSchema } from "@polar-sh/sdk/models/components/subscription.js";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import { getPolarEnv } from "@/lib/polar/env";
import { grantCreditsForPaidOrder, syncSubscription } from "@/lib/polar/sync";

const PROVIDER = "polar";
type PolarEvent = ReturnType<typeof validateEvent>;

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.past_due",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
]);

function parseVerifiedPayload(payload: unknown): PolarEvent {
  if (!payload || typeof payload !== "object" || !("type" in payload)) {
    throw new Error("Invalid Polar webhook payload");
  }

  const event = payload as { type: unknown; data?: unknown };
  if (typeof event.type !== "string" || !("data" in event)) {
    throw new Error("Invalid Polar webhook payload");
  }

  // Direct Standard Webhooks verification returns Polar's wire-format JSON.
  // Run handled payloads through the SDK schemas so snake_case API fields are
  // converted to the camelCase models consumed by the synchronization layer.
  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    return {
      ...payload,
      data: Subscription$inboundSchema.parse(event.data),
    } as PolarEvent;
  }
  if (event.type === "order.paid") {
    return {
      ...payload,
      data: Order$inboundSchema.parse(event.data),
    } as PolarEvent;
  }

  return payload as PolarEvent;
}

/**
 * Polar's SDK helper expects a user-defined/raw secret and base64-encodes it
 * before handing it to Standard Webhooks. New Polar endpoints can instead
 * return an already encoded `whsec_...` secret. Passing that format through
 * the SDK helper double-encodes it, so verify it directly in that case.
 */
function validatePolarEvent(
  body: string,
  headers: Record<string, string>,
  secret: string,
): PolarEvent {
  if (!secret.startsWith("whsec_")) {
    return validateEvent(body, headers, secret);
  }

  const payload = new Webhook(secret).verify(body, headers);
  return parseVerifiedPayload(payload);
}

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
    event = validatePolarEvent(body, signatureHeaders, getPolarEnv().POLAR_WEBHOOK_SECRET);
  } catch (err) {
    if (
      err instanceof PolarWebhookVerificationError ||
      err instanceof StandardWebhookVerificationError
    ) {
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
      // Subscription state synchronization is idempotent. Re-run it for a
      // duplicate delivery so an event accepted during a previous parser or
      // processing bug can repair the user's billing state on redelivery.
      // Paid orders remain strictly once-only because they grant credits.
      if (SUBSCRIPTION_EVENTS.has(event.type)) {
        try {
          await handleEvent(event);
        } catch (syncError) {
          console.error(
            `[Polar Webhook] Error resyncing duplicate ${event.type} (${eventId}):`,
            syncError,
          );
          return NextResponse.json({ error: "Processing failed" }, { status: 500 });
        }
      }
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
