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
  active: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  suspended: { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

const planColors: Record<string, string> = {
  starter: "bg-blue-500/20 text-blue-300",
  professional: "bg-purple-500/20 text-purple-300",
  institution: "bg-amber-500/20 text-amber-300",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 bg-white/5" />
            <Skeleton className="h-32 bg-white/5" />
            <Skeleton className="h-32 bg-white/5" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Scholar.name Admin</h1>
              <p className="text-sm text-slate-400">Welcome, {userData.user.firstName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="text-slate-400 hover:text-white hover:bg-white/10"
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
              <AlertCircle className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 id="legacy-profile-heading" className="font-semibold text-white">Legacy profiles need review</h2>
                <p className="text-sm text-amber-100/80 mt-1">
                  {unresolvedLegacyProfiles.length} profile{unresolvedLegacyProfiles.length === 1 ? "" : "s"} could not be linked automatically. Public OpenAlex previews remain available.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unresolvedLegacyProfiles.slice(0, 5).map((profile) => (
                    <Badge key={profile.id} className="bg-amber-500/20 text-amber-100">
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
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Customers</p>
                  <p className="text-3xl font-bold text-white">{tenants.length}</p>
                  {analytics?.tenants.newThisMonth ? (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analytics.tenants.newThisMonth} this month
                    </p>
                  ) : null}
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Sites</p>
                  <p className="text-3xl font-bold text-white">{activeTenants}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Setup</p>
                  <p className="text-3xl font-bold text-white">{pendingTenants}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{analytics?.users.total || 0}</p>
                  {analytics?.users.newThisMonth ? (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analytics.users.newThisMonth} this month
                    </p>
                  ) : null}
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        {analytics && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                Subscription Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <p className="text-sm text-blue-300 mb-1">Starter</p>
                  <p className="text-2xl font-bold text-white">{analytics.tenants.byPlan.starter}</p>
                  <div className="w-full bg-blue-900/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${tenants.length ? (analytics.tenants.byPlan.starter / tenants.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4">
                  <p className="text-sm text-purple-300 mb-1">Professional</p>
                  <p className="text-2xl font-bold text-white">{analytics.tenants.byPlan.professional}</p>
                  <div className="w-full bg-purple-900/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${tenants.length ? (analytics.tenants.byPlan.professional / tenants.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-4">
                  <p className="text-sm text-amber-300 mb-1">Institution</p>
                  <p className="text-2xl font-bold text-white">{analytics.tenants.byPlan.institution}</p>
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
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer" data-testid="link-users">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">User Management</h3>
                    <p className="text-sm text-slate-400">Manage platform users</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/themes">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer" data-testid="link-themes">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">Theme Management</h3>
                    <p className="text-sm text-slate-400">Customize portfolio color themes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/tenants/new">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer" data-testid="button-new-tenant">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">New Customer</h3>
                    <p className="text-sm text-slate-400">Create a new customer site</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-400" />
                Payments
              </CardTitle>
              <CardDescription className="text-slate-400">
                Recent checkout activity and provisioning status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-xl font-semibold text-white">{payments.length}</p>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-xs text-green-300">Completed</p>
                  <p className="text-xl font-semibold text-white">{completedPayments.length}</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <p className="text-xs text-yellow-300">Pending</p>
                  <p className="text-xl font-semibold text-white">{pendingPayments.length}</p>
                </div>
              </div>
              {paymentsLoading ? (
                <Skeleton className="h-28 bg-white/5" />
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-slate-400 rounded-lg border border-white/10 bg-white/5 p-4">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{payment.customerName}</p>
                        <p className="text-xs text-slate-400 truncate">{payment.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">${payment.amount} {payment.currency}</p>
                        <Badge className={payment.status === "completed" ? "bg-green-500/20 text-green-300" : payment.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    OpenAlex Sync
                  </CardTitle>
                  <CardDescription className="text-slate-400">
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
                <Skeleton className="h-28 bg-white/5" />
              ) : recentSyncLogs.length === 0 ? (
                <p className="text-sm text-slate-400 rounded-lg border border-white/10 bg-white/5 p-4">
                  No sync activity has been recorded in this process.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSyncLogs.map((log, index) => (
                    <div key={`${log.tenantId || "scheduled"}-${log.startedAt || index}`} className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{log.tenantName || log.tenantId || "Scheduled sync"}</p>
                          <p className="text-xs text-slate-400 truncate">{log.message || "Sync run recorded"}</p>
                        </div>
                        <Badge className={log.status === "success" || log.status === "completed" ? "bg-green-500/20 text-green-300" : log.status === "failed" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}>
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
          <h2 className="text-xl font-semibold text-white">Customer Sites</h2>
        </div>

        {tenantsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 bg-white/5" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No customers yet</h3>
              <p className="text-slate-400 mb-4">Create your first customer site to get started</p>
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
              const statusColor = statusConfig[tenant.status]?.color || "text-slate-400";
              const statusBg = statusConfig[tenant.status]?.bg || "bg-slate-500/10";
              const primaryDomain = tenant.domains.find((d) => d.isPrimary) || tenant.domains[0];

              return (
                <Link key={tenant.id} href={`/admin/tenants/${tenant.id}`}>
                  <Card
                    className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
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
                              <h3 className="font-medium text-white">{tenant.name}</h3>
                              <Badge className={planColors[tenant.plan] || "bg-slate-500/20 text-slate-300"}>
                                {tenant.plan}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              {primaryDomain ? (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {primaryDomain.hostname}
                                </span>
                              ) : (
                                <span className="text-orange-400">No domain assigned</span>
                              )}
                              <span>•</span>
                              <span>{tenant.users.length} user(s)</span>
                              {tenant.profile?.openalexId && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-400">OpenAlex configured</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
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
