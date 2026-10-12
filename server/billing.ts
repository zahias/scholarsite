import type { Tenant } from "@shared/schema";

export type TenantAccessState =
  | "active"
  | "trial_expired"
  | "subscription_expired"
  | "suspended"
  | "cancelled"
  | "pending";

export function getTenantAccessState(tenant: Tenant, now = new Date()): TenantAccessState {
  if (tenant.status === "cancelled") return "cancelled";
  if (tenant.status === "suspended") return "suspended";
  if (tenant.status === "pending") return "pending";

  if (tenant.plan === "free" && tenant.trialEndsAt && tenant.trialEndsAt <= now) {
    return "trial_expired";
  }

  if (tenant.plan !== "free" && tenant.subscriptionEndDate && tenant.subscriptionEndDate <= now) {
    return "subscription_expired";
  }

  return "active";
}

export function tenantHasServiceAccess(tenant: Tenant, now = new Date()): boolean {
  return getTenantAccessState(tenant, now) === "active";
}

export function getTenantAccessMessage(state: TenantAccessState): string {
  switch (state) {
    case "trial_expired":
      return "Your free trial has ended. Choose a paid plan to reactivate your public portfolio.";
    case "subscription_expired":
      return "Your subscription period has ended. Choose a plan to reactivate your public portfolio.";
    case "suspended":
      return "This portfolio is suspended. Contact support to reactivate it.";
    case "cancelled":
      return "This portfolio is cancelled.";
    case "pending":
      return "This portfolio is pending activation.";
    case "active":
    default:
      return "This portfolio is active.";
  }
}
