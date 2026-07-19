import ProfilePageShell from "./ProfilePageShell";
import ResearchPassport from "./ResearchPassport";
import CollapsibleSection from "./CollapsibleSection";
import ProfileSections from "./ProfileSections";
import ResearchInsights from "./ResearchInsights";
import Publications from "./Publications";
import ShareButtons from "./ShareButtons";
import ReportIssue from "./ReportIssue";
import MobileBottomNav from "./MobileBottomNav";
import { User, FileText, Home, BarChart3, BookOpen } from "lucide-react";

// Single nav-items list shared by every page that renders this component —
// keeps mobile nav identical everywhere instead of drifting per page.
export const researcherMobileNavItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "about", label: "About", icon: User },
  { id: "publications", label: "Publications", icon: BookOpen },
];

interface ResearcherProfileContentProps {
  // The full query-result object as returned by /api/profile or
  // /api/researcher/:id/data — passed through as-is to ResearchInsights/
  // CareerTimeline, which already expect this exact shape.
  data: {
    profile: any;
    researcher: any;
    topics?: any[];
    publications?: any[];
    affiliations?: any[];
    profileSections?: any[];
    lastSynced?: string | null;
  };
  displayName: string;
  openalexId: string;
  isPreview?: boolean;
  // Caller computes the plan-gating rule (e.g. tenant?.plan === "professional");
  // this component only renders based on the flag.
  showResearchPassport: boolean;
  footerBrandName?: string;
  // Tenant subdomains show "Powered by Scholar.name" under their own brand
  // name; the generic /researcher/:id page (which IS Scholar.name) doesn't.
  showPoweredBy?: boolean;
  // Real primary domain hostname for a claimed tenant; omitted on the
  // unclaimed-profile preview, where ProfilePageShell falls back to a
  // name-derived guess.
  profileHostname?: string | null;
}

// This is the ONE design for a public researcher profile — rendered by both
// the generic /researcher/:id page and every tenant's live subdomain. Data
// fetching, loading/error states, SEO, and claim/inactive banners stay
// page-specific (those genuinely differ); everything else lives here so a
// future design change applies everywhere at once, with each tenant's own
// custom Profile Sections remaining the only per-tenant variation.
export default function ResearcherProfileContent({
  data,
  displayName,
  openalexId,
  isPreview = false,
  showResearchPassport,
  footerBrandName = "Scholar.name",
  showPoweredBy = false,
  profileHostname,
}: ResearcherProfileContentProps) {
  const profile = data.profile;
  const researcher = data.researcher;

  return (
    <>
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
        profileHostname={profileHostname}
        worksCount={researcher?.works_count}
        citedByCount={researcher?.cited_by_count}
        hIndex={researcher?.summary_stats?.h_index}
        i10Index={researcher?.summary_stats?.i10_index}
        topics={data.topics}
        actionsSlot={
          showResearchPassport ? (
            <ResearchPassport
              openalexId={openalexId}
              name={displayName}
              title={profile?.title}
              institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
              publicationCount={researcher?.works_count || 0}
              citationCount={researcher?.cited_by_count || 0}
              profileUrl={typeof window !== "undefined" ? window.location.href : ""}
              profileImageUrl={profile?.profileImageUrl}
            />
          ) : undefined
        }
      />

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

      {data.profileSections && data.profileSections.length > 0 && (
        <div className="profile-wide-container">
          <ProfileSections sections={data.profileSections} />
        </div>
      )}

      <div className="profile-wide-container">
        <ResearchInsights
          openalexId={openalexId}
          researcherData={data}
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
      <footer style={{ background: "#0B1F3A", padding: "24px 32px", marginTop: 16 }}>
        <div className="profile-wide-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: 0 }}>
              © {new Date().getFullYear()} {footerBrandName}. {showPoweredBy ? "Powered by Scholar.name." : "All rights reserved."}
            </p>
            {data.lastSynced && (
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, margin: 0 }}>
                Last sync: {new Date(data.lastSynced).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <ShareButtons
              url={typeof window !== "undefined" ? window.location.href : ""}
              title={displayName}
              description={profile?.bio || `${displayName}'s research profile`}
              openalexId={openalexId}
            />
            <ReportIssue openalexId={openalexId} researcherName={displayName} />
          </div>
        </div>
      </footer>

      <MobileBottomNav items={researcherMobileNavItems} />
    </>
  );
}
