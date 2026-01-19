import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld } from "@/inngest/functions/helloWorld";
import { generateScreens } from "@/inngest/functions/generateScreens";
import { generateWebScreens } from "@/inngest/functions/generateWebScreens";
import { generateCreativeScreens } from "@/inngest/functions/generateCreativeScreens";
import { regenerateFrame } from "@/inngest/functions/regenerateFrame";

// The serve() function automatically:
// - Detects INNGEST_SIGNING_KEY from environment for production webhook verification
// - Works with Inngest dev server in development (via INNGEST_DEV_SERVER_URL)
// - Registers all functions with Inngest Cloud when deployed
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    generateScreens,
    generateWebScreens,
    generateCreativeScreens,
    regenerateFrame,
  ],
  // Optional: Explicitly set signing key (if not using INNGEST_SIGNING_KEY env var)
  // signingKey: process.env.INNGEST_SIGNING_KEY,
});
