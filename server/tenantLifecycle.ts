import type { TenantStatus } from "@shared/schema";

// Explicit allowed status transitions, replacing a raw enum PATCH that let an
// admin jump e.g. pending -> cancelled directly with no state-machine check.
// Each entry lists the statuses reachable from the key.
const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  pending: ["active", "cancelled"],
  active: ["suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  cancelled: ["active"], // win-back: reactivating a cancelled account is allowed, but explicit
};

export function canTransition(from: TenantStatus, to: TenantStatus): boolean {
  if (from === to) return true; // no-op save (e.g. editing name only) shouldn't be blocked
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function describeTransition(from: TenantStatus, to: TenantStatus): string {
  if (from === to) return `No status change (${to})`;
  const labels: Record<TenantStatus, string> = {
    active: "Activated",
    suspended: "Suspended",
    cancelled: "Cancelled",
    pending: "Set to pending",
  };
  return labels[to] || `Changed to ${to}`;
}

// Appends a timestamped transition note to the tenant's existing notes rather
// than adding a new DB column/migration — keeps a lightweight paper trail
// ("why was this suspended") without the heavier tenant_status_history table,
// which is deferred as its own follow-up.
export function appendTransitionNote(existingNotes: string | null, from: TenantStatus, to: TenantStatus, reason?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const action = describeTransition(from, to);
  const line = reason ? `[${date}] ${action}: ${reason}` : `[${date}] ${action}`;
  return existingNotes ? `${line}\n${existingNotes}` : line;
}
