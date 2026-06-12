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
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BarChart3, FileText, Lock, User, UserX } from "lucide-react";
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

function PreviewInsightsTeaser() {
  return (
    <div className="space-y-4" data-testid="preview-locked-teaser">
      <div className="public-subtle-card" style={{ padding: 24, borderStyle: "dashed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,199,46,.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Lock size={16} style={{ color: "#6F5400" }} />
          </span>
          <div>
            <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#0B1F3A", margin: 0 }}>
              Full research profile locked
            </h3>
            <p style={{ fontSize: 13.5, color: "#75777E", margin: "2px 0 0" }}>
              Claiming unlocks complete insights, all publications, export tools, links, themes, and sharing assets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {["Research journey", "Topic map", "Collaborator network"].map((label) => (
          <div key={label} className="public-card" style={{ padding: 18, minHeight: 108, position: "relative", overflow: "hidden" }}>
            <BarChart3 size={18} style={{ color: "#FFC72E", marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "#0B1F3A", margin: 0, fontSize: 14 }}>{label}</p>
            <p style={{ color: "#75777E", margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5 }}>
              Preview available after claiming.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPublicationsTeaser({ publications = [] }: { publications?: any[] }) {
  const samplePublications = publications.slice(0, 3);

  if (samplePublications.length === 0) {
    return (
      <div className="public-subtle-card" style={{ padding: 24, borderStyle: "dashed" }}>
        <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#0B1F3A", margin: "0 0 8px" }}>
          Publication list locked
        </h3>
        <p style={{ color: "#75777E", margin: 0, fontSize: 13.5 }}>
          Full publication search, filters, links, and export tools unlock after claiming.
        </p>
      </div>
    );
  }

  return (
    <div className="public-card" style={{ padding: 24 }} data-testid="preview-publication-teaser">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: "#0B1F3A", margin: 0 }}>
            Publication sample
          </h3>
          <p style={{ color: "#75777E", margin: "4px 0 0", fontSize: 13.5 }}>
            A small sample is shown. Full search, filters, links, and exports unlock after claiming.
          </p>
        </div>
        <span style={{ fontSize: 12, color: "#6F5400", background: "rgba(255,199,46,.14)", border: "1px solid rgba(255,199,46,.28)", borderRadius: 999, padding: "5px 10px", fontWeight: 700 }}>
          Teaser
        </span>
      </div>
      <div className="space-y-3">
        {samplePublications.map((publication, index) => (
          <div key={publication.id || index} style={{ border: "1px solid rgba(11,31,58,.08)", borderRadius: 12, padding: 16, background: "#fff" }}>
            <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", lineHeight: 1.35 }}>
              {publication.title}
            </h4>
            <p style={{ color: "#75777E", margin: "0 0 10px", fontSize: 13, lineHeight: 1.45 }}>
              {[publication.journal, publication.publicationYear].filter(Boolean).join(" · ")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(publication.topics || []).slice(0, 2).map((topic: string) => (
                <span key={topic} style={{ background: "rgba(11,31,58,.06)", color: "#44474D", borderRadius: 999, padding: "3px 8px", fontSize: 11.5 }}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearcherProfileContent() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { themeConfig } = useProfileTheme();
  const { isConnected } = useRealtimeUpdates();

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
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#F0F4F8", ...getThemeStyles(themeConfig) }} data-testid="page-researcher-profile">
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
        isPreview={isPreview}
        affiliation={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
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
        actionsSlot={!isPreview ? (
          <ResearchPassport
            openalexId={openalexId}
            name={displayName}
            title={profile?.title}
            institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
            publicationCount={researcher?.works_count || 0}
            citationCount={researcher?.cited_by_count || 0}
            profileUrl={typeof window !== "undefined" ? window.location.href : ""}
          />
        ) : undefined}
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
        {isPreview ? (
          <PreviewInsightsTeaser />
        ) : (
          <ResearchInsights
            openalexId={openalexId}
            researcherData={researcherData}
            researcherName={displayName}
          />
        )}

        <CollapsibleSection
          id="publications" title="Publications"
          icon={<FileText size={18} />}
          defaultOpen={true} mobileDefaultOpen={false}>
          {isPreview ? (
            <PreviewPublicationsTeaser publications={researcherData.publications} />
          ) : (
            <Publications openalexId={openalexId} inline />
          )}
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
            {!isPreview && <ReportIssue openalexId={openalexId} researcherName={displayName} />}
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
        <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-primary shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile">
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

      {!isPreview && <MobileBottomNav />}
      {!isPreview && <ThemeSwitcher />}
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
