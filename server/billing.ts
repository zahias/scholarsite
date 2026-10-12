import type { Tenant } from "@shared/schema";

export type TenantAccessState =
  | "active"
  | "trial_expired"
  | "subscription_expired"
  | "suspended"
  | "cancelled"
  | "pending"
  | "pending_review";

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

// Public visibility is stricter than dashboard access: a trial researcher can
// edit their portfolio while the ownership claim is under review, but nobody
// else sees it until an admin approves the claim.
export function getPublicAccessState(tenant: Tenant, now = new Date()): TenantAccessState {
  const state = getTenantAccessState(tenant, now);
  if (state === "active" && !tenant.claimApprovedAt) return "pending_review";
  return state;
}

export function tenantIsPubliclyVisible(tenant: Tenant, now = new Date()): boolean {
  return getPublicAccessState(tenant, now) === "active";
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
    case "pending_review":
      return "This portfolio is awaiting ownership review and isn't public yet.";
    case "active":
    default:
      return "This portfolio is active.";
  }
}
