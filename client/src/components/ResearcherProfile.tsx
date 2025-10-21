import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import StatsOverview from "./StatsOverview";
import PublicationAnalytics from "./PublicationAnalytics";
import ResearchTopics from "./ResearchTopics";
import Publications from "./Publications";
import SEO from "./SEO";
import MobileBottomNav from "./MobileBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile } from "@shared/schema";
import { useMemo } from "react";

export default function ResearcherProfile() {
  const { id } = useParams();
  
  // Enable real-time updates for this researcher profile
  const { isConnected } = useRealtimeUpdates();
  
  const { data: researcherData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
  } | null>({
    queryKey: [`/api/researcher/${id}/data`],
    retry: false,
  });

  // SEO data - must be before conditional returns to satisfy Rules of Hooks
  const profile = researcherData?.profile;
  const researcher = researcherData?.researcher;
  const openalexId = profile?.openalexId || id || '';
  
  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : 'Research Profile';
  const seoDescription = profile?.bio || (researcher ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations, h-index: ${researcher?.summary_stats?.h_index || 0}` : 'Research Profile Platform');
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const profileImage = profile?.profileImageUrl || "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500";

  // Schema.org structured data for Google Scholar
  const structuredData = useMemo(() => {
    if (!profile) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.displayName || researcher?.display_name,
      "description": profile.bio || `Researcher with ${researcher?.works_count || 0} publications`,
      "jobTitle": profile.title,
      "affiliation": profile.currentAffiliation ? {
        "@type": "Organization",
        "name": profile.currentAffiliation
      } : undefined,
      "url": profileUrl,
      "image": profileImage,
      "email": profile.contactEmail || undefined,
      "alumniOf": researcherData?.affiliations?.map((aff: any) => ({
        "@type": "Organization",
        "name": aff.institutionName
      })),
      "knowsAbout": researcherData?.topics?.slice(0, 10).map((topic: any) => topic.displayName),
      "sameAs": [
        `https://openalex.org/authors/${openalexId}`,
        profile.cvUrl,
      ].filter(Boolean)
    };
  }, [profile, researcher, researcherData, profileUrl, profileImage, openalexId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <Skeleton className="h-4 w-96 mx-auto mb-8" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If no profile exists, show message
  if (error || !researcherData || !researcherData.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Researcher Profile" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">No Profile Available</h1>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  The researcher profile you're looking for doesn't exist or isn't public yet.
                </p>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="page-researcher-profile">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        image={profileImage}
        url={profileUrl}
        author={profile?.displayName || researcher?.display_name || 'Researcher'}
        type="profile"
        structuredData={structuredData || undefined}
      />
      <Navigation researcherName={profile?.displayName || researcher?.display_name || 'Researcher'} />
      
      {/* Enhanced Hero Section */}
      <section id="overview" className="hero-banner min-h-[85vh] flex items-center">
        {/* Enhanced Background pattern overlay */}
        <div className="hero-pattern"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Profile Image Section */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start mb-12 lg:mb-0">
              <div className="profile-image-container">
                <div className="profile-image-glow"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                  <img 
                    src={profile?.profileImageUrl || "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500"} 
                    alt="Professional portrait" 
                    className="w-44 h-44 lg:w-56 lg:h-56 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                    data-testid="img-profile-photo"
                  />
                  <div className="profile-badge absolute -bottom-3 -right-3 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="lg:col-span-8 text-center lg:text-left text-white space-y-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent" data-testid="text-display-name">
                    {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
                  </h1>
                  <p className="text-2xl sm:text-3xl mb-6 text-white/90 font-light tracking-wide" data-testid="text-title">
                    {profile?.title || 'Research Professional'}
                  </p>
                </div>
              </div>
              
              {profile?.bio && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-light" data-testid="text-bio">
                    {profile.bio}
                  </p>
                </div>
              )}
              
              {/* Enhanced Action Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                <a 
                  href={`https://openalex.org/authors/${openalexId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button group bg-white/15 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/25 transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 font-medium"
                  data-testid="link-openalex"
                >
                  <svg className="w-5 h-5 mr-3 inline group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  View on OpenAlex
                </a>
                {profile?.cvUrl && (
                  <a 
                    href={profile.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button group bg-white text-primary px-8 py-4 rounded-xl hover:bg-white/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    data-testid="link-cv"
                  >
                    <svg className="w-5 h-5 mr-3 inline text-red-600 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Download CV/Resume
                  </a>
                )}
                {profile?.email && (
                  <a 
                    href={`mailto:${profile.email}`}
                    className="action-button group bg-gradient-to-r from-accent/20 to-accent/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:from-accent/30 hover:to-accent/20 transition-all duration-300 border border-accent/20 hover:border-accent/40 font-medium"
                    data-testid="link-contact"
                  >
                    <svg className="w-5 h-5 mr-3 inline group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Get In Touch
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Decorative Elements */}
        <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-accent/5"></div>
        <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-accent/8 to-primary/5"></div>
        <div className="hero-decorative top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-primary/6 to-white/4"></div>
      </section>

      <StatsOverview openalexId={openalexId} />
      <PublicationAnalytics openalexId={openalexId} researcherData={researcherData} />
      <ResearchTopics openalexId={openalexId} />
      <Publications openalexId={openalexId} />

      {/* Footer */}
      <footer className="bg-gradient-to-br from-card to-muted/20 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} ResearchHub. All rights reserved.
            </p>
            {researcherData?.lastSynced && (
              <p className="text-xs text-muted-foreground/60">
                Last data sync: {new Date(researcherData.lastSynced).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
