import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminShell from "@/components/admin/AdminShell";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface SyncLog {
  tenantId: string | null;
  tenantName: string | null;
  status: string;
  message: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number | null;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/20 text-green-600",
  success: "bg-green-500/20 text-green-600",
  failed: "bg-red-500/20 text-red-600",
  skipped: "bg-blue-500/20 text-blue-600",
};

export default function SyncBoard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: logsData, isLoading } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/admin/sync/logs"],
    enabled: userData?.user?.role === "admin",
  });

  useEffect(() => {
    if (!userLoading && (!userData?.user || userData.user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [userLoading, userData, navigate]);

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
    onError: (error: Error) => toast({ title: "Sync failed", description: error.message, variant: "destructive" }),
  });

  const logs = logsData?.logs || [];
  const failedCount = logs.filter((l) => l.status === "failed").length;

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
            <h1 className="text-2xl font-bold text-foreground">Sync Health</h1>
            {failedCount > 0 && (
              <p className="text-sm text-red-600">{failedCount} recent sync{failedCount === 1 ? "" : "s"} failed — review below.</p>
            )}
          </div>
          <Button onClick={() => runSyncMutation.mutate()} disabled={runSyncMutation.isPending} data-testid="button-run-sync">
            <RefreshCw className={`w-4 h-4 mr-2 ${runSyncMutation.isPending ? "animate-spin" : ""}`} />Run Scheduled Sync
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 bg-muted" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center border border-border rounded-lg bg-card">No sync activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg" data-testid={`row-sync-log-${i}`}>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{log.tenantName || "Unknown tenant"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.startedAt).toLocaleString()}</p>
                  {log.message && log.status === "failed" && <p className="text-xs text-red-600 truncate">{log.message}</p>}
                </div>
                <Badge className={STATUS_STYLES[log.status] || "bg-slate-500/20 text-muted-foreground"}>{log.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
