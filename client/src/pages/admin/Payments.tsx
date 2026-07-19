import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminShell from "@/components/admin/AdminShell";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

interface Payment {
  id: string;
  tenantId: string | null;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  plan: string;
  billingPeriod: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/20 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  pending: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  failed: "bg-red-500/20 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  refunded: "bg-slate-500/20 text-muted-foreground",
  cancelled: "bg-slate-500/20 text-muted-foreground",
};

export default function Payments() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: paymentsData, isLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ["/api/admin/payments"],
    enabled: userData?.user?.role === "admin",
  });

  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderNumber, status }: { orderNumber: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/payments/${orderNumber}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Payment updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: any) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const payments = useMemo(() => {
    const all = paymentsData?.payments || [];
    return statusFilter === "all" ? all : all.filter((p) => p.status === statusFilter);
  }, [paymentsData, statusFilter]);

  const stuckCount = (paymentsData?.payments || []).filter((p) => p.status === "pending").length;

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
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
            {stuckCount > 0 && (
              <p className="text-sm text-yellow-600">{stuckCount} payment{stuckCount === 1 ? "" : "s"} pending — may need manual review.</p>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border text-foreground" data-testid="select-payment-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 bg-muted" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center border border-border rounded-lg bg-card">No payments match this filter.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg" data-testid={`row-payment-${payment.id}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{payment.orderNumber}</p>
                    {payment.tenantId && (
                      <Link href={`/admin/customers/${payment.tenantId}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                        View customer <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{payment.customerName} · {payment.customerEmail} · {new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">${payment.amount} {payment.currency}</p>
                    <Badge className={STATUS_STYLES[payment.status] || "bg-slate-500/20 text-muted-foreground"}>{payment.status}</Badge>
                  </div>
                  {payment.status === "pending" && (
                    <Button size="sm" variant="outline" disabled={updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ orderNumber: payment.orderNumber, status: "completed" })} data-testid={`button-mark-completed-${payment.id}`}>
                      Mark completed
                    </Button>
                  )}
                  {payment.status === "completed" && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled={updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ orderNumber: payment.orderNumber, status: "refunded" })} data-testid={`button-refund-${payment.id}`}>
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
