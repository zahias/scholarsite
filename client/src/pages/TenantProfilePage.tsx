import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { ProfileThemeProvider } from "@/context/ThemeContext";
import ResearchPassport from "@/components/ResearchPassport";
import StatsOverview from "@/components/StatsOverview";
import PublicationAnalytics from "@/components/PublicationAnalytics";
import ResearchTopics from "@/components/ResearchTopics";
import Publications from "@/components/Publications";
import SEO from "@/components/SEO";
import MobileBottomNav from "@/components/MobileBottomNav";
import CollapsibleSection from "@/components/CollapsibleSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Building2, Globe, Linkedin, BarChart3, Lightbulb, FileText, ExternalLink, Download, Mail } from "lucide-react";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_COLORS = [
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

export default function TenantProfilePage() {
  const { data: profileData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
    tenant: any;
    isPreview?: boolean;
    profileSections?: Array<{ id: string; title: string; content: string; sectionType: string; isVisible: boolean; sortOrder: number }>;
  } | null>({
    queryKey: ['/api/profile'],
    retry: false,
  });

  const profile = profileData?.profile;
  const researcher = profileData?.researcher;
  const tenant = profileData?.tenant;
  const openalexId = profile?.openalexId || '';

  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : 'Research Profile';
  const seoDescription = profile?.bio || (researcher ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations` : 'Research Profile');
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
      "url": profileUrl,
      "image": profileImage,
    };
  }, [profile, researcher, profileUrl, profileImage]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff" }}>
        <Navigation researcherName="Loading..." />
        {/* Banner skeleton */}
        <div style={{ height: 260, background: "linear-gradient(135deg, #0B1F3A, #17345b)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.1), transparent 55%)" }} />
        </div>
        {/* Identity skeleton */}
        <div style={{ maxWidth: 800, margin: "-80px auto 0", padding: "0 24px", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#E4E9F7", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 28, background: "#E4E9F7", borderRadius: 8, width: 240, margin: "0 auto 10px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 18, background: "#E4E9F7", borderRadius: 6, width: 160, margin: "0 auto", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    );
  }

  if (error || !profileData || !profileData.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Profile" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Profile Not Configured</h1>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  This researcher profile hasn't been set up yet. Please log in to configure your OpenAlex ID.
                </p>
                <a href="/dashboard/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Log In to Configure
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const visibleSections = (profileData?.profileSections ?? [])
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const displayName = profile?.displayName || researcher?.display_name || 'Researcher';
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);

  const stats = [
    { label: "Publications", value: researcher?.works_count?.toLocaleString() ?? "—" },
    { label: "Citations", value: researcher?.cited_by_count?.toLocaleString() ?? "—" },
    { label: "h-index", value: researcher?.summary_stats?.h_index?.toLocaleString() ?? "—" },
    { label: "i10-index", value: researcher?.summary_stats?.i10_index?.toLocaleString() ?? "—" },
  ];

  return (
    <ProfileThemeProvider initialThemeId={profile?.selectedThemeId ?? null}>
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#F0F4F8" }} data-testid="page-tenant-profile">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={profileImage}
        url={profileUrl}
        author={displayName}
        type="profile"
        structuredData={structuredData || undefined}
      />
      <Navigation
        researcherName={displayName}
        sections={visibleSections.map((s) => ({ id: s.id, title: s.title }))}
      />

      {/* Banner */}
      <div style={{ height: 260, background: "linear-gradient(135deg, #081529 0%, #0B1F3A 50%, #142850 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
        {/* Bottom fade */}
        <div className="profile-banner-fade" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* Identity card */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginTop: -100, position: "relative", zIndex: 10, background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.18)", padding: "28px 36px 32px", textAlign: "center" }}>

          {/* Avatar */}
          <div style={{ margin: "0 auto 16px", width: 120, height: 120 }}>
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile" data-testid="img-profile-photo"
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

          {/* Name & title */}
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }} data-testid="text-display-name">
            {displayName}
          </h1>
          <p style={{ fontSize: 15, color: "#44474D", margin: "0 0 10px" }} data-testid="text-title">
            {profile?.title || 'Research Professional'}
          </p>

          {/* Affiliation chip */}
          {(profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#44474D", background: "#F0F4F8", padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(11,31,58,.08)", marginBottom: 16 }}>
              <Building2 size={13} /> <span data-testid="text-affiliation">{profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}</span>
            </span>
          )}

          {/* Social icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {profile?.orcidUrl && (
              <a href={profile.orcidUrl} target="_blank" rel="noopener noreferrer" title="ORCID"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <SiOrcid size={15} />
              </a>
            )}
            {profile?.googleScholarUrl && (
              <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer" title="Google Scholar"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <SiGooglescholar size={15} />
              </a>
            )}
            {profile?.researchGateUrl && (
              <a href={profile.researchGateUrl} target="_blank" rel="noopener noreferrer" title="ResearchGate"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <SiResearchgate size={15} />
              </a>
            )}
            {profile?.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <Linkedin size={15} />
              </a>
            )}
            {profile?.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" title="Website"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <Globe size={15} />
              </a>
            )}
            {profile?.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" title="X (Twitter)"
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none" }}>
                <FaXTwitter size={15} />
              </a>
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
            {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' && (
              <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" data-testid="link-cv"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
                <Download size={14} /> Download CV
              </a>
            )}
            {openalexId && (
              <a href={`https://openalex.org/authors/${openalexId}`} target="_blank" rel="noopener noreferrer" data-testid="link-openalex"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
                <ExternalLink size={14} /> OpenAlex ↗
              </a>
            )}
            {tenant?.plan === 'professional' && (
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#6F5400", background: "#FFC72E", cursor: "pointer", fontFamily: "inherit" }}>
                Research Passport
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(11,31,58,.08)", padding: "24px 32px", marginTop: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "#75777E", fontWeight: 600, marginBottom: 10 }}>About</div>
            <p style={{ fontSize: 15.5, color: "#171C1F", lineHeight: 1.65, margin: 0 }} data-testid="text-bio">{profile.bio}</p>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }} className="stats-grid">
          <style>{`@media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(11,31,58,.08)", padding: "18px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px,3vw,32px)", fontWeight: 600, color: "#0B1F3A", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: "#75777E", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section components (unchanged) */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 40px" }}>
        <StatsOverview openalexId={openalexId} />

        <CollapsibleSection
          id="analytics" title="Publication Analytics"
          icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
          defaultOpen={true} mobileDefaultOpen={false} className="bg-background">
          <PublicationAnalytics openalexId={openalexId} researcherData={profileData} inline />
        </CollapsibleSection>

        <CollapsibleSection
          id="research" title="Research Areas"
          icon={<Lightbulb className="w-5 h-5 md:w-6 md:h-6" />}
          defaultOpen={true} mobileDefaultOpen={false} className="bg-muted"
          badge={profileData?.topics?.length ? <Badge variant="secondary" className="ml-2">{profileData.topics.length}</Badge> : null}>
          <ResearchTopics openalexId={openalexId} inline />
        </CollapsibleSection>

        <CollapsibleSection
          id="publications" title="Publications"
          icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
          defaultOpen={true} mobileDefaultOpen={false} className="bg-background"
          badge={researcher?.works_count ? <Badge variant="secondary" className="ml-2">{researcher.works_count}</Badge> : null}>
          <Publications openalexId={openalexId} inline />
        </CollapsibleSection>

        {visibleSections.map((section) => (
          <CollapsibleSection
            key={section.id} id={section.id} title={section.title}
            icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
            defaultOpen={true} mobileDefaultOpen={false} className="bg-muted">
            <div className="px-6 pb-6 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {section.content}
            </div>
          </CollapsibleSection>
        ))}

        {tenant?.plan === 'professional' && openalexId && (
          <ResearchPassport
            openalexId={openalexId}
            name={displayName}
            title={profile?.title}
            institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
            publicationCount={researcher?.works_count || 0}
            citationCount={researcher?.cited_by_count || 0}
            profileUrl={typeof window !== 'undefined' ? window.location.href : ''}
          />
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#0B1F3A", padding: "28px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} {tenant?.name || 'Scholar.name'}. Powered by Scholar.name.
          </p>
          {profileData?.lastSynced && (
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, margin: 0 }}>
              Last synced: {new Date(profileData.lastSynced).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </footer>

      <MobileBottomNav />
    </div>
    </ProfileThemeProvider>
  );
}
