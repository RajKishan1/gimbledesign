import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld } from "@/inngest/functions/helloWorld";
import { generateScreens } from "@/inngest/functions/generateScreens";
import { generateWebScreens } from "@/inngest/functions/generateWebScreens";
import { generateWireframeScreens } from "@/inngest/functions/generateWireframeScreens";
import { regenerateFrame } from "@/inngest/functions/regenerateFrame";
import { generateFrameVariations } from "@/inngest/functions/generateFrameVariations";
import { generateInspirationVariations } from "@/inngest/functions/generateInspirationVariations";
import {
  generateAppStoreScreens,
  regenerateAppStoreScreen,
} from "@/inngest/functions/generateAppStoreScreens";

// Each Inngest step runs as its own request to this route. Image renders and
// long LLM calls can take well over a minute, so raise the serverless ceiling.
export const maxDuration = 300;

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
    generateWireframeScreens,
    regenerateFrame,
    generateFrameVariations,
    generateInspirationVariations,
    generateAppStoreScreens,
    regenerateAppStoreScreen,
  ],
  // Optional: Explicitly set signing key (if not using INNGEST_SIGNING_KEY env var)
  // signingKey: process.env.INNGEST_SIGNING_KEY,
});
