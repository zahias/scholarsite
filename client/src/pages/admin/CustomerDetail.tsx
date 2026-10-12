import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, Globe, User, CheckCircle, Save, BookOpen, RefreshCw,
  ExternalLink, PauseCircle, XCircle, PlayCircle, DollarSign, Eye, KeyRound,
} from "lucide-react";
import { TENANT_PLANS, TENANT_STATUSES, type PlanType, type TenantStatus } from "@shared/schema";
import { getEffectiveAccessState, ACCESS_STATE_LABELS, ACCESS_STATE_STYLES, PLAN_LABELS } from "@/lib/tenantDisplay";
import AdminShell from "@/components/admin/AdminShell";

const overviewSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plan: z.enum(TENANT_PLANS),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});
type OverviewForm = z.infer<typeof overviewSchema>;

interface Tenant {
  id: string;
  name: string;
  plan: PlanType;
  status: TenantStatus;
  contactEmail: string | null;
  notes: string | null;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  lastSyncAt: string | null;
  domains: Array<{ id: string; hostname: string; isPrimary: boolean; isSubdomain: boolean; sslStatus: string | null; verifiedAt: string | null }>;
  users: Array<{ id: string; email: string; firstName: string; lastName: string; isActive?: boolean }>;
  profile: { id: string; openalexId: string | null } | null;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

interface Payment {
  id: string;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  plan: string;
  createdAt: string;
}

interface SyncLog {
  id: string;
  status: string;
  syncType: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  totalShares: number;
  totalDownloads: number;
}

export default function CustomerDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/customers/:id");
  const { toast } = useToast();
  const isNew = params?.id === "new";
  const tenantId = isNew ? null : params?.id;

