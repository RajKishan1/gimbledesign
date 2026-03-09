// Map your Paddle price IDs to plan config.
// Fill these in from your Paddle dashboard after creating products/prices.
// Sandbox: Dashboard → Catalog → Products
// Format: pri_xxxxxxxxxxxxxxxxxxxxxxxx

export type PlanId = "lite" | "starter" | "pro" | "team";

export interface PlanConfig {
  name: string;
  credits: number;          // credits awarded per billing cycle
  monthlyPriceId: string;   // Paddle price ID for monthly billing
  yearlyPriceId: string;    // Paddle price ID for yearly billing
}

export const PLANS: Record<PlanId, PlanConfig> = {
  lite: {
    name: "Lite",
    credits: 1000,
    monthlyPriceId: process.env.PADDLE_PRICE_LITE_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_LITE_YEARLY  ?? "",
  },
  starter: {
    name: "Starter",
    credits: 3000,
    monthlyPriceId: process.env.PADDLE_PRICE_STARTER_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_STARTER_YEARLY  ?? "",
  },
  pro: {
    name: "Pro",
    credits: 20000,
    monthlyPriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_PRO_YEARLY  ?? "",
  },
  team: {
    name: "Team",
    credits: 30000,
    monthlyPriceId: process.env.PADDLE_PRICE_TEAM_MONTHLY ?? "",
    yearlyPriceId:  process.env.PADDLE_PRICE_TEAM_YEARLY  ?? "",
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
