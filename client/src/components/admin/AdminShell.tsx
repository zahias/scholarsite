import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Users2, DollarSign, RefreshCw, Palette, UserCog, LogOut, Search, ChevronDown,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  contactEmail: string | null;
  domains: Array<{ hostname: string }>;
  profile: { openalexId: string | null } | null;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Customers", icon: Users2 },
  { href: "/admin/payments", label: "Billing", icon: DollarSign },
  { href: "/admin/sync", label: "Sync", icon: RefreshCw },
];

const PLATFORM_ITEMS = [
  { href: "/admin/themes", label: "Themes", icon: Palette },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(location.startsWith("/admin/themes") || location.startsWith("/admin/users"));

  useEffect(() => {
    const match = [...NAV_ITEMS, ...PLATFORM_ITEMS].find((item) => item.href === location || (item.href !== "/admin" && location.startsWith(item.href)));
    document.title = match ? `${match.label} — Scholar.name Admin` : "Scholar.name Admin";
  }, [location]);

  const { data: tenantsData } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ["/api/admin/tenants"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/logout"); },
    onSuccess: () => {
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query.length >= 2
    ? (tenantsData?.tenants || []).filter((t) =>
        t.name.toLowerCase().includes(query) ||
        (t.contactEmail || "").toLowerCase().includes(query) ||
        t.domains.some((d) => d.hostname.toLowerCase().includes(query)) ||
        (t.profile?.openalexId || "").toLowerCase().includes(query)
      ).slice(0, 8)
    : [];

  const isActive = (href: string) => (href === "/admin" ? location === "/admin" : location.startsWith(href));

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="font-semibold text-foreground">Scholar.name Admin</Link>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${isActive(href) ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />{label}
              </div>
            </Link>
          ))}
          <button
            onClick={() => setPlatformOpen(!platformOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-expanded={platformOpen}
            data-testid="button-toggle-platform-nav"
          >
            <span>Platform</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${platformOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {platformOpen && (
            <div className="pl-3 space-y-1">
              {PLATFORM_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${isActive(href) ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />{label}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card/90 backdrop-blur-lg sticky top-0 z-50 p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="Search customers by name, email, domain, or OpenAlex ID..."
              className="pl-9 bg-background border-border text-foreground"
              data-testid="input-global-search"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50">
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                    onMouseDown={() => { navigate(`/admin/customers/${t.id}`); setSearchQuery(""); setShowResults(false); }}
                    data-testid={`search-result-${t.id}`}
                  >
                    <p className="text-foreground font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.contactEmail || t.domains[0]?.hostname || "No contact info"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
