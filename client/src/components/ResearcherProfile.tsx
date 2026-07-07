import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import SEO from "./SEO";
import ResearcherProfileContent from "./ResearcherProfileContent";
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { useMemo, useEffect } from "react";
import { Lock, UserX } from "lucide-react";
import EmptyState from "@/components/EmptyState";

// Analytics tracking helper
const trackProfileEvent = async (openalexId: string, eventType: string, eventTarget?: string) => {
  try {
    let visitorId = localStorage.getItem("scholar_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("scholar_visitor_id", visitorId);
    }
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openalexId, eventType, eventTarget, visitorId, referrer: document.referrer || null }),
    });
  } catch (error) {
    console.debug("Analytics tracking failed:", error);
  }
};

function ResearcherProfileInner() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { themeConfig } = useProfileTheme();
  const { data: researcherData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    profileSections?: any[];
    lastSynced: string;
    isPreview?: boolean;
    claimState?: "unclaimed" | "active" | "inactive" | "orphaned" | "database_unavailable";
    accessState?: string | null;
  } | null>({
    queryKey: [`/api/researcher/${id}/data`],
    retry: false,
  });

  const openalexIdForTracking = researcherData?.profile?.openalexId || id;
  useEffect(() => {
    if (openalexIdForTracking && !researcherData?.isPreview) {
      trackProfileEvent(openalexIdForTracking, "view");
    }
  }, [openalexIdForTracking, researcherData?.isPreview]);

  const profile = researcherData?.profile;
  const researcher = researcherData?.researcher;
  const openalexId = profile?.openalexId || id || "";

  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : "Research Profile";
  const seoDescription = profile?.bio || (researcher
    ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations, h-index: ${researcher?.summary_stats?.h_index || 0}`
    : "Research Profile Platform");
  const profileUrl = typeof window !== "undefined" ? window.location.href : "";
  const profileImage = profile?.profileImageUrl || "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500";

  const structuredData = useMemo(() => {
    if (!profile) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.displayName || researcher?.display_name,
      "description": profile.bio || `Researcher with ${researcher?.works_count || 0} publications`,
      "jobTitle": profile.title,
      "affiliation": profile.currentAffiliation ? { "@type": "Organization", "name": profile.currentAffiliation } : undefined,
      "url": profileUrl,
      "image": profileImage,
      "email": profile.contactEmail || undefined,
      "alumniOf": researcherData?.affiliations?.map((aff: any) => ({ "@type": "Organization", "name": aff.institutionName })),
      "knowsAbout": researcherData?.topics?.slice(0, 10).map((topic: any) => topic.displayName),
      "sameAs": [`https://openalex.org/authors/${openalexId}`, profile.cvUrl].filter(Boolean),
    };
  }, [profile, researcher, researcherData, profileUrl, profileImage, openalexId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
        <Navigation researcherName="Loading..." />
        <div style={{ height: 240, background: "linear-gradient(135deg, #081529, #0B1F3A, #142850)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.1), transparent 55%)" }} />
        </div>
        <div className="profile-wide-container" style={{ marginTop: -90, position: "relative", zIndex: 1 }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.14)", padding: "28px 36px 32px", textAlign: "center" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#E4E9F7", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 24, background: "#E4E9F7", borderRadius: 8, width: 220, margin: "0 auto 10px" }} />
            <div style={{ height: 16, background: "#F0F4F8", borderRadius: 6, width: 160, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 64, background: "#F0F4F8", borderRadius: 12, maxWidth: 120 }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / no profile ─────────────────────────────────────────────────────
  if (error || !researcherData || !researcherData.profile) {
    const errorMessage = error instanceof Error ? error.message : "";
    const isNotFound = errorMessage.startsWith("404:");
    const isUnavailable = errorMessage.startsWith("500:") || errorMessage.startsWith("503:");
    return (
      <div className="min-h-screen" style={{ background: "var(--surface-container-low)" }}>
        <Navigation researcherName="Researcher Profile" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <EmptyState
            icon={isUnavailable ? Lock : UserX}
            title={isUnavailable ? "Profile temporarily unavailable" : isNotFound ? "Researcher not found" : "Unable to load profile"}
            description={isUnavailable
              ? "Scholar.name and the source record could not be reached. Please try again shortly."
              : isNotFound
                ? "No matching researcher record was found in OpenAlex."
                : "The profile could not be loaded. Please try again."
            }
            headingLevel="h1"
            action={{
              label: isUnavailable ? "Try again" : "Back to Scholar.name",
              onClick: () => isUnavailable ? window.location.reload() : navigate("/"),
            }}
          />
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || researcher?.display_name || "Researcher";
  const isPreview = !!researcherData?.isPreview;
  const claimState = researcherData?.claimState || (isPreview ? "unclaimed" : "active");
  const previewBanner = claimState === "inactive"
    ? {
        desktop: "This Scholar.name profile is inactive. OpenAlex data remains available.",
        mobile: "Inactive profile — showing OpenAlex data.",
        action: "Owner Sign In",
        onClick: () => navigate("/dashboard/login"),
      }
    : claimState === "orphaned"
      ? {
          desktop: "This legacy profile needs owner verification. OpenAlex data remains available.",
          mobile: "Legacy profile needs verification.",
          action: "Contact Support",
          onClick: () => navigate("/contact"),
        }
      : claimState === "database_unavailable"
        ? {
            desktop: "Scholar.name customizations are temporarily unavailable. Showing OpenAlex data.",
            mobile: "Showing OpenAlex data while customizations recover.",
            action: "Try Again",
            onClick: () => window.location.reload(),
          }
        : {
            desktop: `This is a preview of what your profile could look like. Create yours at ${displayName.toLowerCase().replace(/\s+/g, "")}.scholar.name`,
            mobile: "Like what you see? Create your own portfolio!",
            action: "Claim This Profile",
            onClick: () => navigate("/signup"),
          };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${isPreview ? "pb-44 md:pb-16" : "pb-20 md:pb-0"}`} style={{ background: "#F0F4F8", ...getThemeStyles(themeConfig) }} data-testid="page-researcher-profile">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={profileImage}
        url={profileUrl}
        author={displayName}
        type="profile"
        structuredData={structuredData || undefined}
      />
      <Navigation researcherName={displayName} />

      <ResearcherProfileContent
        data={researcherData}
        displayName={displayName}
        openalexId={openalexId}
        isPreview={isPreview}
        showResearchPassport={true}
      />

      {/* Sticky Claim Profile CTA — desktop, preview mode only */}
      {isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <p className="text-white text-sm md:text-base font-medium">
                  <span className="hidden lg:inline">{previewBanner.desktop}</span>
                  <span className="lg:hidden">{previewBanner.mobile}</span>
                </p>
              </div>
              <Button onClick={previewBanner.onClick}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-claim-profile">
                {previewBanner.action}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA — preview mode only */}
      {isPreview && (
        <div className="fixed bottom-[84px] left-0 right-0 z-40 bg-primary shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-white text-sm font-medium">{previewBanner.mobile}</p>
              <Button onClick={previewBanner.onClick}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                data-testid="button-claim-profile-mobile">
                {previewBanner.action}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResearcherProfile() {
  return (
    <ProfileThemeProvider initialThemeId={null}>
      <ResearcherProfileInner />
    </ProfileThemeProvider>
  );
}
