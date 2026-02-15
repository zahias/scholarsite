import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AnalyticsProvider } from "@/lib/analytics";

// Eagerly loaded (landing-critical)
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/not-found";

// Lazy-loaded pages
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const DemoPage = lazy(() => import("@/pages/DemoPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const ResearcherProfile = lazy(() => import("@/components/ResearcherProfile"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminThemes = lazy(() => import("@/pages/AdminThemes"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const TenantForm = lazy(() => import("@/pages/TenantForm"));
const ResearcherLogin = lazy(() => import("@/pages/ResearcherLogin"));
const ResearcherDashboard = lazy(() => import("@/pages/ResearcherDashboard"));
const TenantProfilePage = lazy(() => import("@/pages/TenantProfilePage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const CheckoutSuccessPage = lazy(() => import("@/pages/CheckoutSuccessPage"));
const CheckoutCancelPage = lazy(() => import("@/pages/CheckoutCancelPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

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
      <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F2994A]"></div>
        <span className="sr-only">Loading site…</span>
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
      <Route path="/demo" component={DemoPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/researcher/:id" component={ResearcherProfile} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/themes" component={AdminThemes} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/tenants/:id" component={TenantForm} />
      <Route path="/dashboard/login" component={ResearcherLogin} />
      <Route path="/dashboard" component={ResearcherDashboard} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/checkout/cancel" component={CheckoutCancelPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Toaster />
              <Router />
            </Suspense>
          </ErrorBoundary>
        </TooltipProvider>
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
