import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import ResearcherProfile from "@/components/ResearcherProfile";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import TenantForm from "@/pages/TenantForm";
import ResearcherLogin from "@/pages/ResearcherLogin";
import ResearcherDashboard from "@/pages/ResearcherDashboard";
import TenantProfilePage from "@/pages/TenantProfilePage";

interface SiteContext {
  isTenantSite: boolean;
  isMarketingSite: boolean;
  tenant: {
    id: string;
    name: string;
    plan: string;
    primaryColor: string;
    accentColor: string;
  } | null;
  hasProfile: boolean;
  openalexId: string | null;
}

function Router() {
  const { data: siteContext, isLoading } = useQuery<SiteContext>({
    queryKey: ['/api/site-context'],
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F2994A]"></div>
      </div>
    );
  }

  if (siteContext?.isTenantSite) {
    return (
      <Switch>
        <Route path="/" component={TenantProfilePage} />
        <Route path="/dashboard/login" component={ResearcherLogin} />
        <Route path="/dashboard" component={ResearcherDashboard} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/researcher/:id" component={ResearcherProfile} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/tenants/:id" component={TenantForm} />
      <Route path="/dashboard/login" component={ResearcherLogin} />
      <Route path="/dashboard" component={ResearcherDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
