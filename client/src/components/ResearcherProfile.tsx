import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import StatsOverview from "./StatsOverview";
import PublicationAnalytics from "./PublicationAnalytics";
import CareerTimeline from "./CareerTimeline";
import ResearchTopics from "./ResearchTopics";
import Publications from "./Publications";
import ProfileSections from "./ProfileSections";
import ResearchInsights from "./ResearchInsights";
import SEO from "./SEO";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import ResearchPassport from "./ResearchPassport";
import CollapsibleSection from "./CollapsibleSection";
import ShareButtons from "./ShareButtons";
import ReportIssue from "./ReportIssue";
import ProfilePageShell from "./ProfilePageShell";
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BarChart3, BookOpen, FileText, Home, Lock, User, UserX } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const researcherMobileNavItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "about", label: "About", icon: User },
  { id: "publications", label: "Publications", icon: BookOpen },
];

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

function ResearcherProfileContent() {
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

  const handleTrackedClick = useCallback((target: string, url?: string) => {
    if (openalexIdForTracking && !researcherData?.isPreview) {
      trackProfileEvent(openalexIdForTracking, "click", target);
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer");
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
    const isInactiveProfile = errorMessage.includes("trial_expired") || errorMessage.includes("subscription_expired") || errorMessage.startsWith("402:");
    return (
      <div className="min-h-screen" style={{ background: "var(--surface-container-low)" }}>
        <Navigation researcherName="Researcher Profile" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <EmptyState
            icon={isInactiveProfile ? Lock : UserX}
            title={isInactiveProfile ? "Profile inactive" : "No profile available"}
            description={isInactiveProfile
              ? "This public portfolio is inactive because its trial or paid period has ended."
              : "This researcher profile does not exist or has not been made public yet."
            }
            headingLevel="h1"
            action={{
              label: isInactiveProfile ? "View plans" : "Back to Scholar.name",
              onClick: () => navigate(isInactiveProfile ? "/pricing" : "/"),
            }}
          />
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || researcher?.display_name || "Researcher";
  const isPreview = !!researcherData?.isPreview;

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

      {/* ── Shared shell: banner + identity card + stats ── */}
      <ProfilePageShell
        displayName={displayName}
        title={profile?.title}
        currentPosition={profile?.currentPosition}
        isPreview={isPreview}
        affiliation={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
        affiliationUrl={profile?.currentAffiliationUrl}
        bio={profile?.bio}
        profileImageUrl={profile?.profileImageUrl}
        orcidUrl={profile?.orcidUrl}
        googleScholarUrl={profile?.googleScholarUrl}
        researchGateUrl={profile?.researchGateUrl}
        linkedinUrl={profile?.linkedinUrl}
        websiteUrl={profile?.websiteUrl}
        twitterUrl={profile?.twitterUrl}
        contactEmail={profile?.contactEmail || profile?.email}
        cvUrl={profile?.cvUrl}
        openalexId={openalexId}
        worksCount={researcher?.works_count}
        citedByCount={researcher?.cited_by_count}
        hIndex={researcher?.summary_stats?.h_index}
        i10Index={researcher?.summary_stats?.i10_index}
        topics={researcherData?.topics}
        actionsSlot={(
          <ResearchPassport
            openalexId={openalexId}
            name={displayName}
            title={profile?.title}
            institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
            publicationCount={researcher?.works_count || 0}
            citationCount={researcher?.cited_by_count || 0}
            profileUrl={typeof window !== "undefined" ? window.location.href : ""}
          />
        )}
      />

      {/* ── Section components (all custom / researcher-specific) ── */}

      {(isPreview || profile?.bio) && (
        <div className="profile-wide-container">
          <CollapsibleSection id="about" title="About" icon={<User size={18} />} defaultOpen={true} mobileDefaultOpen={true}>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed" data-testid="text-bio">
              {profile?.bio ? profile.bio : (
                <span className="italic opacity-70">
                  Share your research journey, expertise, and what drives your work. Highlight your key contributions
                  and areas of specialization to help collaborators and students discover your profile.
                </span>
              )}
            </p>
          </CollapsibleSection>
        </div>
      )}

      {researcherData?.profileSections && researcherData.profileSections.length > 0 && (
        <div className="profile-wide-container">
          <ProfileSections sections={researcherData.profileSections} />
        </div>
      )}

      <div className="profile-wide-container">
        <ResearchInsights
          openalexId={openalexId}
          researcherData={researcherData}
          researcherName={displayName}
        />

        <CollapsibleSection
          id="publications" title="Publications"
          icon={<FileText size={18} />}
          defaultOpen={true} mobileDefaultOpen={false}>
          <Publications openalexId={openalexId} inline />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <footer style={{ background: "#0B1F3A", padding: "28px 32px", marginTop: 16 }}>
          <div className="profile-wide-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Scholar.name. All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {researcherData?.lastSynced && (
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, margin: 0 }}>
                Last sync: {new Date(researcherData.lastSynced).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <ReportIssue openalexId={openalexId} researcherName={displayName} />
          </div>
        </div>
      </footer>

      {/* Sticky Claim Profile CTA — desktop, preview mode only */}
      {isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <p className="text-white text-sm md:text-base font-medium">
                  <span className="hidden lg:inline">This is a preview of what your profile could look like.</span>
                  <span className="lg:hidden">Preview mode</span>
                  {" "}Create yours at <span className="font-semibold">{displayName.toLowerCase().replace(/\s+/g, "")}.scholar.name</span>
                </p>
              </div>
              <Button onClick={() => navigate("/signup")}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-claim-profile">
                Claim This Profile
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
              <p className="text-white text-sm font-medium">Like what you see? Create your own portfolio!</p>
              <Button onClick={() => navigate("/signup")}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                data-testid="button-claim-profile-mobile">
                Claim &amp; Customize
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav items={researcherMobileNavItems} />
      <ThemeSwitcher isPreview={isPreview} />
    </div>
  );
}

export default function ResearcherProfile() {
  const { id } = useParams();
  return (
    <ProfileThemeProvider initialThemeId={null}>
      <ResearcherProfileContent />
    </ProfileThemeProvider>
  );
}
