// Single source of truth for plan pricing — imported by both the server
// (checkout session creation, the source of truth for what's actually charged)
// and the client (checkout/pricing display), so the two can't drift apart.
export const PRICING = {
  starter: { monthly: 9.99, yearly: 95.88 },
  pro: { monthly: 19.99, yearly: 191.88 },
} as const;

export type PlanId = keyof typeof PRICING;
export type BillingPeriod = keyof typeof PRICING["starter"];
