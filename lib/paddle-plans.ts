// Map your Paddle price IDs to plan config.
// Fill these in from your Paddle dashboard after creating products/prices.
// Sandbox: Dashboard → Catalog → Products
// Format: pri_xxxxxxxxxxxxxxxxxxxxxxxx

export type PlanId = "free" | "starter" | "pro" | "scale";

export interface PlanConfig {
  name: string;
  credits: number;          // credits awarded per billing cycle
  monthlyPriceId: string;   // Paddle price ID for monthly billing
  yearlyPriceId: string;    // Paddle price ID for yearly billing
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    name: "Free",
    credits: 30,
    monthlyPriceId: "",
    yearlyPriceId:  "",
  },
  starter: {
    name: "Starter",
    credits: 500,
    monthlyPriceId: process.env.PADDLE_PRICE_STARTER_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_STARTER_YEARLY  ?? "",
  },
  pro: {
    name: "Pro",
    credits: 1000,
    monthlyPriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_PRO_YEARLY  ?? "",
  },
  scale: {
    name: "Scale",
    credits: 2000,
    monthlyPriceId: process.env.PADDLE_PRICE_SCALE_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_SCALE_YEARLY  ?? "",
  },
};

// Reverse lookup: Paddle price ID → plan ID
export const PRICE_TO_PLAN: Record<string, PlanId> = Object.entries(PLANS).reduce(
  (acc, [planId, config]) => {
    if (config.monthlyPriceId) acc[config.monthlyPriceId] = planId as PlanId;
    if (config.yearlyPriceId)  acc[config.yearlyPriceId]  = planId as PlanId;
    return acc;
  },
  {} as Record<string, PlanId>,
);

export const PAID_PLAN_IDS: PlanId[] = ["starter", "pro", "scale"];
