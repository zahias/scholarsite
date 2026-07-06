import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminShell from "@/components/admin/AdminShell";
import { AlertCircle, ArrowRight, Users2, DollarSign, RefreshCw } from "lucide-react";
import { getEffectiveAccessState } from "@/lib/tenantDisplay";
import type { PlanType, TenantStatus } from "@shared/schema";

interface Tenant {
  id: string;
  name: string;
  plan: PlanType;
  status: TenantStatus;
  contactEmail: string | null;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  domains: Array<{ hostname: string; isPrimary: boolean }>;
  users: Array<{ id: string }>;
  profile: { openalexId: string | null } | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Analytics {
  tenants: {
    total: number;
    byStatus: { active: number; pending: number; suspended: number; cancelled: number };
    newThisMonth: number;
  };
}

interface Payment {
  id: string;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  customerName: string;
  createdAt: string;
  tenantId: string | null;
}

interface SyncLog {
  tenantId: string | null;
  tenantName: string | null;
  status: string;
  startedAt: string;
}

interface LegacyProfileAudit {
  records: Array<{
    id: string;
    displayName: string | null;
    openalexId: string | null;
    email: string | null;
    issue: string;
  }>;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ["/api/admin/tenants"],
    enabled: !!userData?.user,
  });

  const { data: analyticsData } = useQuery<{ analytics: Analytics }>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!userData?.user,
  });

  const { data: paymentsData } = useQuery<{ payments: Payment[] }>({
    queryKey: ["/api/admin/payments"],
    enabled: !!userData?.user,
  });

  const { data: syncLogsData } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/admin/sync/logs"],
    enabled: !!userData?.user,
  });

  const { data: legacyAuditData } = useQuery<LegacyProfileAudit>({
    queryKey: ["/api/admin/legacy-profile-audit"],
    enabled: !!userData?.user,
  });

  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

  const tenants = tenantsData?.tenants || [];
  const payments = paymentsData?.payments || [];
  const syncLogs = syncLogsData?.logs || [];
  const legacyRecords = legacyAuditData?.records || [];

  const stuckPayments = useMemo(() => payments.filter((p) => p.status === "pending"), [payments]);
  const failedSyncs = useMemo(() => syncLogs.filter((l) => l.status === "failed").slice(0, 5), [syncLogs]);
  const trialsExpiringSoon = useMemo(() => {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    return tenants.filter((t) => {
      if (t.plan !== "free" || !t.trialEndsAt) return false;
      const endsAt = new Date(t.trialEndsAt);
      return endsAt <= in3Days && getEffectiveAccessState(t) !== "trial_expired";
    });
  }, [tenants]);

  const recentSignups = useMemo(() =>
    [...tenants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [tenants]
  );

  const hasAttentionItems = stuckPayments.length > 0 || failedSyncs.length > 0 || trialsExpiringSoon.length > 0 || legacyRecords.length > 0;

  if (userLoading || tenantsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full bg-muted" />
          <Skeleton className="h-40 w-full bg-muted" />
        </div>
      </div>
    );
  }

  if (!userData?.user || userData.user.role !== "admin") {
    return null;
  }

  const analytics = analyticsData?.analytics;

  return (
    <AdminShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {userData.user.firstName}</h1>
          <p className="text-sm text-muted-foreground">Here's what needs attention today.</p>
        </div>

        {hasAttentionItems && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-600" />Needs Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {legacyRecords.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <p className="text-sm font-medium text-foreground">{legacyRecords.length} legacy profile{legacyRecords.length === 1 ? "" : "s"} need review</p>
                  <p className="text-xs text-muted-foreground">Could not be linked to a tenant automatically. Public OpenAlex previews remain available.</p>
                </div>
              )}
              {stuckPayments.length > 0 && (
                <Link href="/admin/payments">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 cursor-pointer hover:bg-yellow-500/20" data-testid="link-attention-payments">
                    <p className="text-sm font-medium text-foreground">{stuckPayments.length} payment{stuckPayments.length === 1 ? "" : "s"} pending review</p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              )}
              {failedSyncs.length > 0 && (
                <Link href="/admin/sync">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/10 cursor-pointer hover:bg-red-500/20" data-testid="link-attention-sync">
                    <p className="text-sm font-medium text-foreground">{failedSyncs.length} recent sync failure{failedSyncs.length === 1 ? "" : "s"}</p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              )}
              {trialsExpiringSoon.map((tenant) => (
                <Link key={tenant.id} href={`/admin/customers/${tenant.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 cursor-pointer hover:bg-blue-500/20" data-testid={`link-attention-trial-${tenant.id}`}>
                    <p className="text-sm font-medium text-foreground">{tenant.name}'s trial ends {new Date(tenant.trialEndsAt!).toLocaleDateString()}</p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-semibold text-foreground">{analytics.tenants.total}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-foreground">{analytics.tenants.byStatus.active}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">Pending Setup</p>
              <p className="text-2xl font-semibold text-foreground">{analytics.tenants.byStatus.pending}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">New This Month</p>
              <p className="text-2xl font-semibold text-foreground">{analytics.tenants.newThisMonth}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><Users2 className="w-4 h-4" />Recent Signups</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recentSignups.length === 0 ? (
                <p className="text-xs text-muted-foreground">No customers yet.</p>
              ) : (
                recentSignups.map((t) => (
                  <Link key={t.id} href={`/admin/customers/${t.id}`}>
                    <div className="text-sm text-foreground hover:underline cursor-pointer truncate" data-testid={`link-recent-signup-${t.id}`}>{t.name}</div>
                  </Link>
                ))
              )}
              <Link href="/admin/customers"><div className="text-xs text-blue-600 hover:underline cursor-pointer pt-1">View all customers →</div></Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><DollarSign className="w-4 h-4" />Recent Payments</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payments yet.</p>
              ) : (
                payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate">{p.customerName}</span>
                    <Badge className={p.status === "completed" ? "bg-green-500/20 text-green-600" : p.status === "pending" ? "bg-yellow-500/20 text-yellow-600" : "bg-red-500/20 text-red-600"}>
                      {p.status}
                    </Badge>
                  </div>
                ))
              )}
              <Link href="/admin/payments"><div className="text-xs text-blue-600 hover:underline cursor-pointer pt-1">View all payments →</div></Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground flex items-center gap-2 text-base"><RefreshCw className="w-4 h-4" />Recent Syncs</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {syncLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sync activity yet.</p>
              ) : (
                syncLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate">{log.tenantName || "Unknown"}</span>
                    <Badge className={log.status === "completed" ? "bg-green-500/20 text-green-600" : log.status === "failed" ? "bg-red-500/20 text-red-600" : "bg-blue-500/20 text-blue-600"}>
                      {log.status}
                    </Badge>
                  </div>
                ))
              )}
              <Link href="/admin/sync"><div className="text-xs text-blue-600 hover:underline cursor-pointer pt-1">View sync health →</div></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
