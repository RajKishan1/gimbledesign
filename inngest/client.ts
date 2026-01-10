import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";

// Create a client to send and receive events
// In production, the signing key is automatically detected from INNGEST_SIGNING_KEY env var
// In development, use `npx inngest-cli dev` for local testing
export const inngest = new Inngest({
  id: "xdesign-app",
  middleware: [realtimeMiddleware()],
  // Optional: Explicitly set event key for production (if not using default)
  eventKey: process.env.INNGEST_EVENT_KEY,
});
