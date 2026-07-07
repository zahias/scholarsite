import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { ProfileThemeProvider } from "@/context/ThemeContext";
import SEO from "@/components/SEO";
import ResearcherProfileContent from "@/components/ResearcherProfileContent";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

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
    claimState?: "unclaimed" | "active" | "inactive" | "orphaned" | "database_unavailable";
    profileSections?: Array<{ id: string; title: string; content: string; sectionType: string; isVisible: boolean; sortOrder: number }>;
  } | null>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const profile = profileData?.profile;
  const researcher = profileData?.researcher;
  const tenant = profileData?.tenant;
  const openalexId = profile?.openalexId || "";

  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : "Research Profile";
  const seoDescription = profile?.bio || (researcher ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations` : "Research Profile");
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
      "url": profileUrl,
      "image": profileImage,
    };
  }, [profile, researcher, profileUrl, profileImage]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
        <Navigation researcherName="Loading..." />
        <div style={{ height: 240, background: "linear-gradient(135deg, #081529, #0B1F3A, #142850)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.1), transparent 55%)" }} />
        </div>
        <div style={{ maxWidth: 860, margin: "-90px auto 0", padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", padding: "28px 36px 32px", textAlign: "center" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#E4E9F7", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 24, background: "#E4E9F7", borderRadius: 8, width: 220, margin: "0 auto 10px" }} />
            <div style={{ height: 16, background: "#F0F4F8", borderRadius: 6, width: 160, margin: "0 auto" }} />
          </div>
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

  const displayName = profile?.displayName || researcher?.display_name || "Researcher";

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

        <ResearcherProfileContent
          data={profileData}
          displayName={displayName}
          openalexId={openalexId}
          showResearchPassport={tenant?.plan === "professional" && !!openalexId}
          footerBrandName={tenant?.name || "Scholar.name"}
          showPoweredBy={true}
        />

        {profileData?.claimState === "inactive" && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground border-t border-primary/20 shadow-lg">
            <div className="profile-wide-container py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm font-medium text-center sm:text-left">This Scholar.name profile is inactive. Showing public OpenAlex data.</p>
              <a href="/dashboard/login" className="inline-flex items-center justify-center bg-white text-primary px-5 py-2 rounded-md font-semibold">Owner Sign In</a>
            </div>
          </div>
        )}
      </div>
    </ProfileThemeProvider>
  );
}
