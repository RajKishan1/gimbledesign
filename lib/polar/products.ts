import "server-only";
import { PAID_PLAN_IDS, type PaidPlanId } from "@/lib/plans";
import { getPolarEnv } from "./env";

function productMap(): Record<PaidPlanId, string> {
  const env = getPolarEnv();
  return {
    basic: env.POLAR_PRODUCT_BASIC,
    pro: env.POLAR_PRODUCT_PRO,
    max: env.POLAR_PRODUCT_MAX,
  };
}

/** Polar product ID for a paid plan. */
export function productIdForPlan(planId: PaidPlanId): string {
  return productMap()[planId];
}

/** Reverse lookup; returns null for products this app doesn't know about. */
export function planForProductId(productId: string): PaidPlanId | null {
  const map = productMap();
  return PAID_PLAN_IDS.find((id) => map[id] === productId) ?? null;
}
