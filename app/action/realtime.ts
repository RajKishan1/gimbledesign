"use server";

import { inngest } from "@/inngest/client";
import { getSubscriptionToken } from "@inngest/realtime";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function fetchRealtimeSubscriptionToken() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      console.error("[Realtime] Unauthorized: No user session");
      throw new Error("Unauthorized");
    }

    // Check if required environment variables are set (for production)
    if (process.env.NODE_ENV === "production") {
      if (!process.env.INNGEST_SIGNING_KEY) {
        console.error("[Realtime] Missing INNGEST_SIGNING_KEY in production");
      }
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.error("[Realtime] Missing NEXT_PUBLIC_APP_URL in production");
      }
    }

    // This creates a token using the Inngest API that is bound to the channel and topic:
    const token = await getSubscriptionToken(inngest, {
      channel: `user:${user.id}`,
      topics: [
        "generation.start",
        "analysis.start",
        "analysis.complete",
        "frame.created",
        "generation.complete",
      ],
    });

    console.log("[Realtime] Token generated successfully for user:", user.id);
    return token;
  } catch (error) {
    console.error("[Realtime] Error generating subscription token:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
    throw error;
  }
}
