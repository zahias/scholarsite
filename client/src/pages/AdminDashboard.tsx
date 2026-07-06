import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Globe,
  Plus,
  LogOut,
  Settings,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Palette,
  UserCog,
  TrendingUp,
  BarChart3,
  CreditCard,
  RefreshCw,
  History,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  contactEmail: string | null;
  domains: Array<{ id: string; hostname: string; isPrimary: boolean }>;
  users: Array<{ id: string; email: string; firstName: string; lastName: string }>;
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
  users: {
    total: number;
    byRole: { admin: number; researcher: number };
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  tenants: {
    total: number;
    byStatus: { active: number; pending: number; suspended: number; cancelled: number };
    byPlan: { starter: number; professional: number; institution: number };
    newThisMonth: number;
  };
  overview: {
    totalUsers: number;
    totalTenants: number;
    activeTenants: number;
    activeUsers: number;
  };
}

interface Payment {
  id: string;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  plan: string;
  billingPeriod: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  completedAt: string | null;
}

interface SyncLog {
  tenantId?: string;
  tenantName?: string;
  status: string;
  message?: string;
  startedAt?: string;
  completedAt?: string;
  itemsProcessed?: number;
}

interface LegacyProfileAudit {
  summary: Record<string, number>;
  records: Array<{
    id: string;
    openalexId: string | null;
    displayName: string | null;
    email: string | null;
    tenantId: string | null;
    issue: string;
  }>;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  active: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10" },
  suspended: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-500/10" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
};

