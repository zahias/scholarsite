import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import StatsOverview from "./StatsOverview";
import PublicationAnalytics from "./PublicationAnalytics";
import ResearchNetwork from "./ResearchNetwork";
import ResearchTopics from "./ResearchTopics";
import Publications from "./Publications";
import ProfileSections from "./ProfileSections";
import SEO from "./SEO";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import ResearchPassport from "./ResearchPassport";
import CollapsibleSection from "./CollapsibleSection";
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, MapPin, Building2, Mail, Globe, Linkedin, BarChart3, Lightbulb, FileText, User, ExternalLink, Download } from "lucide-react";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function ResearcherProfileContent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  // Get theme context for dynamic styling
  const { themeConfig } = useProfileTheme();
  
  // Enable real-time updates for this researcher profile
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
        {/* Premium Loading State with Profile Preview Structure */}
        <section className="hero-banner min-h-[85vh] flex items-center relative">
          <div className="hero-pattern"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
              {/* Avatar Skeleton */}
              <div className="lg:col-span-4 flex justify-center lg:justify-start mb-12 lg:mb-0">
                <div className="profile-image-container">
                  <div className="profile-image-glow"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                    <div className="w-44 h-44 lg:w-56 lg:h-56 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/60 animate-pulse">
                      <div className="w-20 h-20 rounded-full bg-white/20"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div className="lg:col-span-8 text-center lg:text-left text-white space-y-8">
                <div className="space-y-6">
                  <div>
                    {/* Name skeleton */}
                    <div className="h-16 lg:h-20 bg-white/20 rounded-lg mb-4 animate-pulse w-3/4 mx-auto lg:mx-0"></div>
                    {/* Title skeleton */}
                    <div className="h-8 bg-white/15 rounded-lg mb-4 animate-pulse w-1/2 mx-auto lg:mx-0"></div>
                    {/* Affiliation skeleton */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                      <div className="h-6 bg-white/10 rounded-lg animate-pulse w-48"></div>
                      <div className="h-6 bg-white/10 rounded-lg animate-pulse w-24"></div>
                    </div>
                  </div>
                </div>
                
                {/* Bio skeleton */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="space-y-3">
                    <div className="h-4 bg-white/15 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-white/15 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-white/15 rounded animate-pulse w-4/6"></div>
                  </div>
                </div>
                
                {/* Action buttons skeleton */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                  <div className="h-14 bg-white/15 rounded-xl animate-pulse w-44"></div>
                  <div className="h-14 bg-white/20 rounded-xl animate-pulse w-48"></div>
                  <div className="h-14 bg-white/10 rounded-xl animate-pulse w-40"></div>
                </div>
                
                {/* Loading indicator */}
                <div className="flex items-center justify-center lg:justify-start gap-3 pt-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-white/70 text-sm font-medium">Building your portfolio preview...</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-accent/5"></div>
          <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-accent/8 to-primary/5"></div>
        </section>
        
        {/* Stats Section Skeleton */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow-sm border animate-pulse">
                  <div className="h-10 bg-muted rounded mb-2 w-16"></div>
                  <div className="h-4 bg-muted/60 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
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
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="page-researcher-profile" style={getThemeStyles(themeConfig)}>
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
      
      {/* Compact Hero Section */}
      <section id="overview" className="hero-banner-compact py-6 md:py-10 relative">
        <div className="hero-pattern"></div>
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm px-3 py-2 min-h-[44px]"
            data-testid="button-back-to-home"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-10 md:pt-0">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-white">
            {/* Profile Image - Compact */}
            <div className="flex-shrink-0">
              {profile?.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt="Professional portrait" 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-3 border-white/30 shadow-xl"
                  data-testid="img-profile-photo"
                />
              ) : (
                <div 
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-3 border-white/30 shadow-xl flex items-center justify-center bg-gradient-to-br ${getAvatarColor(profile?.displayName || researcher?.display_name || '')}`}
                  data-testid="img-profile-photo"
                >
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {getInitials(profile?.displayName || researcher?.display_name || '')}
                  </span>
                </div>
              )}
            </div>
            
            {/* Name & Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1" data-testid="text-display-name">
                  {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90" data-testid="text-title">
                  {researcherData?.isPreview && !profile?.title 
                    ? <span className="italic opacity-70">Position</span>
                    : (profile?.title || 'Research Professional')}
                </p>
              </div>
              
              {/* Affiliation */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px] md:max-w-none" data-testid="text-affiliation">
                    {researcherData?.isPreview && !profile?.currentAffiliation
                      ? <span className="italic opacity-70">Institution</span>
                      : (profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || 'Institution')}
                  </span>
                </span>
                {(profile?.countryCode || researcher?.last_known_institutions?.[0]?.country_code) && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile?.countryCode || researcher?.last_known_institutions?.[0]?.country_code}</span>
                  </span>
                )}
              </div>
              
              {/* Social Links - Icon buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {profile?.orcidUrl && (
                  <a href={profile.orcidUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="ORCID">
                    <SiOrcid className="w-4 h-4" />
                  </a>
                )}
                {profile?.googleScholarUrl && (
                  <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Google Scholar">
                    <SiGooglescholar className="w-4 h-4" />
                  </a>
                )}
                {profile?.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile?.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Twitter/X">
                    <FaXTwitter className="w-4 h-4" />
                  </a>
                )}
                {profile?.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Website">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {profile?.contactEmail && (
                  <a href={`mailto:${profile.contactEmail}`} 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Email">
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview - Always visible */}
      <StatsOverview openalexId={openalexId} />
      
      {/* About Section - Collapsible */}
      {(profile?.bio || profile?.cvUrl || openalexId) && (
        <section className="py-6 md:py-10 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CollapsibleSection
              id="about"
              title="About"
              icon={<User className="w-5 h-5 md:w-6 md:h-6" />}
              defaultOpen={true}
              mobileDefaultOpen={true}
            >
              <div className="space-y-4">
                {profile?.bio && (
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed" data-testid="text-bio">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {profile?.cvUrl && (
                    <a 
                      href={profile.cvUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      data-testid="link-cv"
                    >
                      <Download className="w-4 h-4" />
                      Download CV
                    </a>
                  )}
                  {openalexId && (
                    <a 
                      href={`https://openalex.org/authors/${openalexId}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      data-testid="link-openalex"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on OpenAlex
                    </a>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </section>
      )}
      
      {/* Custom Profile Sections */}
      {researcherData?.profileSections && researcherData.profileSections.length > 0 && (
        <ProfileSections sections={researcherData.profileSections} />
      )}

      {/* Analytics - Collapsible */}
      <CollapsibleSection
        id="analytics"
        title="Publication Analytics"
        icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-background"
      >
        <PublicationAnalytics openalexId={openalexId} researcherData={researcherData} inline />
      </CollapsibleSection>

      {/* Research Topics - Collapsible */}
      <CollapsibleSection
        id="research"
        title="Research Areas"
        icon={<Lightbulb className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-muted"
        badge={
          researcherData?.topics?.length ? (
            <Badge variant="secondary" className="ml-2">
              {researcherData.topics.length}
            </Badge>
          ) : null
        }
      >
        <ResearchTopics openalexId={openalexId} inline />
      </CollapsibleSection>

      {/* Publications - Collapsible */}
      <CollapsibleSection
        id="publications"
        title="Publications"
        icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-background"
        badge={
          researcher?.works_count ? (
            <Badge variant="secondary" className="ml-2">
              {researcher.works_count}
            </Badge>
          ) : null
        }
      >
        <Publications openalexId={openalexId} inline />
      </CollapsibleSection>

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

      {/* Sticky Claim Profile CTA Banner - Preview Mode Only */}
      {researcherData?.isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <p className="text-white text-sm md:text-base font-medium">
                  This is a preview. Claim your profile at <span className="font-semibold">{(profile?.displayName || researcher?.display_name || 'yourname').toLowerCase().replace(/\s+/g, '')}.scholar.name</span>
                </p>
              </div>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-claim-profile"
              >
                Claim This Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA for Preview Mode */}
      {researcherData?.isPreview && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-white text-sm font-medium">
                Preview Mode - Claim your profile today!
              </p>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                data-testid="button-claim-profile-mobile"
              >
                Claim This Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Theme Switcher - Floating button for theme preview */}
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
