import type { PlanType, TenantStatus } from "@shared/schema";

// Mirrors server/billing.ts's getTenantAccessState — the raw `status` column
// alone doesn't tell you whether a nominally "active" tenant is actually
// trial/subscription-expired, which was invisible in the admin UI before.
export type AccessState = "active" | "trial_expired" | "subscription_expired" | "suspended" | "cancelled" | "pending";

export interface TenantLifecycleFields {
  status: TenantStatus;
  plan: PlanType;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
}

export function getEffectiveAccessState(tenant: TenantLifecycleFields): AccessState {
  if (tenant.status === "cancelled") return "cancelled";
  if (tenant.status === "suspended") return "suspended";
  if (tenant.status === "pending") return "pending";
  const now = new Date();
  if (tenant.plan === "free" && tenant.trialEndsAt && new Date(tenant.trialEndsAt) <= now) return "trial_expired";
  if (tenant.plan !== "free" && tenant.subscriptionEndDate && new Date(tenant.subscriptionEndDate) <= now) return "subscription_expired";
  return "active";
}

export const ACCESS_STATE_LABELS: Record<AccessState, string> = {
  active: "Active",
  trial_expired: "Trial Expired",
  subscription_expired: "Subscription Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
  pending: "Pending Setup",
};

export const ACCESS_STATE_STYLES: Record<AccessState, string> = {
  active: "bg-green-500/20 text-green-600",
  trial_expired: "bg-yellow-500/20 text-yellow-600",
  subscription_expired: "bg-yellow-500/20 text-yellow-600",
  suspended: "bg-red-500/20 text-red-600",
  cancelled: "bg-slate-500/20 text-muted-foreground",
  pending: "bg-blue-500/20 text-blue-600",
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Free Trial",
  starter: "Starter ($9.99/mo)",
  professional: "Professional ($19.99/mo)",
  institution: "Institution (contact pricing)",
};
