import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AnalyticsProvider } from "@/lib/analytics";
import ChatWidget from "@/components/ChatWidget";

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
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const BlogIndex = lazy(() => import("@/pages/BlogIndex"));
const BlogGoogleScholarVs = lazy(() => import("@/pages/blog/GoogleScholarVsScholarName"));
const BlogHIndex = lazy(() => import("@/pages/blog/WhatIsHIndex"));
const BlogAcademicPortfolio = lazy(() => import("@/pages/blog/HowToCreateAcademicPortfolio"));
const BlogWebsiteBuilders = lazy(() => import("@/pages/blog/BestWebsiteBuildersResearchers"));
const BlogCvVsPortfolio = lazy(() => import("@/pages/blog/AcademicCvVsResearchPortfolio"));

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
  const { data: siteContext, isLoading, error } = useQuery<SiteContext>({
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

  const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isMarketingHostname = ["localhost", "127.0.0.1", "scholar.name", "www.scholar.name", "scholarname.com", "www.scholarname.com"].includes(hostname)
    || hostname.endsWith(".replit.dev")
    || hostname.endsWith(".replit.app")
    || hostname.endsWith(".repl.co");

  if (error && !isMarketingHostname) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Profile temporarily unavailable</h1>
          <p className="text-muted-foreground mb-6">This custom Scholar.name profile cannot reach its account data right now. Please try again shortly.</p>
          <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md" onClick={() => window.location.reload()}>Try again</button>
        </div>
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
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
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
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/google-scholar-vs-scholar-name" component={BlogGoogleScholarVs} />
      <Route path="/blog/what-is-h-index" component={BlogHIndex} />
      <Route path="/blog/how-to-create-academic-portfolio" component={BlogAcademicPortfolio} />
      <Route path="/blog/best-website-builders-researchers" component={BlogWebsiteBuilders} />
      <Route path="/blog/academic-cv-vs-research-portfolio" component={BlogCvVsPortfolio} />
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

function RouteScopedChatWidget() {
  const [location] = useLocation();
  const hiddenPrefixes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/dashboard/login",
    "/admin/login",
    "/checkout",
    "/contact",
    "/researcher",
  ];

  if (hiddenPrefixes.some((prefix) => location === prefix || location.startsWith(`${prefix}/`))) {
    return null;
  }

  return <ChatWidget />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Toaster />
              <RouteScopedChatWidget />
              <Router />
            </Suspense>
          </ErrorBoundary>
        </TooltipProvider>
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