  const [newDomain, setNewDomain] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [openalexId, setOpenalexId] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tenantData, isLoading } = useQuery<{ tenant: Tenant }>({
    queryKey: ["/api/admin/tenants", tenantId],
    enabled: !!tenantId && userData?.user?.role === "admin",
  });
  const tenant = tenantData?.tenant;

  const { data: paymentsData } = useQuery<{ payments: Payment[] }>({
    queryKey: ["/api/admin/tenants", tenantId, "payments"],
    enabled: !!tenantId && userData?.user?.role === "admin",
  });

  const { data: syncLogsData } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/admin/tenants", tenantId, "sync-logs"],
    enabled: !!tenantId && userData?.user?.role === "admin",
  });

  const { data: analyticsData } = useQuery<{ summary: AnalyticsSummary | null }>({
    queryKey: ["/api/admin/tenants", tenantId, "analytics"],
    enabled: !!tenantId && userData?.user?.role === "admin",
  });

  const currentOpenalexId = tenant?.profile?.openalexId || "";
  useEffect(() => {
    if (currentOpenalexId) setOpenalexId(currentOpenalexId);
  }, [currentOpenalexId]);

  const form = useForm<OverviewForm>({
    resolver: zodResolver(overviewSchema),
    defaultValues: { name: "", plan: "starter", contactEmail: "", notes: "" },
    values: tenant
      ? { name: tenant.name, plan: tenant.plan, contactEmail: tenant.contactEmail || "", notes: tenant.notes || "" }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: OverviewForm) => {
      const response = await apiRequest("POST", "/api/admin/tenants", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Customer created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      navigate(`/admin/customers/${data.tenant.id}`);
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OverviewForm) => {
      const response = await apiRequest("PATCH", `/api/admin/tenants/${tenantId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/admin/tenants/${tenantId}`); },
    onSuccess: () => {
      toast({ title: "Customer deleted", description: "The tenant and all associated data were removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      navigate("/admin/customers");
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: TenantStatus) => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/status`, { status, reason: statusReason || undefined });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      setStatusReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const addDomainMutation = useMutation({
    mutationFn: async (hostname: string) => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/domains`, {
        hostname, isPrimary: !tenant?.domains?.length, isSubdomain: hostname.toLowerCase().endsWith(".scholar.name"),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Domain added" });
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => { await apiRequest("DELETE", `/api/admin/tenants/${tenantId}/domains/${domainId}`); },
    onSuccess: () => {
      toast({ title: "Success", description: "Domain removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/users`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User created" });
      setNewUser({ email: "", password: "", firstName: "", lastName: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}`, { isActive: false });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deactivated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const resetUserPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
      return response.json();
    },
    onSuccess: () => toast({ title: "Success", description: "Password reset" }),
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newOpenalexId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/tenants/${tenantId}/profile`, { openalexId: newOpenalexId || null });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "OpenAlex ID updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const syncTenantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync complete", description: data.message || "Tenant data was synced from OpenAlex." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId, "sync-logs"] });
    },
    onError: (error: any) => toast({ title: "Sync failed", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: OverviewForm) => (isNew ? createMutation.mutate(data) : updateMutation.mutate(data));

  // Redirect in an effect, not directly in the render body — calling navigate()
  // (a state update) synchronously during render throws "Cannot update a
  // component while rendering a different component."
  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

  if (userLoading || (!isNew && isLoading)) {
    return (
      <AdminShell>
        <div className="p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48 bg-muted" />
            <Skeleton className="h-96 bg-muted" />
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!userData?.user || userData.user.role !== "admin") {
    return null;
  }

  const primaryDomain = tenant?.domains.find((d) => d.isPrimary) || tenant?.domains[0];
  const accessState = tenant ? getEffectiveAccessState(tenant) : null;

  return (
    <AdminShell>
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{isNew ? "New Customer" : tenant?.name}</h1>
              {primaryDomain && (
                <a href={`https://${primaryDomain.hostname}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                  {primaryDomain.hostname} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {!isNew && tenant && accessState && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className={ACCESS_STATE_STYLES[accessState]}>{ACCESS_STATE_LABELS[accessState]}</Badge>
                <Badge className="bg-[#FFC72E]/20 text-[#8a6300]">{PLAN_LABELS[tenant.plan]}</Badge>
              </div>
            )}
          </div>
        </div>

        {!isNew ? (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="domains">Domains &amp; Site</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="sync">Sync &amp; Data</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground">Customer Details</CardTitle></CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Site Name</FormLabel>
                          <FormControl><Input {...field} className="bg-card border-border text-foreground" data-testid="input-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="plan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">Plan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="bg-card border-border text-foreground"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {TENANT_PLANS.map((plan) => (
                                  <SelectItem key={plan} value={plan}>{PLAN_LABELS[plan]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="contactEmail" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">Contact Email</FormLabel>
                            <FormControl><Input {...field} type="email" className="bg-card border-border text-foreground" data-testid="input-contact-email" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Notes</FormLabel>
                          <FormControl><Textarea {...field} className="bg-card border-border text-foreground min-h-[100px] font-mono text-xs" data-testid="input-notes" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                        <Save className="w-4 h-4 mr-2" />
                        {isNew ? "Create Customer" : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {tenant && (
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle className="text-foreground">Status</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Reason (optional, saved to notes)"
                      className="bg-card border-border text-foreground"
                      data-testid="input-status-reason"
                    />
                    <div className="flex flex-wrap gap-2">
                      {tenant.status === "pending" && (
                        <Button
                          onClick={() => statusMutation.mutate("active")}
                          disabled={tenant.domains.length === 0 || tenant.users.length === 0 || statusMutation.isPending}
                          data-testid="button-activate"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />Activate
                        </Button>
                      )}
                      {tenant.status === "active" && (
                        <>
                          <Button variant="outline" onClick={() => statusMutation.mutate("suspended")} disabled={statusMutation.isPending} data-testid="button-suspend">
                            <PauseCircle className="w-4 h-4 mr-2" />Suspend
                          </Button>
                          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => statusMutation.mutate("cancelled")} disabled={statusMutation.isPending} data-testid="button-cancel">
                            <XCircle className="w-4 h-4 mr-2" />Cancel
                          </Button>
                        </>
                      )}
                      {tenant.status === "suspended" && (
                        <>
                          <Button onClick={() => statusMutation.mutate("active")} disabled={statusMutation.isPending} data-testid="button-reactivate">
                            <PlayCircle className="w-4 h-4 mr-2" />Reactivate
                          </Button>
                          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => statusMutation.mutate("cancelled")} disabled={statusMutation.isPending} data-testid="button-cancel">
                            <XCircle className="w-4 h-4 mr-2" />Cancel
                          </Button>
                        </>
                      )}
                      {tenant.status === "cancelled" && (
                        <Button onClick={() => statusMutation.mutate("active")} disabled={statusMutation.isPending} data-testid="button-reactivate">
                          <PlayCircle className="w-4 h-4 mr-2" />Reactivate
                        </Button>
                      )}
                    </div>
                    {tenant.status === "pending" && (tenant.domains.length === 0 || tenant.users.length === 0) && (
                      <p className="text-xs text-muted-foreground">Add at least one domain and one user before activating.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {tenant && (
                <Card className="bg-red-500/5 border-red-500/20">
                  <CardHeader><CardTitle className="text-red-600 text-base">Danger Zone</CardTitle></CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" data-testid="button-delete-tenant">
                          <Trash2 className="w-4 h-4 mr-2" />Delete Customer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {tenant.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes the tenant, its domains, users, researcher profile, publications, payments, and sync history. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTenantMutation.mutate()}
                            disabled={deleteTenantMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            data-testid="button-confirm-delete-tenant"
                          >
                            {deleteTenantMutation.isPending ? "Deleting..." : "Delete permanently"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="domains" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Globe className="w-5 h-5" />Domains</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {tenant?.domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={`https://${domain.hostname}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">{domain.hostname}</a>
                        {domain.isPrimary && <Badge className="bg-green-500/20 text-green-700 dark:bg-green-500/15 dark:text-green-400">Primary</Badge>}
                        {(() => {
                          // *.scholar.name subdomains are covered by the platform's
                          // wildcard cert and are always valid — sslStatus is only
                          // meaningful (and only ever gets set) for custom domains,
                          // which need their own cert provisioning. Without this,
                          // every subdomain showed a permanently-stuck "pending" badge.
                          const isWildcardCovered = domain.hostname.endsWith(".scholar.name");
                          const isActive = isWildcardCovered || domain.sslStatus === "active";
                          return (
                            <Badge className={isActive ? "bg-green-500/20 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"}>
                              SSL: {isActive ? "active" : (domain.sslStatus || "pending")}
                            </Badge>
                          );
                        })()}
                        {domain.verifiedAt && <Badge className="bg-blue-500/20 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">Verified</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteDomainMutation.mutate(domain.id)} className="text-red-600 hover:text-red-600 hover:bg-red-500/10" data-testid={`button-delete-domain-${domain.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="drsmith.scholar.name or dr-smith.com" className="bg-card border-border text-foreground" data-testid="input-new-domain" />
                    <Button onClick={() => newDomain && addDomainMutation.mutate(newDomain)} disabled={!newDomain || addDomainMutation.isPending} data-testid="button-add-domain">
                      <Plus className="w-4 h-4 mr-1" />Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><BookOpen className="w-5 h-5" />OpenAlex Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
                    <span className="text-muted-foreground text-sm">Current:</span>
                    <span className="text-foreground font-mono">{tenant?.profile?.openalexId || "Not set"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input value={openalexId} onChange={(e) => setOpenalexId(e.target.value)} placeholder="A1234567890" className="bg-card border-border text-foreground font-mono" data-testid="input-openalexid" />
                    <Button onClick={() => updateProfileMutation.mutate(openalexId)} disabled={updateProfileMutation.isPending} data-testid="button-update-openalexid">
                      <Save className="w-4 h-4 mr-1" />Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" />Payment History</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!paymentsData?.payments?.length ? (
                    <p className="text-sm text-muted-foreground">No payments recorded for this customer yet.</p>
                  ) : (
                    paymentsData.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground">{payment.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()} · {payment.plan}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">${payment.amount} {payment.currency}</p>
                          <Badge className={payment.status === "completed" ? "bg-green-500/20 text-green-700 dark:bg-green-500/15 dark:text-green-400" : payment.status === "pending" ? "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" : "bg-red-500/20 text-red-700 dark:bg-red-500/15 dark:text-red-400"}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2"><RefreshCw className="w-5 h-5" />Sync History</CardTitle>
                    <Button onClick={() => syncTenantMutation.mutate()} disabled={!tenant?.profile?.openalexId || syncTenantMutation.isPending} data-testid="button-sync-tenant">
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncTenantMutation.isPending ? "animate-spin" : ""}`} />Sync Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!syncLogsData?.logs?.length ? (
                    <p className="text-sm text-muted-foreground">No sync activity recorded yet.</p>
                  ) : (
                    syncLogsData.logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                        <div>
                          <p className="text-sm text-foreground">{new Date(log.startedAt).toLocaleString()}</p>
                          {log.errorMessage && <p className="text-xs text-red-600">{log.errorMessage}</p>}
                        </div>
                        <Badge className={log.status === "completed" ? "bg-green-500/20 text-green-700 dark:bg-green-500/15 dark:text-green-400" : log.status === "failed" ? "bg-red-500/20 text-red-700 dark:bg-red-500/15 dark:text-red-400" : "bg-blue-500/20 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"}>
                          {log.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Eye className="w-5 h-5" />Analytics (last 30 days)</CardTitle></CardHeader>
                <CardContent>
                  {!analyticsData?.summary ? (
                    <p className="text-sm text-muted-foreground">No analytics available (profile not connected or no visits yet).</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-card border border-border rounded-lg text-center">
                        <p className="text-xl font-semibold text-foreground">{analyticsData.summary.totalViews}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg text-center">
                        <p className="text-xl font-semibold text-foreground">{analyticsData.summary.uniqueVisitors}</p>
                        <p className="text-xs text-muted-foreground">Unique Visitors</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg text-center">
                        <p className="text-xl font-semibold text-foreground">{analyticsData.summary.totalClicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg text-center">
                        <p className="text-xl font-semibold text-foreground">{analyticsData.summary.totalDownloads}</p>
                        <p className="text-xs text-muted-foreground">Downloads</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><User className="w-5 h-5" />Users</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {tenant?.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div>
                        <p className="text-foreground">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon"
                          title="Reset password"
                          onClick={() => {
                            const newPassword = window.prompt(`New password for ${user.email} (min 8 chars):`);
                            if (newPassword && newPassword.length >= 8) resetUserPasswordMutation.mutate({ userId: user.id, newPassword });
                          }}
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          title="Deactivate"
                          className="text-red-600 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => deactivateUserMutation.mutate(user.id)}
                          data-testid={`button-deactivate-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-border" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="First name" className="bg-card border-border text-foreground" data-testid="input-new-user-firstname" />
                    <Input value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Last name" className="bg-card border-border text-foreground" data-testid="input-new-user-lastname" />
                    <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} type="email" placeholder="Email" className="bg-card border-border text-foreground" data-testid="input-new-user-email" />
                    <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} type="password" placeholder="Password (min 8 chars)" className="bg-card border-border text-foreground" data-testid="input-new-user-password" />
                  </div>
                  <Button
                    onClick={() => newUser.email && newUser.password && newUser.firstName && newUser.lastName && addUserMutation.mutate(newUser)}
                    disabled={!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName || addUserMutation.isPending}
                    data-testid="button-add-user"
                  >
                    <Plus className="w-4 h-4 mr-1" />Add User
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground">Customer Details</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Site Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Dr. John Smith Portfolio" className="bg-card border-border text-foreground" data-testid="input-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="plan" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Plan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-card border-border text-foreground"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {TENANT_PLANS.filter((p) => p !== "free").map((plan) => (
                              <SelectItem key={plan} value={plan}>{PLAN_LABELS[plan]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contactEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Contact Email</FormLabel>
                        <FormControl><Input {...field} type="email" placeholder="contact@example.com" className="bg-card border-border text-foreground" data-testid="input-contact-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Notes</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Internal notes about this customer..." className="bg-card border-border text-foreground min-h-[80px]" data-testid="input-notes" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save">
                    <Save className="w-4 h-4 mr-2" />Create Customer
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </AdminShell>
  );
}
