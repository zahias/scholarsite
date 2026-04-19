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
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ArrowLeft, MapPin, Building2, Mail, Globe, Linkedin, BarChart3, Lightbulb, FileText, User, UserX, ExternalLink, Download, Calendar, Share2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

// Analytics tracking helper
const trackProfileEvent = async (openalexId: string, eventType: string, eventTarget?: string) => {
  try {
    let visitorId = localStorage.getItem('scholar_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('scholar_visitor_id', visitorId);
    }
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openalexId, eventType, eventTarget, visitorId, referrer: document.referrer || null }),
    });
  } catch (error) {
    console.debug('Analytics tracking failed:', error);
  }
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_COLORS: [string, string][] = [
  ["#2563EB", "#1D4ED8"],
  ["#7C3AED", "#6D28D9"],
  ["#059669", "#047857"],
  ["#D97706", "#B45309"],
  ["#DC2626", "#B91C1C"],
  ["#0891B2", "#0E7490"],
  ["#4338CA", "#3730A3"],
  ["#0F766E", "#0D6365"],
];

function getAvatarGradient(name: string): [string, string] {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// Reusable social icon button style
const socialBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "50%",
  background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)",
  display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none",
  transition: "transform .15s, box-shadow .15s",
};

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
      trackProfileEvent(openalexIdForTracking, 'view');
    }
  }, [openalexIdForTracking, researcherData?.isPreview]);

  const handleTrackedClick = useCallback((target: string, url?: string) => {
    if (openalexIdForTracking && !researcherData?.isPreview) {
      trackProfileEvent(openalexIdForTracking, 'click', target);
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, [openalexIdForTracking, researcherData?.isPreview]);

  const profile = researcherData?.profile;
  const researcher = researcherData?.researcher;
  const openalexId = profile?.openalexId || id || '';

  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : 'Research Profile';
  const seoDescription = profile?.bio || (researcher
    ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations, h-index: ${researcher?.summary_stats?.h_index || 0}`
    : 'Research Profile Platform');
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
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
        {/* Banner skeleton */}
        <div style={{ height: 240, background: "linear-gradient(135deg, #081529, #0B1F3A, #17345b)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.1), transparent 55%)" }} />
        </div>
        {/* Identity skeleton */}
        <div style={{ maxWidth: 860, margin: "-80px auto 0", padding: "0 24px", position: "relative", zIndex: 1 }}>
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
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Researcher Profile" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <EmptyState
            icon={UserX}
            title="No Profile Available"
            description="The researcher profile you're looking for doesn't exist or isn't public yet."
          />
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || researcher?.display_name || 'Researcher';
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);

  const stats = [
    { label: "Publications", value: researcher?.works_count?.toLocaleString() ?? "—" },
    { label: "Citations",    value: researcher?.cited_by_count?.toLocaleString() ?? "—" },
    { label: "h-index",     value: researcher?.summary_stats?.h_index?.toLocaleString() ?? "—" },
    { label: "i10-index",   value: researcher?.summary_stats?.i10_index?.toLocaleString() ?? "—" },
  ];

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

      {/* ── Observatory Banner ── */}
      <div style={{ height: 240, background: "linear-gradient(135deg, #081529 0%, #0B1F3A 50%, #142850 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
        {/* bottom fade */}
        <div className="profile-banner-fade" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* ── Identity card ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <div id="overview" style={{ marginTop: -90, position: "relative", zIndex: 10, background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.18)", padding: "28px 36px 32px", textAlign: "center" }}>

          {/* Avatar */}
          <div style={{ margin: "0 auto 16px", width: 120, height: 120 }}>
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Professional portrait" data-testid="img-profile-photo"
                style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", boxShadow: "0 4px 20px rgba(11,31,58,.18)" }} />
            ) : (
              <div data-testid="img-profile-photo"
                style={{ width: 120, height: 120, borderRadius: "50%", background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})`, border: "4px solid #fff", boxShadow: "0 4px 20px rgba(11,31,58,.18)", display: "grid", placeItems: "center" }}>
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 42, color: "#fff", fontWeight: 700, lineHeight: 1 }}>
                  {getInitials(displayName)}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }} data-testid="text-display-name">
            {displayName}
          </h1>

          {/* Title */}
          <p style={{ fontSize: 15, color: "#44474D", margin: "0 0 10px" }} data-testid="text-title">
            {researcherData?.isPreview && !profile?.title
              ? <em style={{ opacity: .7 }}>Professor of [Your Field]</em>
              : (profile?.title || 'Research Professional')}
          </p>

          {/* Affiliation chip */}
          {(profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || researcherData?.isPreview) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#44474D", background: "#F0F4F8", padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(11,31,58,.08)", marginBottom: 14 }} data-testid="text-affiliation">
              <Building2 size={13} style={{ color: "#FFC72E", flexShrink: 0 }} />
              {researcherData?.isPreview && !profile?.currentAffiliation
                ? <em style={{ opacity: .7 }}>Your Institution</em>
                : (profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name)}
            </span>
          )}

          {/* Bio excerpt */}
          {profile?.bio && (
            <p style={{ fontSize: 14, color: "#44474D", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {profile.bio}
            </p>
          )}

          {/* Social icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {profile?.orcidUrl && (
              <a href={profile.orcidUrl} target="_blank" rel="noopener noreferrer" title="ORCID" style={socialBtn}><SiOrcid size={15} /></a>
            )}
            {profile?.googleScholarUrl && (
              <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer" title="Google Scholar" style={socialBtn}><SiGooglescholar size={15} /></a>
            )}
            {profile?.researchGateUrl && (
              <a href={profile.researchGateUrl} target="_blank" rel="noopener noreferrer" title="ResearchGate" style={socialBtn}><SiResearchgate size={15} /></a>
            )}
            {profile?.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={socialBtn}><Linkedin size={15} /></a>
            )}
            {profile?.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" title="Website" style={socialBtn}><Globe size={15} /></a>
            )}
            {profile?.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={socialBtn}><FaXTwitter size={15} /></a>
            )}
            {(profile?.contactEmail || profile?.email) && (
              <a href={`mailto:${profile.contactEmail || profile.email}`} data-testid="link-contact"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 999, background: "#0B1F3A", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Mail size={13} /> Contact
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {/* CV */}
            {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' ? (
              <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" data-testid="link-cv"
                onClick={() => handleTrackedClick('cv_download')}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
                <Download size={14} /> Download CV
              </a>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.08)", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#75777E", background: "#F8F9FA", opacity: .6, cursor: "not-allowed" }} title="CV available after claiming profile">
                <Download size={14} /> Download CV
              </span>
            )}
            {/* OpenAlex */}
            <a href={`https://openalex.org/authors/${openalexId}`} target="_blank" rel="noopener noreferrer"
              onClick={() => handleTrackedClick('openalex_profile')}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
              <ExternalLink size={14} style={{ color: "#FFC72E" }} /> OpenAlex ↗
            </a>
            {/* Research Passport */}
            <ResearchPassport
              openalexId={openalexId}
              name={displayName}
              title={profile?.title}
              institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
              publicationCount={researcher?.works_count || 0}
              citationCount={researcher?.cited_by_count || 0}
              profileUrl={typeof window !== 'undefined' ? window.location.href : ''}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }} className="stats-grid">
          <style>{`@media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(11,31,58,.08)", padding: "18px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 600, color: "#0B1F3A", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: "#75777E", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section components (all unchanged) ── */}
      <StatsOverview openalexId={openalexId} />

      {(researcherData?.isPreview || profile?.bio) && (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CollapsibleSection id="about" title="About" icon={<User className="w-5 h-5 md:w-6 md:h-6" />} defaultOpen={true} mobileDefaultOpen={true}>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed" data-testid="text-bio">
                  {profile?.bio ? profile.bio : (
                    <span className="italic opacity-70">
                      Share your research journey, expertise, and what drives your work. Highlight your key contributions
                      and areas of specialization to help collaborators and students discover your profile.
                    </span>
                  )}
                </p>
              </div>
            </CollapsibleSection>
          </div>
        </section>
      )}

      {researcherData?.profileSections && researcherData.profileSections.length > 0 && (
        <ProfileSections sections={researcherData.profileSections} />
      )}

      <ResearchInsights
        openalexId={openalexId}
        researcherData={researcherData}
        researcherName={displayName}
      />

      <CollapsibleSection
        id="publications" title="Publications"
        icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true} mobileDefaultOpen={false} className="bg-background">
        <Publications openalexId={openalexId} inline />
      </CollapsibleSection>

      {/* Footer */}
      <footer style={{ background: "#0B1F3A", padding: "28px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Scholar.name. All rights reserved.
          </p>
          {researcherData?.lastSynced && (
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, margin: 0 }}>
              Last sync: {new Date(researcherData.lastSynced).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </footer>

      {/* Sticky Claim Profile CTA — desktop, preview mode only */}
      {researcherData?.isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <p className="text-white text-sm md:text-base font-medium">
                  <span className="hidden lg:inline">This is a preview of what your profile could look like.</span>
                  <span className="lg:hidden">Preview mode</span>
                  {' '}Create yours at <span className="font-semibold">{(displayName).toLowerCase().replace(/\s+/g, '')}.scholar.name</span>
                </p>
              </div>
              <Button onClick={() => navigate('/signup')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-claim-profile">
                Claim This Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA — preview mode only */}
      {researcherData?.isPreview && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-primary shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-white text-sm font-medium">Like what you see? Create your own portfolio!</p>
              <Button onClick={() => navigate('/signup')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                data-testid="button-claim-profile-mobile">
                Claim &amp; Customize
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
      <ThemeSwitcher isPreview={researcherData?.isPreview} />
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