const planColors: Record<string, string> = {
  starter: "bg-blue-500/20 text-blue-600",
  professional: "bg-purple-500/20 text-purple-600",
  institution: "bg-amber-500/20 text-amber-600",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ["/api/admin/payments"],
    enabled: !!userData?.user,
  });

  const { data: syncLogsData, isLoading: syncLogsLoading } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/admin/sync/logs"],
    enabled: !!userData?.user,
  });

  const { data: legacyAuditData } = useQuery<LegacyProfileAudit>({
    queryKey: ["/api/admin/legacy-profile-audit"],
    enabled: !!userData?.user,
  });

  const runSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync/run");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sync completed", description: "Scheduled sync finished successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: Error) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderNumber, status }: { orderNumber: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/payments/${orderNumber}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Payment updated", description: "Payment status changed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.user || userData.user.role !== "admin") {
    return null;
  }

  const tenants = tenantsData?.tenants || [];
  const analytics = analyticsData?.analytics;
  const payments = paymentsData?.payments || [];
  const syncLogs = syncLogsData?.logs || [];
  const recentPayments = payments.slice(0, 5);
  const recentSyncLogs = syncLogs.slice(0, 5);
  const activeTenants = analytics?.tenants.byStatus.active || tenants.filter((t) => t.status === "active").length;
  const pendingTenants = analytics?.tenants.byStatus.pending || tenants.filter((t) => t.status === "pending").length;
  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const pendingPayments = payments.filter((payment) => payment.status === "pending");
  const unresolvedLegacyProfiles = legacyAuditData?.records || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Scholar.name Admin</h1>
              <p className="text-sm text-muted-foreground">Welcome, {userData.user.firstName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {unresolvedLegacyProfiles.length > 0 && (
          <section className="border border-amber-500/30 bg-amber-500/10 rounded-md p-4" aria-labelledby="legacy-profile-heading">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 id="legacy-profile-heading" className="font-semibold text-foreground">Legacy profiles need review</h2>
                <p className="text-sm text-amber-800/80 mt-1">
                  {unresolvedLegacyProfiles.length} profile{unresolvedLegacyProfiles.length === 1 ? "" : "s"} could not be linked automatically. Public OpenAlex previews remain available.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unresolvedLegacyProfiles.slice(0, 5).map((profile) => (
                    <Badge key={profile.id} className="bg-amber-500/20 text-amber-800">
                      {profile.displayName || profile.openalexId || profile.email || profile.id}: {profile.issue.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold text-foreground">{tenants.length}</p>
                  {analytics?.tenants.newThisMonth ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analytics.tenants.newThisMonth} this month
                    </p>
                  ) : null}
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sites</p>
                  <p className="text-3xl font-bold text-foreground">{activeTenants}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Setup</p>
                  <p className="text-3xl font-bold text-foreground">{pendingTenants}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{analytics?.users.total || 0}</p>
                  {analytics?.users.newThisMonth ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analytics.users.newThisMonth} this month
                    </p>
                  ) : null}
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        {analytics && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                Subscription Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Starter</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.tenants.byPlan.starter}</p>
                  <div className="w-full bg-blue-900/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${tenants.length ? (analytics.tenants.byPlan.starter / tenants.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4">
                  <p className="text-sm text-purple-600 mb-1">Professional</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.tenants.byPlan.professional}</p>
                  <div className="w-full bg-purple-900/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${tenants.length ? (analytics.tenants.byPlan.professional / tenants.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-4">
                  <p className="text-sm text-amber-600 mb-1">Institution</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.tenants.byPlan.institution}</p>
                  <div className="w-full bg-amber-900/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${tenants.length ? (analytics.tenants.byPlan.institution / tenants.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer" data-testid="link-users">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage platform users</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/themes">
            <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer" data-testid="link-themes">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Theme Management</h3>
                    <p className="text-sm text-muted-foreground">Customize portfolio color themes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/tenants/new">
            <Card className="bg-card border-border hover:bg-accent transition-colors cursor-pointer" data-testid="button-new-tenant">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">New Customer</h3>
                    <p className="text-sm text-muted-foreground">Create a new customer site</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                Payments
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Recent checkout activity and provisioning status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-card border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold text-foreground">{payments.length}</p>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-xs text-green-600">Completed</p>
                  <p className="text-xl font-semibold text-foreground">{completedPayments.length}</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <p className="text-xs text-yellow-600">Pending</p>
                  <p className="text-xl font-semibold text-foreground">{pendingPayments.length}</p>
                </div>
              </div>
              {paymentsLoading ? (
                <Skeleton className="h-28 bg-muted" />
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-border bg-card p-4">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-card border border-border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{payment.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{payment.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">${payment.amount} {payment.currency}</p>
                        <Badge className={payment.status === "completed" ? "bg-green-500/20 text-green-600" : payment.status === "pending" ? "bg-yellow-500/20 text-yellow-600" : "bg-red-500/20 text-red-600"}>
                          {payment.status}
                        </Badge>
                      </div>
                      {payment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatePaymentStatusMutation.isPending}
                          onClick={() => updatePaymentStatusMutation.mutate({ orderNumber: payment.orderNumber, status: "completed" })}
                          data-testid={`button-mark-completed-${payment.id}`}
                          title="Manually mark this payment completed — use when a MontyPay webhook didn't arrive but you've confirmed payment out-of-band"
                        >
                          Mark completed
                        </Button>
                      )}
                      {payment.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          disabled={updatePaymentStatusMutation.isPending}
                          onClick={() => updatePaymentStatusMutation.mutate({ orderNumber: payment.orderNumber, status: "refunded" })}
                          data-testid={`button-mark-refunded-${payment.id}`}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    OpenAlex Sync
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Run scheduled syncs and review recent sync activity
                  </CardDescription>
                </div>
                <Button
                  onClick={() => runSyncMutation.mutate()}
                  disabled={runSyncMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-run-admin-sync"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${runSyncMutation.isPending ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {syncLogsLoading ? (
                <Skeleton className="h-28 bg-muted" />
              ) : recentSyncLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-border bg-card p-4">
                  No sync activity has been recorded in this process.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSyncLogs.map((log, index) => (
                    <div key={`${log.tenantId || "scheduled"}-${log.startedAt || index}`} className="rounded-lg bg-card border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{log.tenantName || log.tenantId || "Scheduled sync"}</p>
                          <p className="text-xs text-muted-foreground truncate">{log.message || "Sync run recorded"}</p>
                        </div>
                        <Badge className={log.status === "success" || log.status === "completed" ? "bg-green-500/20 text-green-600" : log.status === "failed" ? "bg-red-500/20 text-red-600" : "bg-blue-500/20 text-blue-600"}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Customer Sites</h2>
        </div>

        {tenantsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 bg-muted" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No customers yet</h3>
              <p className="text-muted-foreground mb-4">Create your first customer site to get started</p>
              <Link href="/admin/tenants/new">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Customer
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tenants.map((tenant) => {
              const StatusIcon = statusConfig[tenant.status]?.icon || Clock;
              const statusColor = statusConfig[tenant.status]?.color || "text-muted-foreground";
              const statusBg = statusConfig[tenant.status]?.bg || "bg-slate-500/10";
              const primaryDomain = tenant.domains.find((d) => d.isPrimary) || tenant.domains[0];

              return (
                <Link key={tenant.id} href={`/admin/tenants/${tenant.id}`}>
                  <Card
                    className="bg-card border-border hover:bg-accent transition-colors cursor-pointer"
                    data-testid={`card-tenant-${tenant.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${statusBg} rounded-xl flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">{tenant.name}</h3>
                              <Badge className={planColors[tenant.plan] || "bg-slate-500/20 text-muted-foreground"}>
                                {tenant.plan}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {primaryDomain ? (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {primaryDomain.hostname}
                                </span>
                              ) : (
                                <span className="text-orange-600">No domain assigned</span>
                              )}
                              <span>•</span>
                              <span>{tenant.users.length} user(s)</span>
                              {tenant.profile?.openalexId && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">OpenAlex configured</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
