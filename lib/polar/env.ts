import "server-only";
import { z } from "zod";

/**
 * Polar configuration, validated once on first use so a misconfigured
 * deployment fails loudly with a readable message instead of at checkout time.
 */
const polarEnvSchema = z.object({
  POLAR_ACCESS_TOKEN: z.string().min(1),
  POLAR_WEBHOOK_SECRET: z.string().min(1),
  POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
  POLAR_PRODUCT_BASIC: z.uuid(),
  POLAR_PRODUCT_PRO: z.uuid(),
  POLAR_PRODUCT_MAX: z.uuid(),
});

export type PolarEnv = z.infer<typeof polarEnvSchema>;

let cached: PolarEnv | undefined;

export function getPolarEnv(): PolarEnv {
  if (cached) return cached;

  const result = polarEnvSchema.safeParse({
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_SERVER: process.env.POLAR_SERVER || undefined,
    POLAR_PRODUCT_BASIC: process.env.POLAR_PRODUCT_BASIC,
    POLAR_PRODUCT_PRO: process.env.POLAR_PRODUCT_PRO,
    POLAR_PRODUCT_MAX: process.env.POLAR_PRODUCT_MAX,
  });

  if (!result.success) {
    const keys = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`[Polar] Invalid or missing environment variables: ${keys}`);
  }

  cached = result.data;
  return cached;
}

/**
 * Canonical public origin of this deployment. Never derived from request
 * headers, so a spoofed Host header can't redirect checkout success elsewhere.
 */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
