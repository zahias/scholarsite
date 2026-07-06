import { useMemo, useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminShell from "@/components/admin/AdminShell";
import { Search, Plus, ExternalLink } from "lucide-react";
import type { PlanType, TenantStatus } from "@shared/schema";
import { getEffectiveAccessState, ACCESS_STATE_LABELS, ACCESS_STATE_STYLES, PLAN_LABELS } from "@/lib/tenantDisplay";

interface Tenant {
  id: string;
  name: string;
  plan: PlanType;
  status: TenantStatus;
  contactEmail: string | null;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
  domains: Array<{ hostname: string; isPrimary: boolean }>;
  users: Array<{ id: string }>;
  profile: { openalexId: string | null; lastSyncedAt: string | null } | null;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

type SortKey = "name" | "created" | "lastSynced";

export default function CustomerList() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tenantsData, isLoading } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ["/api/admin/tenants"],
    enabled: userData?.user?.role === "admin",
  });

  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

  const filtered = useMemo(() => {
    const tenants = tenantsData?.tenants || [];
    const query = search.trim().toLowerCase();
    let result = tenants.filter((t) => {
      const matchesQuery = !query ||
        t.name.toLowerCase().includes(query) ||
        (t.contactEmail || "").toLowerCase().includes(query) ||
        t.domains.some((d) => d.hostname.toLowerCase().includes(query)) ||
        (t.profile?.openalexId || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPlan = planFilter === "all" || t.plan === planFilter;
      return matchesQuery && matchesStatus && matchesPlan;
    });
    result = [...result].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "lastSynced") {
        const aTime = a.profile?.lastSyncedAt ? new Date(a.profile.lastSyncedAt).getTime() : 0;
        const bTime = b.profile?.lastSyncedAt ? new Date(b.profile.lastSyncedAt).getTime() : 0;
        return bTime - aTime;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [tenantsData, search, statusFilter, planFilter, sortKey]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-8 w-48 bg-muted" />
      </div>
    );
  }

  if (!userData?.user || userData.user.role !== "admin") {
    return null;
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <Link href="/admin/customers/new">
            <Button data-testid="button-new-customer"><Plus className="w-4 h-4 mr-2" />New Customer</Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, domain, or OpenAlex ID..."
              className="pl-9 bg-card border-border text-foreground"
              data-testid="input-customer-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border text-foreground" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border text-foreground" data-testid="select-plan-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="free">Free Trial</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="institution">Institution</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[160px] bg-card border-border text-foreground" data-testid="select-sort"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Newest first</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="lastSynced">Last synced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 bg-muted" />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center border border-border rounded-lg bg-card">
            {tenantsData?.tenants.length ? "No customers match your filters." : "No customers yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((tenant) => {
              const accessState = getEffectiveAccessState(tenant);
              const primaryDomain = tenant.domains.find((d) => d.isPrimary) || tenant.domains[0];
              return (
                <Link key={tenant.id} href={`/admin/customers/${tenant.id}`}>
                  <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg hover:bg-accent cursor-pointer" data-testid={`row-customer-${tenant.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{tenant.name}</p>
                        {primaryDomain && (
                          <span className="text-xs text-blue-600 inline-flex items-center gap-1 shrink-0">
                            {primaryDomain.hostname} <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tenant.contactEmail || "No contact email"} · {tenant.users.length} user{tenant.users.length === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={ACCESS_STATE_STYLES[accessState]}>{ACCESS_STATE_LABELS[accessState]}</Badge>
                      <Badge className="bg-purple-500/20 text-purple-600">{PLAN_LABELS[tenant.plan]}</Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
