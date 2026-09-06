/**
 * Plan catalog — the single source of truth for what each tier is called,
 * costs and includes. Safe to import from client components: it holds no
 * secrets. Polar product IDs live server-side in `lib/polar/products.ts`.
 *
 * Display prices must match the prices configured on the Polar products;
 * Polar's checkout is what actually charges the customer.
 */

export const PLAN_IDS = ["free", "basic", "pro", "max"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PAID_PLAN_IDS = ["basic", "pro", "max"] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export interface PlanDefinition<Id extends PlanId = PlanId> {
  id: Id;
  name: string;
  tagline: string;
  /** USD per month. */
  priceMonthly: number;
  /** Credits granted on every successful payment (initial + each renewal). */
  credits: number;
  /** Rough "screens per month" equivalent shown in marketing copy. */
  screens: number;
  features: readonly string[];
  cta: string;
  popular: boolean;
}

export const PLANS: { [K in PlanId]: PlanDefinition<K> } = {
  free: {
    id: "free",
    name: "Free",
    tagline: "For quick experiments",
    priceMonthly: 0,
    credits: 100,
    screens: 3,
    cta: "Try Free",
    popular: false,
    features: [
      "Mobile + Web screen generation",
      "Edit screens (uses credits)",
      "1 project",
      "Community support",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    tagline: "For getting started",
    priceMonthly: 9,
    credits: 500,
    screens: 50,
    cta: "Start Basic",
    popular: false,
    features: [
      "Up to 5 projects",
      "Edit with AI",
      "Create Prototypes",
      "Export to Figma",
      "Export to AI Coding apps",
      "Standard support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For higher limits",
    priceMonthly: 29,
    credits: 1000,
    screens: 100,
    cta: "Go Pro",
    popular: true,
    features: [
      "Unlimited projects",
      "Edit with AI",
      "Create Prototypes",
      "Export to Figma",
      "Export to AI Coding apps",
      "Priority support",
    ],
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "For agencies & product teams",
    priceMonthly: 79,
    credits: 2000,
    screens: 200,
    cta: "Go Max",
    popular: false,
    features: [
      "Unlimited projects",
      "Edit with AI",
      "Create Prototypes",
      "Export to Figma",
      "Export to AI Coding apps",
      "Priority support",
      "Dedicated account manager",
    ],
  },
};

/** Purchasable plans, in display order, for the pricing grids. */
export const PAID_PLAN_LIST: readonly PlanDefinition<PaidPlanId>[] = PAID_PLAN_IDS.map(
  (id) => PLANS[id],
);

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === "string" && (PAID_PLAN_IDS as readonly string[]).includes(value);
}

/** Resolve a stored `User.plan` value (possibly stale/unknown) to a catalog entry. */
export function planFromStored(value: string | null | undefined): PlanDefinition {
  return isPaidPlanId(value) ? PLANS[value] : PLANS.free;
}
